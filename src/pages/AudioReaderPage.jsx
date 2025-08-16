import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { 
  ArrowLeft, 
  Clock, 
  Eye, 
  User, 
  Share2, 
  BookmarkPlus, 
  BookmarkCheck, 
  Calendar,
  Play,
  Pause,
  Volume2,
  VolumeX,
  SkipBack,
  SkipForward,
  Download,
  Headphones
} from 'lucide-react';
import { db } from '../config/firebase';
import { doc, getDoc, updateDoc, increment } from 'firebase/firestore';
import { useAuth } from '../context/AuthContext';

const AudioReaderPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const [audio, setAudio] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [viewsUpdated, setViewsUpdated] = useState(false);
  
  // Audio player state
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [isAudioLoading, setIsAudioLoading] = useState(true);
  const [audioError, setAudioError] = useState(null);
  const audioRef = useRef(null);

  useEffect(() => {
    const fetchAudio = async () => {
      try {
        console.log('🎵 Caricamento audio:', id);
        
        let audioData = null;
        let collectionUsed = null;
        
        // Prova audioContent
        try {
          const audioDoc = await getDoc(doc(db, 'audioContent', id));
          if (audioDoc.exists()) {
            audioData = { id: audioDoc.id, ...audioDoc.data() };
            collectionUsed = 'audioContent';
            console.log('✅ Audio caricato da audioContent:', audioData);
          }
        } catch (error) {
          console.log('⚠️ Errore da audioContent:', error);
        }
        
        // Se non trovato, prova appAudios
        if (!audioData) {
          try {
            const audioDoc = await getDoc(doc(db, 'appAudios', id));
            if (audioDoc.exists()) {
              audioData = { id: audioDoc.id, ...audioDoc.data() };
              collectionUsed = 'appAudios';
              console.log('✅ Audio caricato da appAudios:', audioData);
            }
          } catch (error) {
            console.log('⚠️ Errore da appAudios:', error);
          }
        }
        
        if (audioData) {
          console.log('🔍 Campi audio disponibili:', Object.keys(audioData));
          console.log('🔍 URL audio trovati:', {
            audioUrl: audioData.audioUrl,
            url: audioData.url,
            fileUrl: audioData.fileUrl
          });
          setAudio(audioData);
          
          // Incrementa le visualizzazioni/riproduzioni usando la collezione corretta
          if (!viewsUpdated && collectionUsed) {
            try {
              await updateDoc(doc(db, collectionUsed, id), {
                plays: increment(1)
              });
              console.log('✅ Riproduzioni incrementate in', collectionUsed);
              setViewsUpdated(true);
            } catch (error) {
              console.log('Non è stato possibile aggiornare le riproduzioni:', error);
            }
          }
        } else {
          console.log('❌ Audio non trovato');
          setError('Audio non trovato');
        }
      } catch (error) {
        console.error('Errore nel caricamento dell\'audio:', error);
        setError('Errore nel caricamento dell\'audio');
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchAudio();
    }
  }, [id, viewsUpdated]);

  // Audio player effects
  useEffect(() => {
    const audioElement = audioRef.current;
    if (!audioElement || !audio) return;

    const audioUrl = audio.audioUrl || audio.url || audio.fileUrl;
    if (!audioUrl) {
      setAudioError('URL audio non trovato');
      return;
    }

    console.log('🎵 Inizializzazione audio player con URL:', audioUrl);

    const handleLoadedMetadata = () => {
      console.log('✅ Metadati audio caricati');
      setDuration(audioElement.duration);
      setIsAudioLoading(false);
    };

    const handleTimeUpdate = () => {
      setCurrentTime(audioElement.currentTime);
    };

    const handleError = (e) => {
      console.error('❌ Errore audio:', e);
      setAudioError('Errore nel caricamento dell\'audio');
      setIsAudioLoading(false);
    };

    const handleCanPlay = () => {
      console.log('✅ Audio pronto per riproduzione');
      setIsAudioLoading(false);
    };

    const handlePlay = () => {
      console.log('▶️ Audio in riproduzione');
      setIsPlaying(true);
    };

    const handlePause = () => {
      console.log('⏸️ Audio in pausa');
      setIsPlaying(false);
    };

    const handleEnded = () => {
      console.log('✅ Audio terminato');
      setIsPlaying(false);
      setCurrentTime(0);
    };

    // Add event listeners
    audioElement.addEventListener('loadedmetadata', handleLoadedMetadata);
    audioElement.addEventListener('timeupdate', handleTimeUpdate);
    audioElement.addEventListener('error', handleError);
    audioElement.addEventListener('canplay', handleCanPlay);
    audioElement.addEventListener('play', handlePlay);
    audioElement.addEventListener('pause', handlePause);
    audioElement.addEventListener('ended', handleEnded);

    // Set volume
    audioElement.volume = volume;
    audioElement.muted = isMuted;

    return () => {
      audioElement.removeEventListener('loadedmetadata', handleLoadedMetadata);
      audioElement.removeEventListener('timeupdate', handleTimeUpdate);
      audioElement.removeEventListener('error', handleError);
      audioElement.removeEventListener('canplay', handleCanPlay);
      audioElement.removeEventListener('play', handlePlay);
      audioElement.removeEventListener('pause', handlePause);
      audioElement.removeEventListener('ended', handleEnded);
    };
  }, [audio, volume, isMuted]);

  const formatDate = (date) => {
    if (!date) return '';
    const audioDate = date instanceof Date ? date : date.toDate();
    return audioDate.toLocaleDateString('it-IT', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  };

  const formatTime = (time) => {
    if (!time || isNaN(time)) return '0:00';
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const formatPlays = (plays) => {
    if (!plays) return '0';
    if (plays >= 1000) {
      return `${(plays / 1000).toFixed(1)}k`;
    }
    return plays.toString();
  };

  const togglePlayPause = async () => {
    const audioElement = audioRef.current;
    if (!audioElement) return;

    try {
      if (isPlaying) {
        audioElement.pause();
      } else {
        await audioElement.play();
      }
    } catch (error) {
      console.error('❌ Errore riproduzione:', error);
      setAudioError('Errore nella riproduzione');
    }
  };

  const handleSeek = (e) => {
    const audioElement = audioRef.current;
    if (!audioElement || !duration) return;
    
    const newTime = (e.target.value / 100) * duration;
    audioElement.currentTime = newTime;
    setCurrentTime(newTime);
  };

  const handleVolumeChange = (e) => {
    const newVolume = e.target.value / 100;
    setVolume(newVolume);
    if (audioRef.current) {
      audioRef.current.volume = newVolume;
    }
    if (newVolume > 0) {
      setIsMuted(false);
    }
  };

  const toggleMute = () => {
    setIsMuted(!isMuted);
    if (audioRef.current) {
      audioRef.current.muted = !isMuted;
    }
  };

  const skip = (seconds) => {
    const audioElement = audioRef.current;
    if (!audioElement) return;
    
    const newTime = Math.max(0, Math.min(duration, currentTime + seconds));
    audioElement.currentTime = newTime;
    setCurrentTime(newTime);
  };

  const handleShare = async () => {
    if (navigator.share && audio) {
      try {
        await navigator.share({
          title: audio.title,
          text: audio.description,
          url: window.location.href
        });
      } catch (error) {
        console.log('Condivisione annullata');
      }
    } else {
      navigator.clipboard.writeText(window.location.href);
      alert('Link copiato negli appunti!');
    }
  };

  const toggleBookmark = () => {
    setIsBookmarked(!isBookmarked);
  };

  const getAudioUrl = () => {
    if (!audio) return '';
    return audio.audioUrl || audio.url || audio.fileUrl || '';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-purple-400 mx-auto mb-4"></div>
          <p className="text-gray-300">Caricamento audio...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-400 text-6xl mb-4">🎧</div>
          <h2 className="text-2xl font-bold text-white mb-2">Audio non trovato</h2>
          <p className="text-gray-300 mb-4">{error}</p>
          <button
            onClick={() => navigate('/audio')}
            className="inline-flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-500 transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Torna agli audio
          </button>
        </div>
      </div>
    );
  }

  if (!audio) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-900">
      {/* Header con navigazione */}
      <div className="sticky top-0 bg-gray-800 border-b border-gray-700 z-10">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <button
              onClick={() => navigate('/audio')}
              className="inline-flex items-center gap-2 text-gray-300 hover:text-white transition-colors"
            >
              <ArrowLeft className="h-4 w-4" />
              <span className="font-medium">Torna agli audio</span>
            </button>
            
            <div className="flex items-center gap-2">
              <button
                onClick={handleShare}
                className="p-2 text-gray-400 hover:text-gray-200 transition-colors"
                title="Condividi audio"
              >
                <Share2 className="h-5 w-5" />
              </button>
              
              <button
                onClick={toggleBookmark}
                className={`p-2 transition-colors ${
                  isBookmarked 
                    ? 'text-purple-400 hover:text-purple-300' 
                    : 'text-gray-400 hover:text-gray-200'
                }`}
                title={isBookmarked ? 'Rimuovi dai segnalibri' : 'Aggiungi ai segnalibri'}
              >
                {isBookmarked ? (
                  <BookmarkCheck className="h-5 w-5" />
                ) : (
                  <BookmarkPlus className="h-5 w-5" />
                )}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Contenuto principale */}
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Header dell'audio con immagine */}
        <header className="mb-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
            {/* Lato sinistro - Informazioni */}
            <div>
              {/* Categoria */}
              {audio.category && (
                <div className="mb-4">
                  <span className="inline-block px-3 py-1 text-sm font-medium text-purple-300 bg-purple-900/30 rounded-full">
                    {audio.category}
                  </span>
                </div>
              )}
              
              {/* Titolo */}
              <h1 className="text-4xl font-bold text-white mb-4 leading-tight">
                {audio.title}
              </h1>
              
              {/* Descrizione */}
              {audio.description && (
                <p className="text-xl text-gray-300 mb-6 leading-relaxed">
                  {audio.description}
                </p>
              )}
            </div>

            {/* Lato destro - Immagine */}
            <div className="flex justify-center lg:justify-end">
              {audio.imageUrl ? (
                <div className="relative overflow-hidden rounded-2xl shadow-2xl max-w-sm w-full">
                  <img 
                    src={audio.imageUrl} 
                    alt={audio.title}
                    className="w-full h-auto object-cover aspect-square"
                    onError={(e) => {
                      e.target.style.display = 'none';
                      e.target.nextSibling.style.display = 'flex';
                    }}
                  />
                  {/* Fallback se l'immagine non carica */}
                  <div className="hidden w-full aspect-square bg-gradient-to-br from-purple-600 to-blue-600 flex items-center justify-center">
                    <Headphones className="h-24 w-24 text-white/70" />
                  </div>
                </div>
              ) : (
                <div className="w-full max-w-sm aspect-square bg-gradient-to-br from-purple-600 to-blue-600 rounded-2xl shadow-2xl flex items-center justify-center">
                  <Headphones className="h-24 w-24 text-white/70" />
                </div>
              )}
            </div>
          </div>
          
          {/* Meta informazioni */}
          <div className="flex flex-wrap items-center gap-6 text-sm text-gray-400 pb-6 border-b border-gray-700 mt-8">
            {audio.instructor && (
              <div className="flex items-center gap-2">
                <User className="h-4 w-4" />
                <span>di {audio.instructor}</span>
              </div>
            )}
            
            {audio.publishedAt && (
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                <span>{formatDate(audio.publishedAt)}</span>
              </div>
            )}
            
            {audio.duration && (
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4" />
                <span>{audio.duration}</span>
              </div>
            )}
            
            <div className="flex items-center gap-2">
              <Headphones className="h-4 w-4" />
              <span>{formatPlays(audio.plays || 0)} ascolti</span>
            </div>
          </div>
        </header>

        {/* Audio Player */}
        <div className="bg-gradient-to-r from-gray-800 to-gray-700 rounded-xl p-8 mb-8 border border-gray-600">
          <div className="text-center mb-6">
            <Headphones className="h-16 w-16 text-purple-400 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-white mb-2">Player Audio</h2>
            <p className="text-gray-300">Ascolta questo contenuto audio</p>
          </div>

          {/* Audio Element */}
          <audio
            ref={audioRef}
            src={getAudioUrl()}
            preload="metadata"
            className="hidden"
          />

          {/* Error Message */}
          {audioError && (
            <div className="mb-6 p-4 bg-red-900/30 text-red-300 rounded-lg text-center border border-red-800">
              {audioError}
            </div>
          )}

          {/* Progress Bar */}
          <div className="mb-6">
            <div className="flex items-center justify-between text-sm text-gray-400 mb-2">
              <span>{formatTime(currentTime)}</span>
              <span>{formatTime(duration)}</span>
            </div>
            <input
              type="range"
              min="0"
              max="100"
              value={duration ? (currentTime / duration) * 100 : 0}
              onChange={handleSeek}
              className="w-full h-2 bg-gray-600 rounded-lg appearance-none cursor-pointer slider-purple"
              disabled={!duration || isAudioLoading}
            />
          </div>

          {/* Controls */}
          <div className="flex items-center justify-center space-x-4">
            {/* Skip Back */}
            <button
              onClick={() => skip(-10)}
              className="p-2 text-gray-300 hover:text-white transition-colors"
              disabled={isAudioLoading}
            >
              <SkipBack className="h-6 w-6" />
            </button>

            {/* Play/Pause */}
            <button
              onClick={togglePlayPause}
              className="p-4 bg-purple-600 text-white rounded-full hover:bg-purple-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={isAudioLoading || audioError}
            >
              {isAudioLoading ? (
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white" />
              ) : isPlaying ? (
                <Pause className="h-8 w-8" />
              ) : (
                <Play className="h-8 w-8 ml-1" />
              )}
            </button>

            {/* Skip Forward */}
            <button
              onClick={() => skip(10)}
              className="p-2 text-gray-300 hover:text-white transition-colors"
              disabled={isAudioLoading}
            >
              <SkipForward className="h-6 w-6" />
            </button>
          </div>

          {/* Volume Control */}
          <div className="flex items-center justify-center space-x-2 mt-4">
            <button
              onClick={toggleMute}
              className="p-2 text-gray-300 hover:text-white transition-colors"
            >
              {isMuted || volume === 0 ? (
                <VolumeX className="h-5 w-5" />
              ) : (
                <Volume2 className="h-5 w-5" />
              )}
            </button>
            <input
              type="range"
              min="0"
              max="100"
              value={isMuted ? 0 : volume * 100}
              onChange={handleVolumeChange}
              className="w-24 h-2 bg-gray-600 rounded-lg appearance-none cursor-pointer slider-purple"
            />
          </div>
        </div>

        {/* Trascrizione */}
        {audio.transcript && (
          <div className="bg-gray-800 border border-gray-600 rounded-lg p-6 mb-8">
            <h3 className="text-lg font-semibold text-white mb-4">Trascrizione</h3>
            <p className="text-gray-300 leading-relaxed italic">
              {audio.transcript}
            </p>
          </div>
        )}

        {/* Tags */}
        {audio.tags && audio.tags.length > 0 && (
          <div className="bg-gray-800 border border-gray-600 rounded-lg p-6 mb-8">
            <h3 className="text-lg font-semibold text-white mb-4">Tag</h3>
            <div className="flex flex-wrap gap-2">
              {audio.tags.map((tag, index) => (
                <span
                  key={index}
                  className="px-3 py-1 bg-purple-900/30 text-purple-300 text-sm rounded-full"
                >
                  #{tag}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Actions Footer */}
        <footer className="pt-8 border-t border-gray-700">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={toggleBookmark}
                className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${
                  isBookmarked
                    ? 'bg-purple-900/30 text-purple-300 hover:bg-purple-900/40'
                    : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                }`}
              >
                {isBookmarked ? (
                  <>
                    <BookmarkCheck className="h-4 w-4" />
                    Salvato
                  </>
                ) : (
                  <>
                    <BookmarkPlus className="h-4 w-4" />
                    Salva audio
                  </>
                )}
              </button>
              
              <button
                onClick={handleShare}
                className="inline-flex items-center gap-2 px-4 py-2 bg-gray-700 text-gray-300 rounded-lg hover:bg-gray-600 transition-colors"
              >
                <Share2 className="h-4 w-4" />
                Condividi
              </button>

              {getAudioUrl() && (
                <a
                  href={getAudioUrl()}
                  download
                  className="inline-flex items-center gap-2 px-4 py-2 bg-gray-700 text-gray-300 rounded-lg hover:bg-gray-600 transition-colors"
                >
                  <Download className="h-4 w-4" />
                  Scarica
                </a>
              )}
            </div>
            
            <button
              onClick={() => navigate('/audio')}
              className="inline-flex items-center gap-2 px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-500 transition-colors"
            >
              Ascolta altri audio
            </button>
          </div>
        </footer>
      </div>
    </div>
  );
};

export default AudioReaderPage;