import React, { useState, useEffect } from 'react';
import { Sparkles, Heart, Target } from 'lucide-react';
import { db } from '../config/firebase';
import { collection, getDocs } from 'firebase/firestore';

const MotivationalMessage = ({ position = 'top' }) => {
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchRandomMessage();
  }, []);

  const fetchRandomMessage = async () => {
    try {
      const messagesRef = collection(db, 'motivationalMessages');
      const snapshot = await getDocs(messagesRef);
      const messages = [];
      
      snapshot.forEach((doc) => {
        const data = doc.data();
        if (data.isActive) {
          messages.push(data.text);
        }
      });

      if (messages.length > 0) {
        const randomIndex = Math.floor(Math.random() * messages.length);
        setMessage(messages[randomIndex]);
      } else {
        // Messaggi di default se non configurati
        const defaultMessages = [
          "La forza non viene dalla capacità fisica. Viene da una volontà indomabile. 💪",
          "Ogni campione è stato una volta un principiante che non si è mai arreso. 🏆",
          "Il successo è dove la preparazione e l'opportunità si incontrano. ⭐",
          "La mente è tutto. Ciò che pensi, diventi. 🧠",
          "Non smettere mai di credere in te stesso. Sei più forte di quanto pensi. 🚀",
          "Oggi è il giorno perfetto per superare i tuoi limiti. 🌟",
          "La disciplina è il ponte tra obiettivi e risultati. 🎯"
        ];
        const randomIndex = Math.floor(Math.random() * defaultMessages.length);
        setMessage(defaultMessages[randomIndex]);
      }
    } catch (error) {
      console.error('Errore nel caricamento messaggio motivazionale:', error);
      setMessage("Ogni passo ti avvicina ai tuoi obiettivi. Continua così! 🌟");
    } finally {
      setLoading(false);
    }
  };

  if (loading || !message) {
    return null;
  }

  const getIcon = () => {
    const icons = [Sparkles, Heart, Target];
    const RandomIcon = icons[Math.floor(Math.random() * icons.length)];
    return <RandomIcon className="h-5 w-5 text-yellow-500" />;
  };

  const positionClasses = {
    top: 'mb-6',
    bottom: 'mt-6',
    inline: 'my-4'
  };

  return (
    <div className={`${positionClasses[position]}`}>
      <div className="bg-gradient-to-r from-yellow-50 to-orange-50 dark:from-yellow-900/20 dark:to-orange-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
        <div className="flex items-start space-x-3">
          <div className="flex-shrink-0 mt-1">
            {getIcon()}
          </div>
          <div className="flex-1">
            <p className="text-sm font-medium text-yellow-800 dark:text-yellow-200 leading-relaxed">
              {message}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MotivationalMessage;