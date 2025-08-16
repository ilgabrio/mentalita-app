import React, { useState, useEffect } from 'react';
import { Search, Video, Clock, X, Check, ExternalLink } from 'lucide-react';
import { db } from '../../config/firebase';
import { collection, getDocs, query, orderBy } from 'firebase/firestore';

const VideoSelector = ({ 
  value, 
  onChange, 
  placeholder = "Seleziona un video...",
  label = "Video",
  multiple = false 
}) => {
  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [selectedVideos, setSelectedVideos] = useState(
    multiple ? (value || []) : (value ? [value] : [])
  );

  useEffect(() => {
    fetchVideos();
  }, []);

  // Sync internal state when value prop changes
  useEffect(() => {
    setSelectedVideos(
      multiple ? (value || []) : (value ? [value] : [])
    );
  }, [value, multiple]);

  const fetchVideos = async () => {
    try {
      console.log('🎥 VideoSelector: Starting to fetch videos...');
      
      // Try appVideos first (without orderBy to avoid index issues)
      let q = query(collection(db, 'appVideos'));
      let snapshot = await getDocs(q);
      const videosData = [];
      
      console.log(`🎥 VideoSelector: Found ${snapshot.size} documents in appVideos`);
      
      snapshot.forEach((doc) => {
        const data = doc.data();
        console.log(`🎥 VideoSelector: Processing video ${doc.id}:`, { 
          title: data.title, 
          isPublished: data.isPublished 
        });
        
        if (data.isPublished !== false) {
          videosData.push({
            id: doc.id,
            ...data
          });
        }
      });

      // If no results from appVideos, try videos collection
      if (videosData.length === 0) {
        console.log('🎥 VideoSelector: No videos in appVideos, trying videos collection...');
        try {
          q = query(collection(db, 'videos'));
          snapshot = await getDocs(q);
          console.log(`🎥 VideoSelector: Found ${snapshot.size} documents in videos`);
          
          snapshot.forEach((doc) => {
            const data = doc.data();
            console.log(`🎥 VideoSelector: Processing video ${doc.id}:`, { 
              title: data.title, 
              isPublished: data.isPublished 
            });
            
            if (data.isPublished !== false) {
              videosData.push({
                id: doc.id,
                ...data
              });
            }
          });
        } catch (error) {
          console.log('🎥 VideoSelector: Error accessing videos collection:', error);
        }
      }

      // Add mock videos if no data from Firebase
      if (videosData.length === 0) {
        videosData.push(
          {
            id: 'mock1',
            title: 'Tecniche di Respirazione per Atleti',
            description: 'Impara le tecniche base di respirazione per il controllo dello stress',
            youtubeUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
            duration: '12:30',
            category: 'Respirazione',
            instructor: 'Dr. Breath'
          },
          {
            id: 'mock2',
            title: 'Visualizzazione del Successo',
            description: 'Come usare la visualizzazione per migliorare le performance',
            youtubeUrl: 'https://www.youtube.com/watch?v=example2',
            duration: '15:45',
            category: 'Visualizzazione',
            instructor: 'Coach Mind'
          },
          {
            id: 'mock3',
            title: 'Gestione dell\'Ansia Pre-Gara',
            description: 'Strategie pratiche per gestire l\'ansia prima della competizione',
            youtubeUrl: 'https://www.youtube.com/watch?v=example3',
            duration: '18:20',
            category: 'Ansia',
            instructor: 'Dr. Calm'
          },
          {
            id: 'mock4',
            title: 'Routine di Riscaldamento Mentale',
            description: 'Prepara la tua mente come prepari il tuo corpo',
            youtubeUrl: 'https://www.youtube.com/watch?v=example4',
            duration: '10:15',
            category: 'Preparazione',
            instructor: 'Coach Ready'
          }
        );
      }

      console.log(`🎥 VideoSelector: Final videos array:`, videosData.length, videosData);
      setVideos(videosData);
    } catch (error) {
      console.error('🎥 VideoSelector: Error fetching videos:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredVideos = videos.filter(video =>
    video.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    video.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    video.category?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleSelectVideo = (video) => {
    if (multiple) {
      const isSelected = selectedVideos.some(v => v.id === video.id);
      let newSelection;
      
      if (isSelected) {
        newSelection = selectedVideos.filter(v => v.id !== video.id);
      } else {
        newSelection = [...selectedVideos, video];
      }
      
      setSelectedVideos(newSelection);
      onChange(newSelection);
    } else {
      setSelectedVideos([video]);
      onChange(video);
      setIsOpen(false);
    }
  };

  const handleRemoveVideo = (videoId, e) => {
    e.stopPropagation();
    if (multiple) {
      const newSelection = selectedVideos.filter(v => v.id !== videoId);
      setSelectedVideos(newSelection);
      onChange(newSelection);
    } else {
      setSelectedVideos([]);
      onChange(null);
    }
  };

  const getYoutubeVideoId = (url) => {
    if (!url) return null;
    const match = url.match(/(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/);
    return match ? match[1] : null;
  };

  const getSelectedDisplay = () => {
    if (selectedVideos.length === 0) return placeholder;
    if (multiple) {
      return `${selectedVideos.length} video selezionati`;
    }
    return selectedVideos[0].title;
  };

  return (
    <div className="relative">
      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
        {label}
      </label>

      {/* Selected Videos Display */}
      <div
        className="min-h-[42px] px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 cursor-pointer hover:border-indigo-500 dark:hover:border-indigo-400 transition-colors"
        onClick={() => setIsOpen(!isOpen)}
      >
        <div className="flex items-center justify-between">
          <div className="flex-1">
            {selectedVideos.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {multiple ? (
                  selectedVideos.map(video => (
                    <span
                      key={video.id}
                      className="inline-flex items-center gap-1 px-2 py-1 bg-indigo-100 dark:bg-indigo-900 text-indigo-700 dark:text-indigo-300 rounded-md text-sm"
                    >
                      <Video className="h-3 w-3" />
                      {video.title}
                      <button
                        onClick={(e) => handleRemoveVideo(video.id, e)}
                        className="ml-1 hover:text-indigo-900 dark:hover:text-indigo-100"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </span>
                  ))
                ) : (
                  <span className="flex items-center gap-2 text-gray-900 dark:text-white">
                    <Video className="h-4 w-4 text-indigo-500" />
                    {selectedVideos[0].title}
                    <button
                      onClick={(e) => handleRemoveVideo(selectedVideos[0].id, e)}
                      className="ml-auto text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </span>
                )}
              </div>
            ) : (
              <span className="text-gray-500 dark:text-gray-400">{placeholder}</span>
            )}
          </div>
          <Video className="h-5 w-5 text-gray-400 ml-2 flex-shrink-0" />
        </div>
      </div>

      {/* Dropdown */}
      {isOpen && (
        <div className="absolute z-50 mt-2 w-full bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 max-h-96 overflow-hidden">
          {/* Search */}
          <div className="p-3 border-b border-gray-200 dark:border-gray-700">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Cerca video..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500"
                onClick={(e) => e.stopPropagation()}
              />
            </div>
          </div>

          {/* Videos List */}
          <div className="max-h-64 overflow-y-auto">
            {loading ? (
              <div className="p-4 text-center text-gray-500">
                Caricamento video...
              </div>
            ) : filteredVideos.length === 0 ? (
              <div className="p-4 text-center text-gray-500">
                Nessun video trovato
              </div>
            ) : (
              <div className="p-2">
                {filteredVideos.map(video => {
                  const isSelected = selectedVideos.some(v => v.id === video.id);
                  const videoId = getYoutubeVideoId(video.youtubeUrl);
                  
                  return (
                    <div
                      key={video.id}
                      onClick={() => handleSelectVideo(video)}
                      className={`p-3 rounded-lg cursor-pointer transition-colors mb-2 ${
                        isSelected
                          ? 'bg-indigo-50 dark:bg-indigo-900/30 border border-indigo-300 dark:border-indigo-700'
                          : 'hover:bg-gray-50 dark:hover:bg-gray-700 border border-transparent'
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        {/* Thumbnail */}
                        {videoId && (
                          <img
                            src={`https://img.youtube.com/vi/${videoId}/mqdefault.jpg`}
                            alt={video.title}
                            className="w-20 h-12 object-cover rounded"
                            onError={(e) => {
                              e.target.style.display = 'none';
                            }}
                          />
                        )}
                        
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <h4 className="font-medium text-gray-900 dark:text-white truncate">
                              {video.title}
                            </h4>
                            {isSelected && (
                              <Check className="h-4 w-4 text-indigo-600 dark:text-indigo-400 flex-shrink-0" />
                            )}
                          </div>
                          
                          <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-1 mt-1">
                            {video.description}
                          </p>
                          
                          <div className="flex items-center gap-3 mt-2 text-xs text-gray-500 dark:text-gray-400">
                            {video.category && (
                              <span className="px-2 py-0.5 bg-gray-100 dark:bg-gray-700 rounded">
                                {video.category}
                              </span>
                            )}
                            {video.duration && (
                              <span className="flex items-center gap-1">
                                <Clock className="h-3 w-3" />
                                {video.duration}
                              </span>
                            )}
                            {video.instructor && (
                              <span>{video.instructor}</span>
                            )}
                          </div>
                        </div>

                        {video.youtubeUrl && (
                          <a
                            href={video.youtubeUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={(e) => e.stopPropagation()}
                            className="text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400"
                          >
                            <ExternalLink className="h-4 w-4" />
                          </a>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Footer */}
          {multiple && (
            <div className="p-3 border-t border-gray-200 dark:border-gray-700 flex justify-between items-center">
              <span className="text-sm text-gray-600 dark:text-gray-400">
                {selectedVideos.length} selezionati
              </span>
              <button
                onClick={() => setIsOpen(false)}
                className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 text-sm font-medium"
              >
                Conferma
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default VideoSelector;