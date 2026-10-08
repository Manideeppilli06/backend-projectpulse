import { useDraggable, useDroppable } from '@dnd-kit/core';

function formatDate(value) {
  if (!value) return null;
  const date = new Date(`${value}T00:00:00`);
  return date.toLocaleDateString(undefined, { day: 'numeric', month: 'short' });
}

function formatPriority(priority) {
  return priority.charAt(0) + priority.slice(1).toLowerCase();
}

export function TaskCardView({ task, className = '' }) {
  const due = formatDate(task.dueDate);

  return (
    <div className={`task ${className}`}>
      <p className="task-title">{task.title}</p>
      <div className="task-meta">
        <span className={`prio prio-${task.priority}`}>{formatPriority(task.priority)}</span>
        {due && <span className="task-due muted">{due}</span>}
        {task.assigneeName && (
          <span className="avatar avatar-sm" title={task.assigneeName}>
            {task.assigneeName.charAt(0).toUpperCase()}
          </span>
        )}
      </div>
    </div>
  );
}

export default function TaskCard({ task }) {
  const id = `task-${task.id}`;
  const drag = useDraggable({ id });
  const drop = useDroppable({ id });

  return (
    <div
      ref={(node) => {
        drag.setNodeRef(node);
        drop.setNodeRef(node);
      }}
      {...drag.listeners}
      {...drag.attributes}
      style={{ opacity: drag.isDragging ? 0.35 : 1 }}
    >
      <TaskCardView task={task} />
    </div>
  );
}