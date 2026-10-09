import { useEffect, useState } from 'react';
import { api } from '../api/client';
import { useAuth } from '../context/AuthContext';

function formatTime(value) {
  return new Date(value).toLocaleString(undefined, {
    day: 'numeric',
    month: 'short',
    hour: 'numeric',
    minute: '2-digit',
  });
}

export default function TaskPanel({ task, members, onClose, onUpdated, onDeleted }) {
  const { user } = useAuth();
  const myId = members.find((m) => m.email === user.email)?.userId;

  const [title, setTitle] = useState(task.title);
  const [description, setDescription] = useState(task.description || '');
  const [priority, setPriority] = useState(task.priority);
  const [dueDate, setDueDate] = useState(task.dueDate || '');
  const [assigneeId, setAssigneeId] = useState(task.assigneeId ? String(task.assigneeId) : '');
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const [comments, setComments] = useState([]);
  const [commentsLoading, setCommentsLoading] = useState(true);
  const [newComment, setNewComment] = useState('');
  const [commentError, setCommentError] = useState('');
  const [posting, setPosting] = useState(false);

  useEffect(() => {
    function handleKey(event) {
      if (event.key === 'Escape') {
        onClose();
      }
    }
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [onClose]);

  useEffect(() => {
    let cancelled = false;
    api(`/api/tasks/${task.id}/comments`)
      .then((data) => {
        if (!cancelled) setComments(data);
      })
      .catch((err) => {
        if (!cancelled) setCommentError(err.message);
      })
      .finally(() => {
        if (!cancelled) setCommentsLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [task.id]);

  async function save(event) {
    event.preventDefault();
    setError('');
    setMessage('');
    setSaving(true);
    try {
      const updated = await api(`/api/tasks/${task.id}`, {
        method: 'PUT',
        body: {
          title,
          description,
          priority,
          dueDate: dueDate || null,
          assigneeId: assigneeId ? Number(assigneeId) : null,
        },
      });
      onUpdated(updated);
      setMessage('Saved');
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  async function removeTask() {
    if (!window.confirm('Delete this task and its comments?')) return;
    try {
      await api(`/api/tasks/${task.id}`, { method: 'DELETE' });
      onDeleted(task.id);
    } catch (err) {
      setError(err.message);
    }
  }

  async function postComment(event) {
    event.preventDefault();
    if (!newComment.trim()) return;
    setCommentError('');
    setPosting(true);
    try {
      const created = await api(`/api/tasks/${task.id}/comments`, {
        method: 'POST',
        body: { content: newComment },
      });
      setComments((prev) => [...prev, created]);
      setNewComment('');
    } catch (err) {
      setCommentError(err.message);
    } finally {
      setPosting(false);
    }
  }

  async function removeComment(id) {
    setCommentError('');
    try {
      await api(`/api/comments/${id}`, { method: 'DELETE' });
      setComments((prev) => prev.filter((c) => c.id !== id));
    } catch (err) {
      setCommentError(err.message);
    }
  }

  return (
    <>
      <div className="panel-overlay" onClick={onClose} />
      <aside className="panel">
        <div className="panel-head">
          <span className="muted">Task details</span>
          <button className="panel-close" onClick={onClose} title="Close">
            ×
          </button>
        </div>

        <div className="panel-body">
          <form className="stack" onSubmit={save}>
            <input
              className="input title-input"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Task title"
              required
            />

            <div>
              <label className="label" htmlFor="t-desc">Description</label>
              <textarea
                id="t-desc"
                className="input"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                maxLength={2000}
                placeholder="Add more detail..."
              />
            </div>

            <div className="field-row">
              <div>
                <label className="label" htmlFor="t-prio">Priority</label>
                <select
                  id="t-prio"
                  className="input"
                  value={priority}
                  onChange={(e) => setPriority(e.target.value)}
                >
                  <option value="LOW">Low</option>
                  <option value="MEDIUM">Medium</option>
                  <option value="HIGH">High</option>
                </select>
              </div>
              <div>
                <label className="label" htmlFor="t-due">Due date</label>
                <input
                  id="t-due"
                  className="input"
                  type="date"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                />
              </div>
            </div>

            <div>
              <label className="label" htmlFor="t-assignee">Assignee</label>
              <select
                id="t-assignee"
                className="input"
                value={assigneeId}
                onChange={(e) => setAssigneeId(e.target.value)}
              >
                <option value="">Unassigned</option>
                {members.map((m) => (
                  <option key={m.userId} value={m.userId}>
                    {m.name}
                  </option>
                ))}
              </select>
            </div>

            {error && <p className="error-text">{error}</p>}
            {message && <p className="success-text">{message}</p>}

            <div className="panel-footer">
              <button type="button" className="btn btn-ghost" onClick={removeTask}>
                Delete task
              </button>
              <button type="submit" className="btn btn-primary" disabled={saving}>
                {saving ? 'Saving...' : 'Save changes'}
              </button>
            </div>
          </form>

          <div className="divider" />

          <h3>Comments</h3>
          <div className="stack" style={{ marginTop: 12 }}>
            {commentsLoading && <p className="muted">Loading comments...</p>}
            {!commentsLoading && comments.length === 0 && (
              <p className="muted">No comments yet. Start the conversation.</p>
            )}

            {comments.map((c) => (
              <div key={c.id} className="comment">
                <span className="avatar avatar-sm" style={{ marginLeft: 0 }}>
                  {c.authorName.charAt(0).toUpperCase()}
                </span>
                <div className="comment-body">
                  <div className="comment-head">
                    <strong>{c.authorName}</strong>
                    <span className="muted">{formatTime(c.createdAt)}</span>
                    {c.authorId === myId && (
                      <button className="link-btn" onClick={() => removeComment(c.id)}>
                        Delete
                      </button>
                    )}
                  </div>
                  <p className="comment-text">{c.content}</p>
                </div>
              </div>
            ))}

            <form className="stack" onSubmit={postComment}>
              <textarea
                className="input"
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                maxLength={1000}
                placeholder="Write a comment..."
              />
              {commentError && <p className="error-text">{commentError}</p>}
              <div>
                <button type="submit" className="btn btn-primary" disabled={posting}>
                  {posting ? 'Posting...' : 'Comment'}
                </button>
              </div>
            </form>
          </div>
        </div>
      </aside>
    </>
  );
}