import React, { useState, useEffect } from 'react';
import { 
  collection, 
  getDocs, 
  deleteDoc, 
  doc,
  query,
  where,
  writeBatch
} from 'firebase/firestore';
import { deleteUser } from 'firebase/auth';
import { db, auth } from '../../config/firebase';
import { 
  Users, 
  Trash2, 
  AlertTriangle, 
  Search,
  Filter,
  Crown,
  Calendar,
  Mail,
  RefreshCw,
  UserX
} from 'lucide-react';

const UserManager = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [deleting, setDeleting] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [userToDelete, setUserToDelete] = useState(null);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      console.log('👥 UserManager: Fetching all users...');
      
      const usersSnapshot = await getDocs(collection(db, 'users'));
      const usersData = [];
      
      usersSnapshot.forEach((doc) => {
        const data = doc.data();
        usersData.push({
          id: doc.id,
          ...data,
          createdAt: data.createdAt?.toDate() || new Date(),
          lastLogin: data.lastLogin?.toDate() || null
        });
      });
      
      // Sort by creation date (newest first)
      usersData.sort((a, b) => b.createdAt - a.createdAt);
      
      console.log(`👥 UserManager: Found ${usersData.length} users`);
      setUsers(usersData);
    } catch (error) {
      console.error('Error fetching users:', error);
      alert('Errore nel caricamento degli utenti');
    } finally {
      setLoading(false);
    }
  };

  const filteredUsers = users.filter(user => {
    const matchesSearch = user.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.displayName?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesFilter = filterType === 'all' || 
                         (filterType === 'premium' && user.isPremium) ||
                         (filterType === 'free' && !user.isPremium) ||
                         (filterType === 'admin' && user.isAdmin);
    
    return matchesSearch && matchesFilter;
  });

  const openDeleteModal = (user) => {
    setUserToDelete(user);
    setShowDeleteModal(true);
  };

  const closeDeleteModal = () => {
    setUserToDelete(null);
    setShowDeleteModal(false);
  };

  const deleteUserCompletely = async () => {
    if (!userToDelete) return;

    setDeleting(userToDelete.id);
    
    try {
      console.log(`🗑️ UserManager: Starting complete deletion for user ${userToDelete.email}`);
      
      const batch = writeBatch(db);
      let deletedCollections = 0;

      // Collections da cancellare per l'utente
      const collectionsToDelete = [
        'questionnaires',
        'userProgress', 
        'userBadges',
        'userAchievements',
        'exerciseCompletions',
        'onboardingProgress',
        'premiumSubscriptions',
        'userPreferences',
        'userStats',
        'userNotes'
      ];

      // 1. Cancella tutti i documenti nelle sotto-collezioni dell'utente
      for (const collectionName of collectionsToDelete) {
        try {
          const q = query(
            collection(db, collectionName), 
            where('userId', '==', userToDelete.id)
          );
          const snapshot = await getDocs(q);
          
          snapshot.forEach((docSnapshot) => {
            batch.delete(docSnapshot.ref);
            deletedCollections++;
          });
          
          console.log(`🗑️ Deleted ${snapshot.size} docs from ${collectionName}`);
        } catch (error) {
          console.log(`⚠️ Collection ${collectionName} not found or error:`, error.message);
        }
      }

      // 2. Cancella documenti con pattern userId_*
      try {
        const questionnaireSnapshot = await getDocs(collection(db, 'questionnaires'));
        questionnaireSnapshot.forEach((docSnapshot) => {
          if (docSnapshot.id.startsWith(userToDelete.id + '_')) {
            batch.delete(docSnapshot.ref);
            deletedCollections++;
          }
        });
      } catch (error) {
        console.log('⚠️ Error checking questionnaires pattern:', error.message);
      }

      // 3. Cancella i dati dalla collezione users/{userId}/subcollections
      try {
        const userProgressRef = collection(db, 'users', userToDelete.id, 'progress');
        const progressSnapshot = await getDocs(userProgressRef);
        progressSnapshot.forEach((docSnapshot) => {
          batch.delete(docSnapshot.ref);
        });
        
        const userQuestionnaireRef = collection(db, 'users', userToDelete.id, 'questionnaires');
        const userQuestSnapshot = await getDocs(userQuestionnaireRef);
        userQuestSnapshot.forEach((docSnapshot) => {
          batch.delete(docSnapshot.ref);
        });
        
        console.log(`🗑️ Deleted user subcollections`);
      } catch (error) {
        console.log('⚠️ Error deleting user subcollections:', error.message);
      }

      // 4. Esegui il batch delle cancellazioni
      if (deletedCollections > 0) {
        await batch.commit();
        console.log(`🗑️ Batch committed: ${deletedCollections} documents deleted`);
      }

      // 5. Cancella il documento utente principale
      await deleteDoc(doc(db, 'users', userToDelete.id));
      console.log('🗑️ User document deleted');

      // 6. Aggiorna la lista locale
      setUsers(prev => prev.filter(u => u.id !== userToDelete.id));
      
      alert(`✅ Utente ${userToDelete.email} cancellato completamente!\nEliminati ${deletedCollections} documenti correlati.`);
      
      closeDeleteModal();
      
    } catch (error) {
      console.error('❌ Error deleting user completely:', error);
      alert(`Errore nella cancellazione: ${error.message}`);
    } finally {
      setDeleting(null);
    }
  };

  const formatDate = (date) => {
    if (!date) return 'Mai';
    return new Intl.DateTimeFormat('it-IT', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  };

  if (loading) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/3 mb-6"></div>
          <div className="space-y-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-16 bg-gray-200 dark:bg-gray-700 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
      {/* Header */}
      <div className="p-6 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            <Users className="h-6 w-6 text-blue-600 dark:text-blue-400" />
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
              Gestione Utenti
            </h2>
          </div>
          
          <button
            onClick={fetchUsers}
            disabled={loading}
            className="flex items-center space-x-2 px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg disabled:opacity-50"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            <span>Aggiorna</span>
          </button>
        </div>

        {/* Filters */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Cerca per email o nome..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
            />
          </div>
          
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
          >
            <option value="all">Tutti gli utenti</option>
            <option value="free">Utenti gratuiti</option>
            <option value="premium">Utenti premium</option>
            <option value="admin">Amministratori</option>
          </select>

          <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
            <Filter className="h-4 w-4 mr-2" />
            {filteredUsers.length} di {users.length} utenti
          </div>
        </div>
      </div>

      {/* Users List */}
      <div className="p-6">
        {filteredUsers.length === 0 ? (
          <div className="text-center py-12">
            <Users className="h-16 w-16 mx-auto mb-4 text-gray-400" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
              Nessun utente trovato
            </h3>
            <p className="text-gray-500 dark:text-gray-400">
              {users.length === 0 
                ? "Non ci sono ancora utenti registrati."
                : "Prova a modificare i filtri di ricerca."
              }
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredUsers.map((user) => (
              <div
                key={user.id}
                className="border border-gray-200 dark:border-gray-600 rounded-lg p-4 hover:shadow-md transition-shadow"
              >
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <div className="flex items-center space-x-2">
                        <Mail className="h-4 w-4 text-gray-500" />
                        <span className="font-medium text-gray-900 dark:text-white">
                          {user.email}
                        </span>
                      </div>
                      
                      {user.isPremium && (
                        <span className="flex items-center space-x-1 px-2 py-1 bg-amber-100 dark:bg-amber-900/30 text-amber-800 dark:text-amber-300 rounded-full text-xs">
                          <Crown className="h-3 w-3" />
                          <span>Premium</span>
                        </span>
                      )}
                      
                      {user.isAdmin && (
                        <span className="px-2 py-1 bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300 rounded-full text-xs font-medium">
                          Admin
                        </span>
                      )}
                    </div>
                    
                    {user.displayName && (
                      <p className="text-gray-600 dark:text-gray-400 text-sm mb-2">
                        Nome: {user.displayName}
                      </p>
                    )}
                    
                    <div className="flex flex-wrap gap-4 text-sm text-gray-500 dark:text-gray-400">
                      <div className="flex items-center space-x-1">
                        <Calendar className="h-4 w-4" />
                        <span>Registrato: {formatDate(user.createdAt)}</span>
                      </div>
                      
                      {user.lastLogin && (
                        <div className="flex items-center space-x-1">
                          <Users className="h-4 w-4" />
                          <span>Ultimo accesso: {formatDate(user.lastLogin)}</span>
                        </div>
                      )}
                      
                      <span>Onboarding: {user.onboardingCompleted ? '✅ Completato' : '❌ In corso'}</span>
                    </div>
                    
                    {user.provider && (
                      <div className="mt-2">
                        <span className="text-xs text-gray-500 bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded">
                          Provider: {user.provider}
                        </span>
                      </div>
                    )}
                  </div>

                  <div className="flex space-x-2 ml-4">
                    <button
                      onClick={() => openDeleteModal(user)}
                      disabled={deleting === user.id || user.isAdmin}
                      className={`p-2 rounded transition-colors ${
                        user.isAdmin 
                          ? 'text-gray-400 cursor-not-allowed' 
                          : 'text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20'
                      }`}
                      title={user.isAdmin ? 'Non puoi cancellare un admin' : 'Cancella utente completamente'}
                    >
                      {deleting === user.id ? (
                        <RefreshCw className="h-4 w-4 animate-spin" />
                      ) : (
                        <UserX className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteModal && userToDelete && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg max-w-md w-full">
            <div className="p-6">
              <div className="flex items-center space-x-3 mb-4">
                <AlertTriangle className="h-8 w-8 text-red-500" />
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Cancellazione Completa Utente
                </h3>
              </div>
              
              <div className="mb-6">
                <p className="text-gray-600 dark:text-gray-400 mb-3">
                  Stai per cancellare <strong>completamente</strong> l'utente:
                </p>
                <div className="bg-gray-50 dark:bg-gray-700 p-3 rounded-lg">
                  <p className="font-medium text-gray-900 dark:text-white">
                    {userToDelete.email}
                  </p>
                  {userToDelete.displayName && (
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {userToDelete.displayName}
                    </p>
                  )}
                </div>
                
                <div className="mt-4 text-sm text-red-600 dark:text-red-400">
                  <p className="font-medium mb-2">⚠️ Questa azione eliminerà:</p>
                  <ul className="list-disc list-inside space-y-1 text-xs">
                    <li>Account utente</li>
                    <li>Tutti i questionari compilati</li>
                    <li>Progressi negli esercizi</li>
                    <li>Badge e achievements</li>
                    <li>Dati onboarding</li>
                    <li>Preferenze e impostazioni</li>
                    <li>Note e contenuti personali</li>
                  </ul>
                  <p className="mt-2 font-medium">
                    ❌ Questa azione è IRREVERSIBILE!
                  </p>
                </div>
              </div>

              <div className="flex space-x-3">
                <button
                  onClick={closeDeleteModal}
                  className="flex-1 px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                >
                  Annulla
                </button>
                <button
                  onClick={deleteUserCompletely}
                  disabled={deleting}
                  className="flex-1 px-4 py-2 bg-red-500 hover:bg-red-600 disabled:opacity-50 text-white rounded-lg flex items-center justify-center space-x-2 transition-colors"
                >
                  {deleting ? (
                    <>
                      <RefreshCw className="h-4 w-4 animate-spin" />
                      <span>Eliminando...</span>
                    </>
                  ) : (
                    <>
                      <Trash2 className="h-4 w-4" />
                      <span>Elimina Tutto</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserManager;