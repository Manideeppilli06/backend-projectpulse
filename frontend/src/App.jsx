import { Navigate, Route, Routes } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import Login from './pages/Login';
import Register from './pages/Register';
import SetupCheck from './pages/SetupCheck';

function ProtectedRoute({ children }) {
  const { user } = useAuth();
  return user ? children : <Navigate to="/login" replace />;
}

function PublicRoute({ children }) {
  const { user } = useAuth();
  return user ? <Navigate to="/" replace /> : children;
}

function TempHome() {
  const { user, logout } = useAuth();
  return (
    <div className="center-screen">
      <div className="stack">
        <h1>Welcome, {user.name}</h1>
        <p className="muted">{user.email}</p>
        <p className="muted">Workspaces are coming in the next step.</p>
        <button className="btn btn-ghost" onClick={logout}>
          Log out
        </button>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <Routes>
      <Route path="/setup-check" element={<SetupCheck />} />
      <Route path="/login" element={<PublicRoute><Login /></PublicRoute>} />
      <Route path="/register" element={<PublicRoute><Register /></PublicRoute>} />
      <Route path="/" element={<ProtectedRoute><TempHome /></ProtectedRoute>} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}