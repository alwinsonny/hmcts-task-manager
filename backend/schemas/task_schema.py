"""
Marshmallow schemas for request validation and serialisation.
"""

from datetime import datetime, timezone
from marshmallow import Schema, fields, validate, validates, ValidationError, post_load
from models.task import TaskStatus


class CreateTaskSchema(Schema):
    title = fields.Str(
        required=True,
        validate=validate.Length(min=1, max=255),
        error_messages={"required": "Title is required."},
    )
    description = fields.Str(load_default=None, allow_none=True, validate=validate.Length(max=5000))
    status = fields.Str(
        load_default=TaskStatus.PENDING,
        validate=validate.OneOf(TaskStatus.ALL, error="Invalid status value."),
    )
    due_date = fields.DateTime(
        required=True,
        error_messages={"required": "Due date is required.", "invalid": "Invalid datetime format."},
    )

    @validates("due_date")
    def validate_due_date(self, value):
        # Make both tz-aware for comparison
        now = datetime.now(timezone.utc)
        if value.tzinfo is None:
            from datetime import timezone as tz
            value = value.replace(tzinfo=tz.utc)
        if value <= now:
            raise ValidationError("Due date must be in the future.")


class UpdateStatusSchema(Schema):
    status = fields.Str(
        required=True,
        validate=validate.OneOf(TaskStatus.ALL, error="Invalid status value."),
        error_messages={"required": "Status is required."},
    )


class UpdateTaskSchema(Schema):
    title = fields.Str(validate=validate.Length(min=1, max=255))
    description = fields.Str(allow_none=True, validate=validate.Length(max=5000))
    status = fields.Str(validate=validate.OneOf(TaskStatus.ALL))
    due_date = fields.DateTime()
