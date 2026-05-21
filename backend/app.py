"""
HMCTS Task Manager - Flask Backend API
"""

from flask import Flask
from flask_cors import CORS
from config import Config
from extensions import db
from routes.tasks import tasks_bp
from routes.health import health_bp


def create_app(config_class=Config):
    app = Flask(__name__)
    app.config.from_object(config_class)

    CORS(app, resources={r"/api/*": {"origins": "*"}})

    db.init_app(app)

    app.register_blueprint(tasks_bp, url_prefix="/api/tasks")
    app.register_blueprint(health_bp, url_prefix="/api")

    with app.app_context():
        db.create_all()

    return app


if __name__ == "__main__":
    app = create_app()
    app.run(debug=True, host="0.0.0.0", port=5000)
