# app.py

from flask import Flask, redirect, url_for, jsonify, request, g, session
from flask_debugtoolbar import DebugToolbarExtension
from authlib.integrations.flask_client import OAuth
from models import db, connect_db, User, Group, GroupMembership, Shift, Shift_swap
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

    # Revoke the access token by sending a POST request to Google's token revocation endpoint
    auth_type = session.get("auth_type")

    if auth_type == "Google":
        requests.post('https://oauth2.googleapis.com/revoke', params={'token': access_token},
                      headers={'content-type': 'application/x-www-form-urlencoded'})

    for key in list(session.keys()):
        session.pop(key)
    return jsonify({"message": "Logout successful"}), 200


if __name__ == '__main__':
    app.run(debug=True)
