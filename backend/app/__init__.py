from flask import Flask
from flask_cors import CORS

from app.config import Config
from app.extensions import bcrypt, db, jwt, migrate
from app.routes import health_bp


def create_app():
    app = Flask(__name__)

    # Load configuration
    app.config.from_object(Config)

    # Initialize extensions
    db.init_app(app)
    migrate.init_app(app, db)
    jwt.init_app(app)
    bcrypt.init_app(app)

    # Initialize CORS
    CORS(
        app,
        origins=app.config["CORS_ORIGINS"],
    )
    # Register routes 
    app.register_blueprint(health_bp)
    return app