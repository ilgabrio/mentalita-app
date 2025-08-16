import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Clock, Eye, User, Download, Share2, BookmarkPlus, BookmarkCheck, Printer, Calendar } from 'lucide-react';
import { db } from '../config/firebase';
import { doc, getDoc, updateDoc, increment } from 'firebase/firestore';
import DOMPurify from 'dompurify';
import { useAuth } from '../context/AuthContext';

const ArticleReaderPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const [article, setArticle] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [viewsUpdated, setViewsUpdated] = useState(false);

  useEffect(() => {
    const fetchArticle = async () => {
      try {
        console.log('📖 Caricamento articolo:', id);
        
        // Prova prima dalla collezione articles
        const articleRef = doc(db, 'articles', id);
        let articleDoc = await getDoc(articleRef);
        
        if (!articleDoc.exists()) {
          // Se non esiste, prova dalla collezione appArticles
          const appArticleRef = doc(db, 'appArticles', id);
          articleDoc = await getDoc(appArticleRef);
        }
        
        if (articleDoc.exists()) {
          const articleData = { id: articleDoc.id, ...articleDoc.data() };
          console.log('✅ Articolo trovato:', articleData);
          setArticle(articleData);
          
          // Incrementa le visualizzazioni solo una volta per sessione
          if (!viewsUpdated) {
            try {
              await updateDoc(articleRef, {
                views: increment(1)
              });
              setViewsUpdated(true);
            } catch (error) {
              console.log('Non è stato possibile aggiornare le visualizzazioni:', error);
            }
          }
        } else {
          console.log('❌ Articolo non trovato');
          setError('Articolo non trovato');
        }
      } catch (error) {
        console.error('Errore nel caricamento dell\'articolo:', error);
        setError('Errore nel caricamento dell\'articolo');
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchArticle();
    }
  }, [id, viewsUpdated]);

  const formatDate = (date) => {
    if (!date) return '';
    const articleDate = date instanceof Date ? date : date.toDate();
    return articleDate.toLocaleDateString('it-IT', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  };

  const formatViews = (views) => {
    if (!views) return '0';
    if (views >= 1000) {
      return `${(views / 1000).toFixed(1)}k`;
    }
    return views.toString();
  };

  const handlePrint = () => {
    window.print();
  };

  const handleShare = async () => {
    if (navigator.share && article) {
      try {
        await navigator.share({
          title: article.title,
          text: article.description,
          url: window.location.href
        });
      } catch (error) {
        console.log('Condivisione annullata');
      }
    } else {
      // Fallback per browser che non supportano Web Share API
      navigator.clipboard.writeText(window.location.href);
      alert('Link copiato negli appunti!');
    }
  };

  const toggleBookmark = () => {
    setIsBookmarked(!isBookmarked);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-green-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Caricamento articolo...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-500 text-6xl mb-4">📄</div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Articolo non trovato</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={() => navigate('/articles')}
            className="inline-flex items-center gap-2 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Torna agli articoli
          </button>
        </div>
      </div>
    );
  }

  if (!article) {
    return null;
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Header con navigazione */}
      <div className="sticky top-0 bg-white border-b border-gray-200 z-10 print:hidden">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <button
              onClick={() => navigate('/articles')}
              className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
            >
              <ArrowLeft className="h-4 w-4" />
              <span className="font-medium">Torna agli articoli</span>
            </button>
            
            <div className="flex items-center gap-2">
              <button
                onClick={handlePrint}
                className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
                title="Stampa articolo"
              >
                <Printer className="h-5 w-5" />
              </button>
              
              <button
                onClick={handleShare}
                className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
                title="Condividi articolo"
              >
                <Share2 className="h-5 w-5" />
              </button>
              
              <button
                onClick={toggleBookmark}
                className={`p-2 transition-colors ${
                  isBookmarked 
                    ? 'text-green-500 hover:text-green-600' 
                    : 'text-gray-400 hover:text-gray-600'
                }`}
                title={isBookmarked ? 'Rimuovi dai segnalibri' : 'Aggiungi ai segnalibri'}
              >
                {isBookmarked ? (
                  <BookmarkCheck className="h-5 w-5" />
                ) : (
                  <BookmarkPlus className="h-5 w-5" />
                )}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Contenuto principale */}
      <article className="max-w-4xl mx-auto px-4 py-8">
        {/* Header dell'articolo */}
        <header className="mb-8">
          {/* Categoria */}
          {article.category && (
            <div className="mb-4">
              <span className="inline-block px-3 py-1 text-sm font-medium text-green-700 bg-green-100 rounded-full">
                {article.category}
              </span>
            </div>
          )}
          
          {/* Titolo */}
          <h1 className="text-4xl font-bold text-gray-900 mb-4 leading-tight print:text-3xl">
            {article.title}
          </h1>
          
          {/* Sottotitolo/Descrizione */}
          {article.description && (
            <p className="text-xl text-gray-600 mb-6 leading-relaxed">
              {article.description}
            </p>
          )}
          
          {/* Meta informazioni */}
          <div className="flex flex-wrap items-center gap-6 text-sm text-gray-500 pb-6 border-b border-gray-200">
            {article.author && (
              <div className="flex items-center gap-2">
                <User className="h-4 w-4" />
                <span>di {article.author}</span>
              </div>
            )}
            
            {article.publishedAt && (
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                <span>{formatDate(article.publishedAt)}</span>
              </div>
            )}
            
            {article.readTime && (
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4" />
                <span>{article.readTime} di lettura</span>
              </div>
            )}
            
            <div className="flex items-center gap-2">
              <Eye className="h-4 w-4" />
              <span>{formatViews(article.views || 0)} visualizzazioni</span>
            </div>
          </div>
        </header>

        {/* Contenuto dell'articolo */}
        <div className="prose prose-lg max-w-none">
          {article.content ? (
            <div
              className="article-content leading-relaxed text-gray-900"
              dangerouslySetInnerHTML={{
                __html: DOMPurify.sanitize(article.content, {
                  ALLOWED_TAGS: ['p', 'br', 'strong', 'em', 'u', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'ul', 'ol', 'li', 'blockquote', 'a', 'img'],
                  ALLOWED_ATTR: ['href', 'target', 'src', 'alt', 'title', 'class']
                })
              }}
            />
          ) : (
            <div className="text-center py-12">
              <p className="text-gray-500">Contenuto dell'articolo non disponibile.</p>
            </div>
          )}
        </div>

        {/* Footer dell'articolo */}
        <footer className="mt-12 pt-8 border-t border-gray-200 print:hidden">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={toggleBookmark}
                className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${
                  isBookmarked
                    ? 'bg-green-100 text-green-700 hover:bg-green-200'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {isBookmarked ? (
                  <>
                    <BookmarkCheck className="h-4 w-4" />
                    Salvato
                  </>
                ) : (
                  <>
                    <BookmarkPlus className="h-4 w-4" />
                    Salva articolo
                  </>
                )}
              </button>
              
              <button
                onClick={handleShare}
                className="inline-flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
              >
                <Share2 className="h-4 w-4" />
                Condividi
              </button>
            </div>
            
            <button
              onClick={() => navigate('/articles')}
              className="inline-flex items-center gap-2 px-6 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
            >
              Leggi altri articoli
            </button>
          </div>
        </footer>
      </article>

      <style jsx>{`
        @media print {
          .prose h1, .prose h2, .prose h3, .prose h4, .prose h5, .prose h6 {
            break-after: avoid;
            color: #111827 !important;
          }
          
          .prose p {
            orphans: 3;
            widows: 3;
            color: #374151 !important;
          }
          
          .prose {
            font-size: 11pt;
            line-height: 1.4;
          }
          
          .article-content {
            column-count: 1;
          }
          
          @page {
            margin: 2cm;
          }
        }
        
        .prose {
          font-family: 'Georgia', 'Times New Roman', serif;
        }
        
        .prose h1, .prose h2, .prose h3, .prose h4, .prose h5, .prose h6 {
          font-family: system-ui, -apple-system, sans-serif;
          font-weight: 700;
          color: #111827;
          margin-top: 2em;
          margin-bottom: 1em;
        }
        
        .prose h1 {
          font-size: 2.25em;
          line-height: 1.2;
        }
        
        .prose h2 {
          font-size: 1.875em;
          line-height: 1.3;
        }
        
        .prose h3 {
          font-size: 1.5em;
          line-height: 1.4;
        }
        
        .prose p {
          margin-bottom: 1.5em;
          text-align: justify;
          hyphens: auto;
        }
        
        .prose blockquote {
          border-left: 4px solid #10b981;
          padding-left: 1.5em;
          margin: 2em 0;
          font-style: italic;
          color: #6b7280;
        }
        
        .prose ul, .prose ol {
          margin: 1.5em 0;
          padding-left: 2em;
        }
        
        .prose li {
          margin-bottom: 0.5em;
        }
        
        .prose a {
          color: #10b981;
          text-decoration: underline;
        }
        
        .prose a:hover {
          color: #059669;
        }
        
        .prose img {
          max-width: 100%;
          height: auto;
          margin: 2em 0;
          border-radius: 8px;
          box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
        }
      `}</style>
    </div>
  );
};

export default ArticleReaderPage;