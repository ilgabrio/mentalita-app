import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { db } from '../config/firebase';
import { 
  Crown, 
  CheckCircle, 
  ArrowRight, 
  Star,
  Trophy,
  Sparkles,
  Target,
  Zap
} from 'lucide-react';

const OnboardingCompletePage = () => {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const [completionData, setCompletionData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const markOnboardingComplete = async () => {
      if (currentUser) {
        try {
          // Mark onboarding as completed in user profile
          await updateDoc(doc(db, 'users', currentUser.uid), {
            onboardingCompleted: true,
            onboardingCompletedAt: new Date(),
            interactiveOnboardingCompleted: true
          });

          // Set localStorage flags
          localStorage.setItem('onboardingCompleted', 'true');
          localStorage.setItem('interactiveOnboardingCompleted', 'true');

          // Get user's progress data
          const onboardingProgressDoc = await getDoc(doc(db, 'userOnboardingProgress', currentUser.uid));
          if (onboardingProgressDoc.exists()) {
            setCompletionData(onboardingProgressDoc.data());
          }
        } catch (error) {
          console.error('Error marking onboarding complete:', error);
        }
      }
      setLoading(false);
    };

    markOnboardingComplete();
  }, [currentUser]);

  const handleContinueToExercises = () => {
    navigate('/exercises');
  };

  const handleExplorePremium = () => {
    navigate('/premium');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-white mx-auto mb-4"></div>
          <p className="text-white text-lg">Completando il tuo percorso...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900">
      {/* Celebration Animation */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {[...Array(20)].map((_, i) => (
          <div
            key={i}
            className="absolute animate-ping"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 2}s`,
              animationDuration: '3s'
            }}
          >
            <Sparkles className="h-4 w-4 text-yellow-300 opacity-70" />
          </div>
        ))}
      </div>

      <div className="relative z-10 min-h-screen flex items-center justify-center p-4">
        <div className="max-w-4xl w-full">
          {/* Main Completion Card */}
          <div className="bg-white/10 backdrop-blur-lg rounded-3xl p-8 mb-8 border border-white/20 shadow-2xl">
            <div className="text-center">
              {/* Success Icon */}
              <div className="flex justify-center mb-6">
                <div className="relative">
                  <div className="absolute inset-0 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full animate-pulse"></div>
                  <Trophy className="relative h-20 w-20 text-yellow-300 bg-gradient-to-r from-yellow-500 to-orange-500 rounded-full p-4" />
                </div>
              </div>

              {/* Congratulations Message */}
              <h1 className="text-5xl font-bold text-white mb-4">
                🎉 Complimenti!
              </h1>
              <p className="text-2xl text-blue-200 mb-6">
                Hai completato il tuo percorso di onboarding
              </p>
              <p className="text-lg text-blue-100 mb-8 leading-relaxed max-w-2xl mx-auto">
                Hai portato a termine tutti i 7 passi fondamentali per iniziare il tuo viaggio 
                nella forza mentale sportiva. Ora sei pronto per sfruttare tutto il potenziale dell'app!
              </p>
            </div>

            {/* Progress Summary */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <div className="bg-white/10 rounded-2xl p-6 text-center border border-white/10">
                <CheckCircle className="h-12 w-12 text-green-400 mx-auto mb-4" />
                <h3 className="text-xl font-bold text-white mb-2">7 Passi</h3>
                <p className="text-blue-200">Completati con successo</p>
              </div>
              <div className="bg-white/10 rounded-2xl p-6 text-center border border-white/10">
                <Target className="h-12 w-12 text-blue-400 mx-auto mb-4" />
                <h3 className="text-xl font-bold text-white mb-2">Pronto</h3>
                <p className="text-blue-200">Per il prossimo livello</p>
              </div>
              <div className="bg-white/10 rounded-2xl p-6 text-center border border-white/10">
                <Zap className="h-12 w-12 text-yellow-400 mx-auto mb-4" />
                <h3 className="text-xl font-bold text-white mb-2">Sbloccato</h3>
                <p className="text-blue-200">Accesso completo</p>
              </div>
            </div>

            {/* What's Next Section */}
            <div className="bg-white/5 rounded-2xl p-8 mb-8 border border-white/10">
              <h2 className="text-3xl font-bold text-white mb-6 text-center">
                🚀 Cosa succede ora?
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <h3 className="text-xl font-semibold text-blue-200 flex items-center">
                    <Star className="h-6 w-6 mr-2 text-yellow-400" />
                    Hai accesso a:
                  </h3>
                  <ul className="space-y-2 text-blue-100">
                    <li className="flex items-center">
                      <CheckCircle className="h-5 w-5 mr-3 text-green-400" />
                      Tutti gli esercizi avanzati
                    </li>
                    <li className="flex items-center">
                      <CheckCircle className="h-5 w-5 mr-3 text-green-400" />
                      Statistiche dettagliate
                    </li>
                    <li className="flex items-center">
                      <CheckCircle className="h-5 w-5 mr-3 text-green-400" />
                      Sistema di badge e progressi
                    </li>
                    <li className="flex items-center">
                      <CheckCircle className="h-5 w-5 mr-3 text-green-400" />
                      Tutti i contenuti gratuiti
                    </li>
                  </ul>
                </div>
                <div className="space-y-4">
                  <h3 className="text-xl font-semibold text-blue-200 flex items-center">
                    <Crown className="h-6 w-6 mr-2 text-yellow-400" />
                    Passi successivi:
                  </h3>
                  <ul className="space-y-2 text-blue-100">
                    <li>• Continua con gli esercizi quotidiani</li>
                    <li>• Esplora i contenuti premium</li>
                    <li>• Rifai i passi dell'onboarding quando vuoi</li>
                    <li>• Monitora i tuoi progressi</li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button
                onClick={handleContinueToExercises}
                className="flex items-center justify-center px-8 py-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl font-semibold text-lg hover:from-blue-700 hover:to-purple-700 transform hover:scale-105 transition-all shadow-lg"
              >
                Inizia i tuoi Esercizi
                <ArrowRight className="ml-2 h-6 w-6" />
              </button>
              <button
                onClick={handleExplorePremium}
                className="flex items-center justify-center px-8 py-4 bg-gradient-to-r from-yellow-500 to-orange-500 text-white rounded-xl font-semibold text-lg hover:from-yellow-600 hover:to-orange-600 transform hover:scale-105 transition-all shadow-lg"
              >
                <Crown className="mr-2 h-6 w-6" />
                Scopri Premium
              </button>
            </div>

            {/* Previous Steps Access */}
            <div className="mt-8 pt-8 border-t border-white/20 text-center">
              <p className="text-blue-200 mb-4">
                Vuoi rivedere i passi dell'onboarding?
              </p>
              <button
                onClick={() => navigate('/onboarding')}
                className="text-blue-300 hover:text-white underline transition-colors"
              >
                Rivedi i 7 Passi Fondamentali
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OnboardingCompletePage;