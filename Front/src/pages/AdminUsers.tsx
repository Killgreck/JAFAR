import { useState } from 'react';
import { Layout } from '../components/Layout';
import { adminService } from '../services/admin';
import type { User, BannedUser, UserRole } from '../types';

export function AdminUsers() {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<User[]>([]);
  const [bannedUsers, setBannedUsers] = useState<BannedUser[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showBanned, setShowBanned] = useState(false);

  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      setError('Ingresa un término de búsqueda');
      return;
    }

    try {
      setLoading(true);
      setError('');
      const data = await adminService.searchUsers(searchQuery);
      setSearchResults(data.users);
      setShowBanned(false);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Error al buscar usuarios');
    } finally {
      setLoading(false);
    }
  };

  const loadBannedUsers = async () => {
    try {
      setLoading(true);
      setError('');
      const data = await adminService.getBannedUsers();
      setBannedUsers(data.users);
      setShowBanned(true);
      setSearchResults([]);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Error al cargar usuarios baneados');
    } finally {
      setLoading(false);
    }
  };

  const getRoleBadge = (role?: string) => {
    const styles = {
      admin: 'bg-red-900 text-red-200 border-red-700',
      curator: 'bg-purple-900 text-purple-200 border-purple-700',
      user: 'bg-blue-900 text-blue-200 border-blue-700',
    };

    return (
      <span className={`px-2 py-1 text-xs rounded border ${styles[role as keyof typeof styles] || styles.user}`}>
        {role || 'user'}
      </span>
    );
  };

  const users = showBanned ? bannedUsers : searchResults;

  return (
    <Layout>
      <div className="space-y-6">
        <h1 className="text-3xl font-bold text-gray-100">Gestión de Usuarios</h1>

        <div className="bg-blue-900/20 border border-blue-700 text-blue-200 px-4 py-3 rounded-lg">
          <p className="text-sm">
            Como administrador, puedes ver la lista completa de usuarios y su información. Para gestionar permisos o realizar acciones sobre usuarios, contacta con el administrador del sistema.
          </p>
        </div>

        {/* Search and Actions */}
        <div className="card">
          <div className="flex gap-4">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
              placeholder="Buscar por nombre, usuario o email..."
              className="flex-1 px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button onClick={handleSearch} disabled={loading} className="btn-primary">
              Buscar
            </button>
            <button onClick={loadBannedUsers} disabled={loading} className="btn-secondary">
              Ver Baneados
            </button>
          </div>
        </div>

        {error && (
          <div className="bg-red-900 border border-red-700 text-red-200 px-4 py-3 rounded-lg">
            {error}
          </div>
        )}

        {loading && (
          <div className="text-center py-12 text-gray-400">Cargando...</div>
        )}

        {!loading && users.length === 0 && (searchQuery || showBanned) && (
          <div className="card text-center py-12 text-gray-400">
            {showBanned ? 'No hay usuarios baneados' : 'No se encontraron usuarios'}
          </div>
        )}

        {!loading && users.length > 0 && (
          <div className="space-y-4">
            <h2 className="text-xl font-semibold text-gray-200">
              {showBanned ? `Usuarios Baneados (${users.length})` : `Resultados (${users.length})`}
            </h2>
            {users.map((user) => (
              <div key={user.id} className="card">
                <div>
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="text-lg font-bold text-gray-100">{user.username}</h3>
                      {getRoleBadge(user.role)}
                      {user.isBanned && (
                        <span className="px-2 py-1 text-xs rounded border bg-red-900 text-red-200 border-red-700">
                          BANEADO
                        </span>
                      )}
                    </div>
                    <p className="text-gray-400 text-sm mb-1">{user.email}</p>
                    <p className="text-gray-500 text-xs">ID: {user.id}</p>

                    {user.isBanned && user.bannedAt && (
                      <div className="mt-2 p-2 bg-red-900/30 border border-red-800 rounded">
                        <p className="text-sm text-red-200">
                          <strong>Fecha:</strong> {new Date(user.bannedAt).toLocaleString('es-ES')}
                        </p>
                        {user.banReason && (
                          <p className="text-sm text-red-200">
                            <strong>Razón:</strong> {user.banReason}
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
}
