import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider } from './context/ThemeContext';
import { AuthProvider, useAuth } from './context/AuthContext';
import { collection, query, where, getDocs, doc, getDoc } from 'firebase/firestore';
import { db } from './config/firebase';

const ProtectedRoute = ({ children, requireAuth = true, skipOnboardingCheck = false, skipWelcomeCheck = false, skipQuestionnaireCheck = false, allowDuringOnboarding = false }) => {
  const { currentUser, userProfile, isAdmin, loading } = useAuth();
  const [userBadges, setUserBadges] = useState([]);
  const [exerciseCount, setExerciseCount] = useState(0);
  const [onboardingStepsCompleted, setOnboardingStepsCompleted] = useState(0);
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
        
        // Fetch onboarding progress to check completed steps
        try {
          const onboardingProgressDoc = await getDoc(doc(db, 'userOnboardingProgress', currentUser.uid));
          if (onboardingProgressDoc.exists()) {
            const progressData = onboardingProgressDoc.data();
            const completedDays = progressData.completedDays || [];
            setOnboardingStepsCompleted(completedDays.length);
          }
        } catch (error) {
          console.error('Error fetching onboarding progress:', error);
        }
        
        // REMOVED AUTO-MARK LOGIC - Users must complete onboarding flow manually
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
  
  // Check if user has completed onboarding steps (not regular exercises)
  const hasCompletedOnboardingSteps = onboardingStepsCompleted >= 7;
  
  // User is existing if: has badges, completed ALL onboarding steps (7), future date, registered > 7 days ago, OR is premium with questionnaire completed
  const isExistingUser = hasBadges ||
                         hasCompletedOnboardingSteps ||  // Changed: now checks onboarding completion, not just any exercise
                         dateIsInFuture || 
                         (userProfile?.isPremium && userProfile?.initialQuestionnaireCompleted) ||
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
  
  // Skip checks for admin users
  if (!isAdmin && currentUser) {    
    console.log('🔍 FLOW CHECK:', {
      isExistingUser,
      questionnaireCompleted,
      welcomeShown,
      hasCompletedExercises,
      exerciseCount,
      onboardingStepsCompleted,
      hasCompletedOnboardingSteps,
      currentPath: window.location.pathname
    });
    
    // 1. IMMEDIATE Questionnaire check - ALWAYS for users without questionnaire (unless they're clearly existing)
    if (!skipQuestionnaireCheck) {
      if (questionnaireCompleted !== 'true') {
        console.log('📋 User missing questionnaire - redirecting to initial questionnaire');
        return <Navigate to="/questionnaire/initial" replace />;
      }
    }
    
    // 2. Welcome check for users who completed questionnaire
    if (!skipWelcomeCheck) {
      // Check if user hasn't seen welcome yet but has completed questionnaire
      if (welcomeShown !== 'true' && questionnaireCompleted === 'true') {
        console.log('🚀 User completed questionnaire - redirecting to welcome page');
        return <Navigate to="/welcome" replace />;
      }
    }
    
    // 3. Interactive onboarding check - only after data loads and for homepage
    if (!skipWelcomeCheck && !badgesLoading && !exercisesLoading) {
      const isWelcomeShown = welcomeShown === 'true';
      
      // Only redirect to onboarding if welcome done but onboarding not completed
      if (isWelcomeShown && !hasCompletedOnboardingSteps && !isExistingUser) {
        // Only redirect from home or exercises page
        if (window.location.pathname === '/' || window.location.pathname === '/exercises') {
          console.log('📱 Welcome complete but no exercises - redirecting to first step');
          return <Navigate to="/onboarding" replace />;
        }
      }
    }
    
    // 4. Block access to pages during onboarding (until step 7 completed)
    if (!allowDuringOnboarding && !badgesLoading && !exercisesLoading) {
      const isUserInOnboarding = welcomeShown === 'true' && !hasCompletedOnboardingSteps && !isExistingUser;
      
      if (isUserInOnboarding) {
        const currentPath = window.location.pathname;
        const allowedPaths = ['/onboarding', '/profile', '/premium', '/welcome', '/questionnaire/initial', '/questionnaire/premium', '/exercises'];
        const isAllowedPath = allowedPaths.some(path => currentPath.startsWith(path));
        
        if (!isAllowedPath) {
          console.log('🚫 User in onboarding blocked from accessing:', currentPath);
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
import PremiumSuccessPage from './pages/PremiumSuccessPage';
import VideoDetailPage from './pages/VideoDetailPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import InitialQuestionnairePage from './pages/InitialQuestionnairePage';
import PremiumQuestionnairePage from './pages/PremiumQuestionnairePage';
import EbooksPage from './pages/EbooksPage';
import CoursesPage from './pages/CoursesPage';
import OnboardingCompletePage from './pages/OnboardingCompletePage';
import MainLayout from './components/MainLayout';
import DebugLocalStorage from './components/DebugLocalStorage';

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <Router basename={process.env.NODE_ENV === 'production' && process.env.DEPLOY_TARGET === 'github' ? '/mentalita-app' : ''}>
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route path="/onboarding" element={
              <ProtectedRoute requireAuth={true}>
                <OnboardingInteractivePage />
              </ProtectedRoute>
            } />
            <Route path="/onboarding/complete" element={
              <ProtectedRoute requireAuth={true}>
                <OnboardingCompletePage />
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
                <ProtectedRoute><VideoDetailPage /></ProtectedRoute>
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
            <Route path="/ebooks" element={
              <MainLayout>
                <ProtectedRoute><EbooksPage /></ProtectedRoute>
              </MainLayout>
            } />
            <Route path="/courses" element={
              <MainLayout>
                <ProtectedRoute><CoursesPage /></ProtectedRoute>
              </MainLayout>
            } />
            <Route path="/profile" element={
              <MainLayout>
                <ProtectedRoute allowDuringOnboarding={true}><ProfilePage /></ProtectedRoute>
              </MainLayout>
            } />
            <Route path="/premium" element={
              <MainLayout>
                <ProtectedRoute allowDuringOnboarding={true}><PremiumPage /></ProtectedRoute>
              </MainLayout>
            } />
            <Route path="/premium/success" element={
              <ProtectedRoute><PremiumSuccessPage /></ProtectedRoute>
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
