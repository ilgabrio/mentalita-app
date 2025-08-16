import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  ArrowRight, 
  ArrowLeft, 
  CheckCircle, 
  ChevronRight,
  Play,
  Brain,
  FileText,
  RotateCcw,
  Home,
  Calendar
} from 'lucide-react';
import { db } from '../config/firebase';
import { 
  doc, 
  getDoc, 
  updateDoc, 
  collection, 
  getDocs,
  query,
  where,
  orderBy 
} from 'firebase/firestore';
import { useAuth } from '../context/AuthContext';

const OnboardingInteractivePage = () => {
  const navigate = useNavigate();
  const { currentUser, userProfile } = useAuth();
  const [currentDay, setCurrentDay] = useState(1);
  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(true);
  const [completing, setCompleting] = useState(false);
  const [completedDays, setCompletedDays] = useState(new Set());
  const [exercises, setExercises] = useState({});
  const [articles, setArticles] = useState({});
  const [videos, setVideos] = useState({});

  useEffect(() => {
    fetchOnboardingData();
  }, []);

  const fetchOnboardingData = async () => {
    try {
      setLoading(true);
      
      // Fetch onboarding settings
      const settingsDoc = await getDoc(doc(db, 'onboardingSettings', 'default'));
      
      if (!settingsDoc.exists()) {
        console.log('🔍 No onboarding settings found in database');
        setSettings(null);
        return;
      }

      const settingsData = settingsDoc.data();
      
      if (!settingsData.enabled || !settingsData.days || settingsData.days.length === 0) {
        console.log('Onboarding not enabled or no days configured');
        setSettings(null);
        return;
      }

      setSettings(settingsData);

      // Collect all IDs
      const allExerciseIds = new Set();
      const allArticleIds = new Set();
      const allVideoIds = new Set();

      settingsData.days.forEach(day => {
        day.exercises?.forEach(id => allExerciseIds.add(id));
        day.articles?.forEach(id => allArticleIds.add(id));
        day.videos?.forEach(id => allVideoIds.add(id));
      });

      // Fetch exercises
      const exercisesData = {};
      for (const exerciseId of allExerciseIds) {
        try {
          const exerciseDoc = await getDoc(doc(db, 'exercises', exerciseId));
          if (exerciseDoc.exists()) {
            exercisesData[exerciseId] = { id: exerciseId, ...exerciseDoc.data() };
          }
        } catch (error) {
          console.error(`Error fetching exercise ${exerciseId}:`, error);
        }
      }

      // Fetch articles
      const articlesData = {};
      for (const articleId of allArticleIds) {
        try {
          const articleDoc = await getDoc(doc(db, 'articles', articleId));
          if (articleDoc.exists()) {
            articlesData[articleId] = { id: articleId, ...articleDoc.data() };
          }
        } catch (error) {
          console.error(`Error fetching article ${articleId}:`, error);
        }
      }

      // Fetch videos
      const videosData = {};
      for (const videoId of allVideoIds) {
        try {
          // Try appVideos first
          let videoDoc = await getDoc(doc(db, 'appVideos', videoId));
          if (!videoDoc.exists()) {
            // Try videos collection
            videoDoc = await getDoc(doc(db, 'videos', videoId));
          }
          if (videoDoc.exists()) {
            videosData[videoId] = { id: videoId, ...videoDoc.data() };
          }
        } catch (error) {
          console.error(`Error fetching video ${videoId}:`, error);
        }
      }

      setExercises(exercisesData);
      setArticles(articlesData);
      setVideos(videosData);

      // Load completed days from user profile if available
      if (userProfile?.completedOnboardingDays) {
        setCompletedDays(new Set(userProfile.completedOnboardingDays));
      }

    } catch (error) {
      console.error('Error fetching onboarding data:', error);
      setSettings(null);
    } finally {
      setLoading(false);
    }
  };

  const completeOnboarding = async () => {
    try {
      setCompleting(true);
      
      // Save to localStorage
      localStorage.setItem('onboardingCompleted', 'true');
      
      // Save to Firestore if user is logged in
      if (currentUser) {
        await updateDoc(doc(db, 'users', currentUser.uid), {
          onboardingCompleted: true,
          onboardingCompletedAt: new Date(),
          completedOnboardingDays: Array.from(completedDays)
        });
      }
      
      // Navigate to questionnaire page
      navigate('/questionnaire/initial');
    } catch (error) {
      console.error('Error completing onboarding:', error);
      // Still navigate even if Firestore update fails
      navigate('/questionnaire/initial');
    } finally {
      setCompleting(false);
    }
  };

  const nextDay = () => {
    // Check if current day is completed before allowing progression
    if (!isDayCompleted) {
      alert('Completa prima l\'esercizio di questo giorno per continuare!');
      return;
    }
    
    if (currentDay < settings.days.length) {
      setCurrentDay(currentDay + 1);
    } else {
      completeOnboarding();
    }
  };

  const prevDay = () => {
    if (currentDay > 1) {
      setCurrentDay(currentDay - 1);
    }
  };

  const skipOnboarding = () => {
    completeOnboarding();
  };

  const goToExercise = (exerciseId) => {
    if (exerciseId) {
      console.log('🎯 ONBOARDING - Going to exercise:', exerciseId);
      navigate(`/exercises/${exerciseId}?from=onboarding&day=${currentDay}`);
    }
  };

  const goToArticle = (articleId) => {
    if (articleId) {
      console.log('📖 ONBOARDING - Going to article:', articleId);
      navigate(`/articles/${articleId}?from=onboarding&day=${currentDay}`);
    }
  };

  const markDayCompleted = (dayNumber) => {
    setCompletedDays(prev => new Set([...prev, dayNumber]));
    // Save to Firestore
    if (currentUser) {
      const newCompletedDays = [...completedDays, dayNumber];
      updateDoc(doc(db, 'users', currentUser.uid), {
        completedOnboardingDays: newCompletedDays
      }).catch(console.error);
    }
  };

  // Check if user should be here or redirected elsewhere
  useEffect(() => {
    if (currentUser && userProfile) {
      const localOnboarding = localStorage.getItem('onboardingCompleted');
      const firestoreOnboarding = userProfile.onboardingCompleted;
      const questionnaireCompleted = localStorage.getItem('initialQuestionnaireCompleted');
      const welcomeShown = localStorage.getItem('welcomeShown');
      
      console.log('🔍 ONBOARDING INTERACTIVE - Checking redirect logic:', {
        localOnboarding,
        firestoreOnboarding, 
        questionnaireCompleted,
        welcomeShown,
        userProfile
      });
      
      // If user hasn't completed the initial onboarding, send them there
      if (localOnboarding !== 'true' && firestoreOnboarding !== true) {
        console.log('📍 User needs initial onboarding - redirecting');
        navigate('/onboarding-steps'); // O qualunque sia la route dell'onboarding iniziale
        return;
      }
      
      // If user hasn't completed questionnaire, send them there
      if (questionnaireCompleted !== 'true' && !userProfile?.initialQuestionnaireCompleted) {
        console.log('📍 User needs questionnaire - redirecting');
        navigate('/questionnaire/initial');
        return;
      }
      
      // If user hasn't seen welcome, send them there
      if (welcomeShown !== 'true') {
        console.log('📍 User needs welcome - redirecting');
        navigate('/welcome');
        return;
      }
      
      console.log('✅ User ready for interactive onboarding');
    }
  }, [currentUser, userProfile, navigate]);

  // Handle returning from exercise/article
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const fromExercise = urlParams.get('completed') === 'true';
    const dayParam = urlParams.get('day');
    
    if (fromExercise && dayParam !== null) {
      const dayNumber = parseInt(dayParam);
      markDayCompleted(dayNumber);
      setCurrentDay(dayNumber);
      // Clean up URL
      window.history.replaceState({}, '', '/onboarding');
    }
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-900 to-purple-800 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-white mx-auto mb-4"></div>
          <p className="text-white text-lg">Caricamento percorso...</p>
        </div>
      </div>
    );
  }

  if (!settings || !settings.days || settings.days.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-900 to-purple-800 flex items-center justify-center">
        <div className="text-center text-white max-w-md mx-auto px-6">
          <div className="mb-8">
            <Home className="h-16 w-16 mx-auto mb-4 opacity-60" />
          </div>
          <h1 className="text-2xl font-bold mb-4">Percorso in Configurazione</h1>
          <p className="text-lg mb-8 opacity-90">
            Il percorso di onboarding interattivo è in fase di configurazione. 
            Procedi direttamente al questionario iniziale.
          </p>
          <button
            onClick={skipOnboarding}
            className="px-8 py-3 bg-white text-indigo-900 rounded-lg font-medium hover:bg-gray-100 transition-colors"
          >
            Continua al Questionario
          </button>
        </div>
      </div>
    );
  }

  // Sort days by day number
  const sortedDays = [...settings.days].sort((a, b) => a.day - b.day);
  const currentDayData = sortedDays[currentDay - 1];
  
  if (!currentDayData) {
    return null;
  }

  const progress = (currentDay / sortedDays.length) * 100;
  const isDayCompleted = completedDays.has(currentDay);

  const getYoutubeVideoId = (url) => {
    if (!url) return null;
    const match = url.match(/(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/);
    return match ? match[1] : null;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-900 to-purple-800">
      {/* Progress Bar */}
      <div className="absolute top-0 left-0 right-0 h-1 bg-black/10 z-10">
        <div 
          className="h-full bg-white/60 transition-all duration-300"
          style={{ width: `${progress}%` }}
        />
      </div>

      {/* Skip Button */}
      <div className="absolute top-4 right-4 z-10">
        <button
          onClick={skipOnboarding}
          className="px-4 py-2 text-sm bg-white/10 hover:bg-white/20 backdrop-blur-sm rounded-lg transition-colors text-white"
        >
          Salta introduzione
        </button>
      </div>

      {/* Day Counter */}
      <div className="absolute top-4 left-4 z-10">
        <div className="px-3 py-1 bg-white/10 backdrop-blur-sm rounded-full text-white text-sm font-medium flex items-center gap-2">
          <Calendar className="h-4 w-4" />
          Giorno {currentDay} di {sortedDays.length}
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex items-center justify-center px-6 py-12 pt-16">
        <div className="max-w-4xl w-full mx-auto">
          {/* Welcome Message for Day 1 */}
          {currentDay === 1 && settings.welcomeMessage && (
            <div className="mb-8 p-6 bg-white/10 backdrop-blur-sm rounded-xl text-white animate-fade-in">
              <p className="text-lg leading-relaxed">
                {settings.welcomeMessage}
              </p>
            </div>
          )}

          {/* Day Content */}
          <div className="text-center mb-12">
            {/* Title */}
            <h1 className="text-4xl md:text-5xl font-bold mb-6 text-white animate-fade-in">
              {currentDayData.title || `Giorno ${currentDay}`}
            </h1>

            {/* Description */}
            {currentDayData.description && (
              <p className="text-xl mb-8 max-w-3xl mx-auto text-white/90 animate-fade-in-delay">
                {currentDayData.description}
              </p>
            )}

            {/* Videos Section */}
            {currentDayData.videos && currentDayData.videos.length > 0 && (
              <div className="mb-12 space-y-6 animate-fade-in-delay-2">
                {currentDayData.videos.map(videoId => {
                  const video = videos[videoId];
                  if (!video) return null;

                  return (
                    <div key={videoId} className="max-w-3xl mx-auto">
                      <div className="bg-black/20 backdrop-blur-sm rounded-xl p-6">
                        <h3 className="text-lg font-semibold text-white mb-4">{video.title}</h3>
                        <div className="aspect-w-16 aspect-h-9 rounded-lg overflow-hidden shadow-xl bg-black">
                          {video.videoUrl && getYoutubeVideoId(video.videoUrl) ? (
                            <iframe
                              src={`https://www.youtube.com/embed/${getYoutubeVideoId(video.videoUrl)}`}
                              title={video.title}
                              frameBorder="0"
                              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                              allowFullScreen
                              className="w-full h-full"
                              style={{ minHeight: '400px' }}
                            />
                          ) : (
                            <div className="flex items-center justify-center h-full" style={{ minHeight: '400px' }}>
                              <div className="text-center text-white/70">
                                <Play className="h-16 w-16 mx-auto mb-4" />
                                <p className="text-lg font-medium">{video.title}</p>
                                <p className="text-sm opacity-70">Video non disponibile</p>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Action Buttons */}
            <div className="space-y-6 animate-fade-in-delay-3">
              {/* Exercises */}
              {currentDayData.exercises && currentDayData.exercises.length > 0 && (
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-white mb-3">Esercizi Pratici</h3>
                  {currentDayData.exercises.map(exerciseId => {
                    const exercise = exercises[exerciseId];
                    if (!exercise) return null;

                    return (
                      <div key={exerciseId} className="max-w-2xl mx-auto">
                        <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-4">
                              <div className="p-3 bg-blue-500/20 rounded-full">
                                <Brain className="h-6 w-6 text-blue-300" />
                              </div>
                              <div className="text-left">
                                <h3 className="text-lg font-semibold text-white">
                                  {exercise.title}
                                </h3>
                                <p className="text-white/70 text-sm">
                                  {exercise.category}
                                </p>
                              </div>
                            </div>
                            <button
                              onClick={() => goToExercise(exerciseId)}
                              className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors flex items-center space-x-2"
                            >
                              <span>Inizia Esercizio</span>
                              <ChevronRight className="h-4 w-4" />
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Articles */}
              {currentDayData.articles && currentDayData.articles.length > 0 && (
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-white mb-3">Articoli di Approfondimento</h3>
                  {currentDayData.articles.map(articleId => {
                    const article = articles[articleId];
                    if (!article) return null;

                    return (
                      <div key={articleId} className="max-w-2xl mx-auto">
                        <div className="bg-white/5 backdrop-blur-sm rounded-xl p-4 border border-white/10">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-3">
                              <div className="p-2 bg-green-500/20 rounded-full">
                                <FileText className="h-5 w-5 text-green-300" />
                              </div>
                              <div className="text-left">
                                <h4 className="font-medium text-white">
                                  {article.title}
                                </h4>
                                <p className="text-white/60 text-xs">
                                  {article.category}
                                </p>
                              </div>
                            </div>
                            <button
                              onClick={() => goToArticle(articleId)}
                              className="px-4 py-2 bg-green-600/20 hover:bg-green-600/30 text-green-200 rounded-lg text-sm font-medium transition-colors flex items-center space-x-1"
                            >
                              <span>Leggi</span>
                              <ChevronRight className="h-3 w-3" />
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Completion Message */}
              {isDayCompleted && (
                <div className="max-w-2xl mx-auto">
                  <div className="bg-green-500/10 border border-green-500/20 rounded-xl p-4">
                    <div className="flex items-center space-x-3">
                      <CheckCircle className="h-6 w-6 text-green-400" />
                      <p className="text-green-200 font-medium">
                        Giorno {currentDay} completato! Ottimo lavoro!
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Final Completion Message */}
              {currentDay === sortedDays.length && isDayCompleted && settings.completionMessage && (
                <div className="max-w-2xl mx-auto mt-8">
                  <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-xl p-6">
                    <p className="text-yellow-100 text-lg font-medium">
                      {settings.completionMessage}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Navigation */}
          <div className="flex items-center justify-between mt-12">
            {/* Previous Button */}
            <button
              onClick={prevDay}
              className={`flex items-center space-x-2 px-6 py-3 rounded-lg font-medium transition-all ${
                currentDay === 1 
                  ? 'opacity-0 pointer-events-none' 
                  : 'opacity-100 bg-white/10 hover:bg-white/20 backdrop-blur-sm text-white'
              }`}
            >
              <ArrowLeft className="h-5 w-5" />
              <span>Giorno Precedente</span>
            </button>

            {/* Day Indicators */}
            <div className="flex space-x-2">
              {sortedDays.map((day) => (
                <button
                  key={day.day}
                  onClick={() => setCurrentDay(day.day)}
                  className={`h-3 rounded-full transition-all ${
                    day.day === currentDay 
                      ? 'w-8 bg-white/80' 
                      : completedDays.has(day.day)
                      ? 'w-3 bg-green-400/60'
                      : day.day < currentDay
                      ? 'w-3 bg-white/40'
                      : 'w-3 bg-white/20'
                  }`}
                  title={`Giorno ${day.day}${completedDays.has(day.day) ? ' (Completato)' : ''}`}
                />
              ))}
            </div>

            {/* Next/Complete Button */}
            <button
              onClick={nextDay}
              disabled={completing || !isDayCompleted}
              className={`flex items-center space-x-2 px-6 py-3 rounded-lg font-medium transition-all transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed ${
                isDayCompleted 
                  ? 'bg-green-600 hover:bg-green-700 text-white' 
                  : 'bg-gray-500 text-gray-300 cursor-not-allowed'
              }`}
            >
              <span>
                {currentDay === sortedDays.length ? 'Completa Percorso' : 'Giorno Successivo'}
              </span>
              {currentDay === sortedDays.length ? (
                <CheckCircle className="h-5 w-5" />
              ) : (
                <ArrowRight className="h-5 w-5" />
              )}
            </button>
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes fade-in {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .animate-fade-in {
          animation: fade-in 0.6s ease-out;
        }

        .animate-fade-in-delay {
          animation: fade-in 0.6s ease-out 0.2s both;
        }

        .animate-fade-in-delay-2 {
          animation: fade-in 0.6s ease-out 0.4s both;
        }

        .animate-fade-in-delay-3 {
          animation: fade-in 0.6s ease-out 0.6s both;
        }
      `}</style>
    </div>
  );
};

export default OnboardingInteractivePage;