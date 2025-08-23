import React, { useState, useEffect } from 'react';
import { 
  collection, 
  query, 
  getDocs, 
  orderBy,
  where
} from 'firebase/firestore';
import { db } from '../../../config/firebase';
import * as XLSX from 'xlsx';
import { 
  Users, 
  Search, 
  Filter, 
  Eye,
  X,
  Calendar,
  User,
  FileText,
  Trophy,
  Award,
  Brain,
  Clock,
  CheckCircle,
  Star,
  Crown,
  Target,
  History,
  ClipboardList,
  Download,
  Activity,
  TrendingUp
} from 'lucide-react';

const UserProfilesManager = () => {
  const [users, setUsers] = useState([]);
  const [userDetails, setUserDetails] = useState({});
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [showModal, setShowModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [loadingDetails, setLoadingDetails] = useState(false);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const usersQuery = query(
        collection(db, 'users'),
        orderBy('createdAt', 'desc')
      );
      const snapshot = await getDocs(usersQuery);
      const usersData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })).filter(user => !user.isAdmin); // Exclude admin users
      
      setUsers(usersData);
    } catch (error) {
      console.error('Error fetching users:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchUserDetails = async (userId) => {
    if (userDetails[userId]) {
      return userDetails[userId];
    }

    try {
      setLoadingDetails(true);

      // Fetch user exercises
      const exercisesQuery = query(
        collection(db, 'exerciseResponses'),
        where('userId', '==', userId),
        orderBy('completedAt', 'desc')
      );
      const exercisesSnapshot = await getDocs(exercisesQuery);
      const exercises = exercisesSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        completedAt: doc.data().completedAt?.toDate() || new Date(doc.data().completedAt)
      }));

      // Fetch user questionnaires
      const questionnairesQuery = query(
        collection(db, 'questionnaires'),
        where('userId', '==', userId),
        orderBy('completedAt', 'desc')
      );
      const questionnairesSnapshot = await getDocs(questionnairesQuery);
      const questionnaires = questionnairesSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        completedAt: doc.data().completedAt?.toDate() || new Date(doc.data().completedAt)
      }));

      // Fetch user badges
      const badgesQuery = query(
        collection(db, 'userBadges'),
        where('userId', '==', userId)
      );
      const badgesSnapshot = await getDocs(badgesQuery);
      const badges = badgesSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      // Fetch user stats
      const statsQuery = query(
        collection(db, 'userStats'),
        where('userId', '==', userId)
      );
      const statsSnapshot = await getDocs(statsQuery);
      const stats = statsSnapshot.docs.length > 0 ? statsSnapshot.docs[0].data() : null;

      // Fetch questionnaire assignments
      const assignmentsQuery = query(
        collection(db, 'questionnaireAssignments'),
        where('userId', '==', userId)
      );
      const assignmentsSnapshot = await getDocs(assignmentsQuery);
      const assignments = assignmentsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        assignedAt: doc.data().assignedAt?.toDate() || new Date(doc.data().assignedAt)
      }));

      const details = {
        exercises,
        questionnaires,
        badges,
        stats,
        assignments
      };

      setUserDetails(prev => ({
        ...prev,
        [userId]: details
      }));

      return details;
    } catch (error) {
      console.error('Error fetching user details:', error);
      return null;
    } finally {
      setLoadingDetails(false);
    }
  };

  const handleViewUser = async (user) => {
    setSelectedUser(user);
    setShowModal(true);
    await fetchUserDetails(user.id);
  };

  const exportUserData = async (user) => {
    try {
      const details = await fetchUserDetails(user.id);
      
      // Prepara i dati per l'export
      const userData = {
        nome: user.displayName || user.name,
        email: user.email,
        tipologia: user.isPremium ? 'Premium' : 'Standard',
        onboardingCompletato: user.onboardingCompleted ? 'Sì' : 'No',
        dataRegistrazione: user.createdAt?.toDate ? 
          user.createdAt.toDate().toLocaleDateString('it-IT') : 'Non disponibile',
        
        // Profilo sportivo
        sport: user.initialQuestionnaire?.sport || 'Non specificato',
        livello: user.initialQuestionnaire?.level || 'Non specificato',
        esperienzaCoaching: user.initialQuestionnaire?.coachingExperience || 'Non specificato',
        
        // Statistiche
        eserciziCompletati: details?.stats?.completedExercises || details?.exercises?.length || 0,
        streakCorrente: details?.stats?.currentStreak || 0,
        totaleBadge: details?.badges?.length || 0,
        totaleQuestionari: details?.questionnaires?.length || 0
      };
      
      // Crea foglio Excel con più tabs
      const workbook = XLSX.utils.book_new();
      
      // Tab 1: Informazioni generali
      const generalSheet = XLSX.utils.json_to_sheet([userData]);
      XLSX.utils.book_append_sheet(workbook, generalSheet, 'Profilo');
      
      // Tab 2: Risposte Esercizi
      if (details?.exercises?.length > 0) {
        const exerciseData = details.exercises.map((ex, index) => {
          const responses = ex.responses || ex.answers || {};
          const responseText = Object.entries(responses)
            .map(([q, a]) => `${q}: ${typeof a === 'object' ? JSON.stringify(a) : a}`)
            .join(' | ');
          
          return {
            numero: index + 1,
            titolo: ex.exerciseTitle || 'Esercizio',
            dataCompletamento: ex.completedAt?.toLocaleDateString?.('it-IT') || 'Non disponibile',
            risposte: responseText || 'Nessuna risposta',
            punteggio: ex.score || 'N/A',
            durata: ex.duration || 'N/A'
          };
        });
        const exerciseSheet = XLSX.utils.json_to_sheet(exerciseData);
        XLSX.utils.book_append_sheet(workbook, exerciseSheet, 'Esercizi');
      }
      
      // Tab 3: Risposte Questionari  
      if (details?.questionnaires?.length > 0) {
        const questionnaireData = details.questionnaires.map((q, index) => {
          const responses = q.responses || {};
          const responseText = Object.entries(responses)
            .map(([key, value]) => `${key}: ${typeof value === 'object' ? JSON.stringify(value) : value}`)
            .join(' | ');
            
          return {
            numero: index + 1,
            titolo: q.title || 'Questionario',
            tipo: q.type || 'Standard',
            dataCompletamento: q.completedAt?.toLocaleDateString?.('it-IT') || 'Non disponibile',
            risposte: responseText || 'Nessuna risposta'
          };
        });
        const questionnaireSheet = XLSX.utils.json_to_sheet(questionnaireData);
        XLSX.utils.book_append_sheet(workbook, questionnaireSheet, 'Questionari');
      }
      
      // Tab 4: Badge (se presenti)
      if (details?.badges?.length > 0) {
        const badgeData = details.badges.map((badge, index) => ({
          numero: index + 1,
          nome: badge.name || 'Badge',
          descrizione: badge.description || 'N/A',
          dataOttenimento: badge.earnedAt?.toLocaleDateString?.('it-IT') || 'Non disponibile'
        }));
        const badgeSheet = XLSX.utils.json_to_sheet(badgeData);
        XLSX.utils.book_append_sheet(workbook, badgeSheet, 'Badge');
      }
      
      // Download del file
      const safeUserName = (user.displayName || user.name || 'utente').replace(/[^a-zA-Z0-9]/g, '_');
      const fileName = `Mentalita_${safeUserName}_${new Date().toISOString().split('T')[0]}.xlsx`;
      XLSX.writeFile(workbook, fileName);
      
      alert(`✅ Export completato!\n\nFile scaricato: ${fileName}\n\nContenuto:\n- Profilo generale\n- ${details?.exercises?.length || 0} esercizi\n- ${details?.questionnaires?.length || 0} questionari\n- ${details?.badges?.length || 0} badge`);
      
    } catch (error) {
      console.error('Errore export:', error);
      alert('❌ Errore durante l\'export dei dati. Controlla la console per i dettagli.');
    }
  };

  const filteredUsers = users.filter(user => {
    const matchesSearch = !searchTerm || 
      user.displayName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || 
      (statusFilter === 'premium' && user.isPremium) ||
      (statusFilter === 'standard' && !user.isPremium) ||
      (statusFilter === 'onboarding-complete' && user.onboardingCompleted) ||
      (statusFilter === 'onboarding-pending' && !user.onboardingCompleted);
    
    return matchesSearch && matchesStatus;
  });

  const getUserStats = (user) => {
    const details = userDetails[user.id];
    if (!details) return null;
    
    return {
      totalExercises: details.exercises?.length || 0,
      totalQuestionnaires: details.questionnaires?.length || 0,
      totalBadges: details.badges?.length || 0,
      currentStreak: details.stats?.currentStreak || 0,
      lastActivity: details.exercises?.[0]?.completedAt || details.questionnaires?.[0]?.completedAt
    };
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center space-x-2 mb-2">
          <Users className="h-6 w-6 text-indigo-600" />
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Profili Utenti
          </h1>
        </div>
        <p className="text-gray-600 dark:text-gray-400">
          Visualizza profili completi degli atleti con esercizi, questionari, badge e statistiche
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
          <div className="flex items-center">
            <Users className="h-6 w-6 text-blue-600 dark:text-blue-400" />
            <div className="ml-3">
              <p className="text-sm font-medium text-blue-900 dark:text-blue-100">Totali</p>
              <p className="text-lg font-semibold text-blue-600 dark:text-blue-400">
                {users.length}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-purple-50 dark:bg-purple-900/20 p-4 rounded-lg">
          <div className="flex items-center">
            <Crown className="h-6 w-6 text-purple-600 dark:text-purple-400" />
            <div className="ml-3">
              <p className="text-sm font-medium text-purple-900 dark:text-purple-100">Premium</p>
              <p className="text-lg font-semibold text-purple-600 dark:text-purple-400">
                {users.filter(u => u.isPremium).length}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg">
          <div className="flex items-center">
            <CheckCircle className="h-6 w-6 text-green-600 dark:text-green-400" />
            <div className="ml-3">
              <p className="text-sm font-medium text-green-900 dark:text-green-100">Onboarding OK</p>
              <p className="text-lg font-semibold text-green-600 dark:text-green-400">
                {users.filter(u => u.onboardingCompleted).length}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-orange-50 dark:bg-orange-900/20 p-4 rounded-lg">
          <div className="flex items-center">
            <Activity className="h-6 w-6 text-orange-600 dark:text-orange-400" />
            <div className="ml-3">
              <p className="text-sm font-medium text-orange-900 dark:text-orange-100">Attivi 7gg</p>
              <p className="text-lg font-semibold text-orange-600 dark:text-orange-400">
                {users.filter(u => {
                  const lastWeek = new Date();
                  lastWeek.setDate(lastWeek.getDate() - 7);
                  return u.lastLoginAt?.toDate && u.lastLoginAt.toDate() > lastWeek;
                }).length}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <div className="flex-1">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
            <input
              type="text"
              placeholder="Cerca per nome o email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2 w-full border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            />
          </div>
        </div>
        <div className="sm:w-48">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
          >
            <option value="all">Tutti</option>
            <option value="premium">Premium</option>
            <option value="standard">Standard</option>
            <option value="onboarding-complete">Onboarding OK</option>
            <option value="onboarding-pending">Onboarding Mancante</option>
          </select>
        </div>
      </div>

      {/* Users Grid */}
      {filteredUsers.length === 0 ? (
        <div className="text-center py-12">
          <Users className="h-12 w-12 mx-auto mb-4 text-gray-400" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
            Nessun utente trovato
          </h3>
          <p className="text-gray-500 dark:text-gray-400">
            {searchTerm || statusFilter !== 'all' 
              ? 'Prova a modificare i filtri di ricerca' 
              : 'Non ci sono ancora utenti registrati'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredUsers.map((user) => {
            const stats = getUserStats(user);
            
            return (
              <div key={user.id} className="bg-white dark:bg-gray-800 rounded-lg shadow hover:shadow-md transition-shadow">
                <div className="p-6">
                  {/* Header */}
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-full flex items-center justify-center">
                        <User className="h-5 w-5 text-white" />
                      </div>
                      <div>
                        <h3 className="font-medium text-gray-900 dark:text-white">
                          {user.displayName || user.name || 'Nome non disponibile'}
                        </h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          {user.email}
                        </p>
                      </div>
                    </div>
                    {user.isPremium && (
                      <Crown className="h-5 w-5 text-yellow-500" />
                    )}
                  </div>

                  {/* Status Badges */}
                  <div className="flex flex-wrap gap-1 mb-4">
                    {user.isPremium && (
                      <span className="px-2 py-1 bg-purple-100 text-purple-800 text-xs rounded-full">
                        Premium
                      </span>
                    )}
                    {user.onboardingCompleted ? (
                      <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">
                        Onboarding OK
                      </span>
                    ) : (
                      <span className="px-2 py-1 bg-red-100 text-red-800 text-xs rounded-full">
                        Onboarding Mancante
                      </span>
                    )}
                    {user.initialQuestionnaireCompleted && (
                      <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
                        Questionario OK
                      </span>
                    )}
                  </div>

                  {/* Quick Stats */}
                  {stats && (
                    <div className="grid grid-cols-2 gap-3 mb-4 text-sm">
                      <div className="flex items-center space-x-1">
                        <Brain className="h-4 w-4 text-indigo-600" />
                        <span className="text-gray-600 dark:text-gray-400">
                          {stats.totalExercises} esercizi
                        </span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <ClipboardList className="h-4 w-4 text-green-600" />
                        <span className="text-gray-600 dark:text-gray-400">
                          {stats.totalQuestionnaires} questionari
                        </span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <Award className="h-4 w-4 text-yellow-600" />
                        <span className="text-gray-600 dark:text-gray-400">
                          {stats.totalBadges} badge
                        </span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <TrendingUp className="h-4 w-4 text-orange-600" />
                        <span className="text-gray-600 dark:text-gray-400">
                          {stats.currentStreak} streak
                        </span>
                      </div>
                    </div>
                  )}

                  {/* Last Activity */}
                  {stats?.lastActivity && (
                    <div className="mb-4 p-2 bg-gray-50 dark:bg-gray-700 rounded text-xs text-gray-500 dark:text-gray-400">
                      <div className="flex items-center space-x-1">
                        <Activity className="h-3 w-3" />
                        <span>
                          Ultima attività: {stats.lastActivity.toLocaleDateString('it-IT')}
                        </span>
                      </div>
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex space-x-2">
                    <button
                      onClick={() => handleViewUser(user)}
                      className="flex-1 flex items-center justify-center space-x-1 px-3 py-2 text-indigo-600 hover:text-indigo-800 hover:bg-indigo-100 rounded transition-colors"
                    >
                      <Eye className="h-4 w-4" />
                      <span className="text-sm">Visualizza</span>
                    </button>
                    <button
                      onClick={() => exportUserData(user)}
                      className="flex items-center justify-center px-3 py-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded transition-colors"
                      title="Esporta dati"
                    >
                      <Download className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* User Detail Modal */}
      {showModal && selectedUser && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-8 mx-auto p-5 border w-11/12 max-w-6xl shadow-lg rounded-md bg-white dark:bg-gray-800">
            <div className="mt-3">
              {/* Modal Header */}
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-xl font-medium text-gray-900 dark:text-white">
                    Profilo Completo: {selectedUser.displayName || selectedUser.name}
                  </h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                    {selectedUser.email}
                  </p>
                </div>
                <button
                  onClick={() => setShowModal(false)}
                  className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>

              {loadingDetails ? (
                <div className="flex items-center justify-center h-32">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
                </div>
              ) : (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 max-h-[600px] overflow-y-auto">
                  {/* User Info Section */}
                  <div className="space-y-4">
                    <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
                      <h4 className="font-medium text-gray-900 dark:text-white mb-3">
                        Informazioni Generali
                      </h4>
                      <div className="space-y-2 text-sm">
                        <div>
                          <span className="text-gray-600 dark:text-gray-400">Status: </span>
                          <span className={selectedUser.isPremium ? 'text-purple-600 font-medium' : 'text-gray-900 dark:text-white'}>
                            {selectedUser.isPremium ? 'Premium' : 'Standard'}
                          </span>
                        </div>
                        <div>
                          <span className="text-gray-600 dark:text-gray-400">Onboarding: </span>
                          <span className={selectedUser.onboardingCompleted ? 'text-green-600 font-medium' : 'text-red-600 font-medium'}>
                            {selectedUser.onboardingCompleted ? 'Completato' : 'Da completare'}
                          </span>
                        </div>
                        <div>
                          <span className="text-gray-600 dark:text-gray-400">Registrato: </span>
                          <span className="text-gray-900 dark:text-white">
                            {selectedUser.createdAt?.toDate ? 
                              selectedUser.createdAt.toDate().toLocaleDateString('it-IT') :
                              'Data non disponibile'
                            }
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Sport Info */}
                    {selectedUser.initialQuestionnaire && (
                      <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
                        <h4 className="font-medium text-gray-900 dark:text-white mb-3">
                          Profilo Sportivo
                        </h4>
                        <div className="space-y-2 text-sm">
                          <div>
                            <span className="text-gray-600 dark:text-gray-400">Sport: </span>
                            <span className="text-gray-900 dark:text-white">
                              {selectedUser.initialQuestionnaire.sport || 'Non specificato'}
                            </span>
                          </div>
                          <div>
                            <span className="text-gray-600 dark:text-gray-400">Livello: </span>
                            <span className="text-gray-900 dark:text-white">
                              {selectedUser.initialQuestionnaire.level || 'Non specificato'}
                            </span>
                          </div>
                          <div>
                            <span className="text-gray-600 dark:text-gray-400">Coaching: </span>
                            <span className="text-gray-900 dark:text-white">
                              {selectedUser.initialQuestionnaire.coachingExperience || 'Non specificato'}
                            </span>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Stats */}
                    {userDetails[selectedUser.id]?.stats && (
                      <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
                        <h4 className="font-medium text-gray-900 dark:text-white mb-3">
                          Statistiche
                        </h4>
                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div>
                            <div className="text-lg font-bold text-blue-600">
                              {userDetails[selectedUser.id].stats.completedExercises || 0}
                            </div>
                            <div className="text-gray-600 dark:text-gray-400">Esercizi</div>
                          </div>
                          <div>
                            <div className="text-lg font-bold text-green-600">
                              {userDetails[selectedUser.id].stats.currentStreak || 0}
                            </div>
                            <div className="text-gray-600 dark:text-gray-400">Streak</div>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Badges */}
                    {userDetails[selectedUser.id]?.badges && userDetails[selectedUser.id].badges.length > 0 && (
                      <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
                        <h4 className="font-medium text-gray-900 dark:text-white mb-3">
                          Badge ({userDetails[selectedUser.id].badges.length})
                        </h4>
                        <div className="flex flex-wrap gap-1">
                          {userDetails[selectedUser.id].badges.slice(0, 6).map((badge, index) => (
                            <span key={badge.id || index} className="px-2 py-1 bg-yellow-100 text-yellow-800 text-xs rounded-full">
                              {badge.name}
                            </span>
                          ))}
                          {userDetails[selectedUser.id].badges.length > 6 && (
                            <span className="px-2 py-1 bg-gray-200 text-gray-600 text-xs rounded-full">
                              +{userDetails[selectedUser.id].badges.length - 6}
                            </span>
                          )}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Activities Section */}
                  <div className="space-y-4">
                    {/* Recent Exercises */}
                    <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
                      <h4 className="font-medium text-gray-900 dark:text-white mb-3">
                        Risposte Esercizi ({userDetails[selectedUser.id]?.exercises?.length || 0})
                      </h4>
                      
                      {/* Debug info - temporaneo per verificare i dati */}
                      {process.env.NODE_ENV === 'development' && userDetails[selectedUser.id]?.exercises && (
                        <div className="text-xs text-yellow-600 bg-yellow-100 p-2 rounded mb-2">
                          Debug: {userDetails[selectedUser.id].exercises.length} esercizi trovati
                        </div>
                      )}
                      
                      <div className="max-h-64 overflow-y-auto space-y-3">
                        {userDetails[selectedUser.id]?.exercises?.length > 0 ? (
                          userDetails[selectedUser.id].exercises.map((exercise, index) => (
                            <div key={exercise.id || index} className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-lg p-3">
                              <div className="flex items-start justify-between mb-2">
                                <div className="text-sm font-medium text-gray-900 dark:text-white">
                                  {exercise.exerciseTitle || exercise.title || `Esercizio #${index + 1}`}
                                </div>
                                <div className="text-xs text-gray-500 dark:text-gray-400">
                                  {exercise.completedAt?.toLocaleDateString?.('it-IT') || 
                                   (exercise.completedAt && new Date(exercise.completedAt).toLocaleDateString('it-IT')) ||
                                   'Data non disponibile'}
                                  {exercise.score && ` • ${exercise.score}`}
                                </div>
                              </div>
                              
                              {/* Visualizza tutte le proprietà dell'esercizio per debug */}
                              <div className="mt-2 text-xs">
                                <div className="text-gray-600 dark:text-gray-400 mb-1">Dettagli:</div>
                                <div className="space-y-1">
                                  {/* Mostra risposte se esistono */}
                                  {(exercise.responses || exercise.answers) && Object.keys(exercise.responses || exercise.answers || {}).length > 0 ? (
                                    <div className="bg-blue-50 dark:bg-blue-900/20 p-2 rounded">
                                      <div className="font-medium text-blue-700 dark:text-blue-300 mb-1">Risposte:</div>
                                      {Object.entries(exercise.responses || exercise.answers || {}).map(([questionId, answer], qIndex) => (
                                        <div key={qIndex} className="bg-white dark:bg-gray-800 p-2 rounded mb-1">
                                          <div className="font-medium text-gray-700 dark:text-gray-300">
                                            {questionId.replace(/[_-]/g, ' ').replace(/^\w/, c => c.toUpperCase())}
                                          </div>
                                          <div className="text-gray-600 dark:text-gray-400 mt-1 break-words">
                                            {typeof answer === 'object' ? JSON.stringify(answer, null, 2) : String(answer)}
                                          </div>
                                        </div>
                                      ))}
                                    </div>
                                  ) : (
                                    <div className="bg-gray-100 dark:bg-gray-600 p-2 rounded text-gray-500 dark:text-gray-400">
                                      Nessuna risposta registrata per questo esercizio
                                    </div>
                                  )}
                                  
                                  {/* Mostra altri dettagli se presenti */}
                                  {exercise.exerciseId && (
                                    <div className="text-gray-500">ID Esercizio: {exercise.exerciseId}</div>
                                  )}
                                  
                                  {exercise.duration && (
                                    <div className="text-gray-500">⏱️ Durata: {exercise.duration}</div>
                                  )}
                                  
                                  {exercise.progress !== undefined && (
                                    <div className="text-gray-500">Progresso: {exercise.progress}%</div>
                                  )}
                                </div>
                              </div>
                            </div>
                          ))
                        ) : (
                          <p className="text-sm text-gray-500 dark:text-gray-400">
                            Nessun esercizio completato
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Recent Questionnaires */}
                    <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
                      <h4 className="font-medium text-gray-900 dark:text-white mb-3">
                        Questionari ({userDetails[selectedUser.id]?.questionnaires?.length || 0})
                      </h4>
                      <div className="max-h-64 overflow-y-auto space-y-3">
                        {userDetails[selectedUser.id]?.questionnaires?.length > 0 ? (
                          userDetails[selectedUser.id].questionnaires.map((questionnaire, index) => (
                            <div key={questionnaire.id || index} className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-lg p-3">
                              <div className="flex items-start justify-between mb-2">
                                <div className="text-sm font-medium text-gray-900 dark:text-white">
                                  {questionnaire.title || `Questionario #${index + 1}`}
                                </div>
                                <div className="text-xs text-gray-500 dark:text-gray-400">
                                  {questionnaire.completedAt?.toLocaleDateString?.('it-IT') || 
                                   (questionnaire.completedAt && new Date(questionnaire.completedAt).toLocaleDateString('it-IT')) ||
                                   'Data non disponibile'}
                                </div>
                              </div>
                              
                              {questionnaire.type && (
                                <div className="text-xs text-blue-600 dark:text-blue-400 mb-2">
                                  Tipo: {questionnaire.type}
                                </div>
                              )}
                              
                              {/* Visualizza le risposte del questionario */}
                              {questionnaire.responses && Object.keys(questionnaire.responses).length > 0 && (
                                <div className="mt-2">
                                  <div className="text-xs text-gray-600 dark:text-gray-400 mb-1">Risposte:</div>
                                  <div className="space-y-1 max-h-32 overflow-y-auto">
                                    {Object.entries(questionnaire.responses).map(([key, value], qIndex) => (
                                      <div key={qIndex} className="text-xs bg-gray-50 dark:bg-gray-700 p-2 rounded">
                                        <div className="font-medium text-gray-700 dark:text-gray-300">
                                          {key.replace(/[_-]/g, ' ').replace(/^\w/, c => c.toUpperCase())}
                                        </div>
                                        <div className="text-gray-600 dark:text-gray-400 mt-1 break-words">
                                          {typeof value === 'object' ? JSON.stringify(value, null, 2) : String(value)}
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              )}
                            </div>
                          ))
                        ) : (
                          <p className="text-sm text-gray-500 dark:text-gray-400">
                            Nessun questionario completato
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Questionnaire Assignments */}
                    {userDetails[selectedUser.id]?.assignments && userDetails[selectedUser.id].assignments.length > 0 && (
                      <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
                        <h4 className="font-medium text-gray-900 dark:text-white mb-3">
                          Questionari Assegnati ({userDetails[selectedUser.id].assignments.length})
                        </h4>
                        {userDetails[selectedUser.id].assignments.map((assignment, index) => (
                          <div key={assignment.id || index} className="mb-2 last:mb-0">
                            <div className="flex items-center justify-between">
                              <div className="text-sm font-medium text-gray-900 dark:text-white">
                                {assignment.templateTitle}
                              </div>
                              <span className={`px-2 py-1 rounded-full text-xs ${
                                assignment.status === 'completed' ? 'bg-green-100 text-green-800' :
                                assignment.status === 'assigned' ? 'bg-blue-100 text-blue-800' :
                                'bg-red-100 text-red-800'
                              }`}>
                                {assignment.status}
                              </span>
                            </div>
                            <div className="text-xs text-gray-500 dark:text-gray-400">
                              Assegnato il {assignment.assignedAt.toLocaleDateString('it-IT')}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Footer */}
              <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200 dark:border-gray-700 mt-6">
                <button
                  onClick={() => exportUserData(selectedUser)}
                  className="flex items-center space-x-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
                >
                  <Download className="h-4 w-4" />
                  <span>Esporta Dati</span>
                </button>
                <button
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors"
                >
                  Chiudi
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserProfilesManager;