import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Play, Clock, Calendar, Share2, ThumbsUp, Eye, User } from 'lucide-react';
import { doc, getDoc, updateDoc, increment } from 'firebase/firestore';
import { db } from '../config/firebase';
import { useTheme } from '../context/ThemeContext';
import { getYouTubeEmbedUrl, getYouTubeThumbnail } from '../utils/youtubeUtils';

const VideoDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isDarkMode } = useTheme();
  const [video, setVideo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [liked, setLiked] = useState(false);

  useEffect(() => {
    if (id) {
      fetchVideo();
    }
  }, [id]);

  const fetchVideo = async () => {
    try {
      console.log('🎬 Caricamento video con ID:', id);
      
      // Prima prova appVideos
      let videoDoc = await getDoc(doc(db, 'appVideos', id));
      
      if (!videoDoc.exists()) {
        // Se non trovato in appVideos, prova videos
        videoDoc = await getDoc(doc(db, 'videos', id));
      }
      
      if (videoDoc.exists()) {
        const videoData = { id: videoDoc.id, ...videoDoc.data() };
        console.log('✅ Video trovato:', videoData);
        setVideo(videoData);
        
        // Incrementa visualizzazioni
        try {
          await updateDoc(videoDoc.ref, {
            views: increment(1)
          });
        } catch (error) {
          console.log('Could not update views:', error);
        }
      } else {
        console.log('❌ Video non trovato');
      }
    } catch (error) {
      console.error('Errore nel caricamento del video:', error);
    } finally {
      setLoading(false);
    }
  };

  const getVideoUrl = (video) => {
    console.log('🔍 Analisi video per embed:', video);
    
    // Cerca l'URL o ID YouTube in TUTTI i campi possibili del video
    const possibleFields = [
      'youtubeUrl',
      'youtubeID',
      'youtubeId', 
      'youtube_id',
      'videoId',
      'videoID',
      'url',
      'videoUrl',
      'link',
      'embedUrl'
    ];
    
    let urlOrId = null;
    
    // Prova ogni campo possibile
    for (const field of possibleFields) {
      if (video[field]) {
        urlOrId = video[field];
        console.log(`✅ Trovato in campo '${field}':`, urlOrId);
        break;
      }
    }
    
    if (!urlOrId) {
      console.log('❌ Nessun URL YouTube trovato. Campi disponibili:', Object.keys(video));
      return null;
    }
    
    // Usa la utility function per generare l'URL embed
    const embedUrl = getYouTubeEmbedUrl(urlOrId);
    
    if (!embedUrl) {
      console.log('❌ Impossibile generare URL embed da:', urlOrId);
    }
    
    return embedUrl;
  };

  const handleLike = async () => {
    setLiked(!liked);
    
    if (!liked && video) {
      try {
        const videoRef = doc(db, video.collection || 'appVideos', video.id);
        await updateDoc(videoRef, {
          likes: increment(1)
        });
      } catch (error) {
        console.log('Could not update likes:', error);
      }
    }
  };

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: video.title,
        text: video.description,
        url: window.location.href
      });
    } else {
      // Fallback: copia URL negli appunti
      navigator.clipboard.writeText(window.location.href);
      alert('Link copiato negli appunti!');
    }
  };

  const formatDate = (date) => {
    if (!date) return '';
    const d = date.toDate ? date.toDate() : new Date(date);
    return d.toLocaleDateString('it-IT', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  };

  // CARICAMENTO DATI REALI E DESIGN MODERNO
  
  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Caricamento video...</p>
        </div>
      </div>
    );
  }

  if (!video) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center max-w-md mx-auto p-8">
          <div className="w-16 h-16 mx-auto mb-4 text-gray-300">
            <Play className="w-full h-full" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-3">
            Video non trovato
          </h2>
          <p className="text-gray-600 mb-6">
            Il video che stai cercando non è disponibile o non esiste.
          </p>
          <button
            onClick={() => navigate('/videos')}
            className="bg-red-500 hover:bg-red-600 text-white px-6 py-3 rounded-lg font-medium transition-colors"
          >
            Torna ai video
          </button>
        </div>
      </div>
    );
  }

  const embedUrl = getVideoUrl(video);

  return (
    <div className="min-h-screen bg-white">
      {/* Header con back button */}
      <div className="bg-white border-b border-gray-100 sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-4 py-4">
          <button
            onClick={() => navigate('/videos')}
            className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors group"
          >
            <ArrowLeft className="h-5 w-5 group-hover:-translate-x-1 transition-transform" />
            <span className="font-medium">Torna ai video</span>
          </button>
        </div>
      </div>

      {/* Video Player */}
      <div className="relative w-full bg-black">
        <div className="aspect-video max-w-6xl mx-auto">
          {embedUrl ? (
            <iframe
              src={embedUrl}
              className="w-full h-full"
              frameBorder="0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
              allowFullScreen
              title={video.title}
            />
          ) : (
            // Se non c'è video ma c'è un'immagine, mostrala
            video.imageUrl ? (
              <div className="w-full h-full relative bg-gray-900 flex items-center justify-center">
                <img 
                  src={video.imageUrl} 
                  alt={video.title}
                  className="max-w-full max-h-full object-contain"
                />
                <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
                  <div className="text-center text-white">
                    <Play className="h-20 w-20 mx-auto mb-4" />
                    <p className="text-xl mb-2">Video non disponibile</p>
                    <p className="text-sm opacity-75">
                      L'URL del video non è configurato
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-gray-900">
                <div className="text-center text-white">
                  <Play className="h-20 w-20 mx-auto mb-4 opacity-50" />
                  <p className="text-xl mb-2">Video non disponibile</p>
                  <p className="text-sm opacity-75">
                    L'URL del video non è configurato correttamente
                  </p>
                </div>
              </div>
            )
          )}
        </div>
      </div>

      {/* Contenuto principale */}
      <article className="max-w-6xl mx-auto px-4 py-8">
        {/* Categoria */}
        {video.category && (
          <div className="mb-4">
            <span className="inline-flex items-center px-3 py-1 text-sm font-medium text-red-700 bg-red-100 rounded-full">
              {video.category}
            </span>
          </div>
        )}

        {/* Titolo */}
        <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4 leading-tight">
          {video.title}
        </h1>

        {/* Meta info */}
        <div className="flex flex-wrap items-center gap-6 text-sm text-gray-500 mb-8 pb-6 border-b border-gray-100">
          {video.views !== undefined && (
            <div className="flex items-center gap-2">
              <Eye className="h-4 w-4" />
              <span>{video.views || 0} visualizzazioni</span>
            </div>
          )}
          
          {video.duration && (
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4" />
              <span>{video.duration}</span>
            </div>
          )}
          
          {video.createdAt && (
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              <span>{formatDate(video.createdAt)}</span>
            </div>
          )}
          
          {video.instructor && (
            <div className="flex items-center gap-2">
              <User className="h-4 w-4" />
              <span>di {video.instructor}</span>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-4 mb-8">
          <button
            onClick={handleLike}
            className={`flex items-center gap-2 px-6 py-3 rounded-lg font-medium transition-colors ${
              liked 
                ? 'bg-red-100 text-red-700 hover:bg-red-200' 
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            <ThumbsUp className={`h-5 w-5 ${liked ? 'fill-current' : ''}`} />
            <span>{liked ? 'Ti piace' : 'Mi piace'}</span>
            {video.likes > 0 && <span>({video.likes})</span>}
          </button>
          
          <button
            onClick={handleShare}
            className="flex items-center gap-2 px-6 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors font-medium"
          >
            <Share2 className="h-5 w-5" />
            <span>Condividi</span>
          </button>
        </div>

        {/* Descrizione */}
        {video.description && (
          <div className="mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              Descrizione
            </h2>
            <div className="bg-gray-50 rounded-xl p-6">
              <p className="text-gray-800 leading-relaxed whitespace-pre-wrap">
                {video.description}
              </p>
            </div>
          </div>
        )}

        {/* Tags */}
        {video.tags && video.tags.length > 0 && (
          <div className="mb-8">
            <h3 className="text-lg font-semibold text-gray-900 mb-3">Tag</h3>
            <div className="flex flex-wrap gap-2">
              {video.tags.map((tag, index) => (
                <span
                  key={index}
                  className="px-3 py-1 bg-gray-100 text-gray-700 text-sm rounded-full"
                >
                  #{tag}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Info aggiuntive */}
        {video.level && (
          <div className="mb-8">
            <div className="bg-gray-50 rounded-xl p-6">
              <div className="flex items-center gap-3">
                <span className="text-sm font-medium text-gray-600">Livello di difficoltà:</span>
                <span className="px-3 py-1 bg-red-100 text-red-700 text-sm font-medium rounded-full">
                  {video.level}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Footer con CTA */}
        <div className="bg-gray-50 rounded-xl p-8 text-center">
          <h3 className="text-xl font-semibold text-gray-900 mb-3">
            Ti è piaciuto questo video?
          </h3>
          <p className="text-gray-600 mb-6">
            Scopri altri contenuti per migliorare la tua mentalità sportiva
          </p>
          <button
            onClick={() => navigate('/videos')}
            className="bg-red-500 hover:bg-red-600 text-white px-8 py-3 rounded-lg font-semibold transition-colors shadow-lg hover:shadow-xl"
          >
            Guarda altri video
          </button>
        </div>
      </article>
    </div>
  );
};

export default VideoDetailPage;