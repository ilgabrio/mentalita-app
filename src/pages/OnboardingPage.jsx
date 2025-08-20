import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  ArrowRight, 
  ArrowLeft, 
  CheckCircle, 
  ChevronRight,
  Play,
  Brain,
  FileText,
  RotateCcw,
  Home
} from 'lucide-react';
import { db } from '../config/firebase';
import { 
  doc, 
  getDoc, 
  updateDoc, 
  collection, 
  getDocs,
  query,
  where,
  orderBy 
} from 'firebase/firestore';
import { useAuth } from '../context/AuthContext';

const OnboardingPage = () => {
  const navigate = useNavigate();
  const { currentUser, userProfile } = useAuth();
  const [currentStep, setCurrentStep] = useState(0);
  const [steps, setSteps] = useState([]);
  const [loading, setLoading] = useState(true);
  const [completing, setCompleting] = useState(false);
  const [completedSteps, setCompletedSteps] = useState(new Set());
  const [exercises, setExercises] = useState({});
  const [articles, setArticles] = useState({});
  const [videos, setVideos] = useState({});

  useEffect(() => {
    fetchOnboardingSteps();
  }, []);

  const fetchOnboardingSteps = async () => {
    try {
      setLoading(true);
      
      // Fetch all onboarding steps and filter/sort locally
      const snapshot = await getDocs(collection(db, 'onboardingSteps'));
      const stepsData = [];
      
      snapshot.forEach((doc) => {
        const data = doc.data();
        // Only include active steps
        if (data.isActive === true) {
          stepsData.push({
            id: doc.id,
            ...data
          });
        }
      });
      
      // Sort by order locally
      stepsData.sort((a, b) => (a.order || 0) - (b.order || 0));

      // Fetch exercises, articles, and videos for the steps
      const exerciseIds = [...new Set(stepsData.map(step => step.exerciseId).filter(Boolean))];
      const articleIds = [...new Set(stepsData.map(step => step.articleId).filter(Boolean))];
      const videoIds = [...new Set(stepsData.map(step => step.videoId).filter(Boolean))];
      
      // Fetch exercises
      const exercisesData = {};
      if (exerciseIds.length > 0) {
        for (const exerciseId of exerciseIds) {
          try {
            const exerciseDoc = await getDoc(doc(db, 'exercises', exerciseId));
            if (exerciseDoc.exists()) {
              exercisesData[exerciseId] = { id: exerciseId, ...exerciseDoc.data() };
            }
          } catch (error) {
            console.error(`Error fetching exercise ${exerciseId}:`, error);
          }
        }
      }

      // Fetch articles
      const articlesData = {};
      if (articleIds.length > 0) {
        for (const articleId of articleIds) {
          try {
            const articleDoc = await getDoc(doc(db, 'articles', articleId));
            if (articleDoc.exists()) {
              articlesData[articleId] = { id: articleId, ...articleDoc.data() };
            }
          } catch (error) {
            console.error(`Error fetching article ${articleId}:`, error);
          }
        }
      }

      // Fetch videos
      const videosData = {};
      if (videoIds.length > 0) {
        for (const videoId of videoIds) {
          try {
            // Prova prima dalla collezione appVideos
            let videoDoc = await getDoc(doc(db, 'appVideos', videoId));
            if (!videoDoc.exists()) {
              // Se non esiste, prova dalla collezione videos
              videoDoc = await getDoc(doc(db, 'videos', videoId));
            }
            if (videoDoc.exists()) {
              videosData[videoId] = { id: videoId, ...videoDoc.data() };
            }
          } catch (error) {
            console.error(`Error fetching video ${videoId}:`, error);
          }
        }
      }

      setSteps(stepsData);
      setExercises(exercisesData);
      setArticles(articlesData);
      setVideos(videosData);

      // If no steps configured, create default steps
      if (stepsData.length === 0) {
        console.log('No onboarding steps configured - creating default steps');
        const defaultSteps = [
          {
            id: 'welcome',
            title: "Benvenuto in Mentalità",
            description: "Scopri come la forza mentale può trasformare le tue performance sportive.",
            content: "Benvenuto nella community di atleti che vogliono sviluppare la propria forza mentale. Questo percorso ti guiderà attraverso tecniche e strategie usate dai campioni.",
            order: 1,
            isActive: true,
            type: "welcome"
          },
          {
            id: 'profile',
            title: "Il Tuo Profilo Atleta", 
            description: "Crea il tuo profilo personalizzato per un'esperienza su misura.",
            content: "Raccontaci di te, del tuo sport e dei tuoi obiettivi. Questo ci aiuterà a personalizzare il tuo percorso di crescita mentale.",
            order: 2,
            isActive: true,
            type: "profile"
          },
          {
            id: 'completion',
            title: "Completa il Setup",
            description: "Pronto per iniziare il tuo viaggio verso l'eccellenza.",
            content: "Perfetto! Ora sei pronto per accedere al questionario iniziale e iniziare il tuo percorso personalizzato di crescita mentale.",
            order: 3,
            isActive: true,
            type: "completion"
          }
        ];
        setSteps(defaultSteps);
      }

    } catch (error) {
      console.error('Error fetching onboarding steps:', error);
    } finally {
      setLoading(false);
    }
  };

  const completeOnboarding = async () => {
    try {
      setCompleting(true);
      
      // Save to localStorage
      localStorage.setItem('onboardingCompleted', 'true');
      
      // Save to Firestore if user is logged in
      if (currentUser) {
        await updateDoc(doc(db, 'users', currentUser.uid), {
          onboardingCompleted: true,
          onboardingCompletedAt: new Date(),
          completedOnboardingSteps: Array.from(completedSteps)
        });
      }
      
      // Navigate to questionnaire page
      navigate('/questionnaire/initial');
    } catch (error) {
      console.error('Error completing onboarding:', error);
      // Still navigate even if Firestore update fails
      navigate('/questionnaire/initial');
    } finally {
      setCompleting(false);
    }
  };

  const nextStep = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      completeOnboarding();
    }
  };

  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const skipOnboarding = () => {
    completeOnboarding();
  };

  const goToExercise = (exerciseId) => {
    if (exerciseId) {
      navigate(`/exercise/${exerciseId}?from=onboarding&step=${currentStep}`);
    }
  };

  const goToArticle = (articleId) => {
    if (articleId) {
      navigate(`/article/${articleId}?from=onboarding&step=${currentStep}`);
    }
  };

  const markStepCompleted = (stepIndex) => {
    setCompletedSteps(prev => new Set([...prev, stepIndex]));
  };

  // Check if onboarding is already completed
  useEffect(() => {
    if (currentUser && userProfile) {
      const localOnboarding = localStorage.getItem('onboardingCompleted');
      const firestoreOnboarding = userProfile.onboardingCompleted;
      
      if (localOnboarding === 'true' || firestoreOnboarding === true) {
        navigate('/questionnaire/initial');
      }
    }
  }, [currentUser, userProfile, navigate]);

  // Handle returning from exercise/article
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const fromExercise = urlParams.get('completed') === 'true';
    const stepParam = urlParams.get('step');
    
    if (fromExercise && stepParam !== null) {
      const stepIndex = parseInt(stepParam);
      markStepCompleted(stepIndex);
      setCurrentStep(stepIndex);
      // Clean up URL
      window.history.replaceState({}, '', '/onboarding');
    }
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-900 to-purple-800 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-white mx-auto mb-4"></div>
          <p className="text-white text-lg">Caricamento percorso...</p>
        </div>
      </div>
    );
  }

  // Show fallback message only if loading is complete and still no steps
  if (!loading && steps.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-900 to-purple-800 flex items-center justify-center">
        <div className="text-center text-white max-w-md mx-auto px-6">
          <div className="mb-8">
            <Home className="h-16 w-16 mx-auto mb-4 opacity-60" />
          </div>
          <h1 className="text-2xl font-bold mb-4">Errore di Configurazione</h1>
          <p className="text-lg mb-8 opacity-90">
            Impossibile caricare l'onboarding. 
            Procedi direttamente al questionario iniziale.
          </p>
          <button
            onClick={skipOnboarding}
            className="px-8 py-3 bg-white text-indigo-900 rounded-lg font-medium hover:bg-gray-100 transition-colors"
          >
            Continua al Questionario
          </button>
        </div>
      </div>
    );
  }

  const currentStepData = steps[currentStep];
  const progress = ((currentStep + 1) / steps.length) * 100;
  const exercise = exercises[currentStepData?.exerciseId];
  const article = articles[currentStepData?.articleId];
  const video = videos[currentStepData?.videoId];
  const isStepCompleted = completedSteps.has(currentStep);

  const getYoutubeVideoId = (url) => {
    if (!url) return null;
    const match = url.match(/(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/);
    return match ? match[1] : null;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-900 to-purple-800">
      {/* Progress Bar */}
      <div className="absolute top-0 left-0 right-0 h-1 bg-black/10 z-10">
        <div 
          className="h-full bg-white/60 transition-all duration-300"
          style={{ width: `${progress}%` }}
        />
      </div>

      {/* Skip Button */}
      <div className="absolute top-4 right-4 z-10">
        <button
          onClick={skipOnboarding}
          className="px-4 py-2 text-sm bg-white/10 hover:bg-white/20 backdrop-blur-sm rounded-lg transition-colors text-white"
        >
          Salta introduzione
        </button>
      </div>

      {/* Step Counter */}
      <div className="absolute top-4 left-4 z-10">
        <div className="px-3 py-1 bg-white/10 backdrop-blur-sm rounded-full text-white text-sm font-medium">
          Passo {currentStep + 1} di {steps.length}
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex items-center justify-center px-6 py-12 pt-16">
        <div className="max-w-4xl w-full mx-auto">
          {/* Step Content */}
          <div className="text-center mb-12">
            {/* Title */}
            <h1 className="text-4xl md:text-5xl font-bold mb-6 text-white animate-fade-in">
              {currentStepData.title}
            </h1>

            {/* Description */}
            {currentStepData.description && (
              <p className="text-xl mb-8 max-w-3xl mx-auto text-white/90 animate-fade-in-delay">
                {currentStepData.description}
              </p>
            )}

            {/* Video Section */}
            {video && (
              <div className="mb-12 animate-fade-in-delay-2">
                <div className="max-w-3xl mx-auto">
                  <div className="bg-black/20 backdrop-blur-sm rounded-xl p-6">
                    <div className="aspect-w-16 aspect-h-9 rounded-lg overflow-hidden shadow-xl bg-black">
                      {video.videoUrl && getYoutubeVideoId(video.videoUrl) ? (
                        <iframe
                          src={`https://www.youtube.com/embed/${getYoutubeVideoId(video.videoUrl)}`}
                          title={video.title || currentStepData.title}
                          frameBorder="0"
                          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                          allowFullScreen
                          className="w-full h-full"
                          style={{ minHeight: '400px' }}
                        />
                      ) : (
                        <div className="flex items-center justify-center h-full" style={{ minHeight: '400px' }}>
                          <div className="text-center text-white/70">
                            <Play className="h-16 w-16 mx-auto mb-4" />
                            <p className="text-lg font-medium">{video.title}</p>
                            <p className="text-sm opacity-70">Video non disponibile</p>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="space-y-6 animate-fade-in-delay-3">
              {/* Exercise Button */}
              {exercise && (
                <div className="max-w-2xl mx-auto">
                  <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <div className="p-3 bg-blue-500/20 rounded-full">
                          <Brain className="h-6 w-6 text-blue-300" />
                        </div>
                        <div className="text-left">
                          <h3 className="text-lg font-semibold text-white">
                            {exercise.title}
                          </h3>
                          <p className="text-white/70 text-sm">
                            Esercizio pratico per applicare il concetto
                          </p>
                        </div>
                      </div>
                      <button
                        onClick={() => goToExercise(currentStepData.exerciseId)}
                        className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors flex items-center space-x-2"
                      >
                        <span>{isStepCompleted ? 'Rifai' : 'Inizia'} Esercizio</span>
                        {isStepCompleted ? <RotateCcw className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Article Button (Optional) */}
              {article && (
                <div className="max-w-2xl mx-auto">
                  <div className="bg-white/5 backdrop-blur-sm rounded-xl p-4 border border-white/10">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="p-2 bg-green-500/20 rounded-full">
                          <FileText className="h-5 w-5 text-green-300" />
                        </div>
                        <div className="text-left">
                          <h4 className="font-medium text-white">
                            {article.title}
                          </h4>
                          <p className="text-white/60 text-xs">
                            Approfondimento opzionale
                          </p>
                        </div>
                      </div>
                      <button
                        onClick={() => goToArticle(currentStepData.articleId)}
                        className="px-4 py-2 bg-green-600/20 hover:bg-green-600/30 text-green-200 rounded-lg text-sm font-medium transition-colors flex items-center space-x-1"
                      >
                        <span>Leggi</span>
                        <ChevronRight className="h-3 w-3" />
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Completion Message */}
              {isStepCompleted && currentStepData.completionMessage && (
                <div className="max-w-2xl mx-auto">
                  <div className="bg-green-500/10 border border-green-500/20 rounded-xl p-4">
                    <div className="flex items-center space-x-3">
                      <CheckCircle className="h-6 w-6 text-green-400" />
                      <p className="text-green-200 font-medium">
                        {currentStepData.completionMessage}
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Navigation */}
          <div className="flex items-center justify-between">
            {/* Previous Button */}
            <button
              onClick={prevStep}
              className={`flex items-center space-x-2 px-6 py-3 rounded-lg font-medium transition-all ${
                currentStep === 0 
                  ? 'opacity-0 pointer-events-none' 
                  : 'opacity-100 bg-white/10 hover:bg-white/20 backdrop-blur-sm text-white'
              }`}
            >
              <ArrowLeft className="h-5 w-5" />
              <span>Indietro</span>
            </button>

            {/* Step Indicators */}
            <div className="flex space-x-2">
              {steps.map((_, index) => (
                <button
                  key={index}
                  onClick={() => setCurrentStep(index)}
                  className={`h-3 rounded-full transition-all ${
                    index === currentStep 
                      ? 'w-8 bg-white/80' 
                      : completedSteps.has(index)
                      ? 'w-3 bg-green-400/60'
                      : index < currentStep
                      ? 'w-3 bg-white/40'
                      : 'w-3 bg-white/20'
                  }`}
                  title={`Passo ${index + 1}${completedSteps.has(index) ? ' (Completato)' : ''}`}
                />
              ))}
            </div>

            {/* Next/Complete Button */}
            <button
              onClick={nextStep}
              disabled={completing}
              className="flex items-center space-x-2 px-6 py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition-all transform hover:scale-105 disabled:opacity-50"
            >
              <span>
                {currentStep === steps.length - 1 ? 'Completa Onboarding' : 'Passo Successivo'}
              </span>
              {currentStep === steps.length - 1 ? (
                <CheckCircle className="h-5 w-5" />
              ) : (
                <ArrowRight className="h-5 w-5" />
              )}
            </button>
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes fade-in {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .animate-fade-in {
          animation: fade-in 0.6s ease-out;
        }

        .animate-fade-in-delay {
          animation: fade-in 0.6s ease-out 0.2s both;
        }

        .animate-fade-in-delay-2 {
          animation: fade-in 0.6s ease-out 0.4s both;
        }

        .animate-fade-in-delay-3 {
          animation: fade-in 0.6s ease-out 0.6s both;
        }
      `}</style>
    </div>
  );
};

export default OnboardingPage;