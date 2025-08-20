/**
 * YouTube API Service per gestire i video del canale ilgabrio
 */

// Configurazione YouTube API
const YOUTUBE_API_KEY = 'AIzaSyAwuQr4sLmhi2k7CmvpFRmF6M30Xjxhj1s'; // Chiave API YouTube
const CHANNEL_USERNAME = 'ilgabrio';
const CHANNEL_ID = null; // Verrà recuperato automaticamente

class YouTubeService {
  constructor() {
    this.apiKey = YOUTUBE_API_KEY;
    this.channelId = null;
    this.baseUrl = 'https://www.googleapis.com/youtube/v3';
  }

  /**
   * Cerca il channel ID dal username o nome canale
   */
  async getChannelId() {
    if (this.channelId) return this.channelId;

    try {
      // Prima prova con forUsername
      let response = await fetch(
        `${this.baseUrl}/channels?part=id&forUsername=${CHANNEL_USERNAME}&key=${this.apiKey}`
      );
      let data = await response.json();
      
      if (data.items && data.items.length > 0) {
        this.channelId = data.items[0].id;
        return this.channelId;
      }
      
      // Se non trova con username, prova con search
      response = await fetch(
        `${this.baseUrl}/search?part=snippet&type=channel&q=${CHANNEL_USERNAME}&key=${this.apiKey}`
      );
      data = await response.json();
      
      if (data.items && data.items.length > 0) {
        this.channelId = data.items[0].snippet.channelId;
        return this.channelId;
      }
      
      throw new Error('Channel not found with username: ' + CHANNEL_USERNAME);
    } catch (error) {
      console.error('Error getting channel ID:', error);
      throw error;
    }
  }

  /**
   * Recupera tutti i video del canale
   */
  async getChannelVideos(maxResults = 50) {
    try {
      const channelId = await this.getChannelId();
      
      // Prima recupera la playlist "uploads" del canale
      const channelResponse = await fetch(
        `${this.baseUrl}/channels?part=contentDetails&id=${channelId}&key=${this.apiKey}`
      );
      const channelData = await channelResponse.json();
      
      if (!channelData.items || channelData.items.length === 0) {
        throw new Error('Channel data not found');
      }
      
      const uploadsPlaylistId = channelData.items[0].contentDetails.relatedPlaylists.uploads;
      
      // Recupera i video dalla playlist uploads
      const videosResponse = await fetch(
        `${this.baseUrl}/playlistItems?part=snippet&playlistId=${uploadsPlaylistId}&maxResults=${maxResults}&key=${this.apiKey}`
      );
      const videosData = await videosResponse.json();
      
      if (!videosData.items) {
        return [];
      }
      
      // Recupera dettagli aggiuntivi per ogni video
      const videoIds = videosData.items.map(item => item.snippet.resourceId.videoId).join(',');
      const detailsResponse = await fetch(
        `${this.baseUrl}/videos?part=snippet,statistics,contentDetails&id=${videoIds}&key=${this.apiKey}`
      );
      const detailsData = await detailsResponse.json();
      
      // Combina i dati
      return videosData.items.map(item => {
        const videoId = item.snippet.resourceId.videoId;
        const details = detailsData.items.find(detail => detail.id === videoId);
        
        return {
          id: videoId,
          title: item.snippet.title,
          description: item.snippet.description,
          publishedAt: item.snippet.publishedAt,
          thumbnail: {
            default: item.snippet.thumbnails.default?.url,
            medium: item.snippet.thumbnails.medium?.url,
            high: item.snippet.thumbnails.high?.url,
            maxres: item.snippet.thumbnails.maxres?.url
          },
          url: `https://www.youtube.com/watch?v=${videoId}`,
          embedUrl: `https://www.youtube.com/embed/${videoId}`,
          duration: details?.contentDetails?.duration || 'PT0S',
          viewCount: details?.statistics?.viewCount || '0',
          likeCount: details?.statistics?.likeCount || '0',
          channelTitle: item.snippet.channelTitle,
          tags: details?.snippet?.tags || []
        };
      });
    } catch (error) {
      console.error('Error fetching channel videos:', error);
      throw error;
    }
  }

  /**
   * Converte durata ISO 8601 in formato leggibile
   */
  formatDuration(isoDuration) {
    const match = isoDuration.match(/PT(\d+H)?(\d+M)?(\d+S)?/);
    if (!match) return '0:00';
    
    const hours = parseInt(match[1]?.replace('H', '') || '0');
    const minutes = parseInt(match[2]?.replace('M', '') || '0');
    const seconds = parseInt(match[3]?.replace('S', '') || '0');
    
    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  }

  /**
   * Formatta il numero di views
   */
  formatViewCount(viewCount) {
    const num = parseInt(viewCount);
    if (num >= 1000000) {
      return `${(num / 1000000).toFixed(1)}M`;
    } else if (num >= 1000) {
      return `${(num / 1000).toFixed(1)}K`;
    }
    return num.toString();
  }

  /**
   * Estrae l'ID del video da un URL YouTube
   */
  extractVideoId(url) {
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
    const match = url.match(regExp);
    return (match && match[2].length === 11) ? match[2] : null;
  }

  /**
   * Verifica se un URL è valido per YouTube
   */
  isValidYouTubeUrl(url) {
    return this.extractVideoId(url) !== null;
  }
}

// Export singleton instance
export const youtubeService = new YouTubeService();
export default youtubeService;