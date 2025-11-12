import { Link } from 'react-router-dom';

export function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center mb-12">
          <h1 className="text-6xl font-bold text-blue-600 mb-4">JAFAR</h1>
          <p className="text-2xl text-gray-700 mb-2">Plataforma de Apuestas P2P</p>
          <p className="text-lg text-gray-600">
            Transparencia, comisiones reducidas y libertad total
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
          <div className="card text-center">
            <div className="text-4xl mb-4">🎯</div>
            <h3 className="text-xl font-bold mb-2">Apuestas Personalizadas</h3>
            <p className="text-gray-600">
              Crea apuestas sobre cualquier evento verificable
            </p>
          </div>

          <div className="card text-center">
            <div className="text-4xl mb-4">💰</div>
            <h3 className="text-xl font-bold mb-2">Comisiones Bajas</h3>
            <p className="text-gray-600">
              Solo 5% de comisión en todas las transacciones
            </p>
          </div>

          <div className="card text-center">
            <div className="text-4xl mb-4">🔒</div>
            <h3 className="text-xl font-bold mb-2">Transparente y Seguro</h3>
            <p className="text-gray-600">
              Sistema P2P con verificación clara de resultados
            </p>
          </div>
        </div>

        <div className="text-center space-x-4">
          <Link to="/register" className="btn-primary text-lg px-8 py-3 inline-block">
            Comenzar Ahora
          </Link>
          <Link to="/login" className="btn-secondary text-lg px-8 py-3 inline-block">
            Iniciar Sesión
          </Link>
        </div>

        <div className="mt-16 card">
          <h2 className="text-2xl font-bold mb-4">¿Cómo Funciona?</h2>
          <ol className="space-y-4 text-gray-700">
            <li className="flex items-start">
              <span className="font-bold text-blue-600 mr-3">1.</span>
              <span>Regístrate y crea tu cuenta en minutos</span>
            </li>
            <li className="flex items-start">
              <span className="font-bold text-blue-600 mr-3">2.</span>
              <span>Deposita fondos en tu wallet digital</span>
            </li>
            <li className="flex items-start">
              <span className="font-bold text-blue-600 mr-3">3.</span>
              <span>Crea una apuesta o acepta una existente</span>
            </li>
            <li className="flex items-start">
              <span className="font-bold text-blue-600 mr-3">4.</span>
              <span>Espera la resolución del evento</span>
            </li>
            <li className="flex items-start">
              <span className="font-bold text-blue-600 mr-3">5.</span>
              <span>Recibe tus ganancias automáticamente</span>
            </li>
          </ol>
        </div>
      </div>
    </div>
  );
}
