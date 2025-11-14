import type { ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

interface LayoutProps {
  children: ReactNode;
}

export function Layout({ children }: LayoutProps) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-gray-900">
      <nav className="bg-gray-800 shadow-lg border-b border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-8">
              <h1
                className="text-2xl font-bold text-blue-500 cursor-pointer"
                onClick={() => navigate('/dashboard')}
              >
                JAFAR
              </h1>
              {user && (
                <div className="hidden md:flex space-x-4">
                  <button
                    onClick={() => navigate('/dashboard')}
                    className="text-gray-300 hover:text-white transition-colors"
                  >
                    Dashboard
                  </button>
                  <button
                    onClick={() => navigate('/bets')}
                    className="text-gray-300 hover:text-white transition-colors"
                  >
                    Predicciones
                  </button>
                  <button
                    onClick={() => navigate('/events')}
                    className="text-gray-300 hover:text-white transition-colors"
                  >
                    Eventos
                  </button>
                  <button
                    onClick={() => navigate('/profile')}
                    className="text-gray-300 hover:text-white transition-colors"
                  >
                    Perfil
                  </button>
                  <button
                    onClick={() => navigate('/transactions')}
                    className="text-gray-300 hover:text-white transition-colors"
                  >
                    Transacciones
                  </button>
                  {(user.role === 'curator' || user.role === 'admin') && user.curatorStatus === 'approved' && (
                    <button
                      onClick={() => navigate('/curator/panel')}
                      className="text-purple-400 hover:text-purple-300 transition-colors font-medium"
                    >
                      Panel de Curador
                    </button>
                  )}
                  {user.role === 'admin' && (
                    <>
                      <button
                        onClick={() => navigate('/admin/users')}
                        className="text-red-400 hover:text-red-300 transition-colors font-medium"
                      >
                        Admin: Usuarios
                      </button>
                      <button
                        onClick={() => navigate('/admin/events')}
                        className="text-red-400 hover:text-red-300 transition-colors font-medium"
                      >
                        Admin: Eventos
                      </button>
                    </>
                  )}
                </div>
              )}
            </div>

            {user && (
              <div className="flex items-center space-x-4">
                <div className="text-gray-300">
                  Hola, <span className="font-medium text-white">{user.username}</span>
                  {user.role && (
                    <span
                      className={`ml-2 px-2 py-1 text-xs rounded ${
                        user.role === 'admin'
                          ? 'bg-red-900 text-red-200'
                          : user.role === 'curator'
                          ? 'bg-purple-900 text-purple-200'
                          : 'bg-blue-900 text-blue-200'
                      }`}
                    >
                      {user.role === 'admin' ? 'Admin' : user.role === 'curator' ? 'Curador' : 'Usuario'}
                    </span>
                  )}
                </div>
                <button
                  onClick={handleLogout}
                  className="btn-secondary"
                >
                  Cerrar Sesión
                </button>
              </div>
            )}
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>
    </div>
  );
}
