import { useState, useEffect } from 'react';
import { Layout } from '../components/Layout';
import { eventsService } from '../services/events';
import { adminService } from '../services/admin';
import type { Event, EventStatus } from '../types';

export function AdminEvents() {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [filterStatus, setFilterStatus] = useState<EventStatus | ''>('');

  useEffect(() => {
    loadEvents();
  }, [filterStatus]);

  const loadEvents = async () => {
    try {
      setLoading(true);
      setError('');
      const filters: { status?: string } = {};
      if (filterStatus) filters.status = filterStatus;

      const data = await eventsService.list(filters);
      setEvents(data);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Error al cargar eventos');
    } finally {
      setLoading(false);
    }
  };

  const handleCancelEvent = async (eventId: string, title: string) => {
    if (!confirm(`¿Estás seguro de cancelar el evento "${title}"? Se reembolsará a todos los participantes.`)) {
      return;
    }

    try {
      setLoading(true);
      setError('');
      const result = await adminService.cancelEvent(eventId);
      setSuccess(result.message);
      await loadEvents();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Error al cancelar evento');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateDates = async (event: Event) => {
    const bettingDeadlineStr = prompt(
      `Actualizar fechas del evento "${event.title}"\n\nNueva fecha límite de apuestas (formato: YYYY-MM-DD HH:MM):`,
      new Date(event.bettingDeadline).toISOString().slice(0, 16).replace('T', ' ')
    );

    if (!bettingDeadlineStr) return;

    const expectedResolutionStr = prompt(
      `Nueva fecha esperada de resolución (formato: YYYY-MM-DD HH:MM):`,
      new Date(event.expectedResolutionDate).toISOString().slice(0, 16).replace('T', ' ')
    );

    if (!expectedResolutionStr) return;

    try {
      const bettingDeadline = new Date(bettingDeadlineStr.replace(' ', 'T'));
      const expectedResolutionDate = new Date(expectedResolutionStr.replace(' ', 'T'));

      if (isNaN(bettingDeadline.getTime()) || isNaN(expectedResolutionDate.getTime())) {
        setError('Formato de fecha inválido');
        return;
      }

      setLoading(true);
      setError('');
      const result = await adminService.updateEventDates(event.id, {
        bettingDeadline,
        expectedResolutionDate,
      });
      setSuccess(result.message);
      await loadEvents();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Error al actualizar fechas');
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

  return (
    <Layout>
      <div className="space-y-6">
        <h1 className="text-3xl font-bold text-gray-100">Gestión de Eventos</h1>

        {/* Filters */}
        <div className="card">
          <div className="flex gap-4 items-center">
            <label className="text-sm font-medium text-gray-300">Estado:</label>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value as EventStatus | '')}
              className="px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Todos los estados</option>
              <option value="open">Abierto</option>
              <option value="closed">Cerrado</option>
              <option value="resolved">Resuelto</option>
              <option value="cancelled">Cancelado</option>
            </select>
            <button onClick={loadEvents} className="btn-secondary ml-auto">
              Refrescar
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

        {loading ? (
          <div className="text-center py-12 text-gray-400">Cargando eventos...</div>
        ) : events.length === 0 ? (
          <div className="card text-center py-12 text-gray-400">
            No se encontraron eventos{filterStatus ? ' con el estado seleccionado' : ''}.
          </div>
        ) : (
          <div className="space-y-4">
            <h2 className="text-xl font-semibold text-gray-200">Eventos ({events.length})</h2>
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
                    <div className="text-gray-200 font-medium">{formatDate(event.bettingDeadline)}</div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-400">Resolución Esperada</div>
                    <div className="text-gray-200 font-medium">{formatDate(event.expectedResolutionDate)}</div>
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

                <div className="flex gap-3">
                  {event.status === 'open' && (
                    <>
                      <button
                        onClick={() => handleUpdateDates(event)}
                        className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium"
                        disabled={loading}
                      >
                        Modificar Fechas
                      </button>
                      <button
                        onClick={() => handleCancelEvent(event.id, event.title)}
                        className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium"
                        disabled={loading}
                      >
                        Cancelar Evento
                      </button>
                    </>
                  )}
                  {event.status !== 'open' && (
                    <span className="text-gray-500 text-sm italic">
                      {event.status === 'cancelled'
                        ? 'Evento cancelado - No se pueden realizar acciones'
                        : event.status === 'resolved'
                        ? 'Evento resuelto - No se pueden realizar acciones'
                        : 'Solo eventos abiertos pueden ser modificados'}
                    </span>
                  )}
                </div>

                <div className="mt-3 pt-3 border-t border-gray-700 text-xs text-gray-500">
                  ID: {event.id} • Creado el {formatDate(event.createdAt)}
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
