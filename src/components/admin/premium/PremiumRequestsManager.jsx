import React, { useState, useEffect } from 'react';
import { 
  collection, 
  query, 
  orderBy, 
  getDocs,
  doc,
  updateDoc,
  deleteDoc,
  where
} from 'firebase/firestore';
import { db } from '../../../config/firebase';
import emailjs from '@emailjs/browser';
import { 
  Crown, 
  CheckCircle, 
  XCircle, 
  Clock,
  Mail,
  Eye,
  Trash2,
  Send,
  Settings
} from 'lucide-react';

const PremiumRequestsManager = () => {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [filter, setFilter] = useState('pending');
  const [emailConfig, setEmailConfig] = useState(null);
  const [configModalOpen, setConfigModalOpen] = useState(false);
  const [sendingEmail, setSendingEmail] = useState(false);

  useEffect(() => {
    fetchRequests();
    loadEmailConfig();
  }, [filter]);

  const loadEmailConfig = () => {
    // Prima prova dal localStorage (configurazione admin)
    const savedConfig = localStorage.getItem('emailjs_config');
    if (savedConfig) {
      const config = JSON.parse(savedConfig);
      setEmailConfig(config);
      emailjs.init(config.publicKey);
      return;
    }
    
    // Fallback: usa le variabili d'ambiente
    const envConfig = {
      serviceId: import.meta.env.VITE_EMAILJS_SERVICE_ID,
      templateId: import.meta.env.VITE_EMAILJS_PREMIUM_TEMPLATE_ID || import.meta.env.VITE_EMAILJS_TEMPLATE_ID,
      publicKey: import.meta.env.VITE_EMAILJS_PUBLIC_KEY
    };
    
    // Verifica che le env vars siano configurate
    if (envConfig.serviceId && envConfig.serviceId !== 'your_service_id' && 
        envConfig.templateId && envConfig.templateId !== 'your_template_id' &&
        envConfig.publicKey && envConfig.publicKey !== 'your_public_key') {
      setEmailConfig(envConfig);
      emailjs.init(envConfig.publicKey);
    }
  };

  const fetchRequests = async () => {
    try {
      setLoading(true);
      let q;
      
      if (filter === 'all') {
        q = query(
          collection(db, 'premiumRequests'),
          orderBy('createdAt', 'desc')
        );
      } else {
        q = query(
          collection(db, 'premiumRequests'),
          where('status', '==', filter),
          orderBy('createdAt', 'desc')
        );
      }
      
      const snapshot = await getDocs(q);
      const requestsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      
      setRequests(requestsData);
    } catch (error) {
      console.error('Error fetching premium requests:', error);
      const snapshot = await getDocs(collection(db, 'premiumRequests'));
      const requestsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setRequests(requestsData);
    } finally {
      setLoading(false);
    }
  };

  const sendApprovalEmail = async (request) => {
    if (!emailConfig) {
      alert('Configurazione EmailJS non trovata. Configura prima EmailJS nella sezione Newsletter.');
      return false;
    }

    setSendingEmail(true);
    try {
      // Determina il piano da utilizzare (di default il primo piano attivo)
      const planId = 'standard'; // Puoi personalizzarlo in base alla richiesta
      
      const templateParams = {
        to_email: request.userEmail,
        to_name: `Caro ${request.userEmail.split('@')[0]}`,
        subject: '🎉 La tua richiesta Premium è stata approvata - Completa il pagamento',
        title: 'Congratulazioni! Sei stato accettato in Mentalità Premium!',
        content: `Ottima notizia! La tua richiesta per Mentalità Premium è stata approvata dal nostro team.

✅ RICHIESTA APPROVATA
Sport: ${request.sport}
Budget: ${request.budget}

🎯 PROSSIMI PASSI:
1. Clicca sul pulsante qui sotto per accedere alla pagina di pagamento sicura
2. Scegli il piano che preferisci (mensile o annuale)
3. Completa il pagamento con carta di credito tramite Stripe
4. Il tuo account verrà attivato immediatamente dopo il pagamento

🏆 COSA OTTIENI:
• Coaching personalizzato 1-a-1
• Esercizi avanzati di mental training
• Supporto diretto via email e chat
• Piano di allenamento mentale su misura per il tuo sport
• Accesso a contenuti esclusivi e masterclass
• Reportistica dettagliata sui tuoi progressi

💳 PAGAMENTO SICURO:
I pagamenti sono gestiti da Stripe, il leader mondiale per i pagamenti online. I tuoi dati sono protetti al 100%.

⏰ OFFERTA LIMITATA:
Hai 7 giorni per completare il pagamento e attivare il tuo account Premium.`,
        button_text: '💳 Completa Pagamento Premium',
        button_url: `https://be-water-2eb26.web.app/premium?approved=true&plan=${planId}&email=${encodeURIComponent(request.userEmail)}`,
        footer: 'Benvenuto nella famiglia Premium di Mentalità! 🚀'
      };

      await emailjs.send(
        emailConfig.serviceId,
        emailConfig.templateId,
        templateParams
      );

      return true;
    } catch (error) {
      console.error('Errore invio email:', error);
      alert('Errore nell\'invio dell\'email. Richiesta comunque approvata.');
      return false;
    } finally {
      setSendingEmail(false);
    }
  };

  const approveRequest = async (requestId) => {
    if (!confirm('Approvare questa richiesta e inviare email con link pagamento?')) return;
    
    try {
      // Trova la richiesta per ottenere i dati utente
      const request = requests.find(r => r.id === requestId);
      if (!request) {
        alert('Richiesta non trovata!');
        return;
      }

      // Aggiorna lo status nel database
      await updateDoc(doc(db, 'premiumRequests', requestId), {
        status: 'approved',
        approvedAt: new Date(),
        paymentPending: true, // Nuovo campo per tracciare che il pagamento è in attesa
        approvedBy: 'admin'
      });

      // 📧 NUOVO FLUSSO: NON attiva l'utente direttamente, ma aggiorna solo lo status della richiesta
      if (request.userId) {
        await updateDoc(doc(db, 'users', request.userId), {
          premiumRequestStatus: 'approved_pending_payment', // Nuovo status
          premiumApprovedAt: new Date(),
          premiumApprovedBy: 'admin',
          premiumNotification: true, // 🔔 Aggiunge notifica per l'utente
          premiumNotificationMessage: 'La tua richiesta Premium è stata approvata! Clicca qui per completare il pagamento.'
        });
        console.log('✅ Richiesta approvata per utente', request.userId, '- In attesa di pagamento');
      }
      
      // Invia email con link pagamento
      const emailSent = await sendApprovalEmail(request);
      
      if (emailSent) {
        alert('✅ Richiesta approvata!\n📧 Email con link pagamento inviata con successo!\n\n💡 L\'utente riceverà un\'email con il link per completare il pagamento tramite Stripe.');
      } else {
        alert('⚠️ Richiesta approvata, ma errore nell\'invio email.\n\nL\'utente potrà comunque accedere alla pagina Premium per completare il pagamento.');
      }
      
      fetchRequests();
    } catch (error) {
      console.error('Error approving request:', error);
      alert('Errore nell\'approvazione della richiesta.');
    }
  };

  const rejectRequest = async (requestId) => {
    if (!confirm('Rifiutare questa richiesta?')) return;
    
    try {
      // Trova la richiesta per ottenere i dati utente
      const request = requests.find(r => r.id === requestId);
      
      await updateDoc(doc(db, 'premiumRequests', requestId), {
        status: 'rejected',
        rejectedAt: new Date()
      });

      // Aggiorna lo status nel profilo utente
      if (request?.userId) {
        await updateDoc(doc(db, 'users', request.userId), {
          premiumRequestStatus: 'rejected',
          premiumRejectedAt: new Date()
        });
      }
      
      fetchRequests();
    } catch (error) {
      console.error('Error rejecting request:', error);
    }
  };

  const deleteRequest = async (requestId) => {
    if (!confirm('Eliminare questa richiesta?')) return;
    
    try {
      await deleteDoc(doc(db, 'premiumRequests', requestId));
      fetchRequests();
    } catch (error) {
      console.error('Error deleting request:', error);
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'pending':
        return (
          <span className="px-3 py-1 bg-yellow-100 text-yellow-800 rounded-full text-sm font-medium flex items-center space-x-1">
            <Clock className="h-3 w-3" />
            <span>In Attesa</span>
          </span>
        );
      case 'approved':
        return (
          <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm font-medium flex items-center space-x-1">
            <CheckCircle className="h-3 w-3" />
            <span>Approvato</span>
          </span>
        );
      case 'rejected':
        return (
          <span className="px-3 py-1 bg-red-100 text-red-800 rounded-full text-sm font-medium flex items-center space-x-1">
            <XCircle className="h-3 w-3" />
            <span>Rifiutato</span>
          </span>
        );
      default:
        return null;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 flex items-center space-x-2">
              <Crown className="h-8 w-8 text-yellow-500" />
              <span>Richieste Premium</span>
            </h2>
            <div className="flex items-center space-x-2 mt-1">
              <Mail className={`h-4 w-4 ${emailConfig ? 'text-green-500' : 'text-red-500'}`} />
              <span className="text-sm text-gray-600">
                Email: {emailConfig ? 'Configurato' : 'Non configurato'}
              </span>
              {!emailConfig && (
                <button
                  onClick={() => alert('Vai nella sezione Newsletter per configurare EmailJS')}
                  className="text-blue-600 hover:text-blue-800 text-xs underline"
                >
                  Configura ora
                </button>
              )}
            </div>
          </div>
          
          <div className="flex space-x-2">
            <button
              onClick={() => setFilter('pending')}
              className={`px-4 py-2 rounded-lg font-medium ${
                filter === 'pending'
                  ? 'bg-yellow-100 text-yellow-800'
                  : 'bg-gray-100 text-gray-600'
              }`}
            >
              In Attesa
            </button>
            <button
              onClick={() => setFilter('approved')}
              className={`px-4 py-2 rounded-lg font-medium ${
                filter === 'approved'
                  ? 'bg-green-100 text-green-800'
                  : 'bg-gray-100 text-gray-600'
              }`}
            >
              Approvate
            </button>
            <button
              onClick={() => setFilter('rejected')}
              className={`px-4 py-2 rounded-lg font-medium ${
                filter === 'rejected'
                  ? 'bg-red-100 text-red-800'
                  : 'bg-gray-100 text-gray-600'
              }`}
            >
              Rifiutate
            </button>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-lg overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Utente
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Sport
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Budget
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Stato
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Azioni
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {requests.map(request => (
              <tr key={request.id}>
                <td className="px-6 py-4">
                  <div className="text-sm font-medium text-gray-900">
                    {request.userEmail}
                  </div>
                </td>
                <td className="px-6 py-4 text-sm text-gray-900">
                  {request.sport}
                </td>
                <td className="px-6 py-4 text-sm font-medium text-gray-900">
                  {request.budget || 'Non specificato'}
                </td>
                <td className="px-6 py-4">
                  {getStatusBadge(request.status)}
                </td>
                <td className="px-6 py-4">
                  <div className="flex space-x-2">
                    <button
                      onClick={() => setSelectedRequest(request)}
                      className="text-blue-600 hover:text-blue-900"
                    >
                      <Eye className="h-5 w-5" />
                    </button>
                    
                    {request.status === 'pending' && (
                      <>
                        <button
                          onClick={() => approveRequest(request.id)}
                          disabled={sendingEmail}
                          className="text-green-600 hover:text-green-900 disabled:opacity-50"
                          title="Approva e invia email con link pagamento"
                        >
                          {sendingEmail ? (
                            <Send className="h-5 w-5 animate-pulse" />
                          ) : (
                            <CheckCircle className="h-5 w-5" />
                          )}
                        </button>
                        <button
                          onClick={() => rejectRequest(request.id)}
                          disabled={sendingEmail}
                          className="text-red-600 hover:text-red-900 disabled:opacity-50"
                        >
                          <XCircle className="h-5 w-5" />
                        </button>
                      </>
                    )}
                    
                    <button
                      onClick={() => deleteRequest(request.id)}
                      className="text-red-600 hover:text-red-900"
                    >
                      <Trash2 className="h-5 w-5" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {selectedRequest && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl max-w-2xl w-full max-h-[80vh] overflow-y-auto p-6">
            <div className="flex justify-between items-start mb-6">
              <h3 className="text-xl font-bold">Dettagli Richiesta</h3>
              <button
                onClick={() => setSelectedRequest(null)}
                className="text-gray-400 hover:text-gray-600"
              >
                <XCircle className="h-6 w-6" />
              </button>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-500">Utente</label>
                <p className="text-lg">{selectedRequest.userEmail}</p>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-500">Sport</label>
                  <p>{selectedRequest.sport}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Budget</label>
                  <p className="font-bold text-green-600">{selectedRequest.budget}</p>
                </div>
              </div>
              
              <div>
                <label className="text-sm font-medium text-gray-500">Obiettivi</label>
                <p>{selectedRequest.goals}</p>
              </div>
              
              <div>
                <label className="text-sm font-medium text-gray-500">Perché Premium</label>
                <p>{selectedRequest.whyPremium}</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PremiumRequestsManager;