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
  Save, 
  X, 
  Search,
  Users,
  Award,
  User,
  Calendar
} from 'lucide-react';

const UserBadgesManager = () => {
  const [userBadges, setUserBadges] = useState([]);
  const [users, setUsers] = useState([]);
  const [badges, setBadges] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingUserBadge, setEditingUserBadge] = useState(null);
  const [saving, setSaving] = useState(false);

  const [formData, setFormData] = useState({
    userId: '',
    badgeId: '',
    earnedAt: '',
    notes: ''
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      
      // Fetch user badges
      const userBadgesQuery = query(
        collection(db, 'userBadges'),
        orderBy('earnedAt', 'desc')
      );
      const userBadgesSnapshot = await getDocs(userBadgesQuery);
      const userBadgesData = userBadgesSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      // Fetch users
      const usersSnapshot = await getDocs(collection(db, 'users'));
      const usersData = usersSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      // Fetch badges
      const badgesSnapshot = await getDocs(collection(db, 'badges'));
      const badgesData = badgesSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      setUserBadges(userBadgesData);
      setUsers(usersData);
      setBadges(badgesData);
    } catch (error) {
      console.error('Error loading data:', error);
      setUserBadges([]);
    } finally {
      setLoading(false);
    }
  };

  const openModal = (userBadge = null) => {
    if (userBadge) {
      setEditingUserBadge(userBadge);
      setFormData({
        userId: userBadge.userId || '',
        badgeId: userBadge.badgeId || '',
        earnedAt: userBadge.earnedAt ? new Date(userBadge.earnedAt.seconds * 1000).toISOString().split('T')[0] : '',
        notes: userBadge.notes || ''
      });
    } else {
      setEditingUserBadge(null);
      setFormData({
        userId: '',
        badgeId: '',
        earnedAt: new Date().toISOString().split('T')[0],
        notes: ''
      });
    }
    setShowModal(true);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSave = async () => {
    try {
      setSaving(true);

      const userBadgeData = {
        userId: formData.userId,
        badgeId: formData.badgeId,
        earnedAt: new Date(formData.earnedAt),
        notes: formData.notes,
        updatedAt: new Date()
      };

      if (editingUserBadge) {
        await updateDoc(doc(db, 'userBadges', editingUserBadge.id), userBadgeData);
      } else {
        await addDoc(collection(db, 'userBadges'), {
          ...userBadgeData,
          createdAt: new Date()
        });
      }

      await fetchData();
      setShowModal(false);
      alert(editingUserBadge ? 'Badge utente aggiornato!' : 'Badge assegnato all\'utente!');
    } catch (error) {
      alert('Errore nel salvataggio');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (userBadgeId) => {
    if (!confirm('Rimuovere questo badge dall\'utente?')) return;
    try {
      await deleteDoc(doc(db, 'userBadges', userBadgeId));
      await fetchData();
      alert('Badge rimosso dall\'utente!');
    } catch (error) {
      alert('Errore nella rimozione');
    }
  };

  const getUserName = (userId) => {
    const user = users.find(u => u.id === userId);
    return user ? (user.displayName || user.email || 'Utente sconosciuto') : 'Utente non trovato';
  };

  const getBadgeName = (badgeId) => {
    const badge = badges.find(b => b.id === badgeId);
    return badge ? badge.name : 'Badge non trovato';
  };

  const filteredUserBadges = userBadges.filter(userBadge => {
    const userName = getUserName(userBadge.userId);
    const badgeName = getBadgeName(userBadge.badgeId);
    return userName.toLowerCase().includes(searchTerm.toLowerCase()) ||
           badgeName.toLowerCase().includes(searchTerm.toLowerCase());
  });

  const formatDate = (date) => {
    if (!date) return 'N/A';
    const badgeDate = date.toDate ? date.toDate() : new Date(date);
    return badgeDate.toLocaleDateString('it-IT');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
        <span className="ml-2 text-gray-600 dark:text-gray-400">Caricamento badge utenti...</span>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center space-x-3">
          <Users className="h-6 w-6 text-indigo-600 dark:text-indigo-400" />
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            Gestione Badge Utenti
          </h2>
        </div>
        <button
          onClick={() => openModal()}
          className="bg-indigo-500 hover:bg-indigo-600 text-white px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors"
        >
          <Plus className="h-4 w-4" />
          <span>Assegna Badge</span>
        </button>
      </div>

      <div className="mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="Cerca per utente o badge..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:bg-gray-700 dark:text-white"
          />
        </div>
      </div>

      <div className="space-y-4">
        {filteredUserBadges.length === 0 ? (
          <div className="text-center py-8">
            <Users className="h-16 w-16 mx-auto mb-4 text-gray-400" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
              Nessun badge assegnato
            </h3>
            <p className="text-gray-500 dark:text-gray-400">
              Inizia assegnando il primo badge ad un utente
            </p>
          </div>
        ) : (
          filteredUserBadges.map((userBadge) => (
            <div key={userBadge.id} className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-lg p-4 hover:shadow-lg transition-shadow">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <Award className="h-8 w-8 text-indigo-500" />
                  <div>
                    <h3 className="font-semibold text-gray-900 dark:text-white">
                      {getBadgeName(userBadge.badgeId)}
                    </h3>
                    <div className="flex items-center text-sm text-gray-500 dark:text-gray-400 mt-1">
                      <User className="h-4 w-4 mr-1" />
                      <span>{getUserName(userBadge.userId)}</span>
                      <Calendar className="h-4 w-4 ml-4 mr-1" />
                      <span>{formatDate(userBadge.earnedAt)}</span>
                    </div>
                    {userBadge.notes && (
                      <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">
                        {userBadge.notes}
                      </p>
                    )}
                  </div>
                </div>
                <div className="flex space-x-1">
                  <button
                    onClick={() => openModal(userBadge)}
                    className="p-1 text-blue-500 hover:bg-blue-50 rounded"
                  >
                    <Edit3 className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(userBadge.id)}
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
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full">
            <div className="flex justify-between items-center p-6 border-b">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                {editingUserBadge ? 'Modifica Badge Utente' : 'Assegna Badge'}
              </h3>
              <button onClick={() => setShowModal(false)} className="text-gray-500 hover:text-gray-700">
                <X className="h-6 w-6" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Utente
                </label>
                <select
                  name="userId"
                  value={formData.userId}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:bg-gray-700 dark:text-white"
                >
                  <option value="">Seleziona utente</option>
                  {users.map(user => (
                    <option key={user.id} value={user.id}>
                      {user.displayName || user.email}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Badge
                </label>
                <select
                  name="badgeId"
                  value={formData.badgeId}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:bg-gray-700 dark:text-white"
                >
                  <option value="">Seleziona badge</option>
                  {badges.map(badge => (
                    <option key={badge.id} value={badge.id}>
                      {badge.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Data Conseguimento
                </label>
                <input
                  type="date"
                  name="earnedAt"
                  value={formData.earnedAt}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:bg-gray-700 dark:text-white"
                />
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
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:bg-gray-700 dark:text-white resize-none"
                  placeholder="Note opzionali..."
                />
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
                className="px-4 py-2 bg-indigo-500 hover:bg-indigo-600 disabled:opacity-50 text-white rounded-lg flex items-center space-x-2 transition-colors"
              >
                {saving ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                ) : (
                  <Save className="h-4 w-4" />
                )}
                <span>{editingUserBadge ? 'Aggiorna' : 'Assegna'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserBadgesManager;