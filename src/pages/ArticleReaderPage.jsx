import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Clock, Eye, User, Download, Share2, BookmarkPlus, BookmarkCheck, Printer, Calendar, FileText } from 'lucide-react';
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

  // Carica articolo reale da Firebase
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

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Caricamento articolo...</p>
        </div>
      </div>
    );
  }

  if (error || !article) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center max-w-md mx-auto p-8">
          <div className="w-16 h-16 mx-auto mb-4 text-gray-300">
            <FileText className="w-full h-full" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-3">
            {error || 'Articolo non trovato'}
          </h2>
          <p className="text-gray-600 mb-6">
            L'articolo che stai cercando non è disponibile o non esiste.
          </p>
          <button
            onClick={() => navigate('/articles')}
            className="bg-green-500 hover:bg-green-600 text-white px-6 py-3 rounded-lg font-medium transition-colors"
          >
            Torna agli articoli
          </button>
        </div>
      </div>
    );
  }

  // DESIGN MODERNO ARTICOLO
  return (
    <div className="min-h-screen bg-white">
      {/* Header con back button */}
      <div className="bg-white border-b border-gray-100 sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <button
            onClick={() => navigate('/articles')}
            className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors group"
          >
            <ArrowLeft className="h-5 w-5 group-hover:-translate-x-1 transition-transform" />
            <span className="font-medium">Torna agli articoli</span>
          </button>
        </div>
      </div>

      {/* Contenuto principale */}
      <article className="max-w-4xl mx-auto px-4 py-8">
        {/* Hero Image */}
        {article.imageUrl && (
          <div className="mb-8">
            <img 
              src={article.imageUrl} 
              alt={article.title}
              className="w-full h-[300px] md:h-[400px] object-cover rounded-xl shadow-lg"
            />
          </div>
        )}

        {/* Categoria */}
        {article.category && (
          <div className="mb-4">
            <span className="inline-flex items-center px-3 py-1 text-sm font-medium text-green-700 bg-green-100 rounded-full">
              {article.category}
            </span>
          </div>
        )}

        {/* Titolo */}
        <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4 leading-tight">
          {article.title}
        </h1>

        {/* Meta info */}
        {(article.author || article.publishedAt || article.readTime) && (
          <div className="flex flex-wrap items-center gap-6 text-sm text-gray-500 mb-8 pb-6 border-b border-gray-100">
            {article.author && (
              <div className="flex items-center gap-2">
                <User className="h-4 w-4" />
                <span>di {article.author}</span>
              </div>
            )}
            
            {article.publishedAt && (
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                <span>
                  {new Date(article.publishedAt?.seconds ? article.publishedAt.seconds * 1000 : article.publishedAt).toLocaleDateString('it-IT', {
                    day: 'numeric',
                    month: 'long',
                    year: 'numeric'
                  })}
                </span>
              </div>
            )}
            
            {article.readTime && (
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4" />
                <span>{article.readTime} di lettura</span>
              </div>
            )}
          </div>
        )}

        {/* Sottotitolo/Descrizione */}
        {article.description && (
          <div className="mb-8">
            <p className="text-xl text-gray-700 leading-relaxed font-light">
              {article.description}
            </p>
          </div>
        )}

        {/* Contenuto articolo */}
        {article.content && (
          <div className="prose prose-lg prose-green max-w-none mb-12">
            <div 
              className="leading-relaxed text-gray-800"
              dangerouslySetInnerHTML={{ 
                __html: DOMPurify.sanitize(article.content) 
              }}
            />
          </div>
        )}

        {/* Footer con CTA */}
        <div className="bg-gray-50 rounded-xl p-8 text-center">
          <h3 className="text-xl font-semibold text-gray-900 mb-3">
            Ti è piaciuto questo articolo?
          </h3>
          <p className="text-gray-600 mb-6">
            Scopri altri contenuti per migliorare la tua mentalità sportiva
          </p>
          <button
            onClick={() => navigate('/articles')}
            className="bg-green-500 hover:bg-green-600 text-white px-8 py-3 rounded-lg font-semibold transition-colors shadow-lg hover:shadow-xl"
          >
            Leggi altri articoli
          </button>
        </div>
      </article>

      {/* Stili personalizzati */}
      <style jsx>{`
        .prose h1, .prose h2, .prose h3, .prose h4, .prose h5, .prose h6 {
          color: #111827;
          font-weight: 700;
          margin-top: 2.5em;
          margin-bottom: 1em;
        }
        
        .prose h2 {
          font-size: 1.875em;
          line-height: 1.2;
        }
        
        .prose h3 {
          font-size: 1.5em;
          line-height: 1.3;
        }
        
        .prose p {
          margin-bottom: 1.75em;
          line-height: 1.8;
          text-align: justify;
        }
        
        .prose blockquote {
          border-left: 4px solid #10b981;
          padding: 1.5em 2em;
          margin: 2em 0;
          background: #f0fdfa;
          font-style: italic;
          color: #374151;
          border-radius: 0 8px 8px 0;
        }
        
        .prose ul, .prose ol {
          margin: 1.75em 0;
          padding-left: 2em;
        }
        
        .prose li {
          margin-bottom: 0.75em;
          line-height: 1.7;
        }
        
        .prose a {
          color: #10b981;
          text-decoration: underline;
          font-weight: 500;
        }
        
        .prose a:hover {
          color: #059669;
        }
        
        .prose strong {
          color: #111827;
          font-weight: 700;
        }
        
        .prose img {
          max-width: 100%;
          height: auto;
          margin: 2.5em 0;
          border-radius: 12px;
          box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.1);
        }
        
        .prose code {
          background: #f3f4f6;
          padding: 0.25em 0.5em;
          border-radius: 4px;
          font-size: 0.9em;
          color: #374151;
        }
      `}</style>
    </div>
  );
};

export default ArticleReaderPage;