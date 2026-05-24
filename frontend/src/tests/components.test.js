import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import StatusBadge from '../components/StatusBadge';
import TaskForm from '../components/TaskForm';
import Modal from '../components/Modal';

// ── StatusBadge ──────────────────────────────────────────
describe('StatusBadge', () => {
  test('renders Pending badge', () => {
    render(<StatusBadge status="pending" />);
    expect(screen.getByText('Pending')).toBeInTheDocument();
    expect(screen.getByText('Pending')).toHaveClass('badge--pending');
  });

  test('renders In Progress badge', () => {
    render(<StatusBadge status="in_progress" />);
    expect(screen.getByText('In Progress')).toBeInTheDocument();
  });

  test('renders Completed badge', () => {
    render(<StatusBadge status="completed" />);
    expect(screen.getByText('Completed')).toHaveClass('badge--completed');
  });

  test('renders Cancelled badge', () => {
    render(<StatusBadge status="cancelled" />);
    expect(screen.getByText('Cancelled')).toBeInTheDocument();
  });

  test('renders unknown status as-is', () => {
    render(<StatusBadge status="unknown_status" />);
    expect(screen.getByText('unknown_status')).toBeInTheDocument();
  });
});

// ── Modal ────────────────────────────────────────────────
describe('Modal', () => {
  test('renders title and children', () => {
    render(
      <Modal title="Test Modal" onClose={() => {}}>
        <p>Modal content</p>
      </Modal>
    );
    expect(screen.getByText('Test Modal')).toBeInTheDocument();
    expect(screen.getByText('Modal content')).toBeInTheDocument();
  });

  test('calls onClose when close button clicked', () => {
    const onClose = jest.fn();
    render(<Modal title="T" onClose={onClose}><span /></Modal>);
    fireEvent.click(screen.getByLabelText('Close'));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  test('calls onClose when backdrop clicked', () => {
    const onClose = jest.fn();
    render(<Modal title="T" onClose={onClose}><span /></Modal>);
    // Click the backdrop (the dialog role element)
    fireEvent.click(screen.getByRole('dialog'));
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});

// ── TaskForm ─────────────────────────────────────────────
describe('TaskForm', () => {
  const noop = () => {};

  test('renders all form fields', () => {
    render(<TaskForm onSubmit={noop} onCancel={noop} submitting={false} />);
    expect(screen.getByLabelText(/title/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/description/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/status/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/due date/i)).toBeInTheDocument();
  });

  test('shows validation errors when submitted empty', () => {
    render(<TaskForm onSubmit={noop} onCancel={noop} submitting={false} />);
    fireEvent.click(screen.getByRole('button', { name: /create task/i }));
    expect(screen.getByText('Title is required.')).toBeInTheDocument();
    expect(screen.getByText('Due date is required.')).toBeInTheDocument();
  });

  test('calls onCancel when cancel button is clicked', () => {
    const onCancel = jest.fn();
    render(<TaskForm onSubmit={noop} onCancel={onCancel} submitting={false} />);
    fireEvent.click(screen.getByRole('button', { name: /cancel/i }));
    expect(onCancel).toHaveBeenCalledTimes(1);
  });

  test('shows "Save Changes" when editing an existing task', () => {
    const task = {
      id: 1,
      title: 'Existing',
      description: '',
      status: 'pending',
      due_date: new Date(Date.now() + 86400000).toISOString(),
    };
    render(<TaskForm task={task} onSubmit={noop} onCancel={noop} submitting={false} />);
    expect(screen.getByRole('button', { name: /save changes/i })).toBeInTheDocument();
  });

  test('disables buttons when submitting', () => {
    render(<TaskForm onSubmit={noop} onCancel={noop} submitting={true} />);
    expect(screen.getByRole('button', { name: /saving/i })).toBeDisabled();
    expect(screen.getByRole('button', { name: /cancel/i })).toBeDisabled();
  });
});
