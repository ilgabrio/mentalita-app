import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { db } from '../config/firebase';
import { Crown, Trophy, Star, Sparkles, ArrowRight, Zap } from 'lucide-react';

const ChampionUnlockPage = () => {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [animationPhase, setAnimationPhase] = useState('loading'); // loading, unlocking, celebration, complete

  useEffect(() => {
    const unlockChampionBadge = async () => {
      try {
        // Verifica che l'utente abbia risposto alle domande
        const userDoc = await getDoc(doc(db, 'users', currentUser.uid));
        const userData = userDoc.data();
        
        if (!userData?.onboardingQuestions) {
          // Utente non ha completato le domande, riportalo indietro
          navigate('/onboarding-questions');
          return;
        }

        setLoading(false);
        setAnimationPhase('unlocking');

        // Animazione di unlock
        setTimeout(() => {
          setAnimationPhase('celebration');
        }, 2000);

        // Assegna il badge Campione
        await setDoc(doc(db, 'users', currentUser.uid), {
          championBadge: {
            unlocked: true,
            unlockedAt: new Date(),
            level: 'Campione'
          },
          // Marca onboarding come completato definitivamente
          onboardingCompleted: true
        }, { merge: true });

        // Imposta localStorage
        localStorage.setItem('onboardingCompleted', 'true');
        localStorage.setItem('championBadge', 'true');

        setTimeout(() => {
          setAnimationPhase('complete');
        }, 4000);

      } catch (error) {
        console.error('Errore nello sblocco badge:', error);
        setLoading(false);
        setAnimationPhase('error');
      }
    };

    unlockChampionBadge();
  }, [currentUser, navigate]);

  const handleContinue = () => {
    // Vai alla homepage con accesso completo
    navigate('/', { replace: true });
  };

  if (loading || animationPhase === 'loading') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-yellow-100 to-orange-200 dark:from-yellow-900 dark:to-orange-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-yellow-600 mx-auto mb-4"></div>
          <p className="text-yellow-800 dark:text-yellow-200 text-lg">Preparando la tua trasformazione...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-yellow-400 via-orange-500 to-red-500 overflow-hidden relative">
      
      {/* Particelle animate di background */}
      <div className="absolute inset-0 overflow-hidden">
        {[...Array(20)].map((_, i) => (
          <div
            key={i}
            className="absolute animate-bounce opacity-70"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 2}s`,
              animationDuration: `${2 + Math.random() * 2}s`
            }}
          >
            <Sparkles className="h-4 w-4 text-yellow-200" />
          </div>
        ))}
      </div>

      <div className="relative z-10 min-h-screen flex items-center justify-center px-4">
        <div className="text-center max-w-2xl mx-auto">

          {/* Fase Unlocking */}
          {animationPhase === 'unlocking' && (
            <div className="animate-pulse">
              <div className="mb-8">
                <Crown className="h-24 w-24 text-yellow-200 mx-auto mb-4 animate-bounce" />
                <h1 className="text-4xl font-bold text-white mb-4">
                  Sbloccando il tuo potenziale...
                </h1>
                <div className="flex justify-center space-x-2">
                  {[...Array(3)].map((_, i) => (
                    <div
                      key={i}
                      className="w-3 h-3 bg-yellow-200 rounded-full animate-bounce"
                      style={{ animationDelay: `${i * 0.2}s` }}
                    ></div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Fase Celebration */}
          {animationPhase === 'celebration' && (
            <div className="animate-in slide-in-from-bottom-10 duration-1000">
              <div className="mb-8">
                <div className="relative mb-6">
                  <Crown className="h-32 w-32 text-yellow-100 mx-auto animate-pulse" />
                  <div className="absolute -top-2 -right-2 animate-spin">
                    <Sparkles className="h-8 w-8 text-yellow-200" />
                  </div>
                  <div className="absolute -bottom-2 -left-2 animate-ping">
                    <Star className="h-6 w-6 text-yellow-300" />
                  </div>
                </div>
                
                <h1 className="text-5xl font-bold text-white mb-4 animate-bounce">
                  🏆 CONGRATULAZIONI! 🏆
                </h1>
                
                <div className="bg-white/20 backdrop-blur-sm rounded-xl p-6 mb-6">
                  <h2 className="text-3xl font-bold text-yellow-100 mb-2">
                    Sei Ufficialmente un
                  </h2>
                  <div className="text-6xl font-black text-white mb-2">
                    CAMPIONE
                  </div>
                  <p className="text-yellow-100 text-lg">
                    Hai dimostrato dedizione, impegno e la mentalità vincente
                  </p>
                </div>

                <div className="grid grid-cols-3 gap-4 mb-6">
                  <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4">
                    <Trophy className="h-8 w-8 text-yellow-200 mx-auto mb-2" />
                    <p className="text-white text-sm font-medium">Badge Sbloccato</p>
                  </div>
                  <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4">
                    <Zap className="h-8 w-8 text-yellow-200 mx-auto mb-2" />
                    <p className="text-white text-sm font-medium">Accesso Completo</p>
                  </div>
                  <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4">
                    <Star className="h-8 w-8 text-yellow-200 mx-auto mb-2" />
                    <p className="text-white text-sm font-medium">Status Premium</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Fase Complete */}
          {animationPhase === 'complete' && (
            <div className="animate-in fade-in duration-1000">
              <div className="mb-8">
                <Crown className="h-20 w-20 text-yellow-100 mx-auto mb-6" />
                
                <h1 className="text-4xl font-bold text-white mb-6">
                  Benvenuto nella Community dei Campioni!
                </h1>
                
                <div className="bg-white/20 backdrop-blur-sm rounded-xl p-8 mb-8">
                  <h2 className="text-2xl font-bold text-yellow-100 mb-4">
                    🎯 Ora hai accesso a tutto:
                  </h2>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-left">
                    <div className="flex items-center space-x-3">
                      <div className="w-2 h-2 bg-yellow-300 rounded-full"></div>
                      <span className="text-white">Tutti gli esercizi avanzati</span>
                    </div>
                    <div className="flex items-center space-x-3">
                      <div className="w-2 h-2 bg-yellow-300 rounded-full"></div>
                      <span className="text-white">Coaching personalizzato</span>
                    </div>
                    <div className="flex items-center space-x-3">
                      <div className="w-2 h-2 bg-yellow-300 rounded-full"></div>
                      <span className="text-white">Community esclusiva</span>
                    </div>
                    <div className="flex items-center space-x-3">
                      <div className="w-2 h-2 bg-yellow-300 rounded-full"></div>
                      <span className="text-white">Tracciamento progressi</span>
                    </div>
                  </div>
                </div>

                <button
                  onClick={handleContinue}
                  className="bg-white text-orange-600 font-bold py-4 px-8 rounded-xl text-xl transition-all duration-300 transform hover:scale-105 shadow-lg flex items-center justify-center space-x-3 mx-auto"
                >
                  <span>Inizia il Tuo Percorso da Campione</span>
                  <ArrowRight className="h-6 w-6" />
                </button>

                <p className="text-yellow-100 mt-4 text-sm">
                  Ricorda: Un vero campione non smette mai di allenarsi 💪
                </p>
              </div>
            </div>
          )}

          {/* Fase Error */}
          {animationPhase === 'error' && (
            <div className="bg-red-100 dark:bg-red-900/20 rounded-xl p-8">
              <h2 className="text-2xl font-bold text-red-600 dark:text-red-400 mb-4">
                Oops! Qualcosa è andato storto
              </h2>
              <p className="text-red-500 dark:text-red-300 mb-6">
                Non siamo riusciti a sbloccare il tuo badge. Riprova.
              </p>
              <button
                onClick={() => window.location.reload()}
                className="bg-red-500 hover:bg-red-600 text-white font-bold py-3 px-6 rounded-lg"
              >
                Riprova
              </button>
            </div>
          )}

        </div>
      </div>
    </div>
  );
};

export default ChampionUnlockPage;