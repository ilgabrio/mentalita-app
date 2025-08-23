import React, { useState, useEffect } from 'react';
import { 
  collection, 
  query, 
  where, 
  orderBy, 
  getDocs, 
  doc, 
  getDoc,
  addDoc, 
  updateDoc, 
  deleteDoc 
} from 'firebase/firestore';
import { db } from '../../../config/firebase';
import { 
  Plus, 
  Edit3, 
  Trash2, 
  Eye, 
  Save, 
  X, 
  Search,
  Filter,
  Trophy,
  Clock,
  Target,
  BookOpen,
  Settings,
  FileEdit,
  Video
} from 'lucide-react';
import ExerciseFormEditor from './ExerciseFormEditor';
import VideoSelector from '../VideoSelector';

const ExerciseManager = () => {
  const [exercises, setExercises] = useState([]);
  const [videos, setVideos] = useState([]);
  const [audios, setAudios] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState('all');
  const [filterPublished, setFilterPublished] = useState('all');
  const [showModal, setShowModal] = useState(false);
  const [editingExercise, setEditingExercise] = useState(null);
  const [saving, setSaving] = useState(false);
  const [showFormEditor, setShowFormEditor] = useState(false);
  const [editingFormExercise, setEditingFormExercise] = useState(null);

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    content: '',
    category: '',
    difficulty: 'Principiante',
    duration: '',
    order: 0,
    isPublished: false,
    tags: [],
    objectives: [],
    instructions: [],
    selectedVideos: [],
    coverImage: '',
    claim: '',
    audioExplanation: null // Audio spiegazione esercizio
  });

  const categories = [
    'Onboarding',
    'Concentrazione', 
    'Visualizzazione',
    'Rilassamento',
    'Motivazione',
    'Gestione dello Stress',
    'Autostima',
    'Mental Training Avanzato'
  ];

  const difficulties = ['Principiante', 'Intermedio', 'Avanzato'];

  useEffect(() => {
    fetchExercises();
    fetchVideos();
    fetchAudios();
  }, []);

  const convertVideoIdsToObjects = (videoIds) => {
    if (!Array.isArray(videoIds)) return [];
    
    return videoIds.map(id => {
      // If it's already an object, return as is
      if (typeof id === 'object' && id.id) {
        return id;
      }
      
      // If it's a string ID, find the corresponding video object
      if (typeof id === 'string') {
        const video = videos.find(v => v.id === id);
        return video || null;
      }
      
      return null;
    }).filter(Boolean);
  };

  const fetchVideos = async () => {
    try {
      console.log('🎥 ExerciseManager: Fetching videos for exercise selection...');
      
      // Use videos collection (MAIN collection - appVideos is deprecated)
      const q = query(collection(db, 'videos'));
      const snapshot = await getDocs(q);
      const videosData = [];
      
      snapshot.forEach((doc) => {
        const data = doc.data();
        // videos collection uses isActive instead of isPublished
        if (data.isActive !== false) {
          videosData.push({
            id: doc.id,
            ...data
          });
        }
      });

      console.log(`🎥 ExerciseManager: Loaded ${videosData.length} videos`);
      setVideos(videosData);
    } catch (error) {
      console.error('🎥 ExerciseManager: Error fetching videos:', error);
    }
  };

  const fetchAudios = async () => {
    try {
      console.log('🎵 ExerciseManager: Fetching audios for exercise explanation...');
      
      const q = query(
        collection(db, 'audio'),
        where('isPublished', '==', true),
        orderBy('title', 'asc')
      );
      const snapshot = await getDocs(q);
      const audiosData = [];
      
      snapshot.forEach((doc) => {
        audiosData.push({
          id: doc.id,
          ...doc.data()
        });
      });

      console.log(`🎵 ExerciseManager: Loaded ${audiosData.length} audios`);
      setAudios(audiosData);
    } catch (error) {
      console.error('🎵 ExerciseManager: Error fetching audios:', error);
      // Fallback senza orderBy
      try {
        const q = query(
          collection(db, 'audio'),
          where('isPublished', '==', true)
        );
        const snapshot = await getDocs(q);
        const audiosData = [];
        
        snapshot.forEach((doc) => {
          audiosData.push({
            id: doc.id,
            ...doc.data()
          });
        });

        console.log(`🎵 ExerciseManager: Loaded ${audiosData.length} audios (fallback)`);
        setAudios(audiosData.sort((a, b) => (a.title || '').localeCompare(b.title || '')));
      } catch (fallbackError) {
        console.error('🎵 ExerciseManager: Fallback fetch also failed:', fallbackError);
      }
    }
  };

  const fetchExercises = async () => {
    try {
      setLoading(true);
      console.log('🔧 ADMIN - Caricamento esercizi...');
      
      // Carica TUTTI gli esercizi - non usiamo più orderBy che fallisce
      console.log('📋 ADMIN - Carico tutti gli esercizi dalla collezione...');
      
      const exercisesQuery = query(collection(db, 'exercises'));
      const snapshot = await getDocs(exercisesQuery);
      let exercisesData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      
      console.log('📊 ADMIN - Esercizi totali caricati:', exercisesData.length);
      
      // Ordina gli esercizi manualmente
      exercisesData.sort((a, b) => {
        // Se hanno order, usa quello
        if (a.order !== undefined && b.order !== undefined) {
          return a.order - b.order;
        }
        // Altrimenti per data di creazione (più recenti prima)
        if (a.createdAt && b.createdAt) {
          return b.createdAt.toDate().getTime() - a.createdAt.toDate().getTime();
        }
        // Infine per titolo alfabetico
        return (a.title || '').localeCompare(b.title || '');
      });
      
      console.log('✅ ADMIN - Esercizi ordinati pronti per visualizzazione');
      
      setExercises(exercisesData);
    } catch (error) {
      console.error('Error fetching exercises:', error);
      alert('Errore nel caricamento degli esercizi');
    } finally {
      setLoading(false);
    }
  };

  const filteredExercises = exercises.filter(exercise => {
    const matchesSearch = exercise.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         exercise.description?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = filterCategory === 'all' || exercise.category === filterCategory;
    const matchesPublished = filterPublished === 'all' || 
                            (filterPublished === 'published' && exercise.isPublished) ||
                            (filterPublished === 'draft' && !exercise.isPublished);
    
    return matchesSearch && matchesCategory && matchesPublished;
  });

  const openModal = (exercise = null) => {
    if (exercise) {
      setEditingExercise(exercise.id);
      setFormData({
        title: exercise.title || '',
        description: exercise.description || '',
        content: exercise.content || '',
        category: exercise.category || '',
        difficulty: exercise.difficulty || 'Principiante',
        duration: exercise.duration || '',
        order: exercise.order || 0,
        isPublished: exercise.isPublished || false,
        tags: exercise.tags || [],
        objectives: exercise.objectives || [],
        instructions: exercise.instructions || [],
        selectedVideos: convertVideoIdsToObjects(exercise.selectedVideos || []),
        coverImage: exercise.coverImage || '',
        claim: exercise.claim || '',
        audioExplanation: exercise.audioExplanation || null
      });
    } else {
      setEditingExercise(null);
      setFormData({
        title: '',
        description: '',
        content: '',
        category: categories[0],
        difficulty: 'Principiante',
        duration: '',
        order: Math.max(...exercises.map(e => e.order || 0), 0) + 1,
        isPublished: false,
        tags: [],
        objectives: [],
        instructions: [],
        selectedVideos: [],
        coverImage: '',
        claim: '',
        audioExplanation: null
      });
    }
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingExercise(null);
    setFormData({
      title: '',
      description: '',
      content: '',
      category: '',
      difficulty: 'Principiante',
      duration: '',
      order: 0,
      isPublished: false,
      tags: [],
      objectives: [],
      instructions: [],
      selectedVideos: [],
      coverImage: '',
      claim: ''
    });
  };

  const handleSave = async () => {
    if (!formData.title.trim()) {
      alert('Il titolo è obbligatorio');
      return;
    }

    setSaving(true);
    try {
      // Convert video objects to IDs for storage
      const videoIds = formData.selectedVideos.map(video => 
        typeof video === 'object' ? video.id : video
      ).filter(Boolean);
      
      const exerciseData = {
        ...formData,
        title: formData.title.trim(),
        description: formData.description.trim(),
        content: formData.content.trim(),
        selectedVideos: videoIds,
        updatedAt: new Date()
      };

      if (editingExercise) {
        await updateDoc(doc(db, 'exercises', editingExercise), exerciseData);
      } else {
        await addDoc(collection(db, 'exercises'), {
          ...exerciseData,
          elements: [], // Inizializza con array vuoto per permettere l'editing
          createdAt: new Date()
        });
      }

      await fetchExercises();
      closeModal();
      alert(editingExercise ? 'Esercizio aggiornato con successo!' : 'Esercizio creato con successo!');
    } catch (error) {
      console.error('Error saving exercise:', error);
      alert('Errore nel salvataggio dell\'esercizio');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (exerciseId, exerciseTitle) => {
    if (!confirm(`Sei sicuro di voler eliminare l'esercizio "${exerciseTitle}"?`)) {
      return;
    }

    try {
      await deleteDoc(doc(db, 'exercises', exerciseId));
      await fetchExercises();
      alert('Esercizio eliminato con successo!');
    } catch (error) {
      console.error('Error deleting exercise:', error);
      alert('Errore nell\'eliminazione dell\'esercizio');
    }
  };

  const togglePublished = async (exerciseId, currentStatus) => {
    try {
      await updateDoc(doc(db, 'exercises', exerciseId), {
        isPublished: !currentStatus,
        updatedAt: new Date()
      });
      await fetchExercises();
    } catch (error) {
      console.error('Error updating exercise status:', error);
      alert('Errore nell\'aggiornamento dello stato');
    }
  };

  const addArrayItem = (field, value) => {
    if (value.trim()) {
      setFormData(prev => ({
        ...prev,
        [field]: [...prev[field], value.trim()]
      }));
    }
  };

  const removeArrayItem = (field, index) => {
    setFormData(prev => ({
      ...prev,
      [field]: prev[field].filter((_, i) => i !== index)
    }));
  };

  const openFormEditor = (exercise) => {
    setEditingFormExercise(exercise);
    setShowFormEditor(true);
  };

  const closeFormEditor = () => {
    setShowFormEditor(false);
    setEditingFormExercise(null);
  };

  const handleFormEditorSave = (updatedExercise) => {
    // Aggiorna l'esercizio nella lista locale
    setExercises(prev => 
      prev.map(ex => ex.id === updatedExercise.id ? updatedExercise : ex)
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-2 text-gray-600 dark:text-gray-400">Caricamento esercizi...</span>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center space-x-3">
          <Trophy className="h-6 w-6 text-blue-600 dark:text-blue-400" />
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            Gestione Esercizi
          </h2>
        </div>
        <button
          onClick={() => openModal()}
          className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors"
        >
          <Plus className="h-4 w-4" />
          <span>Nuovo Esercizio</span>
        </button>
      </div>

      {/* Filters */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="Cerca esercizi..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
          />
        </div>
        
        <select
          value={filterCategory}
          onChange={(e) => setFilterCategory(e.target.value)}
          className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
        >
          <option value="all">Tutte le categorie</option>
          {categories.map(category => (
            <option key={category} value={category}>{category}</option>
          ))}
        </select>

        <select
          value={filterPublished}
          onChange={(e) => setFilterPublished(e.target.value)}
          className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
        >
          <option value="all">Tutti gli stati</option>
          <option value="published">Pubblicati</option>
          <option value="draft">Bozze</option>
        </select>

        <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
          <Filter className="h-4 w-4 mr-2" />
          {filteredExercises.length} di {exercises.length} esercizi
        </div>
      </div>

      {/* Exercises List */}
      <div className="space-y-4">
        {filteredExercises.length === 0 ? (
          <div className="text-center py-12">
            <Trophy className="h-16 w-16 mx-auto mb-4 text-gray-400" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
              Nessun esercizio trovato
            </h3>
            <p className="text-gray-500 dark:text-gray-400 mb-6">
              {exercises.length === 0 
                ? "Non ci sono ancora esercizi. Creane uno nuovo!"
                : "Prova a modificare i filtri di ricerca."
              }
            </p>
            <button
              onClick={() => openModal()}
              className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg transition-colors"
            >
              Crea il primo esercizio
            </button>
          </div>
        ) : (
          filteredExercises.map((exercise) => (
            <div
              key={exercise.id}
              className="border border-gray-200 dark:border-gray-600 rounded-lg p-4 hover:shadow-md transition-shadow"
            >
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">
                        {exercise.title}
                      </h3>
                      <p className="text-gray-600 dark:text-gray-400 text-sm mb-3">
                        {exercise.description}
                      </p>
                    </div>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ml-4 ${
                      exercise.isPublished
                        ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300'
                        : 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300'
                    }`}>
                      {exercise.isPublished ? 'Pubblicato' : 'Bozza'}
                    </span>
                  </div>
                  
                  <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500 dark:text-gray-400">
                    <div className="flex items-center space-x-1">
                      <BookOpen className="h-4 w-4" />
                      <span>{exercise.category || 'Senza categoria'}</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <Target className="h-4 w-4" />
                      <span>{exercise.difficulty || 'Principiante'}</span>
                    </div>
                    {exercise.duration && (
                      <div className="flex items-center space-x-1">
                        <Clock className="h-4 w-4" />
                        <span>{exercise.duration}</span>
                      </div>
                    )}
                    <span>Ordine: {exercise.order || 0}</span>
                  </div>

                  {exercise.tags && exercise.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-3">
                      {exercise.tags.slice(0, 3).map((tag, index) => (
                        <span
                          key={index}
                          className="px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 text-xs rounded"
                        >
                          {tag}
                        </span>
                      ))}
                      {exercise.tags.length > 3 && (
                        <span className="px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 text-xs rounded">
                          +{exercise.tags.length - 3}
                        </span>
                      )}
                    </div>
                  )}
                </div>

                <div className="flex space-x-2 ml-4">
                  <button
                    onClick={() => togglePublished(exercise.id, exercise.isPublished)}
                    className={`p-2 rounded transition-colors ${
                      exercise.isPublished
                        ? 'text-orange-500 hover:bg-orange-50 dark:hover:bg-orange-900/20'
                        : 'text-green-500 hover:bg-green-50 dark:hover:bg-green-900/20'
                    }`}
                    title={exercise.isPublished ? 'Rimuovi pubblicazione' : 'Pubblica'}
                  >
                    <Eye className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => openFormEditor(exercise)}
                    className="p-2 text-purple-500 hover:bg-purple-50 dark:hover:bg-purple-900/20 rounded transition-colors"
                    title="Modifica Elementi Form"
                  >
                    <FileEdit className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => openModal(exercise)}
                    className="p-2 text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded transition-colors"
                    title="Modifica"
                  >
                    <Edit3 className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(exercise.id, exercise.title)}
                    className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-colors"
                    title="Elimina"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Modal for Create/Edit Exercise */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
            <div className="flex justify-between items-center p-6 border-b border-gray-200 dark:border-gray-600">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                {editingExercise ? 'Modifica Esercizio' : 'Nuovo Esercizio'}
              </h3>
              <button
                onClick={closeModal}
                className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto max-h-[70vh]">
              <div className="space-y-6">
                {/* Basic Info */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Titolo *
                    </label>
                    <input
                      type="text"
                      value={formData.title}
                      onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                      placeholder="Inserisci il titolo dell'esercizio"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Categoria
                    </label>
                    <select
                      value={formData.category}
                      onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                    >
                      {categories.map(category => (
                        <option key={category} value={category}>{category}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Livello di Difficoltà
                    </label>
                    <select
                      value={formData.difficulty}
                      onChange={(e) => setFormData({ ...formData, difficulty: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                    >
                      {difficulties.map(difficulty => (
                        <option key={difficulty} value={difficulty}>{difficulty}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Durata
                    </label>
                    <input
                      type="text"
                      value={formData.duration}
                      onChange={(e) => setFormData({ ...formData, duration: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                      placeholder="es. 10 minuti"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Ordine
                    </label>
                    <input
                      type="number"
                      value={formData.order}
                      onChange={(e) => setFormData({ ...formData, order: parseInt(e.target.value) || 0 })}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                    />
                  </div>

                  <div className="flex items-center space-x-3">
                    <input
                      type="checkbox"
                      id="isPublished"
                      checked={formData.isPublished}
                      onChange={(e) => setFormData({ ...formData, isPublished: e.target.checked })}
                      className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                    />
                    <label htmlFor="isPublished" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      Pubblica immediatamente
                    </label>
                  </div>
                </div>

                {/* Description */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Descrizione
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                    placeholder="Breve descrizione dell'esercizio"
                  />
                </div>

                {/* Content */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Contenuto dell'Esercizio
                  </label>
                  <textarea
                    value={formData.content}
                    onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                    rows={8}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                    placeholder="Contenuto completo dell'esercizio con istruzioni dettagliate..."
                  />
                </div>

                {/* Cover Image and Claim */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      URL Immagine di Copertina
                    </label>
                    <input
                      type="url"
                      value={formData.coverImage}
                      onChange={(e) => setFormData({ ...formData, coverImage: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                      placeholder="https://esempio.com/immagine.jpg"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Claim Motivazionale
                    </label>
                    <input
                      type="text"
                      value={formData.claim}
                      onChange={(e) => setFormData({ ...formData, claim: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                      placeholder="es. Supera i tuoi limiti"
                    />
                  </div>
                </div>

                {/* Video Selector */}
                <VideoSelector
                  value={formData.selectedVideos}
                  onChange={(videos) => setFormData({ ...formData, selectedVideos: videos })}
                  label="Video collegati all'esercizio"
                  placeholder="Seleziona uno o più video..."
                  multiple={true}
                />

                {/* Audio Selector for Explanation */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    🎵 Audio Spiegazione Esercizio
                  </label>
                  <select
                    value={formData.audioExplanation?.id || ''}
                    onChange={(e) => {
                      const selectedAudio = audios.find(audio => audio.id === e.target.value);
                      setFormData({ 
                        ...formData, 
                        audioExplanation: selectedAudio || null 
                      });
                    }}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
                  >
                    <option value="">Nessun audio di spiegazione</option>
                    {audios.map(audio => (
                      <option key={audio.id} value={audio.id}>
                        {audio.title} ({audio.duration || 'N/A'})
                      </option>
                    ))}
                  </select>
                  {formData.audioExplanation && (
                    <div className="mt-2 p-2 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                      <p className="text-sm text-blue-700 dark:text-blue-300">
                        ✓ Audio selezionato: <strong>{formData.audioExplanation.title}</strong>
                      </p>
                      {formData.audioExplanation.audioUrl && (
                        <audio 
                          controls 
                          className="mt-2 w-full"
                          src={formData.audioExplanation.audioUrl}
                        >
                          Il tuo browser non supporta l'audio.
                        </audio>
                      )}
                    </div>
                  )}
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    Gli atleti sentiranno questo audio prima di iniziare l'esercizio
                  </p>
                </div>
              </div>
            </div>

            <div className="flex justify-end space-x-3 p-6 border-t border-gray-200 dark:border-gray-600">
              <button
                onClick={closeModal}
                disabled={saving}
                className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
              >
                Annulla
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="px-4 py-2 bg-blue-500 hover:bg-blue-600 disabled:opacity-50 text-white rounded-lg flex items-center space-x-2 transition-colors"
              >
                {saving ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    <span>Salvando...</span>
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4" />
                    <span>{editingExercise ? 'Aggiorna' : 'Crea'} Esercizio</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Exercise Form Editor */}
      {showFormEditor && editingFormExercise && (
        <ExerciseFormEditor
          exercise={editingFormExercise}
          onClose={closeFormEditor}
          onSave={handleFormEditorSave}
        />
      )}
    </div>
  );
};

export default ExerciseManager;