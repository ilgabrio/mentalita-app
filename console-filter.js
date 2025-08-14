// Gestione robusta degli errori di sistema e browser
(function() {
  const originalConsoleError = console.error;
  const originalConsoleWarn = console.warn;
  
  // Errori di sistema/browser da gestire elegantemente
  const systemErrors = [
    'message port closed before a response was received',
    'Unchecked runtime.lastError',
    'chrome-extension:',
    'Extension context invalidated',
    'Banner not shown: beforeinstallpromptevent.preventDefault()'
  ];
  
  // Gestione errori Chrome Extensions API (seguendo le best practice Google)
  window.addEventListener('error', function(event) {
    const message = event.message || '';
    
    if (message.includes('runtime.lastError') || message.includes('message port closed')) {
      // Implementa gestione graceful come suggerito da Google
      console.debug('🔧 Sistema: Gestito errore Chrome extension:', message);
      event.preventDefault();
      return false;
    }
  }, true);
  
  // Gestione promise rejections per runtime errors
  window.addEventListener('unhandledrejection', function(event) {
    const reason = String(event.reason || '');
    
    if (reason.includes('runtime.lastError') || reason.includes('message port closed')) {
      console.debug('🔧 Sistema: Gestito promise rejection Chrome:', reason);
      event.preventDefault();
      return false;
    }
  }, true);
  
  // Override console per filtrare errori noti
  console.error = function(...args) {
    const message = args.join(' ');
    const shouldFilter = systemErrors.some(error => message.includes(error));
    
    if (!shouldFilter) {
      originalConsoleError.apply(console, args);
    } else {
      // Log debug invece di error per errori di sistema
      console.debug('🔧 Sistema:', ...args);
    }
  };
  
  console.warn = function(...args) {
    const message = args.join(' ');
    const shouldFilter = systemErrors.some(error => message.includes(error));
    
    if (!shouldFilter) {
      originalConsoleWarn.apply(console, args);
    } else {
      // Log debug invece di warning per errori di sistema
      console.debug('🔧 Sistema:', ...args);
    }
  };
  
  // Aggiungi gestione per eventuali chrome.runtime calls nel nostro codice (se presenti)
  if (typeof chrome !== 'undefined' && chrome.runtime) {
    const originalSendMessage = chrome.runtime.sendMessage;
    
    chrome.runtime.sendMessage = function(message, responseCallback) {
      try {
        return originalSendMessage.call(this, message, function(response) {
          if (chrome.runtime.lastError) {
            // Gestione graceful come suggerito
            console.debug('🔧 Chrome Runtime: Gestito errore:', chrome.runtime.lastError.message);
            // Non propagare l'errore, gestiscilo elegantemente
            if (responseCallback) {
              responseCallback(null); // Risposta fallback
            }
          } else if (responseCallback) {
            responseCallback(response);
          }
        });
      } catch (error) {
        console.debug('🔧 Chrome Runtime: Errore di invio:', error);
        if (responseCallback) {
          responseCallback(null);
        }
      }
    };
  }
  
  console.debug('🔧 Sistema di gestione errori browser inizializzato');
})();