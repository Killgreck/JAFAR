import { useEffect, useState } from 'react';

interface WelcomeModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function WelcomeModal({ isOpen, onClose }: WelcomeModalProps) {
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setShow(true);
    }
  }, [isOpen]);

  if (!show) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-800 rounded-lg shadow-2xl max-w-md w-full p-8 border-2 border-blue-500 animate-fade-in">
        <div className="text-center">
          <div className="text-6xl mb-4">🎉</div>
          <h2 className="text-3xl font-bold text-white mb-4">
            ¡Bienvenido a JAFAR!
          </h2>
          <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg p-6 mb-6">
            <p className="text-white text-lg mb-2">
              Has recibido un bono de bienvenida de
            </p>
            <div className="text-5xl font-bold text-white">
              $25.00
            </div>
          </div>
          <p className="text-gray-300 mb-6">
            Usa este saldo para crear tus primeras apuestas y empezar a ganar en nuestra plataforma P2P.
          </p>
          <button
            onClick={onClose}
            className="btn-primary w-full text-lg py-3"
          >
            ¡Empezar a Apostar!
          </button>
        </div>
      </div>
    </div>
  );
}
