import React, { useState, useRef, useEffect } from 'react';
import { 
  Play, 
  Pause, 
  Volume2, 
  VolumeX,
  SkipBack,
  SkipForward,
  Download,
  Loader,
  AlertCircle
} from 'lucide-react';

const AudioPlayer = ({ audioUrl, title, onClose }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const audioRef = useRef(null);
  const progressBarRef = useRef(null);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    // Debug logging
    console.log('🎵 AudioPlayer initialized with URL:', audioUrl);

    const handleLoadedMetadata = () => {
      console.log('✅ Audio metadata loaded');
      setDuration(audio.duration);
      setIsLoading(false);
    };

    const handleTimeUpdate = () => {
      setCurrentTime(audio.currentTime);
    };

    const handleError = (e) => {
      console.error('❌ Audio error:', e);
      console.error('Error details:', {
        code: audio.error?.code,
        message: audio.error?.message,
        src: audio.src,
        networkState: audio.networkState,
        readyState: audio.readyState
      });
      
      let errorMessage = 'Errore nel caricamento audio';
      if (audio.error) {
        switch (audio.error.code) {
          case 1:
            errorMessage = 'Caricamento audio interrotto';
            break;
          case 2:
            errorMessage = 'Errore di rete nel caricamento audio';
            break;
          case 3:
            errorMessage = 'Errore decodifica audio - formato non supportato';
            break;
          case 4:
            errorMessage = 'URL audio non valido o non trovato';
            break;
        }
      }
      
      setError(errorMessage);
      setIsLoading(false);
      setIsPlaying(false);
    };

    const handleCanPlay = () => {
      console.log('✅ Audio can play');
      setIsLoading(false);
    };

    const handlePlay = () => {
      console.log('▶️ Audio started playing');
      setIsPlaying(true);
    };

    const handlePause = () => {
      console.log('⏸️ Audio paused');
      setIsPlaying(false);
    };

    const handleLoadStart = () => {
      console.log('⏳ Audio loading started');
      setIsLoading(true);
      setError(null);
    };

    const handleEnded = () => {
      console.log('✅ Audio ended');
      setIsPlaying(false);
      setCurrentTime(0);
    };

    // Add event listeners
    audio.addEventListener('loadedmetadata', handleLoadedMetadata);
    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('error', handleError);
    audio.addEventListener('canplay', handleCanPlay);
    audio.addEventListener('play', handlePlay);
    audio.addEventListener('pause', handlePause);
    audio.addEventListener('loadstart', handleLoadStart);
    audio.addEventListener('ended', handleEnded);

    // Try to load the audio
    audio.load();

    return () => {
      audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('error', handleError);
      audio.removeEventListener('canplay', handleCanPlay);
      audio.removeEventListener('play', handlePlay);
      audio.removeEventListener('pause', handlePause);
      audio.removeEventListener('loadstart', handleLoadStart);
      audio.removeEventListener('ended', handleEnded);
    };
  }, [audioUrl]);

  const togglePlayPause = async () => {
    const audio = audioRef.current;
    if (!audio) {
      console.error('❌ Audio ref is null');
      return;
    }

    console.log('🎵 togglePlayPause called', {
      isPlaying,
      readyState: audio.readyState,
      networkState: audio.networkState,
      currentTime: audio.currentTime,
      duration: audio.duration,
      src: audio.src,
      paused: audio.paused
    });

    try {
      if (isPlaying) {
        console.log('⏸️ Pausing audio');
        audio.pause();
      } else {
        console.log('▶️ Attempting to play audio...');
        console.log('🔍 Audio state before play:', {
          readyState: audio.readyState,
          networkState: audio.networkState,
          error: audio.error,
          paused: audio.paused,
          ended: audio.ended
        });
        
        const playPromise = audio.play();
        
        if (playPromise !== undefined) {
          await playPromise;
          console.log('✅ Play promise resolved');
        }
      }
    } catch (error) {
      console.error('❌ Play/Pause error:', error);
      console.error('❌ Error details:', {
        name: error.name,
        message: error.message,
        code: error.code
      });
      setError(`Errore riproduzione: ${error.message}`);
    }
  };

  const handleProgressChange = (e) => {
    const audio = audioRef.current;
    if (!audio) return;
    
    const newTime = (e.target.value / 100) * duration;
    audio.currentTime = newTime;
    setCurrentTime(newTime);
  };

  const handleVolumeChange = (e) => {
    const audio = audioRef.current;
    if (!audio) return;
    
    const newVolume = e.target.value / 100;
    audio.volume = newVolume;
    setVolume(newVolume);
    setIsMuted(newVolume === 0);
  };

  const toggleMute = () => {
    const audio = audioRef.current;
    if (!audio) return;
    
    if (isMuted) {
      audio.volume = volume || 0.5;
      setIsMuted(false);
    } else {
      audio.volume = 0;
      setIsMuted(true);
    }
  };

  const skip = (seconds) => {
    const audio = audioRef.current;
    if (!audio) return;
    
    audio.currentTime = Math.max(0, Math.min(duration, audio.currentTime + seconds));
  };

  const formatTime = (time) => {
    if (!time || isNaN(time)) return '0:00';
    
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const getAudioSource = () => {
    console.log('🔍 getAudioSource called with audioUrl:', audioUrl);
    
    // Se l'URL è già completo (inizia con http o https), usalo così com'è
    if (audioUrl?.startsWith('http://') || audioUrl?.startsWith('https://')) {
      console.log('✅ Using complete HTTP(S) URL');
      return audioUrl;
    }
    
    // Se è un percorso relativo, assumiamo sia un file locale (per test)
    if (audioUrl?.startsWith('/')) {
      // In produzione, questi file dovrebbero essere su Firebase Storage
      console.warn('⚠️ Using relative audio path:', audioUrl);
      return audioUrl;
    }
    
    // Se è un URL di Firebase Storage parziale
    if (audioUrl?.includes('firebasestorage.googleapis.com')) {
      console.log('✅ Using Firebase Storage URL');
      return audioUrl;
    }
    
    // Fallback
    console.warn('⚠️ Unknown audio URL format:', audioUrl);
    return audioUrl;
  };

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 p-4 shadow-lg z-50">
      <div className="max-w-4xl mx-auto">
        {/* Error Message */}
        {error && (
          <div className="mb-4 p-3 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 rounded-lg flex items-center">
            <AlertCircle className="h-5 w-5 mr-2" />
            <span>{error}</span>
          </div>
        )}

        {/* Title */}
        <div className="mb-3 flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{title}</h3>
          {onClose && (
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
            >
              ✕
            </button>
          )}
        </div>

        {/* Progress Bar */}
        <div className="mb-3">
          <div className="flex items-center justify-between text-sm text-gray-500 dark:text-gray-400 mb-1">
            <span>{formatTime(currentTime)}</span>
            <span>{formatTime(duration)}</span>
          </div>
          <input
            ref={progressBarRef}
            type="range"
            min="0"
            max="100"
            value={duration ? (currentTime / duration) * 100 : 0}
            onChange={handleProgressChange}
            className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer slider"
            disabled={!duration || isLoading}
          />
        </div>

        {/* Controls */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            {/* Skip Back */}
            <button
              onClick={() => skip(-10)}
              className="p-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
              disabled={isLoading}
            >
              <SkipBack className="h-5 w-5" />
            </button>

            {/* Play/Pause */}
            <button
              onClick={togglePlayPause}
              className="p-3 bg-indigo-600 text-white rounded-full hover:bg-indigo-700 transition-colors disabled:opacity-50"
              disabled={isLoading || error}
            >
              {isLoading ? (
                <Loader className="h-6 w-6 animate-spin" />
              ) : isPlaying ? (
                <Pause className="h-6 w-6" />
              ) : (
                <Play className="h-6 w-6" />
              )}
            </button>

            {/* Skip Forward */}
            <button
              onClick={() => skip(10)}
              className="p-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
              disabled={isLoading}
            >
              <SkipForward className="h-5 w-5" />
            </button>
          </div>

          {/* Volume Control */}
          <div className="flex items-center space-x-2">
            <button
              onClick={toggleMute}
              className="p-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
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
              className="w-24 h-2 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer"
            />
          </div>

          {/* Download */}
          {audioUrl && !error && (
            <a
              href={getAudioSource()}
              download
              className="p-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
            >
              <Download className="h-5 w-5" />
            </a>
          )}
        </div>

        {/* Hidden Audio Element */}
        <audio
          ref={audioRef}
          src={getAudioSource()}
          preload="metadata"
          className="hidden"
        />

        {/* Debug Info (only in development) */}
        {process.env.NODE_ENV === 'development' && (
          <div className="mt-4 p-2 bg-gray-100 dark:bg-gray-900 rounded text-xs text-gray-600 dark:text-gray-400">
            <div>URL: {getAudioSource()}</div>
            <div>Status: {isLoading ? 'Loading' : error ? 'Error' : isPlaying ? 'Playing' : 'Ready'}</div>
            <div>Duration: {formatTime(duration)}</div>
          </div>
        )}
      </div>

      <style jsx>{`
        .slider::-webkit-slider-thumb {
          appearance: none;
          width: 12px;
          height: 12px;
          background: #4f46e5;
          cursor: pointer;
          border-radius: 50%;
        }
        
        .slider::-moz-range-thumb {
          width: 12px;
          height: 12px;
          background: #4f46e5;
          cursor: pointer;
          border-radius: 50%;
          border: none;
        }
      `}</style>
    </div>
  );
};

export default AudioPlayer;