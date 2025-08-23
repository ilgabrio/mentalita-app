import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { 
  collection, 
  query, 
  getDocs, 
  addDoc,
  where,
  orderBy
} from 'firebase/firestore';
import { db } from '../config/firebase';
// import { createCheckoutSession } from '../services/stripe';  // Temporaneamente disabilitato per debug
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
  TrendingUp,
  DollarSign
} from 'lucide-react';

// Fixed variable conflicts
const PremiumPage = () => {
  const { currentUser, userProfile } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [loading, setLoading] = useState(false);
  const [hasActiveRequest, setHasActiveRequest] = useState(false);
  const [hasActiveSubscription, setHasActiveSubscription] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [showQuestionnaire, setShowQuestionnaire] = useState(false);
  const [plans, setPlans] = useState([]);
  const [plansLoading, setPlansLoading] = useState(true);
  const [formData, setFormData] = useState({});
  const [questions, setQuestions] = useState([]);
  const [paymentLoading, setPaymentLoading] = useState(false);

  // Controlla se l'utente è approvato per Premium
  const isApprovedForPremium = searchParams.get('approved') === 'true' || 
                              userProfile?.premiumRequestStatus === 'approved_pending_payment';

  useEffect(() => {
    checkExistingRequestsAndSubscriptions();
    fetchPlans();
    fetchQuestions();
  }, [currentUser]);

  const fetchPlans = async () => {
    try {
      setPlansLoading(true);
      const plansQuery = query(
        collection(db, 'premiumPlans'),
        where('status', '==', 'active'),
        orderBy('monthlyPrice', 'asc')
      );
      
      const snapshot = await getDocs(plansQuery);
      const plansData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      
      setPlans(plansData);
    } catch (error) {
      console.error('Error fetching premium plans:', error);
      // Fallback without orderBy
      try {
        const fallbackQuery = query(
          collection(db, 'premiumPlans'),
          where('status', '==', 'active')
        );
        const snapshot = await getDocs(fallbackQuery);
        const plansData = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        setPlans(plansData.sort((a, b) => (a.monthlyPrice || 0) - (b.monthlyPrice || 0)));
      } catch (fallbackError) {
        console.error('Fallback query failed:', fallbackError);
        setPlans([]);
      }
    } finally {
      setPlansLoading(false);
    }
  };

  const fetchQuestions = async () => {
    try {
      const questionsQuery = query(
        collection(db, 'premiumQuestions'),
        orderBy('order', 'asc')
      );
      const snapshot = await getDocs(questionsQuery);
      
      if (snapshot.docs.length === 0) {
        console.log('No questions found in database, using defaults');
        return;
      }
      
      const questionsData = snapshot.docs.map(doc => {
        const data = doc.data();
        // Converti l'icona dal nome stringa al componente
        const iconMap = {
          Crown, Target, Brain, Trophy, Sparkles, CheckCircle, Clock,
          User, Calendar, Timer, Award, Heart, Shield, TrendingUp, DollarSign
        };
        
        return {
          ...data,
          icon: iconMap[data.icon] ? React.createElement(iconMap[data.icon], { className: "h-6 w-6" }) : React.createElement(Target, { className: "h-6 w-6" })
        };
      });
      
      setQuestions(questionsData);
      
      // Inizializza formData con chiavi vuote per ogni domanda
      const initialFormData = {};
      questionsData.forEach(q => {
        initialFormData[q.id] = '';
      });
      setFormData(initialFormData);
      
    } catch (error) {
      console.error('Error fetching questions:', error);
    }
  };

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

  const handlePurchasePlan = async (plan, billingPeriod) => {
    if (!currentUser) {
      navigate('/login');
      return;
    }
    
    try {
      setPaymentLoading(true);
      // Temporaneamente disabilitato per debug
      alert(`Pagamento per ${plan.name} - ${billingPeriod} temporaneamente non disponibile`);
      // await createCheckoutSession(plan.id, billingPeriod);
    } catch (error) {
      console.error('Error creating checkout session:', error);
      alert('Errore nella creazione della sessione di pagamento. Riprova.');
    } finally {
      setPaymentLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (!currentUser) {
      navigate('/login');
      return;
    }

    // Validate all required fields
    const missingFields = questions
      .filter(quest => quest.required && !formData[quest.id])
      .map(quest => quest.title);
    
    if (missingFields.length > 0) {
      alert(`Per favore completa tutti i campi richiesti: ${missingFields.join(', ')}`);
      return;
    }

    try {
      setLoading(true);

      // Save to premiumRequests for admin management
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

      // Also save to questionnaires collection for user profile
      await addDoc(collection(db, 'questionnaires'), {
        userId: currentUser.uid,
        type: 'premium',
        title: 'Questionario Premium',
        responses: formData,
        completedAt: new Date(),
        metadata: {
          completedQuestions: questions.length,
          submittedFrom: 'premium_page'
        }
      });

      alert(`✨ Candidatura Premium Inviata con Successo!

La tua candidatura è stata ricevuta e sarà valutata personalmente.

🔍 PROCESSO DI SELEZIONE:
1. ⏰ Valutazione entro 24-48 ore
2. 📞 Colloquio conoscitivo (se selezionato)
3. 🎯 Proposta di percorso personalizzato
4. 💎 Definizione del piano su misura (€19,99 - €500/mese)
5. 💳 Attivazione solo dopo approvazione finale

Il tuo budget indicato (${formData.budget}) ci aiuterà a creare la proposta più adatta.

Grazie per aver scelto un percorso di crescita professionale!
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

  // Sezione speciale per utenti con Premium approvato
  if (isApprovedForPremium) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-amber-50 via-yellow-50 to-orange-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
        {/* Header approvazione */}
        <div className="bg-gradient-to-r from-green-500 to-emerald-600 text-white py-6">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center">
              <CheckCircle className="h-12 w-12 mx-auto mb-3" />
              <h1 className="text-3xl font-bold mb-2">🎉 Premium Approvato!</h1>
              <p className="text-green-100">
                Congratulazioni! La tua richiesta Premium è stata approvata. 
                Scegli il tuo piano e completa il pagamento per iniziare subito.
              </p>
            </div>
          </div>
        </div>

        {/* Piani di pagamento */}
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="text-center mb-12">
            <Crown className="h-16 w-16 text-amber-500 mx-auto mb-4" />
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
              Scegli il Tuo Piano Premium
            </h2>
            <p className="text-lg text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
              Seleziona la durata del tuo abbonamento Premium e accedi immediatamente a tutti i contenuti esclusivi.
            </p>
          </div>

          {plansLoading ? (
            <div className="flex justify-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-600"></div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {plans.map((approvedPlan) => (
                <div
                  key={approvedPlan.id}
                  className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl overflow-hidden hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1"
                >
                  <div className={`bg-gradient-to-r ${getPlanColor(approvedPlan.color || 'blue')} p-6 text-white text-center`}>
                    <Crown className="h-8 w-8 mx-auto mb-3" />
                    <h3 className="text-2xl font-bold mb-2">{approvedPlan.name}</h3>
                    <p className="text-sm opacity-90">{approvedPlan.description}</p>
                  </div>
                  
                  <div className="p-6">
                    <div className="text-center mb-6">
                      <div className="flex items-center justify-center mb-2">
                        <span className="text-3xl font-bold text-gray-900 dark:text-white">
                          €{approvedPlan.monthlyPrice}
                        </span>
                        <span className="text-gray-500 dark:text-gray-400 ml-2">/mese</span>
                      </div>
                      {approvedPlan.yearlyPrice && (
                        <div className="text-sm text-gray-600 dark:text-gray-400">
                          €{approvedPlan.yearlyPrice}/anno (risparmia {Math.round((1 - (approvedPlan.yearlyPrice / 12) / approvedPlan.monthlyPrice) * 100)}%)
                        </div>
                      )}
                    </div>

                    <div className="space-y-3 mb-6">
                      {approvedPlan.features?.map((featureItem, featureIdx) => (
                        <div key={featureIdx} className="flex items-center">
                          <CheckCircle className="h-4 w-4 text-green-500 mr-3 flex-shrink-0" />
                          <span className="text-sm text-gray-700 dark:text-gray-300">{featureItem}</span>
                        </div>
                      ))}
                    </div>

                    <div className="space-y-3">
                      {/* Bottone Mensile */}
                      <button
                        onClick={() => handlePurchasePlan(approvedPlan, 'monthly')}
                        disabled={paymentLoading}
                        className={`
                          w-full py-3 px-4 rounded-xl font-medium transition-all duration-300
                          ${paymentLoading 
                            ? 'bg-gray-300 dark:bg-gray-600 cursor-not-allowed' 
                            : 'bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white shadow-lg hover:shadow-xl'
                          }
                        `}
                      >
                        {paymentLoading ? (
                          <div className="flex items-center justify-center">
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                            Elaborazione...
                          </div>
                        ) : (
                          `Paga €${approvedPlan.monthlyPrice}/mese`
                        )}
                      </button>

                      {/* Bottone Annuale (se disponibile) */}
                      {approvedPlan.yearlyPrice && (
                        <button
                          onClick={() => handlePurchasePlan(approvedPlan, 'yearly')}
                          disabled={paymentLoading}
                          className={`
                            w-full py-3 px-4 rounded-xl font-medium transition-all duration-300 border-2
                            ${paymentLoading 
                              ? 'border-gray-300 dark:border-gray-600 text-gray-400 cursor-not-allowed' 
                              : 'border-amber-500 text-amber-600 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-900/20'
                            }
                          `}
                        >
                          {paymentLoading ? (
                            <div className="flex items-center justify-center">
                              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current mr-2"></div>
                              Elaborazione...
                            </div>
                          ) : (
                            <div>
                              <div>Paga €{approvedPlan.yearlyPrice}/anno</div>
                              <div className="text-xs opacity-75">
                                Risparmia €{(approvedPlan.monthlyPrice * 12) - approvedPlan.yearlyPrice} all'anno
                              </div>
                            </div>
                          )}
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {plans.length === 0 && !plansLoading && (
            <div className="text-center py-12">
              <AlertCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                Piani non disponibili
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                I piani Premium non sono al momento configurati.
              </p>
              <button
                onClick={() => window.location.reload()}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Ricarica la pagina
              </button>
            </div>
          )}
        </div>
      </div>
    );
  }

  const getPlanColor = (color) => {
    switch (color) {
      case 'purple': return 'from-purple-500 to-pink-500';
      case 'blue': return 'from-blue-500 to-cyan-500';
      case 'green': return 'from-green-500 to-emerald-500';
      case 'orange': return 'from-orange-500 to-red-500';
      case 'gray': return 'from-gray-400 to-gray-500';
      default: return 'from-blue-500 to-cyan-500';
    }
  };

  if (!showQuestionnaire) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
        {/* Hero Section */}
        <div className="relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-purple-600/10 to-blue-600/10"></div>
          <div className="relative max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
            <div className="text-center">
              <div className="flex justify-center mb-4">
                <Crown className="h-16 w-16 text-yellow-500" />
              </div>
              <h1 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-4">
                Percorso Premium Mentalità Vincente
              </h1>
              <p className="text-xl text-gray-600 dark:text-gray-300 mb-8 max-w-3xl mx-auto">
                Il mental training professionale non è per tutti. È per chi vuole davvero fare la differenza e investire seriamente nella propria crescita.
              </p>
            </div>
          </div>
        </div>

        {/* Plans Section */}
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pb-16">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
              I Nostri Piani Premium
            </h2>
            <p className="text-lg text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
              Scegli il livello di investimento più adatto al tuo percorso di crescita mentale
            </p>
          </div>

          {plansLoading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto"></div>
              <p className="text-gray-500 dark:text-gray-400 mt-4">Caricamento piani...</p>
            </div>
          ) : plans.length === 0 ? (
            <div className="text-center py-12">
              <Crown className="h-16 w-16 mx-auto mb-4 text-gray-400" />
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                Piani in arrivo
              </h3>
              <p className="text-gray-500 dark:text-gray-400">
                Stiamo preparando i nostri piani Premium personalizzati
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-12">
              {plans.map(premiumPlan => (
                <div 
                  key={premiumPlan.id} 
                  className={`relative bg-white dark:bg-gray-800 rounded-2xl shadow-xl overflow-hidden transform transition-all hover:scale-105 ${
                    premiumPlan.isPopular ? 'ring-2 ring-yellow-500 scale-110' : ''
                  }`}
                >
                  {/* Badge */}
                  {premiumPlan.badge && (
                    <div className={`absolute top-0 right-0 bg-gradient-to-r ${getPlanColor(premiumPlan.color)} text-white px-4 py-1 rounded-bl-lg text-sm font-semibold`}>
                      {premiumPlan.badge}
                    </div>
                  )}

                  {/* Header */}
                  <div className={`p-6 text-center bg-gradient-to-br ${getPlanColor(premiumPlan.color)} text-white`}>
                    <h3 className="text-2xl font-bold mb-2">{premiumPlan.name}</h3>
                    <p className="text-sm opacity-90 mb-4">{premiumPlan.description}</p>
                    
                    {/* Price */}
                    <div className="mb-4">
                      {premiumPlan.monthlyPrice === 0 ? (
                        <div className="text-4xl font-bold">Gratis</div>
                      ) : (
                        <>
                          <div className="text-4xl font-bold">
                            €{premiumPlan.monthlyPrice}
                            <span className="text-lg font-normal">/mese</span>
                          </div>
                          {premiumPlan.yearlyPrice > 0 && (
                            <div className="text-sm mt-1 opacity-80">
                              o €{premiumPlan.yearlyPrice}/anno
                            </div>
                          )}
                        </>
                      )}
                    </div>
                  </div>

                  {/* Features */}
                  <div className="p-6">
                    <div className="space-y-3 mb-6">
                      {premiumPlan.features && premiumPlan.features.slice(0, 6).map((planFeature, planIndex) => (
                        <div key={planIndex} className="flex items-start">
                          <CheckCircle className="h-5 w-5 text-green-500 mr-3 mt-0.5 flex-shrink-0" />
                          <span className="text-gray-700 dark:text-gray-300 text-sm">{planFeature}</span>
                        </div>
                      ))}
                      
                      {premiumPlan.features && premiumPlan.features.length > 6 && (
                        <div className="text-sm text-gray-500 dark:text-gray-400 text-center">
                          +{premiumPlan.features.length - 6} altre funzionalità
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* CTA Section */}
          <div className="bg-gradient-to-r from-purple-600 to-blue-600 rounded-2xl p-8 text-center text-white">
            <h3 className="text-2xl font-bold mb-4">
              Pronto per il Percorso Premium?
            </h3>
            <p className="text-lg mb-4 opacity-90 max-w-2xl mx-auto">
              I posti sono limitati. Compila il questionario di candidatura per essere valutato per il percorso Premium personalizzato.
            </p>
            <p className="text-sm mb-6 opacity-75 max-w-xl mx-auto">
              ⚡ Processo di approvazione veloce: riceverai una risposta entro 24-48 ore con il link per completare il pagamento.
            </p>
            <button
              onClick={() => setShowQuestionnaire(true)}
              className="inline-flex items-center space-x-3 px-8 py-4 bg-white text-purple-600 rounded-xl font-bold text-lg hover:bg-gray-50 transition-all transform hover:scale-105"
            >
              <Crown className="h-6 w-6" />
              <span>Candidati per il Premium</span>
            </button>
          </div>

          {/* Process Info */}
          <div className="mt-12 bg-white/80 dark:bg-gray-800/80 backdrop-blur rounded-xl p-6 border border-purple-200 dark:border-purple-800">
            <div className="flex items-start space-x-3">
              <AlertCircle className="h-6 w-6 text-purple-600 dark:text-purple-400 flex-shrink-0 mt-0.5" />
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
                  Come funziona il processo di selezione
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-sm text-gray-600 dark:text-gray-300">
                  <div className="flex items-start">
                    <span className="text-purple-600 dark:text-purple-400 mr-2 font-bold">1.</span>
                    <span>Compila il questionario dettagliato</span>
                  </div>
                  <div className="flex items-start">
                    <span className="text-purple-600 dark:text-purple-400 mr-2 font-bold">2.</span>
                    <span>Valutazione personale entro 48h</span>
                  </div>
                  <div className="flex items-start">
                    <span className="text-purple-600 dark:text-purple-400 mr-2 font-bold">3.</span>
                    <span>Colloquio conoscitivo (se selezionato)</span>
                  </div>
                  <div className="flex items-start">
                    <span className="text-purple-600 dark:text-purple-400 mr-2 font-bold">4.</span>
                    <span>Attivazione piano personalizzato</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const currentQuestion = questions[currentStep];
  const progress = ((currentStep + 1) / questions.length) * 100;

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      {/* Questionnaire Header */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-purple-600/10 to-blue-600/10"></div>
        <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center">
            <button
              onClick={() => setShowQuestionnaire(false)}
              className="inline-flex items-center space-x-2 text-purple-600 dark:text-purple-400 hover:text-purple-800 dark:hover:text-purple-300 mb-4"
            >
              <ChevronLeft className="h-4 w-4" />
              <span>Torna ai piani</span>
            </button>
            <div className="flex justify-center mb-4">
              <Crown className="h-12 w-12 text-yellow-500" />
            </div>
            <h1 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-4">
              Questionario di Candidatura Premium
            </h1>
            <p className="text-lg text-gray-600 dark:text-gray-300">
              Rispondi con sincerità per permetterci di valutare la tua candidatura
            </p>
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
                  {currentQuestion.options.map((option, optionIdx) => (
                    <option key={optionIdx} value={option}>
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
              {questions.map((_, questionIdx) => (
                <button
                  key={questionIdx}
                  onClick={() => setCurrentStep(questionIdx)}
                  className={`w-2 h-2 rounded-full transition-all ${
                    questionIdx === currentStep 
                      ? 'w-8 bg-purple-600' 
                      : formData[questions[questionIdx].id]
                        ? 'bg-purple-400'
                        : 'bg-gray-300 dark:bg-gray-600'
                  }`}
                  aria-label={`Vai alla domanda ${questionIdx + 1}`}
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