import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Home, PlayCircle, User, BookOpen, Settings } from 'lucide-react';

const BottomNav = () => {
  const location = useLocation();
  
  const navItems = [
    { path: '/', icon: Home, label: 'Home' },
    { path: '/exercises', icon: PlayCircle, label: 'Esercizi' },
    { path: '/videos', icon: BookOpen, label: 'Video' },
    { path: '/profile', icon: User, label: 'Profilo' },
    { path: '/settings', icon: Settings, label: 'Altro' }
  ];
  
  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 z-50">
      <div className="grid grid-cols-5 h-16">
        {navItems.map((item) => {
          const IconComponent = item.icon;
          const isActive = location.pathname === item.path || 
                          (item.path === '/exercises' && location.pathname.startsWith('/exercises'));
          
          return (
            <Link
              key={item.path}
              to={item.path}
              className={`flex flex-col items-center justify-center gap-1 transition-colors ${
                isActive 
                  ? 'text-blue-600 dark:text-blue-400' 
                  : 'text-gray-500 dark:text-gray-400'
              }`}
            >
              <IconComponent size={20} />
              <span className="text-xs font-medium">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
};

export default BottomNav;