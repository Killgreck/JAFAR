import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Layout } from '../components/Layout';
import { curatorService } from '../services/curator';
import { evidenceService } from '../services/evidence';
import type { Event, Evidence } from '../types';

export function CuratorPanel() {
  const [events, setEvents] = useState<Event[]>([]);
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [evidences, setEvidences] = useState<Evidence[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    loadEvents();
  }, []);

  const loadEvents = async () => {
    try {
      setLoading(true);
      setError('');
      const data = await curatorService.getEventsForCuration();
      setEvents(data.events);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Error al cargar eventos para curar');
    } finally {
      setLoading(false);
    }
  };

  const loadEvidence = async (event: Event) => {
    try {
      setLoading(true);
      setError('');
      setSelectedEvent(event);
      const data = await evidenceService.getEventEvidence(event.id);
      // Sort by likes descending
      const sortedEvidence = data.evidence.sort((a, b) => (b.likesCount || 0) - (a.likesCount || 0));
      setEvidences(sortedEvidence);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Error al cargar evidencias');
    } finally {
      setLoading(false);
    }
  };

  const handleResolve = async (event: Event) => {
    const winningOption = prompt(
      `Resolver evento: "${event.title}"\n\nOpciones disponibles:\n${event.resultOptions.join('\n')}\n\nIngresa la opción ganadora:`
    );

    if (!winningOption) return;

    if (!event.resultOptions.includes(winningOption)) {
      setError('Opción inválida. Debe ser una de las opciones disponibles.');
      return;
    }

    const rationale = prompt('Justificación de la decisión (opcional):');

    try {
      setLoading(true);
      setError('');
      await curatorService.resolveEvent(event.id, {
        winningOption,
        rationale: rationale || undefined,
      });
      setSuccess(`Evento "${event.title}" resuelto exitosamente`);
      setSelectedEvent(null);
      setEvidences([]);
      await loadEvents();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Error al resolver evento');
    } finally {
      setLoading(false);
    }
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

  const getRoleBadge = (role: string) => {
    const styles = {
      creator: 'bg-blue-900 text-blue-200 border-blue-700',
      public: 'bg-green-900 text-green-200 border-green-700',
      curator: 'bg-purple-900 text-purple-200 border-purple-700',
    };

    return (
      <span className={`px-2 py-1 text-xs rounded border ${styles[role as keyof typeof styles] || styles.public}`}>
        {role === 'creator' ? 'Creador' : role === 'public' ? 'Público' : 'Curador'}
      </span>
    );
  };

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold text-gray-100">Panel de Curaduría</h1>
          <button onClick={loadEvents} className="btn-secondary" disabled={loading}>
            Refrescar
          </button>
        </div>

        {error && (
          <div className="bg-red-900 border border-red-700 text-red-200 px-4 py-3 rounded-lg">
            {error}
            <button onClick={() => setError('')} className="ml-4 text-red-100 hover:text-white">
              ✕
            </button>
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

        {loading && !selectedEvent && (
          <div className="text-center py-12 text-gray-400">Cargando eventos...</div>
        )}

        {!loading && !selectedEvent && events.length === 0 && (
          <div className="card text-center py-12 text-gray-400">
            No hay eventos listos para curar en este momento.
          </div>
        )}

        {/* Event List */}
        {!selectedEvent && events.length > 0 && (
          <div className="space-y-4">
            <h2 className="text-xl font-semibold text-gray-200">
              Eventos Listos para Curar ({events.length})
            </h2>
            {events.map((event) => (
              <div key={event.id} className="card">
                <div className="flex justify-between items-start mb-4">
                  <div className="flex-1">
                    <h3 className="text-xl font-bold text-gray-100 mb-2">{event.title}</h3>
                    <p className="text-gray-400 text-sm mb-2">{event.description}</p>
                    <div className="flex items-center gap-2 mb-2">
                      <span className="px-2 py-1 bg-purple-900 text-purple-200 text-xs rounded border border-purple-700">
                        {event.category}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <div>
                    <div className="text-sm text-gray-400">Cierre de Apuestas</div>
                    <div className="text-gray-200 font-medium">{formatDate(event.bettingDeadline)}</div>
                  </div>
                  {event.evidenceDeadline && (
                    <div>
                      <div className="text-sm text-gray-400">Fin de Evidencias</div>
                      <div className="text-gray-200 font-medium">{formatDate(event.evidenceDeadline)}</div>
                    </div>
                  )}
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
                  <button
                    onClick={() => loadEvidence(event)}
                    className="flex-1 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-medium"
                    disabled={loading}
                  >
                    Ver Evidencias y Resolver
                  </button>
                  <button
                    onClick={() => navigate(`/events/${event.id}/evidence`)}
                    className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-gray-300 rounded-lg font-medium"
                  >
                    Ver en Detalle
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Evidence View */}
        {selectedEvent && (
          <div className="space-y-4">
            <div className="flex items-center gap-4">
              <button
                onClick={() => {
                  setSelectedEvent(null);
                  setEvidences([]);
                }}
                className="btn-secondary"
              >
                ← Volver
              </button>
              <h2 className="text-2xl font-bold text-gray-100">{selectedEvent.title}</h2>
            </div>

            <div className="card bg-purple-900/20 border-purple-800">
              <div className="text-sm text-purple-200 mb-2">Opciones Disponibles</div>
              <div className="flex flex-wrap gap-2">
                {selectedEvent.resultOptions.map((option, index) => (
                  <span
                    key={index}
                    className="px-3 py-2 bg-purple-800 text-purple-100 font-medium rounded border border-purple-600"
                  >
                    {option}
                  </span>
                ))}
              </div>
            </div>

            {evidences.length === 0 ? (
              <div className="card text-center py-8 text-gray-400">
                No hay evidencias para este evento.
              </div>
            ) : (
              <>
                <h3 className="text-lg font-semibold text-gray-200">
                  Evidencias ({evidences.length}) - Ordenadas por más votadas
                </h3>
                {evidences.map((evidence) => (
                  <div key={evidence.id} className="card">
                    <div className="flex justify-between items-start mb-3">
                      <div className="flex items-center gap-2">
                        {getRoleBadge(evidence.submitterRole)}
                        <span className="text-sm text-gray-400">
                          por {evidence.submittedBy.username}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-2xl">❤️</span>
                        <span className="text-lg font-bold text-gray-100">
                          {evidence.likesCount || 0}
                        </span>
                      </div>
                    </div>

                    <div className="mb-3">
                      <div className="text-sm text-gray-400">Apoya la opción:</div>
                      <div className="text-lg font-semibold text-green-400">{evidence.supportedOption}</div>
                    </div>

                    <div className="mb-3">
                      <div className="text-sm text-gray-400 mb-1">Descripción:</div>
                      <p className="text-gray-200">{evidence.description}</p>
                    </div>

                    {evidence.evidenceUrl && (
                      <div className="mb-3">
                        <div className="text-sm text-gray-400 mb-1">Enlace:</div>
                        <a
                          href={evidence.evidenceUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-400 hover:text-blue-300 underline break-all"
                        >
                          {evidence.evidenceUrl}
                        </a>
                      </div>
                    )}

                    {evidence.content && (
                      <div className="mb-3">
                        <div className="text-sm text-gray-400 mb-1">Contenido:</div>
                        <p className="text-gray-300 whitespace-pre-wrap">{evidence.content}</p>
                      </div>
                    )}

                    <div className="text-xs text-gray-500">
                      Enviado el {formatDate(evidence.createdAt)}
                    </div>
                  </div>
                ))}
              </>
            )}

            <div className="card bg-green-900/20 border-green-800">
              <button
                onClick={() => handleResolve(selectedEvent)}
                className="w-full px-6 py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg font-bold text-lg"
                disabled={loading}
              >
                Resolver Evento
              </button>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}
