import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  closestCorners,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import { api } from '../api/client';
import BoardColumn from '../components/BoardColumn';
import { TaskCardView } from '../components/TaskCard';
import TaskPanel from '../components/TaskPanel';
import './BoardPage.css';

function byList(tasks, listId) {
  return tasks
    .filter((t) => t.listId === listId)
    .sort((a, b) => a.position - b.position);
}

function applyMove(tasks, taskId, targetListId, index) {
  const moving = tasks.find((t) => t.id === taskId);
  const others = tasks.filter((t) => t.id !== taskId);
  const sourceListId = moving.listId;

  const target = byList(others, targetListId);
  target.splice(index, 0, { ...moving, listId: targetListId });
  const targetNumbered = target.map((t, i) => ({ ...t, position: i }));

  const sourceNumbered =
    sourceListId === targetListId
      ? []
      : byList(others, sourceListId).map((t, i) => ({ ...t, position: i }));

  const untouched = others.filter(
    (t) => t.listId !== targetListId && t.listId !== sourceListId
  );
  return [...untouched, ...sourceNumbered, ...targetNumbered];
}

export default function BoardPage() {
  const { boardId } = useParams();
  const [board, setBoard] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [members, setMembers] = useState([]);
  const [error, setError] = useState('');
  const [actionError, setActionError] = useState('');
  const [activeTask, setActiveTask] = useState(null);
  const [selectedId, setSelectedId] = useState(null);
  const [addingList, setAddingList] = useState(false);
  const [listName, setListName] = useState('');
  const suppressClick = useRef(false);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } })
  );

  useEffect(() => {
    let cancelled = false;
    setBoard(null);
    setTasks([]);
    setSelectedId(null);
    Promise.all([api(`/api/boards/${boardId}`), api(`/api/boards/${boardId}/tasks`)])
      .then(async ([boardData, taskData]) => {
        const memberData = await api(`/api/workspaces/${boardData.workspaceId}/members`);
        if (!cancelled) {
          setBoard(boardData);
          setTasks(taskData);
          setMembers(memberData);
          setError('');
        }
      })
      .catch((err) => {
        if (!cancelled) setError(err.message);
      });
    return () => {
      cancelled = true;
    };
  }, [boardId]);

  const tasksByList = useMemo(() => {
    const groups = {};
    if (board) {
      board.lists.forEach((list) => {
        groups[list.id] = byList(tasks, list.id);
      });
    }
    return groups;
  }, [board, tasks]);

  const selectedTask = tasks.find((t) => t.id === selectedId) || null;

  function reloadTasks() {
    api(`/api/boards/${boardId}/tasks`)
      .then(setTasks)
      .catch((err) => setActionError(err.message));
  }

  function openTask(task) {
    if (suppressClick.current) return;
    setSelectedId(task.id);
  }

  function endDragState() {
    setActiveTask(null);
    setTimeout(() => {
      suppressClick.current = false;
    }, 150);
  }

  function handleDragStart(event) {
    suppressClick.current = true;
    const id = Number(String(event.active.id).replace('task-', ''));
    setActiveTask(tasks.find((t) => t.id === id) || null);
  }

  async function handleDragEnd({ active, over }) {
    endDragState();
    if (!over) return;

    const taskId = Number(String(active.id).replace('task-', ''));
    const moving = tasks.find((t) => t.id === taskId);
    if (!moving) return;

    const overId = String(over.id);
    let targetListId;
    let index;

    if (overId.startsWith('task-')) {
      const overTask = tasks.find((t) => t.id === Number(overId.replace('task-', '')));
      if (!overTask || overTask.id === taskId) return;

      targetListId = overTask.listId;
      const column = byList(tasks, targetListId);
      const without = column.filter((t) => t.id !== taskId);
      const overIndex = without.findIndex((t) => t.id === overTask.id);
      const fromIndex = column.findIndex((t) => t.id === taskId);
      const overOriginal = column.findIndex((t) => t.id === overTask.id);
      const movingDown = moving.listId === targetListId && fromIndex < overOriginal;
      index = movingDown ? overIndex + 1 : overIndex;
    } else {
      targetListId = Number(overId.replace('list-', ''));
      index = byList(tasks, targetListId).filter((t) => t.id !== taskId).length;
    }

    const currentIndex = byList(tasks, moving.listId).findIndex((t) => t.id === taskId);
    if (targetListId === moving.listId && index === currentIndex) return;

    setActionError('');
    setTasks((prev) => applyMove(prev, taskId, targetListId, index));

    try {
      await api(`/api/tasks/${taskId}/move`, {
        method: 'PATCH',
        body: { listId: targetListId, position: index },
      });
    } catch (err) {
      setActionError(err.message);
      reloadTasks();
    }
  }

  function handleTaskCreated(task) {
    setTasks((prev) => [...prev, task]);
  }

  function handleTaskUpdated(updated) {
    setTasks((prev) => prev.map((t) => (t.id === updated.id ? updated : t)));
  }

  function handleTaskDeleted(id) {
    setTasks((prev) => prev.filter((t) => t.id !== id));
    setSelectedId(null);
    reloadTasks();
  }

  async function addList(event) {
    event.preventDefault();
    if (!listName.trim()) return;
    try {
      const created = await api(`/api/boards/${boardId}/lists`, {
        method: 'POST',
        body: { name: listName },
      });
      setBoard((prev) => ({ ...prev, lists: [...prev.lists, created] }));
      setListName('');
      setAddingList(false);
    } catch (err) {
      setActionError(err.message);
    }
  }

  if (error) {
    return (
      <div className="empty">
        <h3>{error}</h3>
        <Link to="/" className="btn btn-ghost">Back to home</Link>
      </div>
    );
  }

  if (!board) {
    return <p className="muted">Loading board...</p>;
  }

  return (
    <>
      <Link to={`/w/${board.workspaceId}`} className="back-link">
        ← Back to workspace
      </Link>
      <div className="page-header">
        <h1>{board.name}</h1>
      </div>

      {actionError && <p className="error-text" style={{ marginBottom: 12 }}>{actionError}</p>}

      <DndContext
        sensors={sensors}
        collisionDetection={closestCorners}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
        onDragCancel={endDragState}
      >
        <div className="columns">
          {board.lists.map((list) => (
            <BoardColumn
              key={list.id}
              list={list}
              tasks={tasksByList[list.id] || []}
              onTaskCreated={handleTaskCreated}
              onOpenTask={openTask}
            />
          ))}

          <div className="column-add-list">
            {addingList ? (
              <form className="add-form" onSubmit={addList}>
                <input
                  className="input"
                  value={listName}
                  onChange={(e) => setListName(e.target.value)}
                  placeholder="List name"
                  autoFocus
                />
                <div className="add-form-actions">
                  <button type="submit" className="btn btn-primary">Add list</button>
                  <button
                    type="button"
                    className="btn btn-ghost"
                    onClick={() => {
                      setAddingList(false);
                      setListName('');
                    }}
                  >
                    Cancel
                  </button>
                </div>
              </form>
            ) : (
              <button className="add-task" onClick={() => setAddingList(true)}>
                + Add list
              </button>
            )}
          </div>
        </div>

        <DragOverlay>
          {activeTask ? <TaskCardView task={activeTask} className="task-overlay" /> : null}
        </DragOverlay>
      </DndContext>

      {selectedTask && (
        <TaskPanel
          key={selectedTask.id}
          task={selectedTask}
          members={members}
          onClose={() => setSelectedId(null)}
          onUpdated={handleTaskUpdated}
          onDeleted={handleTaskDeleted}
        />
      )}
    </>
  );
}