import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider } from './context/ThemeContext';
import { AuthProvider, useAuth } from './context/AuthContext';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from './config/firebase';

const ProtectedRoute = ({ children, requireAuth = true, skipOnboardingCheck = false }) => {
  const { currentUser, userProfile, isAdmin, loading } = useAuth();
  const [completedOnboardingExercises, setCompletedOnboardingExercises] = useState(0);
  const [dataLoading, setDataLoading] = useState(true);

  // Check database first, then localStorage as fallback
  const questionnaireCompleted = userProfile?.initialQuestionnaireCompleted === true || 
                                (userProfile?.initialQuestionnaireCompleted === undefined && 
                                 localStorage.getItem('initialQuestionnaireCompleted') === 'true');
  const welcomeShown = localStorage.getItem('welcomeShown');
  const onboardingCompleted = localStorage.getItem('onboardingCompleted');
  const championBadge = localStorage.getItem('championBadge');

  useEffect(() => {
    const checkOnboardingProgress = async () => {
      if (!currentUser || isAdmin) {
        setDataLoading(false);
        return;
      }

      // ⭐ SE HA IL BADGE CAMPIONE, NON CONTROLLARE NULLA!
      if (championBadge === 'true') {
        setDataLoading(false);
        return;
      }

      try {
        // Count completed onboarding exercises
        const responsesQuery = query(
          collection(db, 'exerciseResponses'),
          where('userId', '==', currentUser.uid)
        );
        const responsesSnapshot = await getDocs(responsesQuery);
        
        // Per l'onboarding conta semplicemente tutti gli esercizi completati (max 7 per unlock)
        const totalCompletedExercises = responsesSnapshot.docs.length;
        const completedForOnboarding = Math.min(totalCompletedExercises, 7);
        
        setCompletedOnboardingExercises(completedForOnboarding);
        console.log('✅ Onboarding progress:', completedForOnboarding, 'out of 7 required (total completed:', totalCompletedExercises, ')');
        
      } catch (error) {
        console.error('❌ Error checking onboarding progress:', error);
      } finally {
        setDataLoading(false);
      }
    };

    checkOnboardingProgress();
  }, [currentUser, isAdmin, championBadge]);

  if (loading || dataLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  // ⭐ BADGE CAMPIONE = ACCESSO TOTALE (PRIMA DI TUTTO!)
  if (championBadge === 'true') {
    console.log('🏆 Badge Campione attivo: accesso garantito a', window.location.pathname);
    return children;
  }

  // Admin bypass
  if (isAdmin) {
    return children;
  }

  // Not logged in
  if (requireAuth && !currentUser) {
    return <Navigate to="/login" replace />;
  }

  // Skip all checks if specified
  if (skipOnboardingCheck) {
    return children;
  }

  // Flow decisionale semplice:
  // 1. No questionnaire → go to questionnaire
  // 2. No welcome → go to welcome  
  // 3. Onboarding not completed (< 7 exercises OR no flag) → go to onboarding exercises
  // 4. Everything done → show app

  if (!questionnaireCompleted) {
    console.log('❌ No questionnaire, redirecting from', window.location.pathname, 'to /questionnaire');
    return <Navigate to="/questionnaire" replace />;
  }

  if (!welcomeShown) {
    console.log('❌ No welcome, redirecting from', window.location.pathname, 'to /welcome');
    return <Navigate to="/welcome" replace />;
  }

  // Se non ha ancora completato tutti gli esercizi, vai alla pagina esercizi
  if (completedOnboardingExercises < 7) {
    console.log('❌ Only', completedOnboardingExercises, 'exercises, redirecting from', window.location.pathname, 'to /onboarding-exercises');
    return <Navigate to="/onboarding-exercises" replace />;
  }

  // Ha completato gli esercizi ma non ha ancora il badge? 
  // Significa che deve ancora fare le domande finali
  if (completedOnboardingExercises >= 7 && !championBadge) {
    console.log('❌ No champion badge, redirecting from', window.location.pathname, 'to /onboarding-questions');
    return <Navigate to="/onboarding-questions" replace />;
  }

  // All checks passed - show full app
  return children;
};

// Import all pages
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import InitialQuestionnairePage from './pages/InitialQuestionnairePage';
import WelcomePage from './pages/WelcomePage';
import OnboardingExercisesPage from './pages/OnboardingExercisesPage';
import OnboardingInteractivePage from './pages/OnboardingInteractivePage';
import ExerciseIntroPage from './pages/ExerciseIntroPage';
import OnboardingQuestionsPage from './pages/OnboardingQuestionsPage';
import ChampionUnlockPage from './pages/ChampionUnlockPage';
import HomePage from './pages/HomePage';
import ProfilePage from './pages/ProfilePage';
import ExercisesPage from './pages/ExercisesPage';
// import ExerciseDetailPage from './pages/ExerciseDetailPage'; // Non esiste
import ExercisePracticePage from './pages/ExercisePracticePage';
// import PremiumPage from './pages/PremiumPage';
import PremiumPageFixed from './pages/PremiumPageFixed';
import PremiumSuccessPage from './pages/PremiumSuccessPage';
import VideosPage from './pages/VideosPage';
import AudioPage from './pages/AudioPage';
import AudioDetailPage from './pages/AudioDetailPage';
import ArticlesPage from './pages/ArticlesPage';
import ArticleReaderPage from './pages/ArticleReaderPage';
import VideoDetailPage from './pages/VideoDetailPage';
import EbooksPage from './pages/EbooksPage';
import CoursesPage from './pages/CoursesPage';
import MainLayout from './components/MainLayout';
import ExerciseDetail from './components/ExerciseDetail';
import AdminPage from './pages/AdminPage';
import AdminAudioImages from './pages/AdminAudioImages';
import AdminArticleImages from './pages/AdminArticleImages';
import AdminVideoImages from './pages/AdminVideoImages';

function AppContent() {
  return (
    <Router>
      <Routes>
        {/* Public Routes */}
        <Route path="/login" element={<LoginPage />} />
        <Route path="/signup" element={<RegisterPage />} />
        
        {/* Onboarding Routes (no layout) */}
        <Route path="/questionnaire" element={
          <ProtectedRoute skipOnboardingCheck={true}>
            <InitialQuestionnairePage />
          </ProtectedRoute>
        } />
        
        <Route path="/welcome" element={
          <ProtectedRoute skipOnboardingCheck={true}>
            <WelcomePage />
          </ProtectedRoute>
        } />
        
        <Route path="/onboarding-exercises" element={
          <ProtectedRoute skipOnboardingCheck={true}>
            <MainLayout>
              <OnboardingExercisesPage />
            </MainLayout>
          </ProtectedRoute>
        } />
        
        <Route path="/onboarding-interactive" element={
          <ProtectedRoute skipOnboardingCheck={true}>
            <MainLayout>
              <OnboardingInteractivePage />
            </MainLayout>
          </ProtectedRoute>
        } />
        
        <Route path="/exercise-intro/:id" element={
          <ProtectedRoute skipOnboardingCheck={true}>
            <MainLayout>
              <ExerciseIntroPage />
            </MainLayout>
          </ProtectedRoute>
        } />
        
        <Route path="/onboarding-questions" element={
          <ProtectedRoute skipOnboardingCheck={true}>
            <OnboardingQuestionsPage />
          </ProtectedRoute>
        } />
        
        <Route path="/champion-unlock" element={
          <ProtectedRoute skipOnboardingCheck={true}>
            <ChampionUnlockPage />
          </ProtectedRoute>
        } />

        {/* Exercise Practice (standalone, no layout) */}
        <Route path="/exercises/:id/practice" element={
          <ProtectedRoute skipOnboardingCheck={true}>
            <ExercisePracticePage />
          </ProtectedRoute>
        } />

        {/* Admin Routes */}
        <Route path="/admin/*" element={
          <ProtectedRoute skipOnboardingCheck={true}>
            <AdminPage />
          </ProtectedRoute>
        } />
        
        <Route path="/admin-audio-images" element={
          <ProtectedRoute skipOnboardingCheck={true}>
            <AdminAudioImages />
          </ProtectedRoute>
        } />
        
        <Route path="/admin-article-images" element={
          <ProtectedRoute skipOnboardingCheck={true}>
            <AdminArticleImages />
          </ProtectedRoute>
        } />
        
        <Route path="/admin-video-images" element={
          <ProtectedRoute skipOnboardingCheck={true}>
            <AdminVideoImages />
          </ProtectedRoute>
        } />

        {/* Main App Routes (with layout) */}
        <Route path="/" element={
          <ProtectedRoute>
            <MainLayout>
              <HomePage />
            </MainLayout>
          </ProtectedRoute>
        } />
        
        <Route path="/profile" element={
          <ProtectedRoute skipOnboardingCheck={true}>
            <MainLayout>
              <ProfilePage />
            </MainLayout>
          </ProtectedRoute>
        } />
        
        <Route path="/exercises" element={
          <ProtectedRoute>
            <MainLayout>
              <ExercisesPage />
            </MainLayout>
          </ProtectedRoute>
        } />
        
        {/* Exercise Detail Page - rimuovo temporaneamente */}
        {/* <Route path="/exercises/:id" element={
          <ProtectedRoute>
            <MainLayout>
              <ExerciseDetailPage />
            </MainLayout>
          </ProtectedRoute>
        } /> */}
        
        <Route path="/premium" element={
          <ProtectedRoute skipOnboardingCheck={true}>
            <MainLayout>
              <PremiumPageFixed />
            </MainLayout>
          </ProtectedRoute>
        } />

        <Route path="/premium/success" element={
          <ProtectedRoute skipOnboardingCheck={true}>
            <MainLayout>
              <PremiumSuccessPage />
            </MainLayout>
          </ProtectedRoute>
        } />

        {/* Content Routes - Required Champion Badge or onboarding completion */}
        <Route path="/videos/:id" element={
          <ProtectedRoute skipOnboardingCheck={true}>
            <MainLayout>
              <VideoDetailPage />
            </MainLayout>
          </ProtectedRoute>
        } />
        
        <Route path="/videos" element={
          <ProtectedRoute>
            <MainLayout>
              <VideosPage />
            </MainLayout>
          </ProtectedRoute>
        } />
        
        <Route path="/audio/:id" element={
          <ProtectedRoute skipOnboardingCheck={true}>
            <MainLayout>
              <AudioDetailPage />
            </MainLayout>
          </ProtectedRoute>
        } />
        
        <Route path="/audio" element={
          <ProtectedRoute>
            <MainLayout>
              <AudioPage />
            </MainLayout>
          </ProtectedRoute>
        } />
        
        <Route path="/articles/:id" element={
          <ProtectedRoute skipOnboardingCheck={true}>
            <MainLayout>
              <ArticleReaderPage />
            </MainLayout>
          </ProtectedRoute>
        } />
        
        <Route path="/articles" element={
          <ProtectedRoute>
            <MainLayout>
              <ArticlesPage />
            </MainLayout>
          </ProtectedRoute>
        } />
        
        <Route path="/ebooks" element={
          <ProtectedRoute>
            <MainLayout>
              <EbooksPage />
            </MainLayout>
          </ProtectedRoute>
        } />
        
        <Route path="/courses" element={
          <ProtectedRoute>
            <MainLayout>
              <CoursesPage />
            </MainLayout>
          </ProtectedRoute>
        } />

        {/* Route per esercizi detail - RIMOSSO: usa /exercise-intro/:id */}

        {/* Redirect unknown routes to home */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;