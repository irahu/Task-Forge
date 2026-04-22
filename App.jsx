import React, { useState, useMemo, useCallback, useEffect } from 'react';
import Header from './components/Header';
import Stats from './components/Stats';
import ProgressBar from './components/ProgressBar';
import TaskInput from './components/TaskInput';
import FilterBar from './components/FilterBar';
import TaskList from './components/TaskList';
import Footer from './components/Footer';
import Toast from './components/Toast';
import { useLocalStorage } from './hooks/useLocalStorage';
import './index.css';

// ✅ Read API key from .env (create .env with: VITE_ANTHROPIC_KEY=your-key)
const API_KEY = import.meta.env.VITE_ANTHROPIC_KEY;

function normalizeTasks(value) {
  if (!Array.isArray(value)) return [];
  return value
    .filter((task) => task && typeof task === 'object')
    .map((task, index) => ({
      id: typeof task.id === 'number' || typeof task.id === 'string'
        ? task.id : Date.now() + index,
      text: typeof task.text === 'string' ? task.text : 'Untitled task',
      cat: task.cat === 'personal' ? 'personal' : 'work',
      done: Boolean(task.done),
      created: typeof task.created === 'number' && Number.isFinite(task.created)
        ? task.created : Date.now(),
    }));
}

export default function App() {
  const [tasks, setTasks] = useLocalStorage('taskforge_tasks', []);
  const [filter, setFilter] = useState('all');
  const [toast, setToast] = useState({ message: '', visible: false });
  const safeTasks = useMemo(() => normalizeTasks(tasks), [tasks]);

  const showToast = useCallback((msg) => {
    setToast({ message: msg, visible: true });
  }, []);

  useEffect(() => {
    if (!toast.visible) return undefined;
    const timer = setTimeout(() => {
      setToast((current) => ({ ...current, visible: false }));
    }, 2200);
    return () => clearTimeout(timer);
  }, [toast.visible, toast.message]);

  const handleAdd = useCallback((text, category) => {
    const timestamp = Date.now();
    setTasks((prev) => [{ id: timestamp, text, cat: category, done: false, created: timestamp }, ...prev]);
    showToast('Task added');
  }, [setTasks, showToast]);

  const handleToggle = useCallback((id) => {
    setTasks((prev) => prev.map((task) => {
      if (task.id !== id) return task;
      const updated = { ...task, done: !task.done };
      if (updated.done) showToast('Task crushed');
      return updated;
    }));
  }, [setTasks, showToast]);

  const handleDelete = useCallback((id) => {
    setTasks((prev) => prev.filter((task) => task.id !== id));
    showToast('Task removed');
  }, [setTasks, showToast]);

  const handleClearDone = useCallback(() => {
    setTasks((prev) => {
      const doneCount = prev.filter((task) => task.done).length;
      if (!doneCount) return prev;
      showToast(`Cleared ${doneCount} completed task${doneCount !== 1 ? 's' : ''}`);
      return prev.filter((task) => !task.done);
    });
  }, [setTasks, showToast]);

  const stats = useMemo(() => {
    const total = safeTasks.length;
    const done = safeTasks.filter((task) => task.done).length;
    const active = total - done;
    const pct = total ? Math.round((done / total) * 100) : 0;
    return { total, done, active, pct };
  }, [safeTasks]);

  const filteredTasks = useMemo(() => {
    switch (filter) {
      case 'active':   return safeTasks.filter((t) => !t.done);
      case 'done':     return safeTasks.filter((t) => t.done);
      case 'work':     return safeTasks.filter((t) => t.cat === 'work');
      case 'personal': return safeTasks.filter((t) => t.cat === 'personal');
      default:         return safeTasks;
    }
  }, [safeTasks, filter]);

  return (
    <div className="app-shell">
      <main className="app">
        <Header />
        <Stats total={stats.total} active={stats.active} done={stats.done} />
        <ProgressBar percentage={stats.pct} />
        <TaskInput onAdd={handleAdd} />
        <FilterBar activeFilter={filter} onFilterChange={setFilter} />
        <TaskList
          tasks={filteredTasks}
          filter={filter}
          onToggle={handleToggle}
          onDelete={handleDelete}
        />
        <Footer activeCount={stats.active} onClearDone={handleClearDone} />
      </main>

      {/* ✅ Fixed sidebar lives outside <main> */}
      <Toast message={toast.message} visible={toast.visible} />
    </div>
  );
}