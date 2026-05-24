import { useState, useEffect, useCallback } from 'react';
import taskService from '../services/taskService';
import toast from 'react-hot-toast';

export function useTasks(statusFilter = '') {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchTasks = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await taskService.getAll(statusFilter || undefined);
      setTasks(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [statusFilter]);

  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  const createTask = async (payload) => {
    const task = await taskService.create(payload);
    setTasks((prev) => [...prev, task].sort((a, b) => new Date(a.due_date) - new Date(b.due_date)));
    toast.success('Task created successfully.');
    return task;
  };

  const updateTask = async (id, payload) => {
    const updated = await taskService.update(id, payload);
    setTasks((prev) => prev.map((t) => (t.id === id ? updated : t)));
    toast.success('Task updated successfully.');
    return updated;
  };

  const updateStatus = async (id, status) => {
    const updated = await taskService.updateStatus(id, status);
    setTasks((prev) => prev.map((t) => (t.id === id ? updated : t)));
    toast.success('Status updated.');
    return updated;
  };

  const deleteTask = async (id) => {
    await taskService.delete(id);
    setTasks((prev) => prev.filter((t) => t.id !== id));
    toast.success('Task deleted.');
  };

  return { tasks, loading, error, fetchTasks, createTask, updateTask, updateStatus, deleteTask };
}
