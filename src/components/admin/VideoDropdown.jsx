import React, { useState, useEffect } from 'react';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../../config/firebase';
import { Video, Play, Clock, Eye } from 'lucide-react';

const VideoDropdown = ({ 
  selectedVideo, 
  onVideoSelect, 
  placeholder = "Seleziona un video...",
  filterTags = null, // Array di tag per filtrare i video
  showPreview = true,
  className = ""
}) => {
  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [previewVideo, setPreviewVideo] = useState(null);

  useEffect(() => {
    loadVideos();
  }, []);

  const loadVideos = async () => {
    try {
      setLoading(true);
      const videosSnapshot = await getDocs(collection(db, 'videos'));
      let videosList = videosSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      // Filtra per tag se specificati
      if (filterTags && filterTags.length > 0) {
        videosList = videosList.filter(video => 
          video.tags && video.tags.some(tag => filterTags.includes(tag))
        );
      }

      // Ordina per titolo
      videosList.sort((a, b) => a.title.localeCompare(b.title));
      
      setVideos(videosList);
    } catch (error) {
      console.error('Error loading videos:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDuration = (duration) => {
    if (!duration) return '';
    
    // Se è già nel formato PT... (YouTube)
    if (duration.startsWith && duration.startsWith('PT')) {
      const match = duration.match(/PT(\d+H)?(\d+M)?(\d+S)?/);
      if (!match) return '';
      
      const hours = parseInt(match[1]?.replace('H', '') || '0');
      const minutes = parseInt(match[2]?.replace('M', '') || '0');
      const seconds = parseInt(match[3]?.replace('S', '') || '0');
      
      if (hours > 0) {
        return `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
      }
      return `${minutes}:${seconds.toString().padStart(2, '0')}`;
    }
    
    // Se è un numero di secondi
    if (typeof duration === 'number') {
      const minutes = Math.floor(duration / 60);
      const seconds = duration % 60;
      return `${minutes}:${seconds.toString().padStart(2, '0')}`;
    }
    
    return duration;
  };

  const handleVideoSelect = (video) => {
    const videoData = {
      id: video.id,
      title: video.title,
      url: video.url,
      embedUrl: video.embedUrl,
      thumbnail: video.thumbnail,
      duration: video.duration,
      tags: video.tags || [],
      youtubeId: video.youtubeId
    };
    onVideoSelect(videoData);
  };

  const openPreview = (video, e) => {
    e.stopPropagation();
    setPreviewVideo(video);
    setShowPreviewModal(true);
  };

  const getYouTubeVideoId = (url) => {
    if (!url) return null;
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
    const match = url.match(regExp);
    return (match && match[2].length === 11) ? match[2] : null;
  };

  if (loading) {
    return (
      <div className={`border border-gray-300 rounded-lg p-3 bg-gray-50 ${className}`}>
        <div className="flex items-center space-x-2">
          <Video className="h-4 w-4 text-gray-400 animate-pulse" />
          <span className="text-gray-500">Caricamento video...</span>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className={`relative ${className}`}>
        <select
          value={selectedVideo?.id || ''}
          onChange={(e) => {
            const video = videos.find(v => v.id === e.target.value);
            if (video) {
              handleVideoSelect(video);
            } else {
              onVideoSelect(null);
            }
          }}
          className="w-full border border-gray-300 rounded-lg px-3 py-2 bg-white focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none"
        >
          <option value="">{placeholder}</option>
          {videos.map(video => (
            <option key={video.id} value={video.id}>
              {video.title} {video.duration ? `(${formatDuration(video.duration)})` : ''}
            </option>
          ))}
        </select>
        
        {/* Selected Video Preview */}
        {selectedVideo && (
          <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex items-start space-x-3">
              {selectedVideo.thumbnail && (
                <img 
                  src={selectedVideo.thumbnail} 
                  alt={selectedVideo.title}
                  className="w-16 h-12 object-cover rounded flex-shrink-0"
                />
              )}
              <div className="flex-1 min-w-0">
                <h4 className="font-medium text-gray-900 text-sm truncate">
                  {selectedVideo.title}
                </h4>
                <div className="flex items-center space-x-3 mt-1 text-xs text-gray-600">
                  {selectedVideo.duration && (
                    <div className="flex items-center space-x-1">
                      <Clock className="h-3 w-3" />
                      <span>{formatDuration(selectedVideo.duration)}</span>
                    </div>
                  )}
                  {selectedVideo.tags && selectedVideo.tags.length > 0 && (
                    <div className="flex items-center space-x-1">
                      <span>Tag:</span>
                      <span className="bg-blue-100 text-blue-800 px-1 py-0.5 rounded text-xs">
                        {selectedVideo.tags.slice(0, 2).join(', ')}
                        {selectedVideo.tags.length > 2 && ' +' + (selectedVideo.tags.length - 2)}
                      </span>
                    </div>
                  )}
                </div>
              </div>
              {showPreview && selectedVideo.url && (
                <button
                  onClick={(e) => openPreview(selectedVideo, e)}
                  className="p-1.5 text-blue-600 hover:bg-blue-100 rounded transition-colors flex-shrink-0"
                  title="Anteprima video"
                >
                  <Eye className="h-4 w-4" />
                </button>
              )}
            </div>
          </div>
        )}

        {/* No videos message */}
        {videos.length === 0 && (
          <div className="mt-2 text-sm text-gray-500">
            {filterTags && filterTags.length > 0 
              ? `Nessun video trovato con tag: ${filterTags.join(', ')}`
              : 'Nessun video disponibile. Aggiungi video dalla sezione YouTube Video Manager.'
            }
          </div>
        )}
      </div>

      {/* Preview Modal */}
      {showPreviewModal && previewVideo && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">
                  {previewVideo.title}
                </h3>
                <div className="flex items-center space-x-3 mt-1 text-sm text-gray-600">
                  {previewVideo.duration && (
                    <div className="flex items-center space-x-1">
                      <Clock className="h-3 w-3" />
                      <span>{formatDuration(previewVideo.duration)}</span>
                    </div>
                  )}
                  {previewVideo.viewCount && (
                    <span>{parseInt(previewVideo.viewCount).toLocaleString()} views</span>
                  )}
                </div>
              </div>
              <button
                onClick={() => setShowPreviewModal(false)}
                className="text-gray-500 hover:text-gray-700 p-1"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Video Player */}
            <div className="p-4">
              <div className="aspect-video">
                {previewVideo.embedUrl ? (
                  <iframe
                    src={previewVideo.embedUrl}
                    title={previewVideo.title}
                    className="w-full h-full rounded-lg"
                    allowFullScreen
                  />
                ) : previewVideo.url && getYouTubeVideoId(previewVideo.url) ? (
                  <iframe
                    src={`https://www.youtube.com/embed/${getYouTubeVideoId(previewVideo.url)}`}
                    title={previewVideo.title}
                    className="w-full h-full rounded-lg"
                    allowFullScreen
                  />
                ) : (
                  <div className="w-full h-full bg-gray-100 rounded-lg flex items-center justify-center">
                    <div className="text-center">
                      <Video className="h-12 w-12 text-gray-400 mx-auto mb-2" />
                      <p className="text-gray-500">Anteprima non disponibile</p>
                    </div>
                  </div>
                )}
              </div>

              {/* Video Info */}
              {previewVideo.description && (
                <div className="mt-4">
                  <h4 className="font-medium text-gray-900 mb-2">Descrizione</h4>
                  <p className="text-gray-600 text-sm line-clamp-3">
                    {previewVideo.description}
                  </p>
                </div>
              )}

              {/* Tags */}
              {previewVideo.tags && previewVideo.tags.length > 0 && (
                <div className="mt-4">
                  <h4 className="font-medium text-gray-900 mb-2">Tag</h4>
                  <div className="flex flex-wrap gap-1">
                    {previewVideo.tags.map((tag, index) => (
                      <span 
                        key={index}
                        className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="flex items-center justify-end p-4 border-t bg-gray-50">
              <button
                onClick={() => setShowPreviewModal(false)}
                className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Chiudi
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default VideoDropdown;