import React, { useState, useEffect } from 'react';
import { Save, Eye, Edit3, Plus, Trash2, MessageSquare, Users, CreditCard, Award, BookOpen, Video, Music, FileText, BarChart3, Target, Settings } from 'lucide-react';
import { db } from '../config/firebase';
import { doc, getDoc, setDoc, collection, getDocs, query, where, orderBy, addDoc, deleteDoc } from 'firebase/firestore';

const AdminPage = () => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [welcomeContent, setWelcomeContent] = useState({
    title: '',
    subtitle: '',
    description: '',
    steps: []
  });
  const [onboardingExercises, setOnboardingExercises] = useState([]);
  const [motivationalMessages, setMotivationalMessages] = useState([]);
  const [users, setUsers] = useState([]);
  const [payments, setPayments] = useState([]);
  const [questionnaires, setQuestionnaires] = useState([]);
  const [badges, setBadges] = useState([]);
  const [categories, setCategories] = useState([]);
  const [news, setNews] = useState([]);
  const [athleteProgress, setAthleteProgress] = useState([]);
  const [exerciseResponses, setExerciseResponses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      // Carica contenuto benvenuto
      const welcomeRef = doc(db, 'appSettings', 'welcome');
      const welcomeSnap = await getDoc(welcomeRef);
      
      if (welcomeSnap.exists()) {
        setWelcomeContent(welcomeSnap.data());
      }

      // Carica esercizi di onboarding
      const exercisesQuery = query(
        collection(db, 'exercises'),
        where('category', '==', 'Onboarding'),
        where('isPublished', '==', true),
        orderBy('order', 'asc')
      );
      
      const exercisesSnap = await getDocs(exercisesQuery);
      const exercises = [];
      exercisesSnap.forEach((doc) => {
        exercises.push({ id: doc.id, ...doc.data() });
      });
      
      setOnboardingExercises(exercises);

      // Carica messaggi motivazionali
      const messagesRef = collection(db, 'motivationalMessages');
      const messagesSnap = await getDocs(messagesRef);
      const messages = [];
      messagesSnap.forEach((doc) => {
        messages.push({ id: doc.id, ...doc.data() });
      });
      setMotivationalMessages(messages);

      // Carica utenti/atleti
      const usersRef = collection(db, 'users');
      const usersSnap = await getDocs(usersRef);
      const usersData = [];
      usersSnap.forEach((doc) => {
        usersData.push({ id: doc.id, ...doc.data() });
      });
      setUsers(usersData);

      // Carica pagamenti
      const paymentsRef = collection(db, 'payments');
      const paymentsSnap = await getDocs(paymentsRef);
      const paymentsData = [];
      paymentsSnap.forEach((doc) => {
        paymentsData.push({ id: doc.id, ...doc.data() });
      });
      setPayments(paymentsData);

      // Carica questionari
      const questionnairesRef = collection(db, 'questionnaires');
      const questionnairesSnap = await getDocs(questionnairesRef);
      const questionnairesData = [];
      questionnairesSnap.forEach((doc) => {
        questionnairesData.push({ id: doc.id, ...doc.data() });
      });
      setQuestionnaires(questionnairesData);

      // Carica badges
      const badgesRef = collection(db, 'badges');
      const badgesSnap = await getDocs(badgesRef);
      const badgesData = [];
      badgesSnap.forEach((doc) => {
        badgesData.push({ id: doc.id, ...doc.data() });
      });
      setBadges(badgesData);

      // Carica categorie
      const categoriesRef = collection(db, 'categories');
      const categoriesSnap = await getDocs(categoriesRef);
      const categoriesData = [];
      categoriesSnap.forEach((doc) => {
        categoriesData.push({ id: doc.id, ...doc.data() });
      });
      setCategories(categoriesData);

      // Carica news
      const newsRef = collection(db, 'news');
      const newsSnap = await getDocs(newsRef);
      const newsData = [];
      newsSnap.forEach((doc) => {
        newsData.push({ id: doc.id, ...doc.data() });
      });
      setNews(newsData);

      // Carica progressi atleti
      const progressRef = collection(db, 'athleteProgress');
      const progressSnap = await getDocs(progressRef);
      const progressData = [];
      progressSnap.forEach((doc) => {
        progressData.push({ id: doc.id, ...doc.data() });
      });
      setAthleteProgress(progressData);

      // Carica risposte esercizi
      const responsesRef = collection(db, 'exerciseResponses');
      const responsesSnap = await getDocs(responsesRef);
      const responsesData = [];
      responsesSnap.forEach((doc) => {
        responsesData.push({ id: doc.id, ...doc.data() });
      });
      setExerciseResponses(responsesData);
      
    } catch (error) {
      console.error('Errore nel caricamento dati admin:', error);
    } finally {
      setLoading(false);
    }
  };

  const saveWelcomeContent = async () => {
    setSaving(true);
    try {
      await setDoc(doc(db, 'appSettings', 'welcome'), welcomeContent);
      alert('Contenuto benvenuto salvato con successo!');
    } catch (error) {
      console.error('Errore nel salvataggio:', error);
      alert('Errore nel salvataggio');
    } finally {
      setSaving(false);
    }
  };

  const addStep = () => {
    setWelcomeContent(prev => ({
      ...prev,
      steps: [...prev.steps, { icon: 'CheckCircle', title: '', description: '' }]
    }));
  };

  const updateStep = (index, field, value) => {
    setWelcomeContent(prev => ({
      ...prev,
      steps: prev.steps.map((step, i) => 
        i === index ? { ...step, [field]: value } : step
      )
    }));
  };

  const removeStep = (index) => {
    setWelcomeContent(prev => ({
      ...prev,
      steps: prev.steps.filter((_, i) => i !== index)
    }));
  };

  const addMotivationalMessage = async () => {
    const text = prompt('Inserisci il messaggio motivazionale:');
    if (text && text.trim()) {
      try {
        await addDoc(collection(db, 'motivationalMessages'), {
          text: text.trim(),
          isActive: true,
          createdAt: new Date()
        });
        fetchData();
        alert('Messaggio aggiunto con successo!');
      } catch (error) {
        console.error('Errore nell\'aggiunta del messaggio:', error);
        alert('Errore nell\'aggiunta del messaggio');
      }
    }
  };

  const toggleMessageActive = async (messageId, currentStatus) => {
    try {
      await setDoc(doc(db, 'motivationalMessages', messageId), {
        isActive: !currentStatus
      }, { merge: true });
      fetchData();
    } catch (error) {
      console.error('Errore nell\'aggiornamento del messaggio:', error);
    }
  };

  const deleteMessage = async (messageId) => {
    if (confirm('Sei sicuro di voler eliminare questo messaggio?')) {
      try {
        await deleteDoc(doc(db, 'motivationalMessages', messageId));
        fetchData();
        alert('Messaggio eliminato con successo!');
      } catch (error) {
        console.error('Errore nell\'eliminazione del messaggio:', error);
        alert('Errore nell\'eliminazione del messaggio');
      }
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 shadow-sm">
        <div className="px-4 py-6">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Pannello Amministratore</h1>
          <p className="text-gray-600 dark:text-gray-300 mt-2">
            Gestisci il contenuto dell'app e l'esperienza di onboarding
          </p>
        </div>
      </div>

      <div className="px-4 py-6">
        {/* Navigation Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4 mb-8">
          {[
            { id: 'dashboard', label: 'Dashboard', icon: BarChart3 },
            { id: 'users', label: 'Utenti/Atleti', icon: Users },
            { id: 'payments', label: 'Pagamenti', icon: CreditCard },
            { id: 'questionnaires', label: 'Questionari', icon: FileText },
            { id: 'badges', label: 'Badge', icon: Award },
            { id: 'categories', label: 'Categorie', icon: BookOpen },
            { id: 'news', label: 'News', icon: Settings },
            { id: 'exercises', label: 'Esercizi', icon: Target },
            { id: 'videos', label: 'Video', icon: Video },
            { id: 'audio', label: 'Audio', icon: Music },
            { id: 'progress', label: 'Progressi', icon: BarChart3 },
            { id: 'responses', label: 'Risposte', icon: MessageSquare },
            { id: 'welcome', label: 'Benvenuto', icon: Settings },
            { id: 'onboarding', label: 'Onboarding', icon: Target },
            { id: 'messages', label: 'Messaggi', icon: MessageSquare }
          ].map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setActiveTab(id)}
              className={`p-4 rounded-lg border-2 transition-all duration-200 ${
                activeTab === id
                  ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400'
                  : 'border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500 text-gray-600 dark:text-gray-300'
              }`}
            >
              <Icon className="h-6 w-6 mx-auto mb-2" />
              <span className="text-sm font-medium">{label}</span>
            </button>
          ))}
        </div>

        {/* Dashboard Tab */}
        {activeTab === 'dashboard' && (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">
              Dashboard Amministratore
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              <div className="bg-blue-50 dark:bg-blue-900/20 p-6 rounded-lg">
                <div className="flex items-center">
                  <Users className="h-8 w-8 text-blue-600 dark:text-blue-400" />
                  <div className="ml-4">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{users.length}</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-300">Utenti Totali</p>
                  </div>
                </div>
              </div>
              
              <div className="bg-green-50 dark:bg-green-900/20 p-6 rounded-lg">
                <div className="flex items-center">
                  <CreditCard className="h-8 w-8 text-green-600 dark:text-green-400" />
                  <div className="ml-4">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{payments.length}</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-300">Pagamenti</p>
                  </div>
                </div>
              </div>
              
              <div className="bg-yellow-50 dark:bg-yellow-900/20 p-6 rounded-lg">
                <div className="flex items-center">
                  <Award className="h-8 w-8 text-yellow-600 dark:text-yellow-400" />
                  <div className="ml-4">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{badges.length}</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-300">Badge Creati</p>
                  </div>
                </div>
              </div>
              
              <div className="bg-purple-50 dark:bg-purple-900/20 p-6 rounded-lg">
                <div className="flex items-center">
                  <Target className="h-8 w-8 text-purple-600 dark:text-purple-400" />
                  <div className="ml-4">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{exerciseResponses.length}</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-300">Risposte Esercizi</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="text-center py-8">
              <p className="text-gray-600 dark:text-gray-300">
                Panoramica delle collezioni Firebase essenziali. Tutte le collezioni sono accessibili e i dati sono al sicuro.
              </p>
            </div>
          </div>
        )}

        {/* Users Tab */}
        {activeTab === 'users' && (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">
              Gestione Utenti/Atleti
            </h2>
            
            <div className="text-center py-8">
              <Users className="h-16 w-16 mx-auto mb-4 text-gray-400" />
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                Collezione Utenti: {users.length} elementi
              </h3>
              <p className="text-gray-500 dark:text-gray-400">
                Gestione profili atleti, progressi e abbonamenti
              </p>
            </div>
          </div>
        )}

        {/* Payments Tab */}
        {activeTab === 'payments' && (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">
              Gestione Pagamenti Stripe
            </h2>
            
            <div className="text-center py-8">
              <CreditCard className="h-16 w-16 mx-auto mb-4 text-gray-400" />
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                Transazioni: {payments.length} elementi
              </h3>
              <p className="text-gray-500 dark:text-gray-400">
                Gestione abbonamenti, pagamenti e fatturazione
              </p>
            </div>
          </div>
        )}

        {/* Questionnaires Tab */}
        {activeTab === 'questionnaires' && (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">
              Gestione Questionari
            </h2>
            
            <div className="text-center py-8">
              <FileText className="h-16 w-16 mx-auto mb-4 text-gray-400" />
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                Questionari: {questionnaires.length} elementi
              </h3>
              <p className="text-gray-500 dark:text-gray-400">
                Questionari di ingresso e valutazione per gli atleti
              </p>
            </div>
          </div>
        )}

        {/* Badges Tab */}
        {activeTab === 'badges' && (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">
              Sistema Badge/Achievement
            </h2>
            
            <div className="text-center py-8">
              <Award className="h-16 w-16 mx-auto mb-4 text-gray-400" />
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                Badge: {badges.length} elementi
              </h3>
              <p className="text-gray-500 dark:text-gray-400">
                Sistema di ricompense e achievement per motivare gli atleti
              </p>
            </div>
          </div>
        )}

        {/* Categories Tab */}
        {activeTab === 'categories' && (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">
              Gestione Categorie
            </h2>
            
            <div className="text-center py-8">
              <BookOpen className="h-16 w-16 mx-auto mb-4 text-gray-400" />
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                Categorie: {categories.length} elementi
              </h3>
              <p className="text-gray-500 dark:text-gray-400">
                Categorie per organizzare esercizi, video e contenuti
              </p>
            </div>
          </div>
        )}

        {/* News Tab */}
        {activeTab === 'news' && (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">
              Gestione News/Novità
            </h2>
            
            <div className="text-center py-8">
              <Settings className="h-16 w-16 mx-auto mb-4 text-gray-400" />
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                News: {news.length} elementi
              </h3>
              <p className="text-gray-500 dark:text-gray-400">
                Novità, aggiornamenti e comunicazioni per gli atleti
              </p>
            </div>
          </div>
        )}

        {/* Exercises Tab */}
        {activeTab === 'exercises' && (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">
              Gestione Esercizi
            </h2>
            
            <div className="text-center py-8">
              <Target className="h-16 w-16 mx-auto mb-4 text-gray-400" />
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                Esercizi Disponibili
              </h3>
              <p className="text-gray-500 dark:text-gray-400">
                Creazione e monitoraggio esercizi di mental training
              </p>
            </div>
          </div>
        )}

        {/* Videos Tab */}
        {activeTab === 'videos' && (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">
              Gestione Video
            </h2>
            
            <div className="text-center py-8">
              <Video className="h-16 w-16 mx-auto mb-4 text-gray-400" />
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                Biblioteca Video
              </h3>
              <p className="text-gray-500 dark:text-gray-400">
                Upload e gestione video didattici e motivazionali
              </p>
            </div>
          </div>
        )}

        {/* Audio Tab */}
        {activeTab === 'audio' && (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">
              Gestione Audio & Categorie Audio
            </h2>
            
            <div className="text-center py-8">
              <Music className="h-16 w-16 mx-auto mb-4 text-gray-400" />
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                Biblioteca Audio
              </h3>
              <p className="text-gray-500 dark:text-gray-400">
                Audio per meditazione, rilassamento e mental training
              </p>
            </div>
          </div>
        )}

        {/* Progress Tab */}
        {activeTab === 'progress' && (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">
              Progressi Atleti
            </h2>
            
            <div className="text-center py-8">
              <BarChart3 className="h-16 w-16 mx-auto mb-4 text-gray-400" />
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                Dati Progresso: {athleteProgress.length} elementi
              </h3>
              <p className="text-gray-500 dark:text-gray-400">
                Monitoraggio e analisi del progresso degli atleti
              </p>
            </div>
          </div>
        )}

        {/* Responses Tab */}
        {activeTab === 'responses' && (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">
              Risposte Esercizi
            </h2>
            
            <div className="text-center py-8">
              <MessageSquare className="h-16 w-16 mx-auto mb-4 text-gray-400" />
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                Risposte: {exerciseResponses.length} elementi
              </h3>
              <p className="text-gray-500 dark:text-gray-400">
                Risposte e feedback degli atleti agli esercizi
              </p>
            </div>
          </div>
        )}

        {/* Welcome Content Tab */}
        {activeTab === 'welcome' && (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                Contenuto Pagina Benvenuto
              </h2>
              <button
                onClick={saveWelcomeContent}
                disabled={saving}
                className="bg-blue-500 hover:bg-blue-600 disabled:opacity-50 text-white px-4 py-2 rounded-lg flex items-center transition-colors"
              >
                <Save className="h-4 w-4 mr-2" />
                {saving ? 'Salvando...' : 'Salva'}
              </button>
            </div>

            <div className="space-y-6">
              {/* Titolo */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Titolo Principale
                </label>
                <input
                  type="text"
                  value={welcomeContent.title}
                  onChange={(e) => setWelcomeContent(prev => ({ ...prev, title: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                  placeholder="es. Benvenuto in Be Water Plus"
                />
              </div>

              {/* Sottotitolo */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Sottotitolo
                </label>
                <input
                  type="text"
                  value={welcomeContent.subtitle}
                  onChange={(e) => setWelcomeContent(prev => ({ ...prev, subtitle: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                  placeholder="es. La tua forza mentale nello sport"
                />
              </div>

              {/* Descrizione */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Descrizione
                </label>
                <textarea
                  value={welcomeContent.description}
                  onChange={(e) => setWelcomeContent(prev => ({ ...prev, description: e.target.value }))}
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                  placeholder="Descrizione dell'app e dei suoi benefici..."
                />
              </div>

              {/* Steps */}
              <div>
                <div className="flex justify-between items-center mb-4">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Passi dell'Onboarding
                  </label>
                  <button
                    onClick={addStep}
                    className="bg-green-500 hover:bg-green-600 text-white px-3 py-1 rounded-md flex items-center text-sm transition-colors"
                  >
                    <Plus className="h-4 w-4 mr-1" />
                    Aggiungi Passo
                  </button>
                </div>

                <div className="space-y-4">
                  {welcomeContent.steps?.map((step, index) => (
                    <div key={index} className="border border-gray-200 dark:border-gray-600 rounded-lg p-4">
                      <div className="flex justify-between items-start mb-3">
                        <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">
                          Passo {index + 1}
                        </h4>
                        <button
                          onClick={() => removeStep(index)}
                          className="text-red-500 hover:text-red-700 transition-colors"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                          <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                            Icona
                          </label>
                          <select
                            value={step.icon}
                            onChange={(e) => updateStep(index, 'icon', e.target.value)}
                            className="w-full px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                          >
                            <option value="User">User</option>
                            <option value="Brain">Brain</option>
                            <option value="Target">Target</option>
                            <option value="CheckCircle">CheckCircle</option>
                          </select>
                        </div>
                        
                        <div>
                          <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                            Titolo
                          </label>
                          <input
                            type="text"
                            value={step.title}
                            onChange={(e) => updateStep(index, 'title', e.target.value)}
                            className="w-full px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                            placeholder="Titolo del passo"
                          />
                        </div>
                        
                        <div>
                          <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                            Descrizione
                          </label>
                          <input
                            type="text"
                            value={step.description}
                            onChange={(e) => updateStep(index, 'description', e.target.value)}
                            className="w-full px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                            placeholder="Descrizione del passo"
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Onboarding Exercises Tab */}
        {activeTab === 'onboarding' && (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                Esercizi per l'Onboarding
              </h2>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Esercizi della categoria "Onboarding" mostrati ai nuovi utenti
              </p>
            </div>

            {onboardingExercises.length > 0 ? (
              <div className="space-y-4">
                {onboardingExercises.map((exercise) => (
                  <div key={exercise.id} className="border border-gray-200 dark:border-gray-600 rounded-lg p-4">
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
                          {exercise.title}
                        </h3>
                        <p className="text-sm text-gray-600 dark:text-gray-300 mb-2">
                          {exercise.description}
                        </p>
                        <div className="flex items-center space-x-4 text-xs text-gray-500 dark:text-gray-400">
                          <span>Ordine: {exercise.order}</span>
                          <span>Durata: {exercise.duration}</span>
                          <span>Livello: {exercise.difficulty}</span>
                        </div>
                      </div>
                      <div className="flex space-x-2">
                        <button className="p-2 text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded transition-colors">
                          <Eye className="h-4 w-4" />
                        </button>
                        <button className="p-2 text-gray-500 hover:bg-gray-50 dark:hover:bg-gray-700 rounded transition-colors">
                          <Edit3 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <div className="text-gray-400 dark:text-gray-600 mb-4">
                  <Edit3 className="h-16 w-16 mx-auto opacity-50" />
                </div>
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                  Nessun esercizio di onboarding
                </h3>
                <p className="text-gray-500 dark:text-gray-400 mb-4">
                  Crea esercizi con categoria "Onboarding" per mostrarli ai nuovi utenti
                </p>
                <p className="text-sm text-gray-400 dark:text-gray-500">
                  Gli esercizi devono essere pubblicati e avere isPublished = true
                </p>
              </div>
            )}
          </div>
        )}

        {/* Motivational Messages Tab */}
        {activeTab === 'messages' && (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                Messaggi Motivazionali
              </h2>
              <button
                onClick={addMotivationalMessage}
                className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg flex items-center transition-colors"
              >
                <Plus className="h-4 w-4 mr-2" />
                Aggiungi Messaggio
              </button>
            </div>

            <div className="mb-4">
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Questi messaggi appariranno casualmente nelle pagine degli esercizi per motivare gli atleti.
              </p>
            </div>

            {motivationalMessages.length > 0 ? (
              <div className="space-y-4">
                {motivationalMessages.map((message) => (
                  <div key={message.id} className="border border-gray-200 dark:border-gray-600 rounded-lg p-4">
                    <div className="flex justify-between items-start">
                      <div className="flex-1 pr-4">
                        <p className="text-gray-900 dark:text-white mb-2">
                          {message.text}
                        </p>
                        <div className="flex items-center space-x-4">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            message.isActive 
                              ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400'
                              : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
                          }`}>
                            {message.isActive ? 'Attivo' : 'Disattivato'}
                          </span>
                          {message.createdAt && (
                            <span className="text-xs text-gray-500 dark:text-gray-400">
                              Creato: {new Date(message.createdAt.seconds * 1000).toLocaleDateString()}
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="flex space-x-2">
                        <button
                          onClick={() => toggleMessageActive(message.id, message.isActive)}
                          className={`p-2 rounded transition-colors ${
                            message.isActive
                              ? 'text-orange-500 hover:bg-orange-50 dark:hover:bg-orange-900/20'
                              : 'text-green-500 hover:bg-green-50 dark:hover:bg-green-900/20'
                          }`}
                          title={message.isActive ? 'Disattiva' : 'Attiva'}
                        >
                          <Eye className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => deleteMessage(message.id)}
                          className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-colors"
                          title="Elimina"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <div className="text-gray-400 dark:text-gray-600 mb-4">
                  <MessageSquare className="h-16 w-16 mx-auto opacity-50" />
                </div>
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                  Nessun messaggio motivazionale
                </h3>
                <p className="text-gray-500 dark:text-gray-400 mb-4">
                  Crea dei messaggi motivazionali per coinvolgere gli atleti
                </p>
                <button
                  onClick={addMotivationalMessage}
                  className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg transition-colors"
                >
                  Crea il primo messaggio
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminPage;