import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Trophy, 
  Calendar, 
  Brain, 
  Target, 
  ChevronRight, 
  ChevronLeft,
  Check,
  Star,
  Activity,
  Users,
  Zap
} from 'lucide-react';
import { db } from '../config/firebase';
import { 
  doc, 
  setDoc,
  getDoc,
  collection,
  getDocs,
  query,
  where,
  orderBy
} from 'firebase/firestore';
import { useAuth } from '../context/AuthContext';

const InitialQuestionnairePage = () => {
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const [currentStep, setCurrentStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [questions, setQuestions] = useState([]);
  const [answers, setAnswers] = useState({});
  const [customQuestions, setCustomQuestions] = useState([]);

  // Default questions structure
  const defaultQuestions = [
    {
      id: 'sport',
      type: 'select',
      question: 'Che sport pratichi?',
      description: 'Seleziona il tuo sport principale',
      options: [
        'Calcio', 'Basket', 'Pallavolo', 'Tennis', 'Nuoto', 
        'Atletica', 'Ciclismo', 'Rugby', 'Arti Marziali', 
        'Golf', 'Sci', 'Danza', 'Ginnastica', 'Altro'
      ],
      required: true,
      icon: Trophy
    },
    {
      id: 'experience',
      type: 'select',
      question: 'Da quanti anni pratichi questo sport?',
      description: 'Aiutaci a capire il tuo livello di esperienza',
      options: [
        'Meno di 1 anno',
        '1-2 anni',
        '3-5 anni',
        '6-10 anni',
        'Più di 10 anni'
      ],
      required: true,
      icon: Calendar
    },
    {
      id: 'level',
      type: 'select',
      question: 'A che livello competi?',
      description: 'Seleziona il livello più alto raggiunto',
      options: [
        'Amatoriale',
        'Locale/Provinciale',
        'Regionale',
        'Nazionale',
        'Internazionale',
        'Professionista'
      ],
      required: true,
      icon: Star
    },
    {
      id: 'coaching_knowledge',
      type: 'radio',
      question: 'Conosci già il mental coaching?',
      description: 'Hai esperienza con tecniche di allenamento mentale?',
      options: [
        { value: 'none', label: 'No, è la prima volta' },
        { value: 'basic', label: 'Ho sentito parlarne ma non l\'ho mai provato' },
        { value: 'some', label: 'Ho provato qualche tecnica base' },
        { value: 'experienced', label: 'Ho già lavorato con un mental coach' }
      ],
      required: true,
      icon: Brain
    },
    {
      id: 'goals',
      type: 'checkbox',
      question: 'Su cosa vuoi lavorare principalmente?',
      description: 'Puoi selezionare più opzioni',
      options: [
        'Gestione dell\'ansia pre-gara',
        'Concentrazione e focus',
        'Motivazione e costanza',
        'Gestione della pressione',
        'Resilienza dopo sconfitte',
        'Visualizzazione del successo',
        'Comunicazione con la squadra',
        'Leadership',
        'Gestione delle emozioni',
        'Autostima e fiducia'
      ],
      required: true,
      minSelect: 1,
      maxSelect: 5,
      icon: Target
    },
    {
      id: 'self_evaluation',
      type: 'rating',
      question: 'Come ti valuti in questi aspetti?',
      description: 'Valuta da 1 (molto scarso) a 5 (eccellente)',
      items: [
        { id: 'concentration', label: 'Concentrazione durante la gara' },
        { id: 'pressure', label: 'Gestione della pressione' },
        { id: 'motivation', label: 'Motivazione costante' },
        { id: 'confidence', label: 'Fiducia in te stesso' },
        { id: 'recovery', label: 'Recupero dopo errori/sconfitte' },
        { id: 'teamwork', label: 'Lavoro di squadra' }
      ],
      required: true,
      icon: Activity
    },
    {
      id: 'training_frequency',
      type: 'select',
      question: 'Quanto spesso ti alleni fisicamente?',
      description: 'Includi allenamenti e partite',
      options: [
        '1-2 volte a settimana',
        '3-4 volte a settimana',
        '5-6 volte a settimana',
        'Tutti i giorni',
        'Più volte al giorno'
      ],
      required: true,
      icon: Zap
    },
    {
      id: 'time_availability',
      type: 'select',
      question: 'Quanto tempo puoi dedicare al mental training?',
      description: 'Tempo giornaliero per esercizi mentali',
      options: [
        '5-10 minuti',
        '10-15 minuti',
        '15-30 minuti',
        '30-45 minuti',
        'Più di 45 minuti'
      ],
      required: true,
      icon: Calendar
    },
    {
      id: 'biggest_challenge',
      type: 'textarea',
      question: 'Qual è la tua sfida più grande nello sport?',
      description: 'Descrivi brevemente la difficoltà principale che affronti',
      placeholder: 'Es: Tendo a perdere concentrazione nei momenti decisivi...',
      maxLength: 500,
      required: true,
      icon: Target
    },
    {
      id: 'expectations',
      type: 'textarea',
      question: 'Cosa ti aspetti da questo percorso?',
      description: 'Quali risultati speri di ottenere?',
      placeholder: 'Es: Vorrei migliorare la mia capacità di gestire la pressione...',
      maxLength: 500,
      required: false,
      icon: Star
    }
  ];

  useEffect(() => {
    loadQuestions();
  }, []);

  const loadQuestions = async () => {
    try {
      // Try to load custom questions from Firebase
      // Simplified query to avoid index requirement
      const questionsQuery = query(
        collection(db, 'questionnaireQuestions'),
        where('type', '==', 'initial')
      );
      
      const snapshot = await getDocs(questionsQuery);
      const customQs = [];
      
      snapshot.forEach((doc) => {
        const data = doc.data();
        // Filter active questions in code instead of query
        if (data.isActive !== false) {
          customQs.push({
            id: doc.id,
            ...data
          });
        }
      });

      // Sort by order in code
      customQs.sort((a, b) => (a.order || 0) - (b.order || 0));

      if (customQs.length > 0) {
        setCustomQuestions(customQs);
        setQuestions(customQs);
      } else {
        setQuestions(defaultQuestions);
      }
    } catch (error) {
      console.error('Error loading questions:', error);
      setQuestions(defaultQuestions);
    }
  };

  const handleAnswer = (questionId, value) => {
    setAnswers(prev => ({
      ...prev,
      [questionId]: value
    }));
  };

  const validateCurrentStep = () => {
    const currentQuestion = questions[currentStep];
    if (!currentQuestion) return true;

    const answer = answers[currentQuestion.id];
    
    if (currentQuestion.required && !answer) {
      alert('Per favore rispondi alla domanda prima di continuare');
      return false;
    }

    if (currentQuestion.type === 'checkbox') {
      const selectedCount = answer ? answer.length : 0;
      if (currentQuestion.minSelect && selectedCount < currentQuestion.minSelect) {
        alert(`Seleziona almeno ${currentQuestion.minSelect} opzioni`);
        return false;
      }
      if (currentQuestion.maxSelect && selectedCount > currentQuestion.maxSelect) {
        alert(`Puoi selezionare massimo ${currentQuestion.maxSelect} opzioni`);
        return false;
      }
    }

    if (currentQuestion.type === 'rating' && currentQuestion.required) {
      const items = currentQuestion.items || [];
      const hasAllRatings = items.every(item => 
        answer && answer[item.id] && answer[item.id] > 0
      );
      if (!hasAllRatings) {
        alert('Per favore valuta tutti gli aspetti');
        return false;
      }
    }

    return true;
  };

  const nextStep = () => {
    if (!validateCurrentStep()) return;
    
    if (currentStep < questions.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      submitQuestionnaire();
    }
  };

  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const submitQuestionnaire = async () => {
    setLoading(true);
    try {
      console.log('🔄 QUESTIONNAIRE SUBMIT - Starting...', {
        currentUser: currentUser?.uid,
        answers: answers
      });

      // Save questionnaire responses
      const questionnaireData = {
        type: 'initial',
        answers,
        completedAt: new Date(),
        userId: currentUser?.uid,
        userEmail: currentUser?.email,
        // Add analyzed data for easy querying
        sport: answers.sport,
        level: answers.level,
        experience: answers.experience,
        goals: answers.goals || [],
        selfEvaluation: answers.self_evaluation || {}
      };

      console.log('📝 QUESTIONNAIRE DATA:', questionnaireData);

      // Save to user's questionnaires subcollection
      if (currentUser) {
        console.log('💾 Saving to user subcollection...');
        await setDoc(
          doc(db, 'users', currentUser.uid, 'questionnaires', 'initial'),
          questionnaireData
        );
        console.log('✅ User subcollection saved');

        // Also save to global questionnaires collection for admin
        console.log('💾 Saving to global collection...');
        await setDoc(
          doc(db, 'questionnaires', `${currentUser.uid}_initial`),
          {
            ...questionnaireData,
            userName: currentUser.displayName || currentUser.email || 'Atleta'
          }
        );
        console.log('✅ Global collection saved');

        // Update user profile with questionnaire completion
        console.log('💾 Updating user profile...');
        await setDoc(
          doc(db, 'users', currentUser.uid),
          {
            initialQuestionnaireCompleted: true,
            initialQuestionnaireDate: new Date(),
            sport: answers.sport,
            level: answers.level
          },
          { merge: true }
        );
        console.log('✅ User profile updated');
      }

      // Mark questionnaire as completed in localStorage
      localStorage.setItem('initialQuestionnaireCompleted', 'true');
      console.log('✅ localStorage updated');
      
      console.log('🎉 QUESTIONNAIRE SUBMIT - Success! Navigating to welcome...');
      // Navigate to welcome page
      navigate('/welcome');
    } catch (error) {
      console.error('❌ QUESTIONNAIRE SUBMIT ERROR:', error);
      console.error('Error details:', {
        code: error.code,
        message: error.message,
        stack: error.stack
      });
      alert(`Errore nel salvataggio: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  if (questions.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  const currentQuestion = questions[currentStep];
  const progress = ((currentStep + 1) / questions.length) * 100;
  const Icon = currentQuestion.icon || Brain;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
      {/* Progress Bar */}
      <div className="fixed top-0 left-0 right-0 h-1 bg-gray-200 dark:bg-gray-700 z-50">
        <div 
          className="h-full bg-indigo-600 transition-all duration-300"
          style={{ width: `${progress}%` }}
        />
      </div>

      <div className="container mx-auto px-4 py-8 pt-12">
        <div className="max-w-3xl mx-auto">
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
              Questionario Iniziale
            </h1>
            <p className="text-gray-600 dark:text-gray-300">
              Domanda {currentStep + 1} di {questions.length}
            </p>
          </div>

          {/* Question Card */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8">
            {/* Question Icon */}
            <div className="flex justify-center mb-6">
              <div className="w-16 h-16 bg-indigo-100 dark:bg-indigo-900/30 rounded-full flex items-center justify-center">
                <Icon className="h-8 w-8 text-indigo-600 dark:text-indigo-400" />
              </div>
            </div>

            {/* Question */}
            <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-3 text-center">
              {currentQuestion.question}
            </h2>
            
            {currentQuestion.description && (
              <p className="text-gray-600 dark:text-gray-400 mb-8 text-center">
                {currentQuestion.description}
              </p>
            )}

            {/* Answer Options */}
            <div className="space-y-3">
              {/* Select Type */}
              {currentQuestion.type === 'select' && (
                <select
                  value={answers[currentQuestion.id] || ''}
                  onChange={(e) => handleAnswer(currentQuestion.id, e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 dark:bg-gray-700 dark:text-white text-lg"
                >
                  <option value="">Seleziona...</option>
                  {currentQuestion.options.map(option => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
              )}

              {/* Radio Type */}
              {currentQuestion.type === 'radio' && (
                <div className="space-y-3">
                  {currentQuestion.options.map(option => {
                    const value = typeof option === 'string' ? option : option.value;
                    const label = typeof option === 'string' ? option : option.label;
                    return (
                      <label
                        key={value}
                        className="flex items-center p-4 border border-gray-200 dark:border-gray-600 rounded-lg cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                      >
                        <input
                          type="radio"
                          name={currentQuestion.id}
                          value={value}
                          checked={answers[currentQuestion.id] === value}
                          onChange={(e) => handleAnswer(currentQuestion.id, e.target.value)}
                          className="w-5 h-5 text-indigo-600 focus:ring-indigo-500"
                        />
                        <span className="ml-3 text-gray-900 dark:text-white">{label}</span>
                      </label>
                    );
                  })}
                </div>
              )}

              {/* Checkbox Type */}
              {currentQuestion.type === 'checkbox' && (
                <div className="space-y-3">
                  {currentQuestion.options.map(option => {
                    const isChecked = (answers[currentQuestion.id] || []).includes(option);
                    return (
                      <label
                        key={option}
                        className="flex items-center p-4 border border-gray-200 dark:border-gray-600 rounded-lg cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                      >
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={(e) => {
                            const currentAnswers = answers[currentQuestion.id] || [];
                            let newAnswers;
                            if (e.target.checked) {
                              newAnswers = [...currentAnswers, option];
                            } else {
                              newAnswers = currentAnswers.filter(a => a !== option);
                            }
                            handleAnswer(currentQuestion.id, newAnswers);
                          }}
                          className="w-5 h-5 text-indigo-600 rounded focus:ring-indigo-500"
                        />
                        <span className="ml-3 text-gray-900 dark:text-white">{option}</span>
                      </label>
                    );
                  })}
                  {currentQuestion.maxSelect && (
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
                      Seleziona massimo {currentQuestion.maxSelect} opzioni
                      {answers[currentQuestion.id] && ` (${answers[currentQuestion.id].length} selezionate)`}
                    </p>
                  )}
                </div>
              )}

              {/* Rating Type */}
              {currentQuestion.type === 'rating' && (
                <div className="space-y-4">
                  {currentQuestion.items.map(item => {
                    const rating = answers[currentQuestion.id]?.[item.id] || 0;
                    return (
                      <div key={item.id} className="space-y-2">
                        <div className="flex justify-between items-center">
                          <span className="text-gray-700 dark:text-gray-300">{item.label}</span>
                          <span className="text-sm text-gray-500 dark:text-gray-400">
                            {rating > 0 ? rating : 'Non valutato'}
                          </span>
                        </div>
                        <div className="flex space-x-2">
                          {[1, 2, 3, 4, 5].map(value => (
                            <button
                              key={value}
                              onClick={() => {
                                const currentRatings = answers[currentQuestion.id] || {};
                                handleAnswer(currentQuestion.id, {
                                  ...currentRatings,
                                  [item.id]: value
                                });
                              }}
                              className={`flex-1 py-2 rounded-lg font-medium transition-colors ${
                                rating === value
                                  ? 'bg-indigo-600 text-white'
                                  : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600'
                              }`}
                            >
                              {value}
                            </button>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                  <div className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                    1 = Molto scarso | 5 = Eccellente
                  </div>
                </div>
              )}

              {/* Textarea Type */}
              {currentQuestion.type === 'textarea' && (
                <div>
                  <textarea
                    value={answers[currentQuestion.id] || ''}
                    onChange={(e) => handleAnswer(currentQuestion.id, e.target.value)}
                    placeholder={currentQuestion.placeholder}
                    maxLength={currentQuestion.maxLength}
                    rows={5}
                    className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 dark:bg-gray-700 dark:text-white"
                  />
                  {currentQuestion.maxLength && (
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                      {(answers[currentQuestion.id] || '').length} / {currentQuestion.maxLength} caratteri
                    </p>
                  )}
                </div>
              )}
            </div>

            {/* Navigation */}
            <div className="flex justify-between items-center mt-8">
              <button
                onClick={prevStep}
                disabled={currentStep === 0}
                className={`flex items-center space-x-2 px-6 py-3 rounded-lg font-medium transition-colors ${
                  currentStep === 0
                    ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                    : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-200 hover:bg-gray-300 dark:hover:bg-gray-600'
                }`}
              >
                <ChevronLeft className="h-5 w-5" />
                <span>Indietro</span>
              </button>

              <button
                onClick={nextStep}
                disabled={loading}
                className="flex items-center space-x-2 px-6 py-3 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 transition-colors disabled:opacity-50"
              >
                <span>
                  {currentStep === questions.length - 1 ? 'Completa' : 'Avanti'}
                </span>
                {currentStep === questions.length - 1 ? (
                  <Check className="h-5 w-5" />
                ) : (
                  <ChevronRight className="h-5 w-5" />
                )}
              </button>
            </div>
          </div>

          {/* Skip for now */}
          <div className="text-center mt-6">
            <button
              onClick={() => navigate('/welcome')}
              className="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 text-sm"
            >
              Compila più tardi
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default InitialQuestionnairePage;