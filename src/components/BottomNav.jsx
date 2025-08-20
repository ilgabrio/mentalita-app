import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Home, PlayCircle, User, Video, Headphones, Crown, Book, GraduationCap } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const BottomNav = () => {
  const location = useLocation();
  const { userProfile } = useAuth();
  
  // Check if onboarding is completed OR if user has Champion badge
  const championBadge = localStorage.getItem('championBadge') === 'true';
  const isOnboardingCompleted = championBadge || // Champion badge bypassa tutto
                               userProfile?.onboardingCompleted === true || 
                               localStorage.getItem('onboardingCompleted') === 'true';
  
  // Solo le 4 voci principali per il bottom nav
  const allNavItems = [
    { path: '/', icon: Home, label: 'Home' },
    { path: '/exercises', icon: PlayCircle, label: 'Esercizi' },
    { path: '/premium', icon: Crown, label: 'Premium' },
    { path: '/profile', icon: User, label: 'Profilo' }
  ];
  
  // Filter nav items based on onboarding completion
  const navItems = allNavItems.filter(item => {
    if (item.requiresOnboarding && !isOnboardingCompleted) {
      return false; // Hide Video and Audio if onboarding not completed
    }
    return true;
  });
  
  return (
    <nav className={`fixed bottom-0 left-0 right-0 border-t border-gray-200 dark:border-gray-700 z-50 ${
      userProfile?.isPremium 
        ? 'bg-gradient-to-r from-yellow-100 to-amber-100 dark:from-yellow-900/30 dark:to-amber-900/30' 
        : 'bg-white dark:bg-gray-800'
    }`}>
      <div className={`grid h-16 ${
        navItems.length === 4 ? 'grid-cols-4' : 
        navItems.length === 3 ? 'grid-cols-3' : 
        'grid-cols-4'
      }`}>
        {navItems.map((item) => {
          const IconComponent = item.icon;
          const isActive = location.pathname === item.path || 
                          (item.path === '/' && location.pathname === '/') ||
                          (item.path === '/exercises' && location.pathname.startsWith('/exercises'));
          
          // Special styling for premium button
          if (item.path === '/premium') {
            return (
              <Link
                key={item.path}
                to={item.path}
                onClick={() => console.log('🔗 Navigazione Premium:', item.label, 'verso', item.path)}
                className={`flex flex-col items-center justify-center gap-1 transition-colors relative ${
                  isActive 
                    ? 'text-amber-600 dark:text-amber-400' 
                    : item.isGold ? 'text-amber-500 dark:text-amber-400' : 'text-gray-500 dark:text-gray-400'
                }`}
              >
                {!userProfile?.isPremium && (
                  <div className="absolute -top-1 -right-1 w-3 h-3 bg-amber-500 rounded-full animate-pulse"></div>
                )}
                <IconComponent size={20} />
                <span className="text-xs font-medium">{item.label}</span>
              </Link>
            );
          }
          
          return (
            <Link
              key={item.path}
              to={item.path}
              onClick={() => console.log('🔗 Navigazione:', item.label, 'verso', item.path)}
              className={`flex flex-col items-center justify-center gap-1 transition-colors ${
                isActive 
                  ? userProfile?.isPremium ? 'text-amber-600 dark:text-amber-400' : 'text-blue-600 dark:text-blue-400'
                  : userProfile?.isPremium ? 'text-amber-700 dark:text-amber-500' : 'text-gray-500 dark:text-gray-400'
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