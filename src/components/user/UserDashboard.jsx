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
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    if (currentUser) {
      fetchDashboardData();
    }
  }, [currentUser]);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);

      // Fetch published exercises ordered by order
      const exercisesQuery = query(
        collection(db, 'exercises'),
        where('isPublished', '==', true),
        orderBy('order', 'asc')
      );
      
      const exercisesSnapshot = await getDocs(exercisesQuery);
      const exercisesData = exercisesSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setExercises(exercisesData);

      // Fetch user progress
      const progressDoc = await getDoc(doc(db, 'userProgress', currentUser.uid));
      if (progressDoc.exists()) {
        setUserProgress(progressDoc.data());
      }

      // Fetch completed exercise sessions
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
      setCompletedExercises(completedData);

      // Fetch a motivational tip (if available)
      const userLevel = userProfile?.userLevel || 1;
      const tipsQuery = query(
        collection(db, 'motivationalTips'),
        where('userLevel', '<=', userLevel),
        where('active', '==', true),
        orderBy('priority', 'desc')
      );
      
      const tipsSnapshot = await getDocs(tipsQuery);
      if (!tipsSnapshot.empty) {
        const tips = tipsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        const randomTip = tips[Math.floor(Math.random() * tips.length)];
        setMotivationalTip(randomTip);
      }

    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const startExercise = async (exercise) => {
    try {
      // Create new exercise session
      const sessionData = {
        userId: currentUser.uid,
        exerciseId: exercise.id,
        exerciseTitle: exercise.title,
        startTime: new Date(),
        completed: false,
        progress: 0
      };

      const sessionRef = await addDoc(collection(db, 'exerciseSessions'), sessionData);
      
      // Navigate to exercise detail
      navigate(`/exercises/${exercise.id}`, { 
        state: { sessionId: sessionRef.id, exercise } 
      });
    } catch (error) {
      console.error('Error starting exercise:', error);
      alert('Errore nell\'avvio dell\'esercizio');
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
            Ciao, {userProfile?.name || userProfile?.displayName || 'Atleta'}!
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Benvenuto nella tua dashboard di allenamento mentale
          </p>
        </div>

        {/* Premium Banner */}
        {!userProfile?.isPremium && (
          <div className="bg-gradient-to-r from-amber-500 to-yellow-600 rounded-xl shadow-lg p-6 mb-8 text-white relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full transform translate-x-16 -translate-y-16"></div>
            <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/5 rounded-full transform -translate-x-12 translate-y-12"></div>
            
            <div className="relative z-10">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-2 mb-3">
                    <Crown className="h-8 w-8 text-white" />
                    <h2 className="text-2xl font-bold">Sblocca il Premium</h2>
                  </div>
                  <p className="text-amber-100 mb-4 text-lg">
                    Accedi a coaching personalizzato, contenuti esclusivi e supporto individuale per massimizzare le tue performance mentali.
                  </p>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                    <div className="flex items-center space-x-2">
                      <Zap className="h-5 w-5 text-yellow-200" />
                      <span className="text-amber-100">Coaching 1-on-1 personalizzato</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Sparkles className="h-5 w-5 text-yellow-200" />
                      <span className="text-amber-100">Contenuti esclusivi avanzati</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Brain className="h-5 w-5 text-yellow-200" />
                      <span className="text-amber-100">Analisi approfondite personalizzate</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Target className="h-5 w-5 text-yellow-200" />
                      <span className="text-amber-100">Piani di training su misura</span>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="flex flex-col sm:flex-row gap-3">
                <button
                  onClick={() => navigate('/questionnaire/premium')}
                  className="flex items-center justify-center space-x-2 bg-white text-amber-600 px-6 py-3 rounded-lg font-semibold hover:bg-amber-50 transition-colors"
                >
                  <Crown className="h-5 w-5" />
                  <span>Richiedi Premium</span>
                  <ArrowRight className="h-4 w-4" />
                </button>
                <button
                  onClick={() => navigate('/premium')}
                  className="flex items-center justify-center space-x-2 border-2 border-white text-white px-6 py-3 rounded-lg font-semibold hover:bg-white/10 transition-colors"
                >
                  <span>Scopri di più</span>
                  <ArrowRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
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
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">
              Esercizi Disponibili
            </h2>
            <div className="flex items-center space-x-3">
              {!userProfile?.isPremium && (
                <button
                  onClick={() => navigate('/premium')}
                  className="flex items-center space-x-1 px-3 py-1 bg-amber-100 text-amber-700 rounded-lg hover:bg-amber-200 transition-colors text-sm font-medium"
                >
                  <Crown className="h-4 w-4" />
                  <span>Premium</span>
                </button>
              )}
              <span className="text-sm text-gray-500 dark:text-gray-400">
                {exercises.length} esercizi totali
              </span>
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
                    className="border border-gray-200 dark:border-gray-600 rounded-lg p-4 hover:shadow-md transition-all duration-200"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
                          {exercise.title}
                        </h3>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                          {exercise.description}
                        </p>
                      </div>
                      {isCompleted && (
                        <CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0 ml-2" />
                      )}
                    </div>

                    <div className="flex items-center gap-4 text-xs text-gray-500 dark:text-gray-400 mb-4">
                      {exercise.category && (
                        <div className="flex items-center space-x-1">
                          <BookOpen className="h-3 w-3" />
                          <span>{exercise.category}</span>
                        </div>
                      )}
                      {exercise.difficulty && (
                        <div className="flex items-center space-x-1">
                          <Target className="h-3 w-3" />
                          <span>{exercise.difficulty}</span>
                        </div>
                      )}
                      {exercise.duration && (
                        <div className="flex items-center space-x-1">
                          <Clock className="h-3 w-3" />
                          <span>{exercise.duration}</span>
                        </div>
                      )}
                    </div>

                    <button
                      onClick={() => startExercise(exercise)}
                      className={`w-full flex items-center justify-center space-x-2 py-2 px-4 rounded-lg font-medium transition-colors ${
                        isCompleted
                          ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 hover:bg-green-200 dark:hover:bg-green-900/50'
                          : 'bg-blue-500 hover:bg-blue-600 text-white'
                      }`}
                    >
                      <PlayCircle className="h-4 w-4" />
                      <span>{isCompleted ? 'Rifai esercizio' : 'Inizia esercizio'}</span>
                    </button>
                  </div>
                );
              })}
            </div>
          )}

          {/* Premium CTA for exercises */}
          {!userProfile?.isPremium && exercises.length > 0 && (
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
                  className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg"
                >
                  <div className="flex items-center space-x-3">
                    <CheckCircle className="h-5 w-5 text-green-500" />
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white">
                        {session.exerciseTitle}
                      </p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        Completato il {new Date(
                          session.startTime.toDate ? session.startTime.toDate() : session.startTime
                        ).toLocaleDateString('it-IT')}
                      </p>
                    </div>
                  </div>
                  <Trophy className="h-4 w-4 text-yellow-500" />
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