import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Crown, 
  Target, 
  TrendingUp, 
  Clock, 
  ChevronRight, 
  ChevronLeft,
  Check,
  Star,
  Zap,
  Award,
  DollarSign,
  Heart
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

const PremiumQuestionnairePage = () => {
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const [currentStep, setCurrentStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [questions, setQuestions] = useState([]);
  const [answers, setAnswers] = useState({});
  const [customQuestions, setCustomQuestions] = useState([]);

  // Default premium-focused questions
  const defaultQuestions = [
    {
      id: 'commitment_level',
      type: 'radio',
      question: 'Quanto sei serio/a riguardo al miglioramento delle tue performance mentali?',
      description: 'Vogliamo capire il tuo livello di impegno',
      options: [
        { value: 'casual', label: 'Sono curioso/a ma non ho fretta' },
        { value: 'interested', label: 'Sono interessato/a e vorrei migliorare' },
        { value: 'committed', label: 'Sono determinato/a a fare un salto di qualità' },
        { value: 'obsessed', label: 'È la mia priorità assoluta, voglio eccellere' }
      ],
      required: true,
      icon: Target
    },
    {
      id: 'investment_willingness',
      type: 'radio',
      question: 'Quanto saresti disposto/a a investire mensilmente per un coaching personalizzato?',
      description: 'Aiutaci a capire il tuo budget per un percorso premium',
      options: [
        { value: 'low', label: '€30-50 al mese' },
        { value: 'medium', label: '€50-100 al mese' },
        { value: 'high', label: '€100-200 al mese' },
        { value: 'premium', label: 'Più di €200 al mese' },
        { value: 'undecided', label: 'Dipende dal valore offerto' }
      ],
      required: true,
      icon: DollarSign
    },
    {
      id: 'current_struggles',
      type: 'checkbox',
      question: 'Quali sono le tue difficoltà più urgenti che vuoi risolvere?',
      description: 'Seleziona tutto quello che ti riguarda (max 5)',
      options: [
        'Ansia da prestazione che mi blocca',
        'Calo di concentrazione nei momenti decisivi',
        'Difficoltà a riprendermi dopo errori/sconfitte',
        'Mancanza di fiducia in me stesso',
        'Pressione eccessiva che mi metto addosso',
        'Problemi di comunicazione con coach/squadra',
        'Motivazione che va e viene',
        'Gestione dello stress pre-gara',
        'Paura del giudizio degli altri',
        'Blocco mentale in situazioni specifiche'
      ],
      required: true,
      minSelect: 1,
      maxSelect: 5,
      icon: Zap
    },
    {
      id: 'performance_goals',
      type: 'checkbox',
      question: 'Che risultati concreti vorresti raggiungere nei prossimi 6 mesi?',
      description: 'Sii specifico sui tuoi obiettivi (max 4)',
      options: [
        'Migliorare le performance sotto pressione',
        'Aumentare la costanza nei risultati',
        'Gestire meglio gare/competizioni importanti',
        'Sviluppare maggiore leadership in squadra',
        'Superare un plateau nelle performance',
        'Riprendermi più velocemente da infortuni',
        'Migliorare la comunicazione con il coach',
        'Aumentare la motivazione quotidiana',
        'Gestire meglio stress e ansia',
        'Sviluppare una mentalità vincente'
      ],
      required: true,
      minSelect: 1,
      maxSelect: 4,
      icon: Award
    },
    {
      id: 'time_investment',
      type: 'radio',
      question: 'Quanto tempo potresti dedicare settimanalmente al mental training premium?',
      description: 'Include sessioni individuali, esercizi e homework',
      options: [
        { value: 'minimal', label: '1-2 ore a settimana' },
        { value: 'moderate', label: '2-4 ore a settimana' },
        { value: 'dedicated', label: '4-6 ore a settimana' },
        { value: 'intensive', label: 'Più di 6 ore a settimana' }
      ],
      required: true,
      icon: Clock
    },
    {
      id: 'coaching_preference',
      type: 'radio',
      question: 'Che tipo di supporto premium preferiresti?',
      description: 'Scegli quello che senti più adatto a te',
      options: [
        { value: 'self_guided', label: 'Programma self-guided con contenuti esclusivi' },
        { value: 'group', label: 'Sessioni di gruppo con altri atleti' },
        { value: 'individual', label: 'Coaching 1-on-1 personalizzato' },
        { value: 'hybrid', label: 'Mix di contenuti + sessioni individuali' }
      ],
      required: true,
      icon: Crown
    },
    {
      id: 'urgency_level',
      type: 'radio',
      question: 'Quanto è urgente per te iniziare questo percorso?',
      description: 'Questo ci aiuta a prioritizzare le richieste',
      options: [
        { value: 'immediate', label: 'Ho bisogno di iniziare subito (entro 1 settimana)' },
        { value: 'soon', label: 'Vorrei iniziare a breve (entro 1 mese)' },
        { value: 'flexible', label: 'Posso aspettare il momento giusto (entro 3 mesi)' },
        { value: 'exploring', label: 'Sto solo esplorando le opzioni' }
      ],
      required: true,
      icon: TrendingUp
    },
    {
      id: 'success_measurement',
      type: 'radio',
      question: 'Come misureresti il successo di un programma premium?',
      description: 'Qual è il risultato più importante per te?',
      options: [
        { value: 'performance', label: 'Miglioramento misurabile delle performance' },
        { value: 'consistency', label: 'Maggiore costanza nei risultati' },
        { value: 'confidence', label: 'Aumento della fiducia in me stesso' },
        { value: 'enjoyment', label: 'Maggior piacere nel praticare il mio sport' },
        { value: 'resilience', label: 'Capacità di gestire pressione e setback' }
      ],
      required: true,
      icon: Star
    },
    {
      id: 'biggest_barrier',
      type: 'textarea',
      question: 'Qual è il più grande ostacolo mentale che ti impedisce di raggiungere il tuo potenziale?',
      description: 'Sii sincero e specifico. Questo ci aiuterà a capire come aiutarti meglio.',
      placeholder: 'Es: Durante le gare importanti mi blocco completamente e non riesco a esprimere quello che so fare in allenamento...',
      maxLength: 500,
      required: true,
      icon: Target
    },
    {
      id: 'motivation_story',
      type: 'textarea',
      question: 'Raccontaci brevemente cosa ti spinge a voler migliorare così tanto.',
      description: 'La tua storia ci aiuta a creare un percorso davvero personalizzato.',
      placeholder: 'Es: Ho sempre sognato di... / Voglio dimostrare che... / Il mio obiettivo è...',
      maxLength: 500,
      required: true,
      icon: Heart
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
        where('type', '==', 'premium')
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
      console.error('Error loading premium questions:', error);
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
      // Calculate priority score based on answers
      let priorityScore = 0;
      
      if (answers.commitment_level === 'obsessed') priorityScore += 3;
      else if (answers.commitment_level === 'committed') priorityScore += 2;
      else if (answers.commitment_level === 'interested') priorityScore += 1;

      if (answers.urgency_level === 'immediate') priorityScore += 3;
      else if (answers.urgency_level === 'soon') priorityScore += 2;
      else if (answers.urgency_level === 'flexible') priorityScore += 1;

      if (answers.investment_willingness === 'premium') priorityScore += 3;
      else if (answers.investment_willingness === 'high') priorityScore += 2;
      else if (answers.investment_willingness === 'medium') priorityScore += 1;

      // Save questionnaire responses
      const questionnaireData = {
        type: 'premium',
        answers,
        priorityScore,
        status: 'pending', // pending, reviewing, approved, rejected
        completedAt: new Date(),
        userId: currentUser?.uid,
        userEmail: currentUser?.email,
        // Add analyzed data for easy querying
        commitmentLevel: answers.commitment_level,
        investmentWillingness: answers.investment_willingness,
        urgencyLevel: answers.urgency_level,
        timeInvestment: answers.time_investment,
        coachingPreference: answers.coaching_preference
      };

      // Save to user's questionnaires subcollection
      if (currentUser) {
        await setDoc(
          doc(db, 'users', currentUser.uid, 'questionnaires', 'premium'),
          questionnaireData
        );

        // Also save to global premium requests collection for admin
        await setDoc(
          doc(db, 'premiumRequests', `${currentUser.uid}_${Date.now()}`),
          {
            ...questionnaireData,
            userName: currentUser.displayName || 'Atleta',
            createdAt: new Date()
          }
        );

        // Update user profile with premium request status
        await setDoc(
          doc(db, 'users', currentUser.uid),
          {
            premiumRequested: true,
            premiumRequestDate: new Date(),
            premiumRequestStatus: 'pending'
          },
          { merge: true }
        );
      }

      // Show success message
      alert('🎉 Richiesta Premium inviata con successo!\n\nRiceverai una risposta entro 24-48 ore via email.\n\nGrazie per il tuo interesse!');
      
      // Navigate back to premium page
      navigate('/premium');
    } catch (error) {
      console.error('Error submitting premium questionnaire:', error);
      alert('Errore nel salvataggio. Riprova.');
    } finally {
      setLoading(false);
    }
  };

  if (questions.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-yellow-50 to-amber-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-600"></div>
      </div>
    );
  }

  const currentQuestion = questions[currentStep];
  const progress = ((currentStep + 1) / questions.length) * 100;
  const Icon = currentQuestion.icon || Crown;

  return (
    <div className="min-h-screen bg-gradient-to-br from-yellow-50 to-amber-100 dark:from-gray-900 dark:to-gray-800">
      {/* Progress Bar */}
      <div className="fixed top-0 left-0 right-0 h-1 bg-gray-200 dark:bg-gray-700 z-50">
        <div 
          className="h-full bg-gradient-to-r from-yellow-500 to-amber-600 transition-all duration-300"
          style={{ width: `${progress}%` }}
        />
      </div>

      <div className="container mx-auto px-4 py-8 pt-12">
        <div className="max-w-3xl mx-auto">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="flex justify-center mb-4">
              <Crown className="h-12 w-12 text-amber-600" />
            </div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
              Richiesta Premium
            </h1>
            <p className="text-gray-600 dark:text-gray-300">
              Domanda {currentStep + 1} di {questions.length}
            </p>
          </div>

          {/* Question Card */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 border border-amber-200 dark:border-amber-800">
            {/* Question Icon */}
            <div className="flex justify-center mb-6">
              <div className="w-16 h-16 bg-amber-100 dark:bg-amber-900/30 rounded-full flex items-center justify-center">
                <Icon className="h-8 w-8 text-amber-600 dark:text-amber-400" />
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
              {/* Radio Type */}
              {currentQuestion.type === 'radio' && (
                <div className="space-y-3">
                  {currentQuestion.options.map(option => {
                    const value = typeof option === 'string' ? option : option.value;
                    const label = typeof option === 'string' ? option : option.label;
                    return (
                      <label
                        key={value}
                        className={`flex items-center p-4 border rounded-lg cursor-pointer transition-colors ${
                          answers[currentQuestion.id] === value
                            ? 'border-amber-500 bg-amber-50 dark:bg-amber-900/20'
                            : 'border-gray-200 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700'
                        }`}
                      >
                        <input
                          type="radio"
                          name={currentQuestion.id}
                          value={value}
                          checked={answers[currentQuestion.id] === value}
                          onChange={(e) => handleAnswer(currentQuestion.id, e.target.value)}
                          className="w-5 h-5 text-amber-600 focus:ring-amber-500"
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
                        className={`flex items-start p-4 border rounded-lg cursor-pointer transition-colors ${
                          isChecked
                            ? 'border-amber-500 bg-amber-50 dark:bg-amber-900/20'
                            : 'border-gray-200 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700'
                        }`}
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
                          className="w-5 h-5 text-amber-600 rounded focus:ring-amber-500 mt-0.5"
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

              {/* Textarea Type */}
              {currentQuestion.type === 'textarea' && (
                <div>
                  <textarea
                    value={answers[currentQuestion.id] || ''}
                    onChange={(e) => handleAnswer(currentQuestion.id, e.target.value)}
                    placeholder={currentQuestion.placeholder}
                    maxLength={currentQuestion.maxLength}
                    rows={6}
                    className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-amber-500 dark:bg-gray-700 dark:text-white"
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
                className="flex items-center space-x-2 px-6 py-3 bg-gradient-to-r from-amber-600 to-yellow-600 text-white rounded-lg font-medium hover:from-amber-700 hover:to-yellow-700 transition-all disabled:opacity-50"
              >
                <span>
                  {currentStep === questions.length - 1 ? 'Invia Richiesta' : 'Avanti'}
                </span>
                {currentStep === questions.length - 1 ? (
                  <Crown className="h-5 w-5" />
                ) : (
                  <ChevronRight className="h-5 w-5" />
                )}
              </button>
            </div>
          </div>

          {/* Back to Premium */}
          <div className="text-center mt-6">
            <button
              onClick={() => navigate('/premium')}
              className="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 text-sm"
            >
              Torna alla pagina Premium
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PremiumQuestionnairePage;