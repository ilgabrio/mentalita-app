import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { LogOut, User, Settings, Shield, Crown, Star, Award } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { doc, getDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../config/firebase';

const ProfilePage = () => {
  const { currentUser, userProfile, isAdmin, logout } = useAuth();
  const [userStats, setUserStats] = useState(null);
  const [badges, setBadges] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchUserData = async () => {
      if (!currentUser) return;

      try {
        // Get user badges
        const badgesQuery = query(
          collection(db, 'userBadges'),
          where('userId', '==', currentUser.uid)
        );
        const badgesSnapshot = await getDocs(badgesQuery);
        setBadges(badgesSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));

        // Get user stats if available
        const statsDoc = await getDoc(doc(db, 'userStats', currentUser.uid));
        if (statsDoc.exists()) {
          setUserStats(statsDoc.data());
        }
      } catch (error) {
        console.error('Error fetching user data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();
  }, [currentUser]);

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login', { replace: true });
    } catch (error) {
      console.error('Errore durante il logout:', error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 shadow-sm">
        <div className="px-4 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Profilo</h1>
              <p className="text-gray-600 dark:text-gray-300 mt-2">
                Gestisci il tuo account e le tue preferenze
              </p>
            </div>
            {isAdmin && (
              <div className="flex items-center space-x-2 bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300 px-3 py-1 rounded-full">
                <Crown className="h-4 w-4" />
                <span className="text-sm font-medium">Admin</span>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="px-4 py-6">
        {/* Profile Card */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 mb-6">
          <div className="flex items-center space-x-4 mb-6">
            <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-full flex items-center justify-center">
              <User className="h-8 w-8 text-white" />
            </div>
            <div className="flex-1">
              <div className="flex items-center space-x-2">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                  {userProfile?.displayName || userProfile?.name || 'Atleta'}
                </h2>
                {isAdmin && <Crown className="h-5 w-5 text-yellow-500" />}
              </div>
              <p className="text-gray-600 dark:text-gray-300">
                {userProfile?.email || currentUser?.email}
              </p>
              <p className="text-sm text-blue-600 dark:text-blue-400 mt-1">
                Mentalità - Forza mentale per il tuo sport
              </p>
            </div>
          </div>

          {/* User Stats */}
          {userStats && (
            <div className="grid grid-cols-3 gap-4 mb-6 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                  {userStats.completedExercises || 0}
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  Esercizi completati
                </div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                  {userStats.currentStreak || 0}
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  Giorni consecutivi
                </div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                  {badges.length}
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  Badge ottenuti
                </div>
              </div>
            </div>
          )}

          {/* Badges */}
          {badges.length > 0 && (
            <div className="mb-6">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-3">
                Badge ottenuti
              </h3>
              <div className="flex flex-wrap gap-2">
                {badges.slice(0, 5).map((badge) => (
                  <div
                    key={badge.id}
                    className="flex items-center space-x-2 bg-gradient-to-r from-yellow-400 to-orange-500 text-white px-3 py-1 rounded-full text-sm"
                  >
                    <Award className="h-4 w-4" />
                    <span>{badge.name}</span>
                  </div>
                ))}
                {badges.length > 5 && (
                  <div className="flex items-center space-x-1 text-gray-500 dark:text-gray-400 text-sm">
                    <Star className="h-4 w-4" />
                    <span>+{badges.length - 5} altri</span>
                  </div>
                )}
              </div>
            </div>
          )}
          
          <div className="border-t border-gray-200 dark:border-gray-600 pt-6">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Azioni Account</h3>
            
            <div className="space-y-3">
              {isAdmin && (
                <button 
                  onClick={() => navigate('/admin')}
                  className="w-full flex items-center justify-between p-4 text-left hover:bg-yellow-50 dark:hover:bg-yellow-900/20 rounded-lg transition-colors border border-yellow-200 dark:border-yellow-800"
                >
                  <div className="flex items-center space-x-3">
                    <Crown className="h-5 w-5 text-yellow-600 dark:text-yellow-400" />
                    <span className="text-yellow-800 dark:text-yellow-300 font-medium">Pannello Admin</span>
                  </div>
                </button>
              )}
              
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
            className="w-full flex items-center justify-center space-x-3 p-4 bg-red-500 hover:bg-red-600 text-white rounded-lg transition-colors font-medium"
          >
            <LogOut className="h-5 w-5" />
            <span>Logout</span>
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