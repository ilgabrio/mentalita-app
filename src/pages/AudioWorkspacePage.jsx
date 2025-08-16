import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Headphones, Play, Clock, Volume2, Download, Heart } from 'lucide-react';
import { db } from '../config/firebase';
import { collection, getDocs } from 'firebase/firestore';
import MotivationalMessage from '../components/MotivationalMessage';

const AudioWorkspacePage = () => {
  const navigate = useNavigate();
  const [audioContent, setAudioContent] = useState([]);
  const [loading, setLoading] = useState(true);
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('all');

  useEffect(() => {
    const fetchAudioContent = async () => {
      try {
        console.log('🎧 CARICAMENTO CONTENUTI AUDIO...');
        
        let audioData = [];
        
        // Prova prima dalla collezione audioContent
        try {
          const audioSnapshot = await getDocs(collection(db, 'audioContent'));
          audioSnapshot.forEach((doc) => {
            const data = { id: doc.id, ...doc.data() };
            console.log(`📄 AudioContent doc ${doc.id}:`, {
              title: data.title,
              audioUrl: data.audioUrl,
              url: data.url,
              fileUrl: data.fileUrl,
              allFields: Object.keys(data)
            });
            audioData.push(data);
          });
          console.log('✅ AudioContent trovati:', audioData.length);
        } catch (error) {
          console.log('⚠️ Errore audioContent:', error);
        }
        
        // Se non ne troviamo, prova dalla collezione appAudios
        if (audioData.length === 0) {
          try {
            const appAudioSnapshot = await getDocs(collection(db, 'appAudios'));
            appAudioSnapshot.forEach((doc) => {
              const data = { id: doc.id, ...doc.data() };
              console.log(`📄 AppAudios doc ${doc.id}:`, {
                title: data.title,
                audioUrl: data.audioUrl,
                url: data.url,
                fileUrl: data.fileUrl,
                allFields: Object.keys(data)
              });
              audioData.push(data);
            });
            console.log('✅ AppAudios trovati:', audioData.length);
          } catch (error) {
            console.log('⚠️ Errore appAudios:', error);
          }
        }
        
        setAudioContent(audioData);
        
        // Estrai le categorie uniche
        const uniqueCategories = [...new Set(audioData.map(audio => audio.category || 'Generale'))];
        setCategories(uniqueCategories);
        
      } catch (error) {
        console.error('Errore nel caricamento dei contenuti audio:', error);
        
        // Dati mock per test
        const mockAudio = [
          {
            id: '1',
            title: 'Meditazione Pre-Gara',
            description: 'Una sessione guidata di meditazione per prepararsi mentalmente alla competizione',
            audioUrl: '/audio/meditation-pre-game.mp3',
            duration: '15:30',
            category: 'Meditazione',
            instructor: 'Marco Zen',
            plays: 4500,
            type: 'meditation'
          },
          {
            id: '2',
            title: 'Affermazioni Positive',
            description: 'Potenti affermazioni per rafforzare la fiducia in se stessi',
            audioUrl: '/audio/positive-affirmations.mp3',
            duration: '8:45',
            category: 'Motivazione',
            instructor: 'Anna Forza',
            plays: 3200,
            type: 'affirmations'
          },
          {
            id: '3',
            title: 'Respirazione Profonda',
            description: 'Esercizi di respirazione per rilassamento e controllo dell\'ansia',
            audioUrl: '/audio/deep-breathing.mp3',
            duration: '12:15',
            category: 'Respirazione',
            instructor: 'Dr. Calma',
            plays: 5800,
            type: 'breathing'
          },
          {
            id: '4',
            title: 'Visualizzazione Vittoria',
            description: 'Sessione di visualizzazione per immaginare il successo sportivo',
            audioUrl: '/audio/victory-visualization.mp3',
            duration: '18:20',
            category: 'Visualizzazione',
            instructor: 'Prof. Visioni',
            plays: 2900,
            type: 'visualization'
          }
        ];
        
        setAudioContent(mockAudio);
        setCategories(['Meditazione', 'Motivazione', 'Respirazione', 'Visualizzazione']);
      } finally {
        setLoading(false);
      }
    };

    fetchAudioContent();
  }, []);

  const filteredAudio = selectedCategory === 'all' 
    ? audioContent 
    : audioContent.filter(audio => audio.category === selectedCategory);

  const formatDuration = (duration) => {
    if (!duration) return 'N/A';
    return duration;
  };

  const formatPlays = (plays) => {
    if (!plays) return '0';
    if (plays >= 1000) {
      return `${(plays / 1000).toFixed(1)}k`;
    }
    return plays.toString();
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
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-300">Caricamento contenuti audio...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 shadow-sm">
        <div className="px-4 py-6">
          <div className="flex items-center gap-3 mb-2">
            <Headphones className="h-8 w-8 text-purple-500" />
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Audio e Meditazioni</h1>
          </div>
          <p className="text-gray-600 dark:text-gray-300">
            Ascolta le nostre sessioni audio per rilassamento, motivazione e preparazione mentale
          </p>
          <div className="mt-4 grid grid-cols-2 gap-4">
            <div className="bg-purple-50 dark:bg-purple-900/20 p-3 rounded-lg">
              <div className="flex items-center gap-2">
                <Volume2 className="h-5 w-5 text-purple-500" />
                <span className="text-sm font-medium text-purple-700 dark:text-purple-300">
                  {audioContent.length} Tracce Audio
                </span>
              </div>
            </div>
            <div className="bg-indigo-50 dark:bg-indigo-900/20 p-3 rounded-lg">
              <div className="flex items-center gap-2">
                <Heart className="h-5 w-5 text-indigo-500" />
                <span className="text-sm font-medium text-indigo-700 dark:text-indigo-300">
                  Sessioni Guidate
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="px-4 py-6">
        {/* Messaggio motivazionale */}
        <MotivationalMessage position="top" />
        
        {/* Filtri per categoria */}
        {categories.length > 0 && (
          <div className="mb-6">
            <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">Filtra per categoria</h3>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setSelectedCategory('all')}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                  selectedCategory === 'all'
                    ? 'bg-purple-500 text-white'
                    : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                }`}
              >
                Tutti ({audioContent.length})
              </button>
              {categories.map(category => {
                const count = audioContent.filter(audio => audio.category === category).length;
                return (
                  <button
                    key={category}
                    onClick={() => setSelectedCategory(category)}
                    className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                      selectedCategory === category
                        ? 'bg-purple-500 text-white'
                        : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                    }`}
                  >
                    {category} ({count})
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Lista contenuti audio */}
        <div className="space-y-4">
          {filteredAudio.length > 0 ? (
            filteredAudio.map((audio) => (
              <div
                key={audio.id}
                className="bg-white dark:bg-gray-800 rounded-lg shadow-sm hover:shadow-md transition-shadow cursor-pointer overflow-hidden border border-gray-200 dark:border-gray-700"
                onClick={() => navigate(`/audio/${audio.id}`)}
              >
                <div className="p-6">
                  <div className="flex items-start gap-4">
                    {/* Audio thumbnail/icon */}
                    <div className="flex-shrink-0">
                      <div className="w-16 h-16 bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 rounded-full flex items-center justify-center">
                        <Headphones className="h-8 w-8" />
                      </div>
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-sm font-medium text-purple-500 bg-purple-100 dark:bg-purple-900/20 dark:text-purple-400 px-3 py-1 rounded-full">
                          {audio.category || 'Generale'}
                        </span>
                        {audio.type && (
                          <span className={`text-xs px-2 py-1 rounded-full ${getTypeColor(audio.type)}`}>
                            {getTypeIcon(audio.type)} {audio.type}
                          </span>
                        )}
                      </div>
                      
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                        {audio.title}
                      </h3>
                      
                      <p className="text-gray-600 dark:text-gray-300 text-sm mb-3 line-clamp-2">
                        {audio.description}
                      </p>
                      
                      <div className="flex items-center gap-4 text-sm text-gray-500 dark:text-gray-400">
                        <div className="flex items-center gap-1">
                          <Clock className="h-4 w-4" />
                          <span>{formatDuration(audio.duration)}</span>
                        </div>
                        {audio.instructor && (
                          <div className="flex items-center gap-1">
                            <span>con {audio.instructor}</span>
                          </div>
                        )}
                        {audio.plays && (
                          <div className="flex items-center gap-1">
                            <Play className="h-4 w-4" />
                            <span>{formatPlays(audio.plays)} riproduzioni</span>
                          </div>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex flex-col items-center gap-2 flex-shrink-0">
                      <button
                        onClick={(e) => e.stopPropagation()}
                        className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                      >
                        <Download className="h-5 w-5" />
                      </button>
                      <button
                        onClick={(e) => e.stopPropagation()}
                        className="p-2 text-gray-400 hover:text-red-500 transition-colors"
                      >
                        <Heart className="h-5 w-5" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-12">
              <div className="text-gray-400 dark:text-gray-600 mb-4">
                <Headphones className="h-16 w-16 mx-auto opacity-50" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                Nessun contenuto audio trovato
              </h3>
              <p className="text-gray-500 dark:text-gray-400">
                {selectedCategory === 'all' 
                  ? 'Non ci sono contenuti audio disponibili al momento'
                  : `Non ci sono contenuti audio nella categoria "${selectedCategory}"`
                }
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AudioWorkspacePage;