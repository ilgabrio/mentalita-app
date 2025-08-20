import React, { useState, useEffect } from 'react';
import { db } from '../config/firebase';
import { collection, getDocs, doc, updateDoc } from 'firebase/firestore';
import { ArrowLeft, Save, Eye, Image, FileText } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const AdminArticleImages = () => {
  const navigate = useNavigate();
  const [articles, setArticles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [imageUrls, setImageUrls] = useState({});

  useEffect(() => {
    const fetchArticles = async () => {
      try {
        // Prova prima dalla collezione articles
        let articlesList = [];
        try {
          const articlesSnapshot = await getDocs(collection(db, 'articles'));
          articlesList = articlesSnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data(),
            collection: 'articles'
          }));
        } catch (error) {
          console.log('Collezione articles non trovata:', error);
        }
        
        // Se non ci sono articoli, prova dalla collezione appArticles
        if (articlesList.length === 0) {
          try {
            const appArticlesSnapshot = await getDocs(collection(db, 'appArticles'));
            articlesList = appArticlesSnapshot.docs.map(doc => ({
              id: doc.id,
              ...doc.data(),
              collection: 'appArticles'
            }));
          } catch (error) {
            console.log('Collezione appArticles non trovata:', error);
          }
        }
        
        setArticles(articlesList);
        
        // Inizializza gli URL delle immagini
        const initialImageUrls = {};
        articlesList.forEach(article => {
          initialImageUrls[article.id] = article.imageUrl || '';
        });
        setImageUrls(initialImageUrls);
        
        console.log('📄 Articoli caricati per gestione immagini:', articlesList);
      } catch (error) {
        console.error('Errore caricamento articoli:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchArticles();
  }, []);

  const handleImageUrlChange = (articleId, url) => {
    setImageUrls(prev => ({
      ...prev,
      [articleId]: url
    }));
  };

  const handleSave = async (article) => {
    setSaving(true);
    try {
      const collectionName = article.collection || 'articles';
      const articleDoc = doc(db, collectionName, article.id);
      await updateDoc(articleDoc, {
        imageUrl: imageUrls[article.id]
      });
      
      // Aggiorna anche l'array locale
      setArticles(prev => prev.map(art => 
        art.id === article.id 
          ? { ...art, imageUrl: imageUrls[article.id] }
          : art
      ));
      
      alert('✅ Immagine salvata!');
    } catch (error) {
      console.error('Errore salvataggio:', error);
      alert('❌ Errore nel salvataggio');
    } finally {
      setSaving(false);
    }
  };

  const handlePreview = (articleId) => {
    navigate(`/articles/${articleId}`);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-green-500 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-300">Caricamento articoli...</p>
        </div>
      </div>
    );
  }

  if (articles.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <FileText className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
            Nessun articolo trovato
          </h2>
          <p className="text-gray-600 dark:text-gray-300 mb-4">
            Non ci sono articoli nel database da gestire.
          </p>
          <button
            onClick={() => navigate('/admin')}
            className="bg-green-500 hover:bg-green-600 text-white px-6 py-2 rounded-lg"
          >
            Torna all'Admin
          </button>
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
            onClick={() => navigate('/admin')}
            className="flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white mb-4"
          >
            <ArrowLeft className="h-5 w-5" />
            <span>Torna all'Admin</span>
          </button>
          
          <div className="flex items-center gap-3 mb-2">
            <Image className="h-6 w-6 text-green-500" />
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              Gestione Immagini Articoli
            </h1>
          </div>
          
          <p className="text-gray-600 dark:text-gray-300">
            Aggiungi o modifica le immagini per gli articoli. Inserisci l'URL completo dell'immagine.
          </p>
          
          <div className="mt-4 text-sm text-gray-500 dark:text-gray-400">
            Trovati <strong>{articles.length}</strong> articoli
          </div>
        </div>
      </div>

      <div className="px-4 py-6">
        <div className="space-y-4">
          {articles.map((article) => (
            <div key={article.id} className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
              <div className="flex flex-col lg:flex-row gap-6">
                {/* Info Articolo */}
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                      {article.title}
                    </h3>
                    <span className="text-xs px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded">
                      {article.collection}
                    </span>
                  </div>
                  
                  <p className="text-gray-600 dark:text-gray-300 text-sm mb-4">
                    {article.description?.substring(0, 150)}...
                  </p>
                  
                  {/* Input URL Immagine */}
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      URL Immagine
                    </label>
                    <input
                      type="url"
                      value={imageUrls[article.id] || ''}
                      onChange={(e) => handleImageUrlChange(article.id, e.target.value)}
                      placeholder="https://esempio.com/immagine.jpg"
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    />
                  </div>

                  {/* Azioni */}
                  <div className="flex gap-3">
                    <button
                      onClick={() => handleSave(article)}
                      disabled={saving}
                      className="bg-green-500 hover:bg-green-600 disabled:opacity-50 text-white px-4 py-2 rounded-lg flex items-center gap-2"
                    >
                      <Save className="h-4 w-4" />
                      {saving ? 'Salvataggio...' : 'Salva'}
                    </button>
                    
                    <button
                      onClick={() => handlePreview(article.id)}
                      className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded-lg flex items-center gap-2"
                    >
                      <Eye className="h-4 w-4" />
                      Anteprima
                    </button>
                  </div>
                </div>

                {/* Preview Immagine */}
                <div className="lg:w-64">
                  {imageUrls[article.id] && (
                    <div>
                      <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Anteprima:
                      </p>
                      <img 
                        src={imageUrls[article.id]} 
                        alt={article.title}
                        className="w-full max-w-64 h-36 object-cover rounded-lg shadow-md"
                        style={{ aspectRatio: '16/9' }}
                        onError={(e) => {
                          e.target.style.display = 'none';
                          e.target.nextSibling.style.display = 'block';
                        }}
                      />
                      <div 
                        className="w-full max-w-64 h-36 bg-gray-200 dark:bg-gray-700 rounded-lg flex items-center justify-center text-gray-500 dark:text-gray-400 text-sm" 
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

export default AdminArticleImages;