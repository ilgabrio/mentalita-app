import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { doc, setDoc } from 'firebase/firestore';
import { db } from '../config/firebase';
import { Target, Heart, ArrowRight, Star } from 'lucide-react';

const OnboardingQuestionsPage = () => {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const [answers, setAnswers] = useState({
    dreamCommitment: '',
    engagementLevel: ''
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!answers.dreamCommitment.trim() || !answers.engagementLevel.trim()) {
      alert('Per favore rispondi a entrambe le domande per continuare');
      return;
    }

    try {
      setLoading(true);
      
      // Salva le risposte nel profilo utente
      await setDoc(doc(db, 'users', currentUser.uid), {
        onboardingQuestions: {
          dreamCommitment: answers.dreamCommitment,
          engagementLevel: answers.engagementLevel,
          completedAt: new Date()
        }
      }, { merge: true });

      // Vai alla pagina di assegnazione badge
      navigate('/champion-unlock');
      
    } catch (error) {
      console.error('Errore nel salvataggio:', error);
      alert('Errore nel salvataggio. Riprova.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
      <div className="px-4 py-8 max-w-2xl mx-auto">
        
        {/* Header */}
        <div className="text-center mb-8">
          <div className="mb-6">
            <Star className="h-16 w-16 text-yellow-500 mx-auto mb-4" />
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
              Sei Quasi un <span className="text-yellow-600">Campione!</span>
            </h1>
            <p className="text-lg text-gray-600 dark:text-gray-300">
              Due domande finali per sbloccare il tuo potenziale massimo
            </p>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-8">
          
          {/* Domanda 1 */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-8">
            <div className="flex items-start space-x-4 mb-6">
              <div className="bg-red-100 dark:bg-red-900/30 p-3 rounded-lg">
                <Heart className="h-6 w-6 text-red-600 dark:text-red-400" />
              </div>
              <div className="flex-1">
                <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-3">
                  Cosa sei disposto a fare per il tuo sogno?
                </h2>
                <p className="text-gray-600 dark:text-gray-300 mb-4">
                  Racconta la tua determinazione, i sacrifici che sei pronto a fare, 
                  gli ostacoli che supererai. Scrivi dal cuore.
                </p>
                <textarea
                  value={answers.dreamCommitment}
                  onChange={(e) => setAnswers({...answers, dreamCommitment: e.target.value})}
                  className="w-full h-32 p-4 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Scrivi qui la tua risposta..."
                  required
                />
              </div>
            </div>
          </div>

          {/* Domanda 2 */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-8">
            <div className="flex items-start space-x-4 mb-6">
              <div className="bg-blue-100 dark:bg-blue-900/30 p-3 rounded-lg">
                <Target className="h-6 w-6 text-blue-600 dark:text-blue-400" />
              </div>
              <div className="flex-1">
                <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-3">
                  Come ti vuoi impegnare da oggi in poi?
                </h2>
                <p className="text-gray-600 dark:text-gray-300 mb-4">
                  Definisci il tuo piano di allenamento mentale, la frequenza con cui 
                  praticherai, come integrerai Mentalità nella tua routine quotidiana.
                </p>
                <textarea
                  value={answers.engagementLevel}
                  onChange={(e) => setAnswers({...answers, engagementLevel: e.target.value})}
                  className="w-full h-32 p-4 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Scrivi qui il tuo piano di impegno..."
                  required
                />
              </div>
            </div>
          </div>

          {/* Submit Button */}
          <div className="text-center">
            <button
              type="submit"
              disabled={loading || !answers.dreamCommitment.trim() || !answers.engagementLevel.trim()}
              className="bg-gradient-to-r from-yellow-400 to-orange-500 hover:from-yellow-500 hover:to-orange-600 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold py-4 px-8 rounded-xl text-xl transition-all duration-300 transform hover:scale-105 shadow-lg flex items-center justify-center space-x-3 mx-auto"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white"></div>
                  <span>Salvando...</span>
                </>
              ) : (
                <>
                  <span>Diventa Campione</span>
                  <ArrowRight className="h-6 w-6" />
                </>
              )}
            </button>
          </div>
        </form>

        {/* Motivational Footer */}
        <div className="mt-12 text-center">
          <div className="bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg p-6 text-white">
            <h3 className="font-bold text-lg mb-2">🏆 Il Campione è Chi Non Molla Mai</h3>
            <p className="text-purple-100">
              Ogni grande atleta ha iniziato con un sogno e la determinazione di non arrendersi mai.
            </p>
          </div>
        </div>

      </div>
    </div>
  );
};

export default OnboardingQuestionsPage;