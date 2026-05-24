import React from 'react';
import { format, parseISO, isPast, isToday } from 'date-fns';
import StatusBadge from './StatusBadge';

const STATUSES = [
  { value: 'pending',     label: 'Pending' },
  { value: 'in_progress', label: 'In Progress' },
  { value: 'completed',   label: 'Completed' },
  { value: 'cancelled',   label: 'Cancelled' },
];

function formatDue(isoString) {
  if (!isoString) return '—';
  try {
    return format(parseISO(isoString), 'dd MMM yyyy, HH:mm');
  } catch {
    return isoString;
  }
}

function dueSeverity(isoString, status) {
  if (!isoString || status === 'completed' || status === 'cancelled') return '';
  const d = parseISO(isoString);
  if (isPast(d)) return 'overdue';
  if (isToday(d)) return 'due-today';
  return '';
}

export default function TaskCard({ task, onEdit, onDelete, onStatusChange, deleting }) {
  const severity = dueSeverity(task.due_date, task.status);

  const handleStatusChange = (e) => {
    onStatusChange(task.id, e.target.value);
  };

  return (
    <article className={`task-card${severity ? ` task-card--${severity}` : ''}`}>
      <header className="task-card__header">
        <h3 className="task-card__title">{task.title}</h3>
        <StatusBadge status={task.status} />
      </header>

      {task.description && (
        <p className="task-card__description">{task.description}</p>
      )}

      <div className="task-card__meta">
        <span className={`task-card__due${severity ? ` task-card__due--${severity}` : ''}`}>
          {severity === 'overdue' && <span className="icon" aria-hidden>⚠ </span>}
          Due: {formatDue(task.due_date)}
        </span>
        <span className="task-card__created">
          Created: {format(parseISO(task.created_at), 'dd MMM yyyy')}
        </span>
      </div>

      <div className="task-card__actions">
        <select
          className="input select select--inline"
          value={task.status}
          onChange={handleStatusChange}
          aria-label="Change status"
        >
          {STATUSES.map((s) => (
            <option key={s.value} value={s.value}>{s.label}</option>
          ))}
        </select>

        <div className="task-card__buttons">
          <button className="btn btn--sm btn--secondary" onClick={() => onEdit(task)}>
            Edit
          </button>
          <button
            className="btn btn--sm btn--danger"
            onClick={() => onDelete(task.id)}
            disabled={deleting}
          >
            {deleting ? '…' : 'Delete'}
          </button>
        </div>
      </div>
    </article>
  );
}
