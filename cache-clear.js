// Script per pulire la cache quando ci sono problemi con il service worker
(function() {
  // Controlla se ci sono errori di caricamento moduli
  const currentVersion = 'v20250716-3';
  const lastVersion = localStorage.getItem('app-version');
  
  if (lastVersion !== currentVersion) {
    console.log('Nuova versione rilevata, pulizia cache...');
    
    // Salva la nuova versione PRIMA di pulire per evitare loop
    localStorage.setItem('app-version', currentVersion);
    
    // Disregistra tutti i service workers
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.getRegistrations().then(function(registrations) {
        for(let registration of registrations) {
          registration.unregister();
        }
      });
    }
    
    // Pulisci cache del browser se possibile
    if ('caches' in window) {
      caches.keys().then(function(names) {
        for (let name of names) {
          caches.delete(name);
        }
      });
    }
    
    console.log('Cache pulita, ricaricamento UNICO...');
    // Ricarica la pagina UNA SOLA VOLTA
    setTimeout(() => {
      window.location.reload(true);
    }, 1000);
  }
})();