import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Trophy, 
  Clock, 
  Brain, 
  Target, 
  ChevronRight, 
  ChevronLeft,
  Check,
  Star,
  Activity,
  Users,
  Zap,
  Award,
  Play
} from 'lucide-react';
import { db } from '../config/firebase';
import { 
  doc, 
  updateDoc,
  serverTimestamp
} from 'firebase/firestore';
import { useAuth } from '../context/AuthContext';

const InitialQuestionnairePage = () => {
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const [currentStep, setCurrentStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [answers, setAnswers] = useState({
    sport: '',
    level: '',
    coachingExperience: '',
    timeAvailable: '',
    mentalGoals: []
  });

  // Struttura delle 5 domande principali
  const questions = [
    {
      id: 'sport',
      type: 'select',
      title: 'Che sport pratichi?',
      description: 'Seleziona il tuo sport principale',
      icon: Trophy,
      options: [
        'Calcio',
        'Basket', 
        'Tennis',
        'Pallavolo',
        'Nuoto',
        'Atletica',
        'Ciclismo',
        'Arti Marziali',
        'Crossfit/Fitness',
        'Golf',
        'Altri sport di squadra',
        'Altri sport individuali',
        'Multiple discipline',
        'Altro'
      ]
    },
    {
      id: 'level',
      type: 'select',
      title: 'Qual è il tuo livello attuale?',
      description: 'Scegli il livello che meglio ti rappresenta',
      icon: Star,
      options: [
        'Principiante/Amatoriale',
        'Intermedio/Club locale',
        'Avanzato/Competitivo regionale',
        'Semi-professionale',
        'Professionale',
        'Ex-atleta/Allenatore'
      ]
    },
    {
      id: 'coachingExperience',
      type: 'select',
      title: 'Hai mai fatto coaching mentale/psicologico sportivo?',
      description: 'La tua esperienza con il mental coaching',
      icon: Brain,
      options: [
        'Mai fatto',
        'Qualche sessione occasionale',
        'Percorso breve (1-3 mesi)',
        'Percorso lungo (6+ mesi)',
        'Lavoro regolarmente con un mental coach',
        'Sono io stesso un coach/preparatore'
      ]
    },
    {
      id: 'timeAvailable',
      type: 'select',
      title: 'Quanto tempo puoi dedicare settimanalmente?',
      description: 'Tempo per l\'allenamento mentale e gli esercizi',
      icon: Clock,
      options: [
        '15-30 minuti',
        '30-60 minuti',
        '1-2 ore',
        '2-4 ore',
        'Più di 4 ore',
        'Dipende dal periodo'
      ]
    },
    {
      id: 'mentalGoals',
      type: 'multiselect',
      title: 'Su cosa vuoi lavorare principalmente?',
      description: 'Seleziona tutti gli obiettivi che ti interessano',
      icon: Target,
      options: [
        'Gestione dell\'ansia pre-gara',
        'Concentrazione durante l\'attività',
        'Motivazione e costanza nell\'allenamento',
        'Recupero da infortuni/sconfitte',
        'Autostima e fiducia in se stessi',
        'Gestione della pressione',
        'Visualizzazione e preparazione mentale',
        'Leadership di squadra',
        'Controllo delle emozioni',
        'Definizione e raggiungimento obiettivi',
        'Superamento di blocchi mentali',
        'Miglioramento del focus'
      ]
    }
  ];

  const currentQuestion = questions[currentStep];
  const totalSteps = questions.length;
  const progress = ((currentStep + 1) / totalSteps) * 100;

  const handleAnswer = (value) => {
    if (currentQuestion.type === 'multiselect') {
      const currentGoals = answers.mentalGoals || [];
      const newGoals = currentGoals.includes(value)
        ? currentGoals.filter(goal => goal !== value)
        : [...currentGoals, value];
      
      setAnswers(prev => ({
        ...prev,
        [currentQuestion.id]: newGoals
      }));
    } else {
      setAnswers(prev => ({
        ...prev,
        [currentQuestion.id]: value
      }));
    }
  };

  const canProceed = () => {
    const answer = answers[currentQuestion.id];
    if (currentQuestion.type === 'multiselect') {
      return answer && answer.length > 0;
    }
    return answer && answer.trim() !== '';
  };

  const handleNext = () => {
    if (currentStep < totalSteps - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      handleSubmit();
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSubmit = async () => {
    if (!currentUser) return;

    try {
      setLoading(true);

      // Salva il questionario nel profilo utente
      await updateDoc(doc(db, 'users', currentUser.uid), {
        initialQuestionnaire: {
          ...answers,
          completedAt: serverTimestamp()
        },
        initialQuestionnaireCompleted: true,
        updatedAt: serverTimestamp()
      });

      // Salva nel localStorage per il controllo lato client
      localStorage.setItem('initialQuestionnaireCompleted', 'true');

      console.log('✅ Questionario iniziale completato e salvato');
      
      // Redirect al primo passo dell'onboarding
      navigate('/onboarding');
      
    } catch (error) {
      console.error('Errore nel salvare il questionario:', error);
      // Continua comunque per non bloccare l'utente
      localStorage.setItem('initialQuestionnaireCompleted', 'true');
      navigate('/onboarding');
    } finally {
      setLoading(false);
    }
  };

  const IconComponent = currentQuestion.icon;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 via-purple-800 to-indigo-900 flex items-center justify-center px-4 py-8">
      <div className="w-full max-w-2xl">
        {/* Progress Bar */}
        <div className="mb-8">
          <div className="flex items-center justify-between text-white/80 text-sm mb-2">
            <span>Domanda {currentStep + 1} di {totalSteps}</span>
            <span>{Math.round(progress)}% completato</span>
          </div>
          <div className="w-full bg-white/20 rounded-full h-2">
            <div 
              className="bg-gradient-to-r from-blue-400 to-purple-400 h-2 rounded-full transition-all duration-500 ease-out"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        {/* Question Card */}
        <div className="bg-white/95 backdrop-blur-sm rounded-2xl shadow-2xl p-8 animate-fade-in">
          {/* Question Header */}
          <div className="flex items-center space-x-4 mb-6">
            <div className="bg-gradient-to-r from-blue-500 to-purple-600 p-3 rounded-xl">
              <IconComponent className="h-6 w-6 text-white" />
            </div>
            <div className="flex-1">
              <h2 className="text-2xl font-bold text-gray-900 mb-1">
                {currentQuestion.title}
              </h2>
              <p className="text-gray-600">
                {currentQuestion.description}
              </p>
            </div>
          </div>

          {/* Question Options */}
          <div className="space-y-3 mb-8">
            {currentQuestion.type === 'multiselect' ? (
              // Multiple selection for mental goals
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {currentQuestion.options.map((option, index) => {
                  const isSelected = answers.mentalGoals?.includes(option);
                  return (
                    <button
                      key={index}
                      onClick={() => handleAnswer(option)}
                      className={`p-4 text-left rounded-xl border-2 transition-all duration-200 ${
                        isSelected
                          ? 'border-blue-500 bg-blue-50 text-blue-900'
                          : 'border-gray-200 hover:border-blue-300 hover:bg-blue-50/50'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-medium text-sm">{option}</span>
                        {isSelected && (
                          <Check className="h-5 w-5 text-blue-600" />
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            ) : (
              // Single selection for other questions
              <div className="space-y-3">
                {currentQuestion.options.map((option, index) => {
                  const isSelected = answers[currentQuestion.id] === option;
                  return (
                    <button
                      key={index}
                      onClick={() => handleAnswer(option)}
                      className={`w-full p-4 text-left rounded-xl border-2 transition-all duration-200 ${
                        isSelected
                          ? 'border-blue-500 bg-blue-50 text-blue-900'
                          : 'border-gray-200 hover:border-blue-300 hover:bg-blue-50/50'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-medium">{option}</span>
                        {isSelected && (
                          <Check className="h-5 w-5 text-blue-600" />
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Selected Goals Summary (for multiselect) */}
          {currentQuestion.type === 'multiselect' && answers.mentalGoals?.length > 0 && (
            <div className="mb-6 p-4 bg-blue-50 rounded-xl">
              <p className="text-sm font-medium text-blue-900 mb-2">
                Obiettivi selezionati ({answers.mentalGoals.length}):
              </p>
              <div className="flex flex-wrap gap-2">
                {answers.mentalGoals.map((goal, index) => (
                  <span 
                    key={index}
                    className="px-3 py-1 bg-blue-600 text-white text-xs rounded-full"
                  >
                    {goal}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Navigation Buttons */}
          <div className="flex items-center justify-between">
            <button
              onClick={handlePrevious}
              disabled={currentStep === 0}
              className={`flex items-center space-x-2 px-6 py-3 rounded-xl font-medium transition-all ${
                currentStep === 0
                  ? 'text-gray-400 cursor-not-allowed'
                  : 'text-gray-600 hover:text-gray-800 hover:bg-gray-100'
              }`}
            >
              <ChevronLeft className="h-5 w-5" />
              <span>Indietro</span>
            </button>

            <button
              onClick={handleNext}
              disabled={!canProceed() || loading}
              className={`flex items-center space-x-2 px-8 py-3 rounded-xl font-medium transition-all ${
                canProceed() && !loading
                  ? 'bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white shadow-lg'
                  : 'bg-gray-300 text-gray-500 cursor-not-allowed'
              }`}
            >
              {loading ? (
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
              ) : (
                <>
                  <span>
                    {currentStep === totalSteps - 1 ? 'Completa' : 'Avanti'}
                  </span>
                  {currentStep === totalSteps - 1 ? (
                    <Check className="h-5 w-5" />
                  ) : (
                    <ChevronRight className="h-5 w-5" />
                  )}
                </>
              )}
            </button>
          </div>
        </div>

        {/* Footer Info */}
        <div className="text-center mt-6 text-white/60 text-sm">
          <p>Le tue risposte ci aiuteranno a personalizzare la tua esperienza</p>
        </div>
      </div>
    </div>
  );
};

export default InitialQuestionnairePage;