# app.py

from flask import Flask, redirect, url_for, jsonify, request, g, session
from flask_debugtoolbar import DebugToolbarExtension
from authlib.integrations.flask_client import OAuth
from models import db, connect_db, User, Group, GroupMembership, Shift, Shift_swap, Notification_messages
from auth_decorator import login_required
from datetime import date, datetime, timezone, timedelta
import requests
import os
from dotenv import load_dotenv

load_dotenv()

app = Flask(__name__)
app.config['SQLALCHEMY_DATABASE_URI'] = os.getenv("SQLALCHEMY_DATABASE_URI")
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
app.config['SQLALCHEMY_ECHO'] = True
app.config['SECRET_KEY'] = os.getenv("secretKey")
app.config['DEBUG_TB_INTERCEPT_REDIRECTS'] = False

toolbar = DebugToolbarExtension(app)

connect_db(app)

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


@app.route('/login-google', methods=["GET"])
def login_google():
    redirect_uri = url_for('login_google_callback', _external=True)
    return google.authorize_redirect(redirect_uri)


@app.route('/signup-google', methods=["GET"])
def signup_google():
    redirect_uri = url_for('signup_google_callback', _external=True)
    return google.authorize_redirect(redirect_uri)


@app.route('/login-google/callback', methods=["GET"])
def login_google_callback():
    # Access token from Google (needed to get user info)
    token = google.authorize_access_token()

    # Retrieve user information
    user_info = google.userinfo()

    user_exists = User.query.filter_by(
        google_openid=user_info.get("sub")).one_or_none() != None

    if user_exists:
        # Store token into session (access and refresh tokens)
        session['access_token'] = token.get('access_token')
        session['auth_type'] = 'Google'

    # Make the session permanent so it persists after the browser is closed
    session.permanent = True

    return redirect('/')


@app.route('/signup-google/callback', methods=["GET"])
def signup_google_callback():
    # Access token from Google (needed to get user info)
    token = google.authorize_access_token()

    # Retrieve user information
    user_info = google.userinfo()

    user_exists = User.query.filter_by(
        google_openid=user_info.get("sub")).one_or_none() != None

    if not user_exists:
        new_user = User(email=user_info.get("email"),
                        google_openid=user_info.get("sub"))
        db.session.add(new_user)
        db.session.commit()

    # Store token into session (access and refresh tokens)
    session['access_token'] = token.get('access_token')
    session['auth_type'] = 'Google'

    # Make the session permanent so it persists after the browser is closed
    session.permanent = True

    return redirect('/')


# Microsoft OAuth Routes
@app.route('/login-microsoft', methods=["GET"])
def login_microsoft():
    redirect_uri = url_for('login_microsoft_callback', _external=True)
    return microsoft.authorize_redirect(redirect_uri)


@app.route('/signup-microsoft', methods=["GET"])
def signup_microsoft():
    redirect_uri = url_for('signup_microsoft_callback', _external=True)
    return microsoft.authorize_redirect(redirect_uri)


@app.route('/login-microsoft/callback', methods=["GET"])
def login_microsoft_callback():
    # Access token from Microsoft (needed to get user info)
    token = microsoft.authorize_access_token()

    # Retrieve user information
    resp = microsoft.get('me')
    user_info = resp.json()

    user_exists = User.query.filter_by(
        microsoft_openid=user_info.get("id")).one_or_none() is not None

    if user_exists:
        # Store token into session (access and refresh tokens)
        session['access_token'] = token.get('access_token')
        session['auth_type'] = 'Microsoft'

    # Make the session permanent so it persists after the browser is closed
    session.permanent = True

    return redirect('/')


@app.route('/signup-microsoft/callback', methods=["GET"])
def signup_microsoft_callback():
    # Access token from Microsoft (needed to get user info)
    token = microsoft.authorize_access_token()

    # Retrieve user information
    resp = microsoft.get('me')
    user_info = resp.json()

    user_exists = User.query.filter_by(
        microsoft_openid=user_info.get("id")).one_or_none() is not None

    if not user_exists:
        new_user = User(
            email=user_info.get("mail") or user_info.get("userPrincipalName"),
            microsoft_openid=user_info.get("id")
        )
        db.session.add(new_user)
        db.session.commit()

    # Store token into session (access and refresh tokens)
    session['access_token'] = token.get('access_token')
    session['auth_type'] = 'Microsoft'

    # Make the session permanent so it persists after the browser is closed
    session.permanent = True

    return redirect('/')


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


@app.route('/user/notifications', methods=["GET"])
@login_required
def get_user_notifications():
    user = g.user

    for key in list(session.keys()):
        session.pop(key)
    return jsonify({
        "notifications": [notification.get_details() for notification in user.notifications],
        "unread_notifications": [notification.get_details() for notification in user.unread_notifications]
    })


@app.route('/user/groups', methods=["GET", "POST"])
@login_required
def list_groups():
    user = g.user

    if request.method == "GET":
        for key in list(session.keys()):
            session.pop(key)
        return jsonify({
            "owned_groups": [group.get_details() for group in user.owned_groups],
            "groups": [group.get_details() for group in user.groups]
        })
    elif request.method == "POST":
        body = request.get_json()
        name = body.get("name")

        new_group = Group(name=name, owner_id=user.id)
        db.session.add(new_group)
        db.session.commit()

        admin = GroupMembership(
            user_id=user.id, group_id=new_group.id, admin=False, approved=False)
        db.session.add(admin)
        db.session.commit()

        return jsonify({"group_id": new_group.id}), 201


@app.route('/user/groups/<group_id>', methods=["GET"])
@login_required
def get_group_info(group_id):
    user = g.user

    group = Group.query.filter_by(id=group_id).one_or_none()

    if group == None:
        return jsonify({"message": "Group not found"}), 404

    matching_instance = next(
        (group for group in user.groups if group.id == group_id), None)
    if not matching_instance:
        return jsonify({"message": "You not not have permission to view this group"}), 401
    if not matching_instance.approved:
        return jsonify({"message": "You not not have permission to view this group"}), 401

    return jsonify({
        "shifts": [shift.get_details() for shift in group.recent_shifts],
        "members": [user.get_details() for user in group.members]
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
        return jsonify({"message": "Request not found"}), 404

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
        return jsonify({"message": "Request not found"}), 404

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
        return jsonify({"message": "Request not found"}), 404

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


@app.route('/user/groups/memberships/<membership_id>/shift', methods=["POST"])
@login_required
def create_new_shift(membership_id):
    user = g.user

    body = request.get_json()
    shift_owner_membership_id = body.get("shift_owner_membership_id")
    start_time_iso = body.get("start_time_iso")
    end_time_iso = body.get("end_time_iso")

    membership = GroupMembership.query.filter_by(
        id=membership_id).one_or_none()

    if membership == None:
        return jsonify({"message": "Request not found"}), 404

    user_membership = next(
        (m for m in membership.group.members if m.id == user.id), None)

    if user_membership == None:
        return jsonify({"message": "You do not have a membership to this group"}), 401

    user_is_admin = user_membership.admin

    if not user_is_admin:
        return jsonify({"message": "Only memebers with administative access can perform this action"}), 401

    if (shift_owner_membership_id == None) or (start_time_iso == None) or (end_time_iso == None):
        return jsonify({"message": "Required parameters are missing"}), 400

    shift_owner_membership = GroupMembership.query.filter_by(
        user_id=shift_owner_membership_id).one_or_none()

    if not shift_owner_membership:
        return jsonify({"message": "Assigned user does not have an existing membership to this group"}), 404

    shift = Shift(group_id=user_membership.group.id, user_id=shift_owner_membership.user.id,
                  start_time=date.fromisoformat(start_time_iso), end_time=date.fromisoformat(end_time_iso))

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

    notification = Notification_messages(
        user_id=membership.user.id, message=f"You've been assigned a new shift at {membership.group.name} from {shift.start_time.strftime()} to {shift.end_time.strftime()}.")

    db.session.add(shift)
    db.session.add(notification)
    db.session.commit()

    return jsonify({"message": "Shift created successfully"}), 201


@app.route('/user/groups/memberships/<membership_id>/shift/<shift_id>', methods=["PUT", "DELETE"])
@login_required
def modify_or_delete_shift(membership_id, shift_id):
    user = g.user

    membership = GroupMembership.query.filter_by(
        id=membership_id).one_or_none()

    if membership == None:
        return jsonify({"message": "Invalid user membership id"}), 404

    user_membership = next(
        (m for m in membership.group.members if m.id == user.id), None)

    if user_membership == None:
        return jsonify({"message": "You do not have a membership to this group"}), 401

    user_is_admin = user_membership.admin

    if not user_is_admin:
        return jsonify({"message": "Only memebers with administative access can perform this action"}), 401

    shift = Shift.query.filter_by(
        id=shift_id).one_or_none()

    if shift == None:
        return jsonify({"message": "Shift not found"}), 404

    if request.method == "PUT":

        body = request.get_json()
        shift_owner_membership_id = body.get("shift_owner_membership_id")
        start_time_iso = body.get("start_time_iso")
        end_time_iso = body.get("end_time_iso")

        if (shift_owner_membership_id == None) or (start_time_iso == None) or (end_time_iso == None):
            return jsonify({"message": "Required parameters are missing"}), 400

        shift_owner_membership = GroupMembership.query.filter_by(
            user_id=shift_owner_membership_id).one_or_none()

        if not shift_owner_membership:
            return jsonify({"message": "Assigned user does not have an existing membership to this group"}), 404

        initial_shift_data = shift.get_details()
        reassign_shift_owner = shift.assigned_owner.id == shift_owner_membership_id

        shift.group_id = user_membership.group.id
        shift.user_id = shift_owner_membership.user.id
        shift.start_time = date.fromisoformat(start_time_iso)
        shift.end_time = date.fromisoformat(end_time_iso)

        start_overlaping_shift = next(
            (overlap_shift for overlap_shift in shift_owner_membership.user.assigned_shifts if shift.end_time >
             overlap_shift.start_time),
            None
        )

        end_overlaping_shift = next(
            (overlap_shift for overlap_shift in shift_owner_membership.user.assigned_shifts if overlap_shift.start_time <
             shift.end_time),
            None
        )

        if start_overlaping_shift != None:
            db.session.delete(start_overlaping_shift)
            shift.start_time = start_overlaping_shift.start_time

        if end_overlaping_shift != None:
            db.session.delete(end_overlaping_shift)
            shift.end_time = end_overlaping_shift.end_time

        if not reassign_shift_owner:
            notification = Notification_messages(
                user_id=shift_owner_membership.user.id, message=f"Your shift at {membership.group.name} was modified from, {initial_shift_data.start_time.strftime()} to {initial_shift_data.end_time.strftime()}, to now, {shift.start_time.strftime()} to {shift.end_time.strftime()}.")
            db.session.add(notification)
        else:
            previous_owner_notification = Notification_messages(
                user_id=initial_shift_data.user_id, message=f"Your shift at {membership.group.name} from {initial_shift_data.start_time.strftime()} to {initial_shift_data.end_time.strftime()} was unassigned.")
            new_owner_notification = Notification_messages(
                user_id=shift_owner_membership.user.id, message=f"You've been assigned a new shift at {membership.group.name} from {shift.start_time.strftime()} to {shift.end_time.strftime()}.")

            db.session.add(previous_owner_notification)
            db.session.add(new_owner_notification)

        db.session.add(shift)
        db.session.commit()

        return jsonify({"message": "Shift modified successfully"}), 200

    elif request.method == "DELETE":

        notification = Notification_messages(
            user_id=shift.assigned_owner.id, message=f"Your shift at {membership.group.name} from {initial_shift_data.start_time.strftime()} to {initial_shift_data.end_time.strftime()}, to now, {shift.start_time.strftime()} to {shift.end_time.strftime()} was unassigned.")

        db.session.delete(shift)
        db.session.add(notification)

        db.session.commit()

        return jsonify({"message": "Shift deleted successfully"}), 204


@app.route('/user/groups/memberships/<membership_id>/shift/<shift_id>/shift-swap', methods=["POST"])
@login_required
def create_new_shift_swap(membership_id, shift_id):
    user = g.user

    membership = GroupMembership.query.filter_by(
        id=membership_id).one_or_none()

    if membership == None:
        return jsonify({"message": "Request not found"}), 404

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


@app.route('/user/groups/memberships/<membership_id>/shift/<shift_id>/shift-swap/<swap_id>/link', methods=["POST"])
@login_required
def link_shift_swap(membership_id, shift_id, swap_id):
    user = g.user

    membership = GroupMembership.query.filter_by(
        id=membership_id).one_or_none()

    if membership == None:
        return jsonify({"message": "Request not found"}), 404

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


@app.route('/user/groups/memberships/<membership_id>/shift/<shift_id>/shift-swap/<swap_id>/approve', methods=["POST"])
@login_required
def approve_shift_swap(membership_id, shift_id, swap_id):
    user = g.user

    membership = GroupMembership.query.filter_by(
        id=membership_id).one_or_none()

    if membership == None:
        return jsonify({"message": "Request not found"}), 404

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


@app.route('/user/groups/memberships/<membership_id>/shift/<shift_id>/shift-swap/<swap_id>/decline', methods=["DELETE"])
@login_required
def decline_shift_swap(membership_id, shift_id, swap_id):
    user = g.user

    membership = GroupMembership.query.filter_by(
        id=membership_id).one_or_none()

    if membership == None:
        return jsonify({"message": "Request not found"}), 404

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
