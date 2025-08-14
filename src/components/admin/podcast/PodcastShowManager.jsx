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
  Mic, 
  Plus, 
  Search, 
  Filter, 
  Edit3, 
  Trash2, 
  Eye,
  MoreHorizontal,
  Calendar,
  Clock,
  Users,
  Globe,
  Star,
  Play,
  Pause,
  X,
  Save,
  Image as ImageIcon,
  Tag,
  AlertTriangle
} from 'lucide-react';

const PodcastShowManager = () => {
  const [shows, setShows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [showModal, setShowModal] = useState(false);
  const [editingShow, setEditingShow] = useState(null);
  const [formData, setFormData] = useState({});
  const [saveLoading, setSaveLoading] = useState(false);

  const statusOptions = [
    { value: 'all', label: 'Tutti' },
    { value: 'active', label: 'Attivi' },
    { value: 'inactive', label: 'Inattivi' },
    { value: 'draft', label: 'Bozze' },
    { value: 'archived', label: 'Archiviati' }
  ];

  const categoryOptions = [
    'Sport e Fitness',
    'Motivazione',
    'Psicologia Sportiva',
    'Allenamento Mentale',
    'Benessere',
    'Prestazione',
    'Recovery',
    'Mindfulness',
    'Leadership',
    'Team Building'
  ];

  useEffect(() => {
    fetchShows();
  }, []);

  const fetchShows = async () => {
    try {
      setLoading(true);
      const showsQuery = query(
        collection(db, 'podcastShows'),
        orderBy('createdAt', 'desc')
      );
      
      const snapshot = await getDocs(showsQuery);
      const showsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate(),
        updatedAt: doc.data().updatedAt?.toDate()
      }));
      
      setShows(showsData);
    } catch (error) {
      console.error('Error fetching podcast shows:', error);
      // Fallback query without orderBy
      try {
        const fallbackQuery = query(collection(db, 'podcastShows'));
        const snapshot = await getDocs(fallbackQuery);
        const showsData = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          createdAt: doc.data().createdAt?.toDate(),
          updatedAt: doc.data().updatedAt?.toDate()
        }));
        setShows(showsData.sort((a, b) => (b.createdAt || new Date()) - (a.createdAt || new Date())));
      } catch (fallbackError) {
        console.error('Fallback query failed:', fallbackError);
        setShows([]);
      }
    } finally {
      setLoading(false);
    }
  };

  const filteredShows = shows.filter(show => {
    const matchesSearch = 
      show.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      show.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      show.host?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || show.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  const handleCreate = () => {
    setEditingShow(null);
    setFormData({
      title: '',
      description: '',
      host: '',
      coverImage: '',
      category: categoryOptions[0],
      status: 'draft',
      language: 'it',
      isExplicit: false,
      tags: [],
      website: '',
      rssUrl: '',
      totalEpisodes: 0,
      avgDuration: 30,
      rating: 0,
      subscribers: 0
    });
    setShowModal(true);
  };

  const handleEdit = (show) => {
    setEditingShow(show);
    setFormData({
      ...show,
      tags: show.tags || []
    });
    setShowModal(true);
  };

  const handleSave = async () => {
    try {
      setSaveLoading(true);
      const showData = {
        ...formData,
        updatedAt: new Date()
      };

      if (editingShow) {
        await updateDoc(doc(db, 'podcastShows', editingShow.id), showData);
      } else {
        await addDoc(collection(db, 'podcastShows'), {
          ...showData,
          createdAt: new Date()
        });
      }

      await fetchShows();
      setShowModal(false);
      setEditingShow(null);
      setFormData({});
    } catch (error) {
      console.error('Error saving podcast show:', error);
      alert('Errore nel salvataggio');
    } finally {
      setSaveLoading(false);
    }
  };

  const handleDelete = async (show) => {
    if (!window.confirm(`Sei sicuro di voler eliminare lo show "${show.title}"?`)) return;
    
    try {
      await deleteDoc(doc(db, 'podcastShows', show.id));
      await fetchShows();
    } catch (error) {
      console.error('Error deleting podcast show:', error);
      alert('Errore nell\'eliminazione');
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'active': return 'text-green-600 bg-green-100';
      case 'inactive': return 'text-gray-600 bg-gray-100';
      case 'draft': return 'text-yellow-600 bg-yellow-100';
      case 'archived': return 'text-red-600 bg-red-100';
      default: return 'text-blue-600 bg-blue-100';
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
          <Mic className="h-6 w-6 text-purple-600 dark:text-purple-400" />
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            Gestione Show Podcast
          </h2>
        </div>
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto"></div>
          <p className="text-gray-500 dark:text-gray-400 mt-4">Caricamento show podcast...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between mb-6">
        <div className="flex items-center space-x-3 mb-4 lg:mb-0">
          <Mic className="h-6 w-6 text-purple-600 dark:text-purple-400" />
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            Show Podcast ({filteredShows.length})
          </h2>
        </div>
        
        <button
          onClick={handleCreate}
          className="flex items-center space-x-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
        >
          <Plus className="h-4 w-4" />
          <span>Nuovo Show</span>
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="Cerca per titolo, descrizione o host..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent w-full"
          />
        </div>
        
        <div className="relative">
          <Filter className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="pl-10 pr-8 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent appearance-none cursor-pointer min-w-48"
          >
            {statusOptions.map(option => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Shows Grid */}
      {filteredShows.length === 0 ? (
        <div className="text-center py-12">
          <Mic className="h-16 w-16 mx-auto mb-4 text-gray-400" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
            Nessuno show trovato
          </h3>
          <p className="text-gray-500 dark:text-gray-400 mb-4">
            {searchTerm || statusFilter !== 'all' 
              ? 'Prova a modificare i filtri di ricerca'
              : 'Non ci sono ancora show podcast'
            }
          </p>
          {!searchTerm && statusFilter === 'all' && (
            <button
              onClick={handleCreate}
              className="inline-flex items-center space-x-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
            >
              <Plus className="h-4 w-4" />
              <span>Crea il primo show</span>
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {filteredShows.map(show => (
            <div key={show.id} className="bg-gray-50 dark:bg-gray-700 rounded-lg p-6 hover:shadow-md transition-shadow">
              {/* Cover Image */}
              <div className="mb-4">
                {show.coverImage ? (
                  <img
                    src={show.coverImage}
                    alt={show.title}
                    className="w-full h-40 object-cover rounded-lg"
                  />
                ) : (
                  <div className="w-full h-40 bg-gradient-to-br from-purple-400 to-pink-400 rounded-lg flex items-center justify-center">
                    <Mic className="h-12 w-12 text-white" />
                  </div>
                )}
              </div>

              {/* Show Info */}
              <div className="mb-4">
                <div className="flex items-start justify-between mb-2">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white line-clamp-2">
                    {show.title}
                  </h3>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(show.status)}`}>
                    {statusOptions.find(s => s.value === show.status)?.label || show.status}
                  </span>
                </div>
                
                <p className="text-sm text-gray-600 dark:text-gray-300 mb-2">
                  Host: {show.host}
                </p>
                
                <p className="text-sm text-gray-500 dark:text-gray-400 line-clamp-2 mb-3">
                  {show.description}
                </p>

                {/* Stats */}
                <div className="grid grid-cols-2 gap-2 text-xs text-gray-500 dark:text-gray-400 mb-3">
                  <div className="flex items-center">
                    <Play className="h-3 w-3 mr-1" />
                    <span>{show.totalEpisodes || 0} ep.</span>
                  </div>
                  <div className="flex items-center">
                    <Clock className="h-3 w-3 mr-1" />
                    <span>~{show.avgDuration || 30}min</span>
                  </div>
                  <div className="flex items-center">
                    <Users className="h-3 w-3 mr-1" />
                    <span>{show.subscribers || 0} sub</span>
                  </div>
                  <div className="flex items-center">
                    <Star className="h-3 w-3 mr-1" />
                    <span>{show.rating || 0}/5</span>
                  </div>
                </div>

                {/* Tags */}
                {show.tags && show.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1 mb-3">
                    {show.tags.slice(0, 3).map(tag => (
                      <span key={tag} className="px-2 py-1 bg-purple-100 text-purple-700 text-xs rounded">
                        {tag}
                      </span>
                    ))}
                    {show.tags.length > 3 && (
                      <span className="text-xs text-gray-500">+{show.tags.length - 3}</span>
                    )}
                  </div>
                )}
              </div>

              {/* Actions */}
              <div className="flex space-x-2">
                <button
                  onClick={() => handleEdit(show)}
                  className="flex-1 flex items-center justify-center space-x-1 px-3 py-2 text-purple-600 hover:text-purple-800 hover:bg-purple-100 rounded transition-colors"
                >
                  <Edit3 className="h-4 w-4" />
                  <span className="text-sm">Modifica</span>
                </button>
                <button
                  onClick={() => handleDelete(show)}
                  className="flex items-center justify-center px-3 py-2 text-red-600 hover:text-red-800 hover:bg-red-100 rounded transition-colors"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
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
                  {editingShow ? 'Modifica Show Podcast' : 'Nuovo Show Podcast'}
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
                      Titolo *
                    </label>
                    <input
                      type="text"
                      value={formData.title || ''}
                      onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Host *
                    </label>
                    <input
                      type="text"
                      value={formData.host || ''}
                      onChange={(e) => setFormData(prev => ({ ...prev, host: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent"
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
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      URL Immagine di copertina
                    </label>
                    <input
                      type="url"
                      value={formData.coverImage || ''}
                      onChange={(e) => setFormData(prev => ({ ...prev, coverImage: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      placeholder="https://example.com/image.jpg"
                    />
                  </div>
                </div>

                {/* Settings */}
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Categoria
                    </label>
                    <select
                      value={formData.category || categoryOptions[0]}
                      onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    >
                      {categoryOptions.map(category => (
                        <option key={category} value={category}>{category}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Stato
                    </label>
                    <select
                      value={formData.status || 'draft'}
                      onChange={(e) => setFormData(prev => ({ ...prev, status: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    >
                      {statusOptions.slice(1).map(option => (
                        <option key={option.value} value={option.value}>{option.label}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Sito web
                    </label>
                    <input
                      type="url"
                      value={formData.website || ''}
                      onChange={(e) => setFormData(prev => ({ ...prev, website: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      placeholder="https://www.example.com"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      RSS Feed URL
                    </label>
                    <input
                      type="url"
                      value={formData.rssUrl || ''}
                      onChange={(e) => setFormData(prev => ({ ...prev, rssUrl: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      placeholder="https://example.com/feed.xml"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Durata Media (min)
                      </label>
                      <input
                        type="number"
                        value={formData.avgDuration || 30}
                        onChange={(e) => setFormData(prev => ({ ...prev, avgDuration: parseInt(e.target.value) || 0 }))}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                        min="1"
                        max="300"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Lingua
                      </label>
                      <select
                        value={formData.language || 'it'}
                        onChange={(e) => setFormData(prev => ({ ...prev, language: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      >
                        <option value="it">Italiano</option>
                        <option value="en">English</option>
                        <option value="es">Español</option>
                        <option value="fr">Français</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        checked={formData.isExplicit || false}
                        onChange={(e) => setFormData(prev => ({ ...prev, isExplicit: e.target.checked }))}
                        className="rounded border-gray-300 text-purple-600 focus:ring-purple-500"
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
                    <span key={tag} className="inline-flex items-center px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-sm">
                      {tag}
                      <button
                        type="button"
                        onClick={() => handleTagRemove(tag)}
                        className="ml-2 text-purple-500 hover:text-purple-700"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </span>
                  ))}
                </div>
                <input
                  type="text"
                  placeholder="Aggiungi un tag e premi Enter..."
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent"
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
                  disabled={saveLoading || !formData.title || !formData.host || !formData.description}
                  className="flex items-center space-x-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
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

export default PodcastShowManager;