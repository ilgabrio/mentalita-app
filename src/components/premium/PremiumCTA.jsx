import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Crown, Star, Zap, ChevronRight } from 'lucide-react';

const PremiumCTA = ({ variant = 'card', className = '' }) => {
  const navigate = useNavigate();

  if (variant === 'banner') {
    return (
      <div className={`bg-gradient-to-r from-purple-600 to-pink-600 rounded-lg p-4 shadow-lg ${className}`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Crown className="h-8 w-8 text-yellow-400" />
            <div>
              <h3 className="text-white font-semibold">Sblocca il tuo potenziale</h3>
              <p className="text-white/90 text-sm">Accedi a contenuti esclusivi e coaching personalizzato</p>
            </div>
          </div>
          <button
            onClick={() => navigate('/premium')}
            className="bg-white text-purple-600 px-4 py-2 rounded-lg font-semibold hover:bg-gray-100 transition-colors flex items-center space-x-1"
          >
            <span>Scopri Premium</span>
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>
    );
  }

  if (variant === 'inline') {
    return (
      <button
        onClick={() => navigate('/premium')}
        className={`inline-flex items-center space-x-2 text-purple-600 hover:text-purple-700 font-medium ${className}`}
      >
        <Crown className="h-4 w-4" />
        <span>Passa a Premium</span>
        <ChevronRight className="h-4 w-4" />
      </button>
    );
  }

  if (variant === 'sidebar') {
    return (
      <div className={`bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 rounded-lg p-4 border border-purple-200 dark:border-purple-800 ${className}`}>
        <div className="flex items-center space-x-2 mb-3">
          <Crown className="h-5 w-5 text-purple-600 dark:text-purple-400" />
          <h4 className="font-semibold text-gray-900 dark:text-white">Premium</h4>
        </div>
        <p className="text-sm text-gray-600 dark:text-gray-300 mb-3">
          Ottieni accesso illimitato a tutti gli esercizi e contenuti esclusivi
        </p>
        <button
          onClick={() => navigate('/premium')}
          className="w-full bg-purple-600 text-white px-3 py-2 rounded-lg text-sm font-medium hover:bg-purple-700 transition-colors"
        >
          Scopri i Piani
        </button>
      </div>
    );
  }

  // Default card variant
  return (
    <div className={`bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 ${className}`}>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-3">
          <div className="bg-gradient-to-br from-purple-500 to-pink-500 p-3 rounded-full">
            <Crown className="h-8 w-8 text-white" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-gray-900 dark:text-white">
              Diventa Premium
            </h3>
            <p className="text-gray-600 dark:text-gray-300">
              Sblocca il tuo pieno potenziale
            </p>
          </div>
        </div>
      </div>
      
      <div className="space-y-3 mb-6">
        <div className="flex items-start space-x-2">
          <Star className="h-5 w-5 text-yellow-500 mt-0.5" />
          <div>
            <p className="font-medium text-gray-900 dark:text-white">Contenuti Esclusivi</p>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Accedi a esercizi avanzati e meditazioni guidate
            </p>
          </div>
        </div>
        
        <div className="flex items-start space-x-2">
          <Zap className="h-5 w-5 text-purple-500 mt-0.5" />
          <div>
            <p className="font-medium text-gray-900 dark:text-white">Coaching Personalizzato</p>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Ricevi supporto diretto dai nostri esperti
            </p>
          </div>
        </div>
      </div>
      
      <button
        onClick={() => navigate('/premium')}
        className="w-full bg-gradient-to-r from-purple-600 to-pink-600 text-white py-3 rounded-lg font-semibold hover:from-purple-700 hover:to-pink-700 transition-all transform hover:scale-105"
      >
        Scopri i Piani Premium
      </button>
    </div>
  );
};

export default PremiumCTA;