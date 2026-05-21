"""
Task API routes.

Endpoints:
  GET    /api/tasks          - Retrieve all tasks
  POST   /api/tasks          - Create a new task
  GET    /api/tasks/<id>     - Retrieve a task by ID
  PUT    /api/tasks/<id>     - Update a task (full update)
  PATCH  /api/tasks/<id>/status - Update only the status of a task
  DELETE /api/tasks/<id>     - Delete a task
"""

from flask import Blueprint, request, jsonify
from marshmallow import ValidationError
from extensions import db
from models.task import Task, TaskStatus
from schemas.task_schema import CreateTaskSchema, UpdateStatusSchema, UpdateTaskSchema

tasks_bp = Blueprint("tasks", __name__)

create_schema = CreateTaskSchema()
update_status_schema = UpdateStatusSchema()
update_task_schema = UpdateTaskSchema()


def success(data, status_code=200):
    return jsonify({"success": True, "data": data}), status_code


def error(message, status_code=400, details=None):
    body = {"success": False, "error": message}
    if details:
        body["details"] = details
    return jsonify(body), status_code


# ---------------------------------------------------------------------------
# GET /api/tasks
# ---------------------------------------------------------------------------
@tasks_bp.route("", methods=["GET"])
def get_all_tasks():
    """Retrieve all tasks, with optional status filter."""
    status_filter = request.args.get("status")
    query = Task.query

    if status_filter:
        if status_filter not in TaskStatus.ALL:
            return error(f"Invalid status filter. Must be one of: {', '.join(TaskStatus.ALL)}")
        query = query.filter_by(status=status_filter)

    tasks = query.order_by(Task.due_date.asc()).all()
    return success([t.to_dict() for t in tasks])


# ---------------------------------------------------------------------------
# POST /api/tasks
# ---------------------------------------------------------------------------
@tasks_bp.route("", methods=["POST"])
def create_task():
    """Create a new task."""
    json_data = request.get_json(silent=True)
    if not json_data:
        return error("Request body must be valid JSON.")

    try:
        data = create_schema.load(json_data)
    except ValidationError as exc:
        return error("Validation failed.", 422, exc.messages)

    task = Task(
        title=data["title"],
        description=data.get("description"),
        status=data.get("status"),
        due_date=data["due_date"],
    )
    db.session.add(task)
    db.session.commit()
    return success(task.to_dict(), 201)


# ---------------------------------------------------------------------------
# GET /api/tasks/<id>
# ---------------------------------------------------------------------------
@tasks_bp.route("/<int:task_id>", methods=["GET"])
def get_task(task_id):
    """Retrieve a single task by ID."""
    task = db.session.get(Task, task_id)
    if not task:
        return error(f"Task with ID {task_id} not found.", 404)
    return success(task.to_dict())


# ---------------------------------------------------------------------------
# PUT /api/tasks/<id>
# ---------------------------------------------------------------------------
@tasks_bp.route("/<int:task_id>", methods=["PUT"])
def update_task(task_id):
    """Update a task (full update – all writable fields accepted)."""
    task = db.session.get(Task, task_id)
    if not task:
        return error(f"Task with ID {task_id} not found.", 404)

    json_data = request.get_json(silent=True)
    if not json_data:
        return error("Request body must be valid JSON.")

    try:
        data = update_task_schema.load(json_data)
    except ValidationError as exc:
        return error("Validation failed.", 422, exc.messages)

    if not data:
        return error("No valid fields provided for update.", 422)

    for field, value in data.items():
        setattr(task, field, value)

    db.session.commit()
    return success(task.to_dict())


# ---------------------------------------------------------------------------
# PATCH /api/tasks/<id>/status
# ---------------------------------------------------------------------------
@tasks_bp.route("/<int:task_id>/status", methods=["PATCH"])
def update_task_status(task_id):
    """Update only the status of a task."""
    task = db.session.get(Task, task_id)
    if not task:
        return error(f"Task with ID {task_id} not found.", 404)

    json_data = request.get_json(silent=True)
    if not json_data:
        return error("Request body must be valid JSON.")

    try:
        data = update_status_schema.load(json_data)
    except ValidationError as exc:
        return error("Validation failed.", 422, exc.messages)

    task.status = data["status"]
    db.session.commit()
    return success(task.to_dict())


# ---------------------------------------------------------------------------
# DELETE /api/tasks/<id>
# ---------------------------------------------------------------------------
@tasks_bp.route("/<int:task_id>", methods=["DELETE"])
def delete_task(task_id):
    """Delete a task by ID."""
    task = db.session.get(Task, task_id)
    if not task:
        return error(f"Task with ID {task_id} not found.", 404)

    db.session.delete(task)
    db.session.commit()
    return success({"message": f"Task {task_id} deleted successfully."})
