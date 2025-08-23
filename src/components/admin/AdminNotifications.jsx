import React, { useState, useEffect } from 'react';
import { 
  Bell, 
  User, 
  Crown, 
  ClipboardCheck,
  AlertCircle,
  X,
  ChevronRight,
  Clock
} from 'lucide-react';
import { 
  collection, 
  query, 
  where, 
  orderBy, 
  limit,
  onSnapshot,
  doc,
  updateDoc,
  Timestamp
} from 'firebase/firestore';
import { db } from '../../config/firebase';
import { useNavigate } from 'react-router-dom';

const AdminNotifications = ({ onSectionChange }) => {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAll, setShowAll] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    // Monitora nuovi utenti (ultimi 7 giorni)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const unsubscribers = [];

    // 1. Nuovi utenti
    const usersQuery = query(
      collection(db, 'users'),
      where('createdAt', '>', Timestamp.fromDate(sevenDaysAgo)),
      orderBy('createdAt', 'desc'),
      limit(10)
    );

    unsubscribers.push(
      onSnapshot(usersQuery, (snapshot) => {
        const newUsers = snapshot.docs.map(doc => ({
          id: doc.id,
          type: 'new_user',
          title: 'Nuovo utente registrato',
          message: `${doc.data().displayName || doc.data().email} si è registrato`,
          timestamp: doc.data().createdAt,
          data: doc.data(),
          icon: User,
          color: 'blue',
          action: () => onSectionChange('user-profiles')
        }));
        
        updateNotifications('new_user', newUsers);
      })
    );

    // 2. Richieste Premium pendenti
    const premiumQuery = query(
      collection(db, 'premiumRequests'),
      where('status', '==', 'pending'),
      orderBy('createdAt', 'desc')
    );

    unsubscribers.push(
      onSnapshot(premiumQuery, (snapshot) => {
        const premiumRequests = snapshot.docs.map(doc => ({
          id: doc.id,
          type: 'premium_request',
          title: 'Richiesta Premium',
          message: `${doc.data().name || doc.data().email} ha richiesto Premium`,
          timestamp: doc.data().createdAt,
          data: doc.data(),
          icon: Crown,
          color: 'amber',
          urgent: true,
          action: () => onSectionChange('premium-requests')
        }));
        
        updateNotifications('premium_request', premiumRequests);
      })
    );

    // 3. Questionari compilati (ultimi 7 giorni)
    const questionnaireQuery = query(
      collection(db, 'questionnaires'),
      where('submittedAt', '>', Timestamp.fromDate(sevenDaysAgo)),
      orderBy('submittedAt', 'desc'),
      limit(10)
    );

    unsubscribers.push(
      onSnapshot(questionnaireQuery, (snapshot) => {
        const questionnaires = snapshot.docs.map(doc => ({
          id: doc.id,
          type: 'questionnaire',
          title: 'Questionario completato',
          message: `${doc.data().athleteName || 'Utente'} ha completato il questionario`,
          timestamp: doc.data().submittedAt,
          data: doc.data(),
          icon: ClipboardCheck,
          color: 'green',
          action: () => onSectionChange('questionnaire-responses')
        }));
        
        updateNotifications('questionnaire', questionnaires);
      })
    );

    setLoading(false);

    return () => {
      unsubscribers.forEach(unsub => unsub());
    };
  }, [onSectionChange]);

  const updateNotifications = (type, newItems) => {
    setNotifications(prev => {
      // Rimuovi vecchie notifiche dello stesso tipo
      const filtered = prev.filter(n => n.type !== type);
      // Aggiungi nuove notifiche
      const combined = [...filtered, ...newItems];
      // Ordina per timestamp
      return combined.sort((a, b) => {
        const timeA = a.timestamp?.toDate?.() || new Date(0);
        const timeB = b.timestamp?.toDate?.() || new Date(0);
        return timeB - timeA;
      });
    });
  };

  const dismissNotification = async (notificationId, type) => {
    // Qui potresti salvare le notifiche dismesse nel database se necessario
    setNotifications(prev => prev.filter(n => n.id !== notificationId));
  };

  const formatTime = (timestamp) => {
    if (!timestamp) return '';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    const now = new Date();
    const diff = now - date;
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return 'Adesso';
    if (minutes < 60) return `${minutes} min fa`;
    if (hours < 24) return `${hours} ore fa`;
    return `${days} giorni fa`;
  };

  const urgentNotifications = notifications.filter(n => n.urgent);
  const regularNotifications = notifications.filter(n => !n.urgent);
  const displayNotifications = showAll ? notifications : [...urgentNotifications, ...regularNotifications].slice(0, 5);

  if (loading) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-1/3 mb-4"></div>
          <div className="space-y-3">
            <div className="h-12 bg-gray-200 dark:bg-gray-700 rounded"></div>
            <div className="h-12 bg-gray-200 dark:bg-gray-700 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
      <div className="p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-2">
            <Bell className="h-5 w-5 text-gray-600 dark:text-gray-400" />
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              Notifiche
            </h2>
            {urgentNotifications.length > 0 && (
              <span className="px-2 py-1 bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 text-xs font-medium rounded-full">
                {urgentNotifications.length} urgenti
              </span>
            )}
          </div>
          {notifications.length > 5 && (
            <button
              onClick={() => setShowAll(!showAll)}
              className="text-sm text-blue-600 dark:text-blue-400 hover:underline"
            >
              {showAll ? 'Mostra meno' : `Mostra tutte (${notifications.length})`}
            </button>
          )}
        </div>

        {notifications.length === 0 ? (
          <div className="text-center py-8">
            <Bell className="h-12 w-12 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
            <p className="text-gray-500 dark:text-gray-400">
              Nessuna nuova notifica
            </p>
            <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">
              Le notifiche appariranno qui
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {displayNotifications.map((notification) => {
              const Icon = notification.icon;
              return (
                <div
                  key={notification.id}
                  className={`
                    p-3 rounded-lg border cursor-pointer transition-all
                    ${notification.urgent 
                      ? 'border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/20 hover:bg-red-100 dark:hover:bg-red-900/30' 
                      : 'border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50'
                    }
                  `}
                  onClick={notification.action}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-start space-x-3 flex-1">
                      <div className={`
                        p-2 rounded-lg
                        ${notification.color === 'blue' && 'bg-blue-100 dark:bg-blue-900/30'}
                        ${notification.color === 'amber' && 'bg-amber-100 dark:bg-amber-900/30'}
                        ${notification.color === 'green' && 'bg-green-100 dark:bg-green-900/30'}
                      `}>
                        <Icon className={`
                          h-4 w-4
                          ${notification.color === 'blue' && 'text-blue-600 dark:text-blue-400'}
                          ${notification.color === 'amber' && 'text-amber-600 dark:text-amber-400'}
                          ${notification.color === 'green' && 'text-green-600 dark:text-green-400'}
                        `} />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center space-x-2">
                          <p className="text-sm font-medium text-gray-900 dark:text-white">
                            {notification.title}
                          </p>
                          {notification.urgent && (
                            <AlertCircle className="h-3 w-3 text-red-500" />
                          )}
                        </div>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mt-0.5">
                          {notification.message}
                        </p>
                        <div className="flex items-center space-x-2 mt-1">
                          <Clock className="h-3 w-3 text-gray-400" />
                          <span className="text-xs text-gray-500 dark:text-gray-400">
                            {formatTime(notification.timestamp)}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2 ml-3">
                      <ChevronRight className="h-4 w-4 text-gray-400" />
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          dismissNotification(notification.id, notification.type);
                        }}
                        className="p-1 hover:bg-gray-200 dark:hover:bg-gray-600 rounded transition-colors"
                      >
                        <X className="h-3 w-3 text-gray-500 dark:text-gray-400" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {notifications.length > 0 && (
          <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                  {notifications.filter(n => n.type === 'new_user').length}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400">Nuovi utenti</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-amber-600 dark:text-amber-400">
                  {notifications.filter(n => n.type === 'premium_request').length}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400">Richieste Premium</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                  {notifications.filter(n => n.type === 'questionnaire').length}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400">Questionari</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminNotifications;