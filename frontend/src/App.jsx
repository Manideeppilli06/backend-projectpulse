import { Navigate, Route, Routes } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import SetupCheck from './pages/SetupCheck';

function ProtectedRoute({ children }) {
  const { user } = useAuth();
  return user ? children : <Navigate to="/login" replace />;
}

function Placeholder({ title }) {
  return (
    <div className="center-screen">
      <div>
        <h1>{title}</h1>
        <p className="muted">Coming in the next step.</p>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <Routes>
      <Route path="/setup-check" element={<SetupCheck />} />
      <Route path="/login" element={<Placeholder title="Login" />} />
      <Route path="/register" element={<Placeholder title="Register" />} />
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <Placeholder title="Home" />
          </ProtectedRoute>
        }
      />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}