import React, { useState, useEffect } from 'react';
import { 
  doc, 
  getDoc, 
  setDoc,
  collection,
  getDocs,
  updateDoc,
  deleteDoc,
  addDoc
} from 'firebase/firestore';
import { db } from '../../../config/firebase';
import { 
  Settings, 
  Save, 
  Plus,
  Edit3,
  Trash2,
  ArrowUp,
  ArrowDown,
  Eye,
  EyeOff,
  FileText,
  Image,
  Video,
  ChevronRight,
  Palette,
  Type,
  Layout
} from 'lucide-react';

const OnboardingFlowManager = () => {
  const [pages, setPages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editingPage, setEditingPage] = useState(null);
  const [showPageModal, setShowPageModal] = useState(false);
  
  const [stepForm, setStepForm] = useState({
    title: '',
    description: '',
    videoUrl: '',
    exerciseId: '',
    articleId: '',
    order: 0,
    isActive: true,
    completionMessage: 'Ottimo lavoro! Sei pronto per il prossimo passo.'
  });

  // State for loading exercises and articles
  const [exercises, setExercises] = useState([]);
  const [articles, setArticles] = useState([]);

  const pageTypes = [
    { value: 'text', label: 'Solo Testo', icon: FileText },
    { value: 'image', label: 'Con Immagine', icon: Image },
    { value: 'video', label: 'Con Video', icon: Video },
    { value: 'mixed', label: 'Misto', icon: Layout }
  ];

  useEffect(() => {
    fetchSteps();
    fetchExercises();
    fetchArticles();
  }, []);

  const fetchSteps = async () => {
    try {
      setLoading(true);
      const stepsSnapshot = await getDocs(collection(db, 'onboardingSteps'));
      const stepsData = [];
      
      stepsSnapshot.forEach((doc) => {
        stepsData.push({
          id: doc.id,
          ...doc.data()
        });
      });

      // Sort by order
      stepsData.sort((a, b) => (a.order || 0) - (b.order || 0));
      
      setPages(stepsData); // Keep using 'pages' state for consistency
    } catch (error) {
      console.error('Error fetching onboarding steps:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchExercises = async () => {
    try {
      const exercisesSnapshot = await getDocs(collection(db, 'exercises'));
      const exercisesData = [];
      
      exercisesSnapshot.forEach((doc) => {
        const data = doc.data();
        exercisesData.push({
          id: doc.id,
          title: data.title || 'Esercizio senza titolo',
          category: data.category || 'Generale'
        });
      });

      setExercises(exercisesData);
    } catch (error) {
      console.error('Error fetching exercises:', error);
    }
  };

  const fetchArticles = async () => {
    try {
      const articlesSnapshot = await getDocs(collection(db, 'articles'));
      const articlesData = [];
      
      articlesSnapshot.forEach((doc) => {
        const data = doc.data();
        articlesData.push({
          id: doc.id,
          title: data.title || 'Articolo senza titolo',
          category: data.category || 'Generale'
        });
      });

      setArticles(articlesData);
    } catch (error) {
      console.error('Error fetching articles:', error);
    }
  };

  const openStepModal = (step = null) => {
    if (step) {
      setEditingPage(step.id);
      setStepForm({
        title: step.title || '',
        description: step.description || '',
        videoUrl: step.videoUrl || '',
        exerciseId: step.exerciseId || '',
        articleId: step.articleId || '',
        order: step.order || 0,
        isActive: step.isActive !== undefined ? step.isActive : true,
        completionMessage: step.completionMessage || 'Ottimo lavoro! Sei pronto per il prossimo passo.'
      });
    } else {
      setEditingPage(null);
      const maxOrder = Math.max(...pages.map(p => p.order || 0), -1);
      setStepForm({
        title: '',
        description: '',
        videoUrl: '',
        exerciseId: '',
        articleId: '',
        order: maxOrder + 1,
        isActive: true,
        completionMessage: 'Ottimo lavoro! Sei pronto per il prossimo passo.'
      });
    }
    setShowPageModal(true);
  };

  const closeStepModal = () => {
    setShowPageModal(false);
    setEditingPage(null);
    setStepForm({
      title: '',
      description: '',
      videoUrl: '',
      exerciseId: '',
      articleId: '',
      order: 0,
      isActive: true,
      completionMessage: 'Ottimo lavoro! Sei pronto per il prossimo passo.'
    });
  };

  const handleSaveStep = async () => {
    if (!stepForm.title.trim()) {
      alert('Il titolo è obbligatorio');
      return;
    }

    if (!stepForm.videoUrl.trim()) {
      alert('L\'URL del video è obbligatorio');
      return;
    }

    if (!stepForm.exerciseId) {
      alert('Seleziona un esercizio');
      return;
    }

    setSaving(true);
    try {
      const stepData = {
        ...stepForm,
        updatedAt: new Date()
      };

      if (editingPage) {
        await updateDoc(doc(db, 'onboardingSteps', editingPage), stepData);
      } else {
        await addDoc(collection(db, 'onboardingSteps'), {
          ...stepData,
          createdAt: new Date()
        });
      }

      await fetchSteps();
      closeStepModal();
      alert(editingPage ? 'Passo aggiornato!' : 'Passo creato!');
    } catch (error) {
      console.error('Error saving step:', error);
      alert('Errore nel salvataggio');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteStep = async (stepId) => {
    if (!confirm('Sei sicuro di voler eliminare questo passo?')) return;

    try {
      await deleteDoc(doc(db, 'onboardingSteps', stepId));
      await fetchSteps();
      alert('Passo eliminato');
    } catch (error) {
      console.error('Error deleting step:', error);
      alert('Errore nell\'eliminazione');
    }
  };

  const toggleStepStatus = async (step) => {
    try {
      await updateDoc(doc(db, 'onboardingSteps', step.id), {
        isActive: !step.isActive,
        updatedAt: new Date()
      });
      await fetchSteps();
    } catch (error) {
      console.error('Error toggling step status:', error);
    }
  };

  const moveStepOrder = async (step, direction) => {
    const currentIndex = pages.findIndex(p => p.id === step.id);
    const newIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;
    
    if (newIndex < 0 || newIndex >= pages.length) return;
    
    const otherStep = pages[newIndex];
    
    try {
      await updateDoc(doc(db, 'onboardingSteps', step.id), {
        order: otherStep.order || newIndex,
        updatedAt: new Date()
      });
      
      await updateDoc(doc(db, 'onboardingSteps', otherStep.id), {
        order: step.order || currentIndex,
        updatedAt: new Date()
      });
      
      await fetchSteps();
    } catch (error) {
      console.error('Error reordering steps:', error);
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
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Settings className="h-6 w-6 text-indigo-600" />
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
              Gestione Passi Onboarding Interattivo
            </h2>
          </div>
          
          <button
            onClick={() => openStepModal()}
            className="flex items-center space-x-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
          >
            <Plus className="h-4 w-4" />
            <span>Nuovo Passo</span>
          </button>
        </div>
        
        <p className="mt-2 text-gray-600 dark:text-gray-400">
          Crea un percorso di 7 passi con video, esercizi pratici e articoli per introdurre gradualmente gli atleti
        </p>
      </div>

      {/* Pages List */}
      <div className="p-6">
        {pages.length === 0 ? (
          <div className="text-center py-12">
            <Settings className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500 dark:text-gray-400">
              Nessun passo di onboarding configurato
            </p>
            <p className="text-sm text-gray-400 dark:text-gray-500 mb-4">
              Crea fino a 7 passi interattivi con video, esercizi e articoli
            </p>
            <button
              onClick={() => openStepModal()}
              className="mt-4 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
            >
              Crea il primo passo
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {pages.map((step, index) => {
              const exercise = exercises.find(e => e.id === step.exerciseId);
              const article = articles.find(a => a.id === step.articleId);
              
              return (
                <div
                  key={step.id}
                  className={`border rounded-lg p-4 ${
                    step.isActive
                      ? 'border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700'
                      : 'border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 opacity-60'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-3">
                        <span className="text-sm font-bold text-indigo-600 dark:text-indigo-400">
                          PASSO {index + 1}
                        </span>
                        <span className={`px-2 py-1 text-xs rounded-full ${
                          step.isActive
                            ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300'
                            : 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400'
                        }`}>
                          {step.isActive ? 'Attivo' : 'Inattivo'}
                        </span>
                      </div>
                      
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                        {step.title}
                      </h3>
                      
                      {step.description && (
                        <p className="text-sm text-gray-600 dark:text-gray-300 mb-3">
                          {step.description}
                        </p>
                      )}
                      
                      <div className="space-y-2">
                        {/* Video */}
                        <div className="flex items-center gap-2 text-sm">
                          <Video className="h-4 w-4 text-red-500" />
                          <span className="text-gray-600 dark:text-gray-300">
                            Video: {step.videoUrl ? 'Configurato' : 'Mancante'}
                          </span>
                        </div>
                        
                        {/* Exercise */}
                        <div className="flex items-center gap-2 text-sm">
                          <Brain className="h-4 w-4 text-blue-500" />
                          <span className="text-gray-600 dark:text-gray-300">
                            Esercizio: {exercise ? exercise.title : 'Non selezionato'}
                          </span>
                        </div>
                        
                        {/* Article */}
                        <div className="flex items-center gap-2 text-sm">
                          <FileText className="h-4 w-4 text-green-500" />
                          <span className="text-gray-600 dark:text-gray-300">
                            Articolo: {article ? article.title : 'Opzionale'}
                          </span>
                        </div>
                      </div>
                    </div>
                  
                    <div className="flex items-center space-x-2 ml-4">
                      {/* Move Up */}
                      <button
                        onClick={() => moveStepOrder(step, 'up')}
                        disabled={index === 0}
                        className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 disabled:opacity-30"
                        title="Sposta su"
                      >
                        <ArrowUp className="h-4 w-4" />
                      </button>
                      
                      {/* Move Down */}
                      <button
                        onClick={() => moveStepOrder(step, 'down')}
                        disabled={index === pages.length - 1}
                        className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 disabled:opacity-30"
                        title="Sposta giù"
                      >
                        <ArrowDown className="h-4 w-4" />
                      </button>
                      
                      {/* Toggle Active */}
                      <button
                        onClick={() => toggleStepStatus(step)}
                        className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                        title={step.isActive ? 'Disattiva passo' : 'Attiva passo'}
                      >
                        {step.isActive ? (
                          <Eye className="h-4 w-4" />
                        ) : (
                          <EyeOff className="h-4 w-4" />
                        )}
                      </button>
                      
                      {/* Edit */}
                      <button
                        onClick={() => openStepModal(step)}
                        className="p-2 text-indigo-600 hover:text-indigo-700 dark:text-indigo-400"
                        title="Modifica passo"
                      >
                        <Edit3 className="h-4 w-4" />
                      </button>
                      
                      {/* Delete */}
                      <button
                        onClick={() => handleDeleteStep(step.id)}
                        className="p-2 text-red-600 hover:text-red-700 dark:text-red-400"
                        title="Elimina passo"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Step Modal */}
      {showPageModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200 dark:border-gray-700">
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                {editingPage ? 'Modifica Passo' : 'Nuovo Passo'} Onboarding
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                Configura video introduttivo, esercizio pratico e articolo di approfondimento
              </p>
            </div>

            <div className="p-6 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Title */}
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Titolo del Passo *
                  </label>
                  <input
                    type="text"
                    value={stepForm.title}
                    onChange={(e) => setStepForm({ ...stepForm, title: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 dark:bg-gray-700 dark:text-white"
                    placeholder="Es: Impara la Concentrazione"
                  />
                </div>

                {/* Description */}
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Descrizione del Passo
                  </label>
                  <textarea
                    value={stepForm.description}
                    onChange={(e) => setStepForm({ ...stepForm, description: e.target.value })}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 dark:bg-gray-700 dark:text-white"
                    placeholder="Spiega cosa imparerà l'atleta in questo passo..."
                  />
                </div>

                {/* Video URL */}
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    URL Video YouTube *
                  </label>
                  <input
                    type="text"
                    value={stepForm.videoUrl}
                    onChange={(e) => setStepForm({ ...stepForm, videoUrl: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 dark:bg-gray-700 dark:text-white"
                    placeholder="https://www.youtube.com/watch?v=..."
                  />
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    Video introduttivo che spiega il concetto del passo
                  </p>
                </div>

                {/* Content */}
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Contenuto principale
                  </label>
                  <textarea
                    value={pageForm.content}
                    onChange={(e) => setPageForm({ ...pageForm, content: e.target.value })}
                    rows={6}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 dark:bg-gray-700 dark:text-white"
                    placeholder="Contenuto dettagliato della pagina..."
                  />
                </div>

                {/* Page Type */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Tipo di Pagina
                  </label>
                  <select
                    value={pageForm.pageType}
                    onChange={(e) => setPageForm({ ...pageForm, pageType: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 dark:bg-gray-700 dark:text-white"
                  >
                    {pageTypes.map(type => (
                      <option key={type.value} value={type.value}>
                        {type.label}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Button Text */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Testo Pulsante
                  </label>
                  <input
                    type="text"
                    value={pageForm.buttonText}
                    onChange={(e) => setPageForm({ ...pageForm, buttonText: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 dark:bg-gray-700 dark:text-white"
                    placeholder="Es: Continua"
                  />
                </div>

                {/* Media URLs based on page type */}
                {(pageForm.pageType === 'image' || pageForm.pageType === 'mixed') && (
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      URL Immagine
                    </label>
                    <input
                      type="text"
                      value={pageForm.imageUrl}
                      onChange={(e) => setPageForm({ ...pageForm, imageUrl: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 dark:bg-gray-700 dark:text-white"
                      placeholder="https://..."
                    />
                  </div>
                )}

                {(pageForm.pageType === 'video' || pageForm.pageType === 'mixed') && (
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      URL Video (YouTube)
                    </label>
                    <input
                      type="text"
                      value={pageForm.videoUrl}
                      onChange={(e) => setPageForm({ ...pageForm, videoUrl: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 dark:bg-gray-700 dark:text-white"
                      placeholder="https://youtube.com/..."
                    />
                  </div>
                )}

                {/* Colors Section */}
                <div className="md:col-span-2 border-t pt-4">
                  <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-4 flex items-center gap-2">
                    <Palette className="h-4 w-4" />
                    Personalizzazione Colori
                  </h4>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {/* Background Color */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Colore Sfondo
                      </label>
                      <div className="flex gap-2">
                        <input
                          type="color"
                          value={pageForm.backgroundColor}
                          onChange={(e) => setPageForm({ ...pageForm, backgroundColor: e.target.value })}
                          className="w-12 h-10 border border-gray-300 rounded cursor-pointer"
                        />
                        <input
                          type="text"
                          value={pageForm.backgroundColor}
                          onChange={(e) => setPageForm({ ...pageForm, backgroundColor: e.target.value })}
                          className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 dark:bg-gray-700 dark:text-white"
                        />
                      </div>
                    </div>

                    {/* Text Color */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Colore Testo
                      </label>
                      <div className="flex gap-2">
                        <input
                          type="color"
                          value={pageForm.textColor}
                          onChange={(e) => setPageForm({ ...pageForm, textColor: e.target.value })}
                          className="w-12 h-10 border border-gray-300 rounded cursor-pointer"
                        />
                        <input
                          type="text"
                          value={pageForm.textColor}
                          onChange={(e) => setPageForm({ ...pageForm, textColor: e.target.value })}
                          className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 dark:bg-gray-700 dark:text-white"
                        />
                      </div>
                    </div>

                    {/* Button Color */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Colore Pulsante
                      </label>
                      <div className="flex gap-2">
                        <input
                          type="color"
                          value={pageForm.buttonColor}
                          onChange={(e) => setPageForm({ ...pageForm, buttonColor: e.target.value })}
                          className="w-12 h-10 border border-gray-300 rounded cursor-pointer"
                        />
                        <input
                          type="text"
                          value={pageForm.buttonColor}
                          onChange={(e) => setPageForm({ ...pageForm, buttonColor: e.target.value })}
                          className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 dark:bg-gray-700 dark:text-white"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Order and Status */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Ordine
                  </label>
                  <input
                    type="number"
                    value={pageForm.order}
                    onChange={(e) => setPageForm({ ...pageForm, order: parseInt(e.target.value) || 0 })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 dark:bg-gray-700 dark:text-white"
                  />
                </div>

                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="isActive"
                    checked={pageForm.isActive}
                    onChange={(e) => setPageForm({ ...pageForm, isActive: e.target.checked })}
                    className="w-4 h-4 text-indigo-600 rounded focus:ring-indigo-500"
                  />
                  <label htmlFor="isActive" className="ml-2 text-sm text-gray-700 dark:text-gray-300">
                    Pagina attiva
                  </label>
                </div>
              </div>
            </div>

            <div className="p-6 border-t border-gray-200 dark:border-gray-700 flex justify-end space-x-3">
              <button
                onClick={closePageModal}
                className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
              >
                Annulla
              </button>
              <button
                onClick={handleSavePage}
                disabled={saving}
                className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 flex items-center space-x-2"
              >
                {saving ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    <span>Salvataggio...</span>
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4" />
                    <span>{editingPage ? 'Aggiorna' : 'Crea'} Pagina</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default OnboardingFlowManager;