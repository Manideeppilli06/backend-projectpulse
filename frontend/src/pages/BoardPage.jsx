import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { api } from '../api/client';

export default function BoardPage() {
  const { boardId } = useParams();
  const [board, setBoard] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;
    api(`/api/boards/${boardId}`)
      .then((data) => {
        if (!cancelled) {
          setBoard(data);
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

      <div className="columns">
        {board.lists.map((list) => (
          <div key={list.id} className="column">
            <h3>{list.name}</h3>
            <p className="muted">Tasks arrive in the next step.</p>
          </div>
        ))}
      </div>
    </>
  );
}