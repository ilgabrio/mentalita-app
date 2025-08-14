import React from 'react';
import { UserCheck } from 'lucide-react';

const NewsletterSubscribersManager = () => {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
      <div className="flex items-center space-x-3 mb-6">
        <UserCheck className="h-6 w-6 text-blue-600 dark:text-blue-400" />
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
          Gestione Iscritti Newsletter
        </h2>
      </div>
      <div className="text-center py-12">
        <UserCheck className="h-16 w-16 mx-auto mb-4 text-gray-400" />
        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
          Gestione Iscritti Newsletter
        </h3>
        <p className="text-gray-500 dark:text-gray-400">
          Questa funzionalità sarà implementata prossimamente per gestire gli iscritti alla newsletter della collezione 'newsletterSubscribers' in Firestore.
        </p>
      </div>
    </div>
  );
};

export default NewsletterSubscribersManager;