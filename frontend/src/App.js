import React from 'react';
import { Toaster } from 'react-hot-toast';
import TasksPage from './pages/TasksPage';
import './styles.css';

export default function App() {
  return (
    <>
      <TasksPage />
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 3500,
          style: { borderRadius: '6px', fontSize: '14px' },
        }}
      />
    </>
  );
}
