import React, { useState, useEffect } from 'react';
import { 
  collection, 
  getDocs, 
  doc, 
  deleteDoc, 
  updateDoc,
  query,
  orderBy
} from 'firebase/firestore';
import { db } from '../../config/firebase';
import { useTheme } from '../../context/ThemeContext';
import { 
  Play, 
  Trash2, 
  Edit3, 
  Eye, 
  Calendar, 
  Clock, 
  ExternalLink,
  Search,
  Filter,
  Plus
} from 'lucide-react';
import { getYouTubeEmbedUrl, getYouTubeThumbnail } from '../../utils/youtubeUtils';

const VideoManager = () => {
  const { isDarkMode } = useTheme();
  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState('all');
  const [selectedVideo, setSelectedVideo] = useState(null);
  const [showPreview, setShowPreview] = useState(false);

  useEffect(() => {
    fetchVideos();
  }, []);

  const fetchVideos = async () => {
    try {
      setLoading(true);
      const allVideos = [];

      // Carica da appVideos
      const appVideosSnapshot = await getDocs(collection(db, 'appVideos'));
      appVideosSnapshot.forEach(doc => {
        allVideos.push({
          id: doc.id,
          ...doc.data(),
          collection: 'appVideos'
        });
      });

      // Carica da videos
      const videosSnapshot = await getDocs(collection(db, 'videos'));
      videosSnapshot.forEach(doc => {
        allVideos.push({
          id: doc.id,
          ...doc.data(),
          collection: 'videos'
        });
      });

      // Ordina per data di creazione
      allVideos.sort((a, b) => {
        const dateA = a.createdAt?.toDate() || new Date(0);
        const dateB = b.createdAt?.toDate() || new Date(0);
        return dateB - dateA;
      });

      setVideos(allVideos);
      console.log('📹 Video caricati:', allVideos.length);
    } catch (error) {
      console.error('Errore nel caricamento video:', error);
    } finally {
      setLoading(false);
    }
  };

  const deleteVideo = async (video) => {
    if (!confirm(`Sei sicuro di voler eliminare il video "${video.title}"?`)) {
      return;
    }

    try {
      await deleteDoc(doc(db, video.collection, video.id));
      setVideos(videos.filter(v => v.id !== video.id));
      console.log('Video eliminato:', video.id);
    } catch (error) {
      console.error('Errore nell\'eliminazione:', error);
      alert('Errore nell\'eliminazione del video');
    }
  };

  const getVideoUrl = (video) => {
    const possibleFields = [
      'youtubeUrl', 'youtubeId', 'youtubeID', 'youtube_id',
      'videoId', 'videoID', 'url', 'videoUrl', 'link', 'embedUrl'
    ];
    
    for (const field of possibleFields) {
      if (video[field]) {
        return video[field];
      }
    }
    return null;
  };

  const getEmbedUrl = (video) => {
    const urlOrId = getVideoUrl(video);
    return urlOrId ? getYouTubeEmbedUrl(urlOrId) : null;
  };

  const filteredVideos = videos.filter(video => {
    const matchesSearch = video.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         video.description?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesCategory = filterCategory === 'all' || video.category === filterCategory;
    
    return matchesSearch && matchesCategory;
  });

  const categories = [...new Set(videos.map(v => v.category).filter(Boolean))];

  const formatDate = (date) => {
    if (!date) return 'N/A';
    const d = date.toDate ? date.toDate() : new Date(date);
    return d.toLocaleDateString('it-IT');
  };

  const VideoPreviewModal = ({ video, onClose }) => {
    const embedUrl = getEmbedUrl(video);
    
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white dark:bg-gray-800 rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
          <div className="p-6">
            <div className="flex justify-between items-start mb-4">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                {video.title}
              </h2>
              <button
                onClick={onClose}
                className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
              >
                ✕
              </button>
            </div>
            
            {embedUrl ? (
              <div className="aspect-video mb-4">
                <iframe
                  src={embedUrl}
                  className="w-full h-full rounded-lg"
                  frameBorder="0"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              </div>
            ) : (
              <div className="aspect-video bg-gray-200 dark:bg-gray-700 rounded-lg flex items-center justify-center mb-4">
                <div className="text-center">
                  <Play className="h-16 w-16 mx-auto text-gray-400 mb-2" />
                  <p className="text-gray-500">Video non disponibile</p>
                </div>
              </div>
            )}
            
            <div className="space-y-4">
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Descrizione</h3>
                <p className="text-gray-600 dark:text-gray-300">
                  {video.description || 'Nessuna descrizione'}
                </p>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <span className="text-sm text-gray-500">Categoria</span>
                  <p className="text-gray-900 dark:text-white">{video.category || 'N/A'}</p>
                </div>
                <div>
                  <span className="text-sm text-gray-500">Durata</span>
                  <p className="text-gray-900 dark:text-white">{video.duration || 'N/A'}</p>
                </div>
                <div>
                  <span className="text-sm text-gray-500">Visualizzazioni</span>
                  <p className="text-gray-900 dark:text-white">{video.views || 0}</p>
                </div>
                <div>
                  <span className="text-sm text-gray-500">Collezione</span>
                  <p className="text-gray-900 dark:text-white">{video.collection}</p>
                </div>
              </div>
              
              {getVideoUrl(video) && (
                <div>
                  <span className="text-sm text-gray-500">URL YouTube</span>
                  <p className="text-gray-900 dark:text-white break-all text-sm">
                    {getVideoUrl(video)}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            Gestione Video
          </h2>
          <p className="text-gray-600 dark:text-gray-400">
            {videos.length} video totali
          </p>
        </div>
        
        <button className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors flex items-center gap-2">
          <Plus className="h-4 w-4" />
          Nuovo Video
        </button>
      </div>

      {/* Filtri */}
      <div className="bg-white dark:bg-gray-800 rounded-lg p-4 space-y-4">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <input
                type="text"
                placeholder="Cerca video..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              />
            </div>
          </div>
          
          <div className="sm:w-48">
            <select
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            >
              <option value="all">Tutte le categorie</option>
              {categories.map(category => (
                <option key={category} value={category}>
                  {category}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Lista Video */}
      <div className="bg-white dark:bg-gray-800 rounded-lg overflow-hidden">
        {filteredVideos.length === 0 ? (
          <div className="p-8 text-center">
            <Play className="h-16 w-16 mx-auto text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
              Nessun video trovato
            </h3>
            <p className="text-gray-500 dark:text-gray-400">
              {searchTerm || filterCategory !== 'all' 
                ? 'Prova a modificare i filtri di ricerca'
                : 'Non ci sono video da mostrare'
              }
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-700">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Video
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Categoria
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Statistiche
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Data
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Azioni
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                {filteredVideos.map((video) => {
                  const embedUrl = getEmbedUrl(video);
                  const thumbnailUrl = getYouTubeThumbnail(getVideoUrl(video));
                  
                  return (
                    <tr key={video.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                      <td className="px-6 py-4">
                        <div className="flex items-center space-x-4">
                          <div className="flex-shrink-0 w-20 h-12 bg-gray-200 dark:bg-gray-600 rounded overflow-hidden">
                            {thumbnailUrl ? (
                              <img 
                                src={thumbnailUrl} 
                                alt={video.title}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center">
                                <Play className="h-6 w-6 text-gray-400" />
                              </div>
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                              {video.title || 'Senza titolo'}
                            </p>
                            <p className="text-sm text-gray-500 dark:text-gray-400 truncate">
                              {video.description?.substring(0, 100)}...
                            </p>
                            <div className="flex items-center gap-2 mt-1">
                              <span className="text-xs px-2 py-1 bg-gray-100 dark:bg-gray-600 text-gray-600 dark:text-gray-300 rounded">
                                {video.collection}
                              </span>
                              {embedUrl ? (
                                <span className="text-xs text-green-600 dark:text-green-400">✓ URL valido</span>
                              ) : (
                                <span className="text-xs text-red-600 dark:text-red-400">✗ URL mancante</span>
                              )}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-sm text-gray-900 dark:text-white">
                          {video.category || 'N/A'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                        <div className="space-y-1">
                          <div className="flex items-center gap-1">
                            <Eye className="h-3 w-3" />
                            <span>{video.views || 0}</span>
                          </div>
                          {video.duration && (
                            <div className="flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              <span>{video.duration}</span>
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                        <div className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          <span>{formatDate(video.createdAt)}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm space-x-2">
                        <button
                          onClick={() => {
                            setSelectedVideo(video);
                            setShowPreview(true);
                          }}
                          className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
                          title="Anteprima"
                        >
                          <Eye className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => console.log('Edit video:', video.id)}
                          className="text-yellow-600 hover:text-yellow-800 dark:text-yellow-400 dark:hover:text-yellow-300"
                          title="Modifica"
                        >
                          <Edit3 className="h-4 w-4" />
                        </button>
                        {getVideoUrl(video) && (
                          <a
                            href={`https://www.youtube.com/watch?v=${getVideoUrl(video)}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-green-600 hover:text-green-800 dark:text-green-400 dark:hover:text-green-300"
                            title="Apri su YouTube"
                          >
                            <ExternalLink className="h-4 w-4" />
                          </a>
                        )}
                        <button
                          onClick={() => deleteVideo(video)}
                          className="text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300"
                          title="Elimina"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal Anteprima */}
      {showPreview && selectedVideo && (
        <VideoPreviewModal
          video={selectedVideo}
          onClose={() => {
            setShowPreview(false);
            setSelectedVideo(null);
          }}
        />
      )}
    </div>
  );
};

export default VideoManager;