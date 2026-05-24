import React from 'react';

const STATUS_CONFIG = {
  pending:     { label: 'Pending',     className: 'badge badge--pending' },
  in_progress: { label: 'In Progress', className: 'badge badge--in-progress' },
  completed:   { label: 'Completed',   className: 'badge badge--completed' },
  cancelled:   { label: 'Cancelled',   className: 'badge badge--cancelled' },
};

export default function StatusBadge({ status }) {
  const config = STATUS_CONFIG[status] || { label: status, className: 'badge' };
  return <span className={config.className}>{config.label}</span>;
}
