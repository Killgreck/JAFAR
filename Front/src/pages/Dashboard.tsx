import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Layout } from '../components/Layout';
import { useAuth } from '../contexts/AuthContext';
import { betsService } from '../services/bets';
import type { Bet } from '../types';

export function Dashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [bets, setBets] = useState<Bet[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadBets();
  }, []);

  const loadBets = async () => {
    try {
      setLoading(true);
      const data = await betsService.list();
      setBets(data);
    } catch (err) {
      console.error('Error loading bets:', err);
    } finally {
      setLoading(false);
    }
  };

  const activeBets = bets.filter(
    (bet) =>
      (bet.status === 'open' || bet.status === 'accepted') &&
      (bet.creator === user?.id || bet.opponent === user?.id)
  );

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
          <h2 className="text-2xl font-bold mb-4">Bienvenido a JAFAR</h2>
          <p className="text-gray-600 mb-6">
            Hola <span className="font-semibold">{user?.username}</span>, bienvenido a la plataforma de apuestas P2P.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
              <div className="text-sm text-blue-600 font-medium">Balance</div>
              <div className="text-2xl font-bold text-blue-900">
                ${user?.balance?.toFixed(2) || '0.00'}
              </div>
            </div>

            <div className="p-4 bg-green-50 rounded-lg border border-green-200">
              <div className="text-sm text-green-600 font-medium">Apuestas Activas</div>
              <div className="text-2xl font-bold text-green-900">
                {loading ? '...' : activeBets.length}
              </div>
            </div>

            <div className="p-4 bg-purple-50 rounded-lg border border-purple-200">
              <div className="text-sm text-purple-600 font-medium">Total Ganado</div>
              <div className="text-2xl font-bold text-purple-900">$0.00</div>
            </div>
          </div>
        </div>

        <div className="card">
          <h3 className="text-xl font-bold mb-4">Apuestas Recientes</h3>
          {loading ? (
            <div className="text-center py-12 text-gray-500">Cargando...</div>
          ) : recentBets.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              No hay apuestas disponibles en este momento.
            </div>
          ) : (
            <div className="space-y-3">
              {recentBets.map((bet) => (
                <div
                  key={bet.id}
                  className="flex justify-between items-center p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <div className="flex-1">
                    <p className="text-sm text-gray-800 line-clamp-1">
                      {bet.description}
                    </p>
                    <span className="text-xs text-gray-500">
                      {formatDate(bet.createdAt)}
                    </span>
                  </div>
                  <div className="text-right ml-4">
                    <div className="font-bold text-green-600">
                      ${bet.amount.toFixed(2)}
                    </div>
                    <span className="text-xs text-gray-500 capitalize">
                      {bet.status === 'open' ? 'Abierta' : bet.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="card">
          <h3 className="text-xl font-bold mb-4">Acciones Rápidas</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <button
              onClick={() => navigate('/create-bet')}
              className="btn-primary py-4"
            >
              Crear Nueva Apuesta
            </button>
            <button
              onClick={() => navigate('/bets')}
              className="btn-secondary py-4"
            >
              Ver Todas las Apuestas
            </button>
          </div>
        </div>
      </div>
    </Layout>
  );
}
