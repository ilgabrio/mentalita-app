import React, { useState } from 'react';
import { 
  collection, 
  getDocs, 
  query,
  limit
} from 'firebase/firestore';
import { db } from '../../config/firebase';
import { 
  Database, 
  Play, 
  CheckCircle,
  XCircle,
  AlertTriangle,
  Loader,
  RefreshCw,
  User
} from 'lucide-react';

const DatabaseTestPage = () => {
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState({});

  // Definizione delle raccolte da testare
  const collections = {
    // Raccolte PRINCIPALI (dovrebbero avere dati)
    main: [
      { name: 'videos', description: 'Video YouTube (raccolta principale)', icon: '🎥' },
      { name: 'exercises', description: 'Esercizi pubblicati', icon: '🏋️' },
      { name: 'articles', description: 'Articoli', icon: '📄' },
      { name: 'questionnaires', description: 'Risposte questionari (tutte)', icon: '📋' },
      { name: 'questionnaireTemplates', description: 'Template questionari admin', icon: '📝' },
      { name: 'premiumRequests', description: 'Richieste Premium', icon: '👑' },
      { name: 'users', description: 'Utenti registrati', icon: '👤' },
      { name: 'userBadges', description: 'Badge utenti', icon: '🏅' },
      { name: 'userStats', description: 'Statistiche utenti', icon: '📊' },
    ],
    // Raccolte LEGACY/INUTILI (dovrebbero essere vuote o da migrare)
    legacy: [
      { name: 'appVideos', description: 'Video vecchi (da migrare)', icon: '❌' },
      { name: 'onboardingPages', description: 'Pagine onboarding (inutile)', icon: '❌' },
      { name: 'onboardingSettings', description: 'Impostazioni onboarding (inutile)', icon: '❌' },
      { name: 'onboardingSteps', description: 'Step onboarding (inutile)', icon: '❌' },
    ],
    // Raccolte da VERIFICARE
    verify: [
      { name: 'exerciseResponses', description: 'Risposte esercizi completati', icon: '💭' },
      { name: 'exerciseSessions', description: 'Sessioni esercizi', icon: '⏱️' },
      { name: 'motivationalTips', description: 'Suggerimenti motivazionali', icon: '💡' },
      { name: 'questionnaireAssignments', description: 'Assegnazioni questionari', icon: '📤' },
    ]
  };

  const testCollection = async (collectionName) => {
    try {
      const collectionRef = collection(db, collectionName);
      const snapshot = await getDocs(query(collectionRef, limit(5)));
      
      const docs = snapshot.docs.map(doc => ({
        id: doc.id,
        data: doc.data()
      }));

      return {
        status: 'success',
        count: snapshot.size,
        exists: snapshot.size > 0,
        samples: docs,
        error: null
      };
    } catch (error) {
      return {
        status: 'error',
        count: 0,
        exists: false,
        samples: [],
        error: error.message
      };
    }
  };

  const runAllTests = async () => {
    setLoading(true);
    setResults({});

    const allCollections = [
      ...collections.main,
      ...collections.legacy,
      ...collections.verify
    ];

    for (const col of allCollections) {
      console.log(`🔍 Testing collection: ${col.name}`);
      const result = await testCollection(col.name);
      
      setResults(prev => ({
        ...prev,
        [col.name]: {
          ...result,
          description: col.description,
          icon: col.icon
        }
      }));
    }

    setLoading(false);
  };

  const getStatusIcon = (result) => {
    if (!result) return <Loader className="h-4 w-4 animate-spin text-gray-400" />;
    if (result.status === 'error') return <XCircle className="h-4 w-4 text-red-500" />;
    if (result.count === 0) return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
    return <CheckCircle className="h-4 w-4 text-green-500" />;
  };

  const getStatusColor = (result) => {
    if (!result) return 'border-gray-200';
    if (result.status === 'error') return 'border-red-200 bg-red-50';
    if (result.count === 0) return 'border-yellow-200 bg-yellow-50';
    return 'border-green-200 bg-green-50';
  };

  const renderSection = (title, items, expectedStatus) => (
    <div className="mb-8">
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
        {title}
      </h3>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {items.map(col => {
          const result = results[col.name];
          return (
            <div
              key={col.name}
              className={`p-4 rounded-lg border-2 transition-all ${getStatusColor(result)}`}
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center space-x-2">
                  <span className="text-lg">{col.icon}</span>
                  <h4 className="font-medium text-gray-900">{col.name}</h4>
                </div>
                {getStatusIcon(result)}
              </div>
              
              <p className="text-sm text-gray-600 mb-2">{col.description}</p>
              
              {result && (
                <div className="text-sm">
                  <div className="flex justify-between">
                    <span>Documenti:</span>
                    <span className="font-mono">{result.count}</span>
                  </div>
                  {result.status === 'error' && (
                    <div className="mt-1 text-red-600 text-xs">
                      {result.error}
                    </div>
                  )}
                  {result.samples.length > 0 && (
                    <details className="mt-2">
                      <summary className="cursor-pointer text-xs text-blue-600">
                        Mostra campioni ({result.samples.length})
                      </summary>
                      <div className="mt-1 text-xs bg-gray-100 p-2 rounded max-h-20 overflow-y-auto">
                        {result.samples.map(sample => (
                          <div key={sample.id} className="mb-1">
                            <strong>{sample.id}</strong>: {sample.data.title || sample.data.name || sample.data.email || 'N/A'}
                          </div>
                        ))}
                      </div>
                    </details>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center space-x-2 mb-2">
          <Database className="h-6 w-6 text-indigo-600" />
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Test Database Collections
          </h1>
        </div>
        <p className="text-gray-600 dark:text-gray-400">
          Verifica lo stato di tutte le raccolte del database Firestore
        </p>
      </div>

      {/* Controls */}
      <div className="mb-6">
        <button
          onClick={runAllTests}
          disabled={loading}
          className="flex items-center space-x-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          <span>{loading ? 'Testing...' : 'Esegui Test Completo'}</span>
        </button>
      </div>

      {/* Results */}
      {Object.keys(results).length > 0 && (
        <>
          {/* Summary Stats */}
          <div className="mb-6 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              Riepilogo Test
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">
                  {Object.values(results).filter(r => r.status === 'success' && r.count > 0).length}
                </div>
                <div className="text-gray-600">Attive</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-yellow-600">
                  {Object.values(results).filter(r => r.status === 'success' && r.count === 0).length}
                </div>
                <div className="text-gray-600">Vuote</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-red-600">
                  {Object.values(results).filter(r => r.status === 'error').length}
                </div>
                <div className="text-gray-600">Errori</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">
                  {Object.values(results).reduce((sum, r) => sum + r.count, 0)}
                </div>
                <div className="text-gray-600">Documenti Totali</div>
              </div>
            </div>
          </div>

          {/* Main Collections */}
          {renderSection('🚀 Raccolte Principali (dovrebbero essere attive)', collections.main)}

          {/* Legacy Collections */}
          {renderSection('⚠️ Raccolte Legacy (dovrebbero essere vuote)', collections.legacy)}

          {/* Verify Collections */}
          {renderSection('🔍 Raccolte da Verificare', collections.verify)}
        </>
      )}

      {/* Instructions */}
      {Object.keys(results).length === 0 && !loading && (
        <div className="text-center py-12 bg-gray-50 dark:bg-gray-800 rounded-lg">
          <Database className="h-12 w-12 mx-auto mb-4 text-gray-400" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
            Pronto per il Test
          </h3>
          <p className="text-gray-500 dark:text-gray-400 mb-4">
            Clicca "Esegui Test Completo" per analizzare tutte le raccolte
          </p>
        </div>
      )}
    </div>
  );
};

export default DatabaseTestPage;