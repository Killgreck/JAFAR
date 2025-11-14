import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

interface CuratorRouteProps {
  children: React.ReactNode;
}

/**
 * Protected route component that only allows curator or admin users.
 * Redirects non-curator users to the dashboard.
 */
export function CuratorRoute({ children }: CuratorRouteProps) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center">
        <div className="text-gray-400">Cargando...</div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (user.role !== 'curator' && user.role !== 'admin') {
    return <Navigate to="/dashboard" replace />;
  }

  // Check if curator is approved
  if (user.role === 'curator' && user.curatorStatus !== 'approved') {
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
}
