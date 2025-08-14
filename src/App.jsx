import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider } from './context/ThemeContext';
import { AuthProvider, useAuth } from './context/AuthContext';

const ProtectedRoute = ({ children, requireAuth = true }) => {
  const { currentUser, loading } = useAuth();
  const onboardingCompleted = localStorage.getItem('onboardingCompleted');
  
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }
  
  if (requireAuth && !currentUser) {
    return <Navigate to="/login" replace />;
  }
  
  if (currentUser && onboardingCompleted !== 'true') {
    return <Navigate to="/onboarding" replace />;
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
import ExercisesPage from './pages/ExercisesPage';
import VideosPage from './pages/VideosPage';
import AudioPage from './pages/AudioPage';
import ArticlesPage from './pages/ArticlesPage';
import ExerciseDetail from './components/ExerciseDetail';
import OnboardingPage from './pages/OnboardingPage';
import AdminPage from './pages/AdminPage';
import ProfilePage from './pages/ProfilePage';
import LoginPage from './pages/LoginPage';
import MainLayout from './components/MainLayout';

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <Router basename={process.env.NODE_ENV === 'production' && process.env.DEPLOY_TARGET === 'github' ? '/mentalita-app' : ''}>
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/onboarding" element={<ProtectedRoute requireAuth={true}><OnboardingPage /></ProtectedRoute>} />
            <Route path="/" element={
              <MainLayout>
                <ProtectedRoute><HomePage /></ProtectedRoute>
              </MainLayout>
            } />
            <Route path="/exercises" element={
              <MainLayout>
                <ProtectedRoute><ExercisesPage /></ProtectedRoute>
              </MainLayout>
            } />
            <Route path="/exercises/:id" element={
              <MainLayout>
                <ProtectedRoute><ExerciseDetail /></ProtectedRoute>
              </MainLayout>
            } />
            <Route path="/exercises/:id/practice" element={
              <MainLayout>
                <ProtectedRoute><ExerciseDetail /></ProtectedRoute>
              </MainLayout>
            } />
            <Route path="/videos" element={
              <MainLayout>
                <ProtectedRoute><VideosPage /></ProtectedRoute>
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
                <ProtectedRoute><AudioPage /></ProtectedRoute>
              </MainLayout>
            } />
            <Route path="/audio/:id" element={
              <MainLayout>
                <ProtectedRoute>
                  <div className="p-4 text-center">
                    <h2 className="text-xl font-bold text-gray-900 dark:text-white">Audio Player</h2>
                  </div>
                </ProtectedRoute>
              </MainLayout>
            } />
            <Route path="/articles" element={
              <MainLayout>
                <ProtectedRoute><ArticlesPage /></ProtectedRoute>
              </MainLayout>
            } />
            <Route path="/articles/:id" element={
              <MainLayout>
                <ProtectedRoute>
                  <div className="p-4 text-center">
                    <h2 className="text-xl font-bold text-gray-900 dark:text-white">Articolo</h2>
                  </div>
                </ProtectedRoute>
              </MainLayout>
            } />
            <Route path="/profile" element={
              <MainLayout>
                <ProtectedRoute><ProfilePage /></ProtectedRoute>
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
