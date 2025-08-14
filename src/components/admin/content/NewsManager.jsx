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
  Calendar,
  User,
  ExternalLink,
  Newspaper,
  Image,
  Tag
} from 'lucide-react';

const NewsManager = () => {
  const [news, setNews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState('all');
  const [showModal, setShowModal] = useState(false);
  const [editingNews, setEditingNews] = useState(null);
  const [saving, setSaving] = useState(false);

  const [formData, setFormData] = useState({
    title: '',
    content: '',
    excerpt: '',
    category: '',
    author: '',
    featured: false,
    published: true,
    imageUrl: '',
    tags: [],
    source: '',
    sourceUrl: ''
  });

  const categories = [
    'Sport',
    'Mental Health',
    'Ricerca',
    'Tecnologia',
    'Coaching',
    'Successo',
    'Motivazione',
    'Generale'
  ];

  useEffect(() => {
    fetchNews();
  }, []);

  const fetchNews = async () => {
    try {
      setLoading(true);
      console.log('📰 Caricamento news...');
      
      const newsQuery = query(
        collection(db, 'news'),
        orderBy('createdAt', 'desc')
      );
      const snapshot = await getDocs(newsQuery);
      const newsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      
      console.log('✅ News caricate:', newsData.length);
      setNews(newsData);
    } catch (error) {
      console.error('Errore nel caricamento delle news:', error);
      // Fallback: carica senza orderBy se l'indice non esiste
      try {
        const snapshot = await getDocs(collection(db, 'news'));
        const newsData = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        setNews(newsData);
      } catch (fallbackError) {
        console.error('Errore anche nel fallback:', fallbackError);
        setNews([]);
      }
    } finally {
      setLoading(false);
    }
  };

  const openModal = (newsItem = null) => {
    if (newsItem) {
      setEditingNews(newsItem);
      setFormData({
        title: newsItem.title || '',
        content: newsItem.content || '',
        excerpt: newsItem.excerpt || '',
        category: newsItem.category || '',
        author: newsItem.author || '',
        featured: newsItem.featured || false,
        published: newsItem.published !== false,
        imageUrl: newsItem.imageUrl || '',
        tags: newsItem.tags || [],
        source: newsItem.source || '',
        sourceUrl: newsItem.sourceUrl || ''
      });
    } else {
      setEditingNews(null);
      setFormData({
        title: '',
        content: '',
        excerpt: '',
        category: '',
        author: '',
        featured: false,
        published: true,
        imageUrl: '',
        tags: [],
        source: '',
        sourceUrl: ''
      });
    }
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingNews(null);
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleTagsChange = (e) => {
    const value = e.target.value;
    const tags = value.split(',').map(tag => tag.trim()).filter(tag => tag);
    setFormData(prev => ({
      ...prev,
      tags
    }));
  };

  const handleSave = async () => {
    try {
      setSaving(true);

      const newsData = {
        ...formData,
        updatedAt: new Date()
      };

      if (editingNews) {
        await updateDoc(doc(db, 'news', editingNews.id), newsData);
      } else {
        await addDoc(collection(db, 'news'), {
          ...newsData,
          createdAt: new Date()
        });
      }

      await fetchNews();
      closeModal();
      alert(editingNews ? 'News aggiornata con successo!' : 'News creata con successo!');
    } catch (error) {
      console.error('Errore nel salvataggio:', error);
      alert('Errore nel salvataggio della news');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (newsId, newsTitle) => {
    if (!confirm(`Sei sicuro di voler eliminare la news "${newsTitle}"?`)) {
      return;
    }

    try {
      await deleteDoc(doc(db, 'news', newsId));
      await fetchNews();
      alert('News eliminata con successo!');
    } catch (error) {
      console.error('Errore nell\'eliminazione:', error);
      alert('Errore nell\'eliminazione della news');
    }
  };

  const toggleFeatured = async (newsId, currentStatus) => {
    try {
      await updateDoc(doc(db, 'news', newsId), {
        featured: !currentStatus,
        updatedAt: new Date()
      });
      await fetchNews();
    } catch (error) {
      console.error('Errore nell\'aggiornamento:', error);
      alert('Errore nell\'aggiornamento dello stato featured');
    }
  };

  const togglePublished = async (newsId, currentStatus) => {
    try {
      await updateDoc(doc(db, 'news', newsId), {
        published: !currentStatus,
        updatedAt: new Date()
      });
      await fetchNews();
    } catch (error) {
      console.error('Errore nell\'aggiornamento:', error);
      alert('Errore nell\'aggiornamento dello stato pubblicazione');
    }
  };

  const filteredNews = news.filter(newsItem => {
    const matchesSearch = newsItem.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          newsItem.content?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          newsItem.excerpt?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = filterCategory === 'all' || newsItem.category === filterCategory;
    return matchesSearch && matchesCategory;
  });

  const formatDate = (date) => {
    if (!date) return 'N/A';
    const newsDate = date.toDate ? date.toDate() : new Date(date);
    return newsDate.toLocaleDateString('it-IT');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-600"></div>
        <span className="ml-2 text-gray-600 dark:text-gray-400">Caricamento news...</span>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center space-x-3">
          <Newspaper className="h-6 w-6 text-orange-600 dark:text-orange-400" />
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            Gestione News
          </h2>
        </div>
        <button
          onClick={() => openModal()}
          className="bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors"
        >
          <Plus className="h-4 w-4" />
          <span>Nuova News</span>
        </button>
      </div>

      {/* Filters */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="Cerca news..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 dark:bg-gray-700 dark:text-white"
          />
        </div>
        
        <select
          value={filterCategory}
          onChange={(e) => setFilterCategory(e.target.value)}
          className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 dark:bg-gray-700 dark:text-white"
        >
          <option value="all">Tutte le categorie</option>
          {categories.map(category => (
            <option key={category} value={category}>{category}</option>
          ))}
        </select>

        <div className="text-sm text-gray-500 dark:text-gray-400 flex items-center">
          <Newspaper className="h-4 w-4 mr-2" />
          {filteredNews.length} news
        </div>
      </div>

      {/* News List */}
      <div className="space-y-4">
        {filteredNews.length === 0 ? (
          <div className="text-center py-8">
            <Newspaper className="h-16 w-16 mx-auto mb-4 text-gray-400" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
              Nessuna news trovata
            </h3>
            <p className="text-gray-500 dark:text-gray-400">
              {news.length === 0 ? 'Inizia creando la prima news' : 'Modifica i filtri per vedere più risultati'}
            </p>
          </div>
        ) : (
          filteredNews.map((newsItem) => (
            <div key={newsItem.id} className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-lg overflow-hidden hover:shadow-lg transition-shadow">
              <div className="flex">
                {/* News Image */}
                <div className="w-48 h-32 bg-gray-200 dark:bg-gray-600 flex-shrink-0">
                  {newsItem.imageUrl ? (
                    <img 
                      src={newsItem.imageUrl} 
                      alt={newsItem.title}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Image className="h-8 w-8 text-gray-400" />
                    </div>
                  )}
                </div>
                
                {/* News Content */}
                <div className="flex-1 p-4">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-medium text-orange-600 dark:text-orange-400 bg-orange-100 dark:bg-orange-900/20 px-2 py-1 rounded">
                        {newsItem.category || 'Generale'}
                      </span>
                      {newsItem.featured && (
                        <span className="text-xs font-medium text-yellow-600 dark:text-yellow-400 bg-yellow-100 dark:bg-yellow-900/20 px-2 py-1 rounded">
                          In evidenza
                        </span>
                      )}
                      {!newsItem.published && (
                        <span className="text-xs font-medium text-red-600 dark:text-red-400 bg-red-100 dark:bg-red-900/20 px-2 py-1 rounded">
                          Bozza
                        </span>
                      )}
                    </div>
                    <div className="text-sm text-gray-500 dark:text-gray-400">
                      {formatDate(newsItem.createdAt)}
                    </div>
                  </div>
                  
                  <h3 className="font-semibold text-gray-900 dark:text-white mb-2 line-clamp-1">
                    {newsItem.title}
                  </h3>
                  
                  <p className="text-gray-600 dark:text-gray-300 text-sm mb-3 line-clamp-2">
                    {newsItem.excerpt || newsItem.content?.substring(0, 150) + '...'}
                  </p>
                  
                  <div className="flex items-center justify-between">
                    <div className="flex items-center text-sm text-gray-500 dark:text-gray-400">
                      {newsItem.author && (
                        <div className="flex items-center gap-1 mr-4">
                          <User className="h-3 w-3" />
                          <span>{newsItem.author}</span>
                        </div>
                      )}
                      {newsItem.tags && newsItem.tags.length > 0 && (
                        <div className="flex items-center gap-1">
                          <Tag className="h-3 w-3" />
                          <span>{newsItem.tags.slice(0, 2).join(', ')}</span>
                          {newsItem.tags.length > 2 && <span>...</span>}
                        </div>
                      )}
                    </div>
                    
                    <div className="flex items-center space-x-1">
                      {newsItem.sourceUrl && (
                        <a
                          href={newsItem.sourceUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-1 text-gray-400 hover:text-orange-500 transition-colors"
                          title="Apri fonte"
                        >
                          <ExternalLink className="h-4 w-4" />
                        </a>
                      )}
                      <button
                        onClick={() => togglePublished(newsItem.id, newsItem.published)}
                        className={`p-1 rounded transition-colors ${
                          newsItem.published
                            ? 'text-green-500 hover:bg-green-50 dark:hover:bg-green-900/20'
                            : 'text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700'
                        }`}
                        title={newsItem.published ? 'Nascondi' : 'Pubblica'}
                      >
                        <Eye className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => toggleFeatured(newsItem.id, newsItem.featured)}
                        className={`p-1 rounded transition-colors ${
                          newsItem.featured
                            ? 'text-yellow-500 hover:bg-yellow-50 dark:hover:bg-yellow-900/20'
                            : 'text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700'
                        }`}
                        title={newsItem.featured ? 'Rimuovi da in evidenza' : 'Metti in evidenza'}
                      >
                        <Calendar className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => openModal(newsItem)}
                        className="p-1 text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded transition-colors"
                        title="Modifica"
                      >
                        <Edit3 className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(newsItem.id, newsItem.title)}
                        className="p-1 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-colors"
                        title="Elimina"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Modal for Create/Edit News */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
            <div className="flex justify-between items-center p-6 border-b border-gray-200 dark:border-gray-600">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                {editingNews ? 'Modifica News' : 'Nuova News'}
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
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 dark:bg-gray-700 dark:text-white"
                    placeholder="Inserisci il titolo della news"
                  />
                </div>

                {/* Estratto */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Estratto
                  </label>
                  <textarea
                    name="excerpt"
                    value={formData.excerpt}
                    onChange={handleInputChange}
                    rows={2}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 dark:bg-gray-700 dark:text-white resize-none"
                    placeholder="Breve estratto della news"
                  />
                </div>

                {/* Contenuto */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Contenuto
                  </label>
                  <textarea
                    name="content"
                    value={formData.content}
                    onChange={handleInputChange}
                    rows={8}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 dark:bg-gray-700 dark:text-white resize-none"
                    placeholder="Contenuto completo della news"
                  />
                </div>

                {/* Categoria e Autore */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Categoria
                    </label>
                    <select
                      name="category"
                      value={formData.category}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 dark:bg-gray-700 dark:text-white"
                    >
                      <option value="">Seleziona categoria</option>
                      {categories.map(category => (
                        <option key={category} value={category}>{category}</option>
                      ))}
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Autore
                    </label>
                    <input
                      type="text"
                      name="author"
                      value={formData.author}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 dark:bg-gray-700 dark:text-white"
                      placeholder="Nome autore"
                    />
                  </div>
                </div>

                {/* URL Immagine */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    URL Immagine
                  </label>
                  <input
                    type="url"
                    name="imageUrl"
                    value={formData.imageUrl}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 dark:bg-gray-700 dark:text-white"
                    placeholder="https://esempio.com/immagine.jpg"
                  />
                </div>

                {/* Tags */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Tags (separati da virgola)
                  </label>
                  <input
                    type="text"
                    value={formData.tags.join(', ')}
                    onChange={handleTagsChange}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 dark:bg-gray-700 dark:text-white"
                    placeholder="tag1, tag2, tag3"
                  />
                </div>

                {/* Fonte e Source URL */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Fonte
                    </label>
                    <input
                      type="text"
                      name="source"
                      value={formData.source}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 dark:bg-gray-700 dark:text-white"
                      placeholder="Nome fonte"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      URL Fonte
                    </label>
                    <input
                      type="url"
                      name="sourceUrl"
                      value={formData.sourceUrl}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 dark:bg-gray-700 dark:text-white"
                      placeholder="https://fonte-originale.com/articolo"
                    />
                  </div>
                </div>

                {/* Checkboxes */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      name="featured"
                      checked={formData.featured}
                      onChange={handleInputChange}
                      className="h-4 w-4 text-orange-600 focus:ring-orange-500 border-gray-300 rounded"
                    />
                    <label className="ml-2 block text-sm text-gray-700 dark:text-gray-300">
                      News in evidenza
                    </label>
                  </div>

                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      name="published"
                      checked={formData.published}
                      onChange={handleInputChange}
                      className="h-4 w-4 text-orange-600 focus:ring-orange-500 border-gray-300 rounded"
                    />
                    <label className="ml-2 block text-sm text-gray-700 dark:text-gray-300">
                      Pubblica immediatamente
                    </label>
                  </div>
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
                className="px-4 py-2 bg-orange-500 hover:bg-orange-600 disabled:opacity-50 text-white rounded-lg flex items-center space-x-2 transition-colors"
              >
                {saving ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    <span>Salvando...</span>
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4" />
                    <span>{editingNews ? 'Aggiorna' : 'Crea'} News</span>
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

export default NewsManager;