import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Play, Clock, Star } from 'lucide-react';
import { db } from '../config/firebase';
import { collection, getDocs, query, orderBy, where } from 'firebase/firestore';
import { useAuth } from '../context/AuthContext';
import MotivationalMessage from '../components/MotivationalMessage';
import PremiumCTA from '../components/premium/PremiumCTA';

const ExercisesPage = () => {
  const { userProfile, isAdmin } = useAuth();
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
          // E NON è un esercizio di onboarding
          return ex.title && 
                 ex.description && 
                 ex.elements && 
                 Array.isArray(ex.elements) && 
                 !ex.isOnboarding;  // Esclude esercizi di onboarding
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
        
        // Se ancora pochi risultati, proviamo senza il filtro elements ma tenendo il filtro onboarding
        if (exercisesData.length < 5) {
          console.log('⚠️ Pochi esercizi trovati, mostro tutti quelli non-onboarding per debug...');
          // Filtriamo manualmente gli esercizi validi (che hanno almeno title e description) ma NON onboarding
          exercisesData = allExercises.filter(ex => ex.title && ex.description && !ex.isOnboarding);
          console.log('✅ Esercizi validi (non-onboarding):', exercisesData.length);
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

        {/* Premium CTA - Inserito ogni 6 esercizi per utenti non premium */}
        {!isAdmin && !userProfile?.isPremium && filteredExercises.length > 6 && (
          <PremiumCTA variant="banner" className="mb-8" />
        )}
        
        {/* Exercises Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredExercises.length > 0 ? (
            filteredExercises.map((exercise, index) => (
              <React.Fragment key={exercise.id}>
                
                <div
                  className="bg-white dark:bg-gray-800 rounded-xl shadow-lg overflow-hidden transition-all duration-300 transform hover:scale-105 cursor-pointer"
                  onClick={() => navigate(`/exercises/${exercise.id}`)}
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
                    
                    {/* Difficulty Badge */}
                    {exercise.difficulty && (
                      <div className="absolute top-4 right-4">
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
                    <button className="w-full py-4 rounded-xl font-bold text-lg transition-all duration-300 flex items-center justify-center gap-3 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white shadow-lg">
                      <Play className="h-6 w-6" />
                      Inizia Esercizio
                    </button>
                  </div>
                </div>
              </React.Fragment>
            ))
          ) : (
            <div className="col-span-full text-center py-12">
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