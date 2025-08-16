import React, { useState, useEffect } from 'react';
import { 
  doc, 
  getDoc, 
  setDoc,
  collection,
  getDocs
} from 'firebase/firestore';
import { db } from '../../../config/firebase';
import { 
  Settings, 
  Save, 
  Plus,
  Edit3,
  Trash2,
  ArrowUp,
  ArrowDown,
  Eye,
  EyeOff,
  FileText,
  Video,
  Brain,
  Calendar,
  ChevronRight,
  AlertCircle,
  Database
} from 'lucide-react';
import { initializeOnboardingSettings } from '../../../utils/initOnboardingData';
import VideoSelector from '../VideoSelector';

const OnboardingSettingsManager = () => {
  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editingDay, setEditingDay] = useState(null);
  const [showDayModal, setShowDayModal] = useState(false);
  const [exercises, setExercises] = useState([]);
  const [articles, setArticles] = useState([]);
  const [videos, setVideos] = useState([]);
  
  const [dayForm, setDayForm] = useState({
    day: 1,
    title: '',
    description: '',
    videos: [],
    exercises: [],
    articles: []
  });

  useEffect(() => {
    fetchSettings();
    fetchExercises();
    fetchArticles();
    fetchVideos();
  }, []);

  const fetchSettings = async () => {
    try {
      setLoading(true);
      const docRef = doc(db, 'onboardingSettings', 'default');
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        setSettings(docSnap.data());
      } else {
        // Create default structure if not exists
        const defaultSettings = {
          days: [],
          enabled: true,
          welcomeMessage: 'Benvenuto in Mentalità!',
          completionMessage: 'Congratulazioni! Hai completato il percorso.',
          achievements: [],
          notifications: {
            enabled: true,
            dailyReminder: true
          }
        };
        await setDoc(docRef, defaultSettings);
        setSettings(defaultSettings);
      }
    } catch (error) {
      console.error('Error fetching onboarding settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchExercises = async () => {
    try {
      const exercisesSnapshot = await getDocs(collection(db, 'exercises'));
      const exercisesData = [];
      
      exercisesSnapshot.forEach((doc) => {
        const data = doc.data();
        exercisesData.push({
          id: doc.id,
          title: data.title || 'Esercizio senza titolo',
          category: data.category || 'Generale'
        });
      });

      setExercises(exercisesData);
    } catch (error) {
      console.error('Error fetching exercises:', error);
    }
  };

  const fetchArticles = async () => {
    try {
      const articlesSnapshot = await getDocs(collection(db, 'articles'));
      const articlesData = [];
      
      articlesSnapshot.forEach((doc) => {
        const data = doc.data();
        articlesData.push({
          id: doc.id,
          title: data.title || 'Articolo senza titolo',
          category: data.category || 'Generale'
        });
      });

      setArticles(articlesData);
    } catch (error) {
      console.error('Error fetching articles:', error);
    }
  };

  const fetchVideos = async () => {
    try {
      // Try appVideos first
      let videosSnapshot = await getDocs(collection(db, 'appVideos'));
      const videosData = [];
      
      videosSnapshot.forEach((doc) => {
        const data = doc.data();
        if (data.isPublished !== false) {
          videosData.push({
            id: doc.id,
            title: data.title || 'Video senza titolo',
            category: data.category || 'Generale'
          });
        }
      });

      // If no results from appVideos, try videos
      if (videosData.length === 0) {
        videosSnapshot = await getDocs(collection(db, 'videos'));
        videosSnapshot.forEach((doc) => {
          const data = doc.data();
          if (data.isPublished !== false) {
            videosData.push({
              id: doc.id,
              title: data.title || 'Video senza titolo',
              category: data.category || 'Generale'
            });
          }
        });
      }

      setVideos(videosData);
    } catch (error) {
      console.error('Error fetching videos:', error);
    }
  };

  const openDayModal = (day = null) => {
    if (day) {
      setEditingDay(day.day);
      setDayForm({
        day: day.day || 1,
        title: day.title || '',
        description: day.description || '',
        videos: day.videos || [],
        exercises: day.exercises || [],
        articles: day.articles || []
      });
    } else {
      const nextDay = settings.days.length + 1;
      setEditingDay(null);
      setDayForm({
        day: nextDay,
        title: `Giorno ${nextDay}`,
        description: '',
        videos: [],
        exercises: [],
        articles: []
      });
    }
    setShowDayModal(true);
  };

  const closeDayModal = () => {
    setShowDayModal(false);
    setEditingDay(null);
    setDayForm({
      day: 1,
      title: '',
      description: '',
      videos: [],
      exercises: [],
      articles: []
    });
  };

  const handleSaveDay = async () => {
    if (!dayForm.title.trim()) {
      alert('Il titolo è obbligatorio');
      return;
    }

    if (dayForm.exercises.length === 0) {
      alert('Seleziona almeno un esercizio');
      return;
    }

    setSaving(true);
    try {
      let updatedDays = [...(settings.days || [])];
      
      if (editingDay !== null) {
        // Update existing day
        const dayIndex = updatedDays.findIndex(d => d.day === editingDay);
        if (dayIndex !== -1) {
          updatedDays[dayIndex] = dayForm;
        }
      } else {
        // Add new day
        updatedDays.push(dayForm);
      }

      // Sort days by day number
      updatedDays.sort((a, b) => a.day - b.day);

      const updatedSettings = {
        ...settings,
        days: updatedDays
      };

      await setDoc(doc(db, 'onboardingSettings', 'default'), updatedSettings);
      setSettings(updatedSettings);
      
      closeDayModal();
      alert(editingDay !== null ? 'Giorno aggiornato!' : 'Giorno creato!');
    } catch (error) {
      console.error('Error saving day:', error);
      alert('Errore nel salvataggio');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteDay = async (dayNumber) => {
    if (!confirm(`Sei sicuro di voler eliminare il Giorno ${dayNumber}?`)) return;

    try {
      const updatedDays = settings.days.filter(d => d.day !== dayNumber);
      
      // Renumber remaining days
      updatedDays.forEach((day, index) => {
        day.day = index + 1;
      });

      const updatedSettings = {
        ...settings,
        days: updatedDays
      };

      await setDoc(doc(db, 'onboardingSettings', 'default'), updatedSettings);
      setSettings(updatedSettings);
      alert('Giorno eliminato');
    } catch (error) {
      console.error('Error deleting day:', error);
      alert('Errore nell\'eliminazione');
    }
  };

  const toggleSelection = (type, id) => {
    setDayForm(prev => {
      const currentList = prev[type] || [];
      const newList = currentList.includes(id)
        ? currentList.filter(item => item !== id)
        : [...currentList, id];
      
      return {
        ...prev,
        [type]: newList
      };
    });
  };

  const saveGeneralSettings = async () => {
    setSaving(true);
    try {
      await setDoc(doc(db, 'onboardingSettings', 'default'), settings);
      alert('Impostazioni salvate!');
    } catch (error) {
      console.error('Error saving settings:', error);
      alert('Errore nel salvataggio');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/3 mb-6"></div>
          <div className="space-y-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-24 bg-gray-200 dark:bg-gray-700 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!settings) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <div className="text-center">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <p className="text-gray-500 dark:text-gray-400">
            Errore nel caricamento delle impostazioni
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
      {/* Header */}
      <div className="p-6 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Settings className="h-6 w-6 text-indigo-600" />
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
              Gestione Onboarding 7 Giorni
            </h2>
          </div>
          
          <button
            onClick={() => openDayModal()}
            disabled={settings.days?.length >= 7}
            className="flex items-center space-x-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Plus className="h-4 w-4" />
            <span>Aggiungi Giorno</span>
          </button>
        </div>
        
        <p className="mt-2 text-gray-600 dark:text-gray-400">
          Configura il percorso di onboarding di 7 giorni con video, esercizi e articoli
        </p>
      </div>

      {/* General Settings */}
      <div className="p-6 border-b border-gray-200 dark:border-gray-700">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Impostazioni Generali
        </h3>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Messaggio di Benvenuto
            </label>
            <textarea
              value={settings.welcomeMessage || ''}
              onChange={(e) => setSettings({ ...settings, welcomeMessage: e.target.value })}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 dark:bg-gray-700 dark:text-white"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Messaggio di Completamento
            </label>
            <textarea
              value={settings.completionMessage || ''}
              onChange={(e) => setSettings({ ...settings, completionMessage: e.target.value })}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 dark:bg-gray-700 dark:text-white"
            />
          </div>

          <div className="flex items-center space-x-3">
            <input
              type="checkbox"
              id="enabled"
              checked={settings.enabled || false}
              onChange={(e) => setSettings({ ...settings, enabled: e.target.checked })}
              className="w-4 h-4 text-indigo-600 rounded focus:ring-indigo-500"
            />
            <label htmlFor="enabled" className="text-sm text-gray-700 dark:text-gray-300">
              Onboarding Attivo
            </label>
          </div>

          <button
            onClick={saveGeneralSettings}
            disabled={saving}
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
          >
            {saving ? 'Salvataggio...' : 'Salva Impostazioni Generali'}
          </button>
        </div>
      </div>

      {/* Days List */}
      <div className="p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Giorni del Percorso ({settings.days?.length || 0}/7)
        </h3>
        
        {settings.days?.length === 0 ? (
          <div className="text-center py-12">
            <Calendar className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500 dark:text-gray-400">
              Nessun giorno configurato
            </p>
            <div className="mt-4 space-x-3">
              <button
                onClick={() => openDayModal()}
                className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
              >
                Crea il primo giorno
              </button>
              <button
                onClick={async () => {
                  const success = await initializeOnboardingSettings();
                  if (success) {
                    fetchSettings();
                  }
                }}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center gap-2 inline-flex"
              >
                <Database className="h-4 w-4" />
                Importa Dati Esistenti
              </button>
            </div>
          </div>
        ) : (
          <div className="grid gap-4">
            {settings.days.sort((a, b) => a.day - b.day).map((day) => {
              const dayVideos = day.videos?.map(id => videos.find(v => v.id === id)).filter(Boolean) || [];
              const dayExercises = day.exercises?.map(id => exercises.find(e => e.id === id)).filter(Boolean) || [];
              const dayArticles = day.articles?.map(id => articles.find(a => a.id === id)).filter(Boolean) || [];
              
              return (
                <div
                  key={day.day}
                  className="border rounded-lg p-4 border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-3">
                        <span className="text-sm font-bold text-indigo-600 dark:text-indigo-400">
                          GIORNO {day.day}
                        </span>
                      </div>
                      
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                        {day.title}
                      </h3>
                      
                      {day.description && (
                        <p className="text-sm text-gray-600 dark:text-gray-300 mb-3">
                          {day.description}
                        </p>
                      )}
                      
                      <div className="space-y-2">
                        {/* Videos */}
                        <div className="flex items-start gap-2">
                          <Video className="h-4 w-4 text-red-500 mt-0.5" />
                          <div className="flex-1">
                            <span className="text-sm text-gray-600 dark:text-gray-300">
                              Video ({dayVideos.length}): 
                            </span>
                            {dayVideos.length > 0 ? (
                              <span className="text-sm text-gray-700 dark:text-gray-200 ml-1">
                                {dayVideos.map(v => v.title).join(', ')}
                              </span>
                            ) : (
                              <span className="text-sm text-gray-400 ml-1">Nessuno</span>
                            )}
                          </div>
                        </div>
                        
                        {/* Exercises */}
                        <div className="flex items-start gap-2">
                          <Brain className="h-4 w-4 text-blue-500 mt-0.5" />
                          <div className="flex-1">
                            <span className="text-sm text-gray-600 dark:text-gray-300">
                              Esercizi ({dayExercises.length}): 
                            </span>
                            {dayExercises.length > 0 ? (
                              <span className="text-sm text-gray-700 dark:text-gray-200 ml-1">
                                {dayExercises.map(e => e.title).join(', ')}
                              </span>
                            ) : (
                              <span className="text-sm text-gray-400 ml-1">Nessuno</span>
                            )}
                          </div>
                        </div>
                        
                        {/* Articles */}
                        <div className="flex items-start gap-2">
                          <FileText className="h-4 w-4 text-green-500 mt-0.5" />
                          <div className="flex-1">
                            <span className="text-sm text-gray-600 dark:text-gray-300">
                              Articoli ({dayArticles.length}): 
                            </span>
                            {dayArticles.length > 0 ? (
                              <span className="text-sm text-gray-700 dark:text-gray-200 ml-1">
                                {dayArticles.map(a => a.title).join(', ')}
                              </span>
                            ) : (
                              <span className="text-sm text-gray-400 ml-1">Nessuno</span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  
                    <div className="flex items-center space-x-2 ml-4">
                      {/* Edit */}
                      <button
                        onClick={() => openDayModal(day)}
                        className="p-2 text-indigo-600 hover:text-indigo-700 dark:text-indigo-400"
                        title="Modifica giorno"
                      >
                        <Edit3 className="h-4 w-4" />
                      </button>
                      
                      {/* Delete */}
                      <button
                        onClick={() => handleDeleteDay(day.day)}
                        className="p-2 text-red-600 hover:text-red-700 dark:text-red-400"
                        title="Elimina giorno"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Day Modal */}
      {showDayModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200 dark:border-gray-700">
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                {editingDay !== null ? `Modifica Giorno ${editingDay}` : 'Nuovo Giorno'}
              </h3>
            </div>

            <div className="p-6 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Title */}
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Titolo del Giorno *
                  </label>
                  <input
                    type="text"
                    value={dayForm.title}
                    onChange={(e) => setDayForm({ ...dayForm, title: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 dark:bg-gray-700 dark:text-white"
                    placeholder="Es: Giorno 1 - Inizia il Viaggio"
                  />
                </div>

                {/* Description */}
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Descrizione del Giorno
                  </label>
                  <textarea
                    value={dayForm.description}
                    onChange={(e) => setDayForm({ ...dayForm, description: e.target.value })}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 dark:bg-gray-700 dark:text-white"
                    placeholder="Descrivi cosa l'atleta imparerà in questo giorno..."
                  />
                </div>

                {/* Videos Selection */}
                <div className="md:col-span-2">
                  <VideoSelector
                    value={dayForm.videos?.map(id => {
                      const video = videos.find(v => v.id === id);
                      return video ? video : null;
                    }).filter(Boolean) || []}
                    onChange={(selectedVideos) => {
                      const videoIds = Array.isArray(selectedVideos) ? selectedVideos.map(v => v.id) : [];
                      setDayForm({ ...dayForm, videos: videoIds });
                    }}
                    label="Video (seleziona uno o più)"
                    placeholder="Seleziona uno o più video per questo giorno..."
                    multiple={true}
                  />
                </div>

                {/* Exercises Selection */}
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Esercizi * (seleziona uno o più)
                  </label>
                  <div className="border border-gray-300 dark:border-gray-600 rounded-lg p-3 max-h-48 overflow-y-auto">
                    {exercises.length === 0 ? (
                      <p className="text-sm text-gray-500">Nessun esercizio disponibile</p>
                    ) : (
                      <div className="space-y-2">
                        {exercises.map(exercise => (
                          <label key={exercise.id} className="flex items-center space-x-2 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 p-1 rounded">
                            <input
                              type="checkbox"
                              checked={dayForm.exercises.includes(exercise.id)}
                              onChange={() => toggleSelection('exercises', exercise.id)}
                              className="w-4 h-4 text-indigo-600 rounded focus:ring-indigo-500"
                            />
                            <span className="text-sm text-gray-700 dark:text-gray-300">
                              {exercise.title} ({exercise.category})
                            </span>
                          </label>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* Articles Selection */}
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Articoli (seleziona uno o più)
                  </label>
                  <div className="border border-gray-300 dark:border-gray-600 rounded-lg p-3 max-h-48 overflow-y-auto">
                    {articles.length === 0 ? (
                      <p className="text-sm text-gray-500">Nessun articolo disponibile</p>
                    ) : (
                      <div className="space-y-2">
                        {articles.map(article => (
                          <label key={article.id} className="flex items-center space-x-2 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 p-1 rounded">
                            <input
                              type="checkbox"
                              checked={dayForm.articles.includes(article.id)}
                              onChange={() => toggleSelection('articles', article.id)}
                              className="w-4 h-4 text-indigo-600 rounded focus:ring-indigo-500"
                            />
                            <span className="text-sm text-gray-700 dark:text-gray-300">
                              {article.title} ({article.category})
                            </span>
                          </label>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            <div className="p-6 border-t border-gray-200 dark:border-gray-700 flex justify-end space-x-3">
              <button
                onClick={closeDayModal}
                className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
              >
                Annulla
              </button>
              <button
                onClick={handleSaveDay}
                disabled={saving}
                className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 flex items-center space-x-2"
              >
                {saving ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    <span>Salvataggio...</span>
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4" />
                    <span>{editingDay !== null ? 'Aggiorna' : 'Crea'} Giorno</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default OnboardingSettingsManager;