import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Play, Clock, Headphones } from 'lucide-react';
import { db } from '../config/firebase';
import { collection, getDocs, query, orderBy, where } from 'firebase/firestore';

const AudioPage = () => {
  const navigate = useNavigate();
  const [audios, setAudios] = useState([]);
  const [loading, setLoading] = useState(true);
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('all');

  useEffect(() => {
    const fetchAudios = async () => {
      try {
        // Leggi dalla collezione VERA: audioContent
        console.log('Caricamento audio da Firebase...');
        let q = query(
          collection(db, 'audioContent'), 
          where('isPublished', '==', true),
          orderBy('createdAt', 'desc')
        );
        
        let querySnapshot = await getDocs(q);
        let audiosData = [];
        
        querySnapshot.forEach((doc) => {
          audiosData.push({ id: doc.id, ...doc.data() });
        });
        
        console.log('Audio trovati:', audiosData.length);

        // Se ancora non ci sono dati, usa dati mock
        if (audiosData.length === 0) {
          audiosData = [
            {
              id: '1',
              title: 'Meditazione Guidata per Atleti',
              description: 'Una sessione di meditazione specifica per migliorare la concentrazione sportiva',
              category: 'Meditazione',
              duration: '12 min',
              audioUrl: 'https://example.com/audio1.mp3',
              isPublished: true
            },
            {
              id: '2',
              title: 'Respirazione Pre-Gara',
              description: 'Tecniche di respirazione per prepararsi mentalmente alla competizione',
              category: 'Respirazione',
              duration: '8 min',
              audioUrl: 'https://example.com/audio2.mp3',
              isPublished: true
            }
          ];
        }

        setAudios(audiosData);
        
        // Estrai le categorie uniche
        const uniqueCategories = [...new Set(audiosData.map(audio => audio.category || 'Generale'))];
        setCategories(uniqueCategories);
        
      } catch (error) {
        console.error('Errore nel caricamento degli audio:', error);
        // Usa dati mock in caso di errore
        const mockData = [
          {
            id: '1',
            title: 'Meditazione Guidata per Atleti',
            description: 'Una sessione di meditazione specifica per migliorare la concentrazione sportiva',
            category: 'Meditazione',
            duration: '12 min'
          }
        ];
        setAudios(mockData);
        setCategories(['Meditazione']);
      } finally {
        setLoading(false);
      }
    };

    fetchAudios();
  }, []);

  const filteredAudios = selectedCategory === 'all' 
    ? audios 
    : audios.filter(audio => audio.category === selectedCategory);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="px-4 py-6">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Audio per Atleti</h1>
          <p className="text-gray-600 dark:text-gray-300">
            Contenuti audio per migliorare la tua preparazione mentale
          </p>
        </div>

        {/* Filtri per categoria */}
        {categories.length > 0 && (
          <div className="mb-6">
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setSelectedCategory('all')}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                  selectedCategory === 'all'
                    ? 'bg-blue-500 text-white'
                    : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                }`}
              >
                Tutti
              </button>
              {categories.map(category => (
                <button
                  key={category}
                  onClick={() => setSelectedCategory(category)}
                  className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                    selectedCategory === category
                      ? 'bg-blue-500 text-white'
                      : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                  }`}
                >
                  {category}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Lista audio */}
        <div className="space-y-4">
          {filteredAudios.length > 0 ? (
            filteredAudios.map((audio) => (
              <div
                key={audio.id}
                className="bg-white dark:bg-gray-800 rounded-lg shadow-sm hover:shadow-md transition-shadow cursor-pointer overflow-hidden"
                onClick={() => navigate(`/audio/${audio.id}`)}
              >
                <div className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-sm font-medium text-green-500 bg-green-100 dark:bg-green-900/20 dark:text-green-400 px-2 py-1 rounded-full">
                          {audio.category || 'Generale'}
                        </span>
                      </div>
                      
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                        {audio.title}
                      </h3>
                      
                      <p className="text-gray-600 dark:text-gray-300 text-sm mb-4 line-clamp-2">
                        {audio.description}
                      </p>
                      
                      <div className="flex items-center gap-4 text-sm text-gray-500 dark:text-gray-400">
                        {audio.duration && (
                          <div className="flex items-center gap-1">
                            <Clock className="h-4 w-4" />
                            <span>{audio.duration}</span>
                          </div>
                        )}
                        <div className="flex items-center gap-1">
                          <Headphones className="h-4 w-4" />
                          <span>Audio</span>
                        </div>
                      </div>
                    </div>
                    
                    <button className="ml-4 p-3 bg-green-500 hover:bg-green-600 text-white rounded-full transition-colors">
                      <Play className="h-5 w-5" />
                    </button>
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
                Nessun audio trovato
              </h3>
              <p className="text-gray-500 dark:text-gray-400">
                {selectedCategory === 'all' 
                  ? 'Non ci sono contenuti audio disponibili al momento'
                  : `Non ci sono audio nella categoria "${selectedCategory}"`
                }
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AudioPage;