import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { 
  BookOpen, 
  Play, 
  Volume2, 
  Newspaper,
  Trophy,
  Award,
  Users,
  Podcast,
  Mail,
  Star,
  DollarSign,
  Settings,
  FileText,
  Crown,
  ArrowLeft
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

// Import admin components (these will be created next)
import ExerciseManager from './content/ExerciseManager';
import ArticleManager from './content/ArticleManager';
import VideoManager from './content/VideoManager';
import AudioManager from './content/AudioManager';
import NewsManager from './content/NewsManager';
import MotivationalTipsManager from './motivation/MotivationalTipsManager';
import BadgeManager from './motivation/BadgeManager';
import UserBadgesManager from './motivation/UserBadgesManager';
import PodcastShowManager from './podcast/PodcastShowManager';
import PodcastEpisodeManager from './podcast/PodcastEpisodeManager';
import NewsletterSubscribersManager from './newsletter/NewsletterSubscribersManager';
import NewsletterSender from './newsletter/NewsletterSender';
import PremiumRequestsManager from './premium/PremiumRequestsManager';
import PaymentSessionsView from './premium/PaymentSessionsView';
import PremiumPlansManager from './premium/PremiumPlansManager';
import SiteSettingsManager from './settings/SiteSettingsManager';
import QuestionnaireTemplatesManager from './settings/QuestionnaireTemplatesManager';
import WelcomePageManager from './settings/WelcomePageManager';
import OnboardingSettingsManager from './settings/OnboardingSettingsManager';

const AdminDashboard = () => {
  const { userProfile, isAdmin } = useAuth();
  const [activeSection, setActiveSection] = useState('dashboard');
  const navigate = useNavigate();

  if (!isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Accesso negato</h1>
          <p className="text-gray-600 dark:text-gray-400 mb-6">Non hai i permessi per accedere a questa area.</p>
          <button 
            onClick={() => navigate('/')}
            className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg"
          >
            Torna alla Dashboard
          </button>
        </div>
      </div>
    );
  }

  const menuSections = [
    {
      id: 'content',
      name: 'Gestione Contenuti',
      icon: BookOpen,
      items: [
        { id: 'exercises', name: 'Esercizi', icon: Trophy },
        { id: 'articles', name: 'Articoli', icon: FileText },
        { id: 'videos', name: 'Video', icon: Play },
        { id: 'audio', name: 'Audio', icon: Volume2 },
        { id: 'news', name: 'News', icon: Newspaper },
      ]
    },
    {
      id: 'motivation',
      name: 'Sistema Motivazionale',
      icon: Award,
      items: [
        { id: 'tips', name: 'Consigli Motivazionali', icon: Star },
        { id: 'badges', name: 'Gestione Badge', icon: Award },
        { id: 'user-badges', name: 'Badge Utenti', icon: Users },
      ]
    },
    {
      id: 'podcast',
      name: 'Podcast & Audio',
      icon: Podcast,
      items: [
        { id: 'podcast-shows', name: 'Programmi Podcast', icon: Podcast },
        { id: 'podcast-episodes', name: 'Episodi', icon: Play },
      ]
    },
    {
      id: 'newsletter',
      name: 'Newsletter',
      icon: Mail,
      items: [
        { id: 'subscribers', name: 'Iscritti', icon: Users },
        { id: 'send-newsletter', name: 'Invia Newsletter', icon: Mail },
      ]
    },
    {
      id: 'premium',
      name: 'Premium & Pagamenti',
      icon: DollarSign,
      items: [
        { id: 'premium-requests', name: 'Richieste Premium', icon: Crown },
        { id: 'payment-sessions', name: 'Sessioni Pagamento', icon: DollarSign },
        { id: 'premium-plans', name: 'Piani Premium', icon: Star },
      ]
    },
    {
      id: 'settings',
      name: 'Impostazioni',
      icon: Settings,
      items: [
        { id: 'site-settings', name: 'Impostazioni Sito', icon: Settings },
        { id: 'onboarding-flow', name: 'Flusso Onboarding', icon: BookOpen },
        { id: 'questionnaires', name: 'Questionari', icon: FileText },
        { id: 'welcome-page', name: 'Welcome Page', icon: Star },
      ]
    }
  ];

  const renderContent = () => {
    switch (activeSection) {
      case 'exercises':
        return <ExerciseManager />;
      case 'articles':
        return <ArticleManager />;
      case 'videos':
        return <VideoManager />;
      case 'audio':
        return <AudioManager />;
      case 'news':
        return <NewsManager />;
      case 'tips':
        return <MotivationalTipsManager />;
      case 'badges':
        return <BadgeManager />;
      case 'user-badges':
        return <UserBadgesManager />;
      case 'podcast-shows':
        return <PodcastShowManager />;
      case 'podcast-episodes':
        return <PodcastEpisodeManager />;
      case 'subscribers':
        return <NewsletterSubscribersManager />;
      case 'send-newsletter':
        return <NewsletterSender />;
      case 'premium-requests':
        return <PremiumRequestsManager />;
      case 'payment-sessions':
        return <PaymentSessionsView />;
      case 'premium-plans':
        return <PremiumPlansManager />;
      case 'site-settings':
        return <SiteSettingsManager />;
      case 'onboarding-flow':
        return <OnboardingSettingsManager />;
      case 'questionnaires':
        return <QuestionnaireTemplatesManager />;
      case 'welcome-page':
        return <WelcomePageManager />;
      default:
        return (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
              Dashboard Amministrativa
            </h2>
            <div className="text-center py-8">
              <Crown className="h-16 w-16 text-yellow-500 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                Benvenuto, {userProfile?.name || userProfile?.email?.split('@')[0] || 'Admin'}!
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mb-6">
                Seleziona una sezione dal menu per iniziare a gestire l'applicazione.
              </p>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4 max-w-2xl mx-auto">
                {menuSections.map(section => (
                  <div key={section.id} className="text-center">
                    <div className="bg-blue-100 dark:bg-blue-900/30 p-4 rounded-lg mb-2">
                      <section.icon className="h-8 w-8 text-blue-600 dark:text-blue-400 mx-auto" />
                    </div>
                    <h4 className="text-sm font-medium text-gray-900 dark:text-white">
                      {section.name}
                    </h4>
                  </div>
                ))}
              </div>
            </div>
          </div>
        );
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex">
      {/* Sidebar */}
      <div className="w-64 bg-white dark:bg-gray-800 shadow-lg">
        <div className="p-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center space-x-2">
              <Crown className="h-6 w-6 text-yellow-500" />
              <span className="text-lg font-bold text-gray-900 dark:text-white">
                Admin Panel
              </span>
            </div>
            <button
              onClick={() => navigate('/profile')}
              className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
              title="Torna al Profilo"
            >
              <ArrowLeft className="h-5 w-5 text-gray-500 dark:text-gray-400" />
            </button>
          </div>
          
          {/* Quick Navigation to User Pages */}
          <div className="space-y-1">
            <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">Vista Utente:</p>
            <div className="grid grid-cols-2 gap-1">
              <button
                onClick={() => navigate('/exercises')}
                className="flex items-center gap-1 px-2 py-1 text-xs bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded hover:bg-blue-100 dark:hover:bg-blue-900/30"
              >
                <Trophy className="h-3 w-3" />
                Esercizi
              </button>
              <button
                onClick={() => navigate('/videos')}
                className="flex items-center gap-1 px-2 py-1 text-xs bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded hover:bg-red-100 dark:hover:bg-red-900/30"
              >
                <Play className="h-3 w-3" />
                Video
              </button>
              <button
                onClick={() => navigate('/articles')}
                className="flex items-center gap-1 px-2 py-1 text-xs bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400 rounded hover:bg-green-100 dark:hover:bg-green-900/30"
              >
                <FileText className="h-3 w-3" />
                Articoli
              </button>
              <button
                onClick={() => navigate('/audio')}
                className="flex items-center gap-1 px-2 py-1 text-xs bg-purple-50 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400 rounded hover:bg-purple-100 dark:hover:bg-purple-900/30"
              >
                <Volume2 className="h-3 w-3" />
                Audio
              </button>
            </div>
          </div>
        </div>

        <nav className="p-4 space-y-2">
          <button
            onClick={() => setActiveSection('dashboard')}
            className={`w-full flex items-center space-x-3 px-3 py-2 rounded-lg text-left transition-colors ${
              activeSection === 'dashboard'
                ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400'
                : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
            }`}
          >
            <Settings className="h-5 w-5" />
            <span>Dashboard</span>
          </button>

          {menuSections.map(section => (
            <div key={section.id}>
              <div className="flex items-center space-x-2 px-3 py-2 text-sm font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                <section.icon className="h-4 w-4" />
                <span>{section.name}</span>
              </div>
              <div className="ml-4 space-y-1">
                {section.items.map(item => (
                  <button
                    key={item.id}
                    onClick={() => setActiveSection(item.id)}
                    className={`w-full flex items-center space-x-3 px-3 py-2 rounded-lg text-left transition-colors ${
                      activeSection === item.id
                        ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400'
                        : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                    }`}
                  >
                    <item.icon className="h-4 w-4" />
                    <span className="text-sm">{item.name}</span>
                  </button>
                ))}
              </div>
            </div>
          ))}
        </nav>
      </div>

      {/* Main Content */}
      <div className="flex-1 p-6">
        {renderContent()}
      </div>
    </div>
  );
};

export default AdminDashboard;