import React, { useState, useEffect } from 'react';
import { 
  collection, 
  query, 
  orderBy, 
  getDocs, 
  doc, 
  addDoc, 
  updateDoc, 
  deleteDoc,
  where
} from 'firebase/firestore';
import { db } from '../../../config/firebase';
import { 
  Plus, 
  Edit3, 
  Trash2, 
  Save, 
  X, 
  Search,
  UserCheck,
  Mail,
  Calendar,
  Filter,
  Download,
  Upload,
  CheckCircle,
  XCircle
} from 'lucide-react';

const NewsletterSubscribersManager = () => {
  const [subscribers, setSubscribers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [showModal, setShowModal] = useState(false);
  const [editingSubscriber, setEditingSubscriber] = useState(null);
  const [saving, setSaving] = useState(false);
  const [selectedSubscribers, setSelectedSubscribers] = useState([]);

  const [formData, setFormData] = useState({
    email: '',
    name: '',
    active: true,
    tags: [],
    preferences: {
      news: true,
      exercises: true,
      articles: true,
      promotions: false
    },
    notes: ''
  });

  useEffect(() => {
    fetchSubscribers();
  }, []);

  const fetchSubscribers = async () => {
    try {
      setLoading(true);
      const subscribersQuery = query(
        collection(db, 'newsletterSubscribers'),
        orderBy('subscribedAt', 'desc')
      );
      const snapshot = await getDocs(subscribersQuery);
      const subscribersData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setSubscribers(subscribersData);
    } catch (error) {
      console.error('Error loading subscribers:', error);
      try {
        const snapshot = await getDocs(collection(db, 'newsletterSubscribers'));
        const subscribersData = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        setSubscribers(subscribersData);
      } catch (fallbackError) {
        setSubscribers([]);
      }
    } finally {
      setLoading(false);
    }
  };

  const openModal = (subscriber = null) => {
    if (subscriber) {
      setEditingSubscriber(subscriber);
      setFormData({
        email: subscriber.email || '',
        name: subscriber.name || '',
        active: subscriber.active !== false,
        tags: subscriber.tags || [],
        preferences: subscriber.preferences || {
          news: true,
          exercises: true,
          articles: true,
          promotions: false
        },
        notes: subscriber.notes || ''
      });
    } else {
      setEditingSubscriber(null);
      setFormData({
        email: '',
        name: '',
        active: true,
        tags: [],
        preferences: {
          news: true,
          exercises: true,
          articles: true,
          promotions: false
        },
        notes: ''
      });
    }
    setShowModal(true);
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    if (name.startsWith('pref_')) {
      const prefName = name.replace('pref_', '');
      setFormData(prev => ({
        ...prev,
        preferences: {
          ...prev.preferences,
          [prefName]: checked
        }
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: type === 'checkbox' ? checked : value
      }));
    }
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

      const subscriberData = {
        ...formData,
        updatedAt: new Date()
      };

      if (editingSubscriber) {
        await updateDoc(doc(db, 'newsletterSubscribers', editingSubscriber.id), subscriberData);
      } else {
        await addDoc(collection(db, 'newsletterSubscribers'), {
          ...subscriberData,
          subscribedAt: new Date(),
          createdAt: new Date()
        });
      }

      await fetchSubscribers();
      setShowModal(false);
      alert(editingSubscriber ? 'Iscritto aggiornato!' : 'Iscritto aggiunto!');
    } catch (error) {
      alert('Errore nel salvataggio');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (subscriberId, email) => {
    if (!confirm(`Rimuovere ${email} dalla lista?`)) return;
    try {
      await deleteDoc(doc(db, 'newsletterSubscribers', subscriberId));
      await fetchSubscribers();
      alert('Iscritto rimosso!');
    } catch (error) {
      alert('Errore nella rimozione');
    }
  };

  const toggleActive = async (subscriberId, currentStatus) => {
    try {
      await updateDoc(doc(db, 'newsletterSubscribers', subscriberId), {
        active: !currentStatus,
        updatedAt: new Date()
      });
      await fetchSubscribers();
    } catch (error) {
      alert('Errore nell\'aggiornamento');
    }
  };

  const handleSelectAll = () => {
    if (selectedSubscribers.length === filteredSubscribers.length) {
      setSelectedSubscribers([]);
    } else {
      setSelectedSubscribers(filteredSubscribers.map(s => s.id));
    }
  };

  const handleSelect = (subscriberId) => {
    if (selectedSubscribers.includes(subscriberId)) {
      setSelectedSubscribers(selectedSubscribers.filter(id => id !== subscriberId));
    } else {
      setSelectedSubscribers([...selectedSubscribers, subscriberId]);
    }
  };

  const exportSubscribers = () => {
    const data = filteredSubscribers.map(s => ({
      email: s.email,
      name: s.name,
      active: s.active,
      tags: s.tags?.join(', '),
      subscribedAt: formatDate(s.subscribedAt)
    }));
    
    const csv = [
      ['Email', 'Nome', 'Attivo', 'Tags', 'Data Iscrizione'],
      ...data.map(row => [row.email, row.name, row.active ? 'Sì' : 'No', row.tags, row.subscribedAt])
    ].map(row => row.join(',')).join('\n');
    
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `iscritti_newsletter_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  const filteredSubscribers = subscribers.filter(subscriber => {
    const matchesSearch = subscriber.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          subscriber.name?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === 'all' || 
                         (filterStatus === 'active' && subscriber.active) ||
                         (filterStatus === 'inactive' && !subscriber.active);
    return matchesSearch && matchesStatus;
  });

  const formatDate = (date) => {
    if (!date) return 'N/A';
    const subDate = date.toDate ? date.toDate() : new Date(date);
    return subDate.toLocaleDateString('it-IT');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-600"></div>
        <span className="ml-2 text-gray-600 dark:text-gray-400">Caricamento iscritti...</span>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center space-x-3">
          <UserCheck className="h-6 w-6 text-teal-600 dark:text-teal-400" />
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            Gestione Iscritti Newsletter
          </h2>
        </div>
        <div className="flex space-x-2">
          <button
            onClick={exportSubscribers}
            className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors"
          >
            <Download className="h-4 w-4" />
            <span>Esporta CSV</span>
          </button>
          <button
            onClick={() => openModal()}
            className="bg-teal-500 hover:bg-teal-600 text-white px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors"
          >
            <Plus className="h-4 w-4" />
            <span>Nuovo Iscritto</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="Cerca email o nome..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500 dark:bg-gray-700 dark:text-white"
          />
        </div>
        
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500 dark:bg-gray-700 dark:text-white"
        >
          <option value="all">Tutti gli iscritti</option>
          <option value="active">Solo attivi</option>
          <option value="inactive">Solo disattivi</option>
        </select>

        <div className="text-sm text-gray-500 dark:text-gray-400 flex items-center justify-between">
          <span className="flex items-center">
            <Mail className="h-4 w-4 mr-2" />
            {filteredSubscribers.length} iscritti
          </span>
          {selectedSubscribers.length > 0 && (
            <span className="text-teal-600">
              {selectedSubscribers.length} selezionati
            </span>
          )}
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
          <thead className="bg-gray-50 dark:bg-gray-700">
            <tr>
              <th className="px-3 py-3 text-left">
                <input
                  type="checkbox"
                  checked={selectedSubscribers.length === filteredSubscribers.length && filteredSubscribers.length > 0}
                  onChange={handleSelectAll}
                  className="h-4 w-4 text-teal-600 focus:ring-teal-500 border-gray-300 rounded"
                />
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                Email
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                Nome
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                Stato
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                Data Iscrizione
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                Tags
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                Azioni
              </th>
            </tr>
          </thead>
          <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
            {filteredSubscribers.length === 0 ? (
              <tr>
                <td colSpan="7" className="px-6 py-8 text-center">
                  <UserCheck className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                  <p className="text-gray-500 dark:text-gray-400">
                    Nessun iscritto trovato
                  </p>
                </td>
              </tr>
            ) : (
              filteredSubscribers.map((subscriber) => (
                <tr key={subscriber.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                  <td className="px-3 py-4">
                    <input
                      type="checkbox"
                      checked={selectedSubscribers.includes(subscriber.id)}
                      onChange={() => handleSelect(subscriber.id)}
                      className="h-4 w-4 text-teal-600 focus:ring-teal-500 border-gray-300 rounded"
                    />
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <Mail className="h-4 w-4 text-gray-400 mr-2" />
                      <span className="text-sm font-medium text-gray-900 dark:text-white">
                        {subscriber.email}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                    {subscriber.name || '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <button
                      onClick={() => toggleActive(subscriber.id, subscriber.active)}
                      className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                        subscriber.active
                          ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400'
                          : 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400'
                      }`}
                    >
                      {subscriber.active ? (
                        <>
                          <CheckCircle className="h-3 w-3 mr-1" />
                          Attivo
                        </>
                      ) : (
                        <>
                          <XCircle className="h-3 w-3 mr-1" />
                          Disattivo
                        </>
                      )}
                    </button>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                    {formatDate(subscriber.subscribedAt)}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400">
                    {subscriber.tags?.map(tag => (
                      <span key={tag} className="inline-block bg-gray-100 dark:bg-gray-700 rounded px-2 py-1 text-xs mr-1 mb-1">
                        {tag}
                      </span>
                    ))}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <button
                      onClick={() => openModal(subscriber)}
                      className="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300 mr-2"
                    >
                      <Edit3 className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(subscriber.id, subscriber.email)}
                      className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-hidden">
            <div className="flex justify-between items-center p-6 border-b">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                {editingSubscriber ? 'Modifica Iscritto' : 'Nuovo Iscritto'}
              </h3>
              <button onClick={() => setShowModal(false)} className="text-gray-500 hover:text-gray-700">
                <X className="h-6 w-6" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto max-h-[70vh] space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Email
                  </label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500 dark:bg-gray-700 dark:text-white"
                    placeholder="email@esempio.com"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Nome
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500 dark:bg-gray-700 dark:text-white"
                    placeholder="Nome completo"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Tags (separati da virgola)
                </label>
                <input
                  type="text"
                  value={formData.tags.join(', ')}
                  onChange={handleTagsChange}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500 dark:bg-gray-700 dark:text-white"
                  placeholder="sport, atleta, coach"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Preferenze Newsletter
                </label>
                <div className="space-y-2">
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      name="pref_news"
                      checked={formData.preferences.news}
                      onChange={handleInputChange}
                      className="h-4 w-4 text-teal-600 focus:ring-teal-500 border-gray-300 rounded mr-2"
                    />
                    <span className="text-sm text-gray-700 dark:text-gray-300">News e aggiornamenti</span>
                  </label>
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      name="pref_exercises"
                      checked={formData.preferences.exercises}
                      onChange={handleInputChange}
                      className="h-4 w-4 text-teal-600 focus:ring-teal-500 border-gray-300 rounded mr-2"
                    />
                    <span className="text-sm text-gray-700 dark:text-gray-300">Nuovi esercizi</span>
                  </label>
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      name="pref_articles"
                      checked={formData.preferences.articles}
                      onChange={handleInputChange}
                      className="h-4 w-4 text-teal-600 focus:ring-teal-500 border-gray-300 rounded mr-2"
                    />
                    <span className="text-sm text-gray-700 dark:text-gray-300">Articoli e guide</span>
                  </label>
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      name="pref_promotions"
                      checked={formData.preferences.promotions}
                      onChange={handleInputChange}
                      className="h-4 w-4 text-teal-600 focus:ring-teal-500 border-gray-300 rounded mr-2"
                    />
                    <span className="text-sm text-gray-700 dark:text-gray-300">Promozioni e offerte</span>
                  </label>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Note
                </label>
                <textarea
                  name="notes"
                  value={formData.notes}
                  onChange={handleInputChange}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500 dark:bg-gray-700 dark:text-white resize-none"
                  placeholder="Note opzionali..."
                />
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  name="active"
                  checked={formData.active}
                  onChange={handleInputChange}
                  className="h-4 w-4 text-teal-600 focus:ring-teal-500 border-gray-300 rounded"
                />
                <label className="ml-2 block text-sm text-gray-700 dark:text-gray-300">
                  Iscrizione attiva
                </label>
              </div>
            </div>

            <div className="flex justify-end space-x-3 p-6 border-t">
              <button
                onClick={() => setShowModal(false)}
                disabled={saving}
                className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
              >
                Annulla
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="px-4 py-2 bg-teal-500 hover:bg-teal-600 disabled:opacity-50 text-white rounded-lg flex items-center space-x-2 transition-colors"
              >
                {saving ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                ) : (
                  <Save className="h-4 w-4" />
                )}
                <span>{editingSubscriber ? 'Aggiorna' : 'Aggiungi'} Iscritto</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default NewsletterSubscribersManager;