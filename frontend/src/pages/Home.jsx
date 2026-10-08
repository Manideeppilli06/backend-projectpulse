import { Link, useOutletContext } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Home() {
  const { user } = useAuth();
  const { workspaces, loading, openCreate } = useOutletContext();

  return (
    <>
      <div className="page-header">
        <div>
          <h1>Welcome, {user.name}</h1>
          <p className="muted">Choose a workspace or create a new one.</p>
        </div>
        <button className="btn btn-primary" onClick={openCreate}>
          New workspace
        </button>
      </div>

      {loading ? (
        <p className="muted">Loading...</p>
      ) : workspaces.length === 0 ? (
        <div className="empty">
          <h3>No workspaces yet</h3>
          <p className="muted">A workspace is where your team's boards live.</p>
          <button className="btn btn-primary" onClick={openCreate}>
            Create your first workspace
          </button>
        </div>
      ) : (
        <div className="grid">
          {workspaces.map((w) => (
            <Link key={w.id} to={`/w/${w.id}`} className="tile">
              <h3>{w.name}</h3>
              <p className="muted">{w.description || 'No description'}</p>
              <div className="tile-meta">
                <span className="badge">{w.role === 'OWNER' ? 'Owner' : 'Member'}</span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </>
  );
}