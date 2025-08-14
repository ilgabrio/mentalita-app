import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Save, CheckCircle, AlertCircle } from 'lucide-react';
import { db } from '../config/firebase';
import { doc, getDoc, collection, addDoc } from 'firebase/firestore';
import { useAuth } from '../context/AuthContext';

const ExercisePracticePage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [exercise, setExercise] = useState(null);
  const [loading, setLoading] = useState(true);
  const [answers, setAnswers] = useState({});
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

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
      
      // Salva le risposte in Firestore
      await addDoc(collection(db, 'exerciseResponses'), {
        exerciseId: id,
        userId: user?.uid || 'anonymous',
        userEmail: user?.email || 'anonymous',
        answers: answers,
        completedAt: new Date(),
        exerciseTitle: exercise?.title || 'Unknown Exercise'
      });

      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
      
      console.log('✅ Risposte salvate:', answers);
    } catch (error) {
      console.error('Errore nel salvataggio:', error);
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
            onClick={() => navigate('/exercises')}
            className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
          >
            Torna agli esercizi
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
              onClick={() => navigate(`/exercises/${id}`)}
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
              onClick={() => navigate(`/exercises/${id}`)}
              className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
            >
              Torna al Dettaglio
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default ExercisePracticePage;