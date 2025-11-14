import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { transactionsService } from '../services/transactions';
import type { Transaction, TransactionType } from '../types';

/**
 * Transaction type display configuration
 */
const TRANSACTION_TYPE_CONFIG: Record<TransactionType, {
  label: string;
  color: string;
  sign: string;
}> = {
  deposit: { label: 'Depósito', color: 'text-green-400', sign: '+' },
  withdraw: { label: 'Retiro', color: 'text-red-400', sign: '-' },
  block: { label: 'Bloqueo', color: 'text-yellow-400', sign: '-' },
  release: { label: 'Liberación', color: 'text-green-400', sign: '+' },
  win: { label: 'Ganancia', color: 'text-green-400', sign: '+' },
  loss: { label: 'Pérdida', color: 'text-red-400', sign: '-' },
  commission: { label: 'Comisión', color: 'text-blue-400', sign: '+' },
};

export default function TransactionHistory() {
  const navigate = useNavigate();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [hasMore, setHasMore] = useState(false);

  // Filter state
  const [selectedType, setSelectedType] = useState<TransactionType | ''>('');

  // Statistics state
  const [stats, setStats] = useState<{
    totalTransactions: number;
    totalDeposits: number;
    totalWithdrawals: number;
    totalWins: number;
    totalLosses: number;
    netGain: number;
  } | null>(null);

  // Get user from localStorage
  const userStr = localStorage.getItem('user');
  const user = userStr ? JSON.parse(userStr) : null;
  const userId = user?.id;

  useEffect(() => {
    if (!userId) {
      navigate('/login');
      return;
    }

    loadTransactions();
    loadStats();
  }, [userId, currentPage, selectedType]);

  const loadTransactions = async () => {
    if (!userId) return;

    try {
      setLoading(true);
      setError('');

      const filters: any = {
        page: currentPage,
        limit: 50,
      };

      if (selectedType) {
        filters.type = selectedType;
      }

      const result = await transactionsService.getUserTransactions(userId, filters);

      setTransactions(result.transactions);
      setTotal(result.pagination.total);
      setCurrentPage(result.pagination.page);
      setTotalPages(result.pagination.totalPages);
      setHasMore(result.pagination.hasMore);
    } catch (err: any) {
      console.error('Error loading transactions:', err);
      setError(err.response?.data?.error || 'Error al cargar el historial de transacciones');
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async () => {
    if (!userId) return;

    try {
      const statistics = await transactionsService.getTransactionStats(userId);
      setStats(statistics);
    } catch (err: any) {
      console.error('Error loading stats:', err);
    }
  };

  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setCurrentPage(newPage);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleTypeFilterChange = (type: TransactionType | '') => {
    setSelectedType(type);
    setCurrentPage(1);
  };

  const handleClearFilters = () => {
    setSelectedType('');
    setCurrentPage(1);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString('es-ES', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatAmount = (amount: number) => {
    return new Intl.NumberFormat('es-ES', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
    }).format(Math.abs(amount));
  };

  const getPageNumbers = () => {
    const pageNumbers: number[] = [];
    const maxVisible = 5;

    if (totalPages <= maxVisible) {
      for (let i = 1; i <= totalPages; i++) {
        pageNumbers.push(i);
      }
    } else {
      if (currentPage <= 3) {
        for (let i = 1; i <= maxVisible; i++) {
          pageNumbers.push(i);
        }
      } else if (currentPage >= totalPages - 2) {
        for (let i = totalPages - maxVisible + 1; i <= totalPages; i++) {
          pageNumbers.push(i);
        }
      } else {
        for (let i = currentPage - 2; i <= currentPage + 2; i++) {
          pageNumbers.push(i);
        }
      }
    }

    return pageNumbers;
  };

  if (!userId) {
    return null;
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-2">Historial de Transacciones</h1>
        <p className="text-gray-400">Audita todos los movimientos de tu wallet</p>
      </div>

      {/* Statistics Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
          <div className="bg-gray-800 rounded-lg p-4">
            <p className="text-gray-400 text-sm mb-1">Total Transacciones</p>
            <p className="text-2xl font-bold text-white">{stats.totalTransactions}</p>
          </div>
          <div className="bg-gray-800 rounded-lg p-4">
            <p className="text-gray-400 text-sm mb-1">Total Depósitos</p>
            <p className="text-2xl font-bold text-green-400">{formatAmount(stats.totalDeposits)}</p>
          </div>
          <div className="bg-gray-800 rounded-lg p-4">
            <p className="text-gray-400 text-sm mb-1">Total Retiros</p>
            <p className="text-2xl font-bold text-red-400">{formatAmount(stats.totalWithdrawals)}</p>
          </div>
          <div className="bg-gray-800 rounded-lg p-4">
            <p className="text-gray-400 text-sm mb-1">Total Ganancias</p>
            <p className="text-2xl font-bold text-green-400">{formatAmount(stats.totalWins)}</p>
          </div>
          <div className="bg-gray-800 rounded-lg p-4">
            <p className="text-gray-400 text-sm mb-1">Total Pérdidas</p>
            <p className="text-2xl font-bold text-red-400">{formatAmount(stats.totalLosses)}</p>
          </div>
          <div className="bg-gray-800 rounded-lg p-4">
            <p className="text-gray-400 text-sm mb-1">Ganancia Neta</p>
            <p className={`text-2xl font-bold ${stats.netGain >= 0 ? 'text-green-400' : 'text-red-400'}`}>
              {formatAmount(stats.netGain)}
            </p>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="bg-gray-800 rounded-lg p-6 mb-6">
        <div className="flex flex-wrap gap-4 items-end">
          {/* Type Filter */}
          <div className="flex-1 min-w-[200px]">
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Tipo de Transacción
            </label>
            <select
              value={selectedType}
              onChange={(e) => handleTypeFilterChange(e.target.value as TransactionType | '')}
              className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Todos los tipos</option>
              <option value="deposit">Depósito</option>
              <option value="withdraw">Retiro</option>
              <option value="block">Bloqueo</option>
              <option value="release">Liberación</option>
              <option value="win">Ganancia</option>
              <option value="loss">Pérdida</option>
              <option value="commission">Comisión</option>
            </select>
          </div>

          {/* Clear Filters Button */}
          {selectedType && (
            <button
              onClick={handleClearFilters}
              className="px-4 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition"
            >
              Limpiar Filtros
            </button>
          )}
        </div>

        {/* Results Counter */}
        {!loading && (
          <div className="mt-4 text-gray-400">
            Mostrando {transactions.length} de {total} transacciones
          </div>
        )}
      </div>

      {/* Error Message */}
      {error && (
        <div className="mb-6 p-4 bg-red-900/50 border border-red-700 rounded-lg text-red-200">
          {error}
        </div>
      )}

      {/* Loading State */}
      {loading ? (
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-white"></div>
          <p className="mt-4 text-gray-400">Cargando transacciones...</p>
        </div>
      ) : transactions.length === 0 ? (
        <div className="bg-gray-800 rounded-lg p-12 text-center">
          <p className="text-gray-400 text-lg">No se encontraron transacciones</p>
        </div>
      ) : (
        <>
          {/* Transactions Table */}
          <div className="bg-gray-800 rounded-lg overflow-hidden mb-6">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-700">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                      Fecha
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                      Tipo
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-300 uppercase tracking-wider">
                      Monto
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-300 uppercase tracking-wider">
                      Balance Resultante
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                      Descripción
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-700">
                  {transactions.map((transaction) => {
                    const typeConfig = TRANSACTION_TYPE_CONFIG[transaction.type];
                    const isNegative = ['withdraw', 'block', 'loss'].includes(transaction.type);

                    return (
                      <tr key={transaction.id} className="hover:bg-gray-700/50 transition">
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                          {formatDate(transaction.createdAt)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span
                            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${typeConfig.color} bg-gray-700`}
                          >
                            {typeConfig.label}
                          </span>
                        </td>
                        <td className={`px-6 py-4 whitespace-nowrap text-sm text-right font-medium ${typeConfig.color}`}>
                          {typeConfig.sign}{formatAmount(transaction.amount)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-gray-300">
                          {formatAmount(transaction.balanceAfter)}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-400">
                          <div>
                            {transaction.description}
                            {transaction.relatedEvent && (
                              <div className="mt-1 text-xs text-blue-400">
                                Evento: {transaction.relatedEvent.title}
                              </div>
                            )}
                            {transaction.relatedBet && (
                              <div className="mt-1 text-xs text-blue-400">
                                Apuesta: {transaction.relatedBet.question}
                              </div>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between bg-gray-800 px-6 py-4 rounded-lg">
              <div className="text-sm text-gray-400">
                Página {currentPage} de {totalPages}
              </div>

              <div className="flex gap-2">
                {/* Previous Button */}
                <button
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage === 1}
                  className="px-4 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed transition"
                >
                  Anterior
                </button>

                {/* Page Numbers */}
                {getPageNumbers().map((pageNum) => (
                  <button
                    key={pageNum}
                    onClick={() => handlePageChange(pageNum)}
                    className={`px-4 py-2 rounded-lg transition ${
                      currentPage === pageNum
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-700 text-white hover:bg-gray-600'
                    }`}
                  >
                    {pageNum}
                  </button>
                ))}

                {/* Next Button */}
                <button
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={!hasMore}
                  className="px-4 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed transition"
                >
                  Siguiente
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
