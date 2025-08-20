import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Play, Video, Headphones, FileText, Menu, X, Crown, User, Book, GraduationCap, Home } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const SideNav = () => {
  const location = useLocation();
  const { userProfile } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  
  // Check if onboarding is completed OR if user has Champion badge
  const championBadge = localStorage.getItem('championBadge') === 'true';
  const isOnboardingCompleted = championBadge || // Champion badge bypassa tutto
                               userProfile?.onboardingCompleted === true || 
                               localStorage.getItem('onboardingCompleted') === 'true';
  
  const allNavItems = [
    { path: '/', icon: Home, label: 'Home', key: 'home' },
    { path: '/exercises', icon: Play, label: 'Esercizi', key: 'exercises' },
    { path: '/videos', icon: Video, label: 'Video', key: 'videos', requiresOnboarding: true },
    { path: '/audio', icon: Headphones, label: 'Audio', key: 'audio', requiresOnboarding: true },
    { path: '/articles', icon: FileText, label: 'Articoli', key: 'articles', requiresOnboarding: true },
    { path: '/ebooks', icon: Book, label: 'Ebook', key: 'ebooks', requiresOnboarding: true },
    { path: '/courses', icon: GraduationCap, label: 'Corsi', key: 'courses', requiresOnboarding: true }
  ];
  
  // Filter nav items based on onboarding completion
  const navItems = allNavItems.filter(item => {
    if (item.requiresOnboarding && !isOnboardingCompleted) {
      return false; // Hide Video, Audio, and Articles if onboarding not completed
    }
    return true;
  });

  const toggleSidebar = () => {
    setIsOpen(!isOpen);
  };

  const closeSidebar = () => {
    setIsOpen(false);
  };

  return (
    <>
      {/* Sidebar Toggle Button */}
      <button
        onClick={toggleSidebar}
        className={`fixed top-4 left-4 z-50 p-2 rounded-lg shadow-lg transition-colors ${
          userProfile?.isPremium 
            ? 'bg-amber-500 hover:bg-amber-600 text-white' 
            : 'bg-blue-500 hover:bg-blue-600 text-white'
        }`}
        aria-label="Toggle navigation"
      >
        {isOpen ? <X size={20} /> : <Menu size={20} />}
      </button>

      {/* Overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-40"
          onClick={closeSidebar}
        />
      )}

      {/* Sidebar */}
      <nav className={`fixed top-0 left-0 h-full w-64 transform transition-transform duration-300 ease-in-out z-40 ${
        isOpen ? 'translate-x-0' : '-translate-x-full'
      } ${
        userProfile?.isPremium 
          ? 'bg-gradient-to-b from-yellow-50 to-amber-50 dark:from-yellow-900/30 dark:to-amber-900/30 border-amber-200 dark:border-amber-800' 
          : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700'
      } border-r shadow-lg`}>
        
        {/* Sidebar Header */}
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center space-x-3">
            <div className="bg-blue-600 text-white font-bold text-lg w-10 h-10 rounded-lg flex items-center justify-center">
              M
            </div>
            <div className="flex flex-col">
              <h2 className={`text-lg font-bold ${
                userProfile?.isPremium 
                  ? 'text-amber-800 dark:text-amber-300' 
                  : 'text-gray-900 dark:text-white'
              }`}>
                Mentalità
              </h2>
              <span className="text-xs text-gray-500 dark:text-gray-400">
                Forza mentale nello sport
              </span>
            </div>
            {userProfile?.isPremium && (
              <Crown className="h-5 w-5 text-amber-600 dark:text-amber-400" />
            )}
          </div>
        </div>

        {/* Navigation Items */}
        <div className="p-4 space-y-2">
          {/* Premium Link for non-premium users (always visible) */}
          {!userProfile?.isPremium && (
            <Link
              to="/premium"
              onClick={() => {
                console.log('🔗 Sidebar Premium: verso /premium');
                closeSidebar();
              }}
              className="flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors text-amber-600 dark:text-amber-500 hover:text-amber-800 dark:hover:text-amber-300 hover:bg-amber-50 dark:hover:bg-amber-900/20"
            >
              <Crown size={20} />
              <span className="font-medium">Premium</span>
            </Link>
          )}
          
          {navItems.map((item) => {
            const IconComponent = item.icon;
            const isActive = item.path === '/' 
              ? location.pathname === '/' 
              : location.pathname.startsWith(item.path);
            
            return (
              <Link
                key={item.key}
                to={item.path}
                onClick={() => {
                  console.log('🔗 Sidebar navigazione:', item.label, 'verso', item.path);
                  closeSidebar();
                }}
                className={`flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${
                  isActive 
                    ? userProfile?.isPremium 
                      ? 'text-amber-700 dark:text-amber-400 bg-amber-100 dark:bg-amber-900/30 border-l-4 border-amber-600'
                      : 'text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20 border-l-4 border-blue-600'
                    : userProfile?.isPremium
                      ? 'text-amber-600 dark:text-amber-500 hover:text-amber-800 dark:hover:text-amber-300 hover:bg-amber-50 dark:hover:bg-amber-900/20'
                      : 'text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-700'
                }`}
              >
                <IconComponent size={20} />
                <span className="font-medium">{item.label}</span>
              </Link>
            );
          })}
          
          {/* Profile Link (always visible) */}
          <Link
            to="/profile"
            onClick={closeSidebar}
            className={`flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${
              location.pathname === '/profile'
                ? userProfile?.isPremium 
                  ? 'text-amber-700 dark:text-amber-400 bg-amber-100 dark:bg-amber-900/30 border-l-4 border-amber-600'
                  : 'text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20 border-l-4 border-blue-600'
                : userProfile?.isPremium
                  ? 'text-amber-600 dark:text-amber-500 hover:text-amber-800 dark:hover:text-amber-300 hover:bg-amber-50 dark:hover:bg-amber-900/20'
                  : 'text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-700'
            }`}
          >
            <User size={20} />
            <span className="font-medium">Profilo</span>
          </Link>
        </div>

        {/* Premium CTA in Sidebar */}
        {!userProfile?.isPremium && (
          <div className="absolute bottom-6 left-4 right-4">
            <div className="bg-gradient-to-r from-amber-500 to-yellow-600 rounded-lg p-4 text-white">
              <div className="flex items-center space-x-2 mb-2">
                <Crown className="h-5 w-5" />
                <h3 className="font-semibold text-sm">Vai Premium</h3>
              </div>
              <p className="text-xs text-amber-100 mb-3">
                Sblocca contenuti esclusivi e coaching personalizzato
              </p>
              <Link
                to="/premium"
                onClick={closeSidebar}
                className="block w-full text-center bg-white text-amber-600 py-2 rounded-lg text-sm font-medium hover:bg-amber-50 transition-colors"
              >
                Scopri Premium
              </Link>
            </div>
          </div>
        )}

        {/* Premium User Badge */}
        {userProfile?.isPremium && (
          <div className="absolute bottom-6 left-4 right-4">
            <div className="bg-gradient-to-r from-amber-500 to-yellow-600 rounded-lg p-4 text-white text-center">
              <Crown className="h-6 w-6 mx-auto mb-2" />
              <h3 className="font-semibold text-sm">Utente Premium</h3>
              <p className="text-xs text-amber-100">
                Accesso completo a tutti i contenuti
              </p>
            </div>
          </div>
        )}
      </nav>
    </>
  );
};

export default SideNav;