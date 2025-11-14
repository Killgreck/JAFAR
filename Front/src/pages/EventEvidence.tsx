import { useState, useEffect } from 'react';
import type { FormEvent } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Layout } from '../components/Layout';
import { useAuth } from '../contexts/AuthContext';
import { eventsService } from '../services/events';
import { evidenceService } from '../services/evidence';
import type { Event, Evidence, EvidenceType, CreateEvidenceData } from '../types';

export function EventEvidence() {
  const { eventId } = useParams<{ eventId: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [event, setEvent] = useState<Event | null>(null);
  const [evidences, setEvidences] = useState<Evidence[]>([]);
  const [counts, setCounts] = useState({ creator: 0, public: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [likingEvidence, setLikingEvidence] = useState<string | null>(null);

  // Form states
  const [showForm, setShowForm] = useState(false);
  const [evidenceType, setEvidenceType] = useState<EvidenceType>('link');
  const [evidenceUrl, setEvidenceUrl] = useState('');
  const [content, setContent] = useState('');
  const [description, setDescription] = useState('');
  const [supportedOption, setSupportedOption] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    loadEventAndEvidence();
  }, [eventId]);

  const loadEventAndEvidence = async () => {
    if (!eventId) return;

    try {
      setLoading(true);
      const [eventData, evidenceData] = await Promise.all([
        eventsService.getById(eventId),
        evidenceService.getEventEvidence(eventId),
      ]);

      setEvent(eventData);
      // Sort evidences by likes (descending)
      const sortedEvidences = evidenceData.evidence.sort((a, b) => (b.likesCount || 0) - (a.likesCount || 0));
      setEvidences(sortedEvidences);
      setCounts(evidenceData.counts);
      if (eventData.resultOptions.length > 0) {
        setSupportedOption(eventData.resultOptions[0]);
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Error al cargar evidencias');
    } finally {
      setLoading(false);
    }
  };

  const canSubmitEvidence = (): boolean => {
    if (!event || !user) return false;

    const now = new Date();
    const bettingDeadline = new Date(event.bettingDeadline);
    const evidenceDeadline = event.evidenceDeadline ? new Date(event.evidenceDeadline) : null;

    // Debe haber pasado el betting deadline
    if (now < bettingDeadline) return false;

    // Si estamos en fase del creador
    if (evidenceDeadline && now < evidenceDeadline) {
      return event.creator === user.id;
    }

    // Si estamos en fase pública
    if (evidenceDeadline && now >= evidenceDeadline) {
      return event.creator !== user.id;
    }

    return false;
  };

  const getPhaseMessage = (): string => {
    if (!event) return '';

    const now = new Date();
    const bettingDeadline = new Date(event.bettingDeadline);
    const evidenceDeadline = event.evidenceDeadline ? new Date(event.evidenceDeadline) : null;

    if (now < bettingDeadline) {
      return 'Las apuestas aún están abiertas. La evidencia podrá ser subida después del cierre.';
    }

    if (evidenceDeadline && now < evidenceDeadline) {
      if (event.creator === user?.id) {
        return 'Eres el creador. Tienes 24 horas para subir evidencia.';
      } else {
        return 'El creador tiene 24 horas para subir evidencia. Después podrás subirla tú.';
      }
    }

    if (evidenceDeadline && now >= evidenceDeadline) {
      if (event.creator === user?.id) {
        return 'Has perdido la oportunidad de subir evidencia. Ahora el público puede subirla.';
      } else {
        return 'El creador no subió evidencia a tiempo. Ahora puedes subirla tú.';
      }
    }

    return '';
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!eventId || !user) return;

    setError('');
    setSubmitting(true);

    try {
      const data: CreateEvidenceData = {
        evidenceType,
        description,
        supportedOption,
        ...(evidenceType === 'text' ? { content } : { evidenceUrl }),
      };

      await evidenceService.submitEvidence(eventId, data);

      // Reload evidence
      await loadEventAndEvidence();

      // Reset form
      setShowForm(false);
      setEvidenceUrl('');
      setContent('');
      setDescription('');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Error al subir evidencia');
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleLike = async (evidenceId: string, isLiked: boolean) => {
    if (!eventId || !user) return;

    setLikingEvidence(evidenceId);
    try {
      if (isLiked) {
        await evidenceService.unlikeEvidence(eventId, evidenceId);
      } else {
        await evidenceService.likeEvidence(eventId, evidenceId);
      }
      // Reload to get updated counts
      await loadEventAndEvidence();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Error al procesar like');
    } finally {
      setLikingEvidence(null);
    }
  };

  if (loading) {
    return (
      <Layout>
        <div className="min-h-screen bg-gray-50 py-8">
          <div className="max-w-4xl mx-auto px-4">
            <div className="text-center">Cargando...</div>
          </div>
        </div>
      </Layout>
    );
  }

  if (!event) {
    return (
      <Layout>
        <div className="min-h-screen bg-gray-50 py-8">
          <div className="max-w-4xl mx-auto px-4">
            <div className="text-center text-red-600">Evento no encontrado</div>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-4xl mx-auto px-4">
          {/* Header */}
          <div className="mb-6">
            <button
              onClick={() => navigate(-1)}
              className="text-blue-600 hover:text-blue-800 mb-4"
            >
              ← Volver
            </button>
            <h1 className="text-3xl font-bold text-gray-900">{event.title}</h1>
            <p className="text-gray-600 mt-2">{event.description}</p>
          </div>

          {/* Phase Info */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <p className="text-blue-800">{getPhaseMessage()}</p>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
              <p className="text-red-800">{error}</p>
            </div>
          )}

          {/* Submit Evidence Button */}
          {canSubmitEvidence() && !showForm && (
            <div className="mb-6">
              <button
                onClick={() => setShowForm(true)}
                className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700"
              >
                Subir Evidencia
              </button>
            </div>
          )}

          {/* Evidence Form */}
          {showForm && canSubmitEvidence() && (
            <div className="bg-white rounded-lg shadow-md p-6 mb-6">
              <h2 className="text-xl font-bold mb-4">Subir Evidencia</h2>

              <form onSubmit={handleSubmit}>
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Tipo de Evidencia
                  </label>
                  <select
                    value={evidenceType}
                    onChange={(e) => setEvidenceType(e.target.value as EvidenceType)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  >
                    <option value="link">Link/URL</option>
                    <option value="image">Imagen</option>
                    <option value="document">Documento</option>
                    <option value="video">Video</option>
                    <option value="text">Texto</option>
                  </select>
                </div>

                {evidenceType === 'text' ? (
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Contenido (máx 2000 caracteres)
                    </label>
                    <textarea
                      value={content}
                      onChange={(e) => setContent(e.target.value)}
                      maxLength={2000}
                      rows={6}
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                      placeholder="Escribe tu evidencia aquí..."
                    />
                  </div>
                ) : (
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      URL de la Evidencia
                    </label>
                    <input
                      type="url"
                      value={evidenceUrl}
                      onChange={(e) => setEvidenceUrl(e.target.value)}
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                      placeholder="https://..."
                    />
                  </div>
                )}

                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Descripción (10-500 caracteres)
                  </label>
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    minLength={10}
                    maxLength={500}
                    rows={3}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                    placeholder="Describe brevemente esta evidencia..."
                  />
                </div>

                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Opción que Soporta
                  </label>
                  <select
                    value={supportedOption}
                    onChange={(e) => setSupportedOption(e.target.value)}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  >
                    {event.resultOptions.map((option) => (
                      <option key={option} value={option}>
                        {option}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex gap-3">
                  <button
                    type="submit"
                    disabled={submitting}
                    className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 disabled:bg-gray-400"
                  >
                    {submitting ? 'Subiendo...' : 'Subir Evidencia'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowForm(false)}
                    className="bg-gray-200 text-gray-700 px-6 py-2 rounded-lg hover:bg-gray-300"
                  >
                    Cancelar
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Evidence Stats */}
          <div className="bg-white rounded-lg shadow-md p-4 mb-6">
            <h3 className="font-semibold mb-2">Estadísticas de Evidencia</h3>
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <div className="text-2xl font-bold text-blue-600">{evidences.length}</div>
                <div className="text-sm text-gray-600">Total</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-green-600">{counts.creator}</div>
                <div className="text-sm text-gray-600">Del Creador</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-purple-600">{counts.public}</div>
                <div className="text-sm text-gray-600">Del Público</div>
              </div>
            </div>
          </div>

          {/* Evidence List */}
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold">Evidencias Subidas</h2>
              {evidences.length > 0 && (
                <span className="text-sm text-gray-600">Ordenadas por más votadas</span>
              )}
            </div>

            {evidences.length === 0 ? (
              <div className="bg-white rounded-lg shadow-md p-8 text-center text-gray-500">
                No hay evidencias aún
              </div>
            ) : (
              evidences.map((evidence) => {
                const isLiked = user && evidence.likes?.includes(user.id);
                return (
                  <div key={evidence.id} className="bg-white rounded-lg shadow-md p-6">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <span
                          className={`inline-block px-3 py-1 rounded-full text-sm font-semibold ${
                            evidence.submitterRole === 'creator'
                              ? 'bg-green-100 text-green-800'
                              : 'bg-purple-100 text-purple-800'
                          }`}
                        >
                          {evidence.submitterRole === 'creator' ? 'Creador' : 'Público'}
                        </span>
                        <span className="ml-2 text-sm text-gray-600">
                          por {evidence.submittedBy.username}
                        </span>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-sm text-gray-500">
                          {new Date(evidence.createdAt).toLocaleDateString()}
                        </span>
                        <button
                          onClick={() => handleToggleLike(evidence.id, isLiked || false)}
                          disabled={likingEvidence === evidence.id}
                          className={`flex items-center gap-1 px-3 py-1 rounded-lg transition-colors ${
                            isLiked
                              ? 'bg-red-100 text-red-600 hover:bg-red-200'
                              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                          } ${likingEvidence === evidence.id ? 'opacity-50 cursor-not-allowed' : ''}`}
                        >
                          <span className="text-lg">{isLiked ? '❤️' : '🤍'}</span>
                          <span className="font-semibold">{evidence.likesCount || 0}</span>
                        </button>
                      </div>
                    </div>

                  <div className="mb-3">
                    <span className="inline-block bg-blue-100 text-blue-800 px-2 py-1 rounded text-sm">
                      Soporta: {evidence.supportedOption}
                    </span>
                    <span className="ml-2 inline-block bg-gray-100 text-gray-800 px-2 py-1 rounded text-sm">
                      Tipo: {evidence.evidenceType}
                    </span>
                  </div>

                  <p className="text-gray-700 mb-3">{evidence.description}</p>

                  {evidence.evidenceType === 'text' && evidence.content && (
                    <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mt-3">
                      <p className="text-sm text-gray-700 whitespace-pre-wrap">{evidence.content}</p>
                    </div>
                  )}

                  {evidence.evidenceUrl && (
                    <a
                      href={evidence.evidenceUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:text-blue-800 text-sm"
                    >
                      Ver evidencia →
                    </a>
                  )}
                </div>
              );
              })
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
}
