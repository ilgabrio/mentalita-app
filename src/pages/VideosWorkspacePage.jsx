import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Play, Clock, Video, Bookmark, Star } from 'lucide-react';
import { db } from '../config/firebase';
import { collection, getDocs } from 'firebase/firestore';
import MotivationalMessage from '../components/MotivationalMessage';

const VideosWorkspacePage = () => {
  const navigate = useNavigate();
  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('all');

  useEffect(() => {
    const fetchVideos = async () => {
      try {
        console.log('🎥 CARICAMENTO CONTENUTI VIDEO...');
        
        // Carica dalla collezione appVideos
        const videosSnapshot = await getDocs(collection(db, 'appVideos'));
        const videosData = [];
        
        videosSnapshot.forEach((doc) => {
          const data = { id: doc.id, ...doc.data() };
          videosData.push(data);
        });
        
        console.log('✅ Video trovati:', videosData.length);
        
        setVideos(videosData);
        
        // Estrai le categorie uniche
        const uniqueCategories = [...new Set(videosData.map(video => video.category || 'Generale'))];
        setCategories(uniqueCategories);
        
      } catch (error) {
        console.error('Errore nel caricamento dei video:', error);
        
        // Dati mock per test
        const mockVideos = [
          {
            id: '1',
            title: 'Tecniche di Respirazione',
            description: 'Impara le tecniche base di respirazione per il controllo dello stress',
            youtubeUrl: 'https://www.youtube.com/watch?v=example1',
            duration: '12:30',
            category: 'Respirazione',
            thumbnail: null,
            views: 1250
          },
          {
            id: '2',
            title: 'Visualizzazione del Successo',
            description: 'Come utilizzare la visualizzazione per migliorare le performance',
            youtubeUrl: 'https://www.youtube.com/watch?v=example2',
            duration: '18:45',
            category: 'Visualizzazione',
            thumbnail: null,
            views: 890
          },
          {
            id: '3',
            title: 'Gestione della Pressione',
            description: 'Strategie per gestire la pressione durante le competizioni',
            youtubeUrl: 'https://www.youtube.com/watch?v=example3',
            duration: '15:20',
            category: 'Mentalità',
            thumbnail: null,
            views: 2100
          }
        ];
        
        setVideos(mockVideos);
        setCategories(['Respirazione', 'Visualizzazione', 'Mentalità']);
      } finally {
        setLoading(false);
      }
    };

    fetchVideos();
  }, []);

  const filteredVideos = selectedCategory === 'all' 
    ? videos 
    : videos.filter(video => video.category === selectedCategory);

  const formatDuration = (duration) => {
    if (!duration) return 'N/A';
    return duration;
  };

  const formatViews = (views) => {
    if (!views) return '0';
    if (views >= 1000) {
      return `${(views / 1000).toFixed(1)}k`;
    }
    return views.toString();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-300">Caricamento contenuti video...</p>
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
            <Video className="h-8 w-8 text-red-500" />
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Video Formativi</h1>
          </div>
          <p className="text-gray-600 dark:text-gray-300">
            Guarda i nostri video per migliorare le tue abilità mentali nello sport
          </p>
          <div className="mt-4 grid grid-cols-2 gap-4">
            <div className="bg-red-50 dark:bg-red-900/20 p-3 rounded-lg">
              <div className="flex items-center gap-2">
                <Play className="h-5 w-5 text-red-500" />
                <span className="text-sm font-medium text-red-700 dark:text-red-300">
                  {videos.length} Video Disponibili
                </span>
              </div>
            </div>
            <div className="bg-purple-50 dark:bg-purple-900/20 p-3 rounded-lg">
              <div className="flex items-center gap-2">
                <Star className="h-5 w-5 text-purple-500" />
                <span className="text-sm font-medium text-purple-700 dark:text-purple-300">
                  Contenuti Premium
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

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
                    ? 'bg-red-500 text-white'
                    : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                }`}
              >
                Tutti ({videos.length})
              </button>
              {categories.map(category => {
                const count = videos.filter(video => video.category === category).length;
                return (
                  <button
                    key={category}
                    onClick={() => setSelectedCategory(category)}
                    className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                      selectedCategory === category
                        ? 'bg-red-500 text-white'
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

        {/* Lista video */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {filteredVideos.length > 0 ? (
            filteredVideos.map((video) => (
              <div
                key={video.id}
                className="bg-white dark:bg-gray-800 rounded-lg shadow-sm hover:shadow-md transition-shadow cursor-pointer overflow-hidden border border-gray-200 dark:border-gray-700"
                onClick={() => navigate(`/videos/${video.id}`)}
              >
                {/* Thumbnail del video */}
                <div className="relative aspect-video bg-gray-900">
                  {video.thumbnail ? (
                    <img 
                      src={video.thumbnail} 
                      alt={video.title}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <div className="text-center text-white">
                        <Video className="h-12 w-12 mx-auto mb-2 opacity-50" />
                        <p className="text-sm opacity-75">Video Preview</p>
                      </div>
                    </div>
                  )}
                  
                  {/* Overlay play button */}
                  <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-30 opacity-0 hover:opacity-100 transition-opacity">
                    <div className="bg-white rounded-full p-3">
                      <Play className="h-6 w-6 text-gray-900" />
                    </div>
                  </div>
                  
                  {/* Duration badge */}
                  {video.duration && (
                    <div className="absolute bottom-2 right-2 bg-black bg-opacity-75 text-white text-xs px-2 py-1 rounded">
                      {formatDuration(video.duration)}
                    </div>
                  )}
                </div>
                
                <div className="p-4">
                  <div className="flex items-start justify-between mb-2">
                    <span className="text-xs font-medium text-red-500 bg-red-100 dark:bg-red-900/20 dark:text-red-400 px-2 py-1 rounded-full">
                      {video.category || 'Generale'}
                    </span>
                    <button className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
                      <Bookmark className="h-4 w-4" />
                    </button>
                  </div>
                  
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2 line-clamp-2">
                    {video.title}
                  </h3>
                  
                  <p className="text-gray-600 dark:text-gray-300 text-sm mb-3 line-clamp-2">
                    {video.description}
                  </p>
                  
                  <div className="flex items-center justify-between text-sm text-gray-500 dark:text-gray-400">
                    <div className="flex items-center gap-1">
                      <Clock className="h-4 w-4" />
                      <span>{formatDuration(video.duration)}</span>
                    </div>
                    {video.views && (
                      <div className="flex items-center gap-1">
                        <span>{formatViews(video.views)} visualizzazioni</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="col-span-full text-center py-12">
              <div className="text-gray-400 dark:text-gray-600 mb-4">
                <Video className="h-16 w-16 mx-auto opacity-50" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                Nessun video trovato
              </h3>
              <p className="text-gray-500 dark:text-gray-400">
                {selectedCategory === 'all' 
                  ? 'Non ci sono video disponibili al momento'
                  : `Non ci sono video nella categoria "${selectedCategory}"`
                }
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default VideosWorkspacePage;