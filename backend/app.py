# app.py

from flask import Flask, redirect, url_for, jsonify, request, g, session
from sqlalchemy import case, asc
from flask_debugtoolbar import DebugToolbarExtension
from authlib.integrations.flask_client import OAuth
from models import db, connect_db, User, Group, GroupMembership, Shift, Shift_swap, Notification_messages
from auth_decorator import login_required
from flask_bcrypt import Bcrypt
import jwt
import random
import string
from datetime import date, datetime, timezone, timedelta
import requests
import os
from flask_cors import CORS
from dotenv import load_dotenv
from werkzeug.middleware.proxy_fix import ProxyFix

load_dotenv()


app = Flask(__name__)
app.wsgi_app = ProxyFix(app.wsgi_app, x_for=1, x_proto=1, x_host=1)
app.config['SQLALCHEMY_DATABASE_URI'] = os.getenv("SQLALCHEMY_DATABASE_URI")
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
app.config['SQLALCHEMY_ECHO'] = True
app.config['SECRET_KEY'] = os.getenv("secretKey")
app.config['DEBUG_TB_INTERCEPT_REDIRECTS'] = False

app.config.update(
    SESSION_COOKIE_SAMESITE='None',  # Allows cookies to be sent in cross-site requests
    SESSION_COOKIE_SECURE=True,      # Ensures cookies are only sent over HTTPS
    SESSION_COOKIE_HTTPONLY=True,    # Prevents JavaScript from accessing the cookie
)

redirect_url = os.getenv('AUTH_REDIRECT_URL') or '/'

# Initialize CORS
frontend_url = os.getenv('FRONTEND_URL')
if not frontend_url:
    raise ValueError("FRONTEND_URL environment variable not set")

CORS(app, resources={
     r"/*": {"origins": [frontend_url]}}, supports_credentials=True)


toolbar = DebugToolbarExtension(app)

connect_db(app)

bcrypt = Bcrypt()
SECRET_KEY = os.getenv("secretKey")

# OAuth Setup
oauth = OAuth(app)

# Google OAuth Registration
google = oauth.register(
    name='google',
    client_id=os.getenv("GOOGLE_CLIENT_ID"),
    client_secret=os.getenv("GOOGLE_CLIENT_SECRET"),
    server_metadata_url='https://accounts.google.com/.well-known/openid-configuration',
    client_kwargs={
        'scope': 'openid email profile'
    }
)

# Microsoft OAuth Registration
microsoft = oauth.register(
    name='microsoft',
    client_id=os.getenv("MICROSOFT_CLIENT_ID"),
    client_secret=os.getenv("MICROSOFT_CLIENT_SECRET"),
    access_token_url='https://login.microsoftonline.com/common/oauth2/v2.0/token',
    authorize_url='https://login.microsoftonline.com/common/oauth2/v2.0/authorize',
    api_base_url='https://graph.microsoft.com/v1.0/',
    client_kwargs={
        'scope': 'User.Read'
    }
)


@app.route('/', methods=["GET"])
@login_required
def home():
    return f'Hello, you are logged in as {g.user.email}!'


@app.route('/login', methods=["POST"])
def login_host():
    body = request.get_json()
    email = body.get("email")
    password = body.get("password")

    if email == None or password == None:
        return jsonify({"message": "Required parameters are missing"}), 400

    user = User.query.filter_by(
        google_openid=None, microsoft_openid=None, email=email
    ).one_or_none()

    if user == None:
        return jsonify({
            "message": "A user for this account does not exist"
        }), 401

    authorized = bcrypt.check_password_hash(user.password_hash, password)
    if not authorized:
        return jsonify({
            "message": "Email and password combination not valid"
        }), 401

    # Create the JWT payload (FIX: remove 'datetime.' prefix)
    payload = {
        "user_id": str(user.id),
        # Token expires in 3 hours from now
        "exp": datetime.utcnow() + timedelta(hours=3)
    }

    # Encode the JWT
    token = jwt.encode(payload, SECRET_KEY, algorithm="HS256")

    # Store token into session
    session['access_token'] = str(token)
    session['auth_type'] = 'Host'
    session.permanent = True

    access_token = session.get('access_token')
    auth_type = session.get('auth_type')

    if access_token is None or auth_type is None:
        return jsonify({"message": "Token data is missing", "status": 401}), 401

    return jsonify({"message": "login successful"})


@app.route('/signup', methods=["POST"])
def signup_host():
    body = request.get_json()
    username = body.get("username")
    email = body.get("email")
    password = body.get("password")
    confirm_password = body.get("confirm_password")

    if not all([username, email, password, confirm_password]):
        return jsonify({"message": "Required parameters are missing"}), 400

    existing_user = User.query.filter_by(
        google_openid=None, microsoft_openid=None, email=email
    ).one_or_none()

    if existing_user is not None:
        return jsonify({"message": "A user for this email already exists"}), 401

    if password != confirm_password:
        return jsonify({"message": "password does not match password confirmation"}), 400

    password_hash = bcrypt.generate_password_hash(password).decode('UTF-8')

    new_user = User(
        username=username.replace(" ", "_"),
        email=email,
        password_hash=password_hash
    )
    db.session.add(new_user)
    db.session.commit()

    payload = {
        "user_id": str(new_user.id),   # Convert UUID to str
        "exp": datetime.utcnow() + timedelta(hours=3)
    }

    token = jwt.encode(payload, SECRET_KEY, algorithm="HS256")

    session['access_token'] = str(token)
    session['auth_type'] = 'Host'
    session.permanent = True  # Token persists beyond browser close

    return jsonify({"message": "registration successful"})


@app.route('/auth-google', methods=["GET"])
def auth_google():
    redirect_uri = url_for('auth_google_callback', _external=True)
    return google.authorize_redirect(redirect_uri)


@app.route('/auth-google/callback', methods=["GET"])
def auth_google_callback():
    # Access token from Google (needed to get user info)
    token = google.authorize_access_token()

    # Retrieve user information
    user_info = google.userinfo()

    user = User.query.filter_by(
        google_openid=user_info.get("sub")).one_or_none()

    if user == None:
        new_user = User(
            username=user_info.get("name").replace(" ", "_"),
            email=user_info.get("email"),
            google_openid=user_info.get("sub")
        )
        db.session.add(new_user)
        db.session.commit()

    # Store token into session
    session['access_token'] = token.get('access_token')
    session['auth_type'] = 'Google'

    # Make the session permanent so it persists after the browser is closed
    session.permanent = True

    return redirect(redirect_url)


@app.route('/auth-microsoft', methods=["GET"])
def auth_microsoft():
    redirect_uri = url_for('auth_microsoft_callback', _external=True)
    return microsoft.authorize_redirect(redirect_uri)


@app.route('/auth-microsoft/callback', methods=["GET"])
def auth_microsoft_callback():
    # Access token from Microsoft (needed to get user info)
    token = microsoft.authorize_access_token()

    # Retrieve user information
    resp = microsoft.get('me')
    user_info = resp.json()

    user = User.query.filter_by(
        microsoft_openid=user_info.get("id")).one_or_none()

    if user == None:
        new_user = User(
            username=user_info.get("displayName",
                                   # If there is no username available a random 10 character string will be assigned as the username
                                   ''.join(random.choices(
                                       string.ascii_letters + string.digits, k=10))).replace(" ", "_"),
            email=user_info.get("mail") or user_info.get("userPrincipalName"),
            microsoft_openid=user_info.get("id")
        )
        db.session.add(new_user)
        db.session.commit()

    # Store token into session
    session['access_token'] = token.get('access_token')
    session['auth_type'] = 'Microsoft'

    # Make the session permanent so it persists after the browser is closed
    session.permanent = True

    return redirect(redirect_url)


@app.route('/logout', methods=["GET"])
def logout():
    access_token = session.get('access_token')

    # Revoke the access token by
    auth_type = session.get("auth_type")

    if auth_type == "Google":
        requests.post('https://oauth2.googleapis.com/revoke', params={'token': access_token},
                      headers={'content-type': 'application/x-www-form-urlencoded'})

    for key in list(session.keys()):
        session.pop(key)
    return jsonify({"message": "Logout successful"}), 200


@app.route('/user', methods=["GET"])
@login_required
def get_user_info():
    user = g.user

    return jsonify({
        "user": {
            "id": user.id,
            "username": user.username,
            "email": user.email
        },
    })


@app.route('/user/notifications', methods=["GET"])
@login_required
def get_user_notifications():
    user = g.user

    return jsonify({
        "notifications": [notification.get_details() for notification in user.notifications],
        "unread_notifications": [notification.get_details() for notification in user.unread_notifications]
    })


@app.route('/user/notifications/read-all', methods=["POST"])
@login_required
def read_all_notifications():
    user = g.user

    for notification in g.user.unread_notifications:
        notification.read = True
        db.session.add(notification)
    db.session.commit()

    return jsonify({"message": "All notifications marked as read."}), 200


@app.route('/groups/search', methods=["GET"])
@login_required
def search_groups():
    name = request.args.get("name", "").strip()
    if not name:
        return jsonify({"message": "Required parameter 'name' is missing"}), 400

    # 1. Build a CASE expression: 0 if name starts with 'name', else 1
    starts_with_case = case(
        (Group.name.ilike(f"{name}%"), 0),
        else_=1
    )

    # 2. Query groups that contain `name` (ilike = case-insensitive LIKE)
    #    Order by `starts_with_case` (start-with first), then Group.name asc
    matching_groups = (
        Group.query
        .filter(Group.name.ilike(f"%{name}%"))
        .order_by(starts_with_case, asc(Group.name))
        .all()
    )

    user_id = g.user.id

    # 3. Build the response list
    results = []
    for group in matching_groups:
        membership = GroupMembership.query.filter_by(
            user_id=user_id,
            group_id=group.id
        ).one_or_none()

        # Determine membership status
        if membership is None:
            status = None
        elif membership.approved:
            status = "approved"
        else:
            status = "pending"

        results.append({
            "id": str(group.id),
            "name": group.name,
            "membership_status": status,
        })

    return jsonify({"groups": results}), 200


@app.route('/user/groups', methods=["GET", "POST"])
@login_required
def list_all_or_create_group():
    user = g.user

    if request.method == "GET":
        return jsonify({
            "all_groups": [group.get_details() for group in user.groups],
            "my_groups": [group.get_details() for group in user.my_groups],
            "available_groups": [group.get_details() for group in user.available_groups],
        })
    elif request.method == "POST":
        body = request.get_json()
        name = body.get("name")

        new_group = Group(name=name, owner_id=user.id)
        db.session.add(new_group)
        db.session.commit()

        admin = GroupMembership(
            user_id=user.id, group_id=new_group.id, admin=True, approved=True)
        db.session.add(admin)
        db.session.commit()

        return jsonify({"group_id": new_group.id}), 201


@app.route('/user/groups/<group_id>', methods=["GET"])
@login_required
def get_group_info(group_id):
    user = g.user

    group = Group.query.filter_by(id=group_id).one_or_none()

    if group is None:
        return jsonify({"message": "Group not found"}), 404

    # Query the GroupMembership table
    membership = GroupMembership.query.filter_by(
        user_id=user.id, group_id=group_id).one_or_none()

    if not membership:
        return jsonify({"message": "You do not have permission to view this group"}), 401

    if not membership.approved:
        return jsonify({"message": "Your membership in this group is not approved"}), 401

    role = ''
    if group.owner.id == user.id:
        role = 'owner'
    elif membership.admin == True:
        role = 'admin'
    else:
        role = 'employee'

    return jsonify({
        "id": group.id,
        "shifts": [shift.get_details() for shift in group.recent_shifts],
        "members": [member.get_details() for member in group.members],
        "membership_requests": [member.get_details() for member in group.membership_requests],
        "role": role
    }), 200


@app.route('/user/groups/<group_id>/membership/request-join', methods=["POST"])
@login_required
def request_group_membership(group_id):
    user = g.user

    group = Group.query.filter_by(id=group_id).one_or_none()

    if group == None:
        return jsonify({"message": "Group not found"}), 404

    existing_request = next(
        (group for group in user.groups if group.id == group_id), None)

    if existing_request and not existing_request.approved:
        return jsonify({"message": "You have already sent a request to this group"}), 401
    if existing_request and existing_request.approved:
        return jsonify({"message": "You are already a part of this group"}), 401

    join_request = GroupMembership(
        user_id=user.id, group_id=group.id, admin=False, approved=False)
    db.session.add(join_request)
    db.session.commit()

    return jsonify({"message": "Request sent successfully"}), 201


@app.route('/user/memberships/<membership_id>/approve-join', methods=["POST"])
@login_required
def approve_group_membership(membership_id):
    user = g.user

    user_is_admin = (GroupMembership.query.filter_by(
        user_id=user.id).one()).admin

    if not user_is_admin:
        return jsonify({"message": "Only memebers with administative access can perform this action"}), 401

    membership = GroupMembership.query.filter_by(
        id=membership_id).one_or_none()

    if membership == None:
        return jsonify({"message": "membership not found"}), 404

    membership.approved = True

    notification = Notification_messages(
        user_id=membership.user.id, message=f"Your membership request to {membership.group.name} has been approved.")

    db.session.add(membership)
    db.session.add(notification)
    db.session.commit()

    return jsonify({"message": "Request was approved successfully"}), 201


@app.route('/user/memberships/<membership_id>/decline-join', methods=["DELETE"])
@login_required
def decline_group_membership(membership_id):
    user = g.user

    user_is_admin = (GroupMembership.query.filter_by(
        user_id=user.id).one()).admin

    if not user_is_admin:
        return jsonify({"message": "Only memebers with administative access can perform this action"}), 401

    membership = GroupMembership.query.filter_by(
        id=membership_id).one_or_none()

    if membership == None:
        return jsonify({"message": "membership not found"}), 404

    notification = Notification_messages(
        user_id=membership.user.id, message=f"Your membership request to {membership.group.name} has been decline.")

    db.session.delete(membership)
    db.session.add(notification)
    db.session.commit()

    return jsonify({"message": "Request was declined successfully"}), 204


@app.route('/user/memberships/<membership_id>/admin-permissions', methods=["PATCH"])
@login_required
def edit_membership_permissions(membership_id):
    user = g.user

    body = request.get_json()
    new_admin_permissions = body.get("set_admin_permissions")

    if new_admin_permissions == None:
        return jsonify({"message": "Required parameters are missing"}), 400

    membership = GroupMembership.query.filter_by(
        id=membership_id).one_or_none()

    if membership == None:
        return jsonify({"message": "membership not found"}), 404

    user_membership = next(
        (m for m in membership.group.members if m.id == user.id), None)

    user_is_owner = user_membership.group.owner.id == user.id

    if not user_is_owner:
        return jsonify({"message": "Only the group owner can perform this action"}), 401

    editing_admin = membership.user.id == membership.group.owner.id

    if editing_admin:
        return jsonify({"message": "Cannot modify the admin permission of the group owner"}), 403

    membership.admin = new_admin_permissions

    db.session.add(membership)
    db.session.commit()

    return jsonify({"message": "Group membership permissions for this user was updated successfully"}), 200


@app.route('/user/groups/<group_id>/shift', methods=["POST"])
@login_required
def create_new_shift(group_id):
    user = g.user
    body = request.get_json()
    shift_owner_membership_id = body.get("shift_owner_membership_id")
    start_time_iso = body.get("start_time_iso")
    end_time_iso = body.get("end_time_iso")

    user_membership = GroupMembership.query.filter_by(
        user_id=user.id, group_id=group_id
    ).one_or_none()

    if user_membership is None:
        return jsonify({"message": "membership not found"}), 404

    if not user_membership.approved:
        return jsonify({"message": "Your membership in this group is not approved"}), 401

    if not user_membership.admin:
        return jsonify({"message": "Only members with administrative access can perform this action"}), 401

    if not shift_owner_membership_id or not start_time_iso or not end_time_iso:
        return jsonify({"message": "Required parameters are missing"}), 400

    shift_owner_membership = GroupMembership.query.filter_by(
        user_id=shift_owner_membership_id,
        group_id=group_id
    ).one_or_none()

    if not shift_owner_membership or not shift_owner_membership.approved:
        return jsonify({
            "message": "Assigned user does not have an approved membership to this group"
        }), 404

    new_shift = Shift(
        group_id=user_membership.group.id,
        user_id=shift_owner_membership.user.id,
        start_time=datetime.fromisoformat(start_time_iso),
        end_time=datetime.fromisoformat(end_time_iso)
    )

    start_overlapping_shift = next(
        (s for s in user.assigned_shifts if new_shift.end_time > s.start_time),
        None
    )
    end_overlapping_shift = next(
        (s for s in user.assigned_shifts if s.start_time < new_shift.end_time),
        None
    )

    if start_overlapping_shift:
        db.session.delete(start_overlapping_shift)
        new_shift.start_time = start_overlapping_shift.start_time

    if end_overlapping_shift:
        db.session.delete(end_overlapping_shift)
        new_shift.end_time = end_overlapping_shift.end_time

    notification = Notification_messages(
        user_id=shift_owner_membership.user.id,
        message=f"You've been assigned a new shift at {user_membership.group.name} from {new_shift.start_time} to {new_shift.end_time}."
    )

    db.session.add(new_shift)
    db.session.add(notification)
    db.session.commit()

    return jsonify({"message": "Shift created successfully"}), 201


@app.route('/user/groups/<group_id>/shift/<shift_id>', methods=["PUT", "DELETE"])
@login_required
def modify_or_delete_shift(group_id, shift_id):
    user = g.user

    membership = GroupMembership.query.filter_by(
        user_id=user.id, group_id=group_id
    ).one_or_none()

    if membership is None:
        return jsonify({"message": "membership not found"}), 404
    if not membership.approved:
        return jsonify({"message": "Your membership in this group is not approved"}), 401
    if not membership.admin:
        return jsonify({"message": "Only memebers with administrative access can perform this action"}), 401

    shift = Shift.query.filter_by(id=shift_id).one_or_none()
    if shift is None:
        return jsonify({"message": "Shift not found"}), 404

    if request.method == "PUT":
        body = request.get_json()
        shift_owner_membership_id = body.get("shift_owner_membership_id")
        start_time_iso = body.get("start_time_iso")
        end_time_iso = body.get("end_time_iso")

        if not shift_owner_membership_id or not start_time_iso or not end_time_iso:
            return jsonify({"message": "Required parameters are missing"}), 400

        shift_owner_membership = GroupMembership.query.filter_by(
            user_id=shift_owner_membership_id, group_id=group_id
        ).one_or_none()

        if shift_owner_membership is None:
            return jsonify({
                "message": "Assigned user does not have an existing membership to this group"
            }), 404

        initial_shift_data = shift.get_details()
        reassign_shift_owner = (shift.assigned_owner.id ==
                                shift_owner_membership_id)

        # FIX: parse trailing 'Z' by replacing it with '+00:00'
        def parse_iso(iso_str):
            if iso_str.endswith('Z'):
                iso_str = iso_str[:-1] + '+00:00'
            return datetime.fromisoformat(iso_str)

        shift.group_id = membership.group.id
        shift.user_id = shift_owner_membership.user.id
        shift.start_time = parse_iso(start_time_iso)
        shift.end_time = parse_iso(end_time_iso)

        # The rest of your overlap & notification logic unchanged...
        start_overlaping_shift = next(
            (overlap_shift for overlap_shift in shift_owner_membership.user.assigned_shifts
             if shift.end_time > overlap_shift.start_time),
            None
        )
        end_overlaping_shift = next(
            (overlap_shift for overlap_shift in shift_owner_membership.user.assigned_shifts
             if overlap_shift.start_time < shift.end_time),
            None
        )

        if start_overlaping_shift is not None:
            db.session.delete(start_overlaping_shift)
            shift.start_time = start_overlaping_shift.start_time

        if end_overlaping_shift is not None:
            db.session.delete(end_overlaping_shift)
            shift.end_time = end_overlaping_shift.end_time

        if not reassign_shift_owner:
            notification = Notification_messages(
                user_id=shift_owner_membership.user.id,
                message=(
                    f"Your shift at {membership.group.name} was modified from {initial_shift_data['start_time']} "
                    f"to {initial_shift_data['end_time']}, to now {shift.start_time} to {shift.end_time}."
                )
            )
            db.session.add(notification)
        else:
            previous_owner_notification = Notification_messages(
                user_id=initial_shift_data['user_id'],
                message=(
                    f"Your shift at {membership.group.name} from {initial_shift_data['start_time']} "
                    f"to {initial_shift_data['end_time']} was unassigned."
                )
            )
            new_owner_notification = Notification_messages(
                user_id=shift_owner_membership.user.id,
                message=(
                    f"You've been assigned a new shift at {membership.group.name} "
                    f"from {shift.start_time} to {shift.end_time}."
                )
            )
            db.session.add(previous_owner_notification)
            db.session.add(new_owner_notification)

        db.session.add(shift)
        db.session.commit()
        return jsonify({"message": "Shift modified successfully"}), 200

    elif request.method == "DELETE":
        initial_shift_data = shift.get_details()
        notification = Notification_messages(
            user_id=shift.assigned_owner.id,
            message=(
                f"Your shift at {membership.group.name} from {initial_shift_data['start_time']} "
                f"to {initial_shift_data['end_time']} was unassigned."
            )
        )
        db.session.delete(shift)
        db.session.add(notification)
        db.session.commit()
        return jsonify({"message": "Shift deleted successfully"}), 204


@app.route('/user/groups/<group_id>/shift/<shift_id>/shift-swap', methods=["POST"])
@login_required
def create_new_shift_swap(group_id, shift_id):
    user = g.user

    # Query the GroupMembership table
    membership = GroupMembership.query.filter_by(
        user_id=user.id, group_id=group_id).one_or_none()

    if membership == None:
        return jsonify({"message": "membership not found"}), 404

    user_membership = next(
        (m for m in membership.group.members if m.id == user.id), None)

    if user_membership == None:
        return jsonify({"message": "You do not have a membership to this group"}), 401

    shift = Shift.query.filter_by(
        user_id=shift_id).one_or_none()

    if shift == None:
        return jsonify({"message": "Shift not found"}), 404

    shift_swap = Shift_swap(shift_id=shift.id, current_owner_id=shift.current_owner.id,
                            new_owner_id=None, approved_by_admin_id=None)

    db.session.add(shift_swap)
    db.session.commit()

    return jsonify({"message": "Shift swap request created successfully"}), 201


@app.route('/user/groups/<group_id>/shift/<shift_id>/shift-swap/<swap_id>/link', methods=["POST"])
@login_required
def link_shift_swap(group_id, shift_id, swap_id):
    user = g.user

    # Query the GroupMembership table
    membership = GroupMembership.query.filter_by(
        user_id=user.id, group_id=group_id).one_or_none()

    if membership == None:
        return jsonify({"message": "membership not found"}), 404

    user_membership = next(
        (m for m in membership.group.members if m.id == user.id), None)

    if user_membership == None:
        return jsonify({"message": "You do not have a membership to this group"}), 401

    shift = Shift.query.filter_by(
        user_id=shift_id).one_or_none()

    if shift == None:
        return jsonify({"message": "Shift not found"}), 404

    shift_swap = Shift_swap.query.filter_by(
        user_id=swap_id).one_or_none()

    if shift_swap == None:
        return jsonify({"message": "Swap not found"}), 404

    shift_swap.new_owner_id = user.id

    db.session.add(shift_swap)
    db.session.commit()

    current_shift_owner = User.query.filter_by(
        user_id=shift_swap.current_owner.id).one_or_none()

    current_shift_owner_membership = GroupMembership.query.filter_by(
        user_id=current_shift_owner.id, group_id=membership.group_id).one()

    initial_shift_data = shift.get_details()

    if membership.admin or current_shift_owner_membership.admin:

        start_overlaping_shift = next(
            (overlap_shift for overlap_shift in user.assigned_shifts if shift.end_time >
             overlap_shift.start_time),
            None
        )

        end_overlaping_shift = next(
            (overlap_shift for overlap_shift in user.assigned_shifts if overlap_shift.start_time <
             shift.end_time),
            None
        )

        if start_overlaping_shift != None:
            db.session.delete(start_overlaping_shift)
            shift.start_time = start_overlaping_shift.start_time

        if end_overlaping_shift != None:
            db.session.delete(end_overlaping_shift)
            shift.end_time = end_overlaping_shift.end_time

        shift.user_id = user.id

        notification = Notification_messages(
            user_id=initial_shift_data.user_id, message=f"Your shift at {membership.group.name} from {initial_shift_data.start_time.strftime()} to {initial_shift_data.end_time.strftime()}, was unassigned via a shift swap request.")

        db.session.add(shift)
        db.session.add(notification)
        db.session.commit()

        return jsonify({"message": "Shift swap was completed successfully"}), 200

    notification = Notification_messages(
        user_id=initial_shift_data.user_id, message=f"A group member requested to take shift at {membership.group.name} from {initial_shift_data.start_time.strftime()} to {initial_shift_data.end_time.strftime()} via a shift swap request, awaiting admin approval.")

    return jsonify({"message": "Shift swap request linked successfully awaiting admin approval"}), 200


@app.route('/user/groups/<group_id>/shift/<shift_id>/shift-swap/<swap_id>/approve', methods=["POST"])
@login_required
def approve_shift_swap(group_id, shift_id, swap_id):
    user = g.user

    # Query the GroupMembership table
    membership = GroupMembership.query.filter_by(
        user_id=user.id, group_id=group_id).one_or_none()

    if membership == None:
        return jsonify({"message": "membership not found"}), 404

    user_membership = next(
        (m for m in membership.group.members if m.id == user.id), None)

    if user_membership == None:
        return jsonify({"message": "You do not have a membership to this group"}), 401

    user_is_admin = user_membership.admin

    if not user_is_admin:
        return jsonify({"message": "Only memebers with administative access can perform this action"}), 401

    shift = Shift.query.filter_by(
        user_id=shift_id).one_or_none()

    if shift == None:
        return jsonify({"message": "Shift not found"}), 404

    shift_swap = Shift_swap.query.filter_by(
        user_id=swap_id).one_or_none()

    if shift_swap == None:
        return jsonify({"message": "Swap not found"}), 404

    initial_shift_data = shift.get_details()

    shift_swap.approved_by_admin_id = user.id

    db.session.add(shift_swap)

    start_overlaping_shift = next(
        (overlap_shift for overlap_shift in user.assigned_shifts if shift.end_time >
         overlap_shift.start_time),
        None
    )

    end_overlaping_shift = next(
        (overlap_shift for overlap_shift in user.assigned_shifts if overlap_shift.start_time <
         shift.end_time),
        None
    )

    if start_overlaping_shift != None:
        db.session.delete(start_overlaping_shift)
        shift.start_time = start_overlaping_shift.start_time

    if end_overlaping_shift != None:
        db.session.delete(end_overlaping_shift)
        shift.end_time = end_overlaping_shift.end_time

    previous_owner_notification = Notification_messages(
        user_id=initial_shift_data.user_id, message=f"Your shift at {membership.group.name} from {initial_shift_data.start_time.strftime()} to {initial_shift_data.end_time.strftime()} was unassigned via a shift swap request.")
    new_owner_notification = Notification_messages(
        user_id=shift.user_id, message=f"You've been assigned a new shift at {membership.group.name} from {shift.start_time.strftime()} to {shift.end_time.strftime()} via a shift swap request.")

    shift.user_id = user.id

    db.session.add(shift)
    db.session.add(previous_owner_notification)
    db.session.add(new_owner_notification)
    db.session.commit()

    return jsonify({"message": "Shift swap was successfully approved"}), 200


@app.route('/user/groups/<group_id>/shift/<shift_id>/shift-swap/<swap_id>/decline', methods=["DELETE"])
@login_required
def decline_shift_swap(group_id, shift_id, swap_id):
    user = g.user

    # Query the GroupMembership table
    membership = GroupMembership.query.filter_by(
        user_id=user.id, group_id=group_id).one_or_none()

    if membership == None:
        return jsonify({"message": "membership not found"}), 404

    user_membership = next(
        (m for m in membership.group.members if m.id == user.id), None)

    if user_membership == None:
        return jsonify({"message": "You do not have a membership to this group"}), 401

    shift = Shift.query.filter_by(
        user_id=shift_id).one_or_none()

    if shift == None:
        return jsonify({"message": "Shift not found"}), 404

    shift_swap = Shift_swap.query.filter_by(
        user_id=swap_id).one_or_none()

    if shift_swap == None:
        return jsonify({"message": "Swap not found"}), 404

    user_is_admin = user_membership.admin
    user_is_current_shift_owner = shift_swap.current_owner.id != user.id
    user_is_new_shift_owner = shift_swap.new_owner.id != user.id

    if not (user_is_admin or user_is_current_shift_owner or user_is_new_shift_owner):
        return jsonify({"message": "You do not have permission to perform this action"}), 401

    if user_is_new_shift_owner:
        shift_swap.new_owner_id = None

        notification = Notification_messages(
            user_id=shift.assigned_owner.id, message=f"Your shift swap request at {membership.group.name} from {shift.start_time.strftime()} to {shift.end_time.strftime()}, failed because the group member removed their request.")

        db.session.add(shift_swap)
        db.session.add(notification)
        return jsonify({"message": "You have been successfully unlinked from the shift swap"}), 204

    body = request.get_json()
    delete_request = body.get("delete_request")

    if delete_request == None:
        return jsonify({"message": "Required parameters are missing"}), 400

    if delete_request == True:
        db.session.delete(shift_swap)

        if not user_is_current_shift_owner:
            notification = Notification_messages(
                user_id=shift.assigned_owner.id, message=f"Your shift swap request at {membership.group.name} from {shift.start_time.strftime()} to {shift.end_time.strftime()}, failed because it was removed by an admin.")

            db.session.add(notification)

        db.session.commit()
        return jsonify({"message": "You have been successfully deleted the shift swap request"}), 204
    else:
        shift_swap.new_owner_id = None
        db.session.add(shift_swap)

        if not user_is_current_shift_owner:
            notification = Notification_messages(
                user_id=shift.assigned_owner.id, message=f"Your shift swap request at {membership.group.name} from {shift.start_time.strftime()} to {shift.end_time.strftime()}, failed because it was declined by an admin.")

            db.session.add(notification)

        db.session.commit()
        return jsonify({"message": "You have been successfully declined the shift swap request"}), 204


if __name__ == '__main__':
    app.run(debug=True)
