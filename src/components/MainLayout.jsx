import React from 'react';
import { Moon, Sun, Crown } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import SideNav from './SideNav';
import BottomNav from './BottomNav';

const MainLayout = ({ children }) => {
  const { isDarkMode, toggleDarkMode } = useTheme();
  const { userProfile } = useAuth();
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors">
      {/* Header with theme toggle */}
      <header className={`shadow-sm border-b ${
        userProfile?.isPremium 
          ? 'bg-gradient-to-r from-yellow-50 to-amber-50 dark:from-yellow-900/20 dark:to-amber-900/20 border-amber-200 dark:border-amber-800' 
          : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700'
      }`}>
        <div className="pl-16 pr-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-blue-600 text-white font-bold text-lg w-10 h-10 rounded-lg flex items-center justify-center">
              M
            </div>
            <div className="flex flex-col">
              <h1 className={`text-xl font-bold ${
                userProfile?.isPremium 
                  ? 'text-amber-800 dark:text-amber-300' 
                  : 'text-gray-900 dark:text-white'
              }`}>
                Mentalità
              </h1>
              <span className="text-xs text-gray-500 dark:text-gray-400">
                Crea la tua forza mentale nello sport
              </span>
            </div>
            {userProfile?.isPremium && (
              <Crown className="h-5 w-5 text-amber-600 dark:text-amber-400" />
            )}
          </div>
          
          <div className="flex items-center space-x-2">
            {!userProfile?.isPremium && (
              <button
                onClick={() => navigate('/premium')}
                className="flex items-center space-x-1 px-3 py-1 bg-amber-500 text-white rounded-lg hover:bg-amber-600 transition-colors text-sm font-medium"
              >
                <Crown className="h-4 w-4" />
                <span>Premium</span>
              </button>
            )}
            
            <button
              onClick={toggleDarkMode}
              className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              aria-label="Toggle dark mode"
            >
              {isDarkMode ? (
                <Sun className="h-5 w-5 text-gray-600 dark:text-gray-300" />
              ) : (
                <Moon className="h-5 w-5 text-gray-600 dark:text-gray-300" />
              )}
            </button>
          </div>
        </div>
      </header>

      {/* Side Navigation */}
      <SideNav />

      {/* Main content */}
      <main className="flex-1 pb-16 pt-2">
        {children}
      </main>
      
      {/* Bottom Navigation */}
      <BottomNav />
    </div>
  );
};

export default MainLayout;