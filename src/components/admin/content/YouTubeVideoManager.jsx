import React, { useState, useEffect } from 'react';
import { 
  collection, 
  doc, 
  getDocs, 
  setDoc, 
  deleteDoc, 
  updateDoc,
  query,
  where 
} from 'firebase/firestore';
import { db } from '../../../config/firebase';
import youtubeService from '../../../services/youtubeService';
import { 
  RefreshCw, 
  Plus, 
  Trash2, 
  Eye, 
  Tag, 
  Clock, 
  Users, 
  ExternalLink,
  Play,
  Settings,
  CheckCircle,
  AlertCircle,
  Search,
  Filter
} from 'lucide-react';

const YouTubeVideoManager = () => {
  const [youtubeVideos, setYoutubeVideos] = useState([]);
  const [appVideos, setAppVideos] = useState([]);
  const [loading, setLoading] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [selectedVideo, setSelectedVideo] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all'); // all, inApp, notInApp
  const [error, setError] = useState(null);

  useEffect(() => {
    loadAppVideos();
    syncYouTubeVideos();
  }, []);

  const loadAppVideos = async () => {
    try {
      const videosSnapshot = await getDocs(collection(db, 'videos'));
      const videos = videosSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setAppVideos(videos);
    } catch (error) {
      console.error('Error loading app videos:', error);
      setError('Errore nel caricamento dei video dall\'app');
    }
  };

  const syncYouTubeVideos = async () => {
    setSyncing(true);
    setError(null);
    try {
      console.log('🔄 Sincronizzando video da YouTube...');
      const videos = await youtubeService.getChannelVideos();
      setYoutubeVideos(videos);
      console.log(`✅ Trovati ${videos.length} video su YouTube`);
    } catch (error) {
      console.error('Error syncing YouTube videos:', error);
      setError('Errore nella sincronizzazione con YouTube. Verifica la connessione e la chiave API.');
    } finally {
      setSyncing(false);
    }
  };

  const addVideoToApp = async (youtubeVideo, tags = [], categories = []) => {
    try {
      const videoData = {
        // Dati da YouTube
        youtubeId: youtubeVideo.id,
        title: youtubeVideo.title,
        description: youtubeVideo.description,
        url: youtubeVideo.url,
        embedUrl: youtubeVideo.embedUrl,
        thumbnail: youtubeVideo.thumbnail.high || youtubeVideo.thumbnail.medium,
        duration: youtubeVideo.duration,
        viewCount: parseInt(youtubeVideo.viewCount),
        publishedAt: new Date(youtubeVideo.publishedAt),
        
        // Metadati app
        tags: tags,
        categories: categories,
        addedToAppAt: new Date(),
        isActive: true,
        source: 'youtube',
        
        // Compatibilità con sistema esistente
        type: 'youtube',
        createdAt: new Date(),
        updatedAt: new Date()
      };

      await setDoc(doc(db, 'videos', youtubeVideo.id), videoData);
      
      // Aggiorna stato locale
      setAppVideos(prev => [...prev, { id: youtubeVideo.id, ...videoData }]);
      
      console.log(`✅ Video "${youtubeVideo.title}" aggiunto all'app`);
      setShowModal(false);
      setSelectedVideo(null);
    } catch (error) {
      console.error('Error adding video to app:', error);
      setError('Errore nell\'aggiunta del video all\'app');
    }
  };

  const removeVideoFromApp = async (videoId) => {
    if (!confirm('Sei sicuro di voler rimuovere questo video dall\'app?')) return;
    
    try {
      await deleteDoc(doc(db, 'videos', videoId));
      setAppVideos(prev => prev.filter(v => v.id !== videoId));
      console.log(`✅ Video rimosso dall'app`);
    } catch (error) {
      console.error('Error removing video from app:', error);
      setError('Errore nella rimozione del video');
    }
  };

  const updateVideoInApp = async (videoId, updates) => {
    try {
      await updateDoc(doc(db, 'videos', videoId), {
        ...updates,
        updatedAt: new Date()
      });
      
      setAppVideos(prev => prev.map(v => 
        v.id === videoId ? { ...v, ...updates } : v
      ));
      
      console.log(`✅ Video aggiornato nell'app`);
    } catch (error) {
      console.error('Error updating video in app:', error);
      setError('Errore nell\'aggiornamento del video');
    }
  };

  const syncVideoData = async (youtubeVideo) => {
    try {
      const updates = {
        title: youtubeVideo.title,
        description: youtubeVideo.description,
        thumbnail: youtubeVideo.thumbnail.high || youtubeVideo.thumbnail.medium,
        duration: youtubeVideo.duration,
        viewCount: parseInt(youtubeVideo.viewCount),
        updatedAt: new Date()
      };
      
      await updateVideoInApp(youtubeVideo.id, updates);
      console.log(`🔄 Dati sincronizzati per "${youtubeVideo.title}"`);
    } catch (error) {
      console.error('Error syncing video data:', error);
    }
  };

  const getVideoStatus = (youtubeVideo) => {
    const appVideo = appVideos.find(v => v.youtubeId === youtubeVideo.id || v.id === youtubeVideo.id);
    return appVideo ? 'inApp' : 'notInApp';
  };

  const getAppVideoData = (youtubeVideo) => {
    return appVideos.find(v => v.youtubeId === youtubeVideo.id || v.id === youtubeVideo.id);
  };

  const filteredVideos = youtubeVideos.filter(video => {
    const matchesSearch = video.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         video.description.toLowerCase().includes(searchTerm.toLowerCase());
    
    if (!matchesSearch) return false;
    
    const status = getVideoStatus(video);
    if (filterStatus === 'inApp') return status === 'inApp';
    if (filterStatus === 'notInApp') return status === 'notInApp';
    return true;
  });

  const VideoCard = ({ video }) => {
    const status = getVideoStatus(video);
    const appVideoData = getAppVideoData(video);
    const formattedDuration = youtubeService.formatDuration(video.duration);
    const formattedViews = youtubeService.formatViewCount(video.viewCount);

    return (
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        {/* Thumbnail */}
        <div className="relative">
          <img 
            src={video.thumbnail.medium || video.thumbnail.default} 
            alt={video.title}
            className="w-full h-48 object-cover"
          />
          <div className="absolute bottom-2 right-2 bg-black bg-opacity-75 text-white px-2 py-1 rounded text-sm">
            {formattedDuration}
          </div>
          <div className="absolute top-2 left-2">
            {status === 'inApp' ? (
              <div className="bg-green-500 text-white px-2 py-1 rounded-full text-xs flex items-center space-x-1">
                <CheckCircle className="h-3 w-3" />
                <span>Nell'App</span>
              </div>
            ) : (
              <div className="bg-gray-500 text-white px-2 py-1 rounded-full text-xs">
                Non aggiunto
              </div>
            )}
          </div>
        </div>

        {/* Content */}
        <div className="p-4">
          <h3 className="font-semibold text-gray-900 mb-2 line-clamp-2">
            {video.title}
          </h3>
          
          <div className="flex items-center space-x-4 text-sm text-gray-600 mb-3">
            <div className="flex items-center space-x-1">
              <Users className="h-4 w-4" />
              <span>{formattedViews} views</span>
            </div>
            <div className="flex items-center space-x-1">
              <Clock className="h-4 w-4" />
              <span>{new Date(video.publishedAt).toLocaleDateString('it-IT')}</span>
            </div>
          </div>

          {/* Tags se presente nell'app */}
          {status === 'inApp' && appVideoData?.tags && appVideoData.tags.length > 0 && (
            <div className="mb-3">
              <div className="flex flex-wrap gap-1">
                {appVideoData.tags.map((tag, index) => (
                  <span key={index} className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full">
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Usage info se presente nell'app */}
          {status === 'inApp' && appVideoData && (
            <div className="mb-3 text-xs text-gray-500">
              Aggiunto il: {new Date(appVideoData.addedToAppAt?.toDate?.() || appVideoData.addedToAppAt).toLocaleDateString('it-IT')}
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <button
                onClick={() => window.open(video.url, '_blank')}
                className="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                title="Apri su YouTube"
              >
                <ExternalLink className="h-4 w-4" />
              </button>
              <button
                onClick={() => {
                  setSelectedVideo(video);
                  setShowModal(true);
                }}
                className="p-2 text-gray-600 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                title="Anteprima"
              >
                <Eye className="h-4 w-4" />
              </button>
            </div>

            <div className="flex items-center space-x-2">
              {status === 'inApp' ? (
                <>
                  <button
                    onClick={() => syncVideoData(video)}
                    className="px-3 py-1 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors text-sm"
                    title="Sincronizza dati"
                  >
                    <RefreshCw className="h-3 w-3" />
                  </button>
                  <button
                    onClick={() => {
                      setSelectedVideo(video);
                      setShowModal(true);
                    }}
                    className="px-3 py-1 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors text-sm"
                  >
                    <Settings className="h-3 w-3" />
                  </button>
                  <button
                    onClick={() => removeVideoFromApp(video.id)}
                    className="px-3 py-1 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors text-sm"
                  >
                    <Trash2 className="h-3 w-3" />
                  </button>
                </>
              ) : (
                <button
                  onClick={() => {
                    setSelectedVideo(video);
                    setShowModal(true);
                  }}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm flex items-center space-x-1"
                >
                  <Plus className="h-3 w-3" />
                  <span>Aggiungi</span>
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Gestione Video YouTube</h2>
          <p className="text-gray-600 mt-1">Sincronizza e gestisci i video dal canale "ilgabrio"</p>
        </div>
        <button
          onClick={syncYouTubeVideos}
          disabled={syncing}
          className="flex items-center space-x-2 bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50"
        >
          <RefreshCw className={`h-4 w-4 ${syncing ? 'animate-spin' : ''}`} />
          <span>{syncing ? 'Sincronizzando...' : 'Sincronizza Canale'}</span>
        </button>
      </div>

      {/* Error Display */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center space-x-2">
          <AlertCircle className="h-5 w-5 text-red-600" />
          <span className="text-red-700">{error}</span>
          <button
            onClick={() => setError(null)}
            className="ml-auto text-red-600 hover:text-red-800"
          >
            ×
          </button>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-blue-50 rounded-lg p-6">
          <div className="flex items-center">
            <Play className="h-8 w-8 text-blue-600 mr-3" />
            <div>
              <p className="text-blue-600 text-sm font-medium">Video su YouTube</p>
              <p className="text-2xl font-bold text-blue-900">{youtubeVideos.length}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-green-50 rounded-lg p-6">
          <div className="flex items-center">
            <CheckCircle className="h-8 w-8 text-green-600 mr-3" />
            <div>
              <p className="text-green-600 text-sm font-medium">Video nell'App</p>
              <p className="text-2xl font-bold text-green-900">
                {youtubeVideos.filter(v => getVideoStatus(v) === 'inApp').length}
              </p>
            </div>
          </div>
        </div>
        
        <div className="bg-gray-50 rounded-lg p-6">
          <div className="flex items-center">
            <Clock className="h-8 w-8 text-gray-600 mr-3" />
            <div>
              <p className="text-gray-600 text-sm font-medium">Non Aggiunti</p>
              <p className="text-2xl font-bold text-gray-900">
                {youtubeVideos.filter(v => getVideoStatus(v) === 'notInApp').length}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <input
            type="text"
            placeholder="Cerca video..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
        
        <div className="flex items-center space-x-2">
          <Filter className="h-4 w-4 text-gray-500" />
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="all">Tutti i video</option>
            <option value="inApp">Nell'app</option>
            <option value="notInApp">Non aggiunti</option>
          </select>
        </div>
      </div>

      {/* Video Grid */}
      {loading || syncing ? (
        <div className="text-center py-12">
          <RefreshCw className="h-8 w-8 animate-spin text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600">Caricamento video...</p>
        </div>
      ) : filteredVideos.length === 0 ? (
        <div className="text-center py-12">
          <Play className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Nessun video trovato</h3>
          <p className="text-gray-600">
            {youtubeVideos.length === 0 
              ? 'Sincronizza il canale per vedere i video' 
              : 'Prova a modificare i filtri di ricerca'
            }
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredVideos.map(video => (
            <VideoCard key={video.id} video={video} />
          ))}
        </div>
      )}

      {/* Modal for video preview and configuration */}
      {showModal && selectedVideo && (
        <VideoModal 
          video={selectedVideo}
          appVideoData={getAppVideoData(selectedVideo)}
          isInApp={getVideoStatus(selectedVideo) === 'inApp'}
          onClose={() => {
            setShowModal(false);
            setSelectedVideo(null);
          }}
          onAdd={(tags, categories) => addVideoToApp(selectedVideo, tags, categories)}
          onUpdate={(updates) => updateVideoInApp(selectedVideo.id, updates)}
        />
      )}
    </div>
  );
};

// Modal component per preview e configurazione video
const VideoModal = ({ video, appVideoData, isInApp, onClose, onAdd, onUpdate }) => {
  const [tags, setTags] = useState(appVideoData?.tags || []);
  const [categories, setCategories] = useState(appVideoData?.categories || []);
  const [newTag, setNewTag] = useState('');
  const [saving, setSaving] = useState(false);

  const availableTags = [
    'welcome', 'onboarding', 'step1', 'step2', 'step3', 
    'exercise', 'meditation', 'breathing', 'visualization',
    'motivation', 'performance', 'anxiety', 'confidence'
  ];

  const availableCategories = [
    'Introduzione', 'Tecniche di Base', 'Esercizi Avanzati',
    'Meditazione', 'Respirazione', 'Visualizzazione',
    'Gestione Ansia', 'Motivazione', 'Performance'
  ];

  const handleSave = async () => {
    setSaving(true);
    try {
      if (isInApp) {
        await onUpdate({ tags, categories });
      } else {
        await onAdd(tags, categories);
      }
      onClose();
    } catch (error) {
      console.error('Error saving video:', error);
    } finally {
      setSaving(false);
    }
  };

  const addTag = () => {
    if (newTag.trim() && !tags.includes(newTag.trim())) {
      setTags([...tags, newTag.trim()]);
      setNewTag('');
    }
  };

  const removeTag = (tagToRemove) => {
    setTags(tags.filter(tag => tag !== tagToRemove));
  };

  const toggleCategory = (category) => {
    setCategories(prev => 
      prev.includes(category) 
        ? prev.filter(c => c !== category)
        : [...prev, category]
    );
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <h3 className="text-xl font-semibold text-gray-900">
            {isInApp ? 'Configura Video' : 'Aggiungi Video all\'App'}
          </h3>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            ×
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Video Preview */}
          <div className="aspect-video">
            <iframe
              src={video.embedUrl}
              title={video.title}
              className="w-full h-full rounded-lg"
              allowFullScreen
            />
          </div>

          {/* Video Info */}
          <div>
            <h4 className="text-lg font-semibold mb-2">{video.title}</h4>
            <p className="text-gray-600 text-sm mb-4">{video.description}</p>
            <div className="flex items-center space-x-4 text-sm text-gray-500">
              <span>{youtubeService.formatDuration(video.duration)}</span>
              <span>{youtubeService.formatViewCount(video.viewCount)} views</span>
              <span>{new Date(video.publishedAt).toLocaleDateString('it-IT')}</span>
            </div>
          </div>

          {/* Tags Configuration */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Tag (usati per selezionare video in pagine specifiche)
            </label>
            
            {/* Current Tags */}
            <div className="flex flex-wrap gap-2 mb-3">
              {tags.map((tag, index) => (
                <span 
                  key={index}
                  className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-sm flex items-center space-x-1"
                >
                  <span>{tag}</span>
                  <button
                    onClick={() => removeTag(tag)}
                    className="text-blue-600 hover:text-blue-800"
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>

            {/* Quick Tags */}
            <div className="mb-3">
              <p className="text-xs text-gray-500 mb-2">Tag rapidi:</p>
              <div className="flex flex-wrap gap-1">
                {availableTags.filter(tag => !tags.includes(tag)).map(tag => (
                  <button
                    key={tag}
                    onClick={() => setTags([...tags, tag])}
                    className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded hover:bg-gray-200"
                  >
                    {tag}
                  </button>
                ))}
              </div>
            </div>

            {/* Add Custom Tag */}
            <div className="flex space-x-2">
              <input
                type="text"
                value={newTag}
                onChange={(e) => setNewTag(e.target.value)}
                placeholder="Aggiungi tag personalizzato..."
                className="flex-1 border border-gray-300 rounded-lg px-3 py-1 text-sm"
                onKeyPress={(e) => e.key === 'Enter' && addTag()}
              />
              <button
                onClick={addTag}
                className="bg-blue-600 text-white px-3 py-1 rounded-lg text-sm hover:bg-blue-700"
              >
                Aggiungi
              </button>
            </div>
          </div>

          {/* Categories */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Categorie
            </label>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
              {availableCategories.map(category => (
                <label key={category} className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={categories.includes(category)}
                    onChange={() => toggleCategory(category)}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-sm text-gray-700">{category}</span>
                </label>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end space-x-3 p-6 border-t bg-gray-50">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            Annulla
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center space-x-2"
          >
            {saving && <RefreshCw className="h-4 w-4 animate-spin" />}
            <span>{isInApp ? 'Aggiorna' : 'Aggiungi all\'App'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default YouTubeVideoManager;