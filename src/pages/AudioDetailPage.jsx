import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Clock, User, PlayCircle, Download, Share, Play } from 'lucide-react';
import { db } from '../config/firebase';
import { doc, getDoc } from 'firebase/firestore';
import AudioPlayer from '../components/AudioPlayer';

const AudioDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [audio, setAudio] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);

  useEffect(() => {
    const fetchAudio = async () => {
      try {
        // CARICA AUDIO REALE
        const audioDoc = await getDoc(doc(db, 'audioContent', id));
        if (audioDoc.exists()) {
          const realAudio = { id: audioDoc.id, ...audioDoc.data() };
          setAudio(realAudio);
          console.log('🎵 Audio reale caricato:', realAudio);
        } else {
          // Fallback
          setAudio({
            id: id,
            title: `Audio ${id}`,
            description: 'Audio non trovato nel database'
          });
        }
      } catch (error) {
        console.error('Errore:', error);
        setAudio({
          id: id,
          title: `Audio ${id}`,
          description: 'Errore nel caricamento'
        });
      }
      setLoading(false);
      return; // SKIP tutto il caricamento vecchio
      
      try {
        console.log('🎵 Loading audio with ID:', id);
        
        // Try to fetch from Firebase first
        let audioData = null;
        
        // Prova audioContent
        try {
          const audioDoc = await getDoc(doc(db, 'audioContent', id));
          if (audioDoc.exists()) {
            audioData = { id: audioDoc.id, ...audioDoc.data() };
            console.log('✅ Audio loaded from audioContent:', audioData);
          }
        } catch (error) {
          console.log('⚠️ Error from audioContent:', error);
        }
        
        // Se non trovato, prova appAudios
        if (!audioData) {
          try {
            const audioDoc = await getDoc(doc(db, 'appAudios', id));
            if (audioDoc.exists()) {
              audioData = { id: audioDoc.id, ...audioDoc.data() };
              console.log('✅ Audio loaded from appAudios:', audioData);
            }
          } catch (error) {
            console.log('⚠️ Error from appAudios:', error);
          }
        }
        
        if (audioData) {
          console.log('🔍 Audio fields available:', Object.keys(audioData));
          console.log('🔍 Audio URLs found:', {
            audioUrl: audioData.audioUrl,
            url: audioData.url,
            fileUrl: audioData.fileUrl
          });
          setAudio(audioData);
        } else {
          // If not found in Firebase, check mock data
          const mockAudios = [
            {
              id: '1',
              title: 'Meditazione Pre-Gara',
              description: 'Una sessione guidata di meditazione per prepararsi mentalmente alla competizione. Questo audio ti guiderà attraverso tecniche di respirazione profonda e visualizzazione per raggiungere uno stato di calma concentrata prima della performance sportiva.',
              audioUrl: '/audio/meditation-pre-game.mp3',
              duration: '15:30',
              category: 'Meditazione',
              instructor: 'Marco Zen',
              plays: 4500,
              type: 'meditation',
              transcript: 'Benvenuto in questa sessione di meditazione pre-gara. Iniziamo trovando una posizione comoda...',
              tags: ['meditazione', 'pre-gara', 'concentrazione', 'rilassamento']
            },
            {
              id: '2',
              title: 'Affermazioni Positive',
              description: 'Potenti affermazioni per rafforzare la fiducia in se stessi e migliorare l\'autostima durante l\'allenamento e la competizione.',
              audioUrl: '/audio/positive-affirmations.mp3',
              duration: '8:45',
              category: 'Motivazione',
              instructor: 'Anna Forza',
              plays: 3200,
              type: 'affirmations',
              transcript: 'Io sono forte, io sono capace, io posso raggiungere i miei obiettivi...',
              tags: ['affermazioni', 'motivazione', 'autostima', 'fiducia']
            },
            {
              id: '3',
              title: 'Respirazione Profonda',
              description: 'Esercizi di respirazione per rilassamento e controllo dell\'ansia. Impara le tecniche fondamentali per gestire lo stress.',
              audioUrl: '/audio/deep-breathing.mp3',
              duration: '12:15',
              category: 'Respirazione',
              instructor: 'Dr. Calma',
              plays: 5800,
              type: 'breathing',
              transcript: 'Inspiria lentamente attraverso il naso, trattieni per tre secondi...',
              tags: ['respirazione', 'rilassamento', 'ansia', 'controllo']
            },
            {
              id: '4',
              title: 'Visualizzazione Vittoria',
              description: 'Sessione di visualizzazione per immaginare il successo sportivo e programmare la mente al raggiungimento degli obiettivi.',
              audioUrl: '/audio/victory-visualization.mp3',
              duration: '18:20',
              category: 'Visualizzazione',
              instructor: 'Prof. Visioni',
              plays: 2900,
              type: 'visualization',
              transcript: 'Immagina di essere sul podio, senti il peso della medaglia al collo...',
              tags: ['visualizzazione', 'successo', 'obiettivi', 'vittoria']
            }
          ];

          const mockAudio = mockAudios.find(a => a.id === id);
          if (mockAudio) {
            console.log('📝 Using mock audio data:', mockAudio);
            setAudio(mockAudio);
          } else {
            setError('Audio non trovato');
          }
        }
      } catch (error) {
        console.error('❌ Error loading audio:', error);
        setError('Errore nel caricamento dell\'audio');
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchAudio();
    }
  }, [id]);

  const handlePlayToggle = () => {
    setIsPlaying(!isPlaying);
  };

  const handleClosePlayer = () => {
    setIsPlaying(false);
  };

  const getTypeIcon = (type) => {
    switch(type) {
      case 'meditation': return '🧘‍♂️';
      case 'affirmations': return '💪';
      case 'breathing': return '🫁';
      case 'visualization': return '👁️';
      default: return '🎧';
    }
  };

  const getTypeColor = (type) => {
    switch(type) {
      case 'meditation': return 'text-purple-600 bg-purple-100 dark:bg-purple-900/20 dark:text-purple-400';
      case 'affirmations': return 'text-orange-600 bg-orange-100 dark:bg-orange-900/20 dark:text-orange-400';
      case 'breathing': return 'text-blue-600 bg-blue-100 dark:bg-blue-900/20 dark:text-blue-400';
      case 'visualization': return 'text-green-600 bg-green-100 dark:bg-green-900/20 dark:text-green-400';
      default: return 'text-gray-600 bg-gray-100 dark:bg-gray-700 dark:text-gray-300';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-indigo-500 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-300">Caricamento audio...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-500 mb-4">
            <PlayCircle className="h-16 w-16 mx-auto opacity-50" />
          </div>
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">{error}</h2>
          <button
            onClick={() => navigate('/audio')}
            className="text-indigo-600 hover:text-indigo-800 dark:text-indigo-400"
          >
            Torna agli audio
          </button>
        </div>
      </div>
    );
  }

  if (!audio) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">Audio non trovato</h2>
          <button
            onClick={() => navigate('/audio')}
            className="text-indigo-600 hover:text-indigo-800 dark:text-indigo-400"
          >
            Torna agli audio
          </button>
        </div>
      </div>
    );
  }

  // APPROCCIO SEMPLICE: SOLO LINK DIRETTO
  console.log('🔍 RENDER CHECK - audio:', audio);
  console.log('🔍 RENDER CHECK - audioUrl:', audio?.audioUrl);
  console.log('🔍 RENDER CHECK - url:', audio?.url);
  
  if (audio?.audioUrl || audio?.url) {
    console.log('🟢 RENDERING AUDIO PAGE');
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto p-6">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
            {audio.title}
          </h1>
          
          {/* Immagine Audio */}
          {audio.imageUrl && (
            <div className="mb-6">
              <img 
                src={audio.imageUrl} 
                alt={audio.title}
                className="w-full max-w-sm mx-auto rounded-lg shadow-lg object-cover"
                style={{ aspectRatio: '1/1', maxHeight: '300px' }}
                onError={(e) => {
                  e.target.style.display = 'none';
                }}
              />
            </div>
          )}
          
          <div className="bg-blue-100 dark:bg-blue-900 rounded-lg p-4 mb-6">
            <p className="text-blue-800 dark:text-blue-200 text-sm mb-2">
              Clicca qui per ascoltare l'audio:
            </p>
            <a 
              href={audio.audioUrl || audio.url} 
              target="_blank"
              rel="noopener noreferrer"
              className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-3 rounded-lg inline-flex items-center gap-2 text-lg font-semibold"
            >
              <Play className="h-5 w-5" />
              Ascolta Audio
            </a>
          </div>
          
          {audio.description && (
            <p className="text-gray-600 dark:text-gray-300 mb-4 text-sm">
              {audio.description}
            </p>
          )}
          
          <button
            onClick={() => navigate('/audio')}
            className="bg-gray-500 hover:bg-gray-600 text-white px-6 py-2 rounded-lg"
          >
            Torna agli Audio
          </button>
        </div>
      </div>
    );
  }

  console.log('🔴 NO AUDIO URL - showing fallback');
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
          FALLBACK: {audio?.title || `Audio ${id}`}
        </h1>
        <p className="text-gray-600 dark:text-gray-300 mb-4">
          Audio URL non disponibile
        </p>
        <button
          onClick={() => navigate('/audio')}
          className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-2 rounded-lg"
        >
          Torna agli Audio
        </button>
      </div>
    </div>
  );
  
  return null; // Skip tutto il resto
  
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 shadow-sm">
        <div className="px-4 py-4">
          <button
            onClick={() => navigate('/audio')}
            className="flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white mb-4"
          >
            <ArrowLeft className="h-5 w-5" />
            <span>Torna agli audio</span>
          </button>
          
          <div className="flex items-center gap-3 mb-2">
            <span className="text-sm font-medium text-purple-500 bg-purple-100 dark:bg-purple-900/20 dark:text-purple-400 px-3 py-1 rounded-full">
              {audio.category || 'Generale'}
            </span>
            {audio.type && (
              <span className={`text-xs px-2 py-1 rounded-full ${getTypeColor(audio.type)}`}>
                {getTypeIcon(audio.type)} {audio.type}
              </span>
            )}
          </div>
          
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            {audio.title}
          </h1>
          
          <div className="flex items-center gap-4 text-sm text-gray-500 dark:text-gray-400 mb-4">
            {audio.duration && (
              <div className="flex items-center gap-1">
                <Clock className="h-4 w-4" />
                <span>{audio.duration}</span>
              </div>
            )}
            {audio.instructor && (
              <div className="flex items-center gap-1">
                <User className="h-4 w-4" />
                <span>{audio.instructor}</span>
              </div>
            )}
            {audio.plays && (
              <div className="flex items-center gap-1">
                <PlayCircle className="h-4 w-4" />
                <span>{audio.plays} riproduzioni</span>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="px-4 py-6">
        {/* Play Button */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                Riproduci Audio
              </h2>
              <p className="text-gray-600 dark:text-gray-300 text-sm">
                Clicca per iniziare l'ascolto
              </p>
            </div>
            
            <button
              onClick={handlePlayToggle}
              className="flex items-center gap-3 bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded-lg font-medium transition-colors"
            >
              <PlayCircle className="h-6 w-6" />
              {isPlaying ? 'Player Attivo' : 'Riproduci'}
            </button>
          </div>
        </div>

        {/* Description */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
            Descrizione
          </h2>
          <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
            {audio.description}
          </p>
        </div>

        {/* Tags */}
        {audio.tags && audio.tags.length > 0 && (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 mb-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
              Tag
            </h2>
            <div className="flex flex-wrap gap-2">
              {audio.tags.map((tag, index) => (
                <span
                  key={index}
                  className="px-3 py-1 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 text-sm rounded-full"
                >
                  #{tag}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Transcript Preview */}
        {audio.transcript && (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 mb-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
              Anteprima Trascrizione
            </h2>
            <p className="text-gray-600 dark:text-gray-300 text-sm italic">
              {audio.transcript}
            </p>
          </div>
        )}

        {/* Actions */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Azioni
          </h2>
          <div className="flex flex-wrap gap-4">
            <button className="flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors">
              <Download className="h-5 w-5" />
              <span>Scarica</span>
            </button>
            <button className="flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors">
              <Share className="h-5 w-5" />
              <span>Condividi</span>
            </button>
          </div>
        </div>
      </div>

      {/* Audio Player */}
      {isPlaying && (audio.audioUrl || audio.url || audio.fileUrl) && (
        <AudioPlayer
          audioUrl={audio.audioUrl || audio.url || audio.fileUrl}
          title={audio.title}
          onClose={handleClosePlayer}
        />
      )}
    </div>
  );
};

export default AudioDetailPage;