import React, { useState, useEffect } from 'react';
import { db } from '../config/firebase';
import { collection, getDocs, doc, updateDoc } from 'firebase/firestore';
import { ArrowLeft, Save, Eye, Image, Play } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const AdminVideoImages = () => {
  const navigate = useNavigate();
  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [imageUrls, setImageUrls] = useState({});

  useEffect(() => {
    const fetchVideos = async () => {
      try {
        // Prova prima dalla collezione appVideos
        let videosList = [];
        try {
          const appVideosSnapshot = await getDocs(collection(db, 'appVideos'));
          videosList = appVideosSnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data(),
            collection: 'appVideos'
          }));
        } catch (error) {
          console.log('Collezione appVideos non trovata:', error);
        }
        
        // Se non ci sono video, prova dalla collezione videos
        if (videosList.length === 0) {
          try {
            const videosSnapshot = await getDocs(collection(db, 'videos'));
            videosList = videosSnapshot.docs.map(doc => ({
              id: doc.id,
              ...doc.data(),
              collection: 'videos'
            }));
          } catch (error) {
            console.log('Collezione videos non trovata:', error);
          }
        }
        
        setVideos(videosList);
        
        // Inizializza gli URL delle immagini
        const initialImageUrls = {};
        videosList.forEach(video => {
          initialImageUrls[video.id] = video.imageUrl || '';
        });
        setImageUrls(initialImageUrls);
        
        console.log('🎬 Video caricati per gestione immagini:', videosList);
      } catch (error) {
        console.error('Errore caricamento video:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchVideos();
  }, []);

  const handleImageUrlChange = (videoId, url) => {
    setImageUrls(prev => ({
      ...prev,
      [videoId]: url
    }));
  };

  const handleSave = async (video) => {
    setSaving(true);
    try {
      const collectionName = video.collection || 'appVideos';
      const videoDoc = doc(db, collectionName, video.id);
      await updateDoc(videoDoc, {
        imageUrl: imageUrls[video.id]
      });
      
      // Aggiorna anche l'array locale
      setVideos(prev => prev.map(vid => 
        vid.id === video.id 
          ? { ...vid, imageUrl: imageUrls[video.id] }
          : vid
      ));
      
      alert('✅ Immagine salvata!');
    } catch (error) {
      console.error('Errore salvataggio:', error);
      alert('❌ Errore nel salvataggio');
    } finally {
      setSaving(false);
    }
  };

  const handlePreview = (videoId) => {
    navigate(`/videos/${videoId}`);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-red-500 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-300">Caricamento video...</p>
        </div>
      </div>
    );
  }

  if (videos.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <Play className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
            Nessun video trovato
          </h2>
          <p className="text-gray-600 dark:text-gray-300 mb-4">
            Non ci sono video nel database da gestire.
          </p>
          <button
            onClick={() => navigate('/admin')}
            className="bg-red-500 hover:bg-red-600 text-white px-6 py-2 rounded-lg"
          >
            Torna all'Admin
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 shadow-sm">
        <div className="px-4 py-4">
          <button
            onClick={() => navigate('/admin')}
            className="flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white mb-4"
          >
            <ArrowLeft className="h-5 w-5" />
            <span>Torna all'Admin</span>
          </button>
          
          <div className="flex items-center gap-3 mb-2">
            <Image className="h-6 w-6 text-red-500" />
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              Gestione Immagini Video
            </h1>
          </div>
          
          <p className="text-gray-600 dark:text-gray-300">
            Aggiungi o modifica le immagini per i video. Inserisci l'URL completo dell'immagine (thumbnail o copertina).
          </p>
          
          <div className="mt-4 text-sm text-gray-500 dark:text-gray-400">
            Trovati <strong>{videos.length}</strong> video
          </div>
        </div>
      </div>

      <div className="px-4 py-6">
        <div className="space-y-4">
          {videos.map((video) => (
            <div key={video.id} className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
              <div className="flex flex-col lg:flex-row gap-6">
                {/* Info Video */}
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                      {video.title}
                    </h3>
                    <span className="text-xs px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded">
                      {video.collection}
                    </span>
                  </div>
                  
                  <p className="text-gray-600 dark:text-gray-300 text-sm mb-4">
                    {video.description?.substring(0, 150)}...
                  </p>
                  
                  {/* Video info aggiuntive */}
                  <div className="flex flex-wrap gap-4 text-xs text-gray-500 dark:text-gray-400 mb-4">
                    {video.category && (
                      <span className="px-2 py-1 bg-red-100 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded">
                        {video.category}
                      </span>
                    )}
                    {video.duration && (
                      <span>⏱️ {video.duration}</span>
                    )}
                    {video.views !== undefined && (
                      <span>👀 {video.views} visualizzazioni</span>
                    )}
                  </div>
                  
                  {/* Input URL Immagine */}
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      URL Immagine Copertina
                    </label>
                    <input
                      type="url"
                      value={imageUrls[video.id] || ''}
                      onChange={(e) => handleImageUrlChange(video.id, e.target.value)}
                      placeholder="https://esempio.com/thumbnail.jpg"
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    />
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      Immagine mostrata quando il video non è disponibile o come thumbnail
                    </p>
                  </div>

                  {/* Azioni */}
                  <div className="flex gap-3">
                    <button
                      onClick={() => handleSave(video)}
                      disabled={saving}
                      className="bg-red-500 hover:bg-red-600 disabled:opacity-50 text-white px-4 py-2 rounded-lg flex items-center gap-2"
                    >
                      <Save className="h-4 w-4" />
                      {saving ? 'Salvataggio...' : 'Salva'}
                    </button>
                    
                    <button
                      onClick={() => handlePreview(video.id)}
                      className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded-lg flex items-center gap-2"
                    >
                      <Eye className="h-4 w-4" />
                      Anteprima
                    </button>
                  </div>
                </div>

                {/* Preview Immagine */}
                <div className="lg:w-80">
                  {imageUrls[video.id] && (
                    <div>
                      <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Anteprima:
                      </p>
                      <div className="relative">
                        <img 
                          src={imageUrls[video.id]} 
                          alt={video.title}
                          className="w-full h-44 object-cover rounded-lg shadow-md"
                          style={{ aspectRatio: '16/9' }}
                          onError={(e) => {
                            e.target.style.display = 'none';
                            e.target.nextSibling.style.display = 'block';
                          }}
                        />
                        <div 
                          className="w-full h-44 bg-gray-200 dark:bg-gray-700 rounded-lg flex items-center justify-center text-gray-500 dark:text-gray-400 text-sm" 
                          style={{ display: 'none' }}
                        >
                          Immagine non caricabile
                        </div>
                        {/* Play overlay per indicare che è un video */}
                        <div className="absolute inset-0 bg-black bg-opacity-30 rounded-lg flex items-center justify-center">
                          <Play className="h-12 w-12 text-white opacity-80" />
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default AdminVideoImages;