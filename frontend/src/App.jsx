import { Navigate, Route, Routes } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import AppLayout from './components/AppLayout';
import BoardPage from './pages/BoardPage';
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import SetupCheck from './pages/SetupCheck';
import WorkspacePage from './pages/WorkspacePage';

function ProtectedRoute({ children }) {
  const { user } = useAuth();
  return user ? children : <Navigate to="/login" replace />;
}

function PublicRoute({ children }) {
  const { user } = useAuth();
  return user ? <Navigate to="/" replace /> : children;
}

export default function App() {
  return (
    <Routes>
      <Route path="/setup-check" element={<SetupCheck />} />
      <Route path="/login" element={<PublicRoute><Login /></PublicRoute>} />
      <Route path="/register" element={<PublicRoute><Register /></PublicRoute>} />

      <Route element={<ProtectedRoute><AppLayout /></ProtectedRoute>}>
        <Route path="/" element={<Home />} />
        <Route path="/w/:workspaceId" element={<WorkspacePage />} />
        <Route path="/boards/:boardId" element={<BoardPage />} />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}