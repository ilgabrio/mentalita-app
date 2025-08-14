import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider } from './context/ThemeContext';

const ProtectedRoute = ({ children }) => {
  const onboardingCompleted = localStorage.getItem('onboardingCompleted');
  
  if (onboardingCompleted === 'true') {
    return children;
  }
  
  return <Navigate to="/onboarding" replace />;
};
import HomePage from './pages/HomePage';
import ExercisesPage from './pages/ExercisesPage';
import VideosPage from './pages/VideosPage';
import AudioPage from './pages/AudioPage';
import ArticlesPage from './pages/ArticlesPage';
import ExerciseDetail from './components/ExerciseDetail';
import OnboardingPage from './pages/OnboardingPage';
import AdminPage from './pages/AdminPage';
import MainLayout from './components/MainLayout';

function App() {
  return (
    <ThemeProvider>
      <Router basename="/mentalita-app">
        <MainLayout>
          <Routes>
            <Route path="/" element={<Navigate to="/onboarding" replace />} />
            <Route path="/onboarding" element={<OnboardingPage />} />
            <Route path="/exercises" element={<ProtectedRoute><ExercisesPage /></ProtectedRoute>} />
            <Route path="/exercises/:id" element={<ProtectedRoute><ExerciseDetail /></ProtectedRoute>} />
            <Route path="/exercises/:id/practice" element={<ProtectedRoute><ExerciseDetail /></ProtectedRoute>} />
            <Route path="/videos" element={<ProtectedRoute><VideosPage /></ProtectedRoute>} />
            <Route path="/videos/:id" element={<ProtectedRoute><div className="p-4 text-center"><h2 className="text-xl font-bold text-gray-900 dark:text-white">Video Player</h2></div></ProtectedRoute>} />
            <Route path="/audio" element={<ProtectedRoute><AudioPage /></ProtectedRoute>} />
            <Route path="/audio/:id" element={<ProtectedRoute><div className="p-4 text-center"><h2 className="text-xl font-bold text-gray-900 dark:text-white">Audio Player</h2></div></ProtectedRoute>} />
            <Route path="/articles" element={<ProtectedRoute><ArticlesPage /></ProtectedRoute>} />
            <Route path="/articles/:id" element={<ProtectedRoute><div className="p-4 text-center"><h2 className="text-xl font-bold text-gray-900 dark:text-white">Articolo</h2></div></ProtectedRoute>} />
            <Route path="/profile" element={<ProtectedRoute><div className="p-4 text-center"><h2 className="text-xl font-bold text-gray-900 dark:text-white">Profilo</h2></div></ProtectedRoute>} />
            <Route path="/settings" element={<ProtectedRoute><div className="p-4 text-center"><h2 className="text-xl font-bold text-gray-900 dark:text-white">Impostazioni</h2></div></ProtectedRoute>} />
            <Route path="/admin" element={<AdminPage />} />
          </Routes>
        </MainLayout>
      </Router>
    </ThemeProvider>
  );
}

export default App;
