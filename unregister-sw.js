// Script per rimuovere completamente tutti i service worker
(function() {
  console.log('🧹 Iniziando pulizia service workers...');
  
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.getRegistrations().then(function(registrations) {
      console.log(`🔍 Trovati ${registrations.length} service workers`);
      
      for(let registration of registrations) {
        registration.unregister().then(function(success) {
          if (success) {
            console.log('✅ Service worker disregistrato:', registration.scope);
          }
        });
      }
    });
  }

  // Pulisci anche tutte le cache
  if ('caches' in window) {
    caches.keys().then(function(names) {
      console.log(`🗑️ Trovate ${names.length} cache da pulire`);
      
      for (let name of names) {
        caches.delete(name).then(function() {
          console.log('✅ Cache eliminata:', name);
        });
      }
    });
  }
})();