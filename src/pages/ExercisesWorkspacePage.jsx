import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Play, Clock, CheckCircle, AlertCircle, User, Target, Crown, Sparkles } from 'lucide-react';
import { db } from '../config/firebase';
import { collection, getDocs, query, orderBy, where } from 'firebase/firestore';
import MotivationalMessage from '../components/MotivationalMessage';
import { useAuth } from '../context/AuthContext';

const ExercisesWorkspacePage = () => {
  const navigate = useNavigate();
  const { userProfile } = useAuth();
  const [exercises, setExercises] = useState([]);
  const [loading, setLoading] = useState(true);
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('all');

  useEffect(() => {
    const fetchExercises = async () => {
      try {
        console.log('🎯 CARICAMENTO ESERCIZI INTERATTIVI...');
        
        // Carica dalla collezione exercises con ordinamento
        const exercisesQuery = query(
          collection(db, 'exercises'),
          where('isPublished', '==', true),
          orderBy('order')
        );
        
        const snapshot = await getDocs(exercisesQuery);
        const exercisesData = [];
        
        snapshot.forEach((doc) => {
          const data = { id: doc.id, ...doc.data() };
          
          // Verifica che abbia elementi per essere un esercizio interattivo
          if (data.elements && Array.isArray(data.elements) && data.elements.length > 0) {
            exercisesData.push(data);
          }
        });
        
        console.log('✅ Esercizi interattivi trovati:', exercisesData.length);
        
        setExercises(exercisesData);
        
        // Estrai le categorie uniche
        const uniqueCategories = [...new Set(exercisesData.map(ex => ex.category || 'Generale'))];
        setCategories(uniqueCategories);
        
      } catch (error) {
        console.error('Errore nel caricamento degli esercizi:', error);
        
        // Se fallisce la query con isPublished, prova senza filtri
        try {
          console.log('🔄 Fallback: caricamento tutti gli esercizi...');
          const allExercisesQuery = query(collection(db, 'exercises'));
          const allSnapshot = await getDocs(allExercisesQuery);
          const allExercises = [];
          
          allSnapshot.forEach((doc) => {
            const data = { id: doc.id, ...doc.data() };
            if (data.elements && Array.isArray(data.elements) && data.elements.length > 0) {
              allExercises.push(data);
            }
          });
          
          setExercises(allExercises);
          const uniqueCategories = [...new Set(allExercises.map(ex => ex.category || 'Generale'))];
          setCategories(uniqueCategories);
          
        } catch (fallbackError) {
          console.error('Errore anche nel fallback:', fallbackError);
          setExercises([]);
        }
      } finally {
        setLoading(false);
      }
    };

    fetchExercises();
  }, []);

  const filteredExercises = selectedCategory === 'all' 
    ? exercises 
    : exercises.filter(ex => ex.category === selectedCategory);

  const getDifficultyColor = (difficulty) => {
    switch(difficulty?.toLowerCase()) {
      case 'principiante': return 'text-green-600 bg-green-100 dark:bg-green-900/20 dark:text-green-400';
      case 'intermedio': return 'text-yellow-600 bg-yellow-100 dark:bg-yellow-900/20 dark:text-yellow-400';
      case 'avanzato': return 'text-red-600 bg-red-100 dark:bg-red-900/20 dark:text-red-400';
      default: return 'text-gray-600 bg-gray-100 dark:bg-gray-700 dark:text-gray-300';
    }
  };

  const getElementsCount = (exercise) => {
    return exercise.elements ? exercise.elements.length : 0;
  };

  const getEstimatedDuration = (exercise) => {
    const elementsCount = getElementsCount(exercise);
    const estimatedMinutes = Math.max(5, elementsCount * 2); // 2 min per elemento, min 5 min
    return `${estimatedMinutes} min`;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-300">Caricamento esercizi interattivi...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 shadow-sm">
        <div className="px-4 py-6">
          <div className="flex items-center gap-3 mb-2">
            <Target className="h-8 w-8 text-blue-500" />
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Esercizi Interattivi</h1>
          </div>
          <p className="text-gray-600 dark:text-gray-300">
            Completa gli esercizi di mentalità sportiva con domande personalizzate
          </p>
          <div className="mt-4 grid grid-cols-2 gap-4">
            <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg">
              <div className="flex items-center gap-2">
                <Play className="h-5 w-5 text-blue-500" />
                <span className="text-sm font-medium text-blue-700 dark:text-blue-300">
                  {exercises.length} Esercizi Disponibili
                </span>
              </div>
            </div>
            <div className="bg-green-50 dark:bg-green-900/20 p-3 rounded-lg">
              <div className="flex items-center gap-2">
                <User className="h-5 w-5 text-green-500" />
                <span className="text-sm font-medium text-green-700 dark:text-green-300">
                  Personalizzati per Te
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Premium Banner */}
      {!userProfile?.isPremium && (
        <div className="bg-gradient-to-r from-amber-500 to-yellow-600 text-white px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Crown className="h-6 w-6" />
              <div>
                <h3 className="font-semibold">Esercizi Premium Disponibili</h3>
                <p className="text-sm text-amber-100">Sblocca esercizi avanzati personalizzati per il tuo sport</p>
              </div>
            </div>
            <button
              onClick={() => navigate('/questionnaire/premium')}
              className="bg-white text-amber-600 px-4 py-2 rounded-lg font-medium hover:bg-amber-50 transition-colors flex items-center space-x-1"
            >
              <Sparkles className="h-4 w-4" />
              <span>Richiedi</span>
            </button>
          </div>
        </div>
      )}

      <div className="px-4 py-6">
        {/* Messaggio motivazionale */}
        <MotivationalMessage position="top" />
        
        {/* Filtri per categoria */}
        {categories.length > 0 && (
          <div className="mb-6">
            <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">Filtra per categoria</h3>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setSelectedCategory('all')}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                  selectedCategory === 'all'
                    ? 'bg-blue-500 text-white'
                    : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                }`}
              >
                Tutti ({exercises.length})
              </button>
              {categories.map(category => {
                const count = exercises.filter(ex => ex.category === category).length;
                return (
                  <button
                    key={category}
                    onClick={() => setSelectedCategory(category)}
                    className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                      selectedCategory === category
                        ? 'bg-blue-500 text-white'
                        : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                    }`}
                  >
                    {category} ({count})
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Lista esercizi */}
        <div className="space-y-4">
          {filteredExercises.length > 0 ? (
            filteredExercises.map((exercise) => (
              <div
                key={exercise.id}
                className="bg-white dark:bg-gray-800 rounded-lg shadow-sm hover:shadow-md transition-shadow cursor-pointer overflow-hidden border border-gray-200 dark:border-gray-700"
                onClick={() => navigate(`/exercises/${exercise.id}/practice`)}
              >
                <div className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-3">
                        <span className="text-sm font-medium text-blue-500 bg-blue-100 dark:bg-blue-900/20 dark:text-blue-400 px-3 py-1 rounded-full">
                          {exercise.category || 'Generale'}
                        </span>
                        {exercise.difficulty && (
                          <span className={`text-xs px-2 py-1 rounded-full ${getDifficultyColor(exercise.difficulty)}`}>
                            {exercise.difficulty}
                          </span>
                        )}
                        <span className="text-xs bg-purple-100 dark:bg-purple-900/20 text-purple-700 dark:text-purple-300 px-2 py-1 rounded-full">
                          {getElementsCount(exercise)} domande
                        </span>
                      </div>
                      
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                        {exercise.title}
                      </h3>
                      
                      <p className="text-gray-600 dark:text-gray-300 text-sm mb-4 line-clamp-2">
                        {exercise.description}
                      </p>
                      
                      <div className="flex items-center gap-4 text-sm text-gray-500 dark:text-gray-400">
                        <div className="flex items-center gap-1">
                          <Clock className="h-4 w-4" />
                          <span>{getEstimatedDuration(exercise)}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Target className="h-4 w-4" />
                          <span>Interattivo</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <CheckCircle className="h-4 w-4 text-green-500" />
                          <span>Pronto</span>
                        </div>
                      </div>
                    </div>
                    
                    <button className="ml-4 p-3 bg-blue-500 hover:bg-blue-600 text-white rounded-full transition-colors">
                      <Play className="h-5 w-5" />
                    </button>
                  </div>
                  
                  {/* Preview elementi */}
                  {exercise.elements && exercise.elements.length > 0 && (
                    <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-600">
                      <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Anteprima domande:
                      </h4>
                      <div className="space-y-1">
                        {exercise.elements.slice(0, 2).map((element, index) => (
                          <p key={index} className="text-xs text-gray-500 dark:text-gray-400 truncate">
                            {index + 1}. {element.title || 'Domanda senza titolo'}
                          </p>
                        ))}
                        {exercise.elements.length > 2 && (
                          <p className="text-xs text-gray-400 dark:text-gray-500">
                            ... e altre {exercise.elements.length - 2} domande
                          </p>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-12">
              <div className="text-gray-400 dark:text-gray-600 mb-4">
                <AlertCircle className="h-16 w-16 mx-auto opacity-50" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                Nessun esercizio trovato
              </h3>
              <p className="text-gray-500 dark:text-gray-400">
                {selectedCategory === 'all' 
                  ? 'Non ci sono esercizi interattivi disponibili al momento'
                  : `Non ci sono esercizi nella categoria "${selectedCategory}"`
                }
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ExercisesWorkspacePage;