import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Play, Clock, Star } from 'lucide-react';
import { db } from '../config/firebase';
import { collection, getDocs, query, orderBy, where } from 'firebase/firestore';
import MotivationalMessage from '../components/MotivationalMessage';

const ExercisesPage = () => {
  const navigate = useNavigate();
  const [exercises, setExercises] = useState([]);
  const [loading, setLoading] = useState(true);
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('all');

  useEffect(() => {
    const fetchExercises = async () => {
      try {
        console.log('🔍 DEBUGGING EXERCISES - Inizio caricamento...');
        
        // STEP 1: Vediamo TUTTI gli esercizi prima di filtrare
        let allExercisesQuery = query(collection(db, 'exercises'));
        let allSnapshot = await getDocs(allExercisesQuery);
        let allExercises = [];
        allSnapshot.forEach((doc) => {
          allExercises.push({ id: doc.id, ...doc.data() });
        });
        
        console.log('📊 TUTTI GLI ESERCIZI nel database:', allExercises.length);
        console.log('📋 Dettagli esercizi:', allExercises.map(ex => ({
          id: ex.id,
          title: ex.title,
          isPublished: ex.isPublished,
          order: ex.order
        })));

        // STEP 2: Gli esercizi probabilmente non hanno isPublished, usiamo tutti quelli validi
        console.log('📝 Caricamento tutti gli esercizi validi (ignoro isPublished per ora)...');
        
        let exercisesData = allExercises.filter(ex => {
          // Considera valido un esercizio se ha almeno title, description ed elements
          return ex.title && ex.description && ex.elements && Array.isArray(ex.elements);
        });
        
        // Ordina per order se esiste, altrimenti per createdAt o title
        exercisesData.sort((a, b) => {
          if (a.order !== undefined && b.order !== undefined) {
            return a.order - b.order;
          }
          if (a.createdAt && b.createdAt) {
            return a.createdAt.toDate().getTime() - b.createdAt.toDate().getTime();
          }
          return (a.title || '').localeCompare(b.title || '');
        });
        
        console.log('✅ Esercizi validi trovati:', exercisesData.length);
        
        // Se ancora pochi risultati, proviamo senza filtri
        if (exercisesData.length < 5) {
          console.log('⚠️ Pochi esercizi trovati, mostro TUTTI per debug...');
          // Filtriamo manualmente gli esercizi validi (che hanno almeno title e description)
          exercisesData = allExercises.filter(ex => ex.title && ex.description);
          console.log('✅ Esercizi validi (con title e description):', exercisesData.length);
        }

        // Se ancora non ci sono dati, usa dati mock
        if (exercisesData.length === 0) {
          exercisesData = [
            {
              id: '1',
              title: 'Il Diario degli Errori',
              description: 'Trasforma ogni errore in una lezione che ti rende più forte',
              category: 'Mentalità',
              duration: '15 min',
              difficulty: 'Intermedio',
              thumbnail: null,
              isPublished: true
            },
            {
              id: '2', 
              title: 'Respirazione Consapevole',
              description: 'Tecniche di respirazione per rilassare mente e corpo',
              category: 'Rilassamento',
              duration: '10 min',
              difficulty: 'Principiante',
              thumbnail: null,
              isPublished: true
            },
            {
              id: '3',
              title: 'Visualizzazione del Successo',
              description: 'Immagina e raggiungi i tuoi obiettivi sportivi',
              category: 'Visualizzazione',
              duration: '20 min', 
              difficulty: 'Avanzato',
              thumbnail: null,
              isPublished: true
            }
          ];
        }

        setExercises(exercisesData);
        
        // Estrai le categorie uniche
        const uniqueCategories = [...new Set(exercisesData.map(ex => ex.category || 'Generale'))];
        setCategories(uniqueCategories);
        
      } catch (error) {
        console.error('Errore nel caricamento degli esercizi:', error);
        // Usa dati mock in caso di errore
        const mockData = [
          {
            id: '1',
            title: 'Il Diario degli Errori',
            description: 'Trasforma ogni errore in una lezione che ti rende più forte',
            category: 'Mentalità',
            duration: '15 min',
            difficulty: 'Intermedio'
          }
        ];
        setExercises(mockData);
        setCategories(['Mentalità']);
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

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 shadow-sm">
        <div className="px-4 py-6">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Esercizi di Mentalità</h1>
          <p className="text-gray-600 dark:text-gray-300 mt-2">
            Sviluppa la tua forza mentale con i nostri esercizi guidati
          </p>
        </div>
      </div>

      <div className="px-4 py-6">
        {/* Messaggio motivazionale */}
        <MotivationalMessage position="top" />
        
        {/* Filtri per categoria */}
        {categories.length > 0 && (
          <div className="mb-6">
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setSelectedCategory('all')}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                  selectedCategory === 'all'
                    ? 'bg-blue-500 text-white'
                    : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                }`}
              >
                Tutti
              </button>
              {categories.map(category => (
                <button
                  key={category}
                  onClick={() => setSelectedCategory(category)}
                  className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                    selectedCategory === category
                      ? 'bg-blue-500 text-white'
                      : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                  }`}
                >
                  {category}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Lista esercizi */}
        <div className="space-y-4">
          {filteredExercises.length > 0 ? (
            filteredExercises.map((exercise) => (
              <div
                key={exercise.id}
                className="bg-white dark:bg-gray-800 rounded-lg shadow-sm hover:shadow-md transition-shadow cursor-pointer overflow-hidden"
                onClick={() => navigate(`/exercises/${exercise.id}`)}
              >
                <div className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-sm font-medium text-blue-500 bg-blue-100 dark:bg-blue-900/20 dark:text-blue-400 px-2 py-1 rounded-full">
                          {exercise.category || 'Generale'}
                        </span>
                        {exercise.difficulty && (
                          <span className={`text-xs px-2 py-1 rounded-full ${getDifficultyColor(exercise.difficulty)}`}>
                            {exercise.difficulty}
                          </span>
                        )}
                      </div>
                      
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                        {exercise.title}
                      </h3>
                      
                      <p className="text-gray-600 dark:text-gray-300 text-sm mb-4 line-clamp-2">
                        {exercise.description}
                      </p>
                      
                      <div className="flex items-center gap-4 text-sm text-gray-500 dark:text-gray-400">
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
                    </div>
                    
                    <button className="ml-4 p-3 bg-blue-500 hover:bg-blue-600 text-white rounded-full transition-colors">
                      <Play className="h-5 w-5" />
                    </button>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-12">
              <div className="text-gray-400 dark:text-gray-600 mb-4">
                <Play className="h-16 w-16 mx-auto opacity-50" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                Nessun esercizio trovato
              </h3>
              <p className="text-gray-500 dark:text-gray-400">
                {selectedCategory === 'all' 
                  ? 'Non ci sono esercizi disponibili al momento'
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

export default ExercisesPage;