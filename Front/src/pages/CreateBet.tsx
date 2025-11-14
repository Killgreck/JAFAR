import { useState } from 'react';
import type { FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { Layout } from '../components/Layout';
import { useAuth } from '../contexts/AuthContext';
import { betsService } from '../services/bets';

export function CreateBet() {
  const [question, setQuestion] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');

    if (!user) {
      setError('Debes iniciar sesión para crear una predicción');
      return;
    }

    if (!question.trim()) {
      setError('La pregunta no puede estar vacía');
      return;
    }

    setLoading(true);

    try {
      await betsService.create({
        creator: user.id,
        question,
      });

      navigate('/bets');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Error al crear la predicción');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout>
      <div className="max-w-2xl mx-auto">
        <div className="card">
          <h2 className="text-2xl font-bold mb-6">Crear Nueva Predicción</h2>

          {error && (
            <div className="bg-red-900 border border-red-700 text-red-200 px-4 py-3 rounded-lg mb-4">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="question" className="block text-sm font-medium text-gray-200 mb-2">
                Pregunta de Predicción
              </label>
              <textarea
                id="question"
                required
                className="input-field min-h-32"
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                placeholder="Ej: ¿Ganarán los Yankees el viernes?"
                rows={4}
              />
              <p className="text-sm text-gray-400 mt-1">
                Formula una pregunta clara que pueda responderse con Sí o No
              </p>
            </div>

            <div className="bg-blue-900 border border-blue-700 rounded-lg p-4">
              <h3 className="font-semibold text-blue-100 mb-2">Cómo Funciona</h3>
              <ul className="text-sm text-blue-200 space-y-1">
                <li>• La predicción será visible para todos los usuarios</li>
                <li>• Los usuarios podrán apostar A Favor o En Contra</li>
                <li>• Las probabilidades se ajustan según las apuestas</li>
                <li>• Mayores ganancias por apostar en el lado menos popular</li>
              </ul>
            </div>

            <div className="flex gap-4">
              <button
                type="submit"
                disabled={loading}
                className="flex-1 btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Creando...' : 'Crear Predicción'}
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
