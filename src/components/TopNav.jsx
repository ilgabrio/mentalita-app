import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Play, Video, Headphones, FileText } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const TopNav = () => {
  const location = useLocation();
  const { userProfile } = useAuth();
  
  const navItems = [
    { path: '/exercises', icon: Play, label: 'Esercizi', key: 'exercises' },
    { path: '/videos', icon: Video, label: 'Video', key: 'videos' },
    { path: '/audio', icon: Headphones, label: 'Audio', key: 'audio' },
    { path: '/articles', icon: FileText, label: 'Articoli', key: 'articles' }
  ];
  
  return (
    <nav className={`border-b ${
      userProfile?.isPremium 
        ? 'bg-gradient-to-r from-yellow-50 to-amber-50 dark:from-yellow-900/20 dark:to-amber-900/20 border-amber-200 dark:border-amber-800' 
        : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700'
    }`}>
      <div className="flex">
        {navItems.map((item) => {
          const IconComponent = item.icon;
          const isActive = location.pathname.startsWith(item.path);
          
          return (
            <Link
              key={item.key}
              to={item.path}
              className={`flex-1 flex flex-col items-center justify-center py-3 px-2 transition-colors ${
                isActive 
                  ? userProfile?.isPremium 
                    ? 'text-amber-700 dark:text-amber-400 bg-amber-100 dark:bg-amber-900/30 border-b-2 border-amber-600 dark:border-amber-400'
                    : 'text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20 border-b-2 border-blue-600 dark:border-blue-400'
                  : userProfile?.isPremium
                    ? 'text-amber-600 dark:text-amber-500 hover:text-amber-800 dark:hover:text-amber-300 hover:bg-amber-50 dark:hover:bg-amber-900/20'
                    : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700/50'
              }`}
            >
              <IconComponent size={20} className="mb-1" />
              <span className="text-xs font-medium">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
};

export default TopNav;