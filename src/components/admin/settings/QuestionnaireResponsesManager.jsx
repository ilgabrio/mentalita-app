import React, { useState, useEffect } from 'react';
import { 
  collection, 
  getDocs, 
  query, 
  orderBy,
  doc,
  updateDoc,
  deleteDoc
} from 'firebase/firestore';
import { db } from '../../../config/firebase';
import { 
  FileText, 
  Eye, 
  Trash2, 
  Download,
  Search,
  Filter,
  Calendar,
  User,
  Crown,
  Star,
  Target,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle
} from 'lucide-react';

const QuestionnaireResponsesManager = () => {
  const [responses, setResponses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all'); // all, initial, premium
  const [filterStatus, setFilterStatus] = useState('all'); // all, pending, approved, rejected
  const [selectedResponse, setSelectedResponse] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);

  useEffect(() => {
    fetchResponses();
  }, []);

  const fetchResponses = async () => {
    try {
      setLoading(true);
      
      // Fetch initial questionnaires
      const initialQuery = query(collection(db, 'questionnaires'), orderBy('completedAt', 'desc'));
      const initialSnapshot = await getDocs(initialQuery);
      const initialResponses = [];
      
      initialSnapshot.forEach((doc) => {
        initialResponses.push({
          id: doc.id,
          ...doc.data()
        });
      });

      // Fetch premium requests
      const premiumQuery = query(collection(db, 'premiumRequests'), orderBy('completedAt', 'desc'));
      const premiumSnapshot = await getDocs(premiumQuery);
      const premiumResponses = [];
      
      premiumSnapshot.forEach((doc) => {
        premiumResponses.push({
          id: doc.id,
          ...doc.data()
        });
      });

      setResponses([...initialResponses, ...premiumResponses]);
    } catch (error) {
      console.error('Error fetching responses:', error);
    } finally {
      setLoading(false);
    }
  };

  const updatePremiumStatus = async (responseId, newStatus) => {
    try {
      await updateDoc(doc(db, 'premiumRequests', responseId), {
        status: newStatus,
        updatedAt: new Date()
      });
      
      // Also update user profile if approved
      if (newStatus === 'approved') {
        const response = responses.find(r => r.id === responseId);
        if (response && response.userId) {
          await updateDoc(doc(db, 'users', response.userId), {
            isPremium: true,
            premiumApprovedAt: new Date(),
            premiumRequestStatus: 'approved'
          });
        }
      }
      
      fetchResponses();
      alert('Status aggiornato con successo!');
    } catch (error) {
      console.error('Error updating status:', error);
      alert('Errore nell\'aggiornamento');
    }
  };

  const deleteResponse = async (responseId, type) => {
    if (!confirm('Sei sicuro di voler eliminare questa risposta?')) return;
    
    try {
      const collection_name = type === 'premium' ? 'premiumRequests' : 'questionnaires';
      await deleteDoc(doc(db, collection_name, responseId));
      fetchResponses();
      alert('Risposta eliminata');
    } catch (error) {
      console.error('Error deleting response:', error);
      alert('Errore nell\'eliminazione');
    }
  };

  const exportToCSV = () => {
    const csvData = responses.map(response => ({
      Tipo: response.type === 'premium' ? 'Premium' : 'Iniziale',
      Nome: response.userName || 'N/A',
      Email: response.userEmail || 'N/A',
      Data: new Date(response.completedAt?.toDate ? response.completedAt.toDate() : response.completedAt).toLocaleDateString(),
      Status: response.status || 'N/A',
      Sport: response.answers?.sport || response.sport || 'N/A',
      Livello: response.answers?.level || response.level || 'N/A'
    }));

    const csvContent = [
      Object.keys(csvData[0]).join(','),
      ...csvData.map(row => Object.values(row).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.style.display = 'none';
    a.href = url;
    a.download = 'questionari_risposte.csv';
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const filteredResponses = responses.filter(response => {
    const matchesSearch = !searchTerm || 
      (response.userName?.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (response.userEmail?.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesType = filterType === 'all' || response.type === filterType;
    
    const matchesStatus = filterStatus === 'all' || 
      (filterStatus === 'pending' && (!response.status || response.status === 'pending')) ||
      response.status === filterStatus;
    
    return matchesSearch && matchesType && matchesStatus;
  });

  const formatAnswers = (answers, type) => {
    if (!answers) return {};
    
    if (type === 'premium') {
      return {
        'Livello impegno': answers.commitment_level,
        'Investimento': answers.investment_willingness,
        'Urgenza': answers.urgency_level,
        'Tempo disponibile': answers.time_investment,
        'Tipo coaching': answers.coaching_preference,
        'Ostacolo principale': answers.biggest_barrier,
        'Motivazione': answers.motivation_story
      };
    } else {
      return {
        'Sport': answers.sport,
        'Esperienza': answers.experience,
        'Livello': answers.level,
        'Conoscenza coaching': answers.coaching_knowledge,
        'Obiettivi': Array.isArray(answers.goals) ? answers.goals.join(', ') : answers.goals,
        'Sfida principale': answers.biggest_challenge,
        'Aspettative': answers.expectations
      };
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'approved': return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'rejected': return <XCircle className="h-5 w-5 text-red-500" />;
      case 'reviewing': return <AlertCircle className="h-5 w-5 text-yellow-500" />;
      default: return <Clock className="h-5 w-5 text-gray-500" />;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'approved': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300';
      case 'rejected': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300';
      case 'reviewing': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
    }
  };

  if (loading) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/3 mb-6"></div>
          <div className="space-y-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-24 bg-gray-200 dark:bg-gray-700 rounded"></div>
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
            <FileText className="h-6 w-6 text-indigo-600" />
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
              Risposte Questionari
            </h2>
          </div>
          
          <button
            onClick={exportToCSV}
            className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
          >
            <Download className="h-4 w-4" />
            <span>Esporta CSV</span>
          </button>
        </div>

        {/* Filters */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Cerca per nome o email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 dark:bg-gray-700 dark:text-white"
            />
          </div>

          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 dark:bg-gray-700 dark:text-white"
          >
            <option value="all">Tutti i tipi</option>
            <option value="initial">Questionari iniziali</option>
            <option value="premium">Richieste premium</option>
          </select>

          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 dark:bg-gray-700 dark:text-white"
          >
            <option value="all">Tutti gli stati</option>
            <option value="pending">In attesa</option>
            <option value="reviewing">In revisione</option>
            <option value="approved">Approvati</option>
            <option value="rejected">Rifiutati</option>
          </select>

          <div className="text-sm text-gray-500 dark:text-gray-400 flex items-center">
            <Filter className="h-4 w-4 mr-1" />
            {filteredResponses.length} risultati
          </div>
        </div>
      </div>

      {/* Responses List */}
      <div className="p-6">
        {filteredResponses.length === 0 ? (
          <div className="text-center py-12">
            <FileText className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500 dark:text-gray-400">
              Nessuna risposta trovata
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredResponses.map((response) => (
              <div
                key={response.id}
                className="border border-gray-200 dark:border-gray-600 rounded-lg p-4 hover:shadow-md transition-shadow"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="flex items-center gap-2">
                        {response.type === 'premium' ? (
                          <Crown className="h-5 w-5 text-amber-500" />
                        ) : (
                          <User className="h-5 w-5 text-blue-500" />
                        )}
                        <span className="font-medium text-gray-900 dark:text-white">
                          {response.userName || 'Atleta'}
                        </span>
                        <span className="text-sm text-gray-500 dark:text-gray-400">
                          ({response.userEmail})
                        </span>
                      </div>
                      
                      <span className={`px-2 py-1 text-xs rounded-full ${
                        response.type === 'premium'
                          ? 'bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-300'
                          : 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300'
                      }`}>
                        {response.type === 'premium' ? 'Premium' : 'Iniziale'}
                      </span>

                      {response.status && (
                        <span className={`px-2 py-1 text-xs rounded-full ${getStatusColor(response.status)}`}>
                          {response.status}
                        </span>
                      )}
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-gray-600 dark:text-gray-400 mb-3">
                      <div className="flex items-center gap-1">
                        <Calendar className="h-4 w-4" />
                        <span>
                          {new Date(response.completedAt?.toDate ? response.completedAt.toDate() : response.completedAt).toLocaleDateString()}
                        </span>
                      </div>
                      
                      {response.answers?.sport && (
                        <div className="flex items-center gap-1">
                          <Target className="h-4 w-4" />
                          <span>{response.answers.sport}</span>
                        </div>
                      )}
                      
                      {response.priorityScore && (
                        <div className="flex items-center gap-1">
                          <Star className="h-4 w-4" />
                          <span>Priorità: {response.priorityScore}</span>
                        </div>
                      )}
                    </div>

                    {/* Quick Preview */}
                    <div className="text-sm text-gray-500 dark:text-gray-400">
                      {response.type === 'premium' ? (
                        <span>
                          Livello: {response.answers?.commitment_level} | 
                          Urgenza: {response.answers?.urgency_level}
                        </span>
                      ) : (
                        <span>
                          Sport: {response.answers?.sport} | 
                          Livello: {response.answers?.level}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center space-x-2 ml-4">
                    {/* Status Actions for Premium */}
                    {response.type === 'premium' && response.status !== 'approved' && (
                      <>
                        <button
                          onClick={() => updatePremiumStatus(response.id, 'approved')}
                          className="p-2 text-green-600 hover:bg-green-100 dark:hover:bg-green-900/30 rounded-lg"
                          title="Approva"
                        >
                          <CheckCircle className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => updatePremiumStatus(response.id, 'rejected')}
                          className="p-2 text-red-600 hover:bg-red-100 dark:hover:bg-red-900/30 rounded-lg"
                          title="Rifiuta"
                        >
                          <XCircle className="h-4 w-4" />
                        </button>
                      </>
                    )}

                    {/* View Details */}
                    <button
                      onClick={() => {
                        setSelectedResponse(response);
                        setShowDetailModal(true);
                      }}
                      className="p-2 text-indigo-600 hover:bg-indigo-100 dark:hover:bg-indigo-900/30 rounded-lg"
                      title="Visualizza dettagli"
                    >
                      <Eye className="h-4 w-4" />
                    </button>

                    {/* Delete */}
                    <button
                      onClick={() => deleteResponse(response.id, response.type)}
                      className="p-2 text-red-600 hover:bg-red-100 dark:hover:bg-red-900/30 rounded-lg"
                      title="Elimina"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Detail Modal */}
      {showDetailModal && selectedResponse && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                  Dettagli Risposta - {selectedResponse.userName || 'Atleta'}
                </h3>
                <button
                  onClick={() => setShowDetailModal(false)}
                  className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                >
                  ✕
                </button>
              </div>
            </div>

            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <div>
                  <h4 className="font-medium text-gray-900 dark:text-white mb-2">Informazioni Generali</h4>
                  <div className="space-y-2 text-sm">
                    <div><strong>Nome:</strong> {selectedResponse.userName || 'N/A'}</div>
                    <div><strong>Email:</strong> {selectedResponse.userEmail || 'N/A'}</div>
                    <div><strong>Tipo:</strong> {selectedResponse.type === 'premium' ? 'Richiesta Premium' : 'Questionario Iniziale'}</div>
                    <div><strong>Data:</strong> {new Date(selectedResponse.completedAt?.toDate ? selectedResponse.completedAt.toDate() : selectedResponse.completedAt).toLocaleString()}</div>
                    {selectedResponse.status && (
                      <div className="flex items-center gap-2">
                        <strong>Status:</strong> 
                        {getStatusIcon(selectedResponse.status)}
                        <span className={`px-2 py-1 text-xs rounded-full ${getStatusColor(selectedResponse.status)}`}>
                          {selectedResponse.status}
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                {selectedResponse.priorityScore && (
                  <div>
                    <h4 className="font-medium text-gray-900 dark:text-white mb-2">Punteggio Priorità</h4>
                    <div className="text-2xl font-bold text-amber-600">
                      {selectedResponse.priorityScore}/9
                    </div>
                    <div className="text-sm text-gray-500">
                      Basato su impegno, urgenza e investimento
                    </div>
                  </div>
                )}
              </div>

              <div>
                <h4 className="font-medium text-gray-900 dark:text-white mb-4">Risposte Dettagliate</h4>
                <div className="space-y-4">
                  {Object.entries(formatAnswers(selectedResponse.answers, selectedResponse.type)).map(([question, answer]) => (
                    <div key={question} className="border-l-4 border-indigo-200 pl-4">
                      <div className="font-medium text-gray-900 dark:text-white text-sm">
                        {question}
                      </div>
                      <div className="text-gray-600 dark:text-gray-400 mt-1">
                        {typeof answer === 'string' && answer.length > 100 ? (
                          <div className="whitespace-pre-wrap">{answer}</div>
                        ) : (
                          answer || 'N/A'
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="p-6 border-t border-gray-200 dark:border-gray-700 flex justify-end">
              <button
                onClick={() => setShowDetailModal(false)}
                className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600"
              >
                Chiudi
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default QuestionnaireResponsesManager;