import React, { useState, useEffect } from 'react';
import { 
  collection, 
  query, 
  where, 
  getDocs,
  addDoc,
  orderBy,
  doc,
  getDoc,
  setDoc 
} from 'firebase/firestore';
import { db } from '../../../config/firebase';
import emailjs from '@emailjs/browser';
import { 
  Send, 
  Mail, 
  Users,
  FileText,
  Settings,
  Eye,
  Save,
  AlertCircle,
  CheckCircle,
  Loader,
  History,
  Calendar
} from 'lucide-react';

// Configurazione EmailJS - Legge dalle variabili d'ambiente
const EMAILJS_SERVICE_ID = import.meta.env.VITE_EMAILJS_SERVICE_ID || 'your_service_id';
const EMAILJS_TEMPLATE_ID = import.meta.env.VITE_EMAILJS_TEMPLATE_ID || 'your_template_id'; 
const EMAILJS_PUBLIC_KEY = import.meta.env.VITE_EMAILJS_PUBLIC_KEY || 'your_public_key';

const NewsletterSender = () => {
  const [subscribers, setSubscribers] = useState([]);
  const [selectedGroups, setSelectedGroups] = useState(['all']);
  const [newsletterContent, setNewsletterContent] = useState({
    subject: '',
    preheader: '',
    title: '',
    content: '',
    buttonText: '',
    buttonUrl: '',
    footer: 'Ricevi questa email perché sei iscritto alla newsletter di Mentalità App.'
  });
  const [sending, setSending] = useState(false);
  const [sendingStatus, setSendingStatus] = useState(null);
  const [history, setHistory] = useState([]);
  const [showPreview, setShowPreview] = useState(false);
  const [configModalOpen, setConfigModalOpen] = useState(false);
  const [emailConfig, setEmailConfig] = useState({
    serviceId: EMAILJS_SERVICE_ID,
    templateId: EMAILJS_TEMPLATE_ID,
    publicKey: EMAILJS_PUBLIC_KEY
  });

  useEffect(() => {
    fetchSubscribers();
    fetchHistory();
    loadEmailConfig();
  }, []);

  const loadEmailConfig = async () => {
    try {
      // Prima prova a caricare dal database
      const docRef = doc(db, 'siteSettings', 'emailConfig');
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        const config = docSnap.data();
        setEmailConfig({
          serviceId: config.serviceId || EMAILJS_SERVICE_ID,
          templateId: config.templateId || EMAILJS_TEMPLATE_ID,
          publicKey: config.publicKey || EMAILJS_PUBLIC_KEY
        });
        
        // Inizializza EmailJS con la configurazione dal database
        if (config.publicKey && config.publicKey !== 'your_public_key') {
          emailjs.init(config.publicKey);
        }
      } else {
        // Fallback: prova a caricare dal localStorage per retrocompatibilità
        const savedConfig = localStorage.getItem('emailjs_config');
        if (savedConfig) {
          const config = JSON.parse(savedConfig);
          setEmailConfig(config);
          
          // Salva nel database per uso futuro
          await setDoc(doc(db, 'siteSettings', 'emailConfig'), config);
          
          // Inizializza EmailJS
          if (config.publicKey && config.publicKey !== 'your_public_key') {
            emailjs.init(config.publicKey);
          }
          
          // Rimuovi dal localStorage dopo aver migrato al database
          localStorage.removeItem('emailjs_config');
        }
      }
    } catch (error) {
      console.error('Error loading EmailJS config:', error);
    }
  };

  const fetchSubscribers = async () => {
    try {
      // Prima proviamo a recuperare dalla collezione dedicata agli iscritti newsletter
      try {
        const subscribersQuery = query(
          collection(db, 'newsletterSubscribers'),
          where('active', '==', true)
        );
        const snapshot = await getDocs(subscribersQuery);
        if (snapshot.docs.length > 0) {
          const subscribersData = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
          }));
          setSubscribers(subscribersData);
          return;
        }
      } catch (newsletterError) {
        console.log('Newsletter subscribers collection not found, falling back to users');
      }

      // Fallback: usa la collezione users per gli iscritti
      const usersQuery = query(collection(db, 'users'));
      const usersSnapshot = await getDocs(usersQuery);
      const usersData = usersSnapshot.docs.map(doc => {
        const userData = doc.data();
        return {
          id: doc.id,
          email: userData.email,
          name: userData.displayName || userData.name || 'Utente',
          active: true, // Considera tutti gli utenti come attivi per la newsletter
          subscribedAt: userData.createdAt || new Date(),
          tags: ['users'] // Tag per distinguere che vengono dalla collezione users
        };
      });
      setSubscribers(usersData);
    } catch (error) {
      console.error('Error loading subscribers:', error);
      setSubscribers([]);
    }
  };

  const fetchHistory = async () => {
    try {
      const historyQuery = query(
        collection(db, 'newsletterHistory'),
        orderBy('sentAt', 'desc')
      );
      const snapshot = await getDocs(historyQuery);
      const historyData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setHistory(historyData.slice(0, 10)); // Ultimi 10 invii
    } catch (error) {
      console.error('Error loading history:', error);
    }
  };

  const handleContentChange = (e) => {
    const { name, value } = e.target;
    setNewsletterContent(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const getFilteredSubscribers = () => {
    if (selectedGroups.includes('all')) {
      return subscribers;
    }
    
    return subscribers.filter(subscriber => {
      const tags = subscriber.tags || [];
      return selectedGroups.some(group => tags.includes(group));
    });
  };

  const sendNewsletter = async () => {
    if (!emailConfig.serviceId || emailConfig.serviceId === 'your_service_id') {
      alert('Configura prima EmailJS con le tue credenziali!');
      setConfigModalOpen(true);
      return;
    }

    if (!newsletterContent.subject || !newsletterContent.content) {
      alert('Inserisci almeno oggetto e contenuto!');
      return;
    }

    setSending(true);
    setSendingStatus({ sent: 0, total: getFilteredSubscribers().length, errors: [] });

    const recipients = getFilteredSubscribers();
    let sentCount = 0;
    let errors = [];

    // Invio batch di email
    const batchSize = 10; // Invia 10 email alla volta
    for (let i = 0; i < recipients.length; i += batchSize) {
      const batch = recipients.slice(i, i + batchSize);
      
      await Promise.all(batch.map(async (subscriber) => {
        try {
          // Prepara i dati per EmailJS
          const templateParams = {
            to_email: subscriber.email,
            to_name: subscriber.name || 'Caro atleta',
            subject: newsletterContent.subject,
            preheader: newsletterContent.preheader,
            title: newsletterContent.title,
            content: newsletterContent.content,
            button_text: newsletterContent.buttonText,
            button_url: newsletterContent.buttonUrl,
            footer: newsletterContent.footer,
            unsubscribe_link: `https://be-water-2eb26.web.app/unsubscribe?email=${subscriber.email}`
          };

          await emailjs.send(
            emailConfig.serviceId,
            emailConfig.templateId,
            templateParams
          );

          sentCount++;
          setSendingStatus(prev => ({ ...prev, sent: sentCount }));
        } catch (error) {
          console.error(`Errore invio a ${subscriber.email}:`, error);
          errors.push(subscriber.email);
          setSendingStatus(prev => ({ 
            ...prev, 
            errors: [...prev.errors, subscriber.email] 
          }));
        }
      }));

      // Delay tra i batch per evitare rate limiting
      if (i + batchSize < recipients.length) {
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
    }

    // Salva nella cronologia
    await addDoc(collection(db, 'newsletterHistory'), {
      subject: newsletterContent.subject,
      content: newsletterContent.content,
      sentAt: new Date(),
      sentTo: sentCount,
      errors: errors.length,
      groups: selectedGroups
    });

    setSending(false);
    fetchHistory();
    
    if (errors.length === 0) {
      alert(`Newsletter inviata con successo a ${sentCount} iscritti!`);
      // Reset form
      setNewsletterContent({
        subject: '',
        preheader: '',
        title: '',
        content: '',
        buttonText: '',
        buttonUrl: '',
        footer: 'Ricevi questa email perché sei iscritto alla newsletter di Mentalità App.'
      });
    } else {
      alert(`Newsletter inviata a ${sentCount} iscritti. ${errors.length} errori.`);
    }
  };

  const saveEmailConfig = async () => {
    try {
      // Salva la configurazione nel database Firestore
      await setDoc(doc(db, 'siteSettings', 'emailConfig'), emailConfig);
      
      // Inizializza EmailJS con la nuova configurazione
      emailjs.init(emailConfig.publicKey);
      
      setConfigModalOpen(false);
      alert('Configurazione salvata nel database!');
    } catch (error) {
      console.error('Error saving EmailJS config:', error);
      alert('Errore nel salvare la configurazione: ' + error.message);
    }
  };

  const formatDate = (date) => {
    if (!date) return 'N/A';
    const d = date.toDate ? date.toDate() : new Date(date);
    return d.toLocaleDateString('it-IT') + ' ' + d.toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center space-x-3">
          <Mail className="h-6 w-6 text-emerald-600 dark:text-emerald-400" />
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            Invio Newsletter
          </h2>
        </div>
        <button
          onClick={() => setConfigModalOpen(true)}
          className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors"
        >
          <Settings className="h-4 w-4" />
          <span>Configura EmailJS</span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Form principale */}
        <div className="lg:col-span-2 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Oggetto Email
            </label>
            <input
              type="text"
              name="subject"
              value={newsletterContent.subject}
              onChange={handleContentChange}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500 dark:bg-gray-700 dark:text-white"
              placeholder="es. 🎯 Nuovo esercizio per migliorare la concentrazione"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Preheader (anteprima)
            </label>
            <input
              type="text"
              name="preheader"
              value={newsletterContent.preheader}
              onChange={handleContentChange}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500 dark:bg-gray-700 dark:text-white"
              placeholder="Testo che appare nell'anteprima dell'email"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Titolo Newsletter
            </label>
            <input
              type="text"
              name="title"
              value={newsletterContent.title}
              onChange={handleContentChange}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500 dark:bg-gray-700 dark:text-white"
              placeholder="Titolo principale della newsletter"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Contenuto
            </label>
            <textarea
              name="content"
              value={newsletterContent.content}
              onChange={handleContentChange}
              rows={8}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500 dark:bg-gray-700 dark:text-white resize-none"
              placeholder="Scrivi il contenuto della newsletter..."
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Testo Pulsante (opzionale)
              </label>
              <input
                type="text"
                name="buttonText"
                value={newsletterContent.buttonText}
                onChange={handleContentChange}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500 dark:bg-gray-700 dark:text-white"
                placeholder="es. Scopri di più"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                URL Pulsante
              </label>
              <input
                type="url"
                name="buttonUrl"
                value={newsletterContent.buttonUrl}
                onChange={handleContentChange}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500 dark:bg-gray-700 dark:text-white"
                placeholder="https://..."
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Footer
            </label>
            <textarea
              name="footer"
              value={newsletterContent.footer}
              onChange={handleContentChange}
              rows={2}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500 dark:bg-gray-700 dark:text-white resize-none"
            />
          </div>

          <div className="flex space-x-3">
            <button
              onClick={() => setShowPreview(true)}
              className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors"
            >
              <Eye className="h-4 w-4" />
              <span>Anteprima</span>
            </button>
            <button
              onClick={sendNewsletter}
              disabled={sending}
              className="bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 text-white px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors"
            >
              {sending ? (
                <>
                  <Loader className="h-4 w-4 animate-spin" />
                  <span>Invio in corso...</span>
                </>
              ) : (
                <>
                  <Send className="h-4 w-4" />
                  <span>Invia Newsletter</span>
                </>
              )}
            </button>
          </div>

          {sendingStatus && (
            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-blue-900 dark:text-blue-200">
                  Invio in corso...
                </span>
                <span className="text-sm text-blue-700 dark:text-blue-300">
                  {sendingStatus.sent} / {sendingStatus.total}
                </span>
              </div>
              <div className="w-full bg-blue-200 dark:bg-blue-800 rounded-full h-2">
                <div 
                  className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${(sendingStatus.sent / sendingStatus.total) * 100}%` }}
                />
              </div>
              {sendingStatus.errors.length > 0 && (
                <div className="mt-2 text-xs text-red-600 dark:text-red-400">
                  {sendingStatus.errors.length} errori di invio
                </div>
              )}
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          {/* Destinatari */}
          <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
            <h3 className="font-medium text-gray-900 dark:text-white mb-3 flex items-center">
              <Users className="h-4 w-4 mr-2" />
              Destinatari
            </h3>
            <div className="space-y-2">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={selectedGroups.includes('all')}
                  onChange={(e) => {
                    if (e.target.checked) {
                      setSelectedGroups(['all']);
                    } else {
                      setSelectedGroups([]);
                    }
                  }}
                  className="h-4 w-4 text-emerald-600 focus:ring-emerald-500 border-gray-300 rounded mr-2"
                />
                <span className="text-sm text-gray-700 dark:text-gray-300">
                  Tutti gli iscritti attivi ({subscribers.length})
                </span>
              </label>
            </div>
            <div className="mt-3 text-sm text-gray-600 dark:text-gray-400">
              Totale destinatari: <span className="font-medium">{getFilteredSubscribers().length}</span>
            </div>
          </div>

          {/* Cronologia */}
          <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
            <h3 className="font-medium text-gray-900 dark:text-white mb-3 flex items-center">
              <History className="h-4 w-4 mr-2" />
              Ultimi invii
            </h3>
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {history.length === 0 ? (
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Nessun invio precedente
                </p>
              ) : (
                history.map((item) => (
                  <div key={item.id} className="text-xs border-b border-gray-200 dark:border-gray-600 pb-2">
                    <div className="font-medium text-gray-900 dark:text-white truncate">
                      {item.subject}
                    </div>
                    <div className="text-gray-500 dark:text-gray-400 flex items-center justify-between mt-1">
                      <span className="flex items-center">
                        <Calendar className="h-3 w-3 mr-1" />
                        {formatDate(item.sentAt)}
                      </span>
                      <span>
                        {item.sentTo} inviati
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Modal Configurazione EmailJS */}
      {configModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Configura EmailJS
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Service ID
                </label>
                <input
                  type="text"
                  value={emailConfig.serviceId}
                  onChange={(e) => setEmailConfig(prev => ({ ...prev, serviceId: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500 dark:bg-gray-700 dark:text-white"
                  placeholder="service_xxxxxx"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Template ID
                </label>
                <input
                  type="text"
                  value={emailConfig.templateId}
                  onChange={(e) => setEmailConfig(prev => ({ ...prev, templateId: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500 dark:bg-gray-700 dark:text-white"
                  placeholder="template_xxxxxx"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Public Key
                </label>
                <input
                  type="text"
                  value={emailConfig.publicKey}
                  onChange={(e) => setEmailConfig(prev => ({ ...prev, publicKey: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500 dark:bg-gray-700 dark:text-white"
                  placeholder="xxxxxxxxxxxxxx"
                />
              </div>
              <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-3">
                <div className="flex">
                  <AlertCircle className="h-4 w-4 text-yellow-600 dark:text-yellow-400 mt-0.5 mr-2" />
                  <div className="text-sm text-yellow-800 dark:text-yellow-200">
                    <p className="font-medium">Come ottenere le credenziali:</p>
                    <ol className="mt-1 ml-4 list-decimal">
                      <li>Vai su emailjs.com e registrati</li>
                      <li>Crea un servizio email (Gmail, Outlook, etc.)</li>
                      <li>Crea un template per la newsletter</li>
                      <li>Copia Service ID, Template ID e Public Key</li>
                    </ol>
                  </div>
                </div>
              </div>
            </div>
            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={() => setConfigModalOpen(false)}
                className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
              >
                Annulla
              </button>
              <button
                onClick={saveEmailConfig}
                className="px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg flex items-center space-x-2 transition-colors"
              >
                <Save className="h-4 w-4" />
                <span>Salva Configurazione</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Anteprima */}
      {showPreview && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold">Anteprima Newsletter</h3>
                <button
                  onClick={() => setShowPreview(false)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  ✕
                </button>
              </div>
              <div className="border rounded-lg p-6">
                <div className="text-sm text-gray-500 mb-2">Oggetto: {newsletterContent.subject}</div>
                {newsletterContent.preheader && (
                  <div className="text-sm text-gray-500 mb-4">Preview: {newsletterContent.preheader}</div>
                )}
                {newsletterContent.title && (
                  <h1 className="text-2xl font-bold mb-4">{newsletterContent.title}</h1>
                )}
                <div className="whitespace-pre-wrap mb-6">{newsletterContent.content}</div>
                {newsletterContent.buttonText && (
                  <div className="text-center mb-6">
                    <a
                      href={newsletterContent.buttonUrl}
                      className="inline-block bg-emerald-500 text-white px-6 py-3 rounded-lg font-medium"
                    >
                      {newsletterContent.buttonText}
                    </a>
                  </div>
                )}
                <div className="text-sm text-gray-500 border-t pt-4">{newsletterContent.footer}</div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default NewsletterSender;