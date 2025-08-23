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
import { createCheckoutSession } from '../services/stripe';
import { 
  Crown, 
  CheckCircle,
  AlertCircle,
  Clock
} from 'lucide-react';

const PremiumPageFixed = () => {
  const { currentUser, userProfile } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [loading, setLoading] = useState(false);
  const [hasActiveRequest, setHasActiveRequest] = useState(false);
  const [hasActiveSubscription, setHasActiveSubscription] = useState(false);
  const [plans, setPlans] = useState([]);
  const [plansLoading, setPlansLoading] = useState(true);
  const [paymentLoading, setPaymentLoading] = useState(false);

  // Controlla se l'utente è approvato per Premium
  const isApprovedForPremium = searchParams.get('approved') === 'true' || 
                              userProfile?.premiumRequestStatus === 'approved_pending_payment';

  useEffect(() => {
    checkExistingRequestsAndSubscriptions();
    fetchPlans();
  }, [currentUser]);

  const fetchPlans = async () => {
    try {
      setPlansLoading(true);
      console.log('🔍 Fetching premium plans...');
      
      // Prima proviamo senza filtri per vedere tutti i piani
      const allPlansSnapshot = await getDocs(collection(db, 'premiumPlans'));
      console.log('📋 All plans in database:', allPlansSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })));
      
      // Prima proviamo con tutti i piani, senza filtro status
      const plansQuery = query(
        collection(db, 'premiumPlans'),
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
      // Fallback without orderBy and status filter
      try {
        console.log('⚠️ Primary query failed, trying fallback without filters...');
        const snapshot = await getDocs(collection(db, 'premiumPlans'));
        const plansData = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        console.log('✅ Fallback succeeded, found plans:', plansData);
        setPlans(plansData.sort((a, b) => (a.monthlyPrice || 0) - (b.monthlyPrice || 0)));
      } catch (fallbackError) {
        console.error('❌ Fallback query also failed:', fallbackError);
        setPlans([]);
      }
    } finally {
      setPlansLoading(false);
    }
  };

  const checkExistingRequestsAndSubscriptions = async () => {
    if (!currentUser) return;
    
    try {
      // Check for existing premium requests
      const requestsQuery = query(
        collection(db, 'premiumRequests'),
        where('userId', '==', currentUser.uid),
        where('status', '==', 'pending')
      );
      const requestSnapshot = await getDocs(requestsQuery);
      setHasActiveRequest(!requestSnapshot.empty);

      // Check for active subscriptions
      const subsQuery = query(
        collection(db, 'premiumSubscriptions'),
        where('userId', '==', currentUser.uid),
        where('status', '==', 'active')
      );
      const subsSnapshot = await getDocs(subsQuery);
      setHasActiveSubscription(!subsSnapshot.empty);
    } catch (error) {
      console.error('Error checking existing requests:', error);
    }
  };

  const handlePurchasePlan = async (planData, billingPeriod) => {
    if (!currentUser) {
      navigate('/login');
      return;
    }
    
    try {
      setPaymentLoading(true);
      console.log('🔐 User authentication status:', {
        currentUser: !!currentUser,
        uid: currentUser?.uid,
        email: currentUser?.email
      });
      console.log('💳 Calling createCheckoutSession with:', { planId: planData.id, billingPeriod });
      await createCheckoutSession(planData.id, billingPeriod);
    } catch (error) {
      console.error('Error creating checkout session:', error);
      alert('Errore nella creazione della sessione di pagamento. Riprova.');
    } finally {
      setPaymentLoading(false);
    }
  };

  const handleRequestPremium = async () => {
    if (!currentUser) {
      navigate('/login');
      return;
    }

    try {
      setLoading(true);
      
      // Save to premiumRequests for admin management
      await addDoc(collection(db, 'premiumRequests'), {
        userId: currentUser.uid,
        userEmail: currentUser.email,
        status: 'pending',
        createdAt: new Date(),
        message: 'Richiesta Premium standard'
      });

      alert('Richiesta inviata con successo! Sarai contattato entro 24-48 ore.');
      setHasActiveRequest(true);
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
              {plans.length > 0 ? (
                plans.map((currentPlan, planIndex) => (
                  <div
                    key={`plan-${currentPlan.id || planIndex}`}
                    className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl overflow-hidden hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1"
                  >
                    <div className="bg-gradient-to-r from-amber-500 to-orange-500 p-6 text-white text-center">
                      <Crown className="h-8 w-8 mx-auto mb-3" />
                      <h3 className="text-2xl font-bold mb-2">{currentPlan.name || 'Piano Premium'}</h3>
                      <p className="text-sm opacity-90">{currentPlan.description || 'Accesso completo'}</p>
                    </div>
                    
                    <div className="p-6">
                      <div className="text-center mb-6">
                        <div className="flex items-center justify-center mb-2">
                          <span className="text-3xl font-bold text-gray-900 dark:text-white">
                            €{currentPlan.monthlyPrice || 0}
                          </span>
                          <span className="text-gray-500 dark:text-gray-400 ml-2">/mese</span>
                        </div>
                        {currentPlan.yearlyPrice && (
                          <div className="text-sm text-gray-600 dark:text-gray-400">
                            €{currentPlan.yearlyPrice}/anno (risparmia {Math.round((1 - (currentPlan.yearlyPrice / 12) / currentPlan.monthlyPrice) * 100)}%)
                          </div>
                        )}
                      </div>

                      <div className="space-y-3 mb-6">
                        {currentPlan.features && currentPlan.features.length > 0 ? (
                          currentPlan.features.slice(0, 5).map((currentFeature, featureIndex) => (
                            <div key={`feature-${featureIndex}`} className="flex items-center">
                              <CheckCircle className="h-4 w-4 text-green-500 mr-3 flex-shrink-0" />
                              <span className="text-sm text-gray-700 dark:text-gray-300">{currentFeature}</span>
                            </div>
                          ))
                        ) : (
                          <div className="text-sm text-gray-500 dark:text-gray-400 text-center">
                            Funzionalità in definizione
                          </div>
                        )}
                      </div>

                      <div className="space-y-3">
                        {/* Bottone Mensile */}
                        <button
                          onClick={() => handlePurchasePlan(currentPlan, 'monthly')}
                          disabled={paymentLoading}
                          className={`
                            w-full py-3 px-4 rounded-xl font-medium transition-all duration-300
                            ${paymentLoading 
                              ? 'bg-gray-300 dark:bg-gray-600 cursor-not-allowed' 
                              : 'bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white shadow-lg hover:shadow-xl'
                            }
                          `}
                        >
                          {paymentLoading ? 'Elaborazione...' : `Paga €${currentPlan.monthlyPrice}/mese`}
                        </button>

                        {/* Bottone Annuale (se disponibile) */}
                        {currentPlan.yearlyPrice && (
                          <button
                            onClick={() => handlePurchasePlan(currentPlan, 'yearly')}
                            disabled={paymentLoading}
                            className={`
                              w-full py-3 px-4 rounded-xl font-medium transition-all duration-300 border-2
                              ${paymentLoading 
                                ? 'border-gray-300 dark:border-gray-600 text-gray-400 cursor-not-allowed' 
                                : 'border-amber-500 text-amber-600 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-900/20'
                              }
                            `}
                          >
                            {paymentLoading ? 'Elaborazione...' : `Paga €${currentPlan.yearlyPrice}/anno`}
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="col-span-3 text-center py-12">
                  <AlertCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                    Piani non disponibili
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400">
                    I piani Premium non sono al momento configurati.
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    );
  }

  // Pagina Premium normale
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center">
          <Crown className="h-16 w-16 text-yellow-500 mx-auto mb-4" />
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-4">
            Percorso Premium Mentalità Vincente
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-300 mb-8 max-w-3xl mx-auto">
            Il mental training professionale per atleti che vogliono fare la differenza.
          </p>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 max-w-2xl mx-auto">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6 text-center">
            Richiedi l'accesso Premium
          </h2>
          
          <p className="text-gray-600 dark:text-gray-300 mb-8 text-center">
            Compila la richiesta per essere valutato per il percorso Premium personalizzato.
            Riceverai una risposta entro 24-48 ore.
          </p>

          <button
            onClick={handleRequestPremium}
            disabled={loading}
            className={`
              w-full py-4 px-6 rounded-xl font-bold text-lg transition-all duration-300
              ${loading 
                ? 'bg-gray-300 dark:bg-gray-600 cursor-not-allowed' 
                : 'bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white shadow-lg hover:shadow-xl'
              }
            `}
          >
            {loading ? 'Invio in corso...' : 'Candidati per il Premium'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default PremiumPageFixed;