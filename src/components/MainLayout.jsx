import React, { useState, useEffect } from 'react';
import { Moon, Sun, Crown } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../config/firebase';
import SideNav from './SideNav';
import BottomNav from './BottomNav';

const MainLayout = ({ children }) => {
  const { isDarkMode, toggleDarkMode } = useTheme();
  const { currentUser, userProfile, isAdmin } = useAuth();
  const navigate = useNavigate();
  const [exerciseCount, setExerciseCount] = useState(0);
  const [userBadges, setUserBadges] = useState([]);
  const [dataLoading, setDataLoading] = useState(true);
  
  // Fetch user data to determine onboarding status
  useEffect(() => {
    const fetchUserData = async () => {
      const championBadge = localStorage.getItem('championBadge');
      
      if (currentUser && !isAdmin) {
        try {
          console.log('🔍 MainLayout: Caricamento dati utente...');
          
          // Fetch badges (sempre, anche con Champion badge)
          const badgesQuery = query(
            collection(db, 'userBadges'),
            where('userId', '==', currentUser.uid)
          );
          const badgesSnapshot = await getDocs(badgesQuery);
          const realBadges = badgesSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
          
          // Se ha il badge Champion, aggiungi il badge Champion ai dati reali
          if (championBadge === 'true') {
            realBadges.push({ id: 'champion', name: 'Campione', level: 'Gold', source: 'localStorage' });
          }
          
          setUserBadges(realBadges);
          console.log('✅ Badge utente caricati:', realBadges);
          
          // Fetch exercise responses (sempre)
          const exercisesQuery = query(
            collection(db, 'exerciseResponses'),
            where('userId', '==', currentUser.uid)
          );
          const exerciseSnapshot = await getDocs(exercisesQuery);
          setExerciseCount(exerciseSnapshot.docs.length);
          console.log('✅ Esercizi completati:', exerciseSnapshot.docs.length);
          
        } catch (error) {
          console.error('❌ Errore caricamento dati layout:', error);
        }
      }
      setDataLoading(false);
    };

    fetchUserData();
  }, [currentUser, isAdmin]);
  
  // Controlla se l'utente viene da onboarding
  const fromOnboarding = new URLSearchParams(window.location.search).get('from') === 'onboarding';
  
  // Controlla se siamo nella pagina onboarding-exercises
  const isOnboardingExercisesPage = window.location.pathname === '/onboarding-exercises';
  
  // ⭐ BADGE CAMPIONE = TUTTO SBLOCCATO
  const championBadge = localStorage.getItem('championBadge');
  const isChampion = championBadge === 'true';
  
  // Determine if user is in onboarding mode
  const welcomeShown = localStorage.getItem('welcomeShown');
  const hasCompletedExercises = exerciseCount > 0 || isChampion; // Champion ha sempre completato
  const hasBadges = userBadges.length > 0 || isChampion; // Champion ha sempre badges
  
  // User is existing if: has badges, completed exercises, no createdAt, OR is premium with questionnaire completed
  let userCreatedAt = null;
  if (userProfile?.createdAt) {
    if (userProfile.createdAt.toDate) {
      userCreatedAt = userProfile.createdAt.toDate();
    } else if (typeof userProfile.createdAt === 'string') {
      userCreatedAt = new Date(userProfile.createdAt);
    } else if (userProfile.createdAt.seconds) {
      userCreatedAt = new Date(userProfile.createdAt.seconds * 1000);
    } else if (userProfile.createdAt instanceof Date) {
      userCreatedAt = userProfile.createdAt;
    }
  }
  
  const dateIsInFuture = userCreatedAt && userCreatedAt.getTime() > Date.now();
  const isExistingUser = isChampion || // Champion è sempre esistente
                         hasBadges ||
                         hasCompletedExercises ||
                         !userProfile?.createdAt || 
                         dateIsInFuture || 
                         (userProfile?.isPremium && userProfile?.initialQuestionnaireCompleted) ||
                         (userCreatedAt && (Date.now() - userCreatedAt.getTime()) > (7 * 24 * 60 * 60 * 1000));

  // Check if user has completed interactive onboarding
  const interactiveOnboardingCompleted = localStorage.getItem('interactiveOnboardingCompleted') === 'true';
  const hasCompletedOnboardingSteps = interactiveOnboardingCompleted || isChampion; // Champion ha sempre completato
  
  const isUserInOnboarding = !dataLoading && !isAdmin && currentUser && 
                            welcomeShown === 'true' && 
                            !hasCompletedOnboardingSteps &&
                            !isExistingUser;
  
  // Champion non ha mai navigazione nascosta
  const hideNavigation = !isChampion && ((fromOnboarding && !isOnboardingExercisesPage) || isUserInOnboarding);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors">
      {/* Header with theme toggle */}
      <header className={`shadow-sm border-b ${
        userProfile?.isPremium 
          ? 'bg-gradient-to-r from-yellow-50 to-amber-50 dark:from-yellow-900/20 dark:to-amber-900/20 border-amber-200 dark:border-amber-800' 
          : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700'
      }`}>
        <div className="pl-4 pr-4 py-4 flex items-center justify-between">
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

      {/* Side Navigation - Hidden during onboarding */}
      {!hideNavigation && <SideNav />}

      {/* Main content */}
      <main className={`flex-1 pt-2 px-4 sm:px-6 lg:px-8 ${hideNavigation ? 'pb-4' : 'pb-16'}`}>
        {children}
      </main>
      
      {/* Bottom Navigation - Hidden during onboarding */}
      {!hideNavigation && <BottomNav />}
    </div>
  );
};

export default MainLayout;