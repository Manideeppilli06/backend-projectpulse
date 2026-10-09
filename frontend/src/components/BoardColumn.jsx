import { useState } from 'react';
import { useDroppable } from '@dnd-kit/core';
import { api } from '../api/client';
import TaskCard from './TaskCard';

export default function BoardColumn({ list, tasks, onTaskCreated, onOpenTask }) {
  const { setNodeRef } = useDroppable({ id: `list-${list.id}` });
  const [adding, setAdding] = useState(false);
  const [title, setTitle] = useState('');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  async function addTask(event) {
    event.preventDefault();
    if (!title.trim()) return;
    setError('');
    setSaving(true);
    try {
      const created = await api(`/api/lists/${list.id}/tasks`, {
        method: 'POST',
        body: { title },
      });
      onTaskCreated(created);
      setTitle('');
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  function cancel() {
    setAdding(false);
    setTitle('');
    setError('');
  }

  return (
    <div className="column">
      <div className="column-head">
        <h3>{list.name}</h3>
        <span className="badge">{tasks.length}</span>
      </div>

      <div className="column-body" ref={setNodeRef}>
        {tasks.map((task) => (
          <TaskCard key={task.id} task={task} onOpen={onOpenTask} />
        ))}
      </div>

      {adding ? (
        <form className="add-form" onSubmit={addTask}>
          <input
            className="input"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Task title"
            autoFocus
          />
          {error && <p className="error-text">{error}</p>}
          <div className="add-form-actions">
            <button type="submit" className="btn btn-primary" disabled={saving}>
              {saving ? 'Adding...' : 'Add'}
            </button>
            <button type="button" className="btn btn-ghost" onClick={cancel}>
              Done
            </button>
          </div>
        </form>
      ) : (
        <button className="add-task" onClick={() => setAdding(true)}>
          + Add task
        </button>
      )}
    </div>
  );
}