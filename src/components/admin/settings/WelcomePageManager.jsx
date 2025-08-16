import React, { useState, useEffect } from 'react';
import { 
  doc, 
  getDoc, 
  updateDoc,
  setDoc,
  collection,
  query,
  getDocs,
  where
} from 'firebase/firestore';
import { db } from '../../../config/firebase';
import { 
  Sparkles, 
  Save, 
  RefreshCw,
  Eye,
  Palette,
  Type,
  Video,
  Settings,
  ToggleLeft,
  ToggleRight,
  Monitor
} from 'lucide-react';
import VideoSelector from '../VideoSelector';

const WelcomePageManager = () => {
  const [welcomeData, setWelcomeData] = useState({
    title: 'Benvenuto in Mentalità',
    subtitle: 'Il tuo percorso di crescita mentale inizia ora',
    description: 'Guarda questo video introduttivo per scoprire come trasformare la tua mente e raggiungere i tuoi obiettivi.',
    buttonText: 'Inizia il tuo percorso',
    backgroundColor: '#1e3a8a',
    textColor: '#ffffff',
    buttonColor: '#10b981',
    isActive: true,
    showAfterQuestionnaire: true,
    selectedVideo: null
  });
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [previewMode, setPreviewMode] = useState(false);

  useEffect(() => {
    fetchWelcomeData();
  }, []);

  const fetchWelcomeData = async () => {
    try {
      setLoading(true);
      const welcomeDoc = await getDoc(doc(db, 'welcomePages', 'main'));
      
      if (welcomeDoc.exists()) {
        const data = welcomeDoc.data();
        setWelcomeData({
          title: data.title || 'Benvenuto in Mentalità',
          subtitle: data.subtitle || 'Il tuo percorso di crescita mentale inizia ora',
          description: data.description || 'Guarda questo video introduttivo per scoprire come trasformare la tua mente e raggiungere i tuoi obiettivi.',
          buttonText: data.buttonText || 'Inizia il tuo percorso',
          backgroundColor: data.backgroundColor || '#1e3a8a',
          textColor: data.textColor || '#ffffff', 
          buttonColor: data.buttonColor || '#10b981',
          isActive: data.isActive !== undefined ? data.isActive : true,
          showAfterQuestionnaire: data.showAfterQuestionnaire !== undefined ? data.showAfterQuestionnaire : true,
          selectedVideo: data.selectedVideo || null
        });
      }
    } catch (error) {
      console.error('Error fetching welcome data:', error);
    } finally {
      setLoading(false);
    }
  };


  const handleSave = async () => {
    try {
      setSaving(true);
      const dataToSave = {
        ...welcomeData,
        updatedAt: new Date(),
        id: 'main'
      };

      // Se non esiste, crea il documento
      await setDoc(doc(db, 'welcomePages', 'main'), {
        ...dataToSave,
        createdAt: new Date()
      });

      alert('Welcome Page salvata con successo!');
    } catch (error) {
      console.error('Error saving welcome data:', error);
      alert('Errore nel salvataggio');
    } finally {
      setSaving(false);
    }
  };

  const updateField = (field, value) => {
    setWelcomeData(prev => ({ ...prev, [field]: value }));
  };

  const getSelectedVideo = () => {
    return videos.find(v => v.id === welcomeData.videoId);
  };

  if (loading) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <div className="flex items-center space-x-3 mb-6">
          <Sparkles className="h-6 w-6 text-purple-600 dark:text-purple-400" />
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            Welcome Page Manager
          </h2>
        </div>
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto"></div>
          <p className="text-gray-500 dark:text-gray-400 mt-4">Caricamento...</p>
        </div>
      </div>
    );
  }

  if (previewMode) {
    return (
      <div className="fixed inset-0 z-50 bg-black bg-opacity-50">
        <div className="absolute inset-4 bg-white dark:bg-gray-800 rounded-lg overflow-hidden">
          <div className="p-4 bg-gray-100 dark:bg-gray-700 flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Preview Welcome Page
            </h3>
            <button
              onClick={() => setPreviewMode(false)}
              className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700"
            >
              Chiudi Preview
            </button>
          </div>
          
          <div 
            className="h-full flex flex-col items-center justify-center p-8"
            style={{ 
              backgroundColor: welcomeData.backgroundColor,
              color: welcomeData.textColor 
            }}
          >
            <div className="text-center max-w-2xl">
              <div className="mb-8">
                <Sparkles className="w-16 h-16 mx-auto mb-4 text-yellow-300" />
              </div>
              
              <h1 className="text-4xl font-bold mb-4">{welcomeData.title}</h1>
              <h2 className="text-xl mb-6 opacity-90">{welcomeData.subtitle}</h2>
              <p className="text-lg mb-8 opacity-80">{welcomeData.description}</p>
              
              {welcomeData.selectedVideo && (
                <div className="mb-8 p-6 bg-white/10 rounded-lg">
                  <p className="mb-4">🎥 Video: {welcomeData.selectedVideo.title}</p>
                </div>
              )}
              
              <button
                className="px-8 py-4 text-lg font-semibold rounded-xl"
                style={{ backgroundColor: welcomeData.buttonColor, color: '#ffffff' }}
              >
                {welcomeData.buttonText}
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between mb-6">
        <div className="flex items-center space-x-3 mb-4 lg:mb-0">
          <Sparkles className="h-6 w-6 text-purple-600 dark:text-purple-400" />
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            Welcome Page Manager
          </h2>
        </div>
        
        <div className="flex space-x-3">
          <button
            onClick={() => setPreviewMode(true)}
            className="flex items-center space-x-2 px-4 py-2 text-purple-600 hover:text-purple-800 bg-purple-100 hover:bg-purple-200 rounded-lg transition-colors"
          >
            <Eye className="h-4 w-4" />
            <span>Preview</span>
          </button>
          <button
            onClick={fetchWelcomeData}
            className="flex items-center space-x-2 px-4 py-2 text-gray-600 hover:text-gray-800 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
          >
            <RefreshCw className="h-4 w-4" />
            <span>Ricarica</span>
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center space-x-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 transition-colors"
          >
            <Save className="h-4 w-4" />
            <span>{saving ? 'Salvataggio...' : 'Salva'}</span>
          </button>
        </div>
      </div>

      {/* Settings */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* Content Settings */}
        <div className="space-y-6">
          <div className="flex items-center space-x-2 mb-4">
            <Type className="h-5 w-5 text-purple-600" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Contenuti</h3>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Titolo Principale
            </label>
            <input
              type="text"
              value={welcomeData.title}
              onChange={(e) => updateField('title', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Sottotitolo
            </label>
            <input
              type="text"
              value={welcomeData.subtitle}
              onChange={(e) => updateField('subtitle', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Descrizione
            </label>
            <textarea
              value={welcomeData.description}
              onChange={(e) => updateField('description', e.target.value)}
              rows={4}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Testo Button
            </label>
            <input
              type="text"
              value={welcomeData.buttonText}
              onChange={(e) => updateField('buttonText', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500"
            />
          </div>

          <VideoSelector
            value={welcomeData.selectedVideo}
            onChange={(video) => updateField('selectedVideo', video)}
            label="Video Introduttivo"
            placeholder="Seleziona un video dalla libreria..."
            multiple={false}
          />
        </div>

        {/* Design Settings */}
        <div className="space-y-6">
          <div className="flex items-center space-x-2 mb-4">
            <Palette className="h-5 w-5 text-purple-600" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Design</h3>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Colore Sfondo
            </label>
            <div className="flex space-x-3">
              <input
                type="color"
                value={welcomeData.backgroundColor}
                onChange={(e) => updateField('backgroundColor', e.target.value)}
                className="w-16 h-10 border border-gray-300 rounded cursor-pointer"
              />
              <input
                type="text"
                value={welcomeData.backgroundColor}
                onChange={(e) => updateField('backgroundColor', e.target.value)}
                className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500"
                placeholder="#1e3a8a"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Colore Testo
            </label>
            <div className="flex space-x-3">
              <input
                type="color"
                value={welcomeData.textColor}
                onChange={(e) => updateField('textColor', e.target.value)}
                className="w-16 h-10 border border-gray-300 rounded cursor-pointer"
              />
              <input
                type="text"
                value={welcomeData.textColor}
                onChange={(e) => updateField('textColor', e.target.value)}
                className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500"
                placeholder="#ffffff"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Colore Button
            </label>
            <div className="flex space-x-3">
              <input
                type="color"
                value={welcomeData.buttonColor}
                onChange={(e) => updateField('buttonColor', e.target.value)}
                className="w-16 h-10 border border-gray-300 rounded cursor-pointer"
              />
              <input
                type="text"
                value={welcomeData.buttonColor}
                onChange={(e) => updateField('buttonColor', e.target.value)}
                className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500"
                placeholder="#10b981"
              />
            </div>
          </div>

          <div className="space-y-4 pt-4 border-t border-gray-200 dark:border-gray-700">
            <div className="flex items-center space-x-2 mb-3">
              <Settings className="h-5 w-5 text-purple-600" />
              <h4 className="font-semibold text-gray-900 dark:text-white">Configurazioni</h4>
            </div>
            
            <div>
              <label className="flex items-center space-x-2">
                <button
                  onClick={() => updateField('isActive', !welcomeData.isActive)}
                  className="flex items-center"
                >
                  {welcomeData.isActive ? (
                    <ToggleRight className="h-6 w-6 text-purple-600" />
                  ) : (
                    <ToggleLeft className="h-6 w-6 text-gray-400" />
                  )}
                </button>
                <span className="text-sm text-gray-700 dark:text-gray-300">Welcome Page Attiva</span>
              </label>
            </div>

            <div>
              <label className="flex items-center space-x-2">
                <button
                  onClick={() => updateField('showAfterQuestionnaire', !welcomeData.showAfterQuestionnaire)}
                  className="flex items-center"
                >
                  {welcomeData.showAfterQuestionnaire ? (
                    <ToggleRight className="h-6 w-6 text-purple-600" />
                  ) : (
                    <ToggleLeft className="h-6 w-6 text-gray-400" />
                  )}
                </button>
                <span className="text-sm text-gray-700 dark:text-gray-300">Mostra dopo Questionario</span>
              </label>
            </div>
          </div>

          {/* Preview Card */}
          <div 
            className="p-6 rounded-lg border-2 border-dashed border-gray-300 text-center"
            style={{ 
              backgroundColor: welcomeData.backgroundColor + '20',
              borderColor: welcomeData.backgroundColor + '60'
            }}
          >
            <Monitor className="w-8 h-8 mx-auto mb-3 text-purple-600" />
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
              Anteprima colori
            </p>
            <div 
              className="p-4 rounded-lg text-center"
              style={{ 
                backgroundColor: welcomeData.backgroundColor,
                color: welcomeData.textColor 
              }}
            >
              <h4 className="font-bold mb-2">{welcomeData.title}</h4>
              <button
                className="px-4 py-2 rounded text-sm font-semibold"
                style={{ backgroundColor: welcomeData.buttonColor, color: '#ffffff' }}
              >
                {welcomeData.buttonText}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WelcomePageManager;