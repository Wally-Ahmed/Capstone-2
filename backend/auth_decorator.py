from flask import session, g, jsonify
from models import User
from functools import wraps
import requests


def login_required(f):
    @wraps(f)
    def decorated_function(*args, **kwargs):
        access_token = session.get('access_token')
        auth_type = session.get('auth_type')

        if access_token is None or auth_type is None:
            # Missing token data, throw error
            return jsonify({"message": "Token data is missing", "status": 401}), 401

        headers = {'Authorization': f'Bearer {access_token}'}

        if auth_type == "Google":
            response = requests.get(
                'https://openidconnect.googleapis.com/v1/userinfo',
                headers=headers
            )
            if response.status_code == 200:
                user_info = response.json()
                user_openid = user_info.get("sub")

                # Fetch user from database using openid
                user = User.query.filter_by(
                    google_openid=user_openid).one_or_none()

                if user is None:
                    return jsonify({"message": "User does not exist"}), 401

                # Store user info in Flask's g object
                g.user = user
                return f(*args, **kwargs)

            else:
                # Access token is invalid or expired
                session.pop('auth_type', None)
                session.pop('access_token', None)
                return jsonify({"message": "Invalid or expired token", "status": 401}), 401

        elif auth_type == "Microsoft":
            response = requests.get(
                'https://graph.microsoft.com/v1.0/me',
                headers=headers
            )
            if response.status_code == 200:
                user_info = response.json()
                user_openid = user_info.get("id")

                # Fetch user from database using openid
                user = User.query.filter_by(
                    microsoft_openid=user_openid).one_or_none()

                if user is None:
                    return jsonify({"message": "User does not exist"}), 401

                # Store user info in Flask's g object
                g.user = user
                return f(*args, **kwargs)
            else:
                # Access token is invalid or expired
                session.pop('auth_type', None)
                session.pop('access_token', None)
                return jsonify({"message": "Invalid or expired token", "status": 401}), 401
        else:
            # Authentication type not recognized
            session.pop('auth_type', None)
            session.pop('access_token', None)
            return jsonify({"message": "Invalid authentication type", "status": 401}), 401

    return decorated_function
