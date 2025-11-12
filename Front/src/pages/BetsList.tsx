import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Layout } from '../components/Layout';
import { useAuth } from '../contexts/AuthContext';
import { betsService } from '../services/bets';
import type { Bet } from '../types';

export function BetsList() {
  const [bets, setBets] = useState<Bet[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [acceptingBetId, setAcceptingBetId] = useState<string | null>(null);
  const { user, refreshUser } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    loadBets();
  }, []);

  const loadBets = async () => {
    try {
      setLoading(true);
      const data = await betsService.list();
      setBets(data);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Error al cargar las apuestas');
    } finally {
      setLoading(false);
    }
  };

  const handleAcceptBet = async (betId: string) => {
    if (!user) {
      setError('Debes iniciar sesión para aceptar una apuesta');
      return;
    }

    try {
      setAcceptingBetId(betId);
      setError('');
      await betsService.accept(betId, user.id);
      await refreshUser();
      await loadBets();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Error al aceptar la apuesta');
    } finally {
      setAcceptingBetId(null);
    }
  };

  const getStatusBadge = (status: Bet['status']) => {
    const styles = {
      open: 'bg-green-100 text-green-800 border-green-200',
      accepted: 'bg-blue-100 text-blue-200 border-blue-200',
      settled: 'bg-gray-700 text-gray-100 border-gray-600',
      cancelled: 'bg-red-100 text-red-800 border-red-200',
    };

    const labels = {
      open: 'Abierta',
      accepted: 'Aceptada',
      settled: 'Finalizada',
      cancelled: 'Cancelada',
    };

    return (
      <span className={`px-3 py-1 rounded-full text-xs font-medium border ${styles[status]}`}>
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

  if (loading) {
    return (
      <Layout>
        <div className="text-center py-12">
          <div className="text-xl text-gray-300">Cargando apuestas...</div>
        </div>
      </Layout>
    );
  }

  if (error) {
    return (
      <Layout>
        <div className="card">
          <div className="bg-red-900 border border-red-700 text-red-200 px-4 py-3 rounded-lg">
            {error}
          </div>
          <button onClick={loadBets} className="btn-primary mt-4">
            Reintentar
          </button>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-bold">Todas las Apuestas</h2>
          <button onClick={() => navigate('/create-bet')} className="btn-primary">
            + Nueva Apuesta
          </button>
        </div>

        {bets.length === 0 ? (
          <div className="card text-center py-12">
            <div className="text-4xl mb-4">🎲</div>
            <h3 className="text-xl font-semibold text-gray-200 mb-2">
              No hay apuestas disponibles
            </h3>
            <p className="text-gray-300 mb-6">
              Sé el primero en crear una apuesta
            </p>
            <button onClick={() => navigate('/create-bet')} className="btn-primary">
              Crear Primera Apuesta
            </button>
          </div>
        ) : (
          <div className="grid gap-4">
            {bets.map((bet) => (
              <div key={bet.id} className="card hover:shadow-lg transition-shadow">
                <div className="flex justify-between items-start mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      {getStatusBadge(bet.status)}
                      <span className="text-sm text-gray-400">
                        {formatDate(bet.createdAt)}
                      </span>
                    </div>
                    <p className="text-gray-100 whitespace-pre-wrap">{bet.description}</p>
                  </div>
                </div>

                <div className="border-t border-gray-700 pt-4 mt-4">
                  <div className="flex gap-6 mb-4">
                    <div>
                      <span className="text-sm text-gray-400">Monto</span>
                      <div className="text-2xl font-bold text-green-400">
                        ${bet.amount.toFixed(2)}
                      </div>
                    </div>
                    <div>
                      <span className="text-sm text-gray-400">Creador</span>
                      <div className="text-sm font-medium">
                        {bet.creator === user?.id ? (
                          <span className="text-blue-400">Tú</span>
                        ) : (
                          <span className="text-gray-200">
                            ID: {bet.creator.slice(-6)}
                          </span>
                        )}
                      </div>
                    </div>
                    <div>
                      <span className="text-sm text-gray-400">Posición del Creador</span>
                      <div className="text-sm font-medium">
                        <span className={bet.creatorSide === 'for' ? 'text-green-400' : 'text-red-400'}>
                          {bet.creatorSide === 'for' ? 'A Favor ✓' : 'En Contra ✗'}
                        </span>
                      </div>
                    </div>
                    {bet.opponent && (
                      <>
                        <div>
                          <span className="text-sm text-gray-400">Oponente</span>
                          <div className="text-sm font-medium">
                            {bet.opponent === user?.id ? (
                              <span className="text-blue-400">Tú</span>
                            ) : (
                              <span className="text-gray-200">
                                ID: {bet.opponent.slice(-6)}
                              </span>
                            )}
                          </div>
                        </div>
                        <div>
                          <span className="text-sm text-gray-400">Posición del Oponente</span>
                          <div className="text-sm font-medium">
                            <span className={bet.creatorSide === 'for' ? 'text-red-400' : 'text-green-400'}>
                              {bet.creatorSide === 'for' ? 'En Contra ✗' : 'A Favor ✓'}
                            </span>
                          </div>
                        </div>
                      </>
                    )}
                  </div>

                  {bet.status === 'open' && bet.creator !== user?.id && (
                    <div className="bg-blue-900 border border-blue-700 rounded-lg p-3 flex justify-between items-center">
                      <div className="text-sm">
                        <span className="text-gray-300">Tu posición será: </span>
                        <span className={bet.creatorSide === 'for' ? 'text-red-400 font-semibold' : 'text-green-400 font-semibold'}>
                          {bet.creatorSide === 'for' ? 'En Contra ✗' : 'A Favor ✓'}
                        </span>
                      </div>
                      <button
                        onClick={() => handleAcceptBet(bet.id)}
                        disabled={acceptingBetId === bet.id}
                        className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {acceptingBetId === bet.id ? 'Aceptando...' : 'Aceptar Apuesta'}
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        <button onClick={() => navigate('/dashboard')} className="btn-secondary w-full">
          Volver al Dashboard
        </button>
      </div>
    </Layout>
  );
}
