import React from 'react';
import { useNavigate } from 'react-router-dom';
import { LogOut, User, Settings, Shield } from 'lucide-react';

const ProfilePage = () => {
  const navigate = useNavigate();

  const handleLogout = () => {
    // Rimuovi i dati di onboarding e sessione
    localStorage.removeItem('onboardingCompleted');
    localStorage.removeItem('userSession');
    localStorage.removeItem('userData');
    
    // Reindirizza al login/onboarding
    navigate('/onboarding', { replace: true });
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 shadow-sm">
        <div className="px-4 py-6">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Profilo</h1>
          <p className="text-gray-600 dark:text-gray-300 mt-2">
            Gestisci il tuo account e le tue preferenze
          </p>
        </div>
      </div>

      <div className="px-4 py-6">
        {/* Profile Card */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 mb-6">
          <div className="flex items-center space-x-4 mb-6">
            <div className="w-16 h-16 bg-blue-500 rounded-full flex items-center justify-center">
              <User className="h-8 w-8 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Atleta</h2>
              <p className="text-gray-600 dark:text-gray-300">Be Water Plus</p>
            </div>
          </div>
          
          <div className="border-t border-gray-200 dark:border-gray-600 pt-6">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Azioni Account</h3>
            
            <div className="space-y-3">
              <button className="w-full flex items-center justify-between p-4 text-left hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg transition-colors">
                <div className="flex items-center space-x-3">
                  <Settings className="h-5 w-5 text-gray-500 dark:text-gray-400" />
                  <span className="text-gray-900 dark:text-white">Impostazioni</span>
                </div>
              </button>
              
              <button className="w-full flex items-center justify-between p-4 text-left hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg transition-colors">
                <div className="flex items-center space-x-3">
                  <Shield className="h-5 w-5 text-gray-500 dark:text-gray-400" />
                  <span className="text-gray-900 dark:text-white">Privacy</span>
                </div>
              </button>
            </div>
          </div>
        </div>

        {/* Logout Button */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center space-x-3 p-4 bg-red-500 hover:bg-red-600 text-white rounded-lg transition-colors"
          >
            <LogOut className="h-5 w-5" />
            <span className="font-medium">Logout</span>
          </button>
          
          <p className="text-sm text-gray-500 dark:text-gray-400 text-center mt-3">
            Verrai reindirizzato alla pagina di accesso
          </p>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;