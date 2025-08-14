import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, CheckCircle, User, Target, Brain } from 'lucide-react';
import { db } from '../config/firebase';
import { doc, getDoc } from 'firebase/firestore';

const OnboardingPage = () => {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(0);
  const [welcomeContent, setWelcomeContent] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchWelcomeContent = async () => {
      try {
        const docRef = doc(db, 'appSettings', 'welcome');
        const docSnap = await getDoc(docRef);
        
        if (docSnap.exists()) {
          setWelcomeContent(docSnap.data());
        } else {
          // Contenuto di default se non configurato dall'admin
          setWelcomeContent({
            title: 'Benvenuto in Be Water Plus',
            subtitle: 'La tua forza mentale nello sport',
            description: 'Scopri tecniche di mindfulness, meditazione e mental coaching specificamente progettate per atleti come te.',
            steps: [
              {
                icon: 'User',
                title: 'Crea il tuo profilo',
                description: 'Personalizza la tua esperienza con i tuoi obiettivi sportivi'
              },
              {
                icon: 'Brain',
                title: 'Allena la mente',
                description: 'Accedi a esercizi di mindfulness e tecniche di rilassamento'
              },
              {
                icon: 'Target',
                title: 'Raggiungi i tuoi obiettivi',
                description: 'Monitora i progressi e migliora le tue performance'
              }
            ]
          });
        }
      } catch (error) {
        console.error('Errore nel caricamento contenuto benvenuto:', error);
        // Fallback content
        setWelcomeContent({
          title: 'Benvenuto in Be Water Plus',
          subtitle: 'La tua forza mentale nello sport',
          description: 'Inizia il tuo percorso di crescita mentale.',
          steps: []
        });
      } finally {
        setLoading(false);
      }
    };

    fetchWelcomeContent();
  }, []);

  const steps = [
    {
      id: 'welcome',
      component: WelcomeStep
    },
    {
      id: 'features',
      component: FeaturesStep
    },
    {
      id: 'complete',
      component: CompletionStep
    }
  ];

  const nextStep = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      // Segna l'onboarding come completato e vai alla home
      localStorage.setItem('onboardingCompleted', 'true');
      navigate('/exercises');
    }
  };

  const skipOnboarding = () => {
    localStorage.setItem('onboardingCompleted', 'true');
    navigate('/exercises');
  };

  // Controlla se l'onboarding è già stato completato
  useEffect(() => {
    const onboardingCompleted = localStorage.getItem('onboardingCompleted');
    if (onboardingCompleted === 'true') {
      navigate('/exercises');
    }
  }, [navigate]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  const CurrentStepComponent = steps[currentStep].component;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
      <div className="container mx-auto px-4 py-8 max-w-md">
        {/* Progress indicator */}
        <div className="flex justify-center mb-8">
          <div className="flex space-x-2">
            {steps.map((_, index) => (
              <div
                key={index}
                className={`h-2 w-8 rounded-full transition-colors ${
                  index <= currentStep 
                    ? 'bg-blue-500' 
                    : 'bg-gray-300 dark:bg-gray-600'
                }`}
              />
            ))}
          </div>
        </div>

        <CurrentStepComponent 
          welcomeContent={welcomeContent}
          onNext={nextStep}
          onSkip={skipOnboarding}
          isLast={currentStep === steps.length - 1}
        />
      </div>
    </div>
  );
};

const WelcomeStep = ({ welcomeContent, onNext, onSkip }) => {
  return (
    <div className="text-center">
      <div className="mb-8">
        <div className="w-24 h-24 mx-auto mb-6 bg-blue-500 rounded-full flex items-center justify-center">
          <Brain className="h-12 w-12 text-white" />
        </div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
          {welcomeContent?.title}
        </h1>
        <p className="text-xl text-blue-600 dark:text-blue-400 mb-6">
          {welcomeContent?.subtitle}
        </p>
        <p className="text-gray-600 dark:text-gray-300 text-lg leading-relaxed">
          {welcomeContent?.description}
        </p>
      </div>

      <div className="space-y-4">
        <button
          onClick={onNext}
          className="w-full bg-blue-500 hover:bg-blue-600 text-white font-semibold py-4 px-6 rounded-lg flex items-center justify-center transition-colors"
        >
          <span>Inizia il tour</span>
          <ArrowRight className="ml-2 h-5 w-5" />
        </button>
        
        <button
          onClick={onSkip}
          className="w-full text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 font-medium py-2 transition-colors"
        >
          Salta introduzione
        </button>
      </div>
    </div>
  );
};

const FeaturesStep = ({ welcomeContent, onNext }) => {
  const getIcon = (iconName) => {
    switch(iconName) {
      case 'User': return User;
      case 'Brain': return Brain;
      case 'Target': return Target;
      default: return CheckCircle;
    }
  };

  return (
    <div>
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
          Cosa puoi fare con Be Water Plus
        </h2>
      </div>

      <div className="space-y-6 mb-8">
        {welcomeContent?.steps?.map((step, index) => {
          const IconComponent = getIcon(step.icon);
          return (
            <div key={index} className="flex items-start space-x-4">
              <div className="flex-shrink-0 w-12 h-12 bg-blue-100 dark:bg-blue-900/20 rounded-lg flex items-center justify-center">
                <IconComponent className="h-6 w-6 text-blue-500" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                  {step.title}
                </h3>
                <p className="text-gray-600 dark:text-gray-300">
                  {step.description}
                </p>
              </div>
            </div>
          );
        })}
      </div>

      <button
        onClick={onNext}
        className="w-full bg-blue-500 hover:bg-blue-600 text-white font-semibold py-4 px-6 rounded-lg flex items-center justify-center transition-colors"
      >
        <span>Continua</span>
        <ArrowRight className="ml-2 h-5 w-5" />
      </button>
    </div>
  );
};

const CompletionStep = ({ onNext }) => {
  return (
    <div className="text-center">
      <div className="mb-8">
        <div className="w-24 h-24 mx-auto mb-6 bg-green-500 rounded-full flex items-center justify-center">
          <CheckCircle className="h-12 w-12 text-white" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
          Perfetto! Sei pronto a iniziare
        </h2>
        <p className="text-gray-600 dark:text-gray-300 text-lg">
          Inizia il tuo percorso di crescita mentale con i nostri esercizi personalizzati.
        </p>
      </div>

      <button
        onClick={onNext}
        className="w-full bg-green-500 hover:bg-green-600 text-white font-semibold py-4 px-6 rounded-lg flex items-center justify-center transition-colors"
      >
        <span>Inizia ora</span>
        <ArrowRight className="ml-2 h-5 w-5" />
      </button>
    </div>
  );
};

export default OnboardingPage;