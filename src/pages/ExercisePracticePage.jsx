import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Save, CheckCircle, AlertCircle, Music } from 'lucide-react';
import { db } from '../config/firebase';
import { doc, getDoc, collection, addDoc, setDoc, getDocs, query, where } from 'firebase/firestore';
import { useAuth } from '../context/AuthContext';

const ExercisePracticePage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const [exercise, setExercise] = useState(null);
  const [loading, setLoading] = useState(true);
  const [answers, setAnswers] = useState({});
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [availableAudios, setAvailableAudios] = useState([]);
  
  // Check if coming from onboarding
  const urlParams = new URLSearchParams(window.location.search);
  const fromOnboarding = urlParams.get('from') === 'onboarding';
  const onboardingDay = urlParams.get('day') || urlParams.get('step'); // Support both day and step for backward compatibility

  const fetchAvailableAudios = async () => {
    try {
      const audiosQuery = collection(db, 'audioContent');
      const snapshot = await getDocs(audiosQuery);
      const audiosData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setAvailableAudios(audiosData);
    } catch (error) {
      console.error('Error loading audios:', error);
    }
  };

  useEffect(() => {
    const fetchExercise = async () => {
      try {
        console.log('🔍 Caricamento esercizio per pratica con ID:', id);
        
        const docRef = doc(db, 'exercises', id);
        const docSnap = await getDoc(docRef);
        
        if (docSnap.exists()) {
          const data = { id: docSnap.id, ...docSnap.data() };
          console.log('✅ Esercizio trovato:', data);
          console.log('📋 Elements:', data.elements);
          setExercise(data);
          
          // Inizializza answers con valori vuoti per ogni elemento
          if (data.elements && Array.isArray(data.elements)) {
            console.log('🎯 Inizializzazione elementi:', data.elements);
            const initialAnswers = {};
            data.elements.forEach((element, index) => {
              console.log(`📋 Elemento ${index}:`, element);
              if (element.id) {
                initialAnswers[element.id] = '';
                console.log(`✅ Aggiunto elemento ${element.id} alle risposte`);
              } else {
                console.log(`⚠️ Elemento ${index} senza ID:`, element);
              }
            });
            console.log('📝 Risposte iniziali:', initialAnswers);
            setAnswers(initialAnswers);
          }
        } else {
          console.log('❌ Esercizio non trovato con ID:', id);
        }
      } catch (error) {
        console.error('Errore nel caricamento dell\'esercizio:', error);
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchExercise();
      fetchAvailableAudios();
    }
  }, [id]);

  const handleAnswerChange = (elementId, value) => {
    console.log('🔄 Cambiamento risposta:', { elementId, value });
    setAnswers(prev => {
      const newAnswers = {
        ...prev,
        [elementId]: value
      };
      console.log('📝 Nuove risposte:', newAnswers);
      return newAnswers;
    });
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      
      console.log('🔍 DEBUG SALVATAGGIO:', {
        currentUser: currentUser,
        userId: currentUser?.uid,
        userEmail: currentUser?.email,
        isAuthenticated: !!currentUser?.uid,
        exerciseId: id,
        answers: answers
      });
      
      // Verifica che l'utente sia autenticato
      if (!currentUser?.uid) {
        console.error('❌ Utente non autenticato - impossibile salvare');
        alert('Devi essere autenticato per salvare le risposte. Effettua il login e riprova.');
        return;
      }
      
      console.log('✅ Utente autenticato, tentativo di salvataggio...');
      
      // Dati da salvare
      const dataToSave = {
        exerciseId: id,
        userId: currentUser.uid,
        userEmail: currentUser.email || '',
        answers: answers,
        completedAt: new Date(),
        exerciseTitle: exercise?.title || 'Unknown Exercise'
      };
      
      console.log('📝 Dati da salvare:', dataToSave);
      
      // Salva le risposte in Firestore
      const docRef = await addDoc(collection(db, 'exerciseResponses'), dataToSave);
      
      console.log('✅ Documento creato con ID:', docRef.id);

      // If coming from onboarding, also update onboarding progress
      if (fromOnboarding && onboardingDay !== null) {
        try {
          const dayNumber = parseInt(onboardingDay);
          const userProgressRef = doc(db, 'userOnboardingProgress', currentUser.uid);
          
          // Get current progress
          const progressDoc = await getDoc(userProgressRef);
          let currentProgress = { completedDays: [] };
          
          if (progressDoc.exists()) {
            currentProgress = progressDoc.data();
          }
          
          // Add completed day if not already there
          const completedDays = currentProgress.completedDays || [];
          if (!completedDays.includes(dayNumber)) {
            completedDays.push(dayNumber);
            completedDays.sort((a, b) => a - b); // Keep sorted
            
            // Update progress document
            await setDoc(userProgressRef, {
              ...currentProgress,
              completedDays,
              lastCompletedAt: new Date(),
              userId: currentUser.uid
            });
            
            console.log(`🎯 Updated onboarding progress: step ${dayNumber} completed, total steps: ${completedDays.length}`);
          }
        } catch (error) {
          console.error('❌ Error updating onboarding progress:', error);
        }
      }

      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
      
      // If coming from onboarding, redirect back with completion status
      if (fromOnboarding && onboardingDay !== null) {
        setTimeout(() => {
          navigate(`/onboarding?completed=true&day=${onboardingDay}`);
        }, 1500);
      } else {
        // For regular exercises, redirect to exercises page after a short delay
        setTimeout(() => {
          navigate('/exercises');
        }, 2000);
      }
      
      console.log('✅ Risposte salvate con successo!');
    } catch (error) {
      console.error('❌ Errore nel salvataggio:', error);
      console.error('❌ Dettagli errore:', {
        code: error.code,
        message: error.message,
        details: error.details
      });
      alert('Errore nel salvataggio delle risposte: ' + error.message);
    } finally {
      setSaving(false);
    }
  };

  const renderElement = (element, index) => {
    if (!element) return null;

    const { id: elementId, type, title, description, options } = element;
    const value = answers[elementId] || '';

    switch (type) {
      case 'text':
        return (
          <div key={elementId || index} className="mb-8">
            <label className="block text-lg font-semibold text-gray-900 dark:text-white mb-3">
              {title || `Domanda ${index + 1}`}
            </label>
            {description && (
              <p className="text-gray-600 dark:text-gray-300 mb-4 text-sm">
                {description}
              </p>
            )}
            <textarea
              value={value}
              onChange={(e) => handleAnswerChange(elementId, e.target.value)}
              placeholder="Scrivi la tua risposta qui..."
              className="w-full p-4 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white resize-none"
              rows={4}
            />
          </div>
        );

      case 'textarea':
        return (
          <div key={elementId || index} className="mb-8">
            <label className="block text-lg font-semibold text-gray-900 dark:text-white mb-3">
              {title || `Domanda ${index + 1}`}
            </label>
            {description && (
              <p className="text-gray-600 dark:text-gray-300 mb-4 text-sm">
                {description}
              </p>
            )}
            <textarea
              value={value}
              onChange={(e) => handleAnswerChange(elementId, e.target.value)}
              placeholder="Scrivi la tua risposta qui..."
              className="w-full p-4 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white resize-none"
              rows={6}
            />
          </div>
        );

      case 'select':
        return (
          <div key={elementId || index} className="mb-8">
            <label className="block text-lg font-semibold text-gray-900 dark:text-white mb-3">
              {title || `Domanda ${index + 1}`}
            </label>
            {description && (
              <p className="text-gray-600 dark:text-gray-300 mb-4 text-sm">
                {description}
              </p>
            )}
            <select
              value={value}
              onChange={(e) => handleAnswerChange(elementId, e.target.value)}
              className="w-full p-4 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
            >
              <option value="">Seleziona una risposta...</option>
              {options && Array.isArray(options) && options.map((option, optIndex) => (
                <option key={optIndex} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </div>
        );

      case 'radio':
        return (
          <div key={elementId || index} className="mb-8">
            <label className="block text-lg font-semibold text-gray-900 dark:text-white mb-3">
              {title || `Domanda ${index + 1}`}
            </label>
            {description && (
              <p className="text-gray-600 dark:text-gray-300 mb-4 text-sm">
                {description}
              </p>
            )}
            <div className="space-y-3">
              {options && Array.isArray(options) && options.map((option, optIndex) => (
                <label key={optIndex} className="flex items-center cursor-pointer">
                  <input
                    type="radio"
                    name={elementId}
                    value={option}
                    checked={value === option}
                    onChange={(e) => handleAnswerChange(elementId, e.target.value)}
                    className="mr-3 text-blue-500 focus:ring-blue-500"
                  />
                  <span className="text-gray-700 dark:text-gray-300">{option}</span>
                </label>
              ))}
            </div>
          </div>
        );

      case 'audio':
        const selectedAudio = availableAudios.find(audio => audio.id === element.audioId);
        console.log('🎵 Audio Debug:', { 
          elementAudioId: element.audioId, 
          availableAudiosCount: availableAudios.length,
          availableAudioIds: availableAudios.map(a => a.id),
          selectedAudio: selectedAudio ? {
            title: selectedAudio.title,
            audioUrl: selectedAudio.audioUrl,
            hasAudioUrl: !!selectedAudio.audioUrl
          } : 'NOT_FOUND',
          fullSelectedAudio: selectedAudio,
          allAudiosStructure: availableAudios.map(a => ({
            id: a.id,
            title: a.title,
            hasAudioUrl: !!a.audioUrl,
            audioUrl: a.audioUrl?.substring(0, 50) + '...' // mostra primi 50 caratteri
          }))
        });
        return (
          <div key={elementId || index} className="mb-8">
            <label className="block text-lg font-semibold text-gray-900 dark:text-white mb-3">
              {title || `Audio ${index + 1}`}
            </label>
            {description && (
              <p className="text-gray-600 dark:text-gray-300 mb-4 text-sm">
                {description}
              </p>
            )}
            {selectedAudio ? (
              <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-6">
                <div className="flex items-center gap-3 mb-4">
                  <Music className="h-6 w-6 text-blue-500" />
                  <div>
                    <h4 className="font-medium text-gray-900 dark:text-white">{selectedAudio.title}</h4>
                    {selectedAudio.duration && (
                      <p className="text-sm text-gray-500 dark:text-gray-400">Durata: {selectedAudio.duration}</p>
                    )}
                    {selectedAudio.category && (
                      <p className="text-sm text-blue-600 dark:text-blue-400">{selectedAudio.category}</p>
                    )}
                  </div>
                </div>
                {(() => {
                  // Cerca l'URL audio in vari campi possibili
                  const audioUrl = selectedAudio.audioUrl || 
                                   selectedAudio.url || 
                                   selectedAudio.fileUrl || 
                                   selectedAudio.audioFile || 
                                   selectedAudio.file || 
                                   selectedAudio.src ||
                                   selectedAudio.audioSrc;
                  
                  console.log('🔍 Audio URL Search:', {
                    audioUrl: audioUrl,
                    allFields: Object.keys(selectedAudio),
                    fieldValues: {
                      audioUrl: selectedAudio.audioUrl,
                      url: selectedAudio.url,
                      fileUrl: selectedAudio.fileUrl,
                      audioFile: selectedAudio.audioFile,
                      file: selectedAudio.file,
                      src: selectedAudio.src,
                      audioSrc: selectedAudio.audioSrc
                    }
                  });
                  
                  return audioUrl ? (
                    <audio controls className="w-full">
                      <source src={audioUrl} type="audio/mpeg" />
                      <source src={audioUrl} type="audio/wav" />
                      <source src={audioUrl} type="audio/ogg" />
                      Il tuo browser non supporta l'elemento audio.
                    </audio>
                  ) : (
                    <div className="text-center py-6 text-gray-500 dark:text-gray-400">
                      <Music className="h-8 w-8 mx-auto mb-2" />
                      <p>URL audio non disponibile</p>
                      <p className="text-xs mt-2">Campi disponibili: {Object.keys(selectedAudio).join(', ')}</p>
                    </div>
                  );
                })()}
                {selectedAudio.description && (
                  <p className="text-sm text-gray-600 dark:text-gray-300 mt-3">
                    {selectedAudio.description}
                  </p>
                )}
              </div>
            ) : (
              <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-6 text-center">
                <Music className="h-8 w-8 mx-auto mb-2 text-gray-400" />
                <p className="text-gray-500 dark:text-gray-400">Audio non trovato</p>
              </div>
            )}
          </div>
        );

      default:
        return (
          <div key={elementId || index} className="mb-8">
            <label className="block text-lg font-semibold text-gray-900 dark:text-white mb-3">
              {title || `Domanda ${index + 1}`}
            </label>
            {description && (
              <p className="text-gray-600 dark:text-gray-300 mb-4 text-sm">
                {description}
              </p>
            )}
            <input
              type="text"
              value={value}
              onChange={(e) => handleAnswerChange(elementId, e.target.value)}
              placeholder="Scrivi la tua risposta qui..."
              className="w-full p-4 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
            />
          </div>
        );
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (!exercise) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Esercizio non trovato</h2>
          <button
            onClick={() => navigate(fromOnboarding ? '/onboarding' : '/exercises')}
            className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
          >
            {fromOnboarding ? 'Torna al Percorso' : 'Torna agli esercizi'}
          </button>
        </div>
      </div>
    );
  }

  const hasElements = exercise.elements && Array.isArray(exercise.elements) && exercise.elements.length > 0;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 shadow-sm">
        <div className="px-4 py-4 flex items-center justify-between">
          <div className="flex items-center">
            <button
              onClick={() => navigate(fromOnboarding ? '/onboarding' : `/exercises/${id}`)}
              className="mr-4 p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            >
              <ArrowLeft className="h-6 w-6 text-gray-600 dark:text-gray-300" />
            </button>
            <h1 className="text-xl font-semibold text-gray-900 dark:text-white">Pratica Esercizio</h1>
          </div>
          
          {hasElements && (
            <button
              onClick={handleSave}
              disabled={saving}
              className={`flex items-center px-4 py-2 rounded-lg transition-colors ${
                saved 
                  ? 'bg-green-500 text-white' 
                  : saving
                  ? 'bg-gray-400 text-white cursor-not-allowed'
                  : 'bg-blue-500 hover:bg-blue-600 text-white'
              }`}
            >
              {saved ? (
                <>
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Salvato!
                </>
              ) : saving ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Salvataggio...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Salva Risposte
                </>
              )}
            </button>
          )}
        </div>
      </div>

      <div className="px-4 py-6 max-w-4xl mx-auto">
        {/* Titolo e descrizione */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
            {exercise.title}
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-300 mb-6">
            {exercise.description}
          </p>
        </div>

        {/* Form degli elementi */}
        {hasElements ? (
          <div className="bg-white dark:bg-gray-800 rounded-lg p-8 shadow-sm">
            <form onSubmit={(e) => e.preventDefault()}>
              {exercise.elements.map((element, index) => renderElement(element, index))}
              
              {/* Pulsante di salvataggio finale */}
              <div className="text-center pt-6 border-t border-gray-200 dark:border-gray-600">
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className={`px-8 py-3 rounded-lg font-semibold transition-colors ${
                    saved 
                      ? 'bg-green-500 text-white' 
                      : saving
                      ? 'bg-gray-400 text-white cursor-not-allowed'
                      : 'bg-blue-500 hover:bg-blue-600 text-white'
                  }`}
                >
                  {saved ? (
                    <>
                      <CheckCircle className="h-5 w-5 mr-2 inline" />
                      Risposte Salvate!
                    </>
                  ) : saving ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2 inline-block"></div>
                      Salvataggio in corso...
                    </>
                  ) : (
                    <>
                      <Save className="h-5 w-5 mr-2 inline" />
                      Completa Esercizio
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        ) : (
          <div className="text-center py-12">
            <AlertCircle className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
              Nessun elemento trovato
            </h3>
            <p className="text-gray-500 dark:text-gray-400 mb-6">
              Questo esercizio non ha elementi configurati per la pratica.
            </p>
            <button
              onClick={() => navigate(fromOnboarding ? '/onboarding' : `/exercises/${id}`)}
              className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
            >
              {fromOnboarding ? 'Torna al Percorso' : 'Torna al Dettaglio'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default ExercisePracticePage;