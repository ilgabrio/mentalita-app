import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  LogOut, 
  User, 
  Settings, 
  Shield, 
  Crown, 
  Star, 
  Award, 
  History, 
  Calendar, 
  Clock, 
  CheckCircle, 
  Target,
  Download,
  Brain,
  BookOpen,
  X,
  Eye,
  FileText,
  Zap,
  ChevronRight,
  Sparkles,
  MessageCircle,
  Trophy,
  ClipboardList,
  RefreshCw
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { doc, getDoc, collection, query, where, getDocs, orderBy, limit } from 'firebase/firestore';
import { db } from '../config/firebase';
import jsPDF from 'jspdf';
import 'jspdf-autotable';

const ProfilePage = () => {
  const { currentUser, userProfile, isAdmin, logout } = useAuth();
  const [userStats, setUserStats] = useState(null);
  const [badges, setBadges] = useState([]);
  const [exerciseHistory, setExerciseHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showFullHistory, setShowFullHistory] = useState(false);
  const [selectedExercise, setSelectedExercise] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [exerciseDetails, setExerciseDetails] = useState({});
  const [questionnaires, setQuestionnaires] = useState([]);
  const [showQuestionnaireModal, setShowQuestionnaireModal] = useState(false);
  const [selectedQuestionnaire, setSelectedQuestionnaire] = useState(null);
  const navigate = useNavigate();

  // Helper function to safely format dates
  const formatDate = (dateValue, options = { day: '2-digit', month: '2-digit', year: '2-digit' }) => {
    if (!dateValue) return 'N/A';
    
    let date;
    if (dateValue.toDate) {
      // Firebase Timestamp
      date = dateValue.toDate();
    } else if (dateValue instanceof Date) {
      // Already a Date object
      date = dateValue;
    } else if (typeof dateValue === 'string' || typeof dateValue === 'number') {
      // String or number timestamp
      date = new Date(dateValue);
    } else {
      return 'N/A';
    }
    
    // Check if date is valid
    if (isNaN(date.getTime())) {
      return 'N/A';
    }
    
    return date.toLocaleDateString('it-IT', options);
  };

  // Controlla se l'utente ha completato l'onboarding
  const isOnboardingCompleted = userProfile?.onboardingCompleted === true || 
                               localStorage.getItem('onboardingCompleted') === 'true';
  
  // Controlla se ha completato il questionario
  const hasCompletedQuestionnaire = userProfile?.initialQuestionnaireCompleted === true ||
                                   localStorage.getItem('initialQuestionnaireCompleted') === 'true';

  useEffect(() => {
    const fetchUserData = async () => {
      if (!currentUser) return;

      try {
        // Get user badges
        const badgesQuery = query(
          collection(db, 'userBadges'),
          where('userId', '==', currentUser.uid)
        );
        const badgesSnapshot = await getDocs(badgesQuery);
        setBadges(badgesSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));

        // Get user stats if available
        const statsDoc = await getDoc(doc(db, 'userStats', currentUser.uid));
        if (statsDoc.exists()) {
          setUserStats(statsDoc.data());
        }

        // Get exercise history (completed responses)
        const historyQuery = query(
          collection(db, 'exerciseResponses'),
          where('userId', '==', currentUser.uid),
          orderBy('completedAt', 'desc'),
          limit(50) // Get last 50 completed exercises
        );
        const historySnapshot = await getDocs(historyQuery);
        const exerciseData = historySnapshot.docs.map(doc => {
          const data = doc.data();
          return {
            id: doc.id,
            exerciseId: data.exerciseId,
            exerciseTitle: data.exerciseTitle,
            completedAt: data.completedAt?.toDate ? data.completedAt.toDate() : new Date(data.completedAt),
            timeSpent: data.timeSpent, // in seconds
            responses: data.answers || data.responses, // answers è il campo corretto dal salvataggio
            sessionId: data.sessionId,
            userId: data.userId
          };
        });
        setExerciseHistory(exerciseData);

        // Get user questionnaires
        const questionnairesQuery = query(
          collection(db, 'questionnaires'),
          where('userId', '==', currentUser.uid),
          orderBy('completedAt', 'desc')
        );
        const questionnairesSnapshot = await getDocs(questionnairesQuery);
        const questionnaireData = questionnairesSnapshot.docs.map(doc => {
          const data = doc.data();
          return {
            id: doc.id,
            type: data.type,
            title: data.title || (data.type === 'initial' ? 'Questionario Iniziale' : data.type === 'premium' ? 'Questionario Premium' : 'Questionario Personalizzato'),
            completedAt: data.completedAt?.toDate ? data.completedAt.toDate() : new Date(data.completedAt),
            responses: data.responses || data.answers,
            templateId: data.templateId,
            ...data
          };
        });
        setQuestionnaires(questionnaireData);
      } catch (error) {
        console.error('Error fetching user data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();
  }, [currentUser]);

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login', { replace: true });
    } catch (error) {
      console.error('Errore durante il logout:', error);
    }
  };

  const handleQuestionnaireRetake = (questionnaire) => {
    if (questionnaire.type === 'initial') {
      navigate('/questionnaire/initial');
    } else if (questionnaire.type === 'premium') {
      navigate('/premium');
    } else if (questionnaire.templateId) {
      // Navigate to custom questionnaire - we'll implement this later
      alert('Rifare questionari personalizzati non è ancora disponibile');
    }
  };

  const handleQuestionnaireView = (questionnaire) => {
    setSelectedQuestionnaire(questionnaire);
    setShowQuestionnaireModal(true);
  };

  const handleExerciseClick = async (session) => {
    try {
      // Carica i dettagli dell'esercizio se non li abbiamo già
      if (!exerciseDetails[session.exerciseId]) {
        const exerciseDoc = await getDoc(doc(db, 'exercises', session.exerciseId));
        if (exerciseDoc.exists()) {
          setExerciseDetails(prev => ({
            ...prev,
            [session.exerciseId]: exerciseDoc.data()
          }));
        }
      }
      
      setSelectedExercise(session);
      setShowModal(true);
    } catch (error) {
      console.error('Errore nel caricamento dettagli esercizio:', error);
      setSelectedExercise(session);
      setShowModal(true);
    }
  };

  const downloadSingleExercisePDF = async (session) => {
    try {
      // Carica i dettagli dell'esercizio se necessario
      let exercise = exerciseDetails[session.exerciseId];
      if (!exercise) {
        const exerciseDoc = await getDoc(doc(db, 'exercises', session.exerciseId));
        if (exerciseDoc.exists()) {
          exercise = exerciseDoc.data();
          setExerciseDetails(prev => ({
            ...prev,
            [session.exerciseId]: exercise
          }));
        }
      }

      const pdfDoc = new jsPDF();
      const userName = userProfile?.displayName || userProfile?.name || 'Atleta';
      
      // Header
      pdfDoc.setFontSize(20);
      pdfDoc.setTextColor(79, 70, 229);
      pdfDoc.text('Mentalità', 20, 20);
      
      pdfDoc.setFontSize(16);
      pdfDoc.setTextColor(0, 0, 0);
      pdfDoc.text(`Esercizio: ${session.exerciseTitle}`, 20, 35);
      
      pdfDoc.setFontSize(10);
      pdfDoc.setTextColor(100, 100, 100);
      pdfDoc.text(`Atleta: ${userName}`, 20, 45);
      pdfDoc.text(`Completato il: ${session.completedAt.toLocaleString('it-IT')}`, 20, 52);
      if (session.timeSpent) {
        pdfDoc.text(`Durata: ${Math.round(session.timeSpent / 60)} minuti`, 20, 59);
      }

      let currentY = 75;

      // Descrizione esercizio se disponibile
      if (exercise && exercise.description) {
        pdfDoc.setFontSize(12);
        pdfDoc.setTextColor(0, 0, 0);
        pdfDoc.text('Descrizione:', 20, currentY);
        currentY += 10;
        
        pdfDoc.setFontSize(10);
        pdfDoc.setTextColor(50, 50, 50);
        const descriptionLines = pdfDoc.splitTextToSize(exercise.description, 170);
        pdfDoc.text(descriptionLines, 20, currentY);
        currentY += descriptionLines.length * 5 + 10;
      }

      // Risposte
      pdfDoc.setFontSize(14);
      pdfDoc.setTextColor(79, 70, 229);
      pdfDoc.text('Risposte:', 20, currentY);
      currentY += 15;

      if (exercise && exercise.elements && session.responses) {
        exercise.elements.forEach((element, index) => {
          const userResponse = session.responses[element.id];
          
          if (userResponse !== undefined) {
            // Controlla spazio disponibile
            if (currentY > 250) {
              pdfDoc.addPage();
              currentY = 20;
            }

            // Domanda
            pdfDoc.setFontSize(11);
            pdfDoc.setTextColor(0, 0, 0);
            const questionText = element.title || element.question || element.text || `Domanda ${index + 1}`;
            const wrappedQuestion = pdfDoc.splitTextToSize(`${index + 1}. ${questionText}`, 170);
            pdfDoc.text(wrappedQuestion, 20, currentY);
            currentY += wrappedQuestion.length * 6;

            // Descrizione domanda se presente
            if (element.description) {
              pdfDoc.setFontSize(9);
              pdfDoc.setTextColor(100, 100, 100);
              const wrappedDesc = pdfDoc.splitTextToSize(element.description, 170);
              pdfDoc.text(wrappedDesc, 20, currentY);
              currentY += wrappedDesc.length * 4;
            }

            // Risposta
            pdfDoc.setFontSize(10);
            pdfDoc.setTextColor(50, 50, 50);
            let responseText = '';
            
            if (typeof userResponse === 'string') {
              responseText = userResponse;
            } else if (typeof userResponse === 'number') {
              responseText = userResponse.toString();
            } else if (Array.isArray(userResponse)) {
              responseText = userResponse.join(', ');
            } else {
              responseText = JSON.stringify(userResponse);
            }

            if (responseText) {
              const wrappedResponse = pdfDoc.splitTextToSize(`Risposta: ${responseText}`, 170);
              pdfDoc.text(wrappedResponse, 20, currentY);
              currentY += wrappedResponse.length * 5;
            }
            
            currentY += 8;
          }
        });
      } else {
        // Se non abbiamo i dettagli dell'esercizio
        pdfDoc.setFontSize(10);
        pdfDoc.setTextColor(100, 100, 100);
        pdfDoc.text('Dettagli esercizio non disponibili', 20, currentY);
        currentY += 10;
        
        if (session.responses) {
          Object.entries(session.responses).forEach(([key, value]) => {
            const responseText = typeof value === 'string' ? value : JSON.stringify(value);
            if (responseText) {
              const wrappedResponse = pdfDoc.splitTextToSize(`${key}: ${responseText}`, 170);
              pdfDoc.text(wrappedResponse, 20, currentY);
              currentY += wrappedResponse.length * 5 + 3;
            }
          });
        }
      }

      // Footer
      const pageHeight = pdfDoc.internal.pageSize.height;
      pdfDoc.setFontSize(8);
      pdfDoc.setTextColor(150, 150, 150);
      pdfDoc.text('Mentalità - Il tuo percorso di crescita mentale sportiva', 20, pageHeight - 20);

      // Save PDF
      const fileName = `Mentalita_${session.exerciseTitle.replace(/\s+/g, '_')}_${session.completedAt.toISOString().split('T')[0]}.pdf`;
      pdfDoc.save(fileName);
      
    } catch (error) {
      console.error('Error generating single exercise PDF:', error);
      alert('Errore durante la generazione del PDF');
    }
  };

  const exportToPDF = async () => {
    if (exerciseHistory.length === 0) {
      alert('Nessun esercizio da esportare!');
      return;
    }

    try {
      // Recupera i dettagli degli esercizi per collegare domande e risposte
      const exerciseDetails = {};
      const exerciseIds = [...new Set(exerciseHistory.map(h => h.exerciseId))];
      
      for (const exerciseId of exerciseIds) {
        const exerciseDoc = await getDoc(doc(db, 'exercises', exerciseId));
        if (exerciseDoc.exists()) {
          exerciseDetails[exerciseId] = exerciseDoc.data();
        }
      }

      const pdfDoc = new jsPDF();
      const userName = userProfile?.displayName || userProfile?.name || 'Atleta';
    
      // Header
      pdfDoc.setFontSize(20);
      pdfDoc.setTextColor(79, 70, 229); // Indigo color
      pdfDoc.text('Mentalità', 20, 20);
      
      pdfDoc.setFontSize(16);
      pdfDoc.setTextColor(0, 0, 0);
      pdfDoc.text(`Storico Esercizi Dettagliato - ${userName}`, 20, 35);
      
      pdfDoc.setFontSize(10);
      pdfDoc.setTextColor(100, 100, 100);
      pdfDoc.text(`Generato il: ${new Date().toLocaleDateString('it-IT')}`, 20, 45);
      pdfDoc.text(`Email: ${userProfile?.email || currentUser?.email}`, 20, 52);

      let currentY = 70;

      // Stats summary
      if (userStats) {
        pdfDoc.setFontSize(12);
        pdfDoc.setTextColor(0, 0, 0);
        pdfDoc.text('Statistiche Generali:', 20, currentY);
        currentY += 10;
        
        pdfDoc.setFontSize(10);
        pdfDoc.text(`Esercizi completati: ${userStats.completedExercises || exerciseHistory.length}`, 25, currentY);
        currentY += 7;
        pdfDoc.text(`Giorni consecutivi: ${userStats.currentStreak || 0}`, 25, currentY);
        currentY += 7;
        pdfDoc.text(`Badge ottenuti: ${badges.length}`, 25, currentY);
        currentY += 15;
      }

      // Per ogni esercizio, mostra domande e risposte dettagliate
      exerciseHistory.forEach((session, index) => {
        const exercise = exerciseDetails[session.exerciseId];
        
        // Controlla se c'è spazio per l'esercizio, altrimenti nuova pagina
        if (currentY > 250) {
          pdfDoc.addPage();
          currentY = 20;
        }

        // Titolo esercizio
        pdfDoc.setFontSize(14);
        pdfDoc.setTextColor(79, 70, 229);
        pdfDoc.text(`${index + 1}. ${session.exerciseTitle}`, 20, currentY);
        currentY += 10;

        // Info esercizio
        pdfDoc.setFontSize(9);
        pdfDoc.setTextColor(100, 100, 100);
        const sessionDate = session.completedAt?.toDate ? session.completedAt.toDate() : 
                            (session.completedAt instanceof Date ? session.completedAt : new Date(session.completedAt));
        pdfDoc.text(`Completato il: ${sessionDate.toLocaleDateString('it-IT')} alle ${sessionDate.toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' })}`, 20, currentY);
        currentY += 5;
        if (session.timeSpent) {
          pdfDoc.text(`Durata: ${Math.round(session.timeSpent / 60)} minuti`, 20, currentY);
          currentY += 5;
        }
        currentY += 5;

        if (exercise && exercise.elements) {
          // Collega domande e risposte
          exercise.elements.forEach((element) => {
            const userResponse = session.responses[element.id];
            
            if (userResponse !== undefined) {
              // Domanda
              pdfDoc.setFontSize(10);
              pdfDoc.setTextColor(0, 0, 0);
              
              const questionText = element.question || element.text || 'Domanda';
              const wrappedQuestion = pdfDoc.splitTextToSize(questionText, 170);
              pdfDoc.text(`Q: ${wrappedQuestion}`, 20, currentY);
              currentY += wrappedQuestion.length * 5;

              // Risposta
              pdfDoc.setTextColor(50, 50, 50);
              let responseText = '';
              
              if (typeof userResponse === 'string') {
                responseText = userResponse;
              } else if (typeof userResponse === 'number') {
                responseText = userResponse.toString();
              } else if (Array.isArray(userResponse)) {
                responseText = userResponse.join(', ');
              } else {
                responseText = JSON.stringify(userResponse);
              }

              if (responseText) {
                const wrappedResponse = pdfDoc.splitTextToSize(`R: ${responseText}`, 170);
                pdfDoc.text(wrappedResponse, 20, currentY);
                currentY += wrappedResponse.length * 5;
              }
              
              currentY += 3; // Spazio tra domande
            }
          });
        } else {
          // Se non abbiamo i dettagli dell'esercizio, mostra solo le risposte
          pdfDoc.setFontSize(10);
          pdfDoc.setTextColor(100, 100, 100);
          pdfDoc.text('Dettagli esercizio non disponibili', 20, currentY);
          currentY += 7;
          
          Object.entries(session.responses || {}).forEach(([key, value]) => {
            const responseText = typeof value === 'string' ? value : JSON.stringify(value);
            if (responseText) {
              const wrappedResponse = pdfDoc.splitTextToSize(`${key}: ${responseText}`, 170);
              pdfDoc.text(wrappedResponse, 20, currentY);
              currentY += wrappedResponse.length * 5;
            }
          });
        }
        
        currentY += 10; // Spazio tra esercizi
      });

      // Add badges section if any
      if (badges.length > 0) {
        if (currentY > 250) {
          pdfDoc.addPage();
          currentY = 20;
        }
        
        pdfDoc.setFontSize(12);
        pdfDoc.setTextColor(0, 0, 0);
        pdfDoc.text('Badge Ottenuti:', 20, currentY);
        currentY += 10;
        
        pdfDoc.setFontSize(10);
        badges.slice(0, 10).forEach((badge, index) => {
          pdfDoc.text(`• ${badge.name}`, 25, currentY + (index * 7));
        });
        currentY += (Math.min(badges.length, 10) * 7);
        
        if (badges.length > 10) {
          pdfDoc.text(`... e altri ${badges.length - 10} badge`, 25, currentY);
          currentY += 7;
        }
      }

      // Footer on last page
      const pageHeight = pdfDoc.internal.pageSize.height;
      pdfDoc.setFontSize(8);
      pdfDoc.setTextColor(150, 150, 150);
      pdfDoc.text('Mentalità - Il tuo percorso di crescita mentale sportiva', 20, pageHeight - 20);
      pdfDoc.text(`${exerciseHistory.length} esercizi totali`, 20, pageHeight - 13);

      // Save the PDF
      const fileName = `Mentalita_Storico_${userName.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.pdf`;
      pdfDoc.save(fileName);
      
    } catch (error) {
      console.error('Error generating PDF:', error);
      alert('Errore durante la generazione del PDF');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 pb-20">
      {/* Header - Mobile ottimizzato */}
      <div className="bg-white dark:bg-gray-800 shadow-sm">
        <div className="p-3">
          <div className="flex flex-col space-y-1">
            <div className="flex items-center justify-between">
              <h1 className="text-lg font-bold text-gray-900 dark:text-white">Profilo</h1>
              {isAdmin && (
                <div className="flex items-center space-x-1 bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300 px-2 py-0.5 rounded-full">
                  <Crown className="h-3 w-3" />
                  <span className="text-xs font-medium">Admin</span>
                </div>
              )}
            </div>
            <p className="text-xs text-gray-600 dark:text-gray-300">
              {!isOnboardingCompleted ? 'Completa l\'onboarding per accedere a tutte le funzioni' : 'Il tuo account e preferenze'}
            </p>
          </div>
        </div>
      </div>

      <div className="p-3 space-y-3">
        {/* Premium CTA - Solo se onboarding completato */}
        {!isAdmin && !userProfile?.isPremium && isOnboardingCompleted && (
          <div className="bg-gradient-to-r from-purple-600 to-pink-600 rounded-lg p-3 shadow-lg">
            <div className="flex flex-col space-y-2">
              <div className="flex items-center space-x-2">
                <div className="bg-white/20 p-1.5 rounded-full">
                  <Crown className="h-4 w-4 text-yellow-400" />
                </div>
                <div className="flex-1">
                  <h3 className="text-white font-bold text-sm">Sblocca il tuo potenziale</h3>
                  <p className="text-white/90 text-xs">Accedi a contenuti esclusivi</p>
                </div>
              </div>
              <button
                onClick={() => navigate('/premium')}
                className="bg-white text-purple-600 px-3 py-1.5 rounded-lg font-semibold text-xs flex items-center justify-center space-x-1 w-full"
              >
                <span>Scopri Premium</span>
                <ChevronRight className="h-3 w-3" />
              </button>
            </div>
          </div>
        )}

        {/* Upgrade CTA per utenti Premium (non Gold) - Solo se onboarding completato */}
        {!isAdmin && userProfile?.isPremium && userProfile?.planType !== 'gold' && isOnboardingCompleted && (
          <div className="bg-gradient-to-r from-yellow-500 to-orange-500 rounded-lg p-3 shadow-lg">
            <div className="flex flex-col space-y-2">
              <div className="flex items-center space-x-2">
                <div className="bg-white/20 p-1.5 rounded-full">
                  <Sparkles className="h-4 w-4 text-white" />
                </div>
                <div className="flex-1">
                  <h3 className="text-white font-bold text-sm">Passa a Gold</h3>
                  <p className="text-white/90 text-xs">Coaching 1-on-1</p>
                </div>
              </div>
              <button
                onClick={() => navigate('/premium')}
                className="bg-white text-orange-600 px-3 py-1.5 rounded-lg font-semibold text-xs flex items-center justify-center space-x-1 w-full"
              >
                <span>Upgrade</span>
                <Zap className="h-3 w-3" />
              </button>
            </div>
          </div>
        )}

        {/* Profile Card - Mobile ottimizzato */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-3">
          <div className="flex items-center space-x-3 mb-3">
            <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-full flex items-center justify-center flex-shrink-0">
              <User className="h-5 w-5 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center space-x-1 mb-0.5">
                <h2 className="text-base font-semibold text-gray-900 dark:text-white truncate">
                  {userProfile?.displayName || userProfile?.name || 'Atleta'}
                </h2>
                {isAdmin && <Crown className="h-3 w-3 text-yellow-500 flex-shrink-0" />}
              </div>
              {userProfile?.isPremium && isOnboardingCompleted && (
                <div className="flex items-center space-x-1 mb-0.5">
                  {userProfile?.planType === 'gold' ? (
                    <div className="flex items-center space-x-0.5 bg-gradient-to-r from-yellow-500 to-orange-500 text-white px-1.5 py-0.5 rounded-full">
                      <Sparkles className="h-2.5 w-2.5" />
                      <span className="text-xs font-semibold">GOLD</span>
                    </div>
                  ) : (
                    <div className="flex items-center space-x-0.5 bg-gradient-to-r from-purple-500 to-pink-500 text-white px-1.5 py-0.5 rounded-full">
                      <Crown className="h-2.5 w-2.5" />
                      <span className="text-xs font-semibold">PREMIUM</span>
                    </div>
                  )}
                </div>
              )}
              <p className="text-xs text-gray-600 dark:text-gray-300 truncate">
                {userProfile?.email || currentUser?.email}
              </p>
              <p className="text-xs text-blue-600 dark:text-blue-400">
                Mentalità
              </p>
            </div>
          </div>

          {/* User Stats - Sempre visibili */}
          {userStats && (
            <div className="grid grid-cols-3 gap-2 mb-3 p-2 bg-gray-50 dark:bg-gray-700 rounded-lg">
              <div className="text-center">
                <div className="text-lg font-bold text-blue-600 dark:text-blue-400">
                  {userStats.completedExercises || 0}
                </div>
                <div className="text-xs text-gray-600 dark:text-gray-400">
                  Esercizi
                </div>
              </div>
              <div className="text-center">
                <div className="text-lg font-bold text-green-600 dark:text-green-400">
                  {userStats.currentStreak || 0}
                </div>
                <div className="text-xs text-gray-600 dark:text-gray-400">
                  Streak
                </div>
              </div>
              <div className="text-center">
                <div className="text-lg font-bold text-purple-600 dark:text-purple-400">
                  {badges.length}
                </div>
                <div className="text-xs text-gray-600 dark:text-gray-400">
                  Badge
                </div>
              </div>
            </div>
          )}

          {/* Badges - Sempre visibili se ci sono */}
          {badges.length > 0 && (
            <div className="mb-3">
              <h3 className="text-sm font-medium text-gray-900 dark:text-white mb-2">
                Badge ottenuti
              </h3>
              <div className="flex flex-wrap gap-1">
                {badges.slice(0, 3).map((badge) => (
                  <div
                    key={badge.id}
                    className="flex items-center space-x-1 bg-gradient-to-r from-yellow-400 to-orange-500 text-white px-2 py-0.5 rounded-full"
                  >
                    <Award className="h-3 w-3" />
                    <span className="text-xs">{badge.name}</span>
                  </div>
                ))}
                {badges.length > 3 && (
                  <div className="flex items-center space-x-0.5 text-gray-500 dark:text-gray-400">
                    <Star className="h-3 w-3" />
                    <span className="text-xs">+{badges.length - 3}</span>
                  </div>
                )}
              </div>
            </div>
          )}
          
          <div className="border-t border-gray-200 dark:border-gray-600 pt-3">
            <h3 className="text-sm font-medium text-gray-900 dark:text-white mb-2">Azioni</h3>
            
            <div className="space-y-1.5">
              {/* Admin Panel - sempre visibile per admin */}
              {isAdmin && (
                <button 
                  onClick={() => navigate('/admin')}
                  className="w-full flex items-center justify-between p-2 text-left hover:bg-yellow-50 dark:hover:bg-yellow-900/20 rounded-lg transition-colors border border-yellow-200 dark:border-yellow-800"
                >
                  <div className="flex items-center space-x-2">
                    <Crown className="h-3.5 w-3.5 text-yellow-600 dark:text-yellow-400" />
                    <span className="text-yellow-800 dark:text-yellow-300 font-medium text-xs">Admin Panel</span>
                  </div>
                </button>
              )}
              
              {/* WhatsApp - sempre visibile */}
              <a
                href="https://wa.me/393402904882?text=Ciao%20Gabri%2C%20ho%20una%20domanda%20su%20Mentalità"
                target="_blank"
                rel="noopener noreferrer"
                className="w-full flex items-center justify-between p-2 text-left hover:bg-green-50 dark:hover:bg-green-900/20 rounded-lg transition-colors border border-green-200 dark:border-green-800"
              >
                <div className="flex items-center space-x-2">
                  <MessageCircle className="h-3.5 w-3.5 text-green-600 dark:text-green-400" />
                  <span className="text-green-800 dark:text-green-300 font-medium text-xs">Chiedi a Gabri</span>
                </div>
                <div className="text-xs text-green-600 dark:text-green-400">
                  WhatsApp
                </div>
              </a>
              
              {/* Onboarding progress per utenti non completati */}
              {!isOnboardingCompleted && (
                <button
                  onClick={() => {
                    if (!hasCompletedQuestionnaire) {
                      navigate('/questionnaire/initial');
                    } else {
                      navigate('/onboarding');
                    }
                  }}
                  className="w-full flex items-center justify-between p-2 text-left hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors border border-blue-200 dark:border-blue-800"
                >
                  <div className="flex items-center space-x-2">
                    <Target className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400" />
                    <span className="text-blue-800 dark:text-blue-300 font-medium text-xs">
                      {!hasCompletedQuestionnaire ? 'Completa Questionario' : 'Continua Onboarding'}
                    </span>
                  </div>
                  <ChevronRight className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400" />
                </button>
              )}
              
              {/* Impostazioni - solo se onboarding completato */}
              {isOnboardingCompleted && (
                <>
                  <button className="w-full flex items-center justify-between p-2 text-left hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg transition-colors">
                    <div className="flex items-center space-x-2">
                      <Settings className="h-3.5 w-3.5 text-gray-500 dark:text-gray-400" />
                      <span className="text-gray-900 dark:text-white text-xs">Impostazioni</span>
                    </div>
                  </button>
                  
                  <button className="w-full flex items-center justify-between p-2 text-left hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg transition-colors">
                    <div className="flex items-center space-x-2">
                      <Shield className="h-3.5 w-3.5 text-gray-500 dark:text-gray-400" />
                      <span className="text-gray-900 dark:text-white text-xs">Privacy</span>
                    </div>
                  </button>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Profilo Sportivo - Solo se onboarding completato */}
        {userProfile?.initialQuestionnaire && isOnboardingCompleted && (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-3">
            <div className="flex items-center space-x-2 mb-3">
              <div className="bg-gradient-to-r from-green-500 to-emerald-600 p-1.5 rounded-lg">
                <Trophy className="h-4 w-4 text-white" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
                  Profilo Sportivo
                </h3>
                <p className="text-xs text-gray-600 dark:text-gray-400">
                  Dal tuo questionario
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-2">
              {/* Sport e Livello sulla stessa riga */}
              <div className="grid grid-cols-2 gap-2">
                <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-2">
                  <div className="flex items-center space-x-1 mb-0.5">
                    <Trophy className="h-3 w-3 text-blue-600 dark:text-blue-400" />
                    <h4 className="font-medium text-gray-900 dark:text-white text-xs">Sport</h4>
                  </div>
                  <p className="text-gray-700 dark:text-gray-300 text-xs">
                    {userProfile.initialQuestionnaire.sport || 'Non specificato'}
                  </p>
                </div>

                <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-2">
                  <div className="flex items-center space-x-1 mb-0.5">
                    <Star className="h-3 w-3 text-yellow-600 dark:text-yellow-400" />
                    <h4 className="font-medium text-gray-900 dark:text-white text-xs">Livello</h4>
                  </div>
                  <p className="text-gray-700 dark:text-gray-300 text-xs">
                    {userProfile.initialQuestionnaire.level || 'Non specificato'}
                  </p>
                </div>
              </div>

              {/* Coaching e Tempo sulla stessa riga */}
              <div className="grid grid-cols-2 gap-2">
                <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-2">
                  <div className="flex items-center space-x-1 mb-0.5">
                    <Brain className="h-3 w-3 text-purple-600 dark:text-purple-400" />
                    <h4 className="font-medium text-gray-900 dark:text-white text-xs">Coaching</h4>
                  </div>
                  <p className="text-gray-700 dark:text-gray-300 text-xs">
                    {userProfile.initialQuestionnaire.coachingExperience || 'Non specificato'}
                  </p>
                </div>

                <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-2">
                  <div className="flex items-center space-x-1 mb-0.5">
                    <Clock className="h-3 w-3 text-green-600 dark:text-green-400" />
                    <h4 className="font-medium text-gray-900 dark:text-white text-xs">Tempo</h4>
                  </div>
                  <p className="text-gray-700 dark:text-gray-300 text-xs">
                    {userProfile.initialQuestionnaire.timeAvailable || 'Non specificato'}
                  </p>
                </div>
              </div>
            </div>

            {/* Obiettivi Mentali */}
            {userProfile.initialQuestionnaire.mentalGoals && userProfile.initialQuestionnaire.mentalGoals.length > 0 && (
              <div className="mt-3">
                <div className="flex items-center space-x-1 mb-2">
                  <Target className="h-3.5 w-3.5 text-indigo-600 dark:text-indigo-400" />
                  <h4 className="font-medium text-gray-900 dark:text-white text-xs">I Miei Obiettivi Mentali</h4>
                </div>
                <div className="flex flex-wrap gap-1">
                  {userProfile.initialQuestionnaire.mentalGoals.map((goal, index) => (
                    <span 
                      key={index}
                      className="px-2 py-0.5 bg-gradient-to-r from-blue-500 to-purple-600 text-white text-xs rounded-full"
                    >
                      {goal}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Data Completamento */}
            {userProfile.initialQuestionnaire.completedAt && (
              <div className="mt-2 pt-2 border-t border-gray-200 dark:border-gray-600">
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Profilo completato il {formatDate(userProfile.initialQuestionnaire.completedAt, { 
                    day: '2-digit', 
                    month: '2-digit', 
                    year: 'numeric' 
                  })}
                </p>
              </div>
            )}
          </div>
        )}

        {/* I Miei Questionari - Solo se onboarding completato */}
        {isOnboardingCompleted && (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-3">
            <div className="flex items-center space-x-2 mb-3">
              <div className="bg-gradient-to-r from-indigo-500 to-purple-600 p-1.5 rounded-lg">
                <ClipboardList className="h-4 w-4 text-white" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
                  I Miei Questionari
                </h3>
                <p className="text-xs text-gray-600 dark:text-gray-400">
                  Storico delle tue risposte
                </p>
              </div>
            </div>

            {questionnaires.length === 0 ? (
              <div className="text-center py-6">
                <ClipboardList className="h-12 w-12 mx-auto mb-3 text-gray-400" />
                <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-1">
                  Nessun questionario completato
                </h4>
                <p className="text-xs text-gray-500 dark:text-gray-400 mb-3">
                  Completa il tuo primo questionario per vedere qui lo storico
                </p>
                <button
                  onClick={() => navigate('/questionnaire/initial')}
                  className="inline-flex items-center space-x-1 bg-indigo-600 text-white px-3 py-1.5 rounded-lg hover:bg-indigo-700 transition-colors text-xs"
                >
                  <ClipboardList className="h-3 w-3" />
                  <span>Inizia Questionario</span>
                </button>
              </div>
            ) : (
              <div className="space-y-2">
                {questionnaires.map((questionnaire) => (
                  <div
                    key={questionnaire.id}
                    className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-700 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors"
                  >
                    <div 
                      className="flex items-center space-x-2 flex-1 cursor-pointer min-w-0"
                      onClick={() => handleQuestionnaireView(questionnaire)}
                    >
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                        questionnaire.type === 'initial' ? 'bg-blue-100 dark:bg-blue-900/30' :
                        questionnaire.type === 'premium' ? 'bg-purple-100 dark:bg-purple-900/30' :
                        'bg-green-100 dark:bg-green-900/30'
                      }`}>
                        <ClipboardList className={`h-4 w-4 ${
                          questionnaire.type === 'initial' ? 'text-blue-600 dark:text-blue-400' :
                          questionnaire.type === 'premium' ? 'text-purple-600 dark:text-purple-400' :
                          'text-green-600 dark:text-green-400'
                        }`} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-medium text-gray-900 dark:text-white text-sm truncate">
                          {questionnaire.title}
                        </h4>
                        <div className="flex items-center space-x-2 text-xs text-gray-500 dark:text-gray-400">
                          <div className="flex items-center space-x-0.5">
                            <Calendar className="h-2.5 w-2.5" />
                            <span>
                              {formatDate(questionnaire.completedAt, {
                                day: '2-digit',
                                month: '2-digit',
                                year: '2-digit'
                              })}
                            </span>
                          </div>
                          <span className="text-xs">
                            • {Object.keys(questionnaire.responses || {}).length} risposte
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-1 flex-shrink-0">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleQuestionnaireView(questionnaire);
                        }}
                        className="p-1.5 text-blue-600 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
                        title="Visualizza risposte"
                      >
                        <Eye className="h-3.5 w-3.5" />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleQuestionnaireRetake(questionnaire);
                        }}
                        className="p-1.5 text-green-600 dark:text-green-400 hover:bg-green-100 dark:hover:bg-green-900/20 rounded-lg transition-colors"
                        title="Rifai questionario"
                      >
                        <RefreshCw className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Exercise History - Sempre visibile */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-3">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center space-x-1.5">
                <History className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
                <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
                  Storico Esercizi
                </h3>
              </div>
            {exerciseHistory.length > 0 && (
              <button
                onClick={() => setShowFullHistory(!showFullHistory)}
                className="text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300 text-xs font-medium"
              >
                {showFullHistory ? 'Meno' : `Tutti (${exerciseHistory.length})`}
              </button>
            )}
          </div>

          {exerciseHistory.length === 0 ? (
            <div className="text-center py-6">
              <Brain className="h-12 w-12 mx-auto mb-3 text-gray-400" />
              <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-1">
                Nessun esercizio completato
              </h4>
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-3">
                Inizia il tuo primo esercizio per vedere qui lo storico
              </p>
              <button
                onClick={() => navigate('/exercises')}
                className="inline-flex items-center space-x-1 bg-indigo-600 text-white px-3 py-1.5 rounded-lg hover:bg-indigo-700 transition-colors text-xs"
              >
                <BookOpen className="h-3 w-3" />
                <span>Vai agli Esercizi</span>
              </button>
            </div>
          ) : (
            <>
              <div className="space-y-2">
                {(showFullHistory ? exerciseHistory : exerciseHistory.slice(0, 3)).map((session) => (
                  <div
                    key={session.id}
                    className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-700 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors"
                  >
                    <div 
                      className="flex items-center space-x-2 flex-1 cursor-pointer min-w-0"
                      onClick={() => handleExerciseClick(session)}
                    >
                      <div className="w-8 h-8 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center flex-shrink-0">
                        <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-medium text-gray-900 dark:text-white text-sm truncate">
                          {session.exerciseTitle || 'Esercizio'}
                        </h4>
                        <div className="flex items-center space-x-2 text-xs text-gray-500 dark:text-gray-400">
                          <div className="flex items-center space-x-0.5">
                            <Calendar className="h-2.5 w-2.5" />
                            <span>
                              {formatDate(session.completedAt, {
                                day: '2-digit',
                                month: '2-digit'
                              })}
                            </span>
                          </div>
                          {session.timeSpent && (
                            <div className="flex items-center space-x-0.5">
                              <Clock className="h-2.5 w-2.5" />
                              <span>
                                {Math.round(session.timeSpent / 60)}m
                              </span>
                            </div>
                          )}
                          <span className="text-xs">
                            • {Object.keys(session.responses || {}).length} risposte
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-1 flex-shrink-0">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleExerciseClick(session);
                        }}
                        className="p-1.5 text-blue-600 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
                        title="Visualizza risposte"
                      >
                        <Eye className="h-3.5 w-3.5" />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          downloadSingleExercisePDF(session);
                        }}
                        className="p-1.5 text-green-600 dark:text-green-400 hover:bg-green-100 dark:hover:bg-green-900/20 rounded-lg transition-colors"
                        title="Scarica PDF"
                      >
                        <FileText className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {/* PDF Export Button */}
              <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-600">
                <button
                  onClick={exportToPDF}
                  className="flex items-center space-x-1 bg-blue-600 text-white px-3 py-1.5 rounded-lg hover:bg-blue-700 transition-colors text-xs"
                >
                  <Download className="h-3 w-3" />
                  <span>Esporta Storico PDF</span>
                </button>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  Scarica un report completo del tuo storico esercizi
                </p>
              </div>
            </>
          )}
        </div>

        {/* Logout Button - Mobile ottimizzato */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-3">
          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center space-x-1 p-2 bg-red-500 hover:bg-red-600 text-white rounded-lg transition-colors font-medium text-xs"
          >
            <LogOut className="h-3.5 w-3.5" />
            <span>Logout</span>
          </button>
          
          <p className="text-xs text-gray-500 dark:text-gray-400 text-center mt-1">
            Verrai reindirizzato alla pagina di accesso
          </p>
        </div>
      </div>

      {/* Modal per visualizzare questionari */}
      {showQuestionnaireModal && selectedQuestionnaire && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
            {/* Header Modal */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-600">
              <div>
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                  {selectedQuestionnaire.title}
                </h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                  Completato il {selectedQuestionnaire.completedAt.toLocaleString('it-IT')}
                </p>
              </div>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => handleQuestionnaireRetake(selectedQuestionnaire)}
                  className="p-2 text-green-600 dark:text-green-400 hover:bg-green-100 dark:hover:bg-green-900/20 rounded-lg transition-colors"
                  title="Rifai questionario"
                >
                  <RefreshCw className="h-5 w-5" />
                </button>
                <button
                  onClick={() => setShowQuestionnaireModal(false)}
                  className="p-2 text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>

            {/* Content Modal */}
            <div className="p-6 overflow-y-auto max-h-[calc(90vh-140px)]">
              {/* Tipo questionario */}
              <div className="mb-6 p-4 bg-indigo-50 dark:bg-indigo-900/20 rounded-lg border-l-4 border-indigo-500">
                <h4 className="text-sm font-semibold text-indigo-800 dark:text-indigo-300 mb-2">
                  Tipo di Questionario
                </h4>
                <p className="text-sm text-indigo-700 dark:text-indigo-300">
                  {selectedQuestionnaire.type === 'initial' ? 'Questionario iniziale di valutazione del profilo mentale' :
                   selectedQuestionnaire.type === 'premium' ? 'Questionario per la richiesta Premium' :
                   'Questionario personalizzato assegnato dal coach'}
                </p>
              </div>

              {/* Risposte */}
              <div className="space-y-6">
                <h4 className="text-lg font-semibold text-gray-900 dark:text-white border-b border-gray-200 dark:border-gray-600 pb-2">
                  Le tue Risposte
                </h4>

                {selectedQuestionnaire.responses && Object.keys(selectedQuestionnaire.responses).length > 0 ? (
                  <div className="space-y-4">
                    {Object.entries(selectedQuestionnaire.responses).map(([key, value], index) => {
                      if (value === undefined || value === '' || value === null) return null;
                      
                      // Get readable field name based on questionnaire type
                      const getFieldLabel = (key, type) => {
                        if (type === 'initial') {
                          const fieldLabels = {
                            sport: 'Sport praticato',
                            level: 'Livello di competizione',
                            coachingExperience: 'Esperienza con mental coaching',
                            timeAvailable: 'Tempo disponibile per allenamento mentale',
                            mentalGoals: 'Obiettivi mentali principali',
                            mainGoal: 'Obiettivo principale',
                            strengths: 'Punti di forza mentali',
                            weaknesses: 'Aree di miglioramento',
                            motivation: 'Motivazione',
                            stressManagement: 'Gestione dello stress',
                            concentration: 'Concentrazione',
                            confidence: 'Fiducia in se stessi'
                          };
                          return fieldLabels[key] || key;
                        } else if (type === 'premium') {
                          const fieldLabels = {
                            budget: 'Budget mensile',
                            coachingPreference: 'Preferenza coaching',
                            goals: 'Obiettivi Premium',
                            availability: 'Disponibilità oraria'
                          };
                          return fieldLabels[key] || key;
                        }
                        return key;
                      };

                      const displayValue = Array.isArray(value) ? value.join(', ') : 
                                          typeof value === 'object' ? JSON.stringify(value) : 
                                          String(value);

                      return (
                        <div key={key} className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                          <div className="mb-3">
                            <h5 className="font-medium text-gray-900 dark:text-white">
                              {getFieldLabel(key, selectedQuestionnaire.type)}
                            </h5>
                          </div>
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
                    <ClipboardList className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                    <p className="text-gray-500 dark:text-gray-400">
                      Nessuna risposta trovata per questo questionario
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Footer Modal */}
            <div className="flex items-center justify-between p-6 border-t border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700">
              <div className="text-sm text-gray-600 dark:text-gray-400">
                {Object.keys(selectedQuestionnaire.responses || {}).length} risposte totali
              </div>
              <div className="flex space-x-3">
                <button
                  onClick={() => handleQuestionnaireRetake(selectedQuestionnaire)}
                  className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                >
                  <RefreshCw className="h-4 w-4" />
                  <span>Rifai Questionario</span>
                </button>
                <button
                  onClick={() => setShowQuestionnaireModal(false)}
                  className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors"
                >
                  Chiudi
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal per visualizzare risposte dettagliate */}
      {showModal && selectedExercise && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
            {/* Header Modal */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-600">
              <div>
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                  {selectedExercise.exerciseTitle}
                </h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                  Completato il {selectedExercise.completedAt.toLocaleString('it-IT')}
                </p>
              </div>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => downloadSingleExercisePDF(selectedExercise)}
                  className="p-2 text-green-600 dark:text-green-400 hover:bg-green-100 dark:hover:bg-green-900/20 rounded-lg transition-colors"
                  title="Scarica PDF"
                >
                  <Download className="h-5 w-5" />
                </button>
                <button
                  onClick={() => setShowModal(false)}
                  className="p-2 text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>

            {/* Content Modal */}
            <div className="p-6 overflow-y-auto max-h-[calc(90vh-140px)]">
              {/* Descrizione esercizio se disponibile */}
              {exerciseDetails[selectedExercise.exerciseId]?.description && (
                <div className="mb-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border-l-4 border-blue-500">
                  <h4 className="text-sm font-semibold text-blue-800 dark:text-blue-300 mb-2">
                    Descrizione dell'Esercizio
                  </h4>
                  <p className="text-sm text-blue-700 dark:text-blue-300">
                    {exerciseDetails[selectedExercise.exerciseId].description}
                  </p>
                </div>
              )}

              {/* Risposte */}
              <div className="space-y-6">
                <h4 className="text-lg font-semibold text-gray-900 dark:text-white border-b border-gray-200 dark:border-gray-600 pb-2">
                  Le tue Risposte
                </h4>

                {exerciseDetails[selectedExercise.exerciseId]?.elements ? (
                  // Se abbiamo i dettagli dell'esercizio, mostra domande e risposte
                  exerciseDetails[selectedExercise.exerciseId].elements.map((element, index) => {
                    const userResponse = selectedExercise.responses?.[element.id];
                    
                    if (userResponse === undefined || userResponse === '') return null;

                    return (
                      <div key={element.id || index} className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                        <div className="mb-3">
                          <h5 className="font-medium text-gray-900 dark:text-white">
                            {index + 1}. {element.title || element.question || element.text || 'Domanda'}
                          </h5>
                          {element.description && (
                            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                              {element.description}
                            </p>
                          )}
                        </div>
                        <div className="pl-4 border-l-2 border-blue-500">
                          <p className="text-gray-800 dark:text-gray-200">
                            {typeof userResponse === 'string' ? userResponse : 
                             typeof userResponse === 'number' ? userResponse.toString() :
                             Array.isArray(userResponse) ? userResponse.join(', ') :
                             JSON.stringify(userResponse)}
                          </p>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  // Se non abbiamo i dettagli dell'esercizio, mostra solo le risposte
                  <div className="space-y-4">
                    <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                      Dettagli dell'esercizio non disponibili. Mostrando solo le risposte salvate:
                    </p>
                    {selectedExercise.responses && Object.entries(selectedExercise.responses).map(([key, value], index) => {
                      if (value === undefined || value === '') return null;
                      
                      return (
                        <div key={key} className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                          <h5 className="font-medium text-gray-900 dark:text-white mb-2">
                            {key}
                          </h5>
                          <div className="pl-4 border-l-2 border-blue-500">
                            <p className="text-gray-800 dark:text-gray-200">
                              {typeof value === 'string' ? value : JSON.stringify(value)}
                            </p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}

                {(!selectedExercise.responses || Object.keys(selectedExercise.responses).length === 0) && (
                  <div className="text-center py-8">
                    <FileText className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                    <p className="text-gray-500 dark:text-gray-400">
                      Nessuna risposta trovata per questo esercizio
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Footer Modal */}
            <div className="flex items-center justify-between p-6 border-t border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700">
              <div className="text-sm text-gray-600 dark:text-gray-400">
                {Object.keys(selectedExercise.responses || {}).length} risposte totali
                {selectedExercise.timeSpent && (
                  <span> • Durata: {Math.round(selectedExercise.timeSpent / 60)} minuti</span>
                )}
              </div>
              <div className="flex space-x-3">
                <button
                  onClick={() => downloadSingleExercisePDF(selectedExercise)}
                  className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                >
                  <Download className="h-4 w-4" />
                  <span>Scarica PDF</span>
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

export default ProfilePage;