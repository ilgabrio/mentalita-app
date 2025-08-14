import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Play, Book, Moon, Sun } from 'lucide-react';
import { db } from '../config/firebase';
import { doc, getDoc, collection, addDoc } from 'firebase/firestore';
import { useTheme } from '../context/ThemeContext';

const ExerciseDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isDarkMode, toggleDarkMode } = useTheme();
  const [exercise, setExercise] = useState(null);
  const [loading, setLoading] = useState(true);
  const [videoError, setVideoError] = useState(false);

  useEffect(() => {
    const fetchExercise = async () => {
      try {
        // Prova prima dalla collezione appVideos
        let docRef = doc(db, 'appVideos', id);
        let docSnap = await getDoc(docRef);
        
        if (!docSnap.exists()) {
          // Se non trovato, prova dalla collezione videos
          docRef = doc(db, 'videos', id);
          docSnap = await getDoc(docRef);
        }
        
        if (docSnap.exists()) {
          const data = { id: docSnap.id, ...docSnap.data() };
          setExercise(data);
        } else {
          // Dati mock per testing
          setExercise({
            id: id,
            title: "Il Diario degli Errori",
            description: "Trasforma ogni errore in una lezione che ti rende più forte",
            longDescription: "È tempo di abbracciare una verità liberatoria: l'errore che hai commesso ieri è irripetibile. Non potrai mai commettere esattamente lo stesso errore, perché ogni tentativo è unico, con condizioni fis...",
            youtubeUrl: "https://www.youtube.com/embed/VIDEO_ID",
            category: "Mentalità",
            readMoreText: "Leggi l'articolo completo"
          });
        }
      } catch (error) {
        console.error('Errore nel caricamento dell\'esercizio:', error);
        setExercise({
          id: id,
          title: "Il Diario degli Errori", 
          description: "Trasforma ogni errore in una lezione che ti rende più forte",
          longDescription: "È tempo di abbracciare una verità liberatoria: l'errore che hai commesso ieri è irripetibile. Non potrai mai commettere esattamente lo stesso errore, perché ogni tentativo è unico, con condizioni fis...",
          youtubeUrl: "https://www.youtube.com/embed/VIDEO_ID",
          category: "Mentalità",
          readMoreText: "Leggi l'articolo completo"
        });
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchExercise();
    }
  }, [id]);

  const handleStartExercise = async () => {
    try {
      // Registra l'inizio dell'esercizio
      await addDoc(collection(db, 'exerciseSessions'), {
        exerciseId: exercise.id,
        startTime: new Date(),
        userId: 'user_id', // Sostituire con l'ID utente reale
        createdAt: new Date()
      });
      
      navigate(`/exercises/${exercise.id}/practice`);
    } catch (error) {
      console.error('Errore nell\'avvio dell\'esercizio:', error);
      navigate(`/exercises/${exercise.id}/practice`);
    }
  };

  const getYouTubeEmbedUrl = (url) => {
    if (!url) return '';
    
    // Estrai l'ID del video da diversi formati di URL YouTube
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
    const match = url.match(regExp);
    
    if (match && match[2].length === 11) {
      return `https://www.youtube.com/embed/${match[2]}?rel=0&modestbranding=1&fs=1`;
    }
    return url;
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

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 shadow-sm">
        <div className="px-4 py-4 flex items-center justify-between">
          <div className="flex items-center">
            <button
              onClick={() => navigate('/exercises')}
              className="mr-4 p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            >
              <ArrowLeft className="h-6 w-6 text-gray-600 dark:text-gray-300" />
            </button>
            <img 
              src="/mentalita-app/logo.png" 
              alt="Mentalità Logo" 
              className="w-7 h-7 rounded-full mr-3"
            />
            <h1 className="text-xl font-semibold text-gray-900 dark:text-white">Esercizio</h1>
          </div>
          
          {/* Dark mode toggle */}
          <button
            onClick={toggleDarkMode}
            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            aria-label="Toggle dark mode"
          >
            {isDarkMode ? (
              <Sun className="h-5 w-5 text-gray-600 dark:text-gray-300" />
            ) : (
              <Moon className="h-5 w-5 text-gray-600 dark:text-gray-300" />
            )}
          </button>
        </div>
      </div>

      <div className="px-4 py-6 max-w-4xl mx-auto">
        {/* Titolo e descrizione */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
            #{exercise.category || 'II'} {exercise.title}
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-300 mb-6">
            {exercise.description}
          </p>
          
          {/* Bottone VAI ALL'ESERCIZIO */}
          <button
            onClick={handleStartExercise}
            className="inline-flex items-center px-8 py-3 bg-green-500 hover:bg-green-600 text-white font-semibold rounded-full transition-colors duration-200 mb-8"
          >
            <Play className="h-5 w-5 mr-2" />
            VAI ALL'ESERCIZIO
          </button>
        </div>

        {/* Video YouTube */}
        <div className="mb-8">
          <div className="relative w-full bg-black rounded-lg overflow-hidden shadow-lg">
            <div className="aspect-video">
              {!videoError && exercise.youtubeUrl ? (
                <iframe
                  src={getYouTubeEmbedUrl(exercise.youtubeUrl)}
                  className="w-full h-full"
                  frameBorder="0"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                  onError={() => setVideoError(true)}
                  title={exercise.title}
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-gray-800">
                  <div className="text-center text-white">
                    <Play className="h-16 w-16 mx-auto mb-4 opacity-50" />
                    <p className="text-lg">Video non disponibile</p>
                    <p className="text-sm opacity-75">{exercise.title}</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Sezione contenuto aggiuntivo */}
        {exercise.longDescription && (
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm border-l-4 border-blue-500 mb-8">
            <div className="flex items-start mb-4">
              <Book className="h-6 w-6 text-blue-500 mr-3 mt-1 flex-shrink-0" />
              <div>
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">
                  L'unicità dell'errore
                </h3>
                <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
                  {exercise.longDescription}
                </p>
                
                {exercise.readMoreText && (
                  <button 
                    className="mt-4 text-blue-500 hover:text-blue-600 font-medium"
                    onClick={() => {/* Implementa navigazione all'articolo completo */}}
                  >
                    {exercise.readMoreText} →
                  </button>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Bottone finale VAI ALL'ESERCIZIO */}
        <div className="text-center">
          <button
            onClick={handleStartExercise}
            className="inline-flex items-center px-12 py-4 bg-blue-500 hover:bg-blue-600 text-white font-semibold rounded-full transition-colors duration-200 text-lg"
          >
            <Play className="h-6 w-6 mr-3" />
            VAI ALL'ESERCIZIO
          </button>
        </div>
      </div>
    </div>
  );
};

export default ExerciseDetail;