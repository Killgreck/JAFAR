import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Layout } from '../components/Layout';
import { Pagination } from '../components/Pagination';
import { useAuth } from '../contexts/AuthContext';
import { useDebounce } from '../hooks/useDebounce';
import { eventsService } from '../services/events';
import type { Event, EventCategory, EventStatus, PaginationMeta } from '../types';

export function EventsList() {
  const [events, setEvents] = useState<Event[]>([]);
  const [pagination, setPagination] = useState<PaginationInfo>({
    total: 0,
    page: 1,
    totalPages: 1,
    hasMore: false,
    limit: 20,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Search and filter states
  const [searchText, setSearchText] = useState('');
  const [searchInput, setSearchInput] = useState(''); // For debouncing
  const [filterCategory, setFilterCategory] = useState<EventCategory | ''>('');
  const [filterStatus, setFilterStatus] = useState<EventStatus | ''>('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [sortBy, setSortBy] = useState<'recent' | 'closingSoon' | 'mostBetted'>('recent');

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [pagination, setPagination] = useState<PaginationMeta | null>(null);

  const { user } = useAuth();
  const navigate = useNavigate();

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => {
      setSearchText(searchInput);
      setCurrentPage(1); // Reset to first page on new search
    }, 500);

    return () => clearTimeout(timer);
  }, [searchInput]);

  // Load events when filters change
  useEffect(() => {
    loadEvents();
  }, [searchText, filterCategory, filterStatus, dateFrom, dateTo, sortBy, currentPage]);

  // Load events when page changes
  useEffect(() => {
    loadEvents(currentPage);
  }, [currentPage]);

  const loadEvents = async (page: number = 1) => {
    try {
      setLoading(true);
      setError('');

      const params: any = {
        page,
        limit: 20,
      };

      if (debouncedSearch) params.search = debouncedSearch;
      if (filterCategory) params.category = filterCategory;
      if (filterStatus) params.status = filterStatus;
      if (dateFrom) params.dateFrom = dateFrom;
      if (dateTo) params.dateTo = dateTo;
      if (sortBy) params.sortBy = sortBy;

      const response = await eventsService.listPaginated(params);
      setEvents(response.events);
      setPagination(response.pagination);
      const result = await eventsService.search({
        q: searchText || undefined,
        category: filterCategory || undefined,
        status: filterStatus || undefined,
        dateFrom: dateFrom || undefined,
        dateTo: dateTo || undefined,
        sortBy,
        page: currentPage,
        limit: 20,
      });

      setEvents(result.events);
      setPagination(result.pagination);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Error al cargar eventos');
      setEvents([]);
      setPagination(null);
    } finally {
      setLoading(false);
    }
  };

  const handleClearFilters = () => {
    setSearchInput('');
  const clearFilters = () => {
    setSearchInput('');
    setSearchText('');
    setFilterCategory('');
    setFilterStatus('');
    setDateFrom('');
    setDateTo('');
    setSortBy('recent');
    setCurrentPage(1);
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
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

  const getEvidencePhaseBadge = (event: Event) => {
    const now = new Date();
    const bettingDeadline = new Date(event.bettingDeadline);
    const evidenceDeadline = event.evidenceDeadline ? new Date(event.evidenceDeadline) : null;

    if (now < bettingDeadline) {
      return null;
    }

    if (evidenceDeadline && now < evidenceDeadline) {
      const hoursLeft = Math.max(0, Math.floor((evidenceDeadline.getTime() - now.getTime()) / (1000 * 60 * 60)));
      return (
        <span className="px-2 py-1 text-xs rounded border bg-blue-900 text-blue-200 border-blue-700">
          📝 Fase Creador ({hoursLeft}h restantes)
        </span>
      );
    }

    if (evidenceDeadline && now >= evidenceDeadline) {
      return (
        <span className="px-2 py-1 text-xs rounded border bg-purple-900 text-purple-200 border-purple-700">
          🌍 Fase Pública
        </span>
      );
    }

    return null;
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

  const formatCurrency = (amount: number) => {
    return amount.toLocaleString('es-ES', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
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
        {/* Header */}
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold text-gray-100">Eventos de Apuestas</h1>
          <button
            onClick={() => navigate('/create-event')}
            className="btn-primary"
          >
            Crear Evento
          </button>
        </div>

        {/* Search Bar */}
        <div className="card">
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Buscar Eventos
          </label>
          <input
            type="text"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="Buscar por título o descripción..."
            className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-gray-100 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Filters */}
        <div className="card">
          <h2 className="text-lg font-semibold text-gray-100 mb-4">Filtros y Búsqueda</h2>

          {/* Search bar */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-300 mb-2">
              🔍 Buscar
            </label>
            <input
              type="text"
              placeholder="Buscar por título o descripción..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-gray-100 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
            {/* Category filter */}
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold text-gray-100">Filtros</h3>
            <button
              onClick={clearFilters}
              className="text-sm text-blue-400 hover:text-blue-300"
            >
              Limpiar Filtros
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Categoría
              </label>
              <select
                value={filterCategory}
                onChange={(e) => {
                  setFilterCategory(e.target.value as EventCategory | '');
                  setCurrentPage(1);
                }}
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

            {/* Status filter */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Estado
              </label>
              <select
                value={filterStatus}
                onChange={(e) => {
                  setFilterStatus(e.target.value as EventStatus | '');
                  setCurrentPage(1);
                }}
                className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Todos los estados</option>
                <option value="open">Abierto</option>
                <option value="closed">Cerrado</option>
                <option value="resolved">Resuelto</option>
                <option value="cancelled">Cancelado</option>
              </select>
            </div>

            {/* Sort by */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Ordenar por
              </label>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="recent">Más recientes</option>
                <option value="closingSoon">Próximos a cerrar</option>
                <option value="mostBetted">Más apostados</option>
              </select>
            </div>
          </div>

          {/* Date range filters */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                📅 Fecha desde (cierre de apuestas)
              </label>
              <input
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
                className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                📅 Fecha hasta (cierre de apuestas)
              </label>
              <input
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
                className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Fecha Desde
              </label>
              <input
                type="date"
                value={dateFrom}
                onChange={(e) => {
                  setDateFrom(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Fecha Hasta
              </label>
              <input
                type="date"
                value={dateTo}
                onChange={(e) => {
                  setDateTo(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Ordenar Por
              </label>
              <select
                value={sortBy}
                onChange={(e) => {
                  setSortBy(e.target.value as 'recent' | 'closing_soon' | 'most_bets');
                  setCurrentPage(1);
                }}
                className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="recent">Más Recientes</option>
                <option value="closing_soon">Próximos a Cerrar</option>
                <option value="most_bets">Más Apostados</option>
              </select>
            </div>

            <div className="flex items-end">
              <div className="w-full p-3 bg-gray-800 border border-gray-700 rounded-lg">
                <div className="text-sm text-gray-400">Resultados Encontrados</div>
                <div className="text-2xl font-bold text-blue-400">
                  {loading ? '...' : pagination.total}
                </div>
              </div>
            </div>
          </div>

          {/* Clear filters button */}
          <button
            onClick={handleClearFilters}
            className="w-full md:w-auto px-4 py-2 bg-gray-700 hover:bg-gray-600 text-gray-300 rounded-lg font-medium transition-colors"
          >
            🗑️ Limpiar filtros
          </button>
        </div>

        {/* Results counter */}
        {pagination && (
          <div className="text-sm text-gray-400">
            Mostrando {events.length} de {pagination.total} eventos
            {(debouncedSearch || filterCategory || filterStatus || dateFrom || dateTo) && ' (filtrados)'}
          </div>
        )}

        {error && (
          <div className="bg-red-900 border border-red-700 text-red-200 px-4 py-3 rounded-lg">
            {error}
          </div>
        )}

        {loading ? (
          <div className="text-center py-12 text-gray-400">Cargando eventos...</div>
        ) : events.length === 0 ? (
          <div className="card text-center py-12 text-gray-400">
            No se encontraron eventos
            {(debouncedSearch || filterCategory || filterStatus || dateFrom || dateTo)
              ? ' con los filtros seleccionados.'
              : '.'}
          </div>
        ) : (
          <>
            No se encontraron eventos con los filtros seleccionados.
          </div>
        ) : (
          <>
            {/* Events Grid */}
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
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="px-2 py-1 bg-purple-900 text-purple-200 text-xs rounded border border-purple-700">
                          {event.category}
                        </span>
                        {event.totalBets !== undefined && event.totalBets > 0 && (
                          <span className="px-2 py-1 bg-blue-900 text-blue-200 text-xs rounded border border-blue-700">
                            {event.totalBets} apuestas
                          </span>
                        )}
                        {event.winningOption && (
                          <span className="px-2 py-1 bg-green-900 text-green-200 text-xs rounded border border-green-700">
                            Ganador: {event.winningOption}
                          </span>
                        )}
                        {getEvidencePhaseBadge(event)}
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
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
                    <div>
                      <div className="text-sm text-gray-400">Total Apostado</div>
                      <div className="text-green-400 font-bold text-lg">
                        ${formatCurrency(event.totalAmount || 0)}
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
                        Comisión del Curador: <span className="font-bold">${formatCurrency(event.curatorCommission)}</span>
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

            {/* Pagination */}
            {pagination && pagination.totalPages > 1 && (
              <Pagination
                currentPage={pagination.page}
                totalPages={pagination.totalPages}
                hasNext={pagination.hasNext}
                hasPrev={pagination.hasPrev}
                onPageChange={handlePageChange}
              />
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

            {/* Pagination */}
            {pagination.totalPages > 1 && (
              <div className="card">
                <div className="flex justify-between items-center">
                  <div className="text-sm text-gray-400">
                    Página {pagination.page} de {pagination.totalPages} • {pagination.total} resultados totales
                  </div>

                  <div className="flex gap-2">
                    <button
                      onClick={() => setCurrentPage(currentPage - 1)}
                      disabled={currentPage === 1}
                      className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-gray-300 rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Anterior
                    </button>

                    {/* Page numbers */}
                    <div className="flex gap-1">
                      {Array.from({ length: Math.min(5, pagination.totalPages) }, (_, i) => {
                        let pageNum;
                        if (pagination.totalPages <= 5) {
                          pageNum = i + 1;
                        } else if (currentPage <= 3) {
                          pageNum = i + 1;
                        } else if (currentPage >= pagination.totalPages - 2) {
                          pageNum = pagination.totalPages - 4 + i;
                        } else {
                          pageNum = currentPage - 2 + i;
                        }

                        return (
                          <button
                            key={pageNum}
                            onClick={() => setCurrentPage(pageNum)}
                            className={`w-10 h-10 rounded-lg font-medium transition-colors ${
                              currentPage === pageNum
                                ? 'bg-blue-600 text-white'
                                : 'bg-gray-700 hover:bg-gray-600 text-gray-300'
                            }`}
                          >
                            {pageNum}
                          </button>
                        );
                      })}
                    </div>

                    <button
                      onClick={() => setCurrentPage(currentPage + 1)}
                      disabled={!pagination.hasMore}
                      className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-gray-300 rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Siguiente
                    </button>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </Layout>
  );
}
