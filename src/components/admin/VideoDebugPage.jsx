import React, { useState, useEffect } from 'react';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../../config/firebase';
import { AlertCircle, CheckCircle, Info } from 'lucide-react';

const VideoDebugPage = () => {
  const [appVideos, setAppVideos] = useState([]);
  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    checkVideos();
  }, []);

  const checkVideos = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Controlla appVideos
      try {
        const appVideosSnap = await getDocs(collection(db, 'appVideos'));
        const appVideosData = [];
        appVideosSnap.forEach((doc) => {
          appVideosData.push({ id: doc.id, ...doc.data() });
        });
        setAppVideos(appVideosData);
        console.log('✅ appVideos caricati:', appVideosData.length);
      } catch (err) {
        console.error('Errore con appVideos:', err);
      }
      
      // Controlla videos
      try {
        const videosSnap = await getDocs(collection(db, 'videos'));
        const videosData = [];
        videosSnap.forEach((doc) => {
          videosData.push({ id: doc.id, ...doc.data() });
        });
        setVideos(videosData);
        console.log('✅ videos caricati:', videosData.length);
      } catch (err) {
        console.error('Errore con videos:', err);
      }
      
    } catch (err) {
      setError(err.message);
      console.error('Errore generale:', err);
    } finally {
      setLoading(false);
    }
  };

  const findYouTubeField = (video) => {
    const youtubeFields = [
      'youtubeUrl', 'youtubeId', 'youtubeID', 'youtube_id',
      'url', 'videoUrl', 'link', 'embedUrl', 'videoId', 'videoID'
    ];
    
    for (const field of youtubeFields) {
      if (video[field]) {
        return { field, value: video[field] };
      }
    }
    return null;
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
          🔍 Debug Video Database
        </h2>
        
        {error && (
          <div className="mb-4 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
            <div className="flex items-center">
              <AlertCircle className="h-5 w-5 text-red-500 mr-2" />
              <span className="text-red-700 dark:text-red-300">Errore: {error}</span>
            </div>
          </div>
        )}
        
        {/* Collezione appVideos */}
        <div className="mb-8">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
            📺 Collezione 'appVideos' ({appVideos.length} video)
          </h3>
          
          {appVideos.length === 0 ? (
            <p className="text-gray-500">Nessun video trovato</p>
          ) : (
            <div className="space-y-3">
              {appVideos.map((video, index) => {
                const youtubeData = findYouTubeField(video);
                return (
                  <div key={video.id} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <p className="font-medium text-gray-900 dark:text-white">
                          {index + 1}. {video.title || 'Senza titolo'}
                        </p>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          ID: {video.id}
                        </p>
                        <p className="text-xs text-gray-400 mt-1">
                          Campi: {Object.keys(video).join(', ')}
                        </p>
                        
                        {youtubeData ? (
                          <div className="mt-2 p-2 bg-green-50 dark:bg-green-900/20 rounded">
                            <div className="flex items-center">
                              <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                              <span className="text-sm text-green-700 dark:text-green-300">
                                YouTube trovato in '{youtubeData.field}': {youtubeData.value}
                              </span>
                            </div>
                          </div>
                        ) : (
                          <div className="mt-2 p-2 bg-red-50 dark:bg-red-900/20 rounded">
                            <div className="flex items-center">
                              <AlertCircle className="h-4 w-4 text-red-500 mr-2" />
                              <span className="text-sm text-red-700 dark:text-red-300">
                                ❌ Nessun campo YouTube trovato!
                              </span>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
        
        {/* Collezione videos */}
        <div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
            📺 Collezione 'videos' ({videos.length} video)
          </h3>
          
          {videos.length === 0 ? (
            <p className="text-gray-500">Nessun video trovato</p>
          ) : (
            <div className="space-y-3">
              {videos.map((video, index) => {
                const youtubeData = findYouTubeField(video);
                return (
                  <div key={video.id} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <p className="font-medium text-gray-900 dark:text-white">
                          {index + 1}. {video.title || 'Senza titolo'}
                        </p>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          ID: {video.id}
                        </p>
                        <p className="text-xs text-gray-400 mt-1">
                          Campi: {Object.keys(video).join(', ')}
                        </p>
                        
                        {youtubeData ? (
                          <div className="mt-2 p-2 bg-green-50 dark:bg-green-900/20 rounded">
                            <div className="flex items-center">
                              <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                              <span className="text-sm text-green-700 dark:text-green-300">
                                YouTube trovato in '{youtubeData.field}': {youtubeData.value}
                              </span>
                            </div>
                          </div>
                        ) : (
                          <div className="mt-2 p-2 bg-red-50 dark:bg-red-900/20 rounded">
                            <div className="flex items-center">
                              <AlertCircle className="h-4 w-4 text-red-500 mr-2" />
                              <span className="text-sm text-red-700 dark:text-red-300">
                                ❌ Nessun campo YouTube trovato!
                              </span>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
        
        {/* Info Box */}
        <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
          <div className="flex items-start">
            <Info className="h-5 w-5 text-blue-500 mr-2 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-blue-800 dark:text-blue-200">
                Campi YouTube supportati:
              </p>
              <p className="text-sm text-blue-700 dark:text-blue-300 mt-1">
                youtubeUrl, youtubeId, youtubeID, youtube_id, url, videoUrl, link, embedUrl, videoId, videoID
              </p>
              <p className="text-sm text-blue-700 dark:text-blue-300 mt-2">
                Per aggiungere un video YouTube, vai su Admin → Contenuti → Video e inserisci l'URL nel campo appropriato.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VideoDebugPage;