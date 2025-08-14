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
  Award,
  Star,
  Target,
  Trophy
} from 'lucide-react';

const BadgeManager = () => {
  const [badges, setBadges] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [showModal, setShowModal] = useState(false);
  const [editingBadge, setEditingBadge] = useState(null);
  const [saving, setSaving] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    iconUrl: '',
    type: 'achievement',
    requirements: '',
    points: 0,
    rarity: 'common',
    active: true,
    category: ''
  });

  const badgeTypes = ['achievement', 'milestone', 'streak', 'special', 'seasonal'];
  const rarities = ['common', 'rare', 'epic', 'legendary'];
  const categories = ['Training', 'Consistency', 'Progress', 'Social', 'Special Events'];

  useEffect(() => {
    fetchBadges();
  }, []);

  const fetchBadges = async () => {
    try {
      setLoading(true);
      const badgesQuery = query(
        collection(db, 'badges'),
        orderBy('createdAt', 'desc')
      );
      const snapshot = await getDocs(badgesQuery);
      const badgesData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setBadges(badgesData);
    } catch (error) {
      console.error('Error loading badges:', error);
      try {
        const snapshot = await getDocs(collection(db, 'badges'));
        const badgesData = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        setBadges(badgesData);
      } catch (fallbackError) {
        setBadges([]);
      }
    } finally {
      setLoading(false);
    }
  };

  const openModal = (badge = null) => {
    if (badge) {
      setEditingBadge(badge);
      setFormData({
        name: badge.name || '',
        description: badge.description || '',
        iconUrl: badge.iconUrl || '',
        type: badge.type || 'achievement',
        requirements: badge.requirements || '',
        points: badge.points || 0,
        rarity: badge.rarity || 'common',
        active: badge.active !== false,
        category: badge.category || ''
      });
    } else {
      setEditingBadge(null);
      setFormData({
        name: '',
        description: '',
        iconUrl: '',
        type: 'achievement',
        requirements: '',
        points: 0,
        rarity: 'common',
        active: true,
        category: ''
      });
    }
    setShowModal(true);
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : (name === 'points' ? parseInt(value) || 0 : value)
    }));
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      const badgeData = {
        ...formData,
        updatedAt: new Date()
      };

      if (editingBadge) {
        await updateDoc(doc(db, 'badges', editingBadge.id), badgeData);
      } else {
        await addDoc(collection(db, 'badges'), {
          ...badgeData,
          createdAt: new Date()
        });
      }

      await fetchBadges();
      setShowModal(false);
      alert(editingBadge ? 'Badge aggiornato!' : 'Badge creato!');
    } catch (error) {
      alert('Errore nel salvataggio');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (badgeId, badgeName) => {
    if (!confirm(`Eliminare il badge "${badgeName}"?`)) return;
    try {
      await deleteDoc(doc(db, 'badges', badgeId));
      await fetchBadges();
      alert('Badge eliminato!');
    } catch (error) {
      alert('Errore nell\'eliminazione');
    }
  };

  const toggleActive = async (badgeId, currentStatus) => {
    try {
      await updateDoc(doc(db, 'badges', badgeId), {
        active: !currentStatus,
        updatedAt: new Date()
      });
      await fetchBadges();
    } catch (error) {
      alert('Errore nell\'aggiornamento');
    }
  };

  const filteredBadges = badges.filter(badge => {
    const matchesSearch = badge.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          badge.description?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = filterType === 'all' || badge.type === filterType;
    return matchesSearch && matchesType;
  });

  const getRarityColor = (rarity) => {
    const colors = {
      common: 'text-gray-600 bg-gray-100',
      rare: 'text-blue-600 bg-blue-100',
      epic: 'text-purple-600 bg-purple-100',
      legendary: 'text-yellow-600 bg-yellow-100'
    };
    return colors[rarity] || colors.common;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
        <span className="ml-2 text-gray-600 dark:text-gray-400">Caricamento badge...</span>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center space-x-3">
          <Award className="h-6 w-6 text-purple-600 dark:text-purple-400" />
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            Gestione Badge
          </h2>
        </div>
        <button
          onClick={() => openModal()}
          className="bg-purple-500 hover:bg-purple-600 text-white px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors"
        >
          <Plus className="h-4 w-4" />
          <span>Nuovo Badge</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="Cerca badge..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 dark:bg-gray-700 dark:text-white"
          />
        </div>
        
        <select
          value={filterType}
          onChange={(e) => setFilterType(e.target.value)}
          className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 dark:bg-gray-700 dark:text-white"
        >
          <option value="all">Tutti i tipi</option>
          {badgeTypes.map(type => (
            <option key={type} value={type}>{type}</option>
          ))}
        </select>

        <div className="text-sm text-gray-500 dark:text-gray-400 flex items-center">
          <Award className="h-4 w-4 mr-2" />
          {filteredBadges.length} badge
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredBadges.length === 0 ? (
          <div className="col-span-full text-center py-8">
            <Award className="h-16 w-16 mx-auto mb-4 text-gray-400" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
              Nessun badge trovato
            </h3>
            <p className="text-gray-500 dark:text-gray-400">
              {badges.length === 0 ? 'Inizia creando il primo badge' : 'Modifica i filtri'}
            </p>
          </div>
        ) : (
          filteredBadges.map((badge) => (
            <div key={badge.id} className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-lg p-4 hover:shadow-lg transition-shadow">
              <div className="flex items-center justify-between mb-3">
                <span className={`text-xs font-medium px-2 py-1 rounded ${getRarityColor(badge.rarity)}`}>
                  {badge.rarity}
                </span>
                {!badge.active && (
                  <span className="text-xs font-medium text-red-600 bg-red-100 px-2 py-1 rounded">
                    Disattivo
                  </span>
                )}
              </div>
              
              <div className="text-center mb-4">
                {badge.iconUrl ? (
                  <img src={badge.iconUrl} alt={badge.name} className="w-12 h-12 mx-auto mb-2" />
                ) : (
                  <Award className="h-12 w-12 mx-auto mb-2 text-purple-400" />
                )}
                <h3 className="font-semibold text-gray-900 dark:text-white">{badge.name}</h3>
              </div>
              
              <p className="text-gray-600 dark:text-gray-300 text-sm mb-3 line-clamp-2">
                {badge.description}
              </p>
              
              <div className="flex items-center justify-between text-sm text-gray-500 dark:text-gray-400 mb-3">
                <span>{badge.type}</span>
                <span>{badge.points} punti</span>
              </div>
              
              <div className="flex items-center justify-between">
                <button
                  onClick={() => toggleActive(badge.id, badge.active)}
                  className={`p-1 rounded transition-colors ${
                    badge.active
                      ? 'text-green-500 hover:bg-green-50'
                      : 'text-gray-400 hover:bg-gray-50'
                  }`}
                >
                  <Eye className="h-4 w-4" />
                </button>
                <div className="flex space-x-1">
                  <button
                    onClick={() => openModal(badge)}
                    className="p-1 text-blue-500 hover:bg-blue-50 rounded"
                  >
                    <Edit3 className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(badge.id, badge.name)}
                    className="p-1 text-red-500 hover:bg-red-50 rounded"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-hidden">
            <div className="flex justify-between items-center p-6 border-b border-gray-200 dark:border-gray-600">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                {editingBadge ? 'Modifica Badge' : 'Nuovo Badge'}
              </h3>
              <button onClick={() => setShowModal(false)} className="text-gray-500 hover:text-gray-700">
                <X className="h-6 w-6" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Nome
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 dark:bg-gray-700 dark:text-white"
                    placeholder="Nome del badge"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Punti
                  </label>
                  <input
                    type="number"
                    name="points"
                    value={formData.points}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 dark:bg-gray-700 dark:text-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Descrizione
                </label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 dark:bg-gray-700 dark:text-white resize-none"
                  placeholder="Descrizione del badge"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Tipo
                  </label>
                  <select
                    name="type"
                    value={formData.type}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 dark:bg-gray-700 dark:text-white"
                  >
                    {badgeTypes.map(type => (
                      <option key={type} value={type}>{type}</option>
                    ))}
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Rarità
                  </label>
                  <select
                    name="rarity"
                    value={formData.rarity}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 dark:bg-gray-700 dark:text-white"
                  >
                    {rarities.map(rarity => (
                      <option key={rarity} value={rarity}>{rarity}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  URL Icona
                </label>
                <input
                  type="url"
                  name="iconUrl"
                  value={formData.iconUrl}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 dark:bg-gray-700 dark:text-white"
                  placeholder="https://esempio.com/icona.png"
                />
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  name="active"
                  checked={formData.active}
                  onChange={handleInputChange}
                  className="h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-300 rounded"
                />
                <label className="ml-2 block text-sm text-gray-700 dark:text-gray-300">
                  Badge attivo
                </label>
              </div>
            </div>

            <div className="flex justify-end space-x-3 p-6 border-t border-gray-200 dark:border-gray-600">
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
                className="px-4 py-2 bg-purple-500 hover:bg-purple-600 disabled:opacity-50 text-white rounded-lg flex items-center space-x-2 transition-colors"
              >
                {saving ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                ) : (
                  <Save className="h-4 w-4" />
                )}
                <span>{editingBadge ? 'Aggiorna' : 'Crea'} Badge</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BadgeManager;