import React, { useState, useEffect } from 'react';
import { 
  collection, 
  query, 
  where, 
  orderBy, 
  getDocs,
  doc,
  setDoc,
  addDoc,
  getDoc
} from 'firebase/firestore';
import { db } from '../../config/firebase';
import { useAuth } from '../../context/AuthContext';
import { 
  Trophy, 
  Clock, 
  Target, 
  BookOpen, 
  Star, 
  PlayCircle,
  CheckCircle,
  Brain,
  TrendingUp,
  Crown,
  Zap,
  Sparkles,
  ArrowRight
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const UserDashboard = () => {
  const { currentUser, userProfile } = useAuth();
  const [exercises, setExercises] = useState([]);
  const [userProgress, setUserProgress] = useState(null);
  const [completedExercises, setCompletedExercises] = useState([]);
  const [motivationalTip, setMotivationalTip] = useState(null);
  const [weeklyNews, setWeeklyNews] = useState({
    exercises: [],
    articles: [],
    videos: [],
    questionnaires: []
  });
  const [loading, setLoading] = useState(true);
  const [showPremiumApprovalNotice, setShowPremiumApprovalNotice] = useState(false);
  const [showChampionWelcome, setShowChampionWelcome] = useState(false);
  const navigate = useNavigate();
  
  // Check if user is Champion
  const isChampion = localStorage.getItem('championBadge') === 'true';

  useEffect(() => {
    if (currentUser) {
      fetchDashboardData();
      checkPremiumApprovalStatus();
    }
  }, [currentUser, userProfile]);

  // Logica di redirect rimossa - ora gestita dal ProtectedRoute

  const checkPremiumApprovalStatus = async () => {
    if (!currentUser || !userProfile) return;
    
    // Check if user has been approved for Premium but hasn't paid yet
    if (userProfile.premiumRequestStatus === 'approved_pending_payment' && !userProfile.isPremium) {
      setShowPremiumApprovalNotice(true);
    }
  };

  const fetchDashboardData = async () => {
    try {
      console.log('🏠 UserDashboard: Inizio caricamento dati...');
      setLoading(true);

      // Initialize exercisesData as empty array in case of failure
      let exercisesData = [];

      // Fetch published exercises ordered by order
      console.log('📋 Caricamento esercizi...');
      try {
        const exercisesQuery = query(
          collection(db, 'exercises'),
          where('isPublished', '==', true),
          orderBy('order', 'asc')
        );
        
        const exercisesSnapshot = await getDocs(exercisesQuery);
        exercisesData = exercisesSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        setExercises(exercisesData);
        console.log('✅ Esercizi caricati:', exercisesData.length);
      } catch (exerciseError) {
        console.error('❌ Errore caricamento esercizi:', exerciseError);
        // Continua con gli altri dati anche se gli esercizi falliscono
        exercisesData = []; // Assicurati che sia definita
      }

      // Fetch user progress
      console.log('📊 Caricamento progresso utente...');
      try {
        const progressDoc = await getDoc(doc(db, 'userProgress', currentUser.uid));
        if (progressDoc.exists()) {
          setUserProgress(progressDoc.data());
          console.log('✅ Progresso utente caricato');
        }
      } catch (progressError) {
        console.error('❌ Errore caricamento progresso:', progressError);
      }

      // DOPO gli esercizi, carica le sessioni e arricchiscile
      console.log('🎯 Caricamento sessioni completate...');
      await loadCompletedSessions(exercisesData);

      // Fetch a motivational tip (if available)
      console.log('💡 Caricamento tip motivazionali...');
      try {
        const tipsQuery = query(
          collection(db, 'motivationalTips'),
          where('active', '==', true)
        );
        
        const tipsSnapshot = await getDocs(tipsQuery);
        if (!tipsSnapshot.empty) {
          const userLevel = userProfile?.userLevel || 1;
          // Filter and sort on client side to avoid composite index requirement
          const tips = tipsSnapshot.docs
            .map(doc => ({ id: doc.id, ...doc.data() }))
            .filter(tip => tip.userLevel <= userLevel)
            .sort((a, b) => (b.priority || 0) - (a.priority || 0));
            
          if (tips.length > 0) {
            const randomTip = tips[Math.floor(Math.random() * tips.length)];
            setMotivationalTip(randomTip);
            console.log('✅ Tip motivazionale caricato');
          }
        }
      } catch (tipsError) {
        console.error('❌ Errore caricamento tips:', tipsError);
      }

      // Fetch weekly news for Champions
      if (isChampion) {
        console.log('👑 Caricamento novità settimanali per Campione...');
        await fetchWeeklyNews();
      }

      console.log('🏠 UserDashboard: Caricamento completato');
    } catch (error) {
      console.error('❌ Errore generale dashboard:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchWeeklyNews = async () => {
    try {
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      
      const newsData = {
        exercises: [],
        articles: [],
        videos: [],
        questionnaires: []
      };

      // Fetch new exercises
      try {
        const exercisesQuery = query(
          collection(db, 'exercises'),
          where('createdAt', '>=', weekAgo),
          where('isPublished', '==', true),
          orderBy('createdAt', 'desc')
        );
        const exercisesSnapshot = await getDocs(exercisesQuery);
        newsData.exercises = exercisesSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
      } catch (error) {
        console.log('No new exercises or missing index');
      }

      // Fetch new articles
      try {
        const articlesQuery = query(
          collection(db, 'articles'),
          where('createdAt', '>=', weekAgo),
          orderBy('createdAt', 'desc')
        );
        const articlesSnapshot = await getDocs(articlesQuery);
        newsData.articles = articlesSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
      } catch (error) {
        console.log('No new articles or missing index');
      }

      // Fetch new videos
      try {
        const videosQuery = query(
          collection(db, 'videos'),
          where('createdAt', '>=', weekAgo),
          orderBy('createdAt', 'desc')
        );
        const videosSnapshot = await getDocs(videosQuery);
        newsData.videos = videosSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
      } catch (error) {
        console.log('No new videos or missing index');
      }

      // Fetch new questionnaires
      try {
        const questionnairesQuery = query(
          collection(db, 'questionnaireTemplates'),
          where('createdAt', '>=', weekAgo),
          orderBy('createdAt', 'desc')
        );
        const questionnairesSnapshot = await getDocs(questionnairesQuery);
        newsData.questionnaires = questionnairesSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
      } catch (error) {
        console.log('No new questionnaires or missing index');
      }

      setWeeklyNews(newsData);
      console.log('✅ Novità settimanali caricate:', newsData);
    } catch (error) {
      console.error('❌ Errore caricamento novità:', error);
    }
  };

  const loadCompletedSessions = async (exercisesData) => {
    try {
      const sessionsQuery = query(
        collection(db, 'exerciseSessions'),
        where('userId', '==', currentUser.uid),
        where('completed', '==', true),
        orderBy('startTime', 'desc')
      );
      
      const sessionsSnapshot = await getDocs(sessionsQuery);
      const completedData = sessionsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      
      // Debug: vediamo cosa contengono le sessioni
      console.log('🔍 Sessioni completate RAW:', completedData);
      console.log('🔍 Esercizi disponibili per arricchimento:', exercisesData.length);
      
      // Arricchiamo le sessioni con i titoli degli esercizi
      const enrichedSessions = await Promise.all(
        completedData.map(async (session) => {
          try {
            // Trova l'esercizio corrispondente
            const exercise = exercisesData.find(ex => ex.id === session.exerciseId);
            if (exercise) {
              console.log('✅ Esercizio trovato:', exercise.title);
              return {
                ...session,
                exerciseTitle: exercise.title,
                exerciseDifficulty: exercise.difficulty
              };
            } else {
              // Se non trovato negli esercizi caricati, prova a caricarlo da Firebase
              console.log('🔍 Cerco esercizio in Firebase:', session.exerciseId);
              const exerciseDoc = await getDoc(doc(db, 'exercises', session.exerciseId));
              if (exerciseDoc.exists()) {
                const exerciseData = exerciseDoc.data();
                console.log('✅ Esercizio trovato in Firebase:', exerciseData.title);
                return {
                  ...session,
                  exerciseTitle: exerciseData.title || 'Esercizio sconosciuto',
                  exerciseDifficulty: exerciseData.difficulty
                };
              }
            }
            console.log('❌ Esercizio non trovato per:', session.exerciseId);
            return {
              ...session,
              exerciseTitle: `Esercizio ${session.exerciseId}`,
              exerciseDifficulty: 'N/A'
            };
          } catch (error) {
            console.error('❌ Errore arricchimento sessione:', error);
            return {
              ...session,
              exerciseTitle: 'Esercizio',
              exerciseDifficulty: 'N/A'
            };
          }
        })
      );
      
      setCompletedExercises(enrichedSessions);
      console.log('✅ Sessioni arricchite caricate:', enrichedSessions.length);
      console.log('🔍 Prima sessione arricchita:', enrichedSessions[0]);
    } catch (sessionsError) {
      console.error('❌ Errore caricamento sessioni:', sessionsError);
    }
  };

  const startExercise = async (exercise) => {
    try {
      // Navigate to exercise practice page
      navigate(`/exercises/${exercise.id}/practice`);
    } catch (error) {
      console.error('Error starting exercise:', error);
      alert('Errore nell\'avvio dell\'esercizio');
    }
  };

  const getDifficultyColor = (difficulty) => {
    switch (difficulty?.toLowerCase()) {
      case 'principiante':
      case 'facile':
        return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300';
      case 'intermedio':
      case 'medio':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300';
      case 'avanzato':
      case 'difficile':
        return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300';
    }
  };

  const getExerciseStatus = (exerciseId) => {
    return completedExercises.some(session => session.exerciseId === exerciseId);
  };

  const getCompletedCount = () => {
    return completedExercises.length;
  };

  const getCurrentStreak = () => {
    // Simple streak calculation - in a real app this would be more sophisticated
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    let streak = 0;
    let checkDate = new Date(today);
    
    for (let i = 0; i < 30; i++) { // Check last 30 days
      const dayHasSessions = completedExercises.some(session => {
        const sessionDate = new Date(session.startTime.toDate ? session.startTime.toDate() : session.startTime);
        sessionDate.setHours(0, 0, 0, 0);
        return sessionDate.getTime() === checkDate.getTime();
      });
      
      if (dayHasSessions) {
        streak++;
        checkDate.setDate(checkDate.getDate() - 1);
      } else if (streak > 0) {
        break; // Streak broken
      } else {
        checkDate.setDate(checkDate.getDate() - 1);
      }
    }
    
    return streak;
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        <span className="ml-3 text-gray-600 dark:text-gray-400">Caricamento dashboard...</span>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Ciao, {userProfile?.name || userProfile?.displayName || 'Atleta'}! {isChampion ? '🏆' : ''}
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            {isChampion 
              ? 'Benvenuto nella tua dashboard da Campione! Hai sbloccato tutti i contenuti 🚀'
              : 'Benvenuto nella tua dashboard di allenamento mentale'
            }
          </p>
        </div>

        {/* Welcome Message for New Champions */}
        {isChampion && !localStorage.getItem('championWelcomeShown') && showChampionWelcome !== false && (
          <div className="bg-gradient-to-r from-yellow-400 via-orange-500 to-red-500 rounded-xl shadow-lg p-6 mb-8 text-white relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full transform translate-x-16 -translate-y-16"></div>
            <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/5 rounded-full transform -translate-x-12 translate-y-12"></div>
            
            <div className="relative z-10">
              <div className="flex items-center space-x-3 mb-4">
                <Crown className="h-8 w-8 text-white" />
                <h2 className="text-2xl font-bold">🎉 Congratulazioni, Campione!</h2>
              </div>
              
              <div className="space-y-3">
                <p className="text-yellow-100 text-lg">
                  Hai completato l'onboarding e ottenuto il <strong>Badge da Campione</strong>!
                </p>
                <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4">
                  <h3 className="font-bold mb-2">🔓 Ora hai accesso a:</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
                    <div className="flex items-center space-x-2">
                      <Brain className="h-4 w-4" />
                      <span>Tutti gli esercizi mentali</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <PlayCircle className="h-4 w-4" />
                      <span>Video tutorial avanzati</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <BookOpen className="h-4 w-4" />
                      <span>Articoli di approfondimento</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Target className="h-4 w-4" />
                      <span>Questionari personalizzati</span>
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => {
                    localStorage.setItem('championWelcomeShown', 'true');
                    setShowChampionWelcome(false);
                  }}
                  className="mt-4 bg-white text-orange-600 px-4 py-2 rounded-lg font-semibold hover:bg-orange-50 transition-all"
                >
                  Inizia l'avventura! 🚀
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Weekly News for Champions */}
        {isChampion && (
          <div className="bg-gradient-to-r from-blue-500 to-cyan-600 rounded-xl shadow-lg p-6 mb-8 text-white relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full transform translate-x-16 -translate-y-16"></div>
            <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/5 rounded-full transform -translate-x-12 translate-y-12"></div>
            
            <div className="relative z-10">
              <div className="flex items-center space-x-3 mb-4">
                <Sparkles className="h-8 w-8 text-white" />
                <h2 className="text-2xl font-bold">Novità dell'Ultima Settimana</h2>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                {/* New Exercises */}
                <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <Brain className="h-6 w-6 text-cyan-200" />
                    <span className="text-2xl font-bold">{weeklyNews.exercises.length}</span>
                  </div>
                  <p className="text-cyan-100 text-sm font-medium">Nuovi Esercizi</p>
                  {weeklyNews.exercises.length > 0 && (
                    <div className="mt-2">
                      <p className="text-xs text-cyan-200 truncate">
                        {weeklyNews.exercises[0].title}
                      </p>
                    </div>
                  )}
                </div>

                {/* New Articles */}
                <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <BookOpen className="h-6 w-6 text-cyan-200" />
                    <span className="text-2xl font-bold">{weeklyNews.articles.length}</span>
                  </div>
                  <p className="text-cyan-100 text-sm font-medium">Nuovi Articoli</p>
                  {weeklyNews.articles.length > 0 && (
                    <div className="mt-2">
                      <p className="text-xs text-cyan-200 truncate">
                        {weeklyNews.articles[0].title}
                      </p>
                    </div>
                  )}
                </div>

                {/* New Videos */}
                <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <PlayCircle className="h-6 w-6 text-cyan-200" />
                    <span className="text-2xl font-bold">{weeklyNews.videos.length}</span>
                  </div>
                  <p className="text-cyan-100 text-sm font-medium">Nuovi Video</p>
                  {weeklyNews.videos.length > 0 && (
                    <div className="mt-2">
                      <p className="text-xs text-cyan-200 truncate">
                        {weeklyNews.videos[0].title}
                      </p>
                    </div>
                  )}
                </div>

                {/* New Questionnaires */}
                <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <Target className="h-6 w-6 text-cyan-200" />
                    <span className="text-2xl font-bold">{weeklyNews.questionnaires.length}</span>
                  </div>
                  <p className="text-cyan-100 text-sm font-medium">Nuovi Questionari</p>
                  {weeklyNews.questionnaires.length > 0 && (
                    <div className="mt-2">
                      <p className="text-xs text-cyan-200 truncate">
                        {weeklyNews.questionnaires[0].title}
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Show message if no new content */}
              {weeklyNews.exercises.length === 0 && 
               weeklyNews.articles.length === 0 && 
               weeklyNews.videos.length === 0 && 
               weeklyNews.questionnaires.length === 0 && (
                <div className="mt-4 text-center">
                  <p className="text-cyan-100">
                    Non ci sono novità questa settimana. Torna presto per scoprire nuovi contenuti! 🚀
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Premium Approval Notice */}
        {showPremiumApprovalNotice && (
          <div className="mb-8">
            <div className="bg-gradient-to-r from-green-500 to-emerald-600 rounded-lg shadow-lg p-6 text-white relative overflow-hidden">
              <div className="absolute top-0 right-0 opacity-10">
                <Crown className="h-32 w-32" />
              </div>
              <div className="relative z-10">
                <div className="flex items-start justify-between">
                  <div className="flex items-center">
                    <div className="bg-white/20 backdrop-blur-sm p-3 rounded-lg">
                      <CheckCircle className="h-6 w-6 text-white" />
                    </div>
                    <div className="ml-4">
                      <h3 className="text-xl font-bold text-white mb-1">🎉 Congratulazioni!</h3>
                      <p className="text-green-100 text-sm mb-2">La tua richiesta Premium è stata <strong>APPROVATA</strong></p>
                      <p className="text-xs text-green-200">Approvato il {userProfile?.premiumApprovedAt?.toDate?.()?.toLocaleDateString('it-IT') || 'oggi'}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => setShowPremiumApprovalNotice(false)}
                    className="text-white/60 hover:text-white transition-colors"
                  >
                    ✕
                  </button>
                </div>
                <div className="mt-4 pt-4 border-t border-green-400/30">
                  <p className="text-white text-sm mb-3">
                    💳 <strong>Prossimo passo:</strong> Completa il pagamento per attivare immediatamente tutti i benefici Premium
                  </p>
                  <button
                    onClick={() => navigate('/premium?approved=true')}
                    className="inline-flex items-center space-x-2 px-4 py-2 bg-white text-green-600 rounded-lg font-semibold hover:bg-green-50 transition-all transform hover:scale-105"
                  >
                    <span>💎 Completa Pagamento Premium</span>
                    <ArrowRight className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {/* Exercises Completed Card */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="bg-blue-100 dark:bg-blue-900/30 p-3 rounded-lg">
                <Trophy className="h-6 w-6 text-blue-600 dark:text-blue-400" />
              </div>
              <div className="ml-4">
                <h3 className="text-2xl font-bold text-gray-900 dark:text-white">
                  {getCompletedCount()}
                </h3>
                <p className="text-gray-600 dark:text-gray-400">
                  Esercizi completati
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="bg-green-100 dark:bg-green-900/30 p-3 rounded-lg">
                <TrendingUp className="h-6 w-6 text-green-600 dark:text-green-400" />
              </div>
              <div className="ml-4">
                <h3 className="text-2xl font-bold text-gray-900 dark:text-white">
                  {getCurrentStreak()}
                </h3>
                <p className="text-gray-600 dark:text-gray-400">
                  Giorni consecutivi
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="bg-purple-100 dark:bg-purple-900/30 p-3 rounded-lg">
                <Brain className="h-6 w-6 text-purple-600 dark:text-purple-400" />
              </div>
              <div className="ml-4">
                <h3 className="text-2xl font-bold text-gray-900 dark:text-white">
                  {userProfile?.userLevel || 1}
                </h3>
                <p className="text-gray-600 dark:text-gray-400">
                  Livello attuale
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Motivational Tip */}
        {motivationalTip && (
          <div className="bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg shadow p-6 mb-8 text-white">
            <div className="flex items-start space-x-3">
              <Star className="h-6 w-6 flex-shrink-0 mt-1" />
              <div>
                <h3 className="font-semibold mb-2">Consiglio del giorno</h3>
                <p className="text-blue-100">{motivationalTip.content || motivationalTip.text}</p>
              </div>
            </div>
          </div>
        )}

        {/* Available Exercises */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
              Esercizi Disponibili
            </h2>
            <div className="flex items-center space-x-3">
              {!userProfile?.isPremium && !isChampion && (
                <button
                  onClick={() => navigate('/premium')}
                  className="flex items-center space-x-1 px-3 py-1 bg-amber-100 text-amber-700 rounded-lg hover:bg-amber-200 transition-colors text-sm font-medium"
                >
                  <Crown className="h-4 w-4" />
                  <span>Premium</span>
                </button>
              )}
              <button
                onClick={() => navigate('/exercises')}
                className="flex items-center space-x-1 px-3 py-1 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors text-sm font-medium"
              >
                <ArrowRight className="h-4 w-4" />
                <span>Vedi tutti</span>
              </button>
            </div>
          </div>

          {exercises.length === 0 ? (
            <div className="text-center py-12">
              <Brain className="h-16 w-16 mx-auto mb-4 text-gray-400" />
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                Nessun esercizio disponibile
              </h3>
              <p className="text-gray-500 dark:text-gray-400">
                Gli esercizi verranno pubblicati presto. Torna più tardi!
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {exercises.map((exercise) => {
                const isCompleted = getExerciseStatus(exercise.id);
                
                return (
                  <div
                    key={exercise.id}
                    className="bg-white dark:bg-gray-800 rounded-xl shadow-lg overflow-hidden transition-all duration-300 transform hover:scale-105 cursor-pointer"
                    onClick={() => startExercise(exercise)}
                  >
                    {/* Cover Image */}
                    <div className="relative h-48 bg-gradient-to-br from-blue-400 via-purple-500 to-pink-500">
                      {exercise.coverImage ? (
                        <img 
                          src={exercise.coverImage} 
                          alt={exercise.title}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <div className="text-white text-center">
                            <div className="text-6xl mb-2">💪</div>
                            <div className="text-sm font-medium opacity-75">{exercise.category || 'Generale'}</div>
                          </div>
                        </div>
                      )}
                      
                      {/* Category Badge */}
                      <div className="absolute top-4 left-4">
                        <span className="px-3 py-1 bg-white/90 backdrop-blur-sm text-gray-800 text-sm font-bold rounded-full">
                          {exercise.category || 'Generale'}
                        </span>
                      </div>
                      
                      {/* Completed Badge */}
                      {isCompleted && (
                        <div className="absolute top-4 right-4">
                          <div className="bg-green-500 text-white p-2 rounded-full">
                            <CheckCircle className="h-5 w-5" />
                          </div>
                        </div>
                      )}
                      
                      {/* Difficulty Badge */}
                      {exercise.difficulty && (
                        <div className="absolute bottom-4 right-4">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getDifficultyColor(exercise.difficulty)}`}>
                            {exercise.difficulty}
                          </span>
                        </div>
                      )}
                      
                      {/* Gradient Overlay */}
                      <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-black/50 to-transparent"></div>
                    </div>

                    <div className="p-6">
                      
                      {/* Claim */}
                      {exercise.claim && (
                        <div className="mb-3">
                          <span className="text-blue-600 dark:text-blue-400 font-bold text-lg italic">
                            "{exercise.claim}"
                          </span>
                        </div>
                      )}
                      
                      {/* Title */}
                      <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-3">
                        {exercise.title}
                      </h3>
                      
                      {/* Description */}
                      <p className="text-gray-600 dark:text-gray-300 text-sm mb-6 line-clamp-3">
                        {exercise.description}
                      </p>
                      
                      {/* Stats */}
                      <div className="flex items-center gap-4 mb-6 text-sm text-gray-500 dark:text-gray-400">
                        {exercise.duration && (
                          <div className="flex items-center gap-1">
                            <Clock className="h-4 w-4" />
                            <span>{exercise.duration}</span>
                          </div>
                        )}
                        <div className="flex items-center gap-1">
                          <Star className="h-4 w-4 fill-current text-yellow-400" />
                          <span>4.8</span>
                        </div>
                      </div>
                      
                      {/* Action Button */}
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          startExercise(exercise);
                        }}
                        className={`w-full py-4 rounded-xl font-bold text-lg transition-all duration-300 flex items-center justify-center gap-3 shadow-lg ${
                          isCompleted
                            ? 'bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white'
                            : 'bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white'
                        }`}
                      >
                        <PlayCircle className="h-6 w-6" />
                        {isCompleted ? 'Rifai Esercizio' : 'Inizia Esercizio'}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Premium CTA for exercises */}
          {!userProfile?.isPremium && !isChampion && exercises.length > 0 && (
            <div className="mt-6 p-4 bg-gradient-to-r from-amber-50 to-yellow-50 dark:from-amber-900/20 dark:to-yellow-900/20 border border-amber-200 dark:border-amber-800 rounded-lg">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <Crown className="h-6 w-6 text-amber-600" />
                  <div>
                    <h3 className="font-semibold text-gray-900 dark:text-white">
                      Sblocca Esercizi Premium
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Accedi a esercizi avanzati e personalizzati per il tuo livello
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => navigate('/questionnaire/premium')}
                  className="flex items-center space-x-2 bg-amber-600 text-white px-4 py-2 rounded-lg hover:bg-amber-700 transition-colors text-sm font-medium"
                >
                  <span>Richiedi Premium</span>
                  <ArrowRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Recent Activity */}
        {completedExercises.length > 0 && (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 mt-8">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6">
              Attività Recenti
            </h2>
            <div className="space-y-3">
              {completedExercises.slice(0, 5).map((session) => (
                <div
                  key={session.id}
                  onClick={() => {
                    if (session.exerciseId) {
                      console.log('🔗 Navigating to exercise:', session.exerciseId);
                      navigate(`/exercises/${session.exerciseId}/practice`);
                    }
                  }}
                  className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600 cursor-pointer transition-colors"
                >
                  <div className="flex items-center space-x-3">
                    <CheckCircle className="h-5 w-5 text-green-500" />
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white">
                        {session.exerciseTitle || 'Esercizio'}
                      </p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        Completato il {new Date(
                          session.startTime.toDate ? session.startTime.toDate() : session.startTime
                        ).toLocaleDateString('it-IT')}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    {session.exerciseDifficulty && (
                      <span className={`text-xs px-2 py-1 rounded-full ${getDifficultyColor(session.exerciseDifficulty)}`}>
                        {session.exerciseDifficulty}
                      </span>
                    )}
                    <Trophy className="h-4 w-4 text-yellow-500" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default UserDashboard;