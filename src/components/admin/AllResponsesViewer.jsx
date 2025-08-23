import React, { useState, useEffect } from 'react';
import { 
  collection, 
  getDocs, 
  query, 
  orderBy 
} from 'firebase/firestore';
import { db } from '../../config/firebase';
import { 
  FileText, 
  User, 
  Calendar,
  ChevronDown,
  ChevronUp,
  Download,
  Search
} from 'lucide-react';
import * as XLSX from 'xlsx';

const AllResponsesViewer = () => {
  const [exerciseResponses, setExerciseResponses] = useState([]);
  const [questionnaires, setQuestionnaires] = useState([]);
  const [premiumRequests, setPremiumRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedItems, setExpandedItems] = useState({});
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState('exercises');

  useEffect(() => {
    fetchAllData();
  }, []);

  const fetchAllData = async () => {
    try {
      setLoading(true);
      
      // Fetch ALL exercise responses - NO LIMITS
      console.log('📚 Fetching ALL exercise responses...');
      const exercisesQuery = query(
        collection(db, 'exerciseResponses'),
        orderBy('completedAt', 'desc')
      );
      const exercisesSnapshot = await getDocs(exercisesQuery);
      const exercisesData = exercisesSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        type: 'exercise'
      }));
      console.log(`✅ Found ${exercisesData.length} exercise responses`);
      setExerciseResponses(exercisesData);

      // Fetch ALL questionnaires - NO LIMITS
      console.log('📋 Fetching ALL questionnaires...');
      const questionnairesQuery = query(
        collection(db, 'questionnaires'),
        orderBy('completedAt', 'desc')
      );
      const questionnairesSnapshot = await getDocs(questionnairesQuery);
      const questionnairesData = questionnairesSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        type: 'questionnaire'
      }));
      console.log(`✅ Found ${questionnairesData.length} questionnaires`);
      setQuestionnaires(questionnairesData);

      // Fetch ALL premium requests - NO LIMITS
      console.log('💎 Fetching ALL premium requests...');
      const premiumQuery = query(
        collection(db, 'premiumRequests'),
        orderBy('createdAt', 'desc')
      );
      const premiumSnapshot = await getDocs(premiumQuery);
      const premiumData = premiumSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        type: 'premium'
      }));
      console.log(`✅ Found ${premiumData.length} premium requests`);
      setPremiumRequests(premiumData);

    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleExpanded = (id) => {
    setExpandedItems(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  const exportToExcel = () => {
    const data = activeTab === 'exercises' ? exerciseResponses :
                 activeTab === 'questionnaires' ? questionnaires :
                 premiumRequests;

    // Flatten data for Excel
    const flatData = data.map(item => {
      const flat = {
        ID: item.id,
        'User ID': item.userId,
        'User Email': item.userEmail,
        'Completato': item.completedAt?.toDate?.()?.toLocaleString('it-IT') || item.completedAt,
        'Tipo': item.type
      };

      // Add all responses/answers
      if (item.responses) {
        Object.entries(item.responses).forEach(([key, value]) => {
          flat[`Risposta_${key}`] = typeof value === 'object' ? JSON.stringify(value) : value;
        });
      }
      if (item.answers) {
        Object.entries(item.answers).forEach(([key, value]) => {
          flat[`Answer_${key}`] = typeof value === 'object' ? JSON.stringify(value) : value;
        });
      }

      return flat;
    });

    const ws = XLSX.utils.json_to_sheet(flatData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, activeTab);
    XLSX.writeFile(wb, `all_${activeTab}_${Date.now()}.xlsx`);
  };

  const renderResponses = (item) => {
    const responses = item.responses || item.answers || {};
    const responseEntries = Object.entries(responses);
    
    if (responseEntries.length === 0) {
      return <p className="text-sm text-gray-500">Nessuna risposta</p>;
    }

    return (
      <div className="space-y-2">
        <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
          Totale risposte: {responseEntries.length}
        </p>
        {responseEntries.map(([key, value], index) => (
          <div key={index} className="bg-gray-50 dark:bg-gray-700 p-3 rounded-lg">
            <div className="font-medium text-sm text-gray-700 dark:text-gray-300 mb-1">
              {key}:
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400 break-words">
              {typeof value === 'object' ? (
                <pre className="whitespace-pre-wrap text-xs">
                  {JSON.stringify(value, null, 2)}
                </pre>
              ) : (
                String(value)
              )}
            </div>
          </div>
        ))}
      </div>
    );
  };

  const filterData = (data) => {
    if (!searchTerm) return data;
    return data.filter(item => 
      item.userEmail?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.userId?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      JSON.stringify(item).toLowerCase().includes(searchTerm.toLowerCase())
    );
  };

  const getCurrentData = () => {
    const data = activeTab === 'exercises' ? exerciseResponses :
                 activeTab === 'questionnaires' ? questionnaires :
                 premiumRequests;
    return filterData(data);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  const currentData = getCurrentData();

  return (
    <div className="p-6">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg">
        {/* Header */}
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
            📊 Visualizzatore Completo Risposte
          </h2>
          
          {/* Stats */}
          <div className="grid grid-cols-3 gap-4 mb-4">
            <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg">
              <div className="text-2xl font-bold text-blue-600">
                {exerciseResponses.length}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">
                Risposte Esercizi
              </div>
            </div>
            <div className="bg-green-50 dark:bg-green-900/20 p-3 rounded-lg">
              <div className="text-2xl font-bold text-green-600">
                {questionnaires.length}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">
                Questionari
              </div>
            </div>
            <div className="bg-purple-50 dark:bg-purple-900/20 p-3 rounded-lg">
              <div className="text-2xl font-bold text-purple-600">
                {premiumRequests.length}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">
                Richieste Premium
              </div>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex space-x-4 mb-4">
            <button
              onClick={() => setActiveTab('exercises')}
              className={`px-4 py-2 rounded-lg font-medium ${
                activeTab === 'exercises'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
              }`}
            >
              Esercizi ({exerciseResponses.length})
            </button>
            <button
              onClick={() => setActiveTab('questionnaires')}
              className={`px-4 py-2 rounded-lg font-medium ${
                activeTab === 'questionnaires'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
              }`}
            >
              Questionari ({questionnaires.length})
            </button>
            <button
              onClick={() => setActiveTab('premium')}
              className={`px-4 py-2 rounded-lg font-medium ${
                activeTab === 'premium'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
              }`}
            >
              Premium ({premiumRequests.length})
            </button>
          </div>

          {/* Search and Export */}
          <div className="flex space-x-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
              <input
                type="text"
                placeholder="Cerca..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
              />
            </div>
            <button
              onClick={exportToExcel}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center space-x-2"
            >
              <Download className="h-5 w-5" />
              <span>Esporta Excel</span>
            </button>
          </div>
        </div>

        {/* Data List */}
        <div className="p-6">
          <div className="space-y-4">
            {currentData.length === 0 ? (
              <p className="text-center text-gray-500">Nessun dato trovato</p>
            ) : (
              <>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Mostrando {currentData.length} elementi
                </p>
                {currentData.map((item) => (
                  <div
                    key={item.id}
                    className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden"
                  >
                    {/* Item Header */}
                    <div
                      className="p-4 bg-gray-50 dark:bg-gray-700 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600"
                      onClick={() => toggleExpanded(item.id)}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4">
                          <FileText className="h-5 w-5 text-gray-400" />
                          <div>
                            <div className="font-medium text-gray-900 dark:text-white">
                              {item.exerciseTitle || item.title || 'Senza titolo'}
                            </div>
                            <div className="text-sm text-gray-500 dark:text-gray-400">
                              <User className="inline h-4 w-4 mr-1" />
                              {item.userEmail || item.userId}
                              <Calendar className="inline h-4 w-4 ml-3 mr-1" />
                              {item.completedAt?.toDate?.()?.toLocaleDateString('it-IT') || 
                               item.createdAt?.toDate?.()?.toLocaleDateString('it-IT') || 
                               'Data non disponibile'}
                            </div>
                          </div>
                        </div>
                        {expandedItems[item.id] ? (
                          <ChevronUp className="h-5 w-5 text-gray-400" />
                        ) : (
                          <ChevronDown className="h-5 w-5 text-gray-400" />
                        )}
                      </div>
                    </div>

                    {/* Item Details */}
                    {expandedItems[item.id] && (
                      <div className="p-4 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700">
                        {renderResponses(item)}
                        
                        {/* Additional metadata */}
                        <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                          <div className="text-xs text-gray-500 dark:text-gray-400">
                            ID: {item.id}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AllResponsesViewer;