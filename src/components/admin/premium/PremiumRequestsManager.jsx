import React, { useState, useEffect } from 'react';
import { 
  collection, 
  query, 
  getDocs, 
  orderBy, 
  updateDoc,
  deleteDoc,
  doc,
  where,
  addDoc
} from 'firebase/firestore';
import { db } from '../../../config/firebase';
import { 
  Crown, 
  Search, 
  Filter, 
  Check, 
  X, 
  Clock,
  User,
  Mail,
  Calendar,
  Euro,
  MoreHorizontal,
  CheckCircle,
  XCircle,
  Eye,
  Trash2,
  UserPlus,
  AlertTriangle
} from 'lucide-react';

const PremiumRequestsManager = () => {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  const statusOptions = [
    { value: 'all', label: 'Tutti' },
    { value: 'pending', label: 'In Attesa' },
    { value: 'approved', label: 'Approvate' },
    { value: 'rejected', label: 'Rifiutate' },
    { value: 'completed', label: 'Completate' }
  ];

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending': return 'text-yellow-600 bg-yellow-100';
      case 'approved': return 'text-green-600 bg-green-100';
      case 'rejected': return 'text-red-600 bg-red-100';
      case 'completed': return 'text-blue-600 bg-blue-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'pending': return <Clock className="h-4 w-4" />;
      case 'approved': return <CheckCircle className="h-4 w-4" />;
      case 'rejected': return <XCircle className="h-4 w-4" />;
      case 'completed': return <Crown className="h-4 w-4" />;
      default: return <AlertTriangle className="h-4 w-4" />;
    }
  };

  useEffect(() => {
    fetchRequests();
  }, []);

  const fetchRequests = async () => {
    try {
      setLoading(true);
      const requestsQuery = query(
        collection(db, 'premiumRequests'),
        orderBy('createdAt', 'desc')
      );
      
      const snapshot = await getDocs(requestsQuery);
      const requestsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate()
      }));
      
      setRequests(requestsData);
    } catch (error) {
      console.error('Error fetching premium requests:', error);
      // Fallback query without orderBy
      try {
        const fallbackQuery = query(collection(db, 'premiumRequests'));
        const snapshot = await getDocs(fallbackQuery);
        const requestsData = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          createdAt: doc.data().createdAt?.toDate()
        }));
        setRequests(requestsData.sort((a, b) => (b.createdAt || new Date()) - (a.createdAt || new Date())));
      } catch (fallbackError) {
        console.error('Fallback query failed:', fallbackError);
        setRequests([]);
      }
    } finally {
      setLoading(false);
    }
  };

  const filteredRequests = requests.filter(request => {
    const matchesSearch = 
      request.userEmail?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      request.planName?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || request.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  const handleUpdateStatus = async (requestId, newStatus, notes = '') => {
    try {
      setActionLoading(true);
      const requestRef = doc(db, 'premiumRequests', requestId);
      
      await updateDoc(requestRef, {
        status: newStatus,
        updatedAt: new Date(),
        adminNotes: notes
      });

      // If approved, create subscription record
      if (newStatus === 'approved') {
        const request = requests.find(r => r.id === requestId);
        if (request) {
          await addDoc(collection(db, 'subscriptions'), {
            userId: request.userId,
            planId: request.planId,
            planName: request.planName,
            billingPeriod: request.billingPeriod,
            price: request.price,
            status: 'active',
            startDate: new Date(),
            endDate: new Date(Date.now() + (request.billingPeriod === 'yearly' ? 365 : 30) * 24 * 60 * 60 * 1000),
            createdAt: new Date()
          });
        }
      }

      await fetchRequests();
      setShowModal(false);
      setSelectedRequest(null);
    } catch (error) {
      console.error('Error updating request status:', error);
      alert('Errore nell\'aggiornamento dello stato');
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteRequest = async (requestId) => {
    if (!window.confirm('Sei sicuro di voler eliminare questa richiesta?')) return;
    
    try {
      setActionLoading(true);
      await deleteDoc(doc(db, 'premiumRequests', requestId));
      await fetchRequests();
      setShowModal(false);
      setSelectedRequest(null);
    } catch (error) {
      console.error('Error deleting request:', error);
      alert('Errore nell\'eliminazione della richiesta');
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <div className="flex items-center space-x-3 mb-6">
          <Crown className="h-6 w-6 text-orange-600 dark:text-orange-400" />
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            Richieste Premium
          </h2>
        </div>
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600 mx-auto"></div>
          <p className="text-gray-500 dark:text-gray-400 mt-4">Caricamento richieste...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between mb-6">
        <div className="flex items-center space-x-3 mb-4 lg:mb-0">
          <Crown className="h-6 w-6 text-orange-600 dark:text-orange-400" />
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            Richieste Premium ({filteredRequests.length})
          </h2>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="Cerca per email o piano..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-orange-500 focus:border-transparent w-full"
          />
        </div>
        
        <div className="relative">
          <Filter className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="pl-10 pr-8 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-orange-500 focus:border-transparent appearance-none cursor-pointer min-w-48"
          >
            {statusOptions.map(option => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Requests List */}
      {filteredRequests.length === 0 ? (
        <div className="text-center py-12">
          <Crown className="h-16 w-16 mx-auto mb-4 text-gray-400" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
            Nessuna richiesta trovata
          </h3>
          <p className="text-gray-500 dark:text-gray-400">
            {searchTerm || statusFilter !== 'all' 
              ? 'Prova a modificare i filtri di ricerca'
              : 'Non ci sono ancora richieste premium'
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
                  Prezzo
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
              {filteredRequests.map(request => (
                <tr key={request.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <User className="h-8 w-8 text-gray-400 mr-3" />
                      <div>
                        <div className="text-sm font-medium text-gray-900 dark:text-white">
                          {request.userEmail}
                        </div>
                        <div className="text-sm text-gray-500 dark:text-gray-400">
                          ID: {request.userId?.slice(0, 8)}...
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900 dark:text-white">
                      {request.planName}
                    </div>
                    <div className="text-sm text-gray-500 dark:text-gray-400">
                      {request.billingPeriod === 'monthly' ? 'Mensile' : 'Annuale'}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <Euro className="h-4 w-4 text-gray-400 mr-1" />
                      <span className="text-sm font-medium text-gray-900 dark:text-white">
                        {request.price}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex items-center space-x-1 px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(request.status)}`}>
                      {getStatusIcon(request.status)}
                      <span>{statusOptions.find(s => s.value === request.status)?.label || request.status}</span>
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                    <div className="flex items-center">
                      <Calendar className="h-4 w-4 mr-1" />
                      {request.createdAt ? request.createdAt.toLocaleDateString('it-IT') : 'N/A'}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <button
                      onClick={() => {
                        setSelectedRequest(request);
                        setShowModal(true);
                      }}
                      className="text-orange-600 hover:text-orange-900 dark:text-orange-400 dark:hover:text-orange-300"
                    >
                      <MoreHorizontal className="h-5 w-5" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Request Detail Modal */}
      {showModal && selectedRequest && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-11/12 max-w-2xl shadow-lg rounded-md bg-white dark:bg-gray-800">
            <div className="mt-3">
              {/* Modal Header */}
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                  Dettagli Richiesta Premium
                </h3>
                <button
                  onClick={() => setShowModal(false)}
                  className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>

              {/* Request Details */}
              <div className="space-y-4 mb-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Email Utente
                    </label>
                    <div className="flex items-center">
                      <Mail className="h-4 w-4 text-gray-400 mr-2" />
                      <span className="text-gray-900 dark:text-white">{selectedRequest.userEmail}</span>
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      ID Utente
                    </label>
                    <div className="flex items-center">
                      <User className="h-4 w-4 text-gray-400 mr-2" />
                      <span className="text-gray-900 dark:text-white font-mono text-sm">
                        {selectedRequest.userId}
                      </span>
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Piano Richiesto
                    </label>
                    <div className="flex items-center">
                      <Crown className="h-4 w-4 text-gray-400 mr-2" />
                      <span className="text-gray-900 dark:text-white">{selectedRequest.planName}</span>
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Periodo di Fatturazione
                    </label>
                    <span className="text-gray-900 dark:text-white">
                      {selectedRequest.billingPeriod === 'monthly' ? 'Mensile' : 'Annuale'}
                    </span>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Prezzo
                    </label>
                    <div className="flex items-center">
                      <Euro className="h-4 w-4 text-gray-400 mr-2" />
                      <span className="text-gray-900 dark:text-white">€{selectedRequest.price}</span>
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Data Richiesta
                    </label>
                    <div className="flex items-center">
                      <Calendar className="h-4 w-4 text-gray-400 mr-2" />
                      <span className="text-gray-900 dark:text-white">
                        {selectedRequest.createdAt ? selectedRequest.createdAt.toLocaleString('it-IT') : 'N/A'}
                      </span>
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Stato Attuale
                  </label>
                  <span className={`inline-flex items-center space-x-1 px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(selectedRequest.status)}`}>
                    {getStatusIcon(selectedRequest.status)}
                    <span>{statusOptions.find(s => s.value === selectedRequest.status)?.label || selectedRequest.status}</span>
                  </span>
                </div>

                {selectedRequest.adminNotes && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Note Admin
                    </label>
                    <p className="text-gray-900 dark:text-white bg-gray-50 dark:bg-gray-700 p-3 rounded-lg">
                      {selectedRequest.adminNotes}
                    </p>
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex justify-between items-center pt-4 border-t border-gray-200 dark:border-gray-700">
                <button
                  onClick={() => handleDeleteRequest(selectedRequest.id)}
                  disabled={actionLoading}
                  className="flex items-center space-x-2 px-4 py-2 text-red-600 hover:text-red-800 disabled:opacity-50"
                >
                  <Trash2 className="h-4 w-4" />
                  <span>Elimina</span>
                </button>

                <div className="flex space-x-3">
                  {selectedRequest.status === 'pending' && (
                    <>
                      <button
                        onClick={() => handleUpdateStatus(selectedRequest.id, 'rejected', 'Richiesta rifiutata dall\'admin')}
                        disabled={actionLoading}
                        className="flex items-center space-x-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50"
                      >
                        <XCircle className="h-4 w-4" />
                        <span>Rifiuta</span>
                      </button>
                      <button
                        onClick={() => handleUpdateStatus(selectedRequest.id, 'approved', 'Richiesta approvata e abbonamento attivato')}
                        disabled={actionLoading}
                        className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
                      >
                        <CheckCircle className="h-4 w-4" />
                        <span>Approva</span>
                      </button>
                    </>
                  )}
                  
                  {selectedRequest.status === 'approved' && (
                    <button
                      onClick={() => handleUpdateStatus(selectedRequest.id, 'completed', 'Pagamento completato')}
                      disabled={actionLoading}
                      className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                    >
                      <Check className="h-4 w-4" />
                      <span>Completa</span>
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PremiumRequestsManager;