import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Layout } from '../components/Layout';
import { useAuth } from '../contexts/AuthContext';
import { eventsService } from '../services/events';
import type { Event, EventCategory, EventStatus } from '../types';

export function EventsList() {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filterCategory, setFilterCategory] = useState<EventCategory | ''>('');
  const [filterStatus, setFilterStatus] = useState<EventStatus | ''>('');
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    loadEvents();
  }, [filterCategory, filterStatus]);

  const loadEvents = async () => {
    try {
      setLoading(true);
      setError('');
      const filters: { category?: string; status?: string } = {};
      if (filterCategory) filters.category = filterCategory;
      if (filterStatus) filters.status = filterStatus;

      const data = await eventsService.list(filters);
      setEvents(data);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Error al cargar eventos');
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: EventStatus) => {
    const styles = {
      open: 'bg-green-900 text-green-200 border-green-700',
      closed: 'bg-yellow-900 text-yellow-200 border-yellow-700',
      resolved: 'bg-blue-900 text-blue-200 border-blue-700',
      cancelled: 'bg-red-900 text-red-200 border-red-700',
    };

    const labels = {
      open: 'Abierto',
      closed: 'Cerrado',
      resolved: 'Resuelto',
      cancelled: 'Cancelado',
    };

    return (
      <span className={`px-2 py-1 text-xs rounded border ${styles[status]}`}>
        {labels[status]}
      </span>
    );
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const isEvidencePhaseActive = (event: Event): boolean => {
    const now = new Date();
    const bettingDeadline = new Date(event.bettingDeadline);
    return now >= bettingDeadline && event.status !== 'resolved' && event.status !== 'cancelled';
  };

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold text-gray-100">Eventos de Apuestas</h1>
          <button
            onClick={() => navigate('/create-event')}
            className="btn-primary"
          >
            Crear Evento
          </button>
        </div>

        {/* Filters */}
        <div className="card">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Categoría
              </label>
              <select
                value={filterCategory}
                onChange={(e) => setFilterCategory(e.target.value as EventCategory | '')}
                className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Todas las categorías</option>
                <option value="Deportes">Deportes</option>
                <option value="Política">Política</option>
                <option value="Entretenimiento">Entretenimiento</option>
                <option value="Economía">Economía</option>
                <option value="Otros">Otros</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Estado
              </label>
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value as EventStatus | '')}
                className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Todos los estados</option>
                <option value="open">Abierto</option>
                <option value="closed">Cerrado</option>
                <option value="resolved">Resuelto</option>
                <option value="cancelled">Cancelado</option>
              </select>
            </div>
          </div>
        </div>

        {error && (
          <div className="bg-red-900 border border-red-700 text-red-200 px-4 py-3 rounded-lg">
            {error}
          </div>
        )}

        {loading ? (
          <div className="text-center py-12 text-gray-400">Cargando eventos...</div>
        ) : events.length === 0 ? (
          <div className="card text-center py-12 text-gray-400">
            No se encontraron eventos{filterCategory || filterStatus ? ' con los filtros seleccionados' : ''}.
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6">
            {events.map((event) => (
              <div key={event.id} className="card">
                <div className="flex justify-between items-start mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="text-xl font-bold text-gray-100">{event.title}</h3>
                      {getStatusBadge(event.status)}
                    </div>
                    <p className="text-gray-400 text-sm mb-2">{event.description}</p>
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-1 bg-purple-900 text-purple-200 text-xs rounded border border-purple-700">
                        {event.category}
                      </span>
                      {event.winningOption && (
                        <span className="px-2 py-1 bg-green-900 text-green-200 text-xs rounded border border-green-700">
                          Ganador: {event.winningOption}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <div>
                    <div className="text-sm text-gray-400">Cierre de Apuestas</div>
                    <div className="text-gray-200 font-medium">
                      {formatDate(event.bettingDeadline)}
                    </div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-400">Resolución Esperada</div>
                    <div className="text-gray-200 font-medium">
                      {formatDate(event.expectedResolutionDate)}
                    </div>
                  </div>
                </div>

                <div className="mb-4">
                  <div className="text-sm text-gray-400 mb-2">Opciones de Resultado</div>
                  <div className="flex flex-wrap gap-2">
                    {event.resultOptions.map((option, index) => (
                      <span
                        key={index}
                        className="px-3 py-1 bg-gray-800 text-gray-300 text-sm rounded border border-gray-700"
                      >
                        {option}
                      </span>
                    ))}
                  </div>
                </div>

                {event.curatorCommission !== undefined && event.curatorCommission > 0 && (
                  <div className="mb-4 p-3 bg-blue-900 border border-blue-700 rounded-lg">
                    <div className="text-sm text-blue-200">
                      Comisión del Curador: <span className="font-bold">${event.curatorCommission.toFixed(2)}</span>
                    </div>
                  </div>
                )}

                {event.resolutionRationale && (
                  <div className="mb-4 p-3 bg-gray-800 border border-gray-700 rounded-lg">
                    <div className="text-sm text-gray-400 mb-1">Justificación de Resolución</div>
                    <div className="text-gray-200">{event.resolutionRationale}</div>
                  </div>
                )}

                <div className="flex gap-3">
                  <button
                    onClick={() => navigate(`/events/${event.id}/evidence`)}
                    className={`flex-1 px-4 py-2 rounded-lg font-medium transition-colors ${
                      isEvidencePhaseActive(event)
                        ? 'bg-blue-600 hover:bg-blue-700 text-white'
                        : 'bg-gray-700 hover:bg-gray-600 text-gray-300'
                    }`}
                  >
                    {isEvidencePhaseActive(event) ? '📊 Ver/Subir Evidencia' : '📋 Ver Evidencias'}
                  </button>

                  {event.creator === user?.id && event.status === 'open' && (
                    <button
                      onClick={() => {/* TODO: Navigate to event detail/management page */}}
                      className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-gray-300 rounded-lg font-medium transition-colors"
                    >
                      Administrar
                    </button>
                  )}
                </div>

                <div className="mt-3 pt-3 border-t border-gray-700 text-xs text-gray-500">
                  Creado el {formatDate(event.createdAt)}
                  {event.resolvedAt && ` • Resuelto el ${formatDate(event.resolvedAt)}`}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
}
