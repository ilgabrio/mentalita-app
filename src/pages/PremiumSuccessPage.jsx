import React, { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { CheckCircle, Crown, ArrowRight } from 'lucide-react';

const PremiumSuccessPage = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const sessionId = searchParams.get('session_id');

  useEffect(() => {
    // Reindirizza alla homepage dopo 5 secondi
    const timer = setTimeout(() => {
      navigate('/');
    }, 5000);

    return () => clearTimeout(timer);
  }, [navigate]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center px-4">
      <div className="max-w-2xl w-full text-center">
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl p-8 md:p-12">
          {/* Icon Success */}
          <div className="flex justify-center mb-6">
            <div className="relative">
              <div className="bg-green-100 dark:bg-green-900/30 rounded-full p-4">
                <CheckCircle className="h-16 w-16 text-green-600 dark:text-green-400" />
              </div>
              <div className="absolute -top-2 -right-2 bg-yellow-500 rounded-full p-2">
                <Crown className="h-6 w-6 text-white" />
              </div>
            </div>
          </div>

          {/* Title */}
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-4">
            🎉 Benvenuto nel Premium!
          </h1>

          <p className="text-xl text-gray-600 dark:text-gray-300 mb-8">
            Il tuo pagamento è stato elaborato con successo
          </p>

          {/* Benefits */}
          <div className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 rounded-lg p-6 mb-8">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Cosa puoi fare ora:
            </h3>
            <div className="space-y-3 text-left">
              <div className="flex items-center">
                <CheckCircle className="h-5 w-5 text-green-500 mr-3" />
                <span className="text-gray-700 dark:text-gray-300">Accesso a tutti gli esercizi premium</span>
              </div>
              <div className="flex items-center">
                <CheckCircle className="h-5 w-5 text-green-500 mr-3" />
                <span className="text-gray-700 dark:text-gray-300">Video e audio illimitati in HD</span>
              </div>
              <div className="flex items-center">
                <CheckCircle className="h-5 w-5 text-green-500 mr-3" />
                <span className="text-gray-700 dark:text-gray-300">Statistiche avanzate e badge esclusivi</span>
              </div>
              <div className="flex items-center">
                <CheckCircle className="h-5 w-5 text-green-500 mr-3" />
                <span className="text-gray-700 dark:text-gray-300">Accesso alla community premium</span>
              </div>
            </div>
          </div>

          {/* Session Info */}
          {sessionId && (
            <div className="text-sm text-gray-500 dark:text-gray-400 mb-6">
              ID Sessione: {sessionId}
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button
              onClick={() => navigate('/exercises')}
              className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all"
            >
              Inizia Subito
              <ArrowRight className="h-5 w-5 ml-2" />
            </button>
            
            <button
              onClick={() => navigate('/profile')}
              className="inline-flex items-center px-6 py-3 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 font-semibold rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
            >
              Vai al Profilo
            </button>
          </div>

          {/* Auto redirect info */}
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-6">
            Verrai reindirizzato automaticamente alla homepage tra 5 secondi
          </p>
        </div>
      </div>
    </div>
  );
};

export default PremiumSuccessPage;