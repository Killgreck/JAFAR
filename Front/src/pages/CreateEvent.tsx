import { useState, FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { Layout } from '../components/Layout';
import { useAuth } from '../contexts/AuthContext';
import { eventsService } from '../services/events';
import type { EventCategory } from '../types';

export function CreateEvent() {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<EventCategory>('Deportes');
  const [bettingDeadline, setBettingDeadline] = useState('');
  const [expectedResolutionDate, setExpectedResolutionDate] = useState('');
  const [resultOptions, setResultOptions] = useState<string[]>(['', '']);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();
  const navigate = useNavigate();

  const categories: EventCategory[] = ['Deportes', 'Política', 'Entretenimiento', 'Economía', 'Otros'];

  const handleAddOption = () => {
    if (resultOptions.length < 10) {
      setResultOptions([...resultOptions, '']);
    }
  };

  const handleRemoveOption = (index: number) => {
    if (resultOptions.length > 2) {
      setResultOptions(resultOptions.filter((_, i) => i !== index));
    }
  };

  const handleOptionChange = (index: number, value: string) => {
    const newOptions = [...resultOptions];
    newOptions[index] = value;
    setResultOptions(newOptions);
  };

  const validateForm = (): string | null => {
    if (!user) {
      return 'Debes iniciar sesión para crear un evento';
    }

    if (title.length < 10 || title.length > 200) {
      return 'El título debe tener entre 10 y 200 caracteres';
    }

    if (description.length < 20 || description.length > 1000) {
      return 'La descripción debe tener entre 20 y 1000 caracteres';
    }

    if (!bettingDeadline) {
      return 'Debes seleccionar una fecha de cierre de apuestas';
    }

    if (!expectedResolutionDate) {
      return 'Debes seleccionar una fecha de resolución esperada';
    }

    const deadlineDate = new Date(bettingDeadline);
    const resolutionDate = new Date(expectedResolutionDate);
    const now = new Date();
    const oneHourFromNow = new Date(now.getTime() + 60 * 60 * 1000);

    if (deadlineDate < oneHourFromNow) {
      return 'La fecha de cierre debe ser al menos 1 hora en el futuro';
    }

    if (resolutionDate <= deadlineDate) {
      return 'La fecha de resolución debe ser posterior a la fecha de cierre';
    }

    const filledOptions = resultOptions.filter(opt => opt.trim() !== '');
    if (filledOptions.length < 2) {
      return 'Debes proporcionar al menos 2 opciones de resultado';
    }

    if (filledOptions.length > 10) {
      return 'No puedes tener más de 10 opciones de resultado';
    }

    return null;
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');

    const validationError = validateForm();
    if (validationError) {
      setError(validationError);
      return;
    }

    setLoading(true);

    try {
      const filledOptions = resultOptions.filter(opt => opt.trim() !== '');

      await eventsService.create({
        title,
        description,
        category,
        bettingDeadline: new Date(bettingDeadline),
        expectedResolutionDate: new Date(expectedResolutionDate),
        resultOptions: filledOptions,
      });

      navigate('/dashboard');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Error al crear el evento');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout>
      <div className="max-w-3xl mx-auto">
        <div className="card">
          <h2 className="text-2xl font-bold mb-6">Crear Nuevo Evento</h2>

          {error && (
            <div className="bg-red-900 border border-red-700 text-red-200 px-4 py-3 rounded-lg mb-4">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="title" className="block text-sm font-medium text-gray-200 mb-2">
                Título del Evento *
              </label>
              <input
                id="title"
                type="text"
                required
                className="input-field"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Ej: ¿Quién ganará la Copa del Mundo 2026?"
                minLength={10}
                maxLength={200}
              />
              <p className="text-sm text-gray-400 mt-1">
                {title.length}/200 caracteres (mínimo 10)
              </p>
            </div>

            <div>
              <label htmlFor="description" className="block text-sm font-medium text-gray-200 mb-2">
                Descripción *
              </label>
              <textarea
                id="description"
                required
                className="input-field min-h-32"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Describe el evento y las condiciones para determinar el resultado..."
                rows={4}
                minLength={20}
                maxLength={1000}
              />
              <p className="text-sm text-gray-400 mt-1">
                {description.length}/1000 caracteres (mínimo 20)
              </p>
            </div>

            <div>
              <label htmlFor="category" className="block text-sm font-medium text-gray-200 mb-2">
                Categoría *
              </label>
              <select
                id="category"
                required
                className="input-field"
                value={category}
                onChange={(e) => setCategory(e.target.value as EventCategory)}
              >
                {categories.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="bettingDeadline" className="block text-sm font-medium text-gray-200 mb-2">
                  Fecha de Cierre de Apuestas *
                </label>
                <input
                  id="bettingDeadline"
                  type="datetime-local"
                  required
                  className="input-field"
                  value={bettingDeadline}
                  onChange={(e) => setBettingDeadline(e.target.value)}
                />
                <p className="text-sm text-gray-400 mt-1">
                  Debe ser al menos 1 hora en el futuro
                </p>
              </div>

              <div>
                <label htmlFor="expectedResolutionDate" className="block text-sm font-medium text-gray-200 mb-2">
                  Fecha de Resolución Esperada *
                </label>
                <input
                  id="expectedResolutionDate"
                  type="datetime-local"
                  required
                  className="input-field"
                  value={expectedResolutionDate}
                  onChange={(e) => setExpectedResolutionDate(e.target.value)}
                />
                <p className="text-sm text-gray-400 mt-1">
                  Debe ser posterior al cierre de apuestas
                </p>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-200 mb-2">
                Opciones de Resultado * (2-10 opciones)
              </label>
              <div className="space-y-2">
                {resultOptions.map((option, index) => (
                  <div key={index} className="flex gap-2">
                    <input
                      type="text"
                      className="input-field flex-1"
                      value={option}
                      onChange={(e) => handleOptionChange(index, e.target.value)}
                      placeholder={`Opción ${index + 1}`}
                      required
                    />
                    <button
                      type="button"
                      onClick={() => handleRemoveOption(index)}
                      disabled={resultOptions.length <= 2}
                      className="px-4 py-2 bg-red-900 text-red-200 rounded-lg hover:bg-red-800 disabled:opacity-50 disabled:cursor-not-allowed border border-red-700"
                    >
                      Eliminar
                    </button>
                  </div>
                ))}
              </div>
              <button
                type="button"
                onClick={handleAddOption}
                disabled={resultOptions.length >= 10}
                className="mt-2 px-4 py-2 bg-green-900 text-green-200 rounded-lg hover:bg-green-800 disabled:opacity-50 disabled:cursor-not-allowed border border-green-700"
              >
                Agregar Opción
              </button>
            </div>

            <div className="bg-blue-900 border border-blue-700 rounded-lg p-4">
              <h3 className="font-semibold text-blue-100 mb-2">Información Importante</h3>
              <ul className="text-sm text-blue-200 space-y-1">
                <li>• El evento será visible para todos los usuarios autenticados</li>
                <li>• Las apuestas se cerrarán automáticamente en la fecha de cierre</li>
                <li>• Solo usuarios autorizados pueden resolver el evento</li>
                <li>• Asegúrate de que las opciones sean claras y mutuamente excluyentes</li>
              </ul>
            </div>

            <div className="flex gap-4">
              <button
                type="submit"
                disabled={loading}
                className="flex-1 btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Creando...' : 'Crear Evento'}
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
