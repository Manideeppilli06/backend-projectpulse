import { useEffect, useState } from 'react';
import { Link, useNavigate, useOutletContext, useParams } from 'react-router-dom';
import { api } from '../api/client';
import Modal from '../components/Modal';

export default function WorkspacePage() {
  const { workspaceId } = useParams();
  const { workspaces, loading: workspacesLoading } = useOutletContext();
  const navigate = useNavigate();
  const workspace = workspaces.find((w) => String(w.id) === workspaceId);

  const [boards, setBoards] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');

  const [showBoard, setShowBoard] = useState(false);
  const [boardName, setBoardName] = useState('');
  const [showInvite, setShowInvite] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    api(`/api/workspaces/${workspaceId}/boards`)
      .then((data) => {
        if (!cancelled) {
          setBoards(data);
          setLoadError('');
        }
      })
      .catch((err) => {
        if (!cancelled) setLoadError(err.message);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [workspaceId]);

  function openBoardModal() {
    setBoardName('');
    setError('');
    setShowBoard(true);
  }

  function openInviteModal() {
    setInviteEmail('');
    setError('');
    setSuccess('');
    setShowInvite(true);
  }

  async function createBoard(event) {
    event.preventDefault();
    setError('');
    setSaving(true);
    try {
      const created = await api(`/api/workspaces/${workspaceId}/boards`, {
        method: 'POST',
        body: { name: boardName },
      });
      navigate(`/boards/${created.id}`);
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  async function invite(event) {
    event.preventDefault();
    setError('');
    setSuccess('');
    setSaving(true);
    try {
      await api(`/api/workspaces/${workspaceId}/members`, {
        method: 'POST',
        body: { email: inviteEmail },
      });
      setSuccess(`${inviteEmail} was added to the workspace.`);
      setInviteEmail('');
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  if (!workspacesLoading && !workspace) {
    return (
      <div className="empty">
        <h3>Workspace not found</h3>
        <p className="muted">It may not exist, or you may not be a member.</p>
        <Link to="/" className="btn btn-ghost">Back to home</Link>
      </div>
    );
  }

  const isOwner = workspace?.role === 'OWNER';

  return (
    <>
      <div className="page-header">
        <div>
          <h1>{workspace?.name}</h1>
          <p className="muted">{workspace?.description || 'No description'}</p>
        </div>
        <div className="page-actions">
          {isOwner && (
            <button className="btn btn-ghost" onClick={openInviteModal}>
              Invite member
            </button>
          )}
          <button className="btn btn-primary" onClick={openBoardModal}>
            New board
          </button>
        </div>
      </div>

      {loadError && <p className="error-text">{loadError}</p>}

      {loading ? (
        <p className="muted">Loading boards...</p>
      ) : boards.length === 0 ? (
        <div className="empty">
          <h3>No boards yet</h3>
          <p className="muted">A new board comes with To Do, In Progress and Done columns.</p>
          <button className="btn btn-primary" onClick={openBoardModal}>
            Create your first board
          </button>
        </div>
      ) : (
        <div className="grid">
          {boards.map((b) => (
            <Link key={b.id} to={`/boards/${b.id}`} className="tile">
              <h3>{b.name}</h3>
              <p className="muted">Open board</p>
            </Link>
          ))}
        </div>
      )}

      {showBoard && (
        <Modal title="New board" onClose={() => setShowBoard(false)}>
          <form className="stack" onSubmit={createBoard}>
            <div>
              <label className="label" htmlFor="board-name">Board name</label>
              <input
                id="board-name"
                className="input"
                value={boardName}
                onChange={(e) => setBoardName(e.target.value)}
                placeholder="e.g. Sprint 1"
                required
                autoFocus
              />
            </div>
            {error && <p className="error-text">{error}</p>}
            <div className="modal-actions">
              <button type="button" className="btn btn-ghost" onClick={() => setShowBoard(false)}>
                Cancel
              </button>
              <button type="submit" className="btn btn-primary" disabled={saving}>
                {saving ? 'Creating...' : 'Create board'}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {showInvite && (
        <Modal title="Invite a member" onClose={() => setShowInvite(false)}>
          <form className="stack" onSubmit={invite}>
            <div>
              <label className="label" htmlFor="invite-email">Their email</label>
              <input
                id="invite-email"
                className="input"
                type="email"
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
                placeholder="friend@example.com"
                required
                autoFocus
              />
              <p className="muted" style={{ marginTop: 6, fontSize: 13 }}>
                They need to have registered an account first.
              </p>
            </div>
            {error && <p className="error-text">{error}</p>}
            {success && <p className="success-text">{success}</p>}
            <div className="modal-actions">
              <button type="button" className="btn btn-ghost" onClick={() => setShowInvite(false)}>
                Close
              </button>
              <button type="submit" className="btn btn-primary" disabled={saving}>
                {saving ? 'Adding...' : 'Add member'}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </>
  );
}