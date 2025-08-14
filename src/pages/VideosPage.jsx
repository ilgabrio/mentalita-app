import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Play, Clock, Video } from 'lucide-react';
import { db } from '../config/firebase';
import { collection, getDocs, query, orderBy, where } from 'firebase/firestore';

const VideosPage = () => {
  const navigate = useNavigate();
  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('all');

  useEffect(() => {
    const fetchVideos = async () => {
      try {
        // Prova dalla collezione appVideos (collezione originale)
        let q = query(
          collection(db, 'appVideos'), 
          where('isPublished', '==', true),
          orderBy('order', 'asc')
        );
        
        let querySnapshot = await getDocs(q);
        let videosData = [];
        
        querySnapshot.forEach((doc) => {
          videosData.push({ id: doc.id, ...doc.data() });
        });

        // Se non ci sono risultati, prova dalla collezione videos
        if (videosData.length === 0) {
          q = query(
            collection(db, 'videos'), 
            where('isPublished', '==', true),
            orderBy('createdAt', 'desc')
          );
          
          querySnapshot = await getDocs(q);
          querySnapshot.forEach((doc) => {
            videosData.push({ id: doc.id, ...doc.data() });
          });
        }

        // Se ancora non ci sono dati, usa dati mock
        if (videosData.length === 0) {
          videosData = [
            {
              id: '1',
              title: 'Tecniche di Respirazione per Atleti',
              description: 'Impara le tecniche di respirazione per migliorare concentrazione e performance',
              category: 'Respirazione',
              duration: '8:30',
              youtubeUrl: 'https://www.youtube.com/watch?v=example1',
              thumbnail: '/mentalita-app/icon-192.png',
              isPublished: true
            },
            {
              id: '2',
              title: 'Visualizzazione Prima della Gara',
              description: 'Come utilizzare la visualizzazione mentale per prepararsi alle competizioni',
              category: 'Visualizzazione',
              duration: '12:15',
              youtubeUrl: 'https://www.youtube.com/watch?v=example2',
              thumbnail: '/mentalita-app/icon-192.png',
              isPublished: true
            }
          ];
        }

        setVideos(videosData);
        
        // Estrai le categorie uniche
        const uniqueCategories = [...new Set(videosData.map(video => video.category || 'Generale'))];
        setCategories(uniqueCategories);
        
      } catch (error) {
        console.error('Errore nel caricamento dei video:', error);
        // Usa dati mock in caso di errore
        const mockData = [
          {
            id: '1',
            title: 'Tecniche di Respirazione per Atleti',
            description: 'Impara le tecniche di respirazione per migliorare concentrazione e performance',
            category: 'Respirazione',
            duration: '8:30'
          }
        ];
        setVideos(mockData);
        setCategories(['Respirazione']);
      } finally {
        setLoading(false);
      }
    };

    fetchVideos();
  }, []);

  const filteredVideos = selectedCategory === 'all' 
    ? videos 
    : videos.filter(video => video.category === selectedCategory);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="px-4 py-6">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Video Formativi</h1>
          <p className="text-gray-600 dark:text-gray-300">
            Contenuti video per migliorare la tua preparazione mentale
          </p>
        </div>

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

        {/* Lista video */}
        <div className="space-y-4">
          {filteredVideos.length > 0 ? (
            filteredVideos.map((video) => (
              <div
                key={video.id}
                className="bg-white dark:bg-gray-800 rounded-lg shadow-sm hover:shadow-md transition-shadow cursor-pointer overflow-hidden"
                onClick={() => navigate(`/videos/${video.id}`)}
              >
                <div className="flex">
                  {/* Thumbnail */}
                  <div className="relative w-32 h-24 bg-gray-200 dark:bg-gray-700 flex-shrink-0">
                    <img
                      src={video.thumbnail || '/mentalita-app/icon-192.png'}
                      alt={video.title}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-30">
                      <Play className="text-white" size={28} />
                    </div>
                    {video.duration && (
                      <div className="absolute bottom-2 right-2 bg-black bg-opacity-75 text-white text-xs px-2 py-1 rounded">
                        {video.duration}
                      </div>
                    )}
                  </div>

                  {/* Content */}
                  <div className="flex-1 p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="text-sm font-medium text-blue-500 bg-blue-100 dark:bg-blue-900/20 dark:text-blue-400 px-2 py-1 rounded-full">
                            {video.category || 'Generale'}
                          </span>
                        </div>
                        
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2 line-clamp-2">
                          {video.title}
                        </h3>
                        
                        <p className="text-gray-600 dark:text-gray-300 text-sm mb-3 line-clamp-2">
                          {video.description}
                        </p>
                        
                        <div className="flex items-center gap-4 text-sm text-gray-500 dark:text-gray-400">
                          {video.duration && (
                            <div className="flex items-center gap-1">
                              <Clock className="h-4 w-4" />
                              <span>{video.duration}</span>
                            </div>
                          )}
                          <div className="flex items-center gap-1">
                            <Video className="h-4 w-4" />
                            <span>Video</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-12">
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

export default VideosPage;