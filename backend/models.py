from flask_sqlalchemy import SQLAlchemy
from datetime import datetime, timedelta
import uuid
import os
from flask import Flask
from dotenv import load_dotenv

load_dotenv()

db = SQLAlchemy()


class User(db.Model):
    __tablename__ = 'users'
    id = db.Column(db.UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    username = db.Column(db.String(120), nullable=False)
    password_hash = db.Column(db.Text, nullable=True, default='')
    email = db.Column(db.String(120), nullable=False)
    google_openid = db.Column(db.String(50), unique=True, nullable=True)
    microsoft_openid = db.Column(db.String(50), unique=True, nullable=True)

    # Relationships
    my_groups = db.relationship('Group', back_populates='owner', lazy=True)
    groups = db.relationship(
        'Group',
        secondary='group_memberships',
        back_populates='members',
        lazy='dynamic'
    )
    notifications = db.relationship(
        'Notification_messages',
        back_populates='user',
        lazy='dynamic',
        cascade='all, delete-orphan',
        passive_deletes=True
    )
    shifts = db.relationship(
        'Shift',
        back_populates='assigned_owner',
        lazy='dynamic',
        cascade='all, delete-orphan',
        passive_deletes=True
    )

    @property
    def assigned_shifts(self):
        # No timezone -> naive current time
        current_time = datetime.now()
        # Return only shifts where end_time >= now
        return self.shifts.filter(Shift.end_time >= current_time)

    @property
    def unread_notifications(self):
        # Return only notifications where read == False (i.e., unread)
        return self.notifications.filter_by(read=False)

    @property
    def available_groups(self):
        return self.groups.filter(Group.owner_id != self.id)

    def get_details(self):
        return {
            "id": self.id,
            "email": self.email,
            "username": self.username
        }


class Notification_messages(db.Model):
    __tablename__ = 'notification_messages'
    id = db.Column(db.UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = db.Column(
        db.UUID(as_uuid=True),
        db.ForeignKey('users.id', ondelete='CASCADE')
    )
    read = db.Column(db.Boolean, nullable=False, default=False)
    message = db.Column(db.Text, nullable=False, default='')
    # Remove timezone=True, and remove usage of timezone.utc
    iat = db.Column(
        db.DateTime(),
        nullable=False,
        default=lambda: datetime.now()
    )

    user = db.relationship(
        'User',
        back_populates='notifications',
        passive_deletes=True
    )

    def get_details(self):
        return {
            "id": self.id,
            "user_id": self.user_id,
            "read": self.read,
            "message": self.message,
            "iat": self.iat
        }


class Group(db.Model):
    __tablename__ = 'groups'
    id = db.Column(db.UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = db.Column(db.String(120))
    owner_id = db.Column(
        db.UUID(as_uuid=True),
        db.ForeignKey('users.id', ondelete='CASCADE'),
        nullable=False
    )

    # Existing relationships
    owner = db.relationship('User', back_populates='my_groups')
    members = db.relationship(
        'User',
        secondary='group_memberships',
        back_populates='groups',
        lazy='dynamic'
    )
    shifts = db.relationship(
        'Shift',
        back_populates='group',
        lazy='dynamic',
        cascade='all, delete-orphan',
        passive_deletes=True
    )

    @property
    def membership_requests(self):
        """
        Return a list of GroupMembership rows where:
          - group_id == self.id
          - approved == False
        """
        return GroupMembership.query.filter_by(
            group_id=self.id,
            approved=False
        ).all()

    @property
    def recent_shifts(self):
        # No timezone -> naive
        cutoff_time = datetime.now() - timedelta(days=1)
        return self.shifts.filter(Shift.end_time >= cutoff_time)

    def get_details(self):
        return {
            "id": self.id,
            "name": self.name,
            "owner_id": self.owner_id
        }


class GroupMembership(db.Model):
    __tablename__ = 'group_memberships'

    # This is your new "extra" ID column, not a primary key
    id = db.Column(
        db.UUID(as_uuid=True),
        default=uuid.uuid4,
        unique=True,        # ensures each row has a distinct UUID
        nullable=False
    )

    # The composite primary key remains:
    user_id = db.Column(
        db.UUID(as_uuid=True),
        db.ForeignKey('users.id', ondelete='CASCADE'),
        primary_key=True
    )
    group_id = db.Column(
        db.UUID(as_uuid=True),
        db.ForeignKey('groups.id', ondelete='CASCADE'),
        primary_key=True
    )

    admin = db.Column(db.Boolean, nullable=False, default=False)
    approved = db.Column(db.Boolean, nullable=False, default=False)

    user = db.relationship('User', passive_deletes=True)
    group = db.relationship('Group', passive_deletes=True)

    def get_details(self):
        return {
            # Now `id` is safe to use:
            "id": str(self.id),
            "group_id": str(self.group_id),
            "user_id": str(self.user_id),
            "username": self.user.username,  # if user is not None
        }


class Shift(db.Model):
    __tablename__ = 'shifts'
    id = db.Column(db.UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    group_id = db.Column(
        db.UUID(as_uuid=True),
        db.ForeignKey('groups.id', ondelete='CASCADE'),
        nullable=False
    )
    user_id = db.Column(
        db.UUID(as_uuid=True),
        db.ForeignKey('users.id', ondelete='CASCADE'),
        nullable=True
    )
    # Remove timezone=True
    start_time = db.Column(db.DateTime(), nullable=False)
    end_time = db.Column(db.DateTime(), nullable=False)

    group = db.relationship(
        'Group',
        back_populates='shifts',
        passive_deletes=True
    )
    assigned_owner = db.relationship(
        'User',
        back_populates='shifts',
        passive_deletes=True
    )
    swaps = db.relationship(
        'Shift_swap',
        back_populates='shift',
        cascade='all, delete-orphan',
        passive_deletes=True
    )

    def get_details(self):
        return {
            "id": self.id,
            "group_id": self.group_id,
            "user_id": self.user_id,
            "start_time": self.start_time,
            "end_time": self.end_time
        }


class Shift_swap(db.Model):
    __tablename__ = 'shift_swaps'
    id = db.Column(db.UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    shift_id = db.Column(
        db.UUID(as_uuid=True),
        db.ForeignKey('shifts.id', ondelete='CASCADE'),
        nullable=False
    )
    current_owner_id = db.Column(
        db.UUID(as_uuid=True),
        db.ForeignKey('users.id', ondelete='CASCADE'),
        nullable=False
    )
    new_owner_id = db.Column(
        db.UUID(as_uuid=True),
        db.ForeignKey('users.id', ondelete='CASCADE'),
        nullable=True
    )
    approved_by_admin_id = db.Column(
        db.UUID(as_uuid=True),
        db.ForeignKey('users.id', ondelete='CASCADE'),
        nullable=True
    )

    shift = db.relationship(
        'Shift',
        back_populates='swaps',
        passive_deletes=True
    )
    current_owner = db.relationship(
        'User',
        foreign_keys=[current_owner_id],
        passive_deletes=True
    )
    new_owner = db.relationship(
        'User',
        foreign_keys=[new_owner_id],
        passive_deletes=True
    )
    approved_by_admin = db.relationship(
        'User',
        foreign_keys=[approved_by_admin_id],
        passive_deletes=True
    )


def connect_db(app):
    """Connect to database."""
    db.app = app
    db.init_app(app)


if __name__ == '__main__':
    app = Flask(__name__)
    app.config['SQLALCHEMY_DATABASE_URI'] = os.getenv(
        "SQLALCHEMY_DATABASE_URI")
    app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
    connect_db(app)

    with app.app_context():
        db.drop_all()
        db.create_all()
        print("Tables dropped and created successfully.")
