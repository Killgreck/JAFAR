import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Layout } from '../components/Layout';
import { useAuth } from '../contexts/AuthContext';
import { betsService } from '../services/bets';
import { wagersService } from '../services/wagers';
import type { Bet } from '../types';

export function BetsList() {
  const [bets, setBets] = useState<Bet[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [placingWager, setPlacingWager] = useState<string | null>(null);
  const [wagerAmounts, setWagerAmounts] = useState<Record<string, string>>({});
  const [selectedSides, setSelectedSides] = useState<Record<string, 'for' | 'against'>>({});
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
      // Initialize default sides to 'for'
      const defaultSides: Record<string, 'for' | 'against'> = {};
      data.forEach(bet => {
        defaultSides[bet.id] = 'for';
      });
      setSelectedSides(defaultSides);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Error al cargar las predicciones');
    } finally {
      setLoading(false);
    }
  };

  const calculateOdds = (totalFor: number, totalAgainst: number, side: 'for' | 'against'): number => {
    const totalPool = totalFor + totalAgainst;
    if (totalPool === 0) return 2.0;

    const sideAmount = side === 'for' ? totalFor : totalAgainst;
    if (sideAmount === 0) return 10.0;

    const odds = totalPool / sideAmount;
    return Math.max(odds, 1.01);
  };

  const calculateProbability = (totalFor: number, totalAgainst: number, side: 'for' | 'against'): number => {
    const totalPool = totalFor + totalAgainst;
    if (totalPool === 0) return 50;

    const sideAmount = side === 'for' ? totalFor : totalAgainst;
    return (sideAmount / totalPool) * 100;
  };

  const handlePlaceWager = async (betId: string) => {
    if (!user) {
      setError('Debes iniciar sesión para apostar');
      return;
    }

    const amountStr = wagerAmounts[betId];
    if (!amountStr) {
      setError('Ingresa un monto para apostar');
      return;
    }

    const amount = parseFloat(amountStr);
    if (isNaN(amount) || amount <= 0) {
      setError('El monto debe ser mayor a 0');
      return;
    }

    try {
      setPlacingWager(betId);
      setError('');
      await wagersService.placeWager({
        betId,
        userId: user.id,
        side: selectedSides[betId] || 'for',
        amount,
      });
      await refreshUser();
      await loadBets();
      // Clear the amount after successful wager
      setWagerAmounts(prev => ({ ...prev, [betId]: '' }));
    } catch (err: any) {
      setError(err.response?.data?.message || 'Error al realizar la apuesta');
    } finally {
      setPlacingWager(null);
    }
  };

  const getStatusBadge = (status: Bet['status']) => {
    const styles = {
      open: 'bg-green-900 text-green-200 border-green-700',
      settled: 'bg-gray-700 text-gray-100 border-gray-600',
      cancelled: 'bg-red-900 text-red-200 border-red-700',
    };

    const labels = {
      open: 'Abierta',
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
          <h2 className="text-2xl font-bold">Mercado de Predicciones</h2>
          <button onClick={() => navigate('/create-bet')} className="btn-primary">
            + Nueva Predicción
          </button>
        </div>

        {error && (
          <div className="bg-red-900 border border-red-700 text-red-200 px-4 py-3 rounded-lg mb-4">
            {error}
          </div>
        )}

        {bets.length === 0 ? (
          <div className="card text-center py-12">
            <div className="text-4xl mb-4">🔮</div>
            <h3 className="text-xl font-semibold text-gray-200 mb-2">
              No hay predicciones disponibles
            </h3>
            <p className="text-gray-300 mb-6">
              Sé el primero en crear una predicción
            </p>
            <button onClick={() => navigate('/create-bet')} className="btn-primary">
              Crear Primera Predicción
            </button>
          </div>
        ) : (
          <div className="grid gap-6">
            {bets.map((bet) => {
              const totalPool = bet.totalForAmount + bet.totalAgainstAmount;
              const forOdds = calculateOdds(bet.totalForAmount, bet.totalAgainstAmount, 'for');
              const againstOdds = calculateOdds(bet.totalForAmount, bet.totalAgainstAmount, 'against');
              const forProb = calculateProbability(bet.totalForAmount, bet.totalAgainstAmount, 'for');
              const againstProb = calculateProbability(bet.totalForAmount, bet.totalAgainstAmount, 'against');
              const selectedSide = selectedSides[bet.id] || 'for';

              return (
                <div key={bet.id} className="card hover:shadow-2xl transition-shadow">
                  {/* Header */}
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-3">
                        {getStatusBadge(bet.status)}
                        <span className="text-sm text-gray-400">
                          {formatDate(bet.createdAt)}
                        </span>
                      </div>
                      <h3 className="text-xl font-semibold text-gray-100 mb-2">
                        {bet.question}
                      </h3>
                    </div>
                  </div>

                  {/* Pool Stats */}
                  <div className="bg-gray-900 rounded-lg p-4 mb-4">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm text-gray-400">Pool Total</span>
                      <span className="text-lg font-bold text-green-400">${totalPool.toFixed(2)}</span>
                    </div>
                    <div className="w-full bg-gray-700 rounded-full h-2 overflow-hidden">
                      <div
                        className="bg-green-500 h-full transition-all duration-300"
                        style={{ width: `${forProb}%` }}
                      />
                    </div>
                    <div className="flex justify-between mt-2 text-xs text-gray-400">
                      <span>A Favor: ${bet.totalForAmount.toFixed(2)}</span>
                      <span>En Contra: ${bet.totalAgainstAmount.toFixed(2)}</span>
                    </div>
                  </div>

                  {/* Odds Display */}
                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div className={`p-4 rounded-lg border-2 ${selectedSide === 'for' ? 'border-green-500 bg-green-900/30' : 'border-gray-700 bg-gray-800'}`}>
                      <div className="text-center">
                        <div className="text-sm text-gray-400 mb-1">A Favor (Sí)</div>
                        <div className="text-3xl font-bold text-green-400">{forOdds.toFixed(2)}x</div>
                        <div className="text-sm text-gray-400 mt-1">{forProb.toFixed(1)}%</div>
                      </div>
                    </div>
                    <div className={`p-4 rounded-lg border-2 ${selectedSide === 'against' ? 'border-red-500 bg-red-900/30' : 'border-gray-700 bg-gray-800'}`}>
                      <div className="text-center">
                        <div className="text-sm text-gray-400 mb-1">En Contra (No)</div>
                        <div className="text-3xl font-bold text-red-400">{againstOdds.toFixed(2)}x</div>
                        <div className="text-sm text-gray-400 mt-1">{againstProb.toFixed(1)}%</div>
                      </div>
                    </div>
                  </div>

                  {/* Betting Interface */}
                  {bet.status === 'open' && (
                    <div className="border-t border-gray-700 pt-4">
                      <div className="flex gap-3 mb-3">
                        <button
                          onClick={() => setSelectedSides(prev => ({ ...prev, [bet.id]: 'for' }))}
                          className={`flex-1 py-2 px-4 rounded-lg font-medium transition-colors ${
                            selectedSide === 'for'
                              ? 'bg-green-600 text-white'
                              : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                          }`}
                        >
                          ✓ A Favor
                        </button>
                        <button
                          onClick={() => setSelectedSides(prev => ({ ...prev, [bet.id]: 'against' }))}
                          className={`flex-1 py-2 px-4 rounded-lg font-medium transition-colors ${
                            selectedSide === 'against'
                              ? 'bg-red-600 text-white'
                              : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                          }`}
                        >
                          ✗ En Contra
                        </button>
                      </div>
                      <div className="flex gap-3">
                        <div className="flex-1">
                          <div className="relative">
                            <span className="absolute left-3 top-2.5 text-gray-400">$</span>
                            <input
                              type="number"
                              step="0.01"
                              min="0.01"
                              className="input-field pl-8"
                              placeholder="Monto"
                              value={wagerAmounts[bet.id] || ''}
                              onChange={(e) => setWagerAmounts(prev => ({ ...prev, [bet.id]: e.target.value }))}
                            />
                          </div>
                        </div>
                        <button
                          onClick={() => handlePlaceWager(bet.id)}
                          disabled={placingWager === bet.id || !wagerAmounts[bet.id]}
                          className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
                        >
                          {placingWager === bet.id ? 'Apostando...' : 'Apostar'}
                        </button>
                      </div>
                      {wagerAmounts[bet.id] && parseFloat(wagerAmounts[bet.id]) > 0 && (
                        <div className="mt-3 p-3 bg-blue-900/50 border border-blue-700 rounded-lg text-sm">
                          <span className="text-gray-300">Ganancia potencial: </span>
                          <span className="text-blue-300 font-semibold">
                            ${(parseFloat(wagerAmounts[bet.id]) * (selectedSide === 'for' ? forOdds : againstOdds)).toFixed(2)}
                          </span>
                        </div>
                      )}
                    </div>
                  )}

                  {bet.status === 'settled' && (
                    <div className="border-t border-gray-700 pt-4">
                      <div className="text-center py-2">
                        <span className="text-gray-400">Resultado: </span>
                        <span className={`font-bold ${bet.result === 'for' ? 'text-green-400' : 'text-red-400'}`}>
                          {bet.result === 'for' ? 'A Favor ✓' : 'En Contra ✗'}
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        <button onClick={() => navigate('/dashboard')} className="btn-secondary w-full">
          Volver al Dashboard
        </button>
      </div>
    </Layout>
  );
}
