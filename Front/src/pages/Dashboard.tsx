import { Layout } from '../components/Layout';
import { useAuth } from '../contexts/AuthContext';

export function Dashboard() {
  const { user } = useAuth();

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
              <div className="text-2xl font-bold text-green-900">0</div>
            </div>

            <div className="p-4 bg-purple-50 rounded-lg border border-purple-200">
              <div className="text-sm text-purple-600 font-medium">Total Ganado</div>
              <div className="text-2xl font-bold text-purple-900">$0.00</div>
            </div>
          </div>
        </div>

        <div className="card">
          <h3 className="text-xl font-bold mb-4">Apuestas Recientes</h3>
          <div className="text-center py-12 text-gray-500">
            No hay apuestas disponibles en este momento.
          </div>
        </div>

        <div className="card">
          <h3 className="text-xl font-bold mb-4">Acciones Rápidas</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <button className="btn-primary py-4">
              Crear Nueva Apuesta
            </button>
            <button className="btn-secondary py-4">
              Ver Todas las Apuestas
            </button>
          </div>
        </div>
      </div>
    </Layout>
  );
}
