"""
Health check endpoint.
"""

from flask import Blueprint, jsonify
from extensions import db
from sqlalchemy import text

health_bp = Blueprint("health", __name__)


@health_bp.route("/health", methods=["GET"])
def health_check():
    """Returns API health status including DB connectivity."""
    try:
        db.session.execute(text("SELECT 1"))
        db_status = "ok"
    except Exception as exc:
        db_status = f"error: {exc}"

    return jsonify({
        "status": "ok" if db_status == "ok" else "degraded",
        "database": db_status,
    })
