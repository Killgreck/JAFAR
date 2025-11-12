import { useState, FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { Layout } from '../components/Layout';
import { useAuth } from '../contexts/AuthContext';
import { betsService } from '../services/bets';

export function CreateBet() {
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');

    if (!user) {
      setError('Debes iniciar sesión para crear una apuesta');
      return;
    }

    const amountNum = parseFloat(amount);
    if (isNaN(amountNum) || amountNum <= 0) {
      setError('El monto debe ser un número mayor a 0');
      return;
    }

    setLoading(true);

    try {
      await betsService.create({
        creator: user.id,
        description,
        amount: amountNum,
      });

      navigate('/bets');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Error al crear la apuesta');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout>
      <div className="max-w-2xl mx-auto">
        <div className="card">
          <h2 className="text-2xl font-bold mb-6">Crear Nueva Apuesta</h2>

          {error && (
            <div className="bg-red-900 border border-red-700 text-red-200 px-4 py-3 rounded-lg mb-4">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="description" className="block text-sm font-medium text-gray-200 mb-2">
                Descripción de la Apuesta
              </label>
              <textarea
                id="description"
                required
                className="input-field min-h-32"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Describe aquí los términos de la apuesta..."
                rows={4}
              />
              <p className="text-sm text-gray-400 mt-1">
                Sé claro y específico sobre los términos de la apuesta
              </p>
            </div>

            <div>
              <label htmlFor="amount" className="block text-sm font-medium text-gray-200 mb-2">
                Monto de la Apuesta (USD)
              </label>
              <div className="relative">
                <span className="absolute left-3 top-2 text-gray-400">$</span>
                <input
                  id="amount"
                  type="number"
                  required
                  step="0.01"
                  min="0.01"
                  className="input-field pl-8"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="0.00"
                />
              </div>
              <p className="text-sm text-gray-400 mt-1">
                Cantidad que deseas apostar
              </p>
            </div>

            <div className="bg-blue-900 border border-blue-700 rounded-lg p-4">
              <h3 className="font-semibold text-blue-100 mb-2">Información Importante</h3>
              <ul className="text-sm text-blue-200 space-y-1">
                <li>• La apuesta será visible para todos los usuarios</li>
                <li>• Comisión del 5% sobre el monto total</li>
                <li>• Una vez creada, otros usuarios podrán aceptarla</li>
              </ul>
            </div>

            <div className="flex gap-4">
              <button
                type="submit"
                disabled={loading}
                className="flex-1 btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Creando...' : 'Crear Apuesta'}
              </button>
              <button
                type="button"
                onClick={() => navigate('/dashboard')}
                className="flex-1 btn-secondary"
                disabled={loading}
              >
                Cancelar
              </button>
            </div>
          </form>
        </div>
      </div>
    </Layout>
  );
}
