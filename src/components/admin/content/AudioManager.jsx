import React, { useState, useEffect } from 'react';
import { 
  collection, 
  query, 
  orderBy, 
  getDocs, 
  doc, 
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
  Play,
  Calendar,
  User,
  Clock,
  ExternalLink,
  Music,
  Pause,
  Image
} from 'lucide-react';

const AudioManager = () => {
  const [audios, setAudios] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState('all');
  const [showModal, setShowModal] = useState(false);
  const [editingAudio, setEditingAudio] = useState(null);
  const [saving, setSaving] = useState(false);

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    audioUrl: '',
    category: '',
    duration: '',
    narrator: '',
    difficulty: 'Principiante',
    featured: false,
    thumbnail: '',
    tags: []
  });

  const categories = [
    'Meditazione',
    'Rilassamento', 
    'Respirazione',
    'Visualizzazione',
    'Motivazione',
    'Concentrazione',
    'Sonno',
    'Affermazioni'
  ];

  const difficulties = ['Principiante', 'Intermedio', 'Avanzato'];

  useEffect(() => {
    fetchAudios();
  }, []);

  const fetchAudios = async () => {
    try {
      setLoading(true);
      console.log('🎵 Caricamento audio...');
      
      const audiosQuery = query(
        collection(db, 'audioContent'),
        orderBy('createdAt', 'desc')
      );
      const snapshot = await getDocs(audiosQuery);
      const audiosData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      
      console.log('✅ Audio caricati:', audiosData.length);
      setAudios(audiosData);
    } catch (error) {
      console.error('Errore nel caricamento degli audio:', error);
      // Fallback: carica senza orderBy se l'indice non esiste
      try {
        const snapshot = await getDocs(collection(db, 'audioContent'));
        const audiosData = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        setAudios(audiosData);
      } catch (fallbackError) {
        console.error('Errore anche nel fallback:', fallbackError);
        setAudios([]);
      }
    } finally {
      setLoading(false);
    }
  };

  const openModal = (audio = null) => {
    if (audio) {
      setEditingAudio(audio);
      setFormData({
        title: audio.title || '',
        description: audio.description || '',
        audioUrl: audio.audioUrl || '',
        category: audio.category || '',
        duration: audio.duration || '',
        narrator: audio.narrator || '',
        difficulty: audio.difficulty || 'Principiante',
        featured: audio.featured || false,
        thumbnail: audio.thumbnail || '',
        tags: audio.tags || []
      });
    } else {
      setEditingAudio(null);
      setFormData({
        title: '',
        description: '',
        audioUrl: '',
        category: '',
        duration: '',
        narrator: '',
        difficulty: 'Principiante',
        featured: false,
        thumbnail: '',
        tags: []
      });
    }
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingAudio(null);
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSave = async () => {
    try {
      setSaving(true);

      const audioData = {
        ...formData,
        updatedAt: new Date()
      };

      if (editingAudio) {
        await updateDoc(doc(db, 'audioContent', editingAudio.id), audioData);
      } else {
        await addDoc(collection(db, 'audioContent'), {
          ...audioData,
          createdAt: new Date()
        });
      }

      await fetchAudios();
      closeModal();
      alert(editingAudio ? 'Audio aggiornato con successo!' : 'Audio creato con successo!');
    } catch (error) {
      console.error('Errore nel salvataggio:', error);
      alert('Errore nel salvataggio dell\'audio');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (audioId, audioTitle) => {
    if (!confirm(`Sei sicuro di voler eliminare l'audio "${audioTitle}"?`)) {
      return;
    }

    try {
      await deleteDoc(doc(db, 'audioContent', audioId));
      await fetchAudios();
      alert('Audio eliminato con successo!');
    } catch (error) {
      console.error('Errore nell\'eliminazione:', error);
      alert('Errore nell\'eliminazione dell\'audio');
    }
  };

  const toggleFeatured = async (audioId, currentStatus) => {
    try {
      await updateDoc(doc(db, 'audioContent', audioId), {
        featured: !currentStatus,
        updatedAt: new Date()
      });
      await fetchAudios();
    } catch (error) {
      console.error('Errore nell\'aggiornamento:', error);
      alert('Errore nell\'aggiornamento dello stato featured');
    }
  };

  const filteredAudios = audios.filter(audio => {
    const matchesSearch = audio.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          audio.description?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = filterCategory === 'all' || audio.category === filterCategory;
    return matchesSearch && matchesCategory;
  });

  const formatDate = (date) => {
    if (!date) return 'N/A';
    const audioDate = date.toDate ? date.toDate() : new Date(date);
    return audioDate.toLocaleDateString('it-IT');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-2 text-gray-600 dark:text-gray-400">Caricamento audio...</span>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center space-x-3">
          <Music className="h-6 w-6 text-blue-600 dark:text-blue-400" />
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            Gestione Audio
          </h2>
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => window.open('/admin-audio-images', '_blank')}
            className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors"
          >
            <Image className="h-4 w-4" />
            <span>Gestisci Immagini</span>
          </button>
          <button
            onClick={() => openModal()}
            className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors"
          >
            <Plus className="h-4 w-4" />
            <span>Nuovo Audio</span>
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="Cerca audio..."
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

        <div className="text-sm text-gray-500 dark:text-gray-400 flex items-center">
          <Music className="h-4 w-4 mr-2" />
          {filteredAudios.length} audio
        </div>
      </div>

      {/* Audio List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredAudios.length === 0 ? (
          <div className="col-span-full text-center py-8">
            <Music className="h-16 w-16 mx-auto mb-4 text-gray-400" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
              Nessun audio trovato
            </h3>
            <p className="text-gray-500 dark:text-gray-400">
              {audios.length === 0 ? 'Inizia creando il primo audio' : 'Modifica i filtri per vedere più risultati'}
            </p>
          </div>
        ) : (
          filteredAudios.map((audio) => (
            <div key={audio.id} className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-lg overflow-hidden hover:shadow-lg transition-shadow">
              {/* Audio Thumbnail */}
              <div className="relative aspect-video bg-gradient-to-br from-blue-400 to-purple-600">
                {audio.thumbnail ? (
                  <img 
                    src={audio.thumbnail} 
                    alt={audio.title}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <Music className="h-12 w-12 text-white opacity-75" />
                  </div>
                )}
                
                {/* Play overlay */}
                <div className="absolute inset-0 flex items-center justify-center opacity-0 hover:opacity-100 bg-black bg-opacity-30 transition-opacity">
                  <div className="bg-white rounded-full p-3">
                    <Play className="h-6 w-6 text-gray-900" />
                  </div>
                </div>
                
                {/* Duration badge */}
                {audio.duration && (
                  <div className="absolute bottom-2 right-2 bg-black bg-opacity-75 text-white text-xs px-2 py-1 rounded">
                    {audio.duration}
                  </div>
                )}
              </div>
              
              {/* Audio Info */}
              <div className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-xs font-medium text-blue-600 dark:text-blue-400 bg-blue-100 dark:bg-blue-900/20 px-2 py-1 rounded">
                    {audio.category || 'Generale'}
                  </span>
                  {audio.difficulty && (
                    <span className="text-xs text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded">
                      {audio.difficulty}
                    </span>
                  )}
                </div>
                
                <h3 className="font-semibold text-gray-900 dark:text-white mb-2 line-clamp-2">
                  {audio.title}
                </h3>
                
                <p className="text-gray-600 dark:text-gray-300 text-sm mb-3 line-clamp-2">
                  {audio.description}
                </p>
                
                <div className="flex items-center justify-between text-sm text-gray-500 dark:text-gray-400 mb-3">
                  {audio.narrator && (
                    <div className="flex items-center gap-1">
                      <User className="h-3 w-3" />
                      <span>{audio.narrator}</span>
                    </div>
                  )}
                  <div className="flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    <span>{formatDate(audio.createdAt)}</span>
                  </div>
                </div>
                
                {/* Actions */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-1">
                    {audio.audioUrl && (
                      <a
                        href={audio.audioUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-1 text-gray-400 hover:text-blue-500 transition-colors"
                        title="Apri audio"
                      >
                        <ExternalLink className="h-4 w-4" />
                      </a>
                    )}
                    <button
                      onClick={() => toggleFeatured(audio.id, audio.featured)}
                      className={`p-1 rounded transition-colors ${
                        audio.featured
                          ? 'text-yellow-500 hover:bg-yellow-50 dark:hover:bg-yellow-900/20'
                          : 'text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700'
                      }`}
                      title={audio.featured ? 'Rimuovi da in evidenza' : 'Metti in evidenza'}
                    >
                      <Eye className="h-4 w-4" />
                    </button>
                  </div>
                  
                  <div className="flex items-center space-x-1">
                    <button
                      onClick={() => openModal(audio)}
                      className="p-1 text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded transition-colors"
                      title="Modifica"
                    >
                      <Edit3 className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(audio.id, audio.title)}
                      className="p-1 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-colors"
                      title="Elimina"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Modal for Create/Edit Audio */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
            <div className="flex justify-between items-center p-6 border-b border-gray-200 dark:border-gray-600">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                {editingAudio ? 'Modifica Audio' : 'Nuovo Audio'}
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
                {/* Titolo */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Titolo
                  </label>
                  <input
                    type="text"
                    name="title"
                    value={formData.title}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                    placeholder="Inserisci il titolo dell'audio"
                  />
                </div>

                {/* Descrizione */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Descrizione
                  </label>
                  <textarea
                    name="description"
                    value={formData.description}
                    onChange={handleInputChange}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white resize-none"
                    placeholder="Breve descrizione dell'audio"
                  />
                </div>

                {/* URL Audio */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    URL Audio
                  </label>
                  <input
                    type="url"
                    name="audioUrl"
                    value={formData.audioUrl}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                    placeholder="https://esempio.com/audio.mp3"
                  />
                </div>

                {/* Categoria e Difficoltà */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Categoria
                    </label>
                    <select
                      name="category"
                      value={formData.category}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                    >
                      <option value="">Seleziona categoria</option>
                      {categories.map(category => (
                        <option key={category} value={category}>{category}</option>
                      ))}
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Difficoltà
                    </label>
                    <select
                      name="difficulty"
                      value={formData.difficulty}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                    >
                      {difficulties.map(difficulty => (
                        <option key={difficulty} value={difficulty}>{difficulty}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Durata e Narratore */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Durata
                    </label>
                    <input
                      type="text"
                      name="duration"
                      value={formData.duration}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                      placeholder="es. 15:30"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Narratore
                    </label>
                    <input
                      type="text"
                      name="narrator"
                      value={formData.narrator}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                      placeholder="Nome narratore"
                    />
                  </div>
                </div>

                {/* Thumbnail URL */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    URL Thumbnail (opzionale)
                  </label>
                  <input
                    type="url"
                    name="thumbnail"
                    value={formData.thumbnail}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                    placeholder="URL thumbnail personalizzata"
                  />
                </div>

                {/* Featured */}
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    name="featured"
                    checked={formData.featured}
                    onChange={handleInputChange}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <label className="ml-2 block text-sm text-gray-700 dark:text-gray-300">
                    Audio in evidenza
                  </label>
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
                    <span>{editingAudio ? 'Aggiorna' : 'Crea'} Audio</span>
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

export default AudioManager;