"""
Unit tests for the HMCTS Task Manager API.
Run with: pytest
"""

import pytest
from datetime import datetime, timedelta, timezone
from app import create_app
from extensions import db as _db
from config import TestingConfig
from models.task import Task, TaskStatus


FUTURE = (datetime.now(timezone.utc) + timedelta(days=7)).isoformat()


@pytest.fixture(scope="session")
def app():
    app = create_app(TestingConfig)
    with app.app_context():
        _db.create_all()
        yield app
        _db.drop_all()


@pytest.fixture(autouse=True)
def clean_db(app):
    """Wipe tables between tests."""
    with app.app_context():
        _db.session.query(Task).delete()
        _db.session.commit()
    yield


@pytest.fixture
def client(app):
    return app.test_client()


# ---------------------------------------------------------------------------
# Helper
# ---------------------------------------------------------------------------
def create_task_payload(**overrides):
    payload = {"title": "Test Task", "due_date": FUTURE}
    payload.update(overrides)
    return payload


# ---------------------------------------------------------------------------
# Health
# ---------------------------------------------------------------------------
class TestHealth:
    def test_health_ok(self, client):
        r = client.get("/api/health")
        assert r.status_code == 200
        assert r.get_json()["status"] == "ok"


# ---------------------------------------------------------------------------
# Create Task
# ---------------------------------------------------------------------------
class TestCreateTask:
    def test_create_minimal(self, client):
        r = client.post("/api/tasks", json=create_task_payload())
        assert r.status_code == 201
        data = r.get_json()["data"]
        assert data["title"] == "Test Task"
        assert data["status"] == TaskStatus.PENDING
        assert data["description"] is None

    def test_create_full(self, client):
        payload = create_task_payload(
            title="Full Task",
            description="Some description",
            status=TaskStatus.IN_PROGRESS,
        )
        r = client.post("/api/tasks", json=payload)
        assert r.status_code == 201
        data = r.get_json()["data"]
        assert data["description"] == "Some description"
        assert data["status"] == TaskStatus.IN_PROGRESS

    def test_create_missing_title(self, client):
        r = client.post("/api/tasks", json={"due_date": FUTURE})
        assert r.status_code == 422

    def test_create_missing_due_date(self, client):
        r = client.post("/api/tasks", json={"title": "No date"})
        assert r.status_code == 422

    def test_create_past_due_date(self, client):
        past = (datetime.now(timezone.utc) - timedelta(days=1)).isoformat()
        r = client.post("/api/tasks", json=create_task_payload(due_date=past))
        assert r.status_code == 422

    def test_create_invalid_status(self, client):
        r = client.post("/api/tasks", json=create_task_payload(status="flying"))
        assert r.status_code == 422

    def test_create_no_body(self, client):
        r = client.post("/api/tasks", data="not json", content_type="text/plain")
        assert r.status_code == 400


# ---------------------------------------------------------------------------
# Get Tasks
# ---------------------------------------------------------------------------
class TestGetTasks:
    def test_get_all_empty(self, client):
        r = client.get("/api/tasks")
        assert r.status_code == 200
        assert r.get_json()["data"] == []

    def test_get_all_returns_tasks(self, client, app):
        with app.app_context():
            t = Task(title="T1", due_date=datetime.now(timezone.utc) + timedelta(days=1), status=TaskStatus.PENDING)
            _db.session.add(t)
            _db.session.commit()
        r = client.get("/api/tasks")
        assert len(r.get_json()["data"]) == 1

    def test_get_by_id(self, client, app):
        with app.app_context():
            t = Task(title="Specific", due_date=datetime.now(timezone.utc) + timedelta(days=1), status=TaskStatus.PENDING)
            _db.session.add(t)
            _db.session.commit()
            task_id = t.id
        r = client.get(f"/api/tasks/{task_id}")
        assert r.status_code == 200
        assert r.get_json()["data"]["title"] == "Specific"

    def test_get_not_found(self, client):
        r = client.get("/api/tasks/999999")
        assert r.status_code == 404

    def test_filter_by_status(self, client, app):
        with app.app_context():
            due = datetime.now(timezone.utc) + timedelta(days=1)
            _db.session.add(Task(title="P", due_date=due, status=TaskStatus.PENDING))
            _db.session.add(Task(title="C", due_date=due, status=TaskStatus.COMPLETED))
            _db.session.commit()
        r = client.get("/api/tasks?status=pending")
        data = r.get_json()["data"]
        assert all(t["status"] == TaskStatus.PENDING for t in data)


# ---------------------------------------------------------------------------
# Update Status
# ---------------------------------------------------------------------------
class TestUpdateStatus:
    def _seed(self, app):
        with app.app_context():
            t = Task(title="Update me", due_date=datetime.now(timezone.utc) + timedelta(days=1), status=TaskStatus.PENDING)
            _db.session.add(t)
            _db.session.commit()
            return t.id

    def test_update_status(self, client, app):
        task_id = self._seed(app)
        r = client.patch(f"/api/tasks/{task_id}/status", json={"status": TaskStatus.COMPLETED})
        assert r.status_code == 200
        assert r.get_json()["data"]["status"] == TaskStatus.COMPLETED

    def test_update_status_invalid(self, client, app):
        task_id = self._seed(app)
        r = client.patch(f"/api/tasks/{task_id}/status", json={"status": "nope"})
        assert r.status_code == 422

    def test_update_status_not_found(self, client):
        r = client.patch("/api/tasks/999999/status", json={"status": TaskStatus.PENDING})
        assert r.status_code == 404


# ---------------------------------------------------------------------------
# Update Task (PUT)
# ---------------------------------------------------------------------------
class TestUpdateTask:
    def _seed(self, app):
        with app.app_context():
            t = Task(title="Old title", due_date=datetime.now(timezone.utc) + timedelta(days=1), status=TaskStatus.PENDING)
            _db.session.add(t)
            _db.session.commit()
            return t.id

    def test_update_title(self, client, app):
        task_id = self._seed(app)
        r = client.put(f"/api/tasks/{task_id}", json={"title": "New title"})
        assert r.status_code == 200
        assert r.get_json()["data"]["title"] == "New title"

    def test_update_not_found(self, client):
        r = client.put("/api/tasks/999999", json={"title": "X"})
        assert r.status_code == 404


# ---------------------------------------------------------------------------
# Delete Task
# ---------------------------------------------------------------------------
class TestDeleteTask:
    def test_delete(self, client, app):
        with app.app_context():
            t = Task(title="Delete me", due_date=datetime.now(timezone.utc) + timedelta(days=1), status=TaskStatus.PENDING)
            _db.session.add(t)
            _db.session.commit()
            task_id = t.id
        r = client.delete(f"/api/tasks/{task_id}")
        assert r.status_code == 200
        r2 = client.get(f"/api/tasks/{task_id}")
        assert r2.status_code == 404

    def test_delete_not_found(self, client):
        r = client.delete("/api/tasks/999999")
        assert r.status_code == 404
