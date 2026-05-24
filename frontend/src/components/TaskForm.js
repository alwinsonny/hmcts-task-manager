import React, { useState, useEffect } from 'react';
import { format, parseISO } from 'date-fns';

const STATUSES = [
  { value: 'pending',     label: 'Pending' },
  { value: 'in_progress', label: 'In Progress' },
  { value: 'completed',   label: 'Completed' },
  { value: 'cancelled',   label: 'Cancelled' },
];

const DEFAULT_FORM = {
  title: '',
  description: '',
  status: 'pending',
  due_date: '',
};

function toLocalDateTimeInput(isoString) {
  if (!isoString) return '';
  try {
    const d = parseISO(isoString);
    return format(d, "yyyy-MM-dd'T'HH:mm");
  } catch {
    return '';
  }
}

export default function TaskForm({ task, onSubmit, onCancel, submitting }) {
  const [form, setForm] = useState(DEFAULT_FORM);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (task) {
      setForm({
        title: task.title || '',
        description: task.description || '',
        status: task.status || 'pending',
        due_date: toLocalDateTimeInput(task.due_date),
      });
    } else {
      setForm(DEFAULT_FORM);
    }
    setErrors({});
  }, [task]);

  const validate = () => {
    const errs = {};
    if (!form.title.trim()) errs.title = 'Title is required.';
    if (form.title.length > 255) errs.title = 'Title must be 255 characters or fewer.';
    if (!form.due_date) {
      errs.due_date = 'Due date is required.';
    } else if (!task && new Date(form.due_date) <= new Date()) {
      errs.due_date = 'Due date must be in the future.';
    }
    return errs;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: undefined }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }

    const payload = {
      title: form.title.trim(),
      description: form.description.trim() || null,
      status: form.status,
      due_date: new Date(form.due_date).toISOString(),
    };
    onSubmit(payload);
  };

  return (
    <form className="task-form" onSubmit={handleSubmit} noValidate>
      <div className="form-group">
        <label htmlFor="title">Title <span className="required">*</span></label>
        <input
          id="title"
          name="title"
          type="text"
          value={form.title}
          onChange={handleChange}
          placeholder="Enter task title"
          className={errors.title ? 'input input--error' : 'input'}
          maxLength={255}
        />
        {errors.title && <span className="field-error">{errors.title}</span>}
      </div>

      <div className="form-group">
        <label htmlFor="description">Description <span className="optional">(optional)</span></label>
        <textarea
          id="description"
          name="description"
          value={form.description}
          onChange={handleChange}
          placeholder="Add a description…"
          rows={3}
          className="input textarea"
          maxLength={5000}
        />
      </div>

      <div className="form-row">
        <div className="form-group">
          <label htmlFor="status">Status</label>
          <select id="status" name="status" value={form.status} onChange={handleChange} className="input select">
            {STATUSES.map((s) => (
              <option key={s.value} value={s.value}>{s.label}</option>
            ))}
          </select>
        </div>

        <div className="form-group">
          <label htmlFor="due_date">Due Date &amp; Time <span className="required">*</span></label>
          <input
            id="due_date"
            name="due_date"
            type="datetime-local"
            value={form.due_date}
            onChange={handleChange}
            className={errors.due_date ? 'input input--error' : 'input'}
          />
          {errors.due_date && <span className="field-error">{errors.due_date}</span>}
        </div>
      </div>

      <div className="form-actions">
        <button type="button" className="btn btn--ghost" onClick={onCancel} disabled={submitting}>
          Cancel
        </button>
        <button type="submit" className="btn btn--primary" disabled={submitting}>
          {submitting ? 'Saving…' : task ? 'Save Changes' : 'Create Task'}
        </button>
      </div>
    </form>
  );
}
