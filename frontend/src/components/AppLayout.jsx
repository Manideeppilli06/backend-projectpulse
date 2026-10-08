import { useCallback, useEffect, useState } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { api } from '../api/client';
import { useAuth } from '../context/AuthContext';
import Modal from './Modal';
import './AppLayout.css';

export default function AppLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [workspaces, setWorkspaces] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  const loadWorkspaces = useCallback(async () => {
    try {
      setWorkspaces(await api('/api/workspaces'));
    } catch {
      setWorkspaces([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadWorkspaces();
  }, [loadWorkspaces]);

  function openCreate() {
    setName('');
    setDescription('');
    setError('');
    setShowCreate(true);
  }

  async function createWorkspace(event) {
    event.preventDefault();
    setError('');
    setSaving(true);
    try {
      const created = await api('/api/workspaces', {
        method: 'POST',
        body: { name, description },
      });
      await loadWorkspaces();
      setShowCreate(false);
      navigate(`/w/${created.id}`);
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="shell">
      <aside className="sidebar">
        <NavLink to="/" className="side-logo">
          <span className="side-mark">P</span>
          ProjectPulse
        </NavLink>

        <div className="side-section">
          <NavLink to="/" end className="side-link">
            Home
          </NavLink>
        </div>

        <div className="side-section">
          <div className="side-label">
            Workspaces
            <button className="side-add" onClick={openCreate} title="New workspace">
              +
            </button>
          </div>

          {!loading && workspaces.length === 0 && (
            <p className="side-empty muted">No workspaces yet</p>
          )}

          {workspaces.map((w) => (
            <NavLink key={w.id} to={`/w/${w.id}`} className="side-link">
              <span className="side-dot" />
              {w.name}
            </NavLink>
          ))}
        </div>

        <div className="side-user">
          <span className="avatar">{user.name.charAt(0).toUpperCase()}</span>
          <div className="side-user-info">
            <div className="side-user-name">{user.name}</div>
            <button className="side-logout" onClick={logout}>
              Log out
            </button>
          </div>
        </div>
      </aside>

      <main className="main">
        <Outlet context={{ workspaces, loading, openCreate }} />
      </main>

      {showCreate && (
        <Modal title="New workspace" onClose={() => setShowCreate(false)}>
          <form className="stack" onSubmit={createWorkspace}>
            <div>
              <label className="label" htmlFor="ws-name">Name</label>
              <input
                id="ws-name"
                className="input"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Final Year Project"
                required
                autoFocus
              />
            </div>
            <div>
              <label className="label" htmlFor="ws-desc">Description (optional)</label>
              <textarea
                id="ws-desc"
                className="input"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>
            {error && <p className="error-text">{error}</p>}
            <div className="modal-actions">
              <button type="button" className="btn btn-ghost" onClick={() => setShowCreate(false)}>
                Cancel
              </button>
              <button type="submit" className="btn btn-primary" disabled={saving}>
                {saving ? 'Creating...' : 'Create'}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}