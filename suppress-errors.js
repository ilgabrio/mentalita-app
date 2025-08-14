// Sopprimi TUTTI gli errori Chrome extension e QUIC durante sviluppo
// Approccio aggressivo per console pulita

(function() {
  // Solo in sviluppo
  if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
    
    // OVERRIDE COMPLETO di console.error per filtrare aggressivamente
    const originalConsoleError = console.error;
    console.error = function(...args) {
      // Converti tutti gli argomenti in stringa per controllo
      const fullMessage = args.map(arg => {
        if (typeof arg === 'string') return arg;
        if (arg && typeof arg === 'object') return JSON.stringify(arg);
        return String(arg);
      }).join(' ');
      
      // Lista ESTESA di pattern da bloccare
      const blockedPatterns = [
        'message port closed',
        'ERR_QUIC_PROTOCOL_ERROR', 
        'Unchecked runtime.lastError',
        'WebChannelConnection',
        'transport errored',
        'ResizeObserver loop',
        'chrome-extension:',
        'Extension context invalidated',
        'QUIC',
        'NET::ERR_',
        'Failed to fetch',
        'stream closed',
        'websocket',
        'WS connection'
      ];
      
      // Blocca se contiene uno dei pattern
      const shouldBlock = blockedPatterns.some(pattern => 
        fullMessage.toLowerCase().includes(pattern.toLowerCase())
      );
      
      if (!shouldBlock) {
        originalConsoleError.apply(console, args);
      }
    };
    
    // OVERRIDE console.warn con stessa logica
    const originalConsoleWarn = console.warn;
    console.warn = function(...args) {
      const fullMessage = args.map(arg => String(arg)).join(' ');
      const shouldBlock = ['WebChannelConnection', 'transport errored', 'Firestore'].some(p => 
        fullMessage.includes(p)
      );
      
      if (!shouldBlock) {
        originalConsoleWarn.apply(console, args);
      }
    };
    
    // BLOCCA errori window globali più aggressivamente
    window.addEventListener('error', function(event) {
      const msg = event.message || event.error?.message || '';
      if (msg.includes('runtime.lastError') || msg.includes('QUIC') || msg.includes('chrome-extension')) {
        event.preventDefault();
        event.stopImmediatePropagation();
        return false;
      }
    }, true);
    
    // BLOCCA anche promise rejections
    window.addEventListener('unhandledrejection', function(event) {
      const reason = String(event.reason || '');
      if (reason.includes('runtime.lastError') || reason.includes('QUIC')) {
        event.preventDefault();
        return false;
      }
    }, true);
    
    console.log('🔇 Error suppression active for development');
  }
})();