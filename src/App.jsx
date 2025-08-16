import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider } from './context/ThemeContext';
import { AuthProvider, useAuth } from './context/AuthContext';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from './config/firebase';

const ProtectedRoute = ({ children, requireAuth = true, skipOnboardingCheck = false, skipWelcomeCheck = false, skipQuestionnaireCheck = false }) => {
  const { currentUser, userProfile, isAdmin, loading } = useAuth();
  const [userBadges, setUserBadges] = useState([]);
  const [exerciseCount, setExerciseCount] = useState(0);
  const [badgesLoading, setBadgesLoading] = useState(true);
  const [exercisesLoading, setExercisesLoading] = useState(true);
  const onboardingCompleted = localStorage.getItem('onboardingCompleted');
  const questionnaireCompleted = localStorage.getItem('initialQuestionnaireCompleted');
  const welcomeShown = localStorage.getItem('welcomeShown');

  // Fetch user badges and exercise responses
  useEffect(() => {
    const fetchUserData = async () => {
      if (currentUser && !isAdmin) {
        let foundBadges = false;
        let foundExercises = false;
        
        // Fetch badges
        try {
          const badgesQuery = query(
            collection(db, 'userBadges'),
            where('userId', '==', currentUser.uid)
          );
          const snapshot = await getDocs(badgesQuery);
          const badges = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
          setUserBadges(badges);
          foundBadges = badges.length > 0;
        } catch (error) {
          console.error('Error fetching badges:', error);
        }
        
        // Fetch exercise responses to check if user has completed any exercises
        try {
          const exercisesQuery = query(
            collection(db, 'exerciseResponses'),
            where('userId', '==', currentUser.uid)
          );
          const exerciseSnapshot = await getDocs(exercisesQuery);
          setExerciseCount(exerciseSnapshot.docs.length);
          foundExercises = exerciseSnapshot.docs.length > 0;
        } catch (error) {
          console.error('Error fetching exercise responses:', error);
        }
        
        // If user has badges, exercises, or is premium, mark questionnaire as completed in localStorage
        // This ensures existing/premium users don't see the questionnaire
        if ((foundBadges || foundExercises || userProfile?.isPremium) && !localStorage.getItem('initialQuestionnaireCompleted')) {
          console.log('Auto-marking questionnaire as completed for existing/premium user', {
            foundBadges,
            foundExercises,
            isPremium: userProfile?.isPremium
          });
          localStorage.setItem('initialQuestionnaireCompleted', 'true');
          localStorage.setItem('onboardingCompleted', 'true');
          localStorage.setItem('welcomeShown', 'true');
        }
      }
      setBadgesLoading(false);
      setExercisesLoading(false);
    };

    fetchUserData();
  }, [currentUser, isAdmin]);
  
  // Debug existing user check with better date handling
  let userCreatedAt = null;
  if (userProfile?.createdAt) {
    // Handle Firestore Timestamp
    if (userProfile.createdAt.toDate) {
      userCreatedAt = userProfile.createdAt.toDate();
    } 
    // Handle ISO string
    else if (typeof userProfile.createdAt === 'string') {
      userCreatedAt = new Date(userProfile.createdAt);
    }
    // Handle seconds (Firestore timestamp format)
    else if (userProfile.createdAt.seconds) {
      userCreatedAt = new Date(userProfile.createdAt.seconds * 1000);
    }
    // Handle already a Date object
    else if (userProfile.createdAt instanceof Date) {
      userCreatedAt = userProfile.createdAt;
    }
  }
  
  // If no createdAt field or date is in the future, assume existing user
  const dateIsInFuture = userCreatedAt && userCreatedAt.getTime() > Date.now();
  
  // Check if user has badges or completed exercises (indicates they've been using the app)
  const hasBadges = userBadges && userBadges.length > 0;
  const hasCompletedExercises = exerciseCount > 0;
  
  // User is existing if: has badges, completed exercises, no createdAt, future date, registered > 7 days ago, OR is premium
  const isExistingUser = hasBadges ||
                         hasCompletedExercises ||
                         !userProfile?.createdAt || 
                         dateIsInFuture || 
                         userProfile?.isPremium ||
                         (userCreatedAt && (Date.now() - userCreatedAt.getTime()) > (7 * 24 * 60 * 60 * 1000)); // 7 days
  const daysSinceRegistration = userCreatedAt ? Math.floor((Date.now() - userCreatedAt.getTime()) / (24 * 60 * 60 * 1000)) : null;
  
  console.log('ProtectedRoute DEBUG:', { 
    currentUser: currentUser?.email, 
    isAdmin, 
    userBadges: userBadges.length,
    hasBadges,
    exerciseCount,
    hasCompletedExercises,
    userProfile_createdAt: userProfile?.createdAt,
    userProfile_createdAtType: typeof userProfile?.createdAt,
    userCreatedAt,
    dateIsInFuture,
    isPremium: userProfile?.isPremium,
    isExistingUser,
    daysSinceRegistration,
    skipOnboardingCheck,
    skipQuestionnaireCheck,
    skipWelcomeCheck,
    onboardingCompleted,
    questionnaireCompleted,
    welcomeShown
  });
  
  if (loading || badgesLoading || exercisesLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }
  
  if (requireAuth && !currentUser) {
    return <Navigate to="/login" replace />;
  }
  
  // Skip checks for admin users - WAIT for all data to load first
  if (!isAdmin && currentUser) {
    // Don't make any redirect decisions until we've checked for badges/exercises
    // This prevents redirecting on the first render when hasBadges is still false
    
    // 1. Onboarding check
    if (!skipOnboardingCheck) {
      const isOnboardingComplete = onboardingCompleted === 'true' || userProfile?.onboardingCompleted === true;
      
      if (!isOnboardingComplete) {
        return <Navigate to="/onboarding" replace />;
      }
    }
    
    // 2. Initial questionnaire check
    if (!skipQuestionnaireCheck && !skipOnboardingCheck) {
      const isQuestionnaireComplete = questionnaireCompleted === 'true' || userProfile?.initialQuestionnaireCompleted === true;
      const isOnboardingComplete = onboardingCompleted === 'true' || userProfile?.onboardingCompleted === true;
      
      // Use the already calculated isExistingUser from above
      if (isOnboardingComplete && !isQuestionnaireComplete && !isExistingUser) {
        return <Navigate to="/questionnaire/initial" replace />;
      }
    }
    
    // 3. Welcome page check
    if (!skipWelcomeCheck && !skipOnboardingCheck && !skipQuestionnaireCheck) {
      const isOnboardingComplete = onboardingCompleted === 'true' || userProfile?.onboardingCompleted === true;
      const isQuestionnaireComplete = questionnaireCompleted === 'true' || userProfile?.initialQuestionnaireCompleted === true;
      
      // Use the already calculated isExistingUser from above
      if (isOnboardingComplete && isQuestionnaireComplete && welcomeShown !== 'true' && !isExistingUser) {
        return <Navigate to="/welcome" replace />;
      }
    }
    
    // 4. Interactive onboarding check - redirect users with 0 exercises to first step
    if (!skipOnboardingCheck && !skipQuestionnaireCheck && !skipWelcomeCheck) {
      const isOnboardingComplete = onboardingCompleted === 'true' || userProfile?.onboardingCompleted === true;
      const isQuestionnaireComplete = questionnaireCompleted === 'true' || userProfile?.initialQuestionnaireCompleted === true;
      const isWelcomeShown = welcomeShown === 'true';
      
      // If user has completed all intro steps but has never done any exercises, send to interactive onboarding
      if (isOnboardingComplete && isQuestionnaireComplete && isWelcomeShown && !hasCompletedExercises && !isExistingUser) {
        // But only if we're trying to access /exercises (the default route)
        if (window.location.pathname === '/' || window.location.pathname === '/exercises') {
          return <Navigate to="/onboarding" replace />;
        }
      }
    }
  }
  
  return children;
};

const AdminRoute = ({ children }) => {
  const { currentUser, isAdmin, loading } = useAuth();
  
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }
  
  if (!currentUser) {
    return <Navigate to="/login" replace />;
  }
  
  if (!isAdmin) {
    return <Navigate to="/" replace />;
  }
  
  return children;
};

import HomePage from './pages/HomePage';
import ExercisesWorkspacePage from './pages/ExercisesWorkspacePage';
import VideosWorkspacePage from './pages/VideosWorkspacePage';
import AudioWorkspacePage from './pages/AudioWorkspacePage';
import ArticlesWorkspacePage from './pages/ArticlesWorkspacePage';
import ArticleReaderPage from './pages/ArticleReaderPage';
import AudioReaderPage from './pages/AudioReaderPage';
import ExerciseDetail from './components/ExerciseDetail';
import ExercisePracticePage from './pages/ExercisePracticePage';
import OnboardingInteractivePage from './pages/OnboardingInteractivePage';
import WelcomePage from './pages/WelcomePage';
import AdminPage from './pages/AdminPage';
import ProfilePage from './pages/ProfilePage';
import PremiumPage from './pages/PremiumPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import InitialQuestionnairePage from './pages/InitialQuestionnairePage';
import PremiumQuestionnairePage from './pages/PremiumQuestionnairePage';
import MainLayout from './components/MainLayout';

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <Router basename={process.env.NODE_ENV === 'production' && process.env.DEPLOY_TARGET === 'github' ? '/mentalita-app' : ''}>
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route path="/onboarding" element={
              <ProtectedRoute requireAuth={true} skipOnboardingCheck={true}>
                <OnboardingInteractivePage />
              </ProtectedRoute>
            } />
            <Route path="/questionnaire/initial" element={
              <ProtectedRoute requireAuth={true} skipOnboardingCheck={true} skipQuestionnaireCheck={true} skipWelcomeCheck={true}>
                <InitialQuestionnairePage />
              </ProtectedRoute>
            } />
            <Route path="/questionnaire/premium" element={
              <ProtectedRoute requireAuth={true} skipOnboardingCheck={true} skipQuestionnaireCheck={true} skipWelcomeCheck={true}>
                <PremiumQuestionnairePage />
              </ProtectedRoute>
            } />
            <Route path="/welcome" element={
              <ProtectedRoute requireAuth={true} skipOnboardingCheck={true} skipQuestionnaireCheck={true} skipWelcomeCheck={true}>
                <WelcomePage />
              </ProtectedRoute>
            } />
            <Route path="/" element={
              <MainLayout>
                <ProtectedRoute><Navigate to="/exercises" replace /></ProtectedRoute>
              </MainLayout>
            } />
            <Route path="/dashboard" element={
              <MainLayout>
                <ProtectedRoute><HomePage /></ProtectedRoute>
              </MainLayout>
            } />
            <Route path="/exercises" element={
              <MainLayout>
                <ProtectedRoute><ExercisesWorkspacePage /></ProtectedRoute>
              </MainLayout>
            } />
            <Route path="/exercises/:id" element={
              <MainLayout>
                <ProtectedRoute><ExerciseDetail /></ProtectedRoute>
              </MainLayout>
            } />
            <Route path="/exercises/:id/practice" element={
              <ProtectedRoute><ExercisePracticePage /></ProtectedRoute>
            } />
            <Route path="/videos" element={
              <MainLayout>
                <ProtectedRoute><VideosWorkspacePage /></ProtectedRoute>
              </MainLayout>
            } />
            <Route path="/videos/:id" element={
              <MainLayout>
                <ProtectedRoute>
                  <div className="p-4 text-center">
                    <h2 className="text-xl font-bold text-gray-900 dark:text-white">Video Player</h2>
                  </div>
                </ProtectedRoute>
              </MainLayout>
            } />
            <Route path="/audio" element={
              <MainLayout>
                <ProtectedRoute><AudioWorkspacePage /></ProtectedRoute>
              </MainLayout>
            } />
            <Route path="/audio/:id" element={
              <ProtectedRoute>
                <AudioReaderPage />
              </ProtectedRoute>
            } />
            <Route path="/articles" element={
              <MainLayout>
                <ProtectedRoute><ArticlesWorkspacePage /></ProtectedRoute>
              </MainLayout>
            } />
            <Route path="/articles/:id" element={
              <ProtectedRoute>
                <ArticleReaderPage />
              </ProtectedRoute>
            } />
            <Route path="/profile" element={
              <MainLayout>
                <ProtectedRoute><ProfilePage /></ProtectedRoute>
              </MainLayout>
            } />
            <Route path="/premium" element={
              <MainLayout>
                <ProtectedRoute><PremiumPage /></ProtectedRoute>
              </MainLayout>
            } />
            <Route path="/settings" element={
              <MainLayout>
                <ProtectedRoute>
                  <div className="p-4 text-center">
                    <h2 className="text-xl font-bold text-gray-900 dark:text-white">Impostazioni</h2>
                  </div>
                </ProtectedRoute>
              </MainLayout>
            } />
            <Route path="/admin" element={<AdminRoute><AdminPage /></AdminRoute>} />
          </Routes>
        </Router>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
