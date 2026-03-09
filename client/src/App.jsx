import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Layout from './components/layout/Layout';
import Landing from './pages/Landing';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import HotspotMap from './pages/HotspotMap';
import PredictionTool from './pages/PredictionTool';
import DataUpload from './pages/DataUpload';
import AccidentData from './pages/AccidentData';

const PrivateRoute = ({ children, adminOnly = false }) => {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  if (adminOnly && user.role !== 'admin') return <Navigate to="/dashboard" replace />;
  return children;
};

const PublicRoute = ({ children }) => {
  const { user } = useAuth();
  if (user) return <Navigate to="/dashboard" replace />;
  return children;
};

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/login" element={<PublicRoute><Login /></PublicRoute>} />
          <Route path="/register" element={<PublicRoute><Register /></PublicRoute>} />
          <Route path="/dashboard" element={<PrivateRoute><Layout><Dashboard /></Layout></PrivateRoute>} />
          <Route path="/map" element={<PrivateRoute><Layout><HotspotMap /></Layout></PrivateRoute>} />
          <Route path="/predict" element={<PrivateRoute><Layout><PredictionTool /></Layout></PrivateRoute>} />
          <Route path="/data" element={<PrivateRoute><Layout><AccidentData /></Layout></PrivateRoute>} />
          <Route path="/upload" element={<PrivateRoute adminOnly><Layout><DataUpload /></Layout></PrivateRoute>} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
