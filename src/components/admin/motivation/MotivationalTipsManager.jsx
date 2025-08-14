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
  Lightbulb,
  Target,
  Tag
} from 'lucide-react';

const MotivationalTipsManager = () => {
  const [tips, setTips] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState('all');
  const [showModal, setShowModal] = useState(false);
  const [editingTip, setEditingTip] = useState(null);
  const [saving, setSaving] = useState(false);

  const [formData, setFormData] = useState({
    title: '',
    content: '',
    category: '',
    author: '',
    featured: false,
    active: true,
    tags: [],
    difficulty: 'Facile',
    estimatedReadTime: ''
  });

  const categories = [
    'Motivazione Generale',
    'Pre-Gara',
    'Post-Gara',
    'Allenamento',
    'Recupero',
    'Concentrazione',
    'Fiducia',
    'Resilienza'
  ];

  const difficulties = ['Facile', 'Medio', 'Avanzato'];

  useEffect(() => {
    fetchTips();
  }, []);

  const fetchTips = async () => {
    try {
      setLoading(true);
      console.log('💡 Caricamento consigli motivazionali...');
      
      const tipsQuery = query(
        collection(db, 'motivationalTips'),
        orderBy('createdAt', 'desc')
      );
      const snapshot = await getDocs(tipsQuery);
      const tipsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      
      console.log('✅ Consigli caricati:', tipsData.length);
      setTips(tipsData);
    } catch (error) {
      console.error('Errore nel caricamento dei consigli:', error);
      // Fallback: carica senza orderBy se l'indice non esiste
      try {
        const snapshot = await getDocs(collection(db, 'motivationalTips'));
        const tipsData = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        setTips(tipsData);
      } catch (fallbackError) {
        console.error('Errore anche nel fallback:', fallbackError);
        setTips([]);
      }
    } finally {
      setLoading(false);
    }
  };

  const openModal = (tip = null) => {
    if (tip) {
      setEditingTip(tip);
      setFormData({
        title: tip.title || '',
        content: tip.content || '',
        category: tip.category || '',
        author: tip.author || '',
        featured: tip.featured || false,
        active: tip.active !== false,
        tags: tip.tags || [],
        difficulty: tip.difficulty || 'Facile',
        estimatedReadTime: tip.estimatedReadTime || ''
      });
    } else {
      setEditingTip(null);
      setFormData({
        title: '',
        content: '',
        category: '',
        author: '',
        featured: false,
        active: true,
        tags: [],
        difficulty: 'Facile',
        estimatedReadTime: ''
      });
    }
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingTip(null);
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

      const tipData = {
        ...formData,
        updatedAt: new Date()
      };

      if (editingTip) {
        await updateDoc(doc(db, 'motivationalTips', editingTip.id), tipData);
      } else {
        await addDoc(collection(db, 'motivationalTips'), {
          ...tipData,
          createdAt: new Date()
        });
      }

      await fetchTips();
      closeModal();
      alert(editingTip ? 'Consiglio aggiornato con successo!' : 'Consiglio creato con successo!');
    } catch (error) {
      console.error('Errore nel salvataggio:', error);
      alert('Errore nel salvataggio del consiglio');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (tipId, tipTitle) => {
    if (!confirm(`Sei sicuro di voler eliminare il consiglio "${tipTitle}"?`)) {
      return;
    }

    try {
      await deleteDoc(doc(db, 'motivationalTips', tipId));
      await fetchTips();
      alert('Consiglio eliminato con successo!');
    } catch (error) {
      console.error('Errore nell\'eliminazione:', error);
      alert('Errore nell\'eliminazione del consiglio');
    }
  };

  const toggleFeatured = async (tipId, currentStatus) => {
    try {
      await updateDoc(doc(db, 'motivationalTips', tipId), {
        featured: !currentStatus,
        updatedAt: new Date()
      });
      await fetchTips();
    } catch (error) {
      console.error('Errore nell\'aggiornamento:', error);
      alert('Errore nell\'aggiornamento dello stato featured');
    }
  };

  const toggleActive = async (tipId, currentStatus) => {
    try {
      await updateDoc(doc(db, 'motivationalTips', tipId), {
        active: !currentStatus,
        updatedAt: new Date()
      });
      await fetchTips();
    } catch (error) {
      console.error('Errore nell\'aggiornamento:', error);
      alert('Errore nell\'aggiornamento dello stato attivo');
    }
  };

  const filteredTips = tips.filter(tip => {
    const matchesSearch = tip.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          tip.content?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = filterCategory === 'all' || tip.category === filterCategory;
    return matchesSearch && matchesCategory;
  });

  const formatDate = (date) => {
    if (!date) return 'N/A';
    const tipDate = date.toDate ? date.toDate() : new Date(date);
    return tipDate.toLocaleDateString('it-IT');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-yellow-600"></div>
        <span className="ml-2 text-gray-600 dark:text-gray-400">Caricamento consigli...</span>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center space-x-3">
          <Lightbulb className="h-6 w-6 text-yellow-600 dark:text-yellow-400" />
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            Gestione Consigli Motivazionali
          </h2>
        </div>
        <button
          onClick={() => openModal()}
          className="bg-yellow-500 hover:bg-yellow-600 text-white px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors"
        >
          <Plus className="h-4 w-4" />
          <span>Nuovo Consiglio</span>
        </button>
      </div>

      {/* Filters */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="Cerca consigli..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-yellow-500 dark:bg-gray-700 dark:text-white"
          />
        </div>
        
        <select
          value={filterCategory}
          onChange={(e) => setFilterCategory(e.target.value)}
          className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-yellow-500 dark:bg-gray-700 dark:text-white"
        >
          <option value="all">Tutte le categorie</option>
          {categories.map(category => (
            <option key={category} value={category}>{category}</option>
          ))}
        </select>

        <div className="text-sm text-gray-500 dark:text-gray-400 flex items-center">
          <Lightbulb className="h-4 w-4 mr-2" />
          {filteredTips.length} consigli
        </div>
      </div>

      {/* Tips List */}
      <div className="space-y-4">
        {filteredTips.length === 0 ? (
          <div className="text-center py-8">
            <Lightbulb className="h-16 w-16 mx-auto mb-4 text-gray-400" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
              Nessun consiglio trovato
            </h3>
            <p className="text-gray-500 dark:text-gray-400">
              {tips.length === 0 ? 'Inizia creando il primo consiglio motivazionale' : 'Modifica i filtri per vedere più risultati'}
            </p>
          </div>
        ) : (
          filteredTips.map((tip) => (
            <div key={tip.id} className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-lg p-4 hover:shadow-lg transition-shadow">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-medium text-yellow-600 dark:text-yellow-400 bg-yellow-100 dark:bg-yellow-900/20 px-2 py-1 rounded">
                    {tip.category || 'Generale'}
                  </span>
                  <span className="text-xs text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded">
                    {tip.difficulty}
                  </span>
                  {tip.featured && (
                    <span className="text-xs font-medium text-blue-600 dark:text-blue-400 bg-blue-100 dark:bg-blue-900/20 px-2 py-1 rounded">
                      In evidenza
                    </span>
                  )}
                  {!tip.active && (
                    <span className="text-xs font-medium text-red-600 dark:text-red-400 bg-red-100 dark:bg-red-900/20 px-2 py-1 rounded">
                      Disattivo
                    </span>
                  )}
                </div>
                <div className="text-sm text-gray-500 dark:text-gray-400">
                  {formatDate(tip.createdAt)}
                </div>
              </div>
              
              <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
                {tip.title}
              </h3>
              
              <p className="text-gray-600 dark:text-gray-300 text-sm mb-3 line-clamp-3">
                {tip.content}
              </p>
              
              <div className="flex items-center justify-between">
                <div className="flex items-center text-sm text-gray-500 dark:text-gray-400">
                  {tip.author && (
                    <div className="flex items-center gap-1 mr-4">
                      <User className="h-3 w-3" />
                      <span>{tip.author}</span>
                    </div>
                  )}
                  {tip.estimatedReadTime && (
                    <div className="flex items-center gap-1 mr-4">
                      <Target className="h-3 w-3" />
                      <span>{tip.estimatedReadTime} min</span>
                    </div>
                  )}
                  {tip.tags && tip.tags.length > 0 && (
                    <div className="flex items-center gap-1">
                      <Tag className="h-3 w-3" />
                      <span>{tip.tags.slice(0, 2).join(', ')}</span>
                      {tip.tags.length > 2 && <span>...</span>}
                    </div>
                  )}
                </div>
                
                <div className="flex items-center space-x-1">
                  <button
                    onClick={() => toggleActive(tip.id, tip.active)}
                    className={`p-1 rounded transition-colors ${
                      tip.active
                        ? 'text-green-500 hover:bg-green-50 dark:hover:bg-green-900/20'
                        : 'text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700'
                    }`}
                    title={tip.active ? 'Disattiva' : 'Attiva'}
                  >
                    <Eye className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => toggleFeatured(tip.id, tip.featured)}
                    className={`p-1 rounded transition-colors ${
                      tip.featured
                        ? 'text-yellow-500 hover:bg-yellow-50 dark:hover:bg-yellow-900/20'
                        : 'text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700'
                    }`}
                    title={tip.featured ? 'Rimuovi da in evidenza' : 'Metti in evidenza'}
                  >
                    <Calendar className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => openModal(tip)}
                    className="p-1 text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded transition-colors"
                    title="Modifica"
                  >
                    <Edit3 className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(tip.id, tip.title)}
                    className="p-1 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-colors"
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

      {/* Modal for Create/Edit Tip */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
            <div className="flex justify-between items-center p-6 border-b border-gray-200 dark:border-gray-600">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                {editingTip ? 'Modifica Consiglio' : 'Nuovo Consiglio Motivazionale'}
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
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-yellow-500 dark:bg-gray-700 dark:text-white"
                    placeholder="Inserisci il titolo del consiglio"
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
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-yellow-500 dark:bg-gray-700 dark:text-white resize-none"
                    placeholder="Scrivi il contenuto del consiglio motivazionale"
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
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-yellow-500 dark:bg-gray-700 dark:text-white"
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
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-yellow-500 dark:bg-gray-700 dark:text-white"
                    >
                      {difficulties.map(difficulty => (
                        <option key={difficulty} value={difficulty}>{difficulty}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Autore e Tempo di Lettura */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Autore
                    </label>
                    <input
                      type="text"
                      name="author"
                      value={formData.author}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-yellow-500 dark:bg-gray-700 dark:text-white"
                      placeholder="Nome autore"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Tempo di Lettura (minuti)
                    </label>
                    <input
                      type="number"
                      name="estimatedReadTime"
                      value={formData.estimatedReadTime}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-yellow-500 dark:bg-gray-700 dark:text-white"
                      placeholder="es. 3"
                    />
                  </div>
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
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-yellow-500 dark:bg-gray-700 dark:text-white"
                    placeholder="motivazione, gara, concentrazione"
                  />
                </div>

                {/* Checkboxes */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      name="featured"
                      checked={formData.featured}
                      onChange={handleInputChange}
                      className="h-4 w-4 text-yellow-600 focus:ring-yellow-500 border-gray-300 rounded"
                    />
                    <label className="ml-2 block text-sm text-gray-700 dark:text-gray-300">
                      Consiglio in evidenza
                    </label>
                  </div>

                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      name="active"
                      checked={formData.active}
                      onChange={handleInputChange}
                      className="h-4 w-4 text-yellow-600 focus:ring-yellow-500 border-gray-300 rounded"
                    />
                    <label className="ml-2 block text-sm text-gray-700 dark:text-gray-300">
                      Attivo (visibile agli utenti)
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
                className="px-4 py-2 bg-yellow-500 hover:bg-yellow-600 disabled:opacity-50 text-white rounded-lg flex items-center space-x-2 transition-colors"
              >
                {saving ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    <span>Salvando...</span>
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4" />
                    <span>{editingTip ? 'Aggiorna' : 'Crea'} Consiglio</span>
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

export default MotivationalTipsManager;