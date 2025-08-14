// Force cache refresh and service worker update
(function() {
  console.log('🔄 Forcing cache refresh...');
  
  // Force refresh cache
  if ('caches' in window) {
    caches.keys().then(names => {
      names.forEach(name => {
        console.log('Deleting cache:', name);
        caches.delete(name);
      });
    });
  }
  
  // Force service worker update
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.getRegistrations().then(registrations => {
      registrations.forEach(registration => {
        console.log('Updating service worker...');
        registration.update();
        registration.unregister().then(() => {
          console.log('Service worker unregistered');
          window.location.reload(true);
        });
      });
    });
  } else {
    // If no service worker, just force reload
    window.location.reload(true);
  }
})();