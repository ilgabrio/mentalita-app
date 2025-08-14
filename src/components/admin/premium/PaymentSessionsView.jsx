import React from 'react';
import { CreditCard } from 'lucide-react';

const PaymentSessionsView = () => {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
      <div className="flex items-center space-x-3 mb-6">
        <CreditCard className="h-6 w-6 text-blue-600 dark:text-blue-400" />
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
          Visualizzazione Sessioni Pagamento
        </h2>
      </div>
      <div className="text-center py-12">
        <CreditCard className="h-16 w-16 mx-auto mb-4 text-gray-400" />
        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
          Visualizzazione Sessioni Pagamento
        </h3>
        <p className="text-gray-500 dark:text-gray-400">
          Questa funzionalità sarà implementata prossimamente per visualizzare e monitorare le sessioni di pagamento.
        </p>
      </div>
    </div>
  );
};

export default PaymentSessionsView;