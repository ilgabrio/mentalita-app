import React, { useState, useEffect } from 'react';
import { 
  collection, 
  query, 
  getDocs, 
  orderBy, 
  addDoc, 
  updateDoc,
  deleteDoc,
  doc,
  where,
  limit
} from 'firebase/firestore';
import { db } from '../../../config/firebase';
import { 
  Radio, 
  Plus, 
  Search, 
  Filter, 
  Edit3, 
  Trash2, 
  Play,
  Pause,
  Calendar,
  Clock,
  Download,
  Eye,
  MoreHorizontal,
  X,
  Save,
  FileAudio,
  Mic,
  AlertTriangle,
  Star,
  TrendingUp,
  Volume2
} from 'lucide-react';

const PodcastEpisodeManager = () => {
  const [episodes, setEpisodes] = useState([]);
  const [shows, setShows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [showFilter, setShowFilter] = useState('all');
  const [showModal, setShowModal] = useState(false);
  const [editingEpisode, setEditingEpisode] = useState(null);
  const [formData, setFormData] = useState({});
  const [saveLoading, setSaveLoading] = useState(false);

  const statusOptions = [
    { value: 'all', label: 'Tutti' },
    { value: 'published', label: 'Pubblicati' },
    { value: 'draft', label: 'Bozze' },
    { value: 'scheduled', label: 'Programmati' },
    { value: 'archived', label: 'Archiviati' }
  ];

  useEffect(() => {
    Promise.all([fetchEpisodes(), fetchShows()]);
  }, []);

  const fetchEpisodes = async () => {
    try {
      setLoading(true);
      const episodesQuery = query(
        collection(db, 'podcastEpisodes'),
        orderBy('publishedAt', 'desc')
      );
      
      const snapshot = await getDocs(episodesQuery);
      const episodesData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        publishedAt: doc.data().publishedAt?.toDate(),
        createdAt: doc.data().createdAt?.toDate(),
        updatedAt: doc.data().updatedAt?.toDate()
      }));
      
      setEpisodes(episodesData);
    } catch (error) {
      console.error('Error fetching podcast episodes:', error);
      // Fallback query without orderBy
      try {
        const fallbackQuery = query(collection(db, 'podcastEpisodes'));
        const snapshot = await getDocs(fallbackQuery);
        const episodesData = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          publishedAt: doc.data().publishedAt?.toDate(),
          createdAt: doc.data().createdAt?.toDate(),
          updatedAt: doc.data().updatedAt?.toDate()
        }));
        setEpisodes(episodesData.sort((a, b) => (b.publishedAt || b.createdAt || new Date()) - (a.publishedAt || a.createdAt || new Date())));
      } catch (fallbackError) {
        console.error('Fallback query failed:', fallbackError);
        setEpisodes([]);
      }
    } finally {
      setLoading(false);
    }
  };

  const fetchShows = async () => {
    try {
      const showsQuery = query(
        collection(db, 'podcastShows'),
        where('status', '==', 'active')
      );
      const snapshot = await getDocs(showsQuery);
      const showsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setShows(showsData);
    } catch (error) {
      console.error('Error fetching podcast shows:', error);
      // Fallback to get all shows
      try {
        const fallbackQuery = query(collection(db, 'podcastShows'));
        const snapshot = await getDocs(fallbackQuery);
        const showsData = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        setShows(showsData);
      } catch (fallbackError) {
        console.error('Fallback shows query failed:', fallbackError);
        setShows([]);
      }
    }
  };

  const filteredEpisodes = episodes.filter(episode => {
    const matchesSearch = 
      episode.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      episode.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      episode.showTitle?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || episode.status === statusFilter;
    const matchesShow = showFilter === 'all' || episode.showId === showFilter;
    
    return matchesSearch && matchesStatus && matchesShow;
  });

  const handleCreate = () => {
    setEditingEpisode(null);
    setFormData({
      title: '',
      description: '',
      showId: shows.length > 0 ? shows[0].id : '',
      showTitle: shows.length > 0 ? shows[0].title : '',
      season: 1,
      episodeNumber: 1,
      duration: 0,
      audioUrl: '',
      transcriptUrl: '',
      status: 'draft',
      publishedAt: null,
      tags: [],
      isExplicit: false,
      downloads: 0,
      plays: 0,
      rating: 0,
      notes: ''
    });
    setShowModal(true);
  };

  const handleEdit = (episode) => {
    setEditingEpisode(episode);
    setFormData({
      ...episode,
      publishedAt: episode.publishedAt ? episode.publishedAt.toISOString().split('T')[0] : '',
      tags: episode.tags || []
    });
    setShowModal(true);
  };

  const handleSave = async () => {
    try {
      setSaveLoading(true);
      const selectedShow = shows.find(s => s.id === formData.showId);
      
      const episodeData = {
        ...formData,
        showTitle: selectedShow?.title || '',
        publishedAt: formData.publishedAt ? new Date(formData.publishedAt) : null,
        updatedAt: new Date()
      };

      if (editingEpisode) {
        await updateDoc(doc(db, 'podcastEpisodes', editingEpisode.id), episodeData);
      } else {
        await addDoc(collection(db, 'podcastEpisodes'), {
          ...episodeData,
          createdAt: new Date()
        });
      }

      await fetchEpisodes();
      setShowModal(false);
      setEditingEpisode(null);
      setFormData({});
    } catch (error) {
      console.error('Error saving podcast episode:', error);
      alert('Errore nel salvataggio');
    } finally {
      setSaveLoading(false);
    }
  };

  const handleDelete = async (episode) => {
    if (!window.confirm(`Sei sicuro di voler eliminare l'episodio "${episode.title}"?`)) return;
    
    try {
      await deleteDoc(doc(db, 'podcastEpisodes', episode.id));
      await fetchEpisodes();
    } catch (error) {
      console.error('Error deleting podcast episode:', error);
      alert('Errore nell\'eliminazione');
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'published': return 'text-green-600 bg-green-100';
      case 'draft': return 'text-yellow-600 bg-yellow-100';
      case 'scheduled': return 'text-blue-600 bg-blue-100';
      case 'archived': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const formatDuration = (seconds) => {
    if (!seconds) return '00:00';
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const remainingSeconds = seconds % 60;
    
    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
    } else {
      return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
    }
  };

  const handleTagAdd = (tag) => {
    if (tag && !formData.tags.includes(tag)) {
      setFormData(prev => ({
        ...prev,
        tags: [...prev.tags, tag]
      }));
    }
  };

  const handleTagRemove = (tagToRemove) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.filter(tag => tag !== tagToRemove)
    }));
  };

  if (loading) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <div className="flex items-center space-x-3 mb-6">
          <Radio className="h-6 w-6 text-pink-600 dark:text-pink-400" />
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            Gestione Episodi Podcast
          </h2>
        </div>
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pink-600 mx-auto"></div>
          <p className="text-gray-500 dark:text-gray-400 mt-4">Caricamento episodi...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between mb-6">
        <div className="flex items-center space-x-3 mb-4 lg:mb-0">
          <Radio className="h-6 w-6 text-pink-600 dark:text-pink-400" />
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            Episodi Podcast ({filteredEpisodes.length})
          </h2>
        </div>
        
        <button
          onClick={handleCreate}
          disabled={shows.length === 0}
          className="flex items-center space-x-2 px-4 py-2 bg-pink-600 text-white rounded-lg hover:bg-pink-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          <Plus className="h-4 w-4" />
          <span>Nuovo Episodio</span>
        </button>
      </div>

      {shows.length === 0 && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
          <div className="flex items-center">
            <AlertTriangle className="h-5 w-5 text-yellow-600 mr-2" />
            <p className="text-yellow-800">
              Nessuno show podcast attivo trovato. <span className="font-medium">Crea prima uno show podcast</span> per poter aggiungere episodi.
            </p>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-col lg:flex-row gap-4 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="Cerca per titolo, descrizione o show..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-pink-500 focus:border-transparent w-full"
          />
        </div>
        
        <div className="flex gap-4">
          <div className="relative">
            <Filter className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="pl-10 pr-8 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-pink-500 focus:border-transparent appearance-none cursor-pointer min-w-40"
            >
              {statusOptions.map(option => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          <div className="relative">
            <Mic className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
            <select
              value={showFilter}
              onChange={(e) => setShowFilter(e.target.value)}
              className="pl-10 pr-8 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-pink-500 focus:border-transparent appearance-none cursor-pointer min-w-48"
            >
              <option value="all">Tutti gli show</option>
              {shows.map(show => (
                <option key={show.id} value={show.id}>
                  {show.title}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Episodes List */}
      {filteredEpisodes.length === 0 ? (
        <div className="text-center py-12">
          <Radio className="h-16 w-16 mx-auto mb-4 text-gray-400" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
            Nessun episodio trovato
          </h3>
          <p className="text-gray-500 dark:text-gray-400 mb-4">
            {searchTerm || statusFilter !== 'all' || showFilter !== 'all'
              ? 'Prova a modificare i filtri di ricerca'
              : shows.length === 0
              ? 'Crea prima uno show podcast per aggiungere episodi'
              : 'Non ci sono ancora episodi'
            }
          </p>
          {!searchTerm && statusFilter === 'all' && showFilter === 'all' && shows.length > 0 && (
            <button
              onClick={handleCreate}
              className="inline-flex items-center space-x-2 px-4 py-2 bg-pink-600 text-white rounded-lg hover:bg-pink-700 transition-colors"
            >
              <Plus className="h-4 w-4" />
              <span>Crea il primo episodio</span>
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {filteredEpisodes.map(episode => (
            <div key={episode.id} className="bg-gray-50 dark:bg-gray-700 rounded-lg p-6 hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  {/* Episode Header */}
                  <div className="flex items-center space-x-3 mb-2">
                    <div className="flex items-center space-x-2">
                      <FileAudio className="h-5 w-5 text-pink-600" />
                      <span className="text-sm font-medium text-gray-600 dark:text-gray-300">
                        {episode.showTitle}
                      </span>
                      {episode.season && episode.episodeNumber && (
                        <span className="text-sm text-gray-500 dark:text-gray-400">
                          S{episode.season}E{episode.episodeNumber}
                        </span>
                      )}
                    </div>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(episode.status)}`}>
                      {statusOptions.find(s => s.value === episode.status)?.label || episode.status}
                    </span>
                  </div>

                  {/* Episode Title */}
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2 line-clamp-1">
                    {episode.title}
                  </h3>

                  {/* Episode Description */}
                  <p className="text-sm text-gray-600 dark:text-gray-300 mb-3 line-clamp-2">
                    {episode.description}
                  </p>

                  {/* Episode Stats */}
                  <div className="flex items-center space-x-6 text-sm text-gray-500 dark:text-gray-400 mb-3">
                    <div className="flex items-center space-x-1">
                      <Clock className="h-4 w-4" />
                      <span>{formatDuration(episode.duration)}</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <Play className="h-4 w-4" />
                      <span>{episode.plays || 0} plays</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <Download className="h-4 w-4" />
                      <span>{episode.downloads || 0} downloads</span>
                    </div>
                    {episode.rating > 0 && (
                      <div className="flex items-center space-x-1">
                        <Star className="h-4 w-4" />
                        <span>{episode.rating}/5</span>
                      </div>
                    )}
                    {episode.publishedAt && (
                      <div className="flex items-center space-x-1">
                        <Calendar className="h-4 w-4" />
                        <span>{episode.publishedAt.toLocaleDateString('it-IT')}</span>
                      </div>
                    )}
                  </div>

                  {/* Tags */}
                  {episode.tags && episode.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1 mb-3">
                      {episode.tags.slice(0, 4).map(tag => (
                        <span key={tag} className="px-2 py-1 bg-pink-100 text-pink-700 text-xs rounded">
                          {tag}
                        </span>
                      ))}
                      {episode.tags.length > 4 && (
                        <span className="text-xs text-gray-500">+{episode.tags.length - 4}</span>
                      )}
                    </div>
                  )}

                  {/* Audio URL Preview */}
                  {episode.audioUrl && (
                    <div className="flex items-center space-x-2 text-xs text-gray-500 dark:text-gray-400">
                      <Volume2 className="h-3 w-3" />
                      <span className="truncate">Audio: {episode.audioUrl}</span>
                    </div>
                  )}
                </div>

                {/* Actions */}
                <div className="flex items-center space-x-2 ml-4">
                  <button
                    onClick={() => handleEdit(episode)}
                    className="flex items-center justify-center p-2 text-pink-600 hover:text-pink-800 hover:bg-pink-100 rounded transition-colors"
                  >
                    <Edit3 className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(episode)}
                    className="flex items-center justify-center p-2 text-red-600 hover:text-red-800 hover:bg-red-100 rounded transition-colors"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-8 mx-auto p-5 border w-11/12 max-w-4xl shadow-lg rounded-md bg-white dark:bg-gray-800">
            <div className="mt-3">
              {/* Modal Header */}
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                  {editingEpisode ? 'Modifica Episodio' : 'Nuovo Episodio'}
                </h3>
                <button
                  onClick={() => setShowModal(false)}
                  className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>

              {/* Form */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                {/* Basic Info */}
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Show Podcast *
                    </label>
                    <select
                      value={formData.showId || ''}
                      onChange={(e) => {
                        const selectedShow = shows.find(s => s.id === e.target.value);
                        setFormData(prev => ({ 
                          ...prev, 
                          showId: e.target.value,
                          showTitle: selectedShow?.title || ''
                        }));
                      }}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                      required
                    >
                      {shows.map(show => (
                        <option key={show.id} value={show.id}>{show.title}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Titolo Episodio *
                    </label>
                    <input
                      type="text"
                      value={formData.title || ''}
                      onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Descrizione *
                    </label>
                    <textarea
                      value={formData.description || ''}
                      onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                      rows={4}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                      required
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Stagione
                      </label>
                      <input
                        type="number"
                        value={formData.season || 1}
                        onChange={(e) => setFormData(prev => ({ ...prev, season: parseInt(e.target.value) || 1 }))}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                        min="1"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Numero Episodio
                      </label>
                      <input
                        type="number"
                        value={formData.episodeNumber || 1}
                        onChange={(e) => setFormData(prev => ({ ...prev, episodeNumber: parseInt(e.target.value) || 1 }))}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                        min="1"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Durata (secondi)
                    </label>
                    <input
                      type="number"
                      value={formData.duration || 0}
                      onChange={(e) => setFormData(prev => ({ ...prev, duration: parseInt(e.target.value) || 0 }))}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                      min="0"
                      placeholder="Es: 1800 per 30 minuti"
                    />
                    {formData.duration > 0 && (
                      <p className="text-sm text-gray-500 mt-1">
                        Durata: {formatDuration(formData.duration)}
                      </p>
                    )}
                  </div>
                </div>

                {/* Settings */}
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Stato
                    </label>
                    <select
                      value={formData.status || 'draft'}
                      onChange={(e) => setFormData(prev => ({ ...prev, status: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                    >
                      {statusOptions.slice(1).map(option => (
                        <option key={option.value} value={option.value}>{option.label}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Data di Pubblicazione
                    </label>
                    <input
                      type="date"
                      value={formData.publishedAt || ''}
                      onChange={(e) => setFormData(prev => ({ ...prev, publishedAt: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      URL Audio *
                    </label>
                    <input
                      type="url"
                      value={formData.audioUrl || ''}
                      onChange={(e) => setFormData(prev => ({ ...prev, audioUrl: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                      placeholder="https://example.com/episode.mp3"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      URL Trascrizione
                    </label>
                    <input
                      type="url"
                      value={formData.transcriptUrl || ''}
                      onChange={(e) => setFormData(prev => ({ ...prev, transcriptUrl: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                      placeholder="https://example.com/transcript.txt"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Note
                    </label>
                    <textarea
                      value={formData.notes || ''}
                      onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                      placeholder="Note per l'episodio..."
                    />
                  </div>

                  <div>
                    <label className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        checked={formData.isExplicit || false}
                        onChange={(e) => setFormData(prev => ({ ...prev, isExplicit: e.target.checked }))}
                        className="rounded border-gray-300 text-pink-600 focus:ring-pink-500"
                      />
                      <span className="text-sm text-gray-700 dark:text-gray-300">Contenuto esplicito</span>
                    </label>
                  </div>
                </div>
              </div>

              {/* Tags */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Tag
                </label>
                <div className="flex flex-wrap gap-2 mb-3">
                  {formData.tags && formData.tags.map(tag => (
                    <span key={tag} className="inline-flex items-center px-3 py-1 bg-pink-100 text-pink-700 rounded-full text-sm">
                      {tag}
                      <button
                        type="button"
                        onClick={() => handleTagRemove(tag)}
                        className="ml-2 text-pink-500 hover:text-pink-700"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </span>
                  ))}
                </div>
                <input
                  type="text"
                  placeholder="Aggiungi un tag e premi Enter..."
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      const tag = e.target.value.trim();
                      if (tag) {
                        handleTagAdd(tag);
                        e.target.value = '';
                      }
                    }
                  }}
                />
              </div>

              {/* Actions */}
              <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200 dark:border-gray-700">
                <button
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                >
                  Annulla
                </button>
                <button
                  onClick={handleSave}
                  disabled={saveLoading || !formData.title || !formData.description || !formData.audioUrl || !formData.showId}
                  className="flex items-center space-x-2 px-4 py-2 bg-pink-600 text-white rounded-lg hover:bg-pink-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <Save className="h-4 w-4" />
                  <span>{saveLoading ? 'Salvataggio...' : 'Salva'}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PodcastEpisodeManager;