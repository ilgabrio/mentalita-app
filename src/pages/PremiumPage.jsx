import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { 
  collection, 
  query, 
  getDocs, 
  addDoc,
  where
} from 'firebase/firestore';
import { db } from '../config/firebase';
import { 
  Crown, 
  Target,
  Brain,
  Trophy,
  Sparkles,
  ChevronRight,
  ChevronLeft,
  CheckCircle,
  Send,
  Clock,
  AlertCircle,
  User,
  Calendar,
  Timer,
  Award,
  Heart,
  Shield,
  TrendingUp
} from 'lucide-react';

const PremiumPage = () => {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [hasActiveRequest, setHasActiveRequest] = useState(false);
  const [hasActiveSubscription, setHasActiveSubscription] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [formData, setFormData] = useState({
    sport: '',
    level: '',
    experience: '',
    goals: '',
    challenges: '',
    commitment: '',
    timeAvailable: '',
    previousMentalTraining: '',
    expectations: '',
    whyPremium: ''
  });

  const questions = [
    {
      id: 'sport',
      title: 'Il Tuo Sport',
      question: 'Qual è il tuo sport principale?',
      type: 'text',
      placeholder: 'es. Calcio, Tennis, Nuoto, Pallavolo...',
      icon: <Trophy className="h-6 w-6" />,
      required: true
    },
    {
      id: 'level',
      title: 'Livello Attuale',
      question: 'A che livello pratichi il tuo sport?',
      type: 'select',
      options: [
        'Amatoriale - Mi diverto e basta',
        'Semi-professionista - Gareggio regolarmente',
        'Professionista - È il mio lavoro',
        'Giovanile/Academy - Sto crescendo',
        'Master/Veterano - Esperienza e passione'
      ],
      icon: <Award className="h-6 w-6" />,
      required: true
    },
    {
      id: 'experience',
      title: 'Esperienza',
      question: 'Da quanto tempo pratichi questo sport?',
      type: 'select',
      options: [
        'Meno di 1 anno',
        '1-3 anni',
        '3-5 anni',
        '5-10 anni',
        'Più di 10 anni'
      ],
      icon: <Timer className="h-6 w-6" />,
      required: true
    },
    {
      id: 'goals',
      title: 'I Tuoi Obiettivi',
      question: 'Quali sono i tuoi obiettivi principali per i prossimi 6 mesi?',
      type: 'textarea',
      placeholder: 'Descrivi cosa vorresti raggiungere o migliorare...',
      icon: <Target className="h-6 w-6" />,
      required: true
    },
    {
      id: 'challenges',
      title: 'Le Tue Sfide',
      question: 'Quali sfide mentali stai affrontando attualmente?',
      type: 'textarea',
      placeholder: 'es. Ansia pre-gara, difficoltà di concentrazione, gestione della pressione, motivazione...',
      icon: <Brain className="h-6 w-6" />,
      required: true
    },
    {
      id: 'commitment',
      title: 'Il Tuo Impegno',
      question: 'Quanto sei determinato/a a migliorare il tuo aspetto mentale?',
      type: 'select',
      options: [
        'Curioso - Voglio capire se fa per me',
        'Interessato - Pronto a provarci',
        'Determinato - È una priorità per me',
        'Totalmente impegnato - Farò di tutto per migliorare'
      ],
      icon: <Heart className="h-6 w-6" />,
      required: true
    },
    {
      id: 'timeAvailable',
      title: 'Tempo Disponibile',
      question: 'Quanto tempo puoi dedicare al training mentale ogni giorno?',
      type: 'select',
      options: [
        '10-15 minuti',
        '15-30 minuti',
        '30-45 minuti',
        '45-60 minuti',
        'Più di 1 ora'
      ],
      icon: <Clock className="h-6 w-6" />,
      required: true
    },
    {
      id: 'previousMentalTraining',
      title: 'Esperienza Precedente',
      question: 'Hai mai fatto mental training o lavorato con uno psicologo dello sport?',
      type: 'textarea',
      placeholder: 'Racconta brevemente la tua esperienza (o scrivi "No" se è la prima volta)...',
      icon: <Shield className="h-6 w-6" />,
      required: true
    },
    {
      id: 'expectations',
      title: 'Le Tue Aspettative',
      question: 'Cosa ti aspetti dal percorso Premium di Mentalità Vincente?',
      type: 'textarea',
      placeholder: 'Cosa speri di ottenere da questo percorso...',
      icon: <Sparkles className="h-6 w-6" />,
      required: true
    },
    {
      id: 'whyPremium',
      title: 'Perché Premium',
      question: 'Perché pensi che il percorso Premium sia giusto per te?',
      type: 'textarea',
      placeholder: 'Cosa ti ha convinto a fare questo passo...',
      icon: <Crown className="h-6 w-6" />,
      required: true
    }
  ];

  useEffect(() => {
    checkExistingRequestsAndSubscriptions();
  }, [currentUser]);

  const checkExistingRequestsAndSubscriptions = async () => {
    if (!currentUser) return;

    try {
      // Check for pending requests
      const requestsQuery = query(
        collection(db, 'premiumRequests'),
        where('userId', '==', currentUser.uid),
        where('status', '==', 'pending')
      );
      const requestsSnapshot = await getDocs(requestsQuery);
      setHasActiveRequest(!requestsSnapshot.empty);

      // Check for active subscriptions
      const subsQuery = query(
        collection(db, 'subscriptions'),
        where('userId', '==', currentUser.uid),
        where('status', '==', 'active')
      );
      const subsSnapshot = await getDocs(subsQuery);
      setHasActiveSubscription(!subsSnapshot.empty);
    } catch (error) {
      console.error('Error checking existing requests:', error);
    }
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleNext = () => {
    const currentQuestion = questions[currentStep];
    if (currentQuestion.required && !formData[currentQuestion.id]) {
      alert('Per favore, rispondi alla domanda prima di continuare');
      return;
    }
    setCurrentStep(prev => Math.min(prev + 1, questions.length - 1));
  };

  const handlePrevious = () => {
    setCurrentStep(prev => Math.max(prev - 1, 0));
  };

  const handleSubmit = async () => {
    if (!currentUser) {
      navigate('/login');
      return;
    }

    // Validate all required fields
    const missingFields = questions
      .filter(q => q.required && !formData[q.id])
      .map(q => q.title);
    
    if (missingFields.length > 0) {
      alert(`Per favore completa tutti i campi richiesti: ${missingFields.join(', ')}`);
      return;
    }

    try {
      setLoading(true);

      await addDoc(collection(db, 'premiumRequests'), {
        userId: currentUser.uid,
        userEmail: currentUser.email,
        status: 'pending',
        requestType: 'premium_application',
        responses: formData,
        createdAt: new Date(),
        metadata: {
          completedQuestions: questions.length,
          submittedFrom: 'premium_page'
        }
      });

      alert(`✨ Richiesta Premium Inviata con Successo!

La tua candidatura è stata ricevuta e sarà valutata attentamente.

Cosa succede ora:
1. ⏰ Riceverai una risposta entro 24-48 ore
2. 📞 Se approvato, ti contatterò per un breve colloquio conoscitivo
3. 🎯 Definiremo insieme il tuo percorso personalizzato
4. 💳 Solo dopo l'approvazione potrai procedere con il pagamento

Grazie per la fiducia! 
A presto,
Il Team Mentalità Vincente`);

      navigate('/');
    } catch (error) {
      console.error('Error submitting request:', error);
      alert('Errore nell\'invio della richiesta. Riprova più tardi.');
    } finally {
      setLoading(false);
    }
  };

  // Show different UI based on status
  if (hasActiveSubscription) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center p-4">
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 max-w-md w-full text-center">
          <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
            Sei già un membro Premium!
          </h2>
          <p className="text-gray-600 dark:text-gray-300 mb-6">
            Hai già accesso a tutti i contenuti e funzionalità Premium.
          </p>
          <button
            onClick={() => navigate('/')}
            className="px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
          >
            Torna alla Home
          </button>
        </div>
      </div>
    );
  }

  if (hasActiveRequest) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center p-4">
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 max-w-md w-full text-center">
          <Clock className="h-16 w-16 text-yellow-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
            Richiesta in Valutazione
          </h2>
          <p className="text-gray-600 dark:text-gray-300 mb-6">
            La tua richiesta Premium è in fase di valutazione. 
            Riceverai una risposta entro 24-48 ore.
          </p>
          <button
            onClick={() => navigate('/')}
            className="px-6 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
          >
            Torna alla Home
          </button>
        </div>
      </div>
    );
  }

  const currentQuestion = questions[currentStep];
  const progress = ((currentStep + 1) / questions.length) * 100;

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      {/* Hero Section */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-purple-600/10 to-blue-600/10"></div>
        <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="text-center">
            <div className="flex justify-center mb-4">
              <Crown className="h-16 w-16 text-yellow-500" />
            </div>
            <h1 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-4">
              Diventa un Atleta Premium
            </h1>
            <p className="text-xl text-gray-600 dark:text-gray-300 mb-8 max-w-2xl mx-auto">
              Il percorso Premium non è per tutti. È per chi è davvero determinato a fare la differenza.
            </p>
            
            {/* Info Box */}
            <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur rounded-xl p-6 max-w-3xl mx-auto mb-8 border border-purple-200 dark:border-purple-800">
              <div className="flex items-start space-x-3">
                <AlertCircle className="h-6 w-6 text-purple-600 dark:text-purple-400 flex-shrink-0 mt-0.5" />
                <div className="text-left">
                  <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
                    Come funziona la selezione Premium
                  </h3>
                  <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-300">
                    <li className="flex items-start">
                      <span className="text-purple-600 dark:text-purple-400 mr-2">1.</span>
                      <span>Compila il questionario con attenzione e sincerità</span>
                    </li>
                    <li className="flex items-start">
                      <span className="text-purple-600 dark:text-purple-400 mr-2">2.</span>
                      <span>Valuterò personalmente la tua candidatura</span>
                    </li>
                    <li className="flex items-start">
                      <span className="text-purple-600 dark:text-purple-400 mr-2">3.</span>
                      <span>Se selezionato, fisseremo un colloquio conoscitivo</span>
                    </li>
                    <li className="flex items-start">
                      <span className="text-purple-600 dark:text-purple-400 mr-2">4.</span>
                      <span>Solo dopo l'approvazione potrai attivare il piano Premium</span>
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Questionnaire Form */}
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 pb-16">
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl overflow-hidden">
          {/* Progress Bar */}
          <div className="bg-gray-50 dark:bg-gray-700 px-6 py-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-600 dark:text-gray-300">
                Domanda {currentStep + 1} di {questions.length}
              </span>
              <span className="text-sm font-medium text-gray-600 dark:text-gray-300">
                {Math.round(progress)}% completato
              </span>
            </div>
            <div className="w-full bg-gray-200 dark:bg-gray-600 rounded-full h-2">
              <div 
                className="bg-gradient-to-r from-purple-600 to-blue-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>

          {/* Question Content */}
          <div className="p-8">
            <div className="flex items-center mb-6">
              <div className="p-3 bg-purple-100 dark:bg-purple-900/30 rounded-lg mr-4">
                {currentQuestion.icon}
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-500 dark:text-gray-400">
                  {currentQuestion.title}
                </h3>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                  {currentQuestion.question}
                </h2>
              </div>
            </div>

            {/* Input Field */}
            <div className="mb-8">
              {currentQuestion.type === 'text' && (
                <input
                  type="text"
                  value={formData[currentQuestion.id] || ''}
                  onChange={(e) => handleInputChange(currentQuestion.id, e.target.value)}
                  placeholder={currentQuestion.placeholder}
                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent text-lg"
                />
              )}

              {currentQuestion.type === 'select' && (
                <select
                  value={formData[currentQuestion.id] || ''}
                  onChange={(e) => handleInputChange(currentQuestion.id, e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent text-lg cursor-pointer"
                >
                  <option value="">Seleziona un'opzione...</option>
                  {currentQuestion.options.map((option, index) => (
                    <option key={index} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
              )}

              {currentQuestion.type === 'textarea' && (
                <textarea
                  value={formData[currentQuestion.id] || ''}
                  onChange={(e) => handleInputChange(currentQuestion.id, e.target.value)}
                  placeholder={currentQuestion.placeholder}
                  rows={4}
                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent text-lg resize-none"
                />
              )}
            </div>

            {/* Navigation Buttons */}
            <div className="flex justify-between items-center">
              <button
                onClick={handlePrevious}
                disabled={currentStep === 0}
                className={`flex items-center space-x-2 px-6 py-3 rounded-lg font-medium transition-all ${
                  currentStep === 0 
                    ? 'bg-gray-100 text-gray-400 cursor-not-allowed' 
                    : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
                }`}
              >
                <ChevronLeft className="h-5 w-5" />
                <span>Indietro</span>
              </button>

              {currentStep < questions.length - 1 ? (
                <button
                  onClick={handleNext}
                  className="flex items-center space-x-2 px-6 py-3 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg font-medium hover:from-purple-700 hover:to-blue-700 transition-all"
                >
                  <span>Avanti</span>
                  <ChevronRight className="h-5 w-5" />
                </button>
              ) : (
                <button
                  onClick={handleSubmit}
                  disabled={loading}
                  className="flex items-center space-x-2 px-8 py-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-lg font-medium hover:from-green-700 hover:to-emerald-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                      <span>Invio in corso...</span>
                    </>
                  ) : (
                    <>
                      <Send className="h-5 w-5" />
                      <span>Invia Candidatura</span>
                    </>
                  )}
                </button>
              )}
            </div>

            {/* Skip Navigation Dots */}
            <div className="flex justify-center mt-8 space-x-2">
              {questions.map((_, index) => (
                <button
                  key={index}
                  onClick={() => setCurrentStep(index)}
                  className={`w-2 h-2 rounded-full transition-all ${
                    index === currentStep 
                      ? 'w-8 bg-purple-600' 
                      : formData[questions[index].id]
                        ? 'bg-purple-400'
                        : 'bg-gray-300 dark:bg-gray-600'
                  }`}
                  aria-label={`Vai alla domanda ${index + 1}`}
                />
              ))}
            </div>
          </div>
        </div>

        {/* Benefits Section */}
        <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 text-center">
            <div className="bg-purple-100 dark:bg-purple-900/30 rounded-full w-12 h-12 flex items-center justify-center mx-auto mb-4">
              <Brain className="h-6 w-6 text-purple-600 dark:text-purple-400" />
            </div>
            <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
              Percorso Personalizzato
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-300">
              Un programma su misura per le tue esigenze specifiche
            </p>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 text-center">
            <div className="bg-blue-100 dark:bg-blue-900/30 rounded-full w-12 h-12 flex items-center justify-center mx-auto mb-4">
              <User className="h-6 w-6 text-blue-600 dark:text-blue-400" />
            </div>
            <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
              Coaching 1-on-1
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-300">
              Sessioni individuali con mental coach esperti
            </p>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 text-center">
            <div className="bg-green-100 dark:bg-green-900/30 rounded-full w-12 h-12 flex items-center justify-center mx-auto mb-4">
              <TrendingUp className="h-6 w-6 text-green-600 dark:text-green-400" />
            </div>
            <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
              Risultati Misurabili
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-300">
              Monitoraggio continuo dei tuoi progressi
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PremiumPage;