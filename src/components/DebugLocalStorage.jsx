import React from 'react';

const DebugLocalStorage = () => {
  const clearLocalStorage = () => {
    const keysToRemove = [
      'onboardingCompleted',
      'initialQuestionnaireCompleted', 
      'welcomeShown',
      'interactiveOnboardingCompleted'
    ];
    
    keysToRemove.forEach(key => {
      localStorage.removeItem(key);
      console.log(`Removed ${key} from localStorage`);
    });
    
    alert('localStorage pulito! Ricarica la pagina.');
    window.location.reload();
  };

  const localStorageData = {
    onboardingCompleted: localStorage.getItem('onboardingCompleted'),
    initialQuestionnaireCompleted: localStorage.getItem('initialQuestionnaireCompleted'),
    welcomeShown: localStorage.getItem('welcomeShown'),
    interactiveOnboardingCompleted: localStorage.getItem('interactiveOnboardingCompleted')
  };

  return (
    <div className="fixed top-4 right-4 bg-red-100 border border-red-500 rounded-lg p-4 z-50 max-w-sm">
      <h3 className="font-bold text-red-800 mb-2">🔧 Debug LocalStorage</h3>
      <div className="text-xs text-red-700 mb-3">
        {Object.entries(localStorageData).map(([key, value]) => (
          <div key={key}>
            <strong>{key}:</strong> {value || 'null'}
          </div>
        ))}
      </div>
      <button
        onClick={clearLocalStorage}
        className="bg-red-500 text-white px-3 py-1 rounded text-sm hover:bg-red-600"
      >
        🗑️ Pulisci e Ricarica
      </button>
    </div>
  );
};

export default DebugLocalStorage;