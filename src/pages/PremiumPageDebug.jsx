import React from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Crown } from 'lucide-react';

const PremiumPageDebug = () => {
  const { currentUser, userProfile } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  
  // Test del parametro approved
  const isApprovedForPremium = searchParams.get('approved') === 'true' || 
                              userProfile?.premiumRequestStatus === 'approved_pending_payment';

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 max-w-md w-full text-center">
        <Crown className="h-16 w-16 text-yellow-500 mx-auto mb-4" />
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
          Pagina Premium
        </h1>
        <p className="text-gray-600 dark:text-gray-300 mb-6">
          Pagina Premium in manutenzione per correzione errori.
        </p>
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">
          Utente: {currentUser?.email || 'Non loggato'}
        </p>
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
          Approved: {isApprovedForPremium ? 'SI' : 'NO'}
        </p>
        {isApprovedForPremium && (
          <div className="bg-green-100 dark:bg-green-900/30 border border-green-300 dark:border-green-700 rounded-lg p-4 mb-6">
            <p className="text-green-800 dark:text-green-200 font-medium">
              ✅ Utente approvato per Premium!
            </p>
            <p className="text-sm text-green-600 dark:text-green-400 mt-1">
              Il parametro approved=true è attivo
            </p>
          </div>
        )}
        <button
          onClick={() => navigate('/')}
          className="px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
        >
          Torna alla Home
        </button>
      </div>
    </div>
  );
};

export default PremiumPageDebug;