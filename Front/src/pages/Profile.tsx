import { useState, useEffect } from 'react';
import { Layout } from '../components/Layout';
import { useAuth } from '../contexts/AuthContext';
import { profileService } from '../services/api';
import type { UserProfile } from '../types';

export function Profile() {
  const { user, refreshUser } = useAuth();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [formData, setFormData] = useState({
    username: '',
    avatar: '',
  });
  const [updateError, setUpdateError] = useState('');
  const [updateSuccess, setUpdateSuccess] = useState('');

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      setLoading(true);
      const data = await profileService.getProfile();
      setProfile(data);
      setFormData({
        username: data.profile.username,
        avatar: data.profile.avatar || '',
      });
    } catch (err: any) {
      console.error('Error loading profile:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setUpdateError('');
    setUpdateSuccess('');

    try {
      const updateData: any = {};

      // Only include fields that changed
      if (formData.username !== profile?.profile.username) {
        updateData.username = formData.username;
      }

      if (formData.avatar !== (profile?.profile.avatar || '')) {
        updateData.avatar = formData.avatar;
      }

      if (Object.keys(updateData).length === 0) {
        setUpdateError('No hay cambios para guardar');
        return;
      }

      await profileService.updateProfile(updateData);
      setUpdateSuccess('Perfil actualizado correctamente');
      setEditing(false);

      // Reload profile and refresh auth context
      await loadProfile();
      await refreshUser();
    } catch (err: any) {
      setUpdateError(err.response?.data?.message || 'Error al actualizar el perfil');
    }
  };

  const handleCancel = () => {
    setEditing(false);
    setFormData({
      username: profile?.profile.username || '',
      avatar: profile?.profile.avatar || '',
    });
    setUpdateError('');
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  if (loading) {
    return (
      <Layout>
        <div className="flex justify-center items-center min-h-[400px]">
          <div className="text-gray-400 text-xl">Cargando perfil...</div>
        </div>
      </Layout>
    );
  }

  if (!profile) {
    return (
      <Layout>
        <div className="flex justify-center items-center min-h-[400px]">
          <div className="text-red-400 text-xl">Error al cargar el perfil</div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="card">
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-3xl font-bold text-gray-100 mb-2">Mi Perfil</h1>
              <p className="text-gray-400">Gestiona tu información personal y revisa tus estadísticas</p>
            </div>
            {!editing && (
              <button
                onClick={() => setEditing(true)}
                className="btn-primary"
              >
                Editar Perfil
              </button>
            )}
          </div>
        </div>

        {/* Profile Information */}
        <div className="card">
          <h2 className="text-2xl font-bold text-gray-100 mb-6">Información Personal</h2>

          {updateSuccess && (
            <div className="mb-4 p-4 bg-green-900 border border-green-700 rounded-lg text-green-100">
              {updateSuccess}
            </div>
          )}

          {updateError && (
            <div className="mb-4 p-4 bg-red-900 border border-red-700 rounded-lg text-red-100">
              {updateError}
            </div>
          )}

          {editing ? (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Nombre de usuario
                </label>
                <input
                  type="text"
                  value={formData.username}
                  onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                  className="input"
                  required
                />
                <p className="mt-1 text-xs text-gray-400">
                  Tu nombre de usuario debe ser único
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Avatar URL
                </label>
                <input
                  type="text"
                  value={formData.avatar}
                  onChange={(e) => setFormData({ ...formData, avatar: e.target.value })}
                  className="input"
                  placeholder="https://ejemplo.com/avatar.jpg"
                />
                <p className="mt-1 text-xs text-gray-400">
                  URL de tu imagen de avatar (opcional)
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Email
                </label>
                <input
                  type="email"
                  value={profile.profile.email}
                  className="input bg-gray-800 cursor-not-allowed"
                  disabled
                />
                <p className="mt-1 text-xs text-gray-400">
                  El email no se puede cambiar
                </p>
              </div>

              <div className="flex gap-3 pt-4">
                <button type="submit" className="btn-primary">
                  Guardar Cambios
                </button>
                <button
                  type="button"
                  onClick={handleCancel}
                  className="btn-secondary"
                >
                  Cancelar
                </button>
              </div>
            </form>
          ) : (
            <div className="space-y-4">
              <div className="flex items-start gap-6">
                {profile.profile.avatar && (
                  <div className="flex-shrink-0">
                    <img
                      src={profile.profile.avatar}
                      alt={profile.profile.username}
                      className="w-24 h-24 rounded-full object-cover border-2 border-blue-500"
                      onError={(e) => {
                        e.currentTarget.style.display = 'none';
                      }}
                    />
                  </div>
                )}
                <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-400 mb-1">
                      Nombre de usuario
                    </label>
                    <p className="text-lg text-gray-100 font-semibold">
                      {profile.profile.username}
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-400 mb-1">
                      Email
                    </label>
                    <p className="text-lg text-gray-100">
                      {profile.profile.email}
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-400 mb-1">
                      Rol
                    </label>
                    <p className="text-lg text-gray-100 capitalize">
                      {profile.profile.role}
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-400 mb-1">
                      Miembro desde
                    </label>
                    <p className="text-lg text-gray-100">
                      {formatDate(profile.profile.createdAt)}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Statistics */}
        <div className="card">
          <h2 className="text-2xl font-bold text-gray-100 mb-6">Estadísticas de Apuestas</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            <div className="p-4 bg-blue-900 rounded-lg border border-blue-700">
              <div className="text-sm text-blue-300 font-medium mb-1">Balance</div>
              <div className="text-2xl font-bold text-blue-100">
                ${profile.profile.balance?.toFixed(2) || '0.00'}
              </div>
            </div>

            <div className="p-4 bg-purple-900 rounded-lg border border-purple-700">
              <div className="text-sm text-purple-300 font-medium mb-1">Apuestas Totales</div>
              <div className="text-2xl font-bold text-purple-100">
                {profile.statistics.totalBets}
              </div>
            </div>

            <div className="p-4 bg-green-900 rounded-lg border border-green-700">
              <div className="text-sm text-green-300 font-medium mb-1">Apuestas Ganadas</div>
              <div className="text-2xl font-bold text-green-100">
                {profile.statistics.wonBets}
              </div>
            </div>

            <div className="p-4 bg-red-900 rounded-lg border border-red-700">
              <div className="text-sm text-red-300 font-medium mb-1">Apuestas Perdidas</div>
              <div className="text-2xl font-bold text-red-100">
                {profile.statistics.lostBets}
              </div>
            </div>

            <div className="p-4 bg-yellow-900 rounded-lg border border-yellow-700">
              <div className="text-sm text-yellow-300 font-medium mb-1">Tasa de Éxito</div>
              <div className="text-2xl font-bold text-yellow-100">
                {profile.statistics.successRate.toFixed(1)}%
              </div>
            </div>
          </div>

          <div className="mt-6 p-4 bg-gray-800 rounded-lg border border-gray-700">
            <div className="text-sm text-gray-400 font-medium mb-1">Apuestas Activas</div>
            <div className="text-xl font-bold text-gray-100">
              {profile.statistics.activeBets}
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Apuestas en predicciones abiertas
            </p>
          </div>
        </div>

        {/* Additional Stats Breakdown */}
        {profile.statistics.totalBets > 0 && (
          <div className="card">
            <h2 className="text-2xl font-bold text-gray-100 mb-6">Análisis de Rendimiento</h2>

            <div className="space-y-4">
              <div>
                <div className="flex justify-between text-sm text-gray-400 mb-2">
                  <span>Porcentaje de Victorias</span>
                  <span>{profile.statistics.successRate.toFixed(1)}%</span>
                </div>
                <div className="w-full bg-gray-700 rounded-full h-3">
                  <div
                    className="bg-green-500 h-3 rounded-full transition-all duration-500"
                    style={{ width: `${Math.min(profile.statistics.successRate, 100)}%` }}
                  />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-sm text-gray-400 mb-2">
                  <span>Porcentaje de Derrotas</span>
                  <span>
                    {profile.statistics.totalBets > 0
                      ? ((profile.statistics.lostBets / profile.statistics.totalBets) * 100).toFixed(1)
                      : '0.0'}%
                  </span>
                </div>
                <div className="w-full bg-gray-700 rounded-full h-3">
                  <div
                    className="bg-red-500 h-3 rounded-full transition-all duration-500"
                    style={{
                      width: `${profile.statistics.totalBets > 0 ? (profile.statistics.lostBets / profile.statistics.totalBets) * 100 : 0}%`,
                    }}
                  />
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}
