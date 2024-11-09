from flask import session, g, jsonify
from models import User
from functools import wraps
import requests
import jwt
from jwt import DecodeError, ExpiredSignatureError, InvalidTokenError
from datetime import datetime, timedelta
from config import SECRET_KEY  # Import your secret key


def login_required(f):
    @wraps(f)
    def decorated_function(*args, **kwargs):
        access_token = session.get('access_token')
        auth_type = session.get('auth_type')

        if access_token is None or auth_type is None:
            # Missing token data, throw error
            return jsonify({"message": "Token data is missing", "status": 401}), 401

        if auth_type == "Host":
            try:
                # Decode the JWT token
                payload = jwt.decode(
                    access_token, SECRET_KEY, algorithms=["HS256"])
                user_id = payload.get('user_id')

                if user_id is None:
                    # Invalid token payload
                    session.pop('auth_type', None)
                    session.pop('access_token', None)
                    return jsonify({"message": "Invalid token", "status": 401}), 401

                # Fetch user from database using user_id
                user = User.query.filter_by(id=user_id).one_or_none()

                if user is None:
                    # User does not exist
                    session.pop('auth_type', None)
                    session.pop('access_token', None)
                    return jsonify({"message": "User does not exist", "status": 401}), 401

                # Store user info in Flask's g object
                g.user = user
                return f(*args, **kwargs)

            except ExpiredSignatureError:
                # Token has expired
                session.pop('auth_type', None)
                session.pop('access_token', None)
                return jsonify({"message": "Token has expired", "status": 401}), 401
            except (DecodeError, InvalidTokenError):
                # Token is invalid
                session.pop('auth_type', None)
                session.pop('access_token', None)
                return jsonify({"message": "Invalid token", "status": 401}), 401
            except Exception as e:
                # Handle any other exceptions
                session.pop('auth_type', None)
                session.pop('access_token', None)
                return jsonify({"message": "An error occurred", "status": 401}), 401

        elif auth_type == "Google":
            headers = {'Authorization': f'Bearer {access_token}'}
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
            headers = {'Authorization': f'Bearer {access_token}'}
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
