import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import UserDashboard from '../components/user/UserDashboard';

const HomePage = () => {
  const { isAdmin, currentUser } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    // If user is admin, redirect to admin dashboard
    if (currentUser && isAdmin) {
      navigate('/admin', { replace: true });
      return;
    }
  }, [isAdmin, currentUser, navigate]);

  // Don't render UserDashboard if redirecting admin
  if (isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        <span className="ml-3 text-gray-600 dark:text-gray-400">Reindirizzamento...</span>
      </div>
    );
  }

  return <UserDashboard />;
};

export default HomePage;