import React, { useState, useEffect } from 'react';
import { db } from '../config/firebase';
import { collection, getDocs, doc, updateDoc } from 'firebase/firestore';
import { ArrowLeft, Save, Eye, Image } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const AdminAudioImages = () => {
  const navigate = useNavigate();
  const [audios, setAudios] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [imageUrls, setImageUrls] = useState({});

  useEffect(() => {
    const fetchAudios = async () => {
      try {
        const audioSnapshot = await getDocs(collection(db, 'audioContent'));
        const audioList = audioSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        setAudios(audioList);
        
        // Inizializza gli URL delle immagini
        const initialImageUrls = {};
        audioList.forEach(audio => {
          initialImageUrls[audio.id] = audio.imageUrl || '';
        });
        setImageUrls(initialImageUrls);
        
        console.log('📸 Audio caricati per gestione immagini:', audioList);
      } catch (error) {
        console.error('Errore caricamento audio:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchAudios();
  }, []);

  const handleImageUrlChange = (audioId, url) => {
    setImageUrls(prev => ({
      ...prev,
      [audioId]: url
    }));
  };

  const handleSave = async (audioId) => {
    setSaving(true);
    try {
      const audioDoc = doc(db, 'audioContent', audioId);
      await updateDoc(audioDoc, {
        imageUrl: imageUrls[audioId]
      });
      
      // Aggiorna anche l'array locale
      setAudios(prev => prev.map(audio => 
        audio.id === audioId 
          ? { ...audio, imageUrl: imageUrls[audioId] }
          : audio
      ));
      
      alert('✅ Immagine salvata!');
    } catch (error) {
      console.error('Errore salvataggio:', error);
      alert('❌ Errore nel salvataggio');
    } finally {
      setSaving(false);
    }
  };

  const handlePreview = (audioId) => {
    navigate(`/audio/${audioId}`);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-indigo-500 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-300">Caricamento audio...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 shadow-sm">
        <div className="px-4 py-4">
          <button
            onClick={() => navigate('/dashboard')}
            className="flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white mb-4"
          >
            <ArrowLeft className="h-5 w-5" />
            <span>Torna alla Dashboard</span>
          </button>
          
          <div className="flex items-center gap-3 mb-2">
            <Image className="h-6 w-6 text-indigo-500" />
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              Gestione Immagini Audio
            </h1>
          </div>
          
          <p className="text-gray-600 dark:text-gray-300">
            Aggiungi o modifica le immagini per gli audio. Inserisci l'URL completo dell'immagine.
          </p>
        </div>
      </div>

      <div className="px-4 py-6">
        <div className="space-y-4">
          {audios.map((audio) => (
            <div key={audio.id} className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
              <div className="flex flex-col lg:flex-row gap-6">
                {/* Info Audio */}
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                    {audio.title}
                  </h3>
                  <p className="text-gray-600 dark:text-gray-300 text-sm mb-4">
                    {audio.description?.substring(0, 100)}...
                  </p>
                  
                  {/* Input URL Immagine */}
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      URL Immagine
                    </label>
                    <input
                      type="url"
                      value={imageUrls[audio.id] || ''}
                      onChange={(e) => handleImageUrlChange(audio.id, e.target.value)}
                      placeholder="https://esempio.com/immagine.jpg"
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    />
                  </div>

                  {/* Azioni */}
                  <div className="flex gap-3">
                    <button
                      onClick={() => handleSave(audio.id)}
                      disabled={saving}
                      className="bg-indigo-500 hover:bg-indigo-600 disabled:opacity-50 text-white px-4 py-2 rounded-lg flex items-center gap-2"
                    >
                      <Save className="h-4 w-4" />
                      {saving ? 'Salvataggio...' : 'Salva'}
                    </button>
                    
                    <button
                      onClick={() => handlePreview(audio.id)}
                      className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded-lg flex items-center gap-2"
                    >
                      <Eye className="h-4 w-4" />
                      Anteprima
                    </button>
                  </div>
                </div>

                {/* Preview Immagine */}
                <div className="lg:w-64">
                  {imageUrls[audio.id] && (
                    <div>
                      <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Anteprima:
                      </p>
                      <img 
                        src={imageUrls[audio.id]} 
                        alt={audio.title}
                        className="w-full max-w-48 h-48 object-cover rounded-lg shadow-md"
                        onError={(e) => {
                          e.target.style.display = 'none';
                          e.target.nextSibling.style.display = 'block';
                        }}
                      />
                      <div 
                        className="w-full max-w-48 h-48 bg-gray-200 dark:bg-gray-700 rounded-lg flex items-center justify-center text-gray-500 dark:text-gray-400 text-sm" 
                        style={{ display: 'none' }}
                      >
                        Immagine non caricabile
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default AdminAudioImages;