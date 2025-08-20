import React, { useState, useEffect } from 'react';
import { 
  doc, 
  getDoc, 
  setDoc, 
  collection,
  addDoc 
} from 'firebase/firestore';
import { db } from '../../../config/firebase';
import { 
  CreditCard, 
  Key, 
  Shield, 
  Copy, 
  Eye, 
  EyeOff, 
  CheckCircle, 
  AlertCircle,
  Download,
  Settings
} from 'lucide-react';

const StripeSettingsManager = () => {
  const [stripeConfig, setStripeConfig] = useState({
    publishableKey: '',
    secretKey: '',
    webhookSecret: '',
    isLive: false
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showSecrets, setShowSecrets] = useState({
    secretKey: false,
    webhookSecret: false
  });
  const [configFiles, setConfigFiles] = useState({
    envFile: '',
    firebaseCommands: []
  });

  useEffect(() => {
    loadStripeConfig();
  }, []);

  useEffect(() => {
    generateConfigFiles();
  }, [stripeConfig]);

  const loadStripeConfig = async () => {
    try {
      const docRef = doc(db, 'siteSettings', 'stripeConfig');
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        setStripeConfig({
          publishableKey: docSnap.data().publishableKey || '',
          secretKey: docSnap.data().secretKey || '',
          webhookSecret: docSnap.data().webhookSecret || '',
          isLive: docSnap.data().isLive || false
        });
      }
    } catch (error) {
      console.error('Error loading Stripe config:', error);
    } finally {
      setLoading(false);
    }
  };

  const saveStripeConfig = async () => {
    try {
      setSaving(true);
      
      const docRef = doc(db, 'siteSettings', 'stripeConfig');
      await setDoc(docRef, {
        ...stripeConfig,
        updatedAt: new Date(),
        updatedBy: 'admin'
      });

      // Salva anche un log della configurazione
      await addDoc(collection(db, 'configLogs'), {
        type: 'stripe_config_update',
        config: {
          publishableKeySet: !!stripeConfig.publishableKey,
          secretKeySet: !!stripeConfig.secretKey,
          webhookSecretSet: !!stripeConfig.webhookSecret,
          isLive: stripeConfig.isLive
        },
        timestamp: new Date()
      });

      alert('✅ Configurazione Stripe salvata con successo!\n\nProssimi passi:\n1. Copia il contenuto del file .env\n2. Esegui i comandi Firebase Functions\n3. Fai il deploy delle functions');
    } catch (error) {
      console.error('Error saving Stripe config:', error);
      alert('❌ Errore nel salvare la configurazione');
    } finally {
      setSaving(false);
    }
  };

  const generateConfigFiles = () => {
    // Genera file .env
    const envContent = `# Stripe Configuration
VITE_STRIPE_PUBLISHABLE_KEY=${stripeConfig.publishableKey}

# Environment: ${stripeConfig.isLive ? 'PRODUCTION' : 'TEST'}
# Generated: ${new Date().toISOString()}`;

    // Genera comandi Firebase
    const firebaseCommands = [
      `firebase functions:config:set stripe.secret_key="${stripeConfig.secretKey}"`,
      `firebase functions:config:set stripe.webhook_secret="${stripeConfig.webhookSecret}"`,
      `firebase functions:config:set stripe.environment="${stripeConfig.isLive ? 'live' : 'test'}"`,
      `firebase deploy --only functions`
    ];

    setConfigFiles({
      envFile: envContent,
      firebaseCommands
    });
  };

  const copyToClipboard = (text, type) => {
    navigator.clipboard.writeText(text);
    alert(`✅ ${type} copiato negli appunti!`);
  };

  const downloadEnvFile = () => {
    const blob = new Blob([configFiles.envFile], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = '.env';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const validateKeys = () => {
    const errors = [];
    
    if (!stripeConfig.publishableKey) {
      errors.push('Publishable Key è richiesta');
    } else if (!stripeConfig.publishableKey.startsWith('pk_')) {
      errors.push('Publishable Key deve iniziare con "pk_"');
    }
    
    if (!stripeConfig.secretKey) {
      errors.push('Secret Key è richiesta');
    } else if (!stripeConfig.secretKey.startsWith('sk_')) {
      errors.push('Secret Key deve iniziare con "sk_"');
    }
    
    if (!stripeConfig.webhookSecret) {
      errors.push('Webhook Secret è richiesto');
    } else if (!stripeConfig.webhookSecret.startsWith('whsec_')) {
      errors.push('Webhook Secret deve iniziare con "whsec_"');
    }

    return errors;
  };

  const isConfigValid = validateKeys().length === 0;

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <div className="flex items-center mb-4">
          <CreditCard className="h-8 w-8 text-blue-600 mr-3" />
          <div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
              Configurazione Stripe
            </h2>
            <p className="text-gray-600 dark:text-gray-300">
              Configura le chiavi API di Stripe per abilitare i pagamenti
            </p>
          </div>
        </div>

        {/* Environment Toggle */}
        <div className="mb-6">
          <label className="flex items-center">
            <input
              type="checkbox"
              checked={stripeConfig.isLive}
              onChange={(e) => setStripeConfig(prev => ({
                ...prev,
                isLive: e.target.checked
              }))}
              className="mr-3"
            />
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Modalità Live (Produzione)
            </span>
            {stripeConfig.isLive && (
              <span className="ml-2 bg-red-100 text-red-800 text-xs px-2 py-1 rounded-full">
                LIVE
              </span>
            )}
          </label>
          <p className="text-xs text-gray-500 mt-1">
            {stripeConfig.isLive 
              ? '⚠️ Modalità produzione: verranno elaborati pagamenti reali'
              : '🧪 Modalità test: puoi usare carte di credito fittizie'
            }
          </p>
        </div>
      </div>

      {/* Form Configuration */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Chiavi API Stripe
        </h3>

        <div className="space-y-4">
          {/* Publishable Key */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              <Key className="h-4 w-4 inline mr-1" />
              Publishable Key
            </label>
            <input
              type="text"
              value={stripeConfig.publishableKey}
              onChange={(e) => setStripeConfig(prev => ({
                ...prev,
                publishableKey: e.target.value
              }))}
              placeholder={`pk_${stripeConfig.isLive ? 'live' : 'test'}_...`}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            />
            <p className="text-xs text-gray-500 mt-1">
              Usata nel frontend per inizializzare Stripe
            </p>
          </div>

          {/* Secret Key */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              <Shield className="h-4 w-4 inline mr-1" />
              Secret Key
            </label>
            <div className="relative">
              <input
                type={showSecrets.secretKey ? "text" : "password"}
                value={stripeConfig.secretKey}
                onChange={(e) => setStripeConfig(prev => ({
                  ...prev,
                  secretKey: e.target.value
                }))}
                placeholder={`sk_${stripeConfig.isLive ? 'live' : 'test'}_...`}
                className="w-full px-3 py-2 pr-10 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              />
              <button
                type="button"
                onClick={() => setShowSecrets(prev => ({
                  ...prev,
                  secretKey: !prev.secretKey
                }))}
                className="absolute right-2 top-2 text-gray-400 hover:text-gray-600"
              >
                {showSecrets.secretKey ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
              </button>
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Usata nelle Cloud Functions per creare sessioni di pagamento
            </p>
          </div>

          {/* Webhook Secret */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              <Settings className="h-4 w-4 inline mr-1" />
              Webhook Signing Secret
            </label>
            <div className="relative">
              <input
                type={showSecrets.webhookSecret ? "text" : "password"}
                value={stripeConfig.webhookSecret}
                onChange={(e) => setStripeConfig(prev => ({
                  ...prev,
                  webhookSecret: e.target.value
                }))}
                placeholder="whsec_..."
                className="w-full px-3 py-2 pr-10 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              />
              <button
                type="button"
                onClick={() => setShowSecrets(prev => ({
                  ...prev,
                  webhookSecret: !prev.webhookSecret
                }))}
                className="absolute right-2 top-2 text-gray-400 hover:text-gray-600"
              >
                {showSecrets.webhookSecret ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
              </button>
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Usata per verificare che gli eventi webhook vengano da Stripe
            </p>
          </div>
        </div>

        {/* Validation Errors */}
        {!isConfigValid && (
          <div className="mt-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md p-3">
            <div className="flex">
              <AlertCircle className="h-5 w-5 text-red-400 mr-2 mt-0.5" />
              <div>
                <h4 className="text-sm font-medium text-red-800 dark:text-red-200">
                  Errori di validazione:
                </h4>
                <ul className="text-sm text-red-700 dark:text-red-300 mt-1 list-disc list-inside">
                  {validateKeys().map((error, index) => (
                    <li key={index}>{error}</li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        )}

        {/* Save Button */}
        <div className="mt-6">
          <button
            onClick={saveStripeConfig}
            disabled={saving || !isConfigValid}
            className={`w-full flex items-center justify-center px-4 py-2 rounded-md font-medium ${
              isConfigValid
                ? 'bg-blue-600 hover:bg-blue-700 text-white'
                : 'bg-gray-300 text-gray-500 cursor-not-allowed'
            }`}
          >
            {saving ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Salvando...
              </>
            ) : (
              <>
                <CheckCircle className="h-5 w-5 mr-2" />
                Salva Configurazione
              </>
            )}
          </button>
        </div>
      </div>

      {/* Generated Files */}
      {isConfigValid && (
        <div className="space-y-4">
          {/* .env File */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                File .env (Frontend)
              </h3>
              <div className="flex space-x-2">
                <button
                  onClick={() => copyToClipboard(configFiles.envFile, 'Contenuto .env')}
                  className="flex items-center px-3 py-1 text-sm bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded hover:bg-gray-200 dark:hover:bg-gray-600"
                >
                  <Copy className="h-4 w-4 mr-1" />
                  Copia
                </button>
                <button
                  onClick={downloadEnvFile}
                  className="flex items-center px-3 py-1 text-sm bg-blue-100 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 rounded hover:bg-blue-200 dark:hover:bg-blue-900/40"
                >
                  <Download className="h-4 w-4 mr-1" />
                  Scarica
                </button>
              </div>
            </div>
            <pre className="bg-gray-50 dark:bg-gray-900 p-4 rounded text-sm overflow-x-auto">
              <code>{configFiles.envFile}</code>
            </pre>
            <p className="text-xs text-gray-500 mt-2">
              💡 Salva questo contenuto in un file chiamato `.env` nella root del progetto
            </p>
          </div>

          {/* Firebase Commands */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Comandi Firebase Functions
              </h3>
              <button
                onClick={() => copyToClipboard(configFiles.firebaseCommands.join('\n'), 'Comandi Firebase')}
                className="flex items-center px-3 py-1 text-sm bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded hover:bg-gray-200 dark:hover:bg-gray-600"
              >
                <Copy className="h-4 w-4 mr-1" />
                Copia Tutti
              </button>
            </div>
            <div className="space-y-2">
              {configFiles.firebaseCommands.map((command, index) => (
                <div key={index} className="flex items-center justify-between bg-gray-50 dark:bg-gray-900 p-3 rounded">
                  <code className="text-sm flex-1">{command}</code>
                  <button
                    onClick={() => copyToClipboard(command, `Comando ${index + 1}`)}
                    className="ml-2 text-gray-400 hover:text-gray-600"
                  >
                    <Copy className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>
            <p className="text-xs text-gray-500 mt-2">
              💡 Esegui questi comandi in sequenza nel terminale dalla root del progetto
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default StripeSettingsManager;