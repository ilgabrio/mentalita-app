import React, { useState, useEffect } from 'react';
import { 
  collection, 
  query, 
  getDocs, 
  orderBy,
  where
} from 'firebase/firestore';
import { db } from '../../../config/firebase';
import { 
  ClipboardList, 
  Search, 
  Filter, 
  Eye,
  X,
  Calendar,
  User,
  FileText,
  Download,
  Star
} from 'lucide-react';

const CustomQuestionnaireResponsesManager = () => {
  const [responses, setResponses] = useState([]);
  const [users, setUsers] = useState({});
  const [templates, setTemplates] = useState({});
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [templateFilter, setTemplateFilter] = useState('all');
  const [showModal, setShowModal] = useState(false);
  const [selectedResponse, setSelectedResponse] = useState(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);

      // Fetch custom questionnaire responses (exclude initial and premium)
      const responsesQuery = query(
        collection(db, 'questionnaires'),
        where('type', 'not-in', ['initial', 'premium']),
        orderBy('completedAt', 'desc')
      );
      const responsesSnapshot = await getDocs(responsesQuery);
      const responsesData = responsesSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      
      // Fetch users data
      const usersQuery = query(collection(db, 'users'));
      const usersSnapshot = await getDocs(usersQuery);
      const usersData = {};
      usersSnapshot.docs.forEach(doc => {
        usersData[doc.id] = doc.data();
      });

      // Fetch templates data
      const templatesQuery = query(collection(db, 'questionnaireTemplates'));
      const templatesSnapshot = await getDocs(templatesQuery);
      const templatesData = {};
      templatesSnapshot.docs.forEach(doc => {
        templatesData[doc.id] = doc.data();
      });

      setResponses(responsesData);
      setUsers(usersData);
      setTemplates(templatesData);
    } catch (error) {
      console.error('Error fetching responses:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleViewResponse = (response) => {
    setSelectedResponse(response);
    setShowModal(true);
  };

  const exportResponseToPDF = (response) => {
    // This could be implemented similar to the ProfilePage PDF export
    alert('Export PDF functionality coming soon');
  };

  const filteredResponses = responses.filter(response => {
    const user = users[response.userId];
    const template = templates[response.templateId];
    
    const matchesSearch = !searchTerm || 
      user?.displayName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user?.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      response.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      template?.title?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesTemplate = templateFilter === 'all' || response.templateId === templateFilter;
    
    return matchesSearch && matchesTemplate;
  });

  const uniqueTemplates = [...new Set(responses.map(r => r.templateId).filter(Boolean))];

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
          <FileText className="h-6 w-6 text-indigo-600" />
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Risposte Questionari Personalizzati
          </h1>
        </div>
        <p className="text-gray-600 dark:text-gray-400">
          Visualizza e analizza le risposte ai questionari personalizzati
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-indigo-50 dark:bg-indigo-900/20 p-4 rounded-lg">
          <div className="flex items-center">
            <ClipboardList className="h-6 w-6 text-indigo-600 dark:text-indigo-400" />
            <div className="ml-3">
              <p className="text-sm font-medium text-indigo-900 dark:text-indigo-100">Risposte Totali</p>
              <p className="text-lg font-semibold text-indigo-600 dark:text-indigo-400">
                {responses.length}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg">
          <div className="flex items-center">
            <User className="h-6 w-6 text-green-600 dark:text-green-400" />
            <div className="ml-3">
              <p className="text-sm font-medium text-green-900 dark:text-green-100">Atleti Unici</p>
              <p className="text-lg font-semibold text-green-600 dark:text-green-400">
                {new Set(responses.map(r => r.userId)).size}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-purple-50 dark:bg-purple-900/20 p-4 rounded-lg">
          <div className="flex items-center">
            <Star className="h-6 w-6 text-purple-600 dark:text-purple-400" />
            <div className="ml-3">
              <p className="text-sm font-medium text-purple-900 dark:text-purple-100">Template Attivi</p>
              <p className="text-lg font-semibold text-purple-600 dark:text-purple-400">
                {uniqueTemplates.length}
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
              placeholder="Cerca per atleta o questionario..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2 w-full border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            />
          </div>
        </div>
        <div className="sm:w-64">
          <select
            value={templateFilter}
            onChange={(e) => setTemplateFilter(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
          >
            <option value="all">Tutti i template</option>
            {uniqueTemplates.map(templateId => {
              const template = templates[templateId];
              return (
                <option key={templateId} value={templateId}>
                  {template?.title || 'Template sconosciuto'}
                </option>
              );
            })}
          </select>
        </div>
      </div>

      {/* Responses List */}
      {filteredResponses.length === 0 ? (
        <div className="text-center py-12">
          <FileText className="h-12 w-12 mx-auto mb-4 text-gray-400" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
            Nessuna risposta trovata
          </h3>
          <p className="text-gray-500 dark:text-gray-400">
            {searchTerm || templateFilter !== 'all' 
              ? 'Prova a modificare i filtri di ricerca' 
              : 'Non ci sono ancora risposte ai questionari personalizzati'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredResponses.map((response) => {
            const user = users[response.userId];
            const template = templates[response.templateId];
            
            return (
              <div key={response.id} className="bg-white dark:bg-gray-800 rounded-lg shadow hover:shadow-md transition-shadow">
                <div className="p-6">
                  {/* Header */}
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center space-x-2">
                      <div className="w-8 h-8 bg-indigo-100 dark:bg-indigo-900 rounded-full flex items-center justify-center">
                        <ClipboardList className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
                      </div>
                      <div>
                        <h3 className="font-medium text-gray-900 dark:text-white text-sm">
                          {response.title || template?.title || 'Questionario Personalizzato'}
                        </h3>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          {template?.category || 'Personalizzato'}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* User Info */}
                  <div className="mb-4 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                    <div className="flex items-center space-x-2">
                      <User className="h-4 w-4 text-gray-600 dark:text-gray-400" />
                      <div>
                        <div className="text-sm font-medium text-gray-900 dark:text-white">
                          {user?.displayName || user?.name || 'Nome non disponibile'}
                        </div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">
                          {user?.email || 'Email non disponibile'}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Stats */}
                  <div className="grid grid-cols-2 gap-2 mb-4 text-sm text-gray-500 dark:text-gray-400">
                    <div className="flex items-center">
                      <FileText className="h-4 w-4 mr-1" />
                      <span>{Object.keys(response.responses || {}).length} risposte</span>
                    </div>
                    <div className="flex items-center">
                      <Calendar className="h-4 w-4 mr-1" />
                      <span>
                        {response.completedAt?.toDate ? 
                          response.completedAt.toDate().toLocaleDateString('it-IT') :
                          new Date(response.completedAt).toLocaleDateString('it-IT')
                        }
                      </span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex space-x-2">
                    <button
                      onClick={() => handleViewResponse(response)}
                      className="flex-1 flex items-center justify-center space-x-1 px-3 py-2 text-indigo-600 hover:text-indigo-800 hover:bg-indigo-100 rounded transition-colors"
                    >
                      <Eye className="h-4 w-4" />
                      <span className="text-sm">Visualizza</span>
                    </button>
                    <button
                      onClick={() => exportResponseToPDF(response)}
                      className="flex items-center justify-center px-3 py-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded transition-colors"
                      title="Esporta PDF"
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

      {/* Modal for viewing response */}
      {showModal && selectedResponse && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-11/12 max-w-4xl shadow-lg rounded-md bg-white dark:bg-gray-800">
            <div className="mt-3">
              {/* Modal Header */}
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                    {selectedResponse.title}
                  </h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                    Risposta di {users[selectedResponse.userId]?.displayName || users[selectedResponse.userId]?.name || 'Atleta'}
                  </p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Completato il {selectedResponse.completedAt?.toDate ? 
                      selectedResponse.completedAt.toDate().toLocaleString('it-IT') :
                      new Date(selectedResponse.completedAt).toLocaleString('it-IT')
                    }
                  </p>
                </div>
                <button
                  onClick={() => setShowModal(false)}
                  className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>

              {/* Content */}
              <div className="max-h-96 overflow-y-auto">
                {selectedResponse.responses && Object.keys(selectedResponse.responses).length > 0 ? (
                  <div className="space-y-4">
                    {Object.entries(selectedResponse.responses).map(([key, value], index) => {
                      if (value === undefined || value === '' || value === null) return null;
                      
                      const displayValue = Array.isArray(value) ? value.join(', ') : 
                                          typeof value === 'object' ? JSON.stringify(value) : 
                                          String(value);

                      return (
                        <div key={key} className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                          <h5 className="font-medium text-gray-900 dark:text-white mb-2">
                            {key}
                          </h5>
                          <div className="pl-4 border-l-2 border-indigo-500">
                            <p className="text-gray-800 dark:text-gray-200">
                              {displayValue}
                            </p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <FileText className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                    <p className="text-gray-500 dark:text-gray-400">
                      Nessuna risposta trovata per questo questionario
                    </p>
                  </div>
                )}
              </div>

              {/* Footer */}
              <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200 dark:border-gray-700 mt-6">
                <button
                  onClick={() => exportResponseToPDF(selectedResponse)}
                  className="flex items-center space-x-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
                >
                  <Download className="h-4 w-4" />
                  <span>Esporta PDF</span>
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

export default CustomQuestionnaireResponsesManager;