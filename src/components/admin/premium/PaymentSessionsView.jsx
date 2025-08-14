import React, { useState, useEffect } from 'react';
import { 
  collection, 
  query, 
  getDocs, 
  orderBy, 
  where,
  deleteDoc,
  doc,
  updateDoc
} from 'firebase/firestore';
import { db } from '../../../config/firebase';
import { 
  CreditCard, 
  Search, 
  Filter, 
  Calendar,
  DollarSign,
  User,
  Check,
  X,
  Clock,
  AlertTriangle,
  Eye,
  Trash2,
  RefreshCw,
  Download,
  TrendingUp,
  Activity
} from 'lucide-react';

const PaymentSessionsView = () => {
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [dateFilter, setDateFilter] = useState('all');
  const [selectedSession, setSelectedSession] = useState(null);
  const [showModal, setShowModal] = useState(false);

  const statusOptions = [
    { value: 'all', label: 'Tutti' },
    { value: 'pending', label: 'In Attesa' },
    { value: 'completed', label: 'Completati' },
    { value: 'failed', label: 'Falliti' },
    { value: 'cancelled', label: 'Annullati' },
    { value: 'refunded', label: 'Rimborsati' }
  ];

  const dateOptions = [
    { value: 'all', label: 'Tutto il periodo' },
    { value: 'today', label: 'Oggi' },
    { value: 'week', label: 'Questa settimana' },
    { value: 'month', label: 'Questo mese' },
    { value: 'quarter', label: 'Questo trimestre' }
  ];

  useEffect(() => {
    fetchPaymentSessions();
  }, []);

  const fetchPaymentSessions = async () => {
    try {
      setLoading(true);
      const sessionsQuery = query(
        collection(db, 'paymentSessions'),
        orderBy('createdAt', 'desc')
      );
      
      const snapshot = await getDocs(sessionsQuery);
      const sessionsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate(),
        completedAt: doc.data().completedAt?.toDate(),
        updatedAt: doc.data().updatedAt?.toDate()
      }));
      
      setSessions(sessionsData);
    } catch (error) {
      console.error('Error fetching payment sessions:', error);
      // Fallback query without orderBy
      try {
        const fallbackQuery = query(collection(db, 'paymentSessions'));
        const snapshot = await getDocs(fallbackQuery);
        const sessionsData = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          createdAt: doc.data().createdAt?.toDate(),
          completedAt: doc.data().completedAt?.toDate(),
          updatedAt: doc.data().updatedAt?.toDate()
        }));
        setSessions(sessionsData.sort((a, b) => (b.createdAt || new Date()) - (a.createdAt || new Date())));
      } catch (fallbackError) {
        console.error('Fallback query failed:', fallbackError);
        setSessions([]);
      }
    } finally {
      setLoading(false);
    }
  };

  const filterByDate = (session) => {
    if (dateFilter === 'all') return true;
    if (!session.createdAt) return false;
    
    const now = new Date();
    const sessionDate = session.createdAt;
    
    switch (dateFilter) {
      case 'today':
        return sessionDate.toDateString() === now.toDateString();
      case 'week':
        const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        return sessionDate >= weekAgo;
      case 'month':
        const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        return sessionDate >= monthAgo;
      case 'quarter':
        const quarterAgo = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
        return sessionDate >= quarterAgo;
      default:
        return true;
    }
  };

  const filteredSessions = sessions.filter(session => {
    const matchesSearch = 
      session.userEmail?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      session.planName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      session.sessionId?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || session.status === statusFilter;
    const matchesDate = filterByDate(session);
    
    return matchesSearch && matchesStatus && matchesDate;
  });

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending': return 'text-yellow-600 bg-yellow-100';
      case 'completed': return 'text-green-600 bg-green-100';
      case 'failed': return 'text-red-600 bg-red-100';
      case 'cancelled': return 'text-gray-600 bg-gray-100';
      case 'refunded': return 'text-purple-600 bg-purple-100';
      default: return 'text-blue-600 bg-blue-100';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'pending': return <Clock className="h-4 w-4" />;
      case 'completed': return <Check className="h-4 w-4" />;
      case 'failed': return <X className="h-4 w-4" />;
      case 'cancelled': return <X className="h-4 w-4" />;
      case 'refunded': return <RefreshCw className="h-4 w-4" />;
      default: return <AlertTriangle className="h-4 w-4" />;
    }
  };

  const handleViewDetails = (session) => {
    setSelectedSession(session);
    setShowModal(true);
  };

  const handleDeleteSession = async (sessionId) => {
    if (!window.confirm('Sei sicuro di voler eliminare questa sessione di pagamento?')) return;
    
    try {
      await deleteDoc(doc(db, 'paymentSessions', sessionId));
      await fetchPaymentSessions();
    } catch (error) {
      console.error('Error deleting payment session:', error);
      alert('Errore nell\'eliminazione');
    }
  };

  const getTotalRevenue = () => {
    return filteredSessions
      .filter(s => s.status === 'completed')
      .reduce((total, session) => total + (session.amount || 0), 0);
  };

  const getSuccessRate = () => {
    if (filteredSessions.length === 0) return 0;
    const successfulSessions = filteredSessions.filter(s => s.status === 'completed').length;
    return Math.round((successfulSessions / filteredSessions.length) * 100);
  };

  if (loading) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <div className="flex items-center space-x-3 mb-6">
          <CreditCard className="h-6 w-6 text-green-600 dark:text-green-400" />
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            Sessioni Pagamento
          </h2>
        </div>
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto"></div>
          <p className="text-gray-500 dark:text-gray-400 mt-4">Caricamento sessioni...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between mb-6">
        <div className="flex items-center space-x-3 mb-4 lg:mb-0">
          <CreditCard className="h-6 w-6 text-green-600 dark:text-green-400" />
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            Sessioni Pagamento ({filteredSessions.length})
          </h2>
        </div>
        
        <button
          onClick={fetchPaymentSessions}
          className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
        >
          <RefreshCw className="h-4 w-4" />
          <span>Aggiorna</span>
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <div className="bg-gradient-to-r from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 rounded-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-green-600 dark:text-green-400">Ricavi Totali</p>
              <p className="text-2xl font-bold text-green-700 dark:text-green-300">
                €{getTotalRevenue().toFixed(2)}
              </p>
            </div>
            <DollarSign className="h-8 w-8 text-green-600 dark:text-green-400" />
          </div>
        </div>

        <div className="bg-gradient-to-r from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 rounded-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-blue-600 dark:text-blue-400">Tasso di Successo</p>
              <p className="text-2xl font-bold text-blue-700 dark:text-blue-300">
                {getSuccessRate()}%
              </p>
            </div>
            <TrendingUp className="h-8 w-8 text-blue-600 dark:text-blue-400" />
          </div>
        </div>

        <div className="bg-gradient-to-r from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20 rounded-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-purple-600 dark:text-purple-400">Sessioni Attive</p>
              <p className="text-2xl font-bold text-purple-700 dark:text-purple-300">
                {filteredSessions.filter(s => s.status === 'pending').length}
              </p>
            </div>
            <Activity className="h-8 w-8 text-purple-600 dark:text-purple-400" />
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col lg:flex-row gap-4 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="Cerca per email, piano o ID sessione..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-green-500 focus:border-transparent w-full"
          />
        </div>
        
        <div className="flex gap-4">
          <div className="relative">
            <Filter className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="pl-10 pr-8 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-green-500 focus:border-transparent appearance-none cursor-pointer min-w-40"
            >
              {statusOptions.map(option => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          <div className="relative">
            <Calendar className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
            <select
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              className="pl-10 pr-8 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-green-500 focus:border-transparent appearance-none cursor-pointer min-w-48"
            >
              {dateOptions.map(option => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Sessions List */}
      {filteredSessions.length === 0 ? (
        <div className="text-center py-12">
          <CreditCard className="h-16 w-16 mx-auto mb-4 text-gray-400" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
            Nessuna sessione trovata
          </h3>
          <p className="text-gray-500 dark:text-gray-400">
            {searchTerm || statusFilter !== 'all' || dateFilter !== 'all'
              ? 'Prova a modificare i filtri di ricerca'
              : 'Non ci sono ancora sessioni di pagamento'
            }
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-700">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Utente
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Piano
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Importo
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Stato
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Data
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Azioni
                </th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              {filteredSessions.map(session => (
                <tr key={session.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <User className="h-8 w-8 text-gray-400 mr-3" />
                      <div>
                        <div className="text-sm font-medium text-gray-900 dark:text-white">
                          {session.userEmail}
                        </div>
                        <div className="text-sm text-gray-500 dark:text-gray-400">
                          ID: {session.sessionId?.slice(0, 12)}...
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900 dark:text-white">
                      {session.planName}
                    </div>
                    <div className="text-sm text-gray-500 dark:text-gray-400">
                      {session.billingPeriod === 'monthly' ? 'Mensile' : 'Annuale'}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <DollarSign className="h-4 w-4 text-gray-400 mr-1" />
                      <span className="text-sm font-medium text-gray-900 dark:text-white">
                        €{session.amount}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex items-center space-x-1 px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(session.status)}`}>
                      {getStatusIcon(session.status)}
                      <span>{statusOptions.find(s => s.value === session.status)?.label || session.status}</span>
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                    <div className="flex items-center">
                      <Calendar className="h-4 w-4 mr-1" />
                      {session.createdAt ? session.createdAt.toLocaleDateString('it-IT') : 'N/A'}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-2">
                    <button
                      onClick={() => handleViewDetails(session)}
                      className="text-green-600 hover:text-green-900 dark:text-green-400 dark:hover:text-green-300"
                    >
                      <Eye className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => handleDeleteSession(session.id)}
                      className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Session Detail Modal */}
      {showModal && selectedSession && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-11/12 max-w-2xl shadow-lg rounded-md bg-white dark:bg-gray-800">
            <div className="mt-3">
              {/* Modal Header */}
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                  Dettagli Sessione Pagamento
                </h3>
                <button
                  onClick={() => setShowModal(false)}
                  className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>

              {/* Session Details */}
              <div className="space-y-4 mb-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      ID Sessione
                    </label>
                    <p className="text-gray-900 dark:text-white font-mono text-sm">
                      {selectedSession.sessionId}
                    </p>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Email Utente
                    </label>
                    <p className="text-gray-900 dark:text-white">{selectedSession.userEmail}</p>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Piano
                    </label>
                    <p className="text-gray-900 dark:text-white">{selectedSession.planName}</p>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Periodo di Fatturazione
                    </label>
                    <p className="text-gray-900 dark:text-white">
                      {selectedSession.billingPeriod === 'monthly' ? 'Mensile' : 'Annuale'}
                    </p>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Importo
                    </label>
                    <p className="text-gray-900 dark:text-white text-lg font-semibold">
                      €{selectedSession.amount}
                    </p>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Metodo di Pagamento
                    </label>
                    <p className="text-gray-900 dark:text-white">
                      {selectedSession.paymentMethod || 'N/A'}
                    </p>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Data Creazione
                    </label>
                    <p className="text-gray-900 dark:text-white">
                      {selectedSession.createdAt ? selectedSession.createdAt.toLocaleString('it-IT') : 'N/A'}
                    </p>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Data Completamento
                    </label>
                    <p className="text-gray-900 dark:text-white">
                      {selectedSession.completedAt ? selectedSession.completedAt.toLocaleString('it-IT') : 'N/A'}
                    </p>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Stato
                  </label>
                  <span className={`inline-flex items-center space-x-1 px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(selectedSession.status)}`}>
                    {getStatusIcon(selectedSession.status)}
                    <span>{statusOptions.find(s => s.value === selectedSession.status)?.label || selectedSession.status}</span>
                  </span>
                </div>

                {selectedSession.errorMessage && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Messaggio di Errore
                    </label>
                    <p className="text-red-600 bg-red-50 dark:bg-red-900/20 p-3 rounded-lg">
                      {selectedSession.errorMessage}
                    </p>
                  </div>
                )}

                {selectedSession.metadata && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Metadati
                    </label>
                    <pre className="text-sm text-gray-600 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 p-3 rounded-lg overflow-auto">
                      {JSON.stringify(selectedSession.metadata, null, 2)}
                    </pre>
                  </div>
                )}
              </div>

              {/* Actions */}
              <div className="flex justify-end pt-4 border-t border-gray-200 dark:border-gray-700">
                <button
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition-colors"
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

export default PaymentSessionsView;