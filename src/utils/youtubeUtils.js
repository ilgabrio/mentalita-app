/**
 * Estrae l'ID YouTube da vari formati di URL o ritorna l'ID se già presente
 * @param {string} urlOrId - URL YouTube o ID del video
 * @returns {string|null} - ID del video YouTube o null se non trovato
 */
export const extractYouTubeId = (urlOrId) => {
  if (!urlOrId || typeof urlOrId !== 'string') {
    console.log('❌ Input non valido:', urlOrId);
    return null;
  }

  // Rimuovi spazi bianchi
  const input = urlOrId.trim();
  
  // Pattern per vari formati YouTube
  const patterns = [
    // Standard YouTube watch URL
    /(?:youtube\.com\/watch\?v=)([a-zA-Z0-9_-]{11})/,
    // YouTube shortened URL
    /(?:youtu\.be\/)([a-zA-Z0-9_-]{11})/,
    // YouTube embed URL
    /(?:youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/,
    // YouTube mobile URL
    /(?:m\.youtube\.com\/watch\?v=)([a-zA-Z0-9_-]{11})/,
    // YouTube watch URL with extra params
    /(?:youtube\.com\/watch\?.*v=)([a-zA-Z0-9_-]{11})/,
    // YouTube music URL
    /(?:music\.youtube\.com\/watch\?v=)([a-zA-Z0-9_-]{11})/,
    // Just the ID (11 characters)
    /^([a-zA-Z0-9_-]{11})$/
  ];

  // Prova ogni pattern
  for (const pattern of patterns) {
    const match = input.match(pattern);
    if (match && match[1]) {
      console.log('✅ YouTube ID estratto:', match[1]);
      return match[1];
    }
  }

  console.log('❌ Impossibile estrarre YouTube ID da:', input);
  return null;
};

/**
 * Converte un URL YouTube o ID in un URL embed
 * @param {string} urlOrId - URL YouTube o ID del video
 * @param {object} options - Opzioni per l'embed
 * @returns {string|null} - URL embed di YouTube o null se non valido
 */
export const getYouTubeEmbedUrl = (urlOrId, options = {}) => {
  const videoId = extractYouTubeId(urlOrId);
  
  if (!videoId) {
    return null;
  }

  // Parametri di default per l'embed
  const defaultParams = {
    rel: 0,           // Non mostrare video correlati
    modestbranding: 1, // Minimizza il branding YouTube
    fs: 1,            // Permetti fullscreen
    autoplay: 0,      // Non auto-play
    controls: 1,      // Mostra controlli
    showinfo: 0       // Non mostrare info
  };

  // Merge con le opzioni custom
  const params = { ...defaultParams, ...options };
  
  // Costruisci la query string
  const queryString = Object.entries(params)
    .map(([key, value]) => `${key}=${value}`)
    .join('&');

  const embedUrl = `https://www.youtube.com/embed/${videoId}?${queryString}`;
  console.log('✅ URL embed generato:', embedUrl);
  
  return embedUrl;
};

/**
 * Verifica se un URL è un URL YouTube valido
 * @param {string} url - URL da verificare
 * @returns {boolean} - true se è un URL YouTube valido
 */
export const isValidYouTubeUrl = (url) => {
  return extractYouTubeId(url) !== null;
};

/**
 * Ottieni l'URL del thumbnail di YouTube
 * @param {string} urlOrId - URL YouTube o ID del video
 * @param {string} quality - Qualità del thumbnail (default, medium, high, standard, maxres)
 * @returns {string|null} - URL del thumbnail o null se non valido
 */
export const getYouTubeThumbnail = (urlOrId, quality = 'high') => {
  const videoId = extractYouTubeId(urlOrId);
  
  if (!videoId) {
    return null;
  }

  const qualityMap = {
    'default': 'default',      // 120x90
    'medium': 'mqdefault',      // 320x180
    'high': 'hqdefault',        // 480x360
    'standard': 'sddefault',    // 640x480
    'maxres': 'maxresdefault'   // 1280x720
  };

  const qualityParam = qualityMap[quality] || 'hqdefault';
  return `https://i.ytimg.com/vi/${videoId}/${qualityParam}.jpg`;
};