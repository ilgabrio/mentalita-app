import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { doc, getDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../config/firebase';
import { 
  ArrowRight,
  ArrowLeft, 
  Brain,
  FileText,
  Play,
  ChevronRight
} from 'lucide-react';

const ExerciseIntroPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [exercise, setExercise] = useState(null);
  const [loading, setLoading] = useState(true);
  const [exerciseVideos, setExerciseVideos] = useState([]);
  const [exerciseArticles, setExerciseArticles] = useState([]);

  useEffect(() => {
    fetchExerciseData();
  }, [id]);

  const fetchExerciseData = async () => {
    try {
      setLoading(true);
      
      // Fetch exercise
      const exerciseDoc = await getDoc(doc(db, 'exercises', id));
      if (!exerciseDoc.exists()) {
        console.error('Exercise not found');
        navigate('/onboarding-exercises');
        return;
      }
      
      const exerciseData = { id: exerciseDoc.id, ...exerciseDoc.data() };
      setExercise(exerciseData);

      // Fetch associated videos se presenti
      if (exerciseData.selectedVideos && exerciseData.selectedVideos.length > 0) {
        console.log('🎥 Caricamento video associati:', exerciseData.selectedVideos);
        await fetchAssociatedVideos(exerciseData.selectedVideos);
      } else {
        console.log('❌ Nessun video associato trovato per questo esercizio');
      }

      // Fetch associated articles se presenti
      if (exerciseData.selectedArticles && exerciseData.selectedArticles.length > 0) {
        console.log('📄 Caricamento articoli associati:', exerciseData.selectedArticles);
        await fetchAssociatedArticles(exerciseData.selectedArticles);
      }

    } catch (error) {
      console.error('Error fetching exercise data:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchAssociatedVideos = async (videoIds) => {
    try {
      if (!videoIds || videoIds.length === 0) return;
      
      console.log('🎥 Caricamento video associati:', videoIds);
      
      const videosPromises = videoIds.map(async (videoId) => {
        try {
          // Assicuriamoci che videoId sia una stringa
          const videoIdString = String(videoId);
          
          // Prima prova nella raccolta videos (principale)
          const videoDoc = await getDoc(doc(db, 'videos', videoIdString));
          if (videoDoc.exists()) {
            const videoData = { id: videoDoc.id, ...videoDoc.data() };
            console.log('✅ Video caricato:', videoData.title);
            return videoData;
          }

          // Fallback: prova in appVideos (raccolta legacy)
          const appVideoDoc = await getDoc(doc(db, 'appVideos', videoIdString));
          if (appVideoDoc.exists()) {
            const videoData = { id: appVideoDoc.id, ...appVideoDoc.data() };
            console.log('✅ Video caricato (da appVideos):', videoData.title);
            return videoData;
          }

          console.log('❌ Video non trovato:', videoIdString);
          return null;
        } catch (error) {
          console.error('❌ Errore caricamento video:', videoId, error);
          return null;
        }
      });
      
      const videos = await Promise.all(videosPromises);
      const validVideos = videos.filter(video => video !== null);
      
      console.log('✅ Video caricati:', validVideos.length, 'di', videoIds.length);
      setExerciseVideos(validVideos);
    } catch (error) {
      console.error('Error fetching videos:', error);
    }
  };

  const fetchAssociatedArticles = async (articleIds) => {
    try {
      if (!articleIds || articleIds.length === 0) return;
      
      const articlesPromises = articleIds.map(async (articleId) => {
        const articleDoc = await getDoc(doc(db, 'articles', articleId));
        if (articleDoc.exists()) {
          return { id: articleDoc.id, ...articleDoc.data() };
        }
        return null;
      });
      
      const articles = await Promise.all(articlesPromises);
      const validArticles = articles.filter(article => article !== null);
      
      console.log('✅ Articoli caricati:', validArticles);
      setExerciseArticles(validArticles);
    } catch (error) {
      console.error('Error fetching articles:', error);
    }
  };

  const startExercise = () => {
    navigate(`/exercises/${id}/practice`);
  };

  const goBack = () => {
    navigate('/onboarding-exercises');
  };

  const getYouTubeVideoId = (url) => {
    if (!url) return null;
    const match = url.match(/(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/);
    return match ? match[1] : null;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  if (!exercise) {
    return (
      <div className="text-center py-12">
        <h2 className="text-2xl font-bold mb-4">Esercizio non trovato</h2>
        <button
          onClick={goBack}
          className="px-6 py-3 bg-purple-600 text-white rounded-lg font-medium hover:bg-purple-700"
        >
          Torna agli esercizi
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-6">
      {/* Header */}
      <div className="mb-6">
        <button
          onClick={goBack}
          className="flex items-center space-x-2 text-gray-600 hover:text-gray-800 mb-4"
        >
          <ArrowLeft className="h-5 w-5" />
          <span>Torna agli esercizi</span>
        </button>
        
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Esercizi Pratici
        </h1>
      </div>

      {/* Exercise Card */}
      <div className="bg-white rounded-2xl shadow-xl p-6 mb-8 border">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="p-4 bg-blue-100 rounded-2xl">
              <Brain className="h-8 w-8 text-blue-600" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-1">
                {exercise.title}
              </h2>
              <p className="text-gray-600 text-sm mb-2">
                {exercise.category} • onboarding
              </p>
              {exercise.description && (
                <p className="text-gray-700 text-sm max-w-2xl">
                  {exercise.description.length > 150 
                    ? `${exercise.description.substring(0, 150)}...`
                    : exercise.description
                  }
                </p>
              )}
            </div>
          </div>
          <button
            onClick={startExercise}
            className="px-8 py-4 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-lg transition-all transform hover:scale-105 flex items-center space-x-2"
          >
            <span>Inizia Esercizio</span>
            <ChevronRight className="h-5 w-5" />
          </button>
        </div>
      </div>

      {/* Articles Section */}
      {exerciseArticles.length > 0 && (
        <div className="mb-8">
          <h3 className="text-2xl font-bold text-gray-900 mb-4">
            Articoli di Approfondimento
          </h3>
          <div className="space-y-4">
            {exerciseArticles.map((article) => (
              <div key={article.id} className="bg-white rounded-xl shadow-lg p-4 border">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="p-3 bg-green-100 rounded-xl">
                      <FileText className="h-6 w-6 text-green-600" />
                    </div>
                    <div>
                      <h4 className="font-bold text-gray-900 text-lg">
                        {article.title}
                      </h4>
                      <p className="text-gray-600 text-sm">
                        {article.category || 'Articolo'} • {article.readTime || '5 min'} di lettura
                      </p>
                      {article.description && (
                        <p className="text-gray-500 text-sm mt-1">
                          {article.description.length > 100 
                            ? `${article.description.substring(0, 100)}...`
                            : article.description
                          }
                        </p>
                      )}
                    </div>
                  </div>
                  <button 
                    onClick={() => window.open(`/articles/${article.id}`, '_blank')}
                    className="px-6 py-3 bg-green-100 hover:bg-green-200 text-green-700 rounded-xl font-medium transition-colors flex items-center space-x-2"
                  >
                    <span>Leggi</span>
                    <ChevronRight className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Videos Section */}
      {exerciseVideos.length > 0 && (
        <div className="mb-8">
          <h3 className="text-2xl font-bold text-gray-900 mb-4">
            Video di Spiegazione
          </h3>
          <div className="space-y-6">
            {exerciseVideos.map((video) => (
              <div key={video.id} className="bg-white rounded-xl shadow-lg p-6 border">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    <div className="p-3 bg-red-100 rounded-xl">
                      <Play className="h-6 w-6 text-red-600" />
                    </div>
                    <div>
                      <h4 className="font-bold text-gray-900 text-lg">
                        {video.title}
                      </h4>
                      <p className="text-gray-600 text-sm">
                        {video.category || 'Video Tutorial'} • {video.duration || 'YouTube'}
                      </p>
                      {video.description && (
                        <p className="text-gray-500 text-sm mt-1">
                          {video.description.length > 100 
                            ? `${video.description.substring(0, 100)}...`
                            : video.description
                          }
                        </p>
                      )}
                    </div>
                  </div>
                </div>
                
                {/* YouTube Embed */}
                {video.youtubeId && (
                  <div className="relative w-full pb-[56.25%] mb-4">
                    <iframe
                      className="absolute top-0 left-0 w-full h-full rounded-lg"
                      src={`https://www.youtube.com/embed/${video.youtubeId}`}
                      title={video.title}
                      frameBorder="0"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                    />
                  </div>
                )}
                
                {!video.youtubeId && (
                  <div className="bg-gray-100 rounded-lg p-4 text-center">
                    <p className="text-gray-500">Video YouTube non configurato</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Messaggio se non ci sono video/articoli */}
      {exerciseVideos.length === 0 && exerciseArticles.length === 0 && (
        <div className="mb-8 bg-yellow-50 border border-yellow-200 rounded-xl p-6 text-center">
          <p className="text-yellow-800 mb-2">
            ⚠️ Nessun video o articolo associato a questo esercizio
          </p>
          <p className="text-yellow-600 text-sm">
            Gli admin possono associare contenuti nella sezione "Gestione Esercizi"
          </p>
        </div>
      )}

      {/* CTA Bottom */}
      <div className="bg-gradient-to-r from-purple-600 to-blue-600 rounded-2xl p-8 text-center text-white">
        <h3 className="text-2xl font-bold mb-2">
          Pronto per iniziare?
        </h3>
        <p className="mb-6 opacity-90">
          Completa questo esercizio per continuare il tuo percorso di crescita
        </p>
        <button
          onClick={startExercise}
          className="inline-flex items-center space-x-3 px-8 py-4 bg-white text-purple-600 rounded-xl font-bold text-lg hover:bg-gray-50 transition-all transform hover:scale-105"
        >
          <Brain className="h-6 w-6" />
          <span>Inizia Esercizio</span>
          <ArrowRight className="h-5 w-5" />
        </button>
      </div>
    </div>
  );
};

export default ExerciseIntroPage;