import React, { useState, useEffect } from 'react';
import { 
  doc, 
  getDoc, 
  updateDoc,
  setDoc
} from 'firebase/firestore';
import { db } from '../../../config/firebase';
import { 
  Settings, 
  Save, 
  RefreshCw,
  Globe,
  Mail,
  Palette,
  Shield,
  Bell,
  Database,
  Image,
  Type,
  Link,
  Phone,
  MapPin,
  Clock,
  Users,
  ToggleLeft,
  ToggleRight,
  AlertTriangle
} from 'lucide-react';

const SiteSettingsManager = () => {
  const [settings, setSettings] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState('general');

  const tabs = [
    { id: 'general', label: 'Generali', icon: Settings },
    { id: 'appearance', label: 'Aspetto', icon: Palette },
    { id: 'contact', label: 'Contatti', icon: Mail },
    { id: 'security', label: 'Sicurezza', icon: Shield },
    { id: 'notifications', label: 'Notifiche', icon: Bell },
    { id: 'maintenance', label: 'Manutenzione', icon: Database }
  ];

  const defaultSettings = {
    // General
    siteName: 'Mentalità - Forza mentale per il tuo sport',
    siteDescription: 'Piattaforma di allenamento mentale per atleti e sportivi',
    siteUrl: 'https://be-water-2eb26.web.app',
    language: 'it',
    timezone: 'Europe/Rome',
    
    // Appearance
    primaryColor: '#3B82F6',
    secondaryColor: '#10B981',
    darkMode: true,
    logoUrl: '',
    faviconUrl: '',
    customCSS: '',
    
    // Contact
    contactEmail: 'info@mentalita.app',
    supportEmail: 'support@mentalita.app',
    phone: '',
    address: '',
    socialLinks: {
      facebook: '',
      instagram: '',
      twitter: '',
      linkedin: '',
      youtube: ''
    },
    
    // Security
    registrationEnabled: true,
    emailVerificationRequired: false,
    passwordMinLength: 8,
    sessionTimeout: 24,
    allowGuestAccess: false,
    
    // Notifications
    emailNotifications: true,
    pushNotifications: false,
    adminNotifications: true,
    userWelcomeEmail: true,
    
    // Maintenance
    maintenanceMode: false,
    maintenanceMessage: 'Il sito è temporaneamente in manutenzione. Torneremo presto!',
    backupEnabled: true,
    analyticsEnabled: true,
    debugMode: false
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      setLoading(true);
      const settingsDoc = await getDoc(doc(db, 'settings', 'site'));
      
      if (settingsDoc.exists()) {
        setSettings({ ...defaultSettings, ...settingsDoc.data() });
      } else {
        setSettings(defaultSettings);
        // Create default settings document
        await setDoc(doc(db, 'settings', 'site'), defaultSettings);
      }
    } catch (error) {
      console.error('Error fetching site settings:', error);
      setSettings(defaultSettings);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      await updateDoc(doc(db, 'settings', 'site'), {
        ...settings,
        updatedAt: new Date()
      });
      alert('Impostazioni salvate con successo!');
    } catch (error) {
      console.error('Error saving settings:', error);
      alert('Errore nel salvataggio delle impostazioni');
    } finally {
      setSaving(false);
    }
  };

  const updateSetting = (key, value) => {
    if (key.includes('.')) {
      const keys = key.split('.');
      setSettings(prev => ({
        ...prev,
        [keys[0]]: {
          ...prev[keys[0]],
          [keys[1]]: value
        }
      }));
    } else {
      setSettings(prev => ({ ...prev, [key]: value }));
    }
  };

  const renderGeneralTab = () => (
    <div className="space-y-6">
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          <Globe className="h-4 w-4 inline mr-2" />
          Nome del Sito
        </label>
        <input
          type="text"
          value={settings.siteName || ''}
          onChange={(e) => updateSetting('siteName', e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          <Type className="h-4 w-4 inline mr-2" />
          Descrizione del Sito
        </label>
        <textarea
          value={settings.siteDescription || ''}
          onChange={(e) => updateSetting('siteDescription', e.target.value)}
          rows={3}
          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          <Link className="h-4 w-4 inline mr-2" />
          URL del Sito
        </label>
        <input
          type="url"
          value={settings.siteUrl || ''}
          onChange={(e) => updateSetting('siteUrl', e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Lingua
          </label>
          <select
            value={settings.language || 'it'}
            onChange={(e) => updateSetting('language', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="it">Italiano</option>
            <option value="en">English</option>
            <option value="es">Español</option>
            <option value="fr">Français</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            <Clock className="h-4 w-4 inline mr-2" />
            Fuso Orario
          </label>
          <select
            value={settings.timezone || 'Europe/Rome'}
            onChange={(e) => updateSetting('timezone', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="Europe/Rome">Europa/Roma</option>
            <option value="Europe/London">Europa/Londra</option>
            <option value="America/New_York">America/New York</option>
            <option value="America/Los_Angeles">America/Los Angeles</option>
          </select>
        </div>
      </div>
    </div>
  );

  const renderAppearanceTab = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Colore Primario
          </label>
          <input
            type="color"
            value={settings.primaryColor || '#3B82F6'}
            onChange={(e) => updateSetting('primaryColor', e.target.value)}
            className="w-full h-10 border border-gray-300 dark:border-gray-600 rounded-lg"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Colore Secondario
          </label>
          <input
            type="color"
            value={settings.secondaryColor || '#10B981'}
            onChange={(e) => updateSetting('secondaryColor', e.target.value)}
            className="w-full h-10 border border-gray-300 dark:border-gray-600 rounded-lg"
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          <Image className="h-4 w-4 inline mr-2" />
          URL Logo
        </label>
        <input
          type="url"
          value={settings.logoUrl || ''}
          onChange={(e) => updateSetting('logoUrl', e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          placeholder="https://example.com/logo.png"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          URL Favicon
        </label>
        <input
          type="url"
          value={settings.faviconUrl || ''}
          onChange={(e) => updateSetting('faviconUrl', e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          placeholder="https://example.com/favicon.ico"
        />
      </div>

      <div>
        <label className="flex items-center space-x-2">
          <button
            onClick={() => updateSetting('darkMode', !settings.darkMode)}
            className="flex items-center"
          >
            {settings.darkMode ? (
              <ToggleRight className="h-6 w-6 text-blue-600" />
            ) : (
              <ToggleLeft className="h-6 w-6 text-gray-400" />
            )}
          </button>
          <span className="text-sm text-gray-700 dark:text-gray-300">Modalità Scura</span>
        </label>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          CSS Personalizzato
        </label>
        <textarea
          value={settings.customCSS || ''}
          onChange={(e) => updateSetting('customCSS', e.target.value)}
          rows={8}
          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono text-sm"
          placeholder="/* Inserisci qui il tuo CSS personalizzato */"
        />
      </div>
    </div>
  );

  const renderContactTab = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            <Mail className="h-4 w-4 inline mr-2" />
            Email di Contatto
          </label>
          <input
            type="email"
            value={settings.contactEmail || ''}
            onChange={(e) => updateSetting('contactEmail', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Email di Supporto
          </label>
          <input
            type="email"
            value={settings.supportEmail || ''}
            onChange={(e) => updateSetting('supportEmail', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            <Phone className="h-4 w-4 inline mr-2" />
            Telefono
          </label>
          <input
            type="tel"
            value={settings.phone || ''}
            onChange={(e) => updateSetting('phone', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            <MapPin className="h-4 w-4 inline mr-2" />
            Indirizzo
          </label>
          <input
            type="text"
            value={settings.address || ''}
            onChange={(e) => updateSetting('address', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
      </div>

      <div>
        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Social Media</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {Object.entries(settings.socialLinks || {}).map(([platform, url]) => (
            <div key={platform}>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 capitalize">
                {platform}
              </label>
              <input
                type="url"
                value={url}
                onChange={(e) => updateSetting(`socialLinks.${platform}`, e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder={`https://${platform}.com/your-profile`}
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  const renderSecurityTab = () => (
    <div className="space-y-6">
      <div className="space-y-4">
        <div>
          <label className="flex items-center space-x-2">
            <button
              onClick={() => updateSetting('registrationEnabled', !settings.registrationEnabled)}
              className="flex items-center"
            >
              {settings.registrationEnabled ? (
                <ToggleRight className="h-6 w-6 text-blue-600" />
              ) : (
                <ToggleLeft className="h-6 w-6 text-gray-400" />
              )}
            </button>
            <span className="text-sm text-gray-700 dark:text-gray-300">Registrazioni Abilitate</span>
          </label>
        </div>

        <div>
          <label className="flex items-center space-x-2">
            <button
              onClick={() => updateSetting('emailVerificationRequired', !settings.emailVerificationRequired)}
              className="flex items-center"
            >
              {settings.emailVerificationRequired ? (
                <ToggleRight className="h-6 w-6 text-blue-600" />
              ) : (
                <ToggleLeft className="h-6 w-6 text-gray-400" />
              )}
            </button>
            <span className="text-sm text-gray-700 dark:text-gray-300">Verifica Email Obbligatoria</span>
          </label>
        </div>

        <div>
          <label className="flex items-center space-x-2">
            <button
              onClick={() => updateSetting('allowGuestAccess', !settings.allowGuestAccess)}
              className="flex items-center"
            >
              {settings.allowGuestAccess ? (
                <ToggleRight className="h-6 w-6 text-blue-600" />
              ) : (
                <ToggleLeft className="h-6 w-6 text-gray-400" />
              )}
            </button>
            <span className="text-sm text-gray-700 dark:text-gray-300">Accesso Ospiti</span>
          </label>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Lunghezza Minima Password
          </label>
          <input
            type="number"
            min="6"
            max="50"
            value={settings.passwordMinLength || 8}
            onChange={(e) => updateSetting('passwordMinLength', parseInt(e.target.value))}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Timeout Sessione (ore)
          </label>
          <input
            type="number"
            min="1"
            max="168"
            value={settings.sessionTimeout || 24}
            onChange={(e) => updateSetting('sessionTimeout', parseInt(e.target.value))}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
      </div>
    </div>
  );

  const renderNotificationsTab = () => (
    <div className="space-y-6">
      <div className="space-y-4">
        {[
          { key: 'emailNotifications', label: 'Notifiche Email' },
          { key: 'pushNotifications', label: 'Notifiche Push' },
          { key: 'adminNotifications', label: 'Notifiche Admin' },
          { key: 'userWelcomeEmail', label: 'Email di Benvenuto' }
        ].map(({ key, label }) => (
          <div key={key}>
            <label className="flex items-center space-x-2">
              <button
                onClick={() => updateSetting(key, !settings[key])}
                className="flex items-center"
              >
                {settings[key] ? (
                  <ToggleRight className="h-6 w-6 text-blue-600" />
                ) : (
                  <ToggleLeft className="h-6 w-6 text-gray-400" />
                )}
              </button>
              <span className="text-sm text-gray-700 dark:text-gray-300">{label}</span>
            </label>
          </div>
        ))}
      </div>
    </div>
  );

  const renderMaintenanceTab = () => (
    <div className="space-y-6">
      <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-700 rounded-lg p-4">
        <div className="flex items-center">
          <AlertTriangle className="h-5 w-5 text-yellow-600 dark:text-yellow-400 mr-2" />
          <p className="text-yellow-800 dark:text-yellow-200 text-sm">
            Attenzione: La modalità manutenzione renderà il sito inaccessibile agli utenti.
          </p>
        </div>
      </div>

      <div>
        <label className="flex items-center space-x-2">
          <button
            onClick={() => updateSetting('maintenanceMode', !settings.maintenanceMode)}
            className="flex items-center"
          >
            {settings.maintenanceMode ? (
              <ToggleRight className="h-6 w-6 text-red-600" />
            ) : (
              <ToggleLeft className="h-6 w-6 text-gray-400" />
            )}
          </button>
          <span className="text-sm text-gray-700 dark:text-gray-300">Modalità Manutenzione</span>
        </label>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Messaggio di Manutenzione
        </label>
        <textarea
          value={settings.maintenanceMessage || ''}
          onChange={(e) => updateSetting('maintenanceMessage', e.target.value)}
          rows={3}
          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
      </div>

      <div className="space-y-4">
        {[
          { key: 'backupEnabled', label: 'Backup Automatici' },
          { key: 'analyticsEnabled', label: 'Analytics Abilitati' },
          { key: 'debugMode', label: 'Modalità Debug' }
        ].map(({ key, label }) => (
          <div key={key}>
            <label className="flex items-center space-x-2">
              <button
                onClick={() => updateSetting(key, !settings[key])}
                className="flex items-center"
              >
                {settings[key] ? (
                  <ToggleRight className="h-6 w-6 text-blue-600" />
                ) : (
                  <ToggleLeft className="h-6 w-6 text-gray-400" />
                )}
              </button>
              <span className="text-sm text-gray-700 dark:text-gray-300">{label}</span>
            </label>
          </div>
        ))}
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <div className="flex items-center space-x-3 mb-6">
          <Settings className="h-6 w-6 text-gray-600 dark:text-gray-400" />
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            Impostazioni Sito
          </h2>
        </div>
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-600 mx-auto"></div>
          <p className="text-gray-500 dark:text-gray-400 mt-4">Caricamento impostazioni...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between mb-6">
        <div className="flex items-center space-x-3 mb-4 lg:mb-0">
          <Settings className="h-6 w-6 text-gray-600 dark:text-gray-400" />
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            Impostazioni Sito
          </h2>
        </div>
        
        <div className="flex space-x-3">
          <button
            onClick={fetchSettings}
            className="flex items-center space-x-2 px-4 py-2 text-gray-600 hover:text-gray-800 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
          >
            <RefreshCw className="h-4 w-4" />
            <span>Ricarica</span>
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
          >
            <Save className="h-4 w-4" />
            <span>{saving ? 'Salvataggio...' : 'Salva'}</span>
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200 dark:border-gray-700 mb-6">
        <nav className="flex space-x-8 overflow-x-auto">
          {tabs.map(tab => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center space-x-2 py-2 px-1 border-b-2 font-medium text-sm whitespace-nowrap ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <Icon className="h-4 w-4" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </nav>
      </div>

      {/* Tab Content */}
      <div className="tab-content">
        {activeTab === 'general' && renderGeneralTab()}
        {activeTab === 'appearance' && renderAppearanceTab()}
        {activeTab === 'contact' && renderContactTab()}
        {activeTab === 'security' && renderSecurityTab()}
        {activeTab === 'notifications' && renderNotificationsTab()}
        {activeTab === 'maintenance' && renderMaintenanceTab()}
      </div>
    </div>
  );
};

export default SiteSettingsManager;