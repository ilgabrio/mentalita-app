import React from 'react';
import { Moon, Sun } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import TopNav from './TopNav';
import BottomNav from './BottomNav';

const MainLayout = ({ children }) => {
  const { isDarkMode, toggleDarkMode } = useTheme();

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors">
      {/* Header with theme toggle */}
      <header className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700">
        <div className="px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img 
              src="/mentalita-app/logo.png" 
              alt="Mentalità Logo" 
              className="w-8 h-8 rounded-full"
            />
            <h1 className="text-xl font-bold text-gray-900 dark:text-white">
              Be Water+
            </h1>
          </div>
          
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
      </header>

      {/* Top Navigation */}
      <TopNav />

      {/* Main content */}
      <main className="flex-1 pb-16">
        {children}
      </main>
      
      {/* Bottom Navigation */}
      <BottomNav />
    </div>
  );
};

export default MainLayout;