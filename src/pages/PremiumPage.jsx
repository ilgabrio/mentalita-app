import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
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
import { 
  Crown, 
  Check, 
  X,
  Star, 
  Zap, 
  Shield,
  TrendingUp,
  Users,
  Award,
  Lock,
  Unlock,
  ChevronRight,
  Calendar,
  CreditCard,
  Info
} from 'lucide-react';

const PremiumPage = () => {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [billingPeriod, setBillingPeriod] = useState('monthly');
  const [userSubscription, setUserSubscription] = useState(null);

  // Piani predefiniti se non ci sono nel database
  const defaultPlans = [
    {
      id: 'basic',
      name: 'Basic',
      icon: '⭐',
      monthlyPrice: 0,
      yearlyPrice: 0,
      features: [
        'Accesso agli esercizi base',
        '5 video al mese',
        'Articoli gratuiti',
        'Badge base',
        'Supporto community'
      ],
      limitations: [
        'Esercizi avanzati limitati',
        'No contenuti esclusivi',
        'No coaching personalizzato'
      ],
      color: 'gray',
      popular: false
    },
    {
      id: 'pro',
      name: 'Pro',
      icon: '🚀',
      monthlyPrice: 9.99,
      yearlyPrice: 99.99,
      features: [
        'Tutti gli esercizi sbloccati',
        'Video illimitati HD',
        'Articoli premium',
        'Audio meditazioni guidate',
        'Badge esclusivi',
        'Statistiche avanzate',
        'Priorità nel supporto',
        'Newsletter settimanale'
      ],
      limitations: [
        'No coaching 1-on-1',
        'No programmi personalizzati'
      ],
      color: 'blue',
      popular: true,
      badge: 'Più Popolare'
    },
    {
      id: 'elite',
      name: 'Elite',
      icon: '👑',
      monthlyPrice: 24.99,
      yearlyPrice: 249.99,
      features: [
        'Tutto del piano Pro',
        'Coaching mensile 1-on-1',
        'Programmi personalizzati',
        'Accesso anticipato ai contenuti',
        'Webinar esclusivi',
        'Chat diretta con esperti',
        'Certificato di completamento',
        'Analisi performance AI',
        'Contenuti scaricabili offline'
      ],
      limitations: [],
      color: 'purple',
      popular: false,
      badge: 'Massimo Valore'
    }
  ];

  useEffect(() => {
    fetchPlans();
    if (currentUser) {
      checkUserSubscription();
    }
  }, [currentUser]);

  const fetchPlans = async () => {
    try {
      setLoading(true);
      const plansQuery = query(
        collection(db, 'premiumPlans'),
        orderBy('monthlyPrice', 'asc')
      );
      const snapshot = await getDocs(plansQuery);
      
      if (snapshot.empty) {
        // Usa i piani predefiniti se non ci sono nel database
        setPlans(defaultPlans);
      } else {
        const plansData = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        setPlans(plansData);
      }
    } catch (error) {
      console.error('Error loading plans:', error);
      setPlans(defaultPlans);
    } finally {
      setLoading(false);
    }
  };

  const checkUserSubscription = async () => {
    try {
      const subQuery = query(
        collection(db, 'subscriptions'),
        where('userId', '==', currentUser.uid),
        where('status', '==', 'active')
      );
      const snapshot = await getDocs(subQuery);
      
      if (!snapshot.empty) {
        setUserSubscription(snapshot.docs[0].data());
      }
    } catch (error) {
      console.error('Error checking subscription:', error);
    }
  };

  const handleSelectPlan = async (plan) => {
    if (!currentUser) {
      navigate('/login');
      return;
    }

    if (plan.monthlyPrice === 0 || plan.yearlyPrice === 0) {
      // Piano gratuito
      alert('Stai già utilizzando il piano Basic gratuito!');
      return;
    }

    setSelectedPlan(plan);
    
    // Aggiungi richiesta premium
    try {
      await addDoc(collection(db, 'premiumRequests'), {
        userId: currentUser.uid,
        userEmail: currentUser.email,
        planId: plan.id,
        planName: plan.name,
        billingPeriod: billingPeriod,
        price: billingPeriod === 'monthly' ? plan.monthlyPrice : plan.yearlyPrice,
        status: 'pending',
        createdAt: new Date()
      });

      alert(`Richiesta per il piano ${plan.name} inviata! Verrai contattato a breve per completare il pagamento.`);
    } catch (error) {
      console.error('Error creating premium request:', error);
      alert('Errore nella richiesta. Riprova più tardi.');
    }
  };

  const getPrice = (plan) => {
    return billingPeriod === 'monthly' ? plan.monthlyPrice : plan.yearlyPrice;
  };

  const getSavings = (plan) => {
    if (billingPeriod === 'yearly' && plan.monthlyPrice > 0) {
      const yearlyFromMonthly = plan.monthlyPrice * 12;
      const savings = yearlyFromMonthly - plan.yearlyPrice;
      return Math.round((savings / yearlyFromMonthly) * 100);
    }
    return 0;
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 dark:from-gray-900 dark:to-gray-800">
      {/* Hero Section */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-600/10 to-purple-600/10"></div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="text-center">
            <div className="flex justify-center mb-4">
              <Crown className="h-16 w-16 text-yellow-500" />
            </div>
            <h1 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-4">
              Sblocca il Tuo Potenziale Mentale
            </h1>
            <p className="text-xl text-gray-600 dark:text-gray-300 mb-8 max-w-3xl mx-auto">
              Scegli il piano che fa per te e porta le tue prestazioni sportive al livello successivo
            </p>
            
            {/* Billing Toggle */}
            <div className="flex items-center justify-center mb-8">
              <span className={`mr-3 ${billingPeriod === 'monthly' ? 'text-gray-900 dark:text-white font-semibold' : 'text-gray-500'}`}>
                Mensile
              </span>
              <button
                onClick={() => setBillingPeriod(billingPeriod === 'monthly' ? 'yearly' : 'monthly')}
                className="relative inline-flex h-6 w-11 items-center rounded-full bg-gray-200 dark:bg-gray-700 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    billingPeriod === 'yearly' ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
              <span className={`ml-3 ${billingPeriod === 'yearly' ? 'text-gray-900 dark:text-white font-semibold' : 'text-gray-500'}`}>
                Annuale
                <span className="ml-1 text-green-500 text-sm font-medium">Risparmia fino al 20%</span>
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Plans Grid */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-16">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {plans.map((plan) => {
            const isCurrentPlan = userSubscription?.planId === plan.id;
            const price = getPrice(plan);
            const savings = getSavings(plan);
            
            return (
              <div
                key={plan.id}
                className={`relative bg-white dark:bg-gray-800 rounded-2xl shadow-xl overflow-hidden transform transition-all hover:scale-105 ${
                  plan.popular ? 'ring-2 ring-blue-500' : ''
                }`}
              >
                {/* Badge */}
                {plan.badge && (
                  <div className="absolute top-0 right-0 bg-gradient-to-r from-blue-500 to-purple-500 text-white px-4 py-1 rounded-bl-lg text-sm font-semibold">
                    {plan.badge}
                  </div>
                )}

                {/* Header */}
                <div className={`p-8 text-center bg-gradient-to-br ${
                  plan.color === 'purple' ? 'from-purple-500 to-pink-500' :
                  plan.color === 'blue' ? 'from-blue-500 to-cyan-500' :
                  'from-gray-400 to-gray-500'
                } text-white`}>
                  <div className="text-5xl mb-3">{plan.icon}</div>
                  <h3 className="text-2xl font-bold mb-2">{plan.name}</h3>
                  
                  {/* Price */}
                  <div className="mb-4">
                    {price === 0 ? (
                      <div className="text-4xl font-bold">Gratis</div>
                    ) : (
                      <>
                        <div className="text-4xl font-bold">
                          €{price}
                          <span className="text-lg font-normal">
                            /{billingPeriod === 'monthly' ? 'mese' : 'anno'}
                          </span>
                        </div>
                        {savings > 0 && (
                          <div className="mt-1 text-sm bg-white/20 rounded-full px-3 py-1 inline-block">
                            Risparmi il {savings}%
                          </div>
                        )}
                      </>
                    )}
                  </div>

                  {isCurrentPlan && (
                    <div className="bg-white/20 rounded-full px-4 py-2 text-sm font-semibold">
                      Piano Attuale
                    </div>
                  )}
                </div>

                {/* Features */}
                <div className="p-8">
                  <div className="space-y-4 mb-8">
                    {plan.features.map((feature, index) => (
                      <div key={index} className="flex items-start">
                        <Check className="h-5 w-5 text-green-500 mr-3 mt-0.5 flex-shrink-0" />
                        <span className="text-gray-700 dark:text-gray-300">{feature}</span>
                      </div>
                    ))}
                    
                    {plan.limitations && plan.limitations.length > 0 && (
                      <>
                        {plan.limitations.map((limitation, index) => (
                          <div key={index} className="flex items-start opacity-50">
                            <X className="h-5 w-5 text-red-500 mr-3 mt-0.5 flex-shrink-0" />
                            <span className="text-gray-500 dark:text-gray-400 line-through">
                              {limitation}
                            </span>
                          </div>
                        ))}
                      </>
                    )}
                  </div>

                  {/* CTA Button */}
                  <button
                    onClick={() => handleSelectPlan(plan)}
                    disabled={isCurrentPlan}
                    className={`w-full py-3 px-6 rounded-lg font-semibold transition-all ${
                      isCurrentPlan
                        ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
                        : plan.color === 'purple'
                        ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white hover:from-purple-600 hover:to-pink-600'
                        : plan.color === 'blue'
                        ? 'bg-gradient-to-r from-blue-500 to-cyan-500 text-white hover:from-blue-600 hover:to-cyan-600'
                        : 'bg-gray-500 text-white hover:bg-gray-600'
                    }`}
                  >
                    {isCurrentPlan ? 'Piano Attuale' : price === 0 ? 'Inizia Gratis' : 'Scegli Questo Piano'}
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Benefits Section */}
        <div className="mt-16 bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8">
          <h2 className="text-3xl font-bold text-center text-gray-900 dark:text-white mb-8">
            Perché Passare a Premium?
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="bg-blue-100 dark:bg-blue-900/30 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                <TrendingUp className="h-8 w-8 text-blue-600 dark:text-blue-400" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                Risultati Misurabili
              </h3>
              <p className="text-gray-600 dark:text-gray-300">
                Traccia i tuoi progressi con statistiche avanzate e report personalizzati
              </p>
            </div>

            <div className="text-center">
              <div className="bg-purple-100 dark:bg-purple-900/30 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                <Users className="h-8 w-8 text-purple-600 dark:text-purple-400" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                Community Esclusiva
              </h3>
              <p className="text-gray-600 dark:text-gray-300">
                Accedi a gruppi privati e connettiti con atleti d'élite
              </p>
            </div>

            <div className="text-center">
              <div className="bg-green-100 dark:bg-green-900/30 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                <Award className="h-8 w-8 text-green-600 dark:text-green-400" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                Certificazioni
              </h3>
              <p className="text-gray-600 dark:text-gray-300">
                Ottieni certificati riconosciuti al completamento dei programmi
              </p>
            </div>
          </div>
        </div>

        {/* FAQ Section */}
        <div className="mt-16">
          <h2 className="text-3xl font-bold text-center text-gray-900 dark:text-white mb-8">
            Domande Frequenti
          </h2>
          
          <div className="space-y-4">
            <details className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 cursor-pointer">
              <summary className="font-semibold text-gray-900 dark:text-white flex items-center justify-between">
                Posso cambiare piano in qualsiasi momento?
                <ChevronRight className="h-5 w-5" />
              </summary>
              <p className="mt-4 text-gray-600 dark:text-gray-300">
                Sì, puoi fare upgrade o downgrade del tuo piano in qualsiasi momento. Le modifiche saranno effettive dal prossimo ciclo di fatturazione.
              </p>
            </details>

            <details className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 cursor-pointer">
              <summary className="font-semibold text-gray-900 dark:text-white flex items-center justify-between">
                Come funziona la prova gratuita?
                <ChevronRight className="h-5 w-5" />
              </summary>
              <p className="mt-4 text-gray-600 dark:text-gray-300">
                Il piano Basic è sempre gratuito. Per i piani Pro ed Elite, offriamo una garanzia di rimborso di 30 giorni.
              </p>
            </details>

            <details className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 cursor-pointer">
              <summary className="font-semibold text-gray-900 dark:text-white flex items-center justify-between">
                Quali metodi di pagamento accettate?
                <ChevronRight className="h-5 w-5" />
              </summary>
              <p className="mt-4 text-gray-600 dark:text-gray-300">
                Accettiamo tutte le principali carte di credito/debito, PayPal e bonifico bancario per i piani annuali.
              </p>
            </details>
          </div>
        </div>

        {/* Contact Section */}
        <div className="mt-16 text-center">
          <p className="text-gray-600 dark:text-gray-300 mb-4">
            Hai bisogno di aiuto per scegliere il piano giusto?
          </p>
          <button
            onClick={() => navigate('/contact')}
            className="inline-flex items-center px-6 py-3 bg-gray-800 dark:bg-gray-700 text-white rounded-lg hover:bg-gray-700 dark:hover:bg-gray-600 transition-colors"
          >
            <Info className="h-5 w-5 mr-2" />
            Contatta il Supporto
          </button>
        </div>
      </div>
    </div>
  );
};

export default PremiumPage;