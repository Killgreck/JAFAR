import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Layout } from '../components/Layout';
import { useAuth } from '../contexts/AuthContext';
import { eventsService } from '../services/events';
import type { Event, EventStatus } from '../types';

export function EventManagement() {
  const { eventId } = useParams<{ eventId: string }>();
  const [event, setEvent] = useState<Event | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    loadEvent();
  }, [eventId]);

  const loadEvent = async () => {
    if (!eventId) return;

    try {
      setLoading(true);
      setError('');
      const data = await eventsService.getById(eventId);

      // Check if user is the creator
      if (data.creator !== user?.id) {
        setError('No tienes permiso para administrar este evento');
        return;
      }

      setEvent(data);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Error al cargar el evento');
    } finally {
      setLoading(false);
    }
  };

  const handleCancelEvent = async () => {
    if (!event || !window.confirm('¿Estás seguro de que quieres cancelar este evento? Esta acción no se puede deshacer.')) {
      return;
    }

    try {
      setActionLoading(true);
      await eventsService.updateStatus(event.id, 'cancelled');
      await loadEvent();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Error al cancelar el evento');
    } finally {
      setActionLoading(false);
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
      <span className={`px-3 py-1 text-sm rounded border ${styles[status]}`}>
        {labels[status]}
      </span>
    );
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (loading) {
    return (
      <Layout>
        <div className="text-center py-12 text-gray-400">Cargando evento...</div>
      </Layout>
    );
  }

  if (error || !event) {
    return (
      <Layout>
        <div className="card">
          <div className="bg-red-900 border border-red-700 text-red-200 px-4 py-3 rounded-lg mb-4">
            {error || 'Evento no encontrado'}
          </div>
          <button onClick={() => navigate('/events')} className="btn-secondary">
            Volver a Eventos
          </button>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold text-gray-100">Administrar Evento</h1>
          <button onClick={() => navigate('/events')} className="btn-secondary">
            Volver a Eventos
          </button>
        </div>

        {/* Event Details Card */}
        <div className="card">
          <div className="flex justify-between items-start mb-4">
            <h2 className="text-2xl font-bold text-gray-100">{event.title}</h2>
            {getStatusBadge(event.status)}
          </div>

          <p className="text-gray-300 mb-4">{event.description}</p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div className="p-4 bg-gray-800 rounded-lg border border-gray-700">
              <div className="text-sm text-gray-400 mb-1">Categoría</div>
              <div className="text-gray-200 font-medium">{event.category}</div>
            </div>

            <div className="p-4 bg-gray-800 rounded-lg border border-gray-700">
              <div className="text-sm text-gray-400 mb-1">Estado</div>
              <div className="text-gray-200 font-medium capitalize">{event.status}</div>
            </div>

            <div className="p-4 bg-gray-800 rounded-lg border border-gray-700">
              <div className="text-sm text-gray-400 mb-1">Cierre de Apuestas</div>
              <div className="text-gray-200 font-medium">{formatDate(event.bettingDeadline)}</div>
            </div>

            <div className="p-4 bg-gray-800 rounded-lg border border-gray-700">
              <div className="text-sm text-gray-400 mb-1">Resolución Esperada</div>
              <div className="text-gray-200 font-medium">{formatDate(event.expectedResolutionDate)}</div>
            </div>
          </div>

          <div className="mb-4">
            <div className="text-sm text-gray-400 mb-2">Opciones de Resultado</div>
            <div className="flex flex-wrap gap-2">
              {event.resultOptions.map((option, index) => (
                <span
                  key={index}
                  className={`px-3 py-2 rounded border ${
                    event.winningOption === option
                      ? 'bg-green-900 text-green-200 border-green-700 font-bold'
                      : 'bg-gray-800 text-gray-300 border-gray-700'
                  }`}
                >
                  {option}
                  {event.winningOption === option && ' ✓'}
                </span>
              ))}
            </div>
          </div>

          {event.resolutionRationale && (
            <div className="p-4 bg-blue-900 border border-blue-700 rounded-lg mb-4">
              <div className="text-sm text-blue-200 font-medium mb-1">Justificación de Resolución</div>
              <div className="text-blue-100">{event.resolutionRationale}</div>
            </div>
          )}

          <div className="pt-4 border-t border-gray-700 text-sm text-gray-400">
            <div>Creado el {formatDate(event.createdAt)}</div>
            {event.resolvedAt && <div>Resuelto el {formatDate(event.resolvedAt)}</div>}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="card">
          <h3 className="text-xl font-bold text-gray-100 mb-4">Acciones</h3>

          <div className="space-y-3">
            <button
              onClick={() => navigate(`/events/${event.id}/evidence`)}
              className="w-full btn-primary"
            >
              📊 Ver/Gestionar Evidencias
            </button>

            {event.status === 'open' && (
              <button
                onClick={handleCancelEvent}
                disabled={actionLoading}
                className="w-full px-4 py-2 bg-red-900 hover:bg-red-800 text-red-200 rounded-lg font-medium transition-colors border border-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {actionLoading ? 'Cancelando...' : '❌ Cancelar Evento'}
              </button>
            )}
          </div>

          <div className="mt-4 p-4 bg-yellow-900 border border-yellow-700 rounded-lg">
            <h4 className="font-semibold text-yellow-100 mb-2">Información Importante</h4>
            <ul className="text-sm text-yellow-200 space-y-1">
              <li>• Solo puedes cancelar eventos en estado "Abierto"</li>
              <li>• El evento se cerrará automáticamente después de la fecha de cierre</li>
              <li>• La resolución del evento requiere autorización especial</li>
              <li>• Las evidencias son visibles después del cierre de apuestas</li>
            </ul>
          </div>
        </div>
      </div>
    </Layout>
  );
}
