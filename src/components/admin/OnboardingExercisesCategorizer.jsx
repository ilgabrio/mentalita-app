import React, { useState, useEffect } from 'react';
import { 
  collection, 
  getDocs, 
  doc, 
  getDoc, 
  updateDoc, 
  query, 
  where 
} from 'firebase/firestore';
import { db } from '../../config/firebase';
import { Tag, Check, X, Play } from 'lucide-react';

const OnboardingExercisesCategorizer = () => {
  const [onboardingSettings, setOnboardingSettings] = useState(null);
  const [exercises, setExercises] = useState([]);
  const [onboardingExerciseIds, setOnboardingExerciseIds] = useState(new Set());
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      
      // Fetch onboarding settings
      const settingsDoc = await getDoc(doc(db, 'onboardingSettings', 'default'));
      if (settingsDoc.exists()) {
        const settings = settingsDoc.data();
        setOnboardingSettings(settings);
        
        // Collect all exercise IDs from onboarding days
        const exerciseIds = new Set();
        settings.days?.forEach(day => {
          day.exercises?.forEach(id => exerciseIds.add(id));
        });
        setOnboardingExerciseIds(exerciseIds);
        console.log('Onboarding exercise IDs:', Array.from(exerciseIds));
      }
      
      // Fetch all exercises
      const exercisesSnapshot = await getDocs(collection(db, 'exercises'));
      const exercisesData = exercisesSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setExercises(exercisesData);
      
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateExerciseCategory = async (exerciseId, newCategory) => {
    try {
      setUpdating(true);
      await updateDoc(doc(db, 'exercises', exerciseId), {
        category: newCategory
      });
      
      // Update local state
      setExercises(exercises.map(ex => 
        ex.id === exerciseId ? { ...ex, category: newCategory } : ex
      ));
      
      console.log(`Updated exercise ${exerciseId} category to ${newCategory}`);
    } catch (error) {
      console.error('Error updating exercise:', error);
      alert('Errore nell\'aggiornamento della categoria');
    } finally {
      setUpdating(false);
    }
  };

  const categorizeAllOnboardingExercises = async () => {
    if (!confirm('Vuoi spostare tutti gli esercizi di onboarding nella categoria "onboarding"?')) {
      return;
    }
    
    try {
      setUpdating(true);
      const promises = [];
      
      for (const exerciseId of onboardingExerciseIds) {
        promises.push(
          updateDoc(doc(db, 'exercises', exerciseId), {
            category: 'onboarding'
          })
        );
      }
      
      await Promise.all(promises);
      
      // Update local state
      setExercises(exercises.map(ex => 
        onboardingExerciseIds.has(ex.id) ? { ...ex, category: 'onboarding' } : ex
      ));
      
      alert(`Aggiornati ${onboardingExerciseIds.size} esercizi nella categoria onboarding`);
    } catch (error) {
      console.error('Error batch updating exercises:', error);
      alert('Errore nell\'aggiornamento batch');
    } finally {
      setUpdating(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  const onboardingExercises = exercises.filter(ex => onboardingExerciseIds.has(ex.id));
  const otherExercises = exercises.filter(ex => !onboardingExerciseIds.has(ex.id));

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            Categorizzazione Esercizi Onboarding
          </h2>
          <p className="text-gray-600 dark:text-gray-400">
            Gestisci le categorie degli esercizi usati nell'onboarding
          </p>
        </div>
        
        <button
          onClick={categorizeAllOnboardingExercises}
          disabled={updating}
          className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 flex items-center gap-2"
        >
          <Tag className="h-4 w-4" />
          Categorizza Tutti come "onboarding"
        </button>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Statistiche
        </h3>
        <div className="grid grid-cols-3 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">{onboardingExercises.length}</div>
            <div className="text-sm text-gray-600">Esercizi Onboarding</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">
              {onboardingExercises.filter(ex => ex.category === 'onboarding').length}
            </div>
            <div className="text-sm text-gray-600">Già Categorizzati</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-red-600">
              {onboardingExercises.filter(ex => ex.category !== 'onboarding').length}
            </div>
            <div className="text-sm text-gray-600">Da Categorizzare</div>
          </div>
        </div>
      </div>

      {/* Esercizi di Onboarding */}
      <div className="bg-white dark:bg-gray-800 rounded-lg">
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Esercizi usati nell'Onboarding ({onboardingExercises.length})
          </h3>
        </div>
        
        <div className="divide-y divide-gray-200 dark:divide-gray-700">
          {onboardingExercises.map(exercise => (
            <div key={exercise.id} className="p-4 flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <Play className="h-5 w-5 text-blue-500" />
                <div>
                  <h4 className="font-medium text-gray-900 dark:text-white">
                    {exercise.title}
                  </h4>
                  <div className="flex items-center space-x-2 mt-1">
                    <span className={`text-xs px-2 py-1 rounded ${
                      exercise.category === 'onboarding' 
                        ? 'bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400'
                        : 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/20 dark:text-yellow-400'
                    }`}>
                      {exercise.category || 'Nessuna categoria'}
                    </span>
                    {exercise.category === 'onboarding' ? (
                      <Check className="h-4 w-4 text-green-500" />
                    ) : (
                      <X className="h-4 w-4 text-red-500" />
                    )}
                  </div>
                </div>
              </div>
              
              {exercise.category !== 'onboarding' && (
                <button
                  onClick={() => updateExerciseCategory(exercise.id, 'onboarding')}
                  disabled={updating}
                  className="px-3 py-1 bg-blue-500 text-white text-sm rounded hover:bg-blue-600 disabled:opacity-50"
                >
                  Sposta a Onboarding
                </button>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Altri Esercizi (per debug) */}
      <div className="bg-white dark:bg-gray-800 rounded-lg">
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Altri Esercizi ({otherExercises.length})
          </h3>
        </div>
        
        <div className="max-h-64 overflow-y-auto">
          <div className="divide-y divide-gray-200 dark:divide-gray-700">
            {otherExercises.slice(0, 10).map(exercise => (
              <div key={exercise.id} className="p-3 flex items-center justify-between">
                <div>
                  <h5 className="text-sm font-medium text-gray-900 dark:text-white">
                    {exercise.title}
                  </h5>
                  <span className="text-xs text-gray-500">
                    {exercise.category || 'Nessuna categoria'}
                  </span>
                </div>
              </div>
            ))}
            {otherExercises.length > 10 && (
              <div className="p-3 text-center text-sm text-gray-500">
                ... e altri {otherExercises.length - 10} esercizi
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default OnboardingExercisesCategorizer;