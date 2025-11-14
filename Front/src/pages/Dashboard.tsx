import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Layout } from '../components/Layout';
import { useAuth } from '../contexts/AuthContext';
import { betsService } from '../services/bets';
import { wagersService } from '../services/wagers';
import type { Bet, Wager } from '../types';

export function Dashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [bets, setBets] = useState<Bet[]>([]);
  const [userWagers, setUserWagers] = useState<Wager[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadBets();
  }, []);

  const loadBets = async () => {
    try {
      setLoading(true);
      const data = await betsService.list();
      setBets(data);

      // Load user's wagers if logged in
      if (user) {
        const wagers = await wagersService.getByUser(user.id);
        setUserWagers(wagers);
      }
    } catch (err) {
      console.error('Error loading bets:', err);
    } finally {
      setLoading(false);
    }
  };

  // Count active wagers (on open predictions)
  const activeWagersCount = userWagers.filter((wager) => {
    const bet = bets.find(b => b.id === wager.bet);
    return bet?.status === 'open';
  }).length;

  const recentBets = bets.slice(0, 5);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('es-ES', {
      month: 'short',
      day: 'numeric',
    });
  };

  return (
    <Layout>
      <div className="space-y-6">
        <div className="card">
          <h2 className="text-2xl font-bold mb-4 text-gray-100">Bienvenido a JAFAR</h2>
          <p className="text-gray-300 mb-6">
            Hola <span className="font-semibold text-blue-400">{user?.username}</span>, bienvenido al mercado de predicciones.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 bg-blue-900 rounded-lg border border-blue-700">
              <div className="text-sm text-blue-300 font-medium">Balance</div>
              <div className="text-2xl font-bold text-blue-100">
                ${user?.balance?.toFixed(2) || '0.00'}
              </div>
            </div>

            <div className="p-4 bg-green-900 rounded-lg border border-green-700">
              <div className="text-sm text-green-300 font-medium">Apuestas Activas</div>
              <div className="text-2xl font-bold text-green-100">
                {loading ? '...' : activeWagersCount}
              </div>
            </div>

            <div className="p-4 bg-purple-900 rounded-lg border border-purple-700">
              <div className="text-sm text-purple-300 font-medium">Total Apostado</div>
              <div className="text-2xl font-bold text-purple-100">
                ${userWagers.reduce((sum, w) => sum + w.amount, 0).toFixed(2)}
              </div>
            </div>
          </div>
        </div>

        <div className="card">
          <h3 className="text-xl font-bold mb-4 text-gray-100">Predicciones Recientes</h3>
          {loading ? (
            <div className="text-center py-12 text-gray-400">Cargando...</div>
          ) : recentBets.length === 0 ? (
            <div className="text-center py-12 text-gray-400">
              No hay predicciones disponibles en este momento.
            </div>
          ) : (
            <div className="space-y-3">
              {recentBets.map((bet) => {
                const totalPool = bet.totalForAmount + bet.totalAgainstAmount;
                return (
                  <div
                    key={bet.id}
                    className="flex justify-between items-center p-4 bg-gray-900 rounded-lg hover:bg-gray-700 transition-colors cursor-pointer border border-gray-700"
                    onClick={() => navigate('/bets')}
                  >
                    <div className="flex-1">
                      <p className="text-sm text-gray-100 line-clamp-1 font-medium">
                        {bet.question}
                      </p>
                      <span className="text-xs text-gray-400">
                        {formatDate(bet.createdAt)}
                      </span>
                    </div>
                    <div className="text-right ml-4">
                      <div className="font-bold text-green-400">
                        ${totalPool.toFixed(2)}
                      </div>
                      <span className="text-xs text-gray-400 capitalize">
                        {bet.status === 'open' ? 'Abierta' : bet.status === 'settled' ? 'Finalizada' : 'Cancelada'}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div className="card">
          <h3 className="text-xl font-bold mb-4 text-gray-100">Acciones Rápidas</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <button
              onClick={() => navigate('/create-bet')}
              className="btn-primary py-4"
            >
              Crear Nueva Predicción
            </button>
            <button
              onClick={() => navigate('/create-event')}
              className="btn-primary py-4"
            >
              Crear Nuevo Evento
            </button>
            <button
              onClick={() => navigate('/bets')}
              className="btn-secondary py-4"
            >
              Ver Predicciones
            </button>
            <button
              onClick={() => navigate('/events')}
              className="btn-secondary py-4"
            >
              Ver Eventos
            </button>
          </div>
        </div>
      </div>
    </Layout>
  );
}
