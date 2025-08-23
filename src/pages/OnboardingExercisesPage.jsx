import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { collection, query, where, getDocs, doc, getDoc } from 'firebase/firestore';
import { db } from '../config/firebase';
import { auth } from '../config/firebase';
import { signOut } from 'firebase/auth';
import { CheckCircle, Lock, Play, Star, Trophy, Clock, LogOut } from 'lucide-react';

const OnboardingExercisesPage = () => {
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const [onboardingExercises, setOnboardingExercises] = useState([]);
  const [completedExercises, setCompletedExercises] = useState(new Set());
  const [loading, setLoading] = useState(true);

  // Definisco i 7 esercizi obbligatori con categorie
  const requiredExercises = [
    { position: 1, category: '🌅 MATTINA', title: 'Il risveglio del campione' },
    { position: 2, category: '🎯 PRE-GARA', title: 'Preparazione mentale' },
    { position: 3, category: '💪 MOTIVAZIONE', title: 'Trova la tua forza' },
    { position: 4, category: '🧠 CONCENTRAZIONE', title: 'Focus assoluto' },
    { position: 5, category: '🏆 FIDUCIA', title: 'Credi in te stesso' },
    { position: 6, category: '⚡ ENERGIA', title: 'Carica la batteria' },
    { position: 7, category: '🎉 CELEBRAZIONE', title: 'Onora i tuoi successi' }
  ];

  useEffect(() => {
    fetchOnboardingData();
  }, [currentUser]);

  const fetchOnboardingData = async () => {
    if (!currentUser) return;
    
    try {
      console.log('🔍 Caricamento esercizi onboarding...');
      
      // Fetch esercizi con category="onboarding"
      const exercisesQuery = collection(db, 'exercises');
      const exercisesSnapshot = await getDocs(exercisesQuery);
      let allExercises = exercisesSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      console.log('🎯 Tutti gli esercizi:', allExercises.length);

      // Filtro SOLO esercizi con category="onboarding"
      let exercises = allExercises.filter(ex => {
        return ex.title && 
               ex.description && 
               ex.elements && 
               Array.isArray(ex.elements) && 
               ex.elements.length > 0 &&
               ex.category === 'onboarding' &&
               ex.isPublished === true; // Solo quelli pubblicati
      });

      console.log('🎯 Esercizi onboarding filtrati:', exercises.length, 'trovati');

      // Ordina per order se presente, altrimenti per createdAt o title
      exercises.sort((a, b) => {
        // Prima priorità: order field
        if (a.order !== undefined && b.order !== undefined) {
          return a.order - b.order;
        }
        // Seconda priorità: createdAt
        if (a.createdAt && b.createdAt) {
          return a.createdAt.toDate().getTime() - b.createdAt.toDate().getTime();
        }
        // Ultima priorità: title
        return (a.title || '').localeCompare(b.title || '');
      });

      // Se abbiamo meno di 7 esercizi onboarding, prendi comunque quelli che ci sono
      // Se ne abbiamo più di 7, prendi i primi 7
      if (exercises.length > 7) {
        exercises = exercises.slice(0, 7);
        console.log('📋 Limitati ai primi 7 esercizi onboarding');
      }
      
      console.log('✅ Esercizi onboarding trovati:', exercises);
      setOnboardingExercises(exercises);

      // Fetch risposte completate dall'utente
      const responsesQuery = query(
        collection(db, 'exerciseResponses'),
        where('userId', '==', currentUser.uid)
      );
      const responsesSnapshot = await getDocs(responsesQuery);
      
      const completed = new Set();
      responsesSnapshot.docs.forEach(doc => {
        const data = doc.data();
        if (data.exerciseId) {
          completed.add(data.exerciseId);
        }
      });
      
      console.log('✅ Esercizi completati:', Array.from(completed));
      setCompletedExercises(completed);
      
    } catch (error) {
      console.error('❌ Errore nel caricamento:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleExerciseClick = (exercise) => {
    navigate(`/exercise-intro/${exercise.id}`);
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
      localStorage.clear();
      navigate('/login');
    } catch (error) {
      console.error('Errore nel logout:', error);
    }
  };

  // Conta quanti esercizi sono stati completati in totale (non solo quelli dell'onboarding)
  const totalCompletedExercises = completedExercises.size;
  const completedOnboardingExercises = onboardingExercises.filter(ex => completedExercises.has(ex.id)).length;
  
  // Per l'onboarding, conta il totale degli esercizi completati (max 7)
  const completedCount = Math.min(totalCompletedExercises, 7);
  const totalCount = 7; // L'onboarding richiede sempre 7 esercizi
  const requiredCount = 7;
  const isComplete = totalCompletedExercises >= requiredCount;
  
  console.log('✅ Onboarding progress:', completedCount, 'out of', requiredCount);

  const handleUnlockApp = () => {
    // Vai alle domande di rito prima dello sblocco
    navigate('/onboarding-questions');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 min-h-full">
      <div className="px-4 py-8 max-w-4xl mx-auto pb-20">
        
        {/* Header */}
        <div className="text-center mb-8">
          {/* Logout button in top right */}
          <div className="flex justify-end mb-4">
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg transition-colors"
            >
              <LogOut className="h-4 w-4" />
              <span>Esci</span>
            </button>
          </div>
          
          <div className="mb-4">
            <Trophy className="h-16 w-16 text-yellow-500 mx-auto mb-4" />
            <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-2">
              Sblocca il potenziale di <span className="text-blue-600">Mentalità</span>
            </h1>
            <p className="text-xl text-gray-600 dark:text-gray-300 mb-6">
              Completa questi 7 esercizi fondamentali per accedere a tutte le funzionalità
            </p>
          </div>
          
          {/* Progress Bar */}
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 mb-8 shadow-lg">
            <div className="flex items-center justify-between mb-4">
              <span className="text-lg font-semibold text-gray-900 dark:text-white">
                Progresso: {completedCount}/{requiredCount}
              </span>
              <span className="text-2xl font-bold text-blue-600">
                {Math.round((completedCount / requiredCount) * 100)}%
              </span>
            </div>
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-4">
              <div 
                className="bg-gradient-to-r from-blue-500 to-purple-600 h-4 rounded-full transition-all duration-300"
                style={{ width: `${(completedCount / requiredCount) * 100}%` }}
              ></div>
            </div>
          </div>
        </div>

        {/* Exercises Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          {onboardingExercises.map((exercise, index) => {
            const isCompleted = completedExercises.has(exercise.id);
            const exerciseNumber = index + 1;
            // Segna come completato se è l'esercizio specifico O se abbiamo già completato abbastanza esercizi
            const markedAsComplete = isCompleted || (index < totalCompletedExercises);
            
            return (
              <div
                key={exercise.id}
                className={`bg-white dark:bg-gray-800 rounded-xl shadow-lg overflow-hidden transition-all duration-300 transform hover:scale-105 ${
                  markedAsComplete ? 'ring-2 ring-green-500' : 'hover:shadow-xl'
                }`}
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
                        <div className="text-sm font-medium opacity-75">Esercizio #{exerciseNumber}</div>
                      </div>
                    </div>
                  )}
                  
                  {/* Exercise Number Badge */}
                  <div className="absolute top-4 left-4">
                    <span className="px-3 py-1 bg-white/90 backdrop-blur-sm text-gray-800 text-sm font-bold rounded-full">
                      #{exerciseNumber}
                    </span>
                  </div>
                  
                  {/* Completed Badge */}
                  {isCompleted && (
                    <div className="absolute top-4 right-4">
                      <div className="bg-green-500 rounded-full p-2">
                        <CheckCircle className="h-6 w-6 text-white" />
                      </div>
                    </div>
                  )}
                  
                  {/* Gradient Overlay */}
                  <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-black/50 to-transparent"></div>
                </div>

                <div className={`p-6 ${isCompleted ? 'bg-green-50 dark:bg-green-900/20' : ''}`}>
                  
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
                    {exercise.difficulty && (
                      <div className="flex items-center gap-1">
                        <Star className="h-4 w-4" />
                        <span>{exercise.difficulty}</span>
                      </div>
                    )}
                  </div>
                  
                  {/* Action Button */}
                  <button
                    onClick={() => handleExerciseClick(exercise)}
                    className={`w-full py-4 rounded-xl font-bold text-lg transition-all duration-300 flex items-center justify-center gap-3 ${
                      isCompleted
                        ? 'bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white shadow-lg'
                        : 'bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white shadow-lg'
                    }`}
                  >
                    {isCompleted ? (
                      <>
                        <CheckCircle className="h-6 w-6" />
                        Completato - Ripeti
                      </>
                    ) : (
                      <>
                        <Play className="h-6 w-6" />
                        Inizia Esercizio
                      </>
                    )}
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Messaggio se ci sono meno di 7 esercizi */}
        {onboardingExercises.length < 7 && (
          <div className="text-center mb-8">
            <div className="bg-orange-50 dark:bg-orange-900/20 p-4 rounded-lg">
              <p className="text-orange-700 dark:text-orange-300">
                ⚠️ Trovati solo {onboardingExercises.length} esercizi. Ne servono 7 per completare l'onboarding.
              </p>
              <p className="text-sm text-orange-600 dark:text-orange-400 mt-1">
                Gli admin possono creare più esercizi dalla sezione "Gestione Esercizi".
              </p>
            </div>
          </div>
        )}

        {/* Unlock Button */}
        {isComplete && (
          <div className="text-center">
            <div className="bg-white dark:bg-gray-800 rounded-lg p-8 shadow-lg mb-6">
              <Star className="h-16 w-16 text-yellow-500 mx-auto mb-4" />
              <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
                🎉 Complimenti Campione!
              </h2>
              <p className="text-lg text-gray-600 dark:text-gray-300 mb-6">
                Hai completato tutti gli esercizi fondamentali. Ora puoi accedere a tutte le funzionalità di Mentalità!
              </p>
              <button
                onClick={handleUnlockApp}
                className="bg-gradient-to-r from-yellow-400 to-orange-500 hover:from-yellow-500 hover:to-orange-600 text-white font-bold py-4 px-8 rounded-xl text-xl transition-all duration-300 transform hover:scale-105 shadow-lg"
              >
                🚀 Sblocca Mentalità
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default OnboardingExercisesPage;