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
  const [success, setSuccess] = useState('');
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

  const handleBanUser = async (userId: string, username: string) => {
    const reason = prompt(`Ingresa la razón para banear a ${username}:`);
    if (reason === null) return;

    try {
      setLoading(true);
      setError('');
      await adminService.banUser(userId, { reason: reason || undefined });
      setSuccess(`Usuario ${username} baneado exitosamente`);
      // Refresh results
      if (showBanned) {
        await loadBannedUsers();
      } else if (searchQuery) {
        await handleSearch();
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Error al banear usuario');
    } finally {
      setLoading(false);
    }
  };

  const handleUnbanUser = async (userId: string, username: string) => {
    if (!confirm(`¿Estás seguro de desbanear a ${username}?`)) return;

    try {
      setLoading(true);
      setError('');
      await adminService.unbanUser(userId);
      setSuccess(`Usuario ${username} desbaneado exitosamente`);
      await loadBannedUsers();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Error al desbanear usuario');
    } finally {
      setLoading(false);
    }
  };

  const handleChangeRole = async (userId: string, username: string, currentRole: string) => {
    const newRole = prompt(
      `Cambiar rol de ${username} (actual: ${currentRole})\nIngresa nuevo rol (user/curator/admin):`
    );

    if (!newRole || !['user', 'curator', 'admin'].includes(newRole)) {
      if (newRole !== null) setError('Rol inválido. Usa: user, curator o admin');
      return;
    }

    try {
      setLoading(true);
      setError('');
      await adminService.changeUserRole(userId, { role: newRole as UserRole });
      setSuccess(`Rol de ${username} cambiado a ${newRole} exitosamente`);
      // Refresh results
      if (showBanned) {
        await loadBannedUsers();
      } else if (searchQuery) {
        await handleSearch();
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Error al cambiar rol de usuario');
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

        {success && (
          <div className="bg-green-900 border border-green-700 text-green-200 px-4 py-3 rounded-lg">
            {success}
            <button onClick={() => setSuccess('')} className="ml-4 text-green-100 hover:text-white">
              ✕
            </button>
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
                <div className="flex justify-between items-start">
                  <div className="flex-1">
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

                  <div className="flex flex-col gap-2 ml-4">
                    {user.isBanned ? (
                      <button
                        onClick={() => handleUnbanUser(user.id, user.username)}
                        className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm font-medium"
                        disabled={loading}
                      >
                        Desbanear
                      </button>
                    ) : (
                      <button
                        onClick={() => handleBanUser(user.id, user.username)}
                        className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm font-medium"
                        disabled={loading}
                      >
                        Banear
                      </button>
                    )}
                    <button
                      onClick={() => handleChangeRole(user.id, user.username, user.role || 'user')}
                      className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-sm font-medium"
                      disabled={loading}
                    >
                      Cambiar Rol
                    </button>
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
