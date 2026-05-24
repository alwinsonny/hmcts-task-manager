import React, { useState } from 'react';
import toast from 'react-hot-toast';
import { useTasks } from '../hooks/useTasks';
import TaskCard from '../components/TaskCard';
import TaskForm from '../components/TaskForm';
import Modal from '../components/Modal';

const FILTERS = [
  { value: '',            label: 'All Tasks' },
  { value: 'pending',     label: 'Pending' },
  { value: 'in_progress', label: 'In Progress' },
  { value: 'completed',   label: 'Completed' },
  { value: 'cancelled',   label: 'Cancelled' },
];

export default function TasksPage() {
  const [statusFilter, setStatusFilter] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState(null);

  const { tasks, loading, error, createTask, updateTask, updateStatus, deleteTask } = useTasks(statusFilter);

  const openCreate = () => { setEditingTask(null); setModalOpen(true); };
  const openEdit   = (task) => { setEditingTask(task); setModalOpen(true); };
  const closeModal = () => { setModalOpen(false); setEditingTask(null); };

  const handleSubmit = async (payload) => {
    setSubmitting(true);
    try {
      if (editingTask) {
        await updateTask(editingTask.id, payload);
      } else {
        await createTask(payload);
      }
      closeModal();
    } catch (err) {
      toast.error(err.message || 'Something went wrong.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleStatusChange = async (id, status) => {
    try {
      await updateStatus(id, status);
    } catch (err) {
      toast.error(err.message || 'Could not update status.');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this task? This cannot be undone.')) return;
    setDeletingId(id);
    try {
      await deleteTask(id);
    } catch (err) {
      toast.error(err.message || 'Could not delete task.');
    } finally {
      setDeletingId(null);
    }
  };

  const statusCounts = tasks.reduce((acc, t) => {
    acc[t.status] = (acc[t.status] || 0) + 1;
    return acc;
  }, {});

  return (
    <div className="page">
      {/* Header */}
      <header className="page-header">
        <div className="page-header__inner">
          <div className="page-header__brand">
            {/*<span className="hmcts-crown" aria-hidden>👑</span>*/}
            <div>
              <p className="page-header__org">HM Courts &amp; Tribunals Service</p>
              <h1 className="page-header__title">Task Manager</h1>
            </div>
          </div>
          <button className="btn btn--primary btn--lg" onClick={openCreate}>
            + New Task
          </button>
        </div>
      </header>

      <main className="page-content">
        {/* Stats bar */}
        <div className="stats-bar">
          {[
            { label: 'Total',       value: tasks.length,                  mod: '' },
            { label: 'Pending',     value: statusCounts.pending || 0,     mod: 'pending' },
            { label: 'In Progress', value: statusCounts.in_progress || 0, mod: 'in-progress' },
            { label: 'Completed',   value: statusCounts.completed || 0,   mod: 'completed' },
          ].map((s) => (
            <div key={s.label} className={`stat-card${s.mod ? ` stat-card--${s.mod}` : ''}`}>
              <span className="stat-card__value">{s.value}</span>
              <span className="stat-card__label">{s.label}</span>
            </div>
          ))}
        </div>

        {/* Filter tabs */}
        <div className="filter-tabs" role="tablist" aria-label="Filter tasks by status">
          {FILTERS.map((f) => (
            <button
              key={f.value}
              role="tab"
              aria-selected={statusFilter === f.value}
              className={`filter-tab${statusFilter === f.value ? ' filter-tab--active' : ''}`}
              onClick={() => setStatusFilter(f.value)}
            >
              {f.label}
            </button>
          ))}
        </div>

        {/* Task list */}
        {loading && <div className="state-message">Loading tasks…</div>}

        {error && (
          <div className="state-message state-message--error">
            <strong>Error:</strong> {error}
          </div>
        )}

        {!loading && !error && tasks.length === 0 && (
          <div className="state-message state-message--empty">
            <span className="state-message__icon" aria-hidden>📋</span>
            <p>No tasks found.</p>
            <button className="btn btn--primary" onClick={openCreate}>Create your first task</button>
          </div>
        )}

        {!loading && !error && tasks.length > 0 && (
          <div className="task-grid">
            {tasks.map((task) => (
              <TaskCard
                key={task.id}
                task={task}
                onEdit={openEdit}
                onDelete={handleDelete}
                onStatusChange={handleStatusChange}
                deleting={deletingId === task.id}
              />
            ))}
          </div>
        )}
      </main>

      {/* Modal */}
      {modalOpen && (
        <Modal
          title={editingTask ? 'Edit Task' : 'Create New Task'}
          onClose={closeModal}
        >
          <TaskForm
            task={editingTask}
            onSubmit={handleSubmit}
            onCancel={closeModal}
            submitting={submitting}
          />
        </Modal>
      )}
    </div>
  );
}
