import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FileText, Clock, BookOpen, Bookmark, Star, Eye, Search, Filter, TrendingUp, Calendar, User } from 'lucide-react';
import { db } from '../config/firebase';
import { collection, getDocs } from 'firebase/firestore';
import MotivationalMessage from '../components/MotivationalMessage';

const ArticlesWorkspacePage = () => {
  const navigate = useNavigate();
  const [articles, setArticles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('date'); // date, views, title

  useEffect(() => {
    const fetchArticles = async () => {
      try {
        console.log('📖 CARICAMENTO ARTICOLI...');
        
        // Carica dalla collezione articles
        const articlesSnapshot = await getDocs(collection(db, 'articles'));
        const articlesData = [];
        
        articlesSnapshot.forEach((doc) => {
          const data = { id: doc.id, ...doc.data() };
          articlesData.push(data);
        });
        
        console.log('✅ Articoli trovati:', articlesData.length);
        
        setArticles(articlesData);
        
        // Estrai le categorie uniche
        const uniqueCategories = [...new Set(articlesData.map(article => article.category || 'Generale'))];
        setCategories(uniqueCategories);
        
      } catch (error) {
        console.error('Errore nel caricamento degli articoli:', error);
        
        // Dati mock per test
        const mockArticles = [
          {
            id: '1',
            title: 'La Mentalità del Campione',
            description: 'Scopri i segreti mentali che distinguono i grandi atleti dagli altri',
            content: 'La mentalità vincente non è un talento innato, ma una competenza che si può sviluppare...',
            category: 'Mentalità',
            readTime: '5 min',
            author: 'Dr. Marco Rossi',
            publishedAt: new Date('2024-01-15'),
            views: 2340,
            featured: true
          },
          {
            id: '2',
            title: 'Gestire lo Stress Pre-Gara',
            description: 'Tecniche pratiche per mantenere la calma prima delle competizioni',
            content: 'Lo stress pre-gara è normale, ma può essere trasformato in energia positiva...',
            category: 'Stress Management',
            readTime: '7 min',
            author: 'Dott.ssa Anna Verdi',
            publishedAt: new Date('2024-01-20'),
            views: 1890,
            featured: false
          },
          {
            id: '3',
            title: 'Il Potere della Visualizzazione',
            description: 'Come utilizzare la mente per migliorare le prestazioni sportive',
            content: 'La visualizzazione è una delle tecniche più potenti nel mondo dello sport...',
            category: 'Visualizzazione',
            readTime: '6 min',
            author: 'Prof. Luigi Bianchi',
            publishedAt: new Date('2024-01-25'),
            views: 3120,
            featured: true
          }
        ];
        
        setArticles(mockArticles);
        setCategories(['Mentalità', 'Stress Management', 'Visualizzazione']);
      } finally {
        setLoading(false);
      }
    };

    fetchArticles();
  }, []);

  const getFilteredAndSortedArticles = () => {
    let filtered = articles;
    
    // Filtro per categoria
    if (selectedCategory !== 'all') {
      filtered = filtered.filter(article => article.category === selectedCategory);
    }
    
    // Filtro per ricerca
    if (searchTerm) {
      filtered = filtered.filter(article => 
        article.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        article.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        article.author?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    // Ordinamento
    const sorted = [...filtered].sort((a, b) => {
      switch (sortBy) {
        case 'views':
          return (b.views || 0) - (a.views || 0);
        case 'title':
          return (a.title || '').localeCompare(b.title || '');
        case 'date':
        default:
          const dateA = a.publishedAt instanceof Date ? a.publishedAt : a.publishedAt?.toDate() || new Date(0);
          const dateB = b.publishedAt instanceof Date ? b.publishedAt : b.publishedAt?.toDate() || new Date(0);
          return dateB - dateA;
      }
    });
    
    return sorted;
  };
  
  const filteredArticles = getFilteredAndSortedArticles();

  const formatDate = (date) => {
    if (!date) return '';
    const articleDate = date instanceof Date ? date : date.toDate();
    return articleDate.toLocaleDateString('it-IT', {
      day: 'numeric',
      month: 'short',
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

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-300">Caricamento articoli...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 shadow-sm">
        <div className="px-4 py-6">
          <div className="flex items-center gap-3 mb-2">
            <BookOpen className="h-8 w-8 text-green-500" />
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Articoli e Guide</h1>
          </div>
          <p className="text-gray-600 dark:text-gray-300">
            Approfondisci le tue conoscenze con i nostri articoli sulla mentalità sportiva
          </p>
          <div className="mt-4 grid grid-cols-2 gap-4">
            <div className="bg-green-50 dark:bg-green-900/20 p-3 rounded-lg">
              <div className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-green-500" />
                <span className="text-sm font-medium text-green-700 dark:text-green-300">
                  {articles.length} Articoli Disponibili
                </span>
              </div>
            </div>
            <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg">
              <div className="flex items-center gap-2">
                <Star className="h-5 w-5 text-blue-500" />
                <span className="text-sm font-medium text-blue-700 dark:text-blue-300">
                  Contenuti Esperti
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="px-4 py-6">
        {/* Messaggio motivazionale */}
        <MotivationalMessage position="top" />
        
        {/* Barra di ricerca e filtri */}
        <div className="mb-6">
          <div className="flex flex-col sm:flex-row gap-4 mb-4">
            {/* Barra di ricerca */}
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Cerca articoli per titolo, descrizione o autore..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-green-500 focus:border-transparent"
              />
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm('')}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                >
                  ✕
                </button>
              )}
            </div>
            
            {/* Ordinamento */}
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-gray-400" />
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-green-500"
              >
                <option value="date">Data pubblicazione</option>
                <option value="views">Più visti</option>
                <option value="title">Titolo A-Z</option>
              </select>
            </div>
          </div>
          
          {/* Contatore risultati */}
          <div className="flex items-center justify-between text-sm text-gray-600 dark:text-gray-400">
            <span>
              {filteredArticles.length} articol{filteredArticles.length === 1 ? 'o' : 'i'} 
              {searchTerm && ` per "${searchTerm}"`}
              {selectedCategory !== 'all' && ` in "${selectedCategory}"`}
            </span>
            {(searchTerm || selectedCategory !== 'all') && (
              <button
                onClick={() => {
                  setSearchTerm('');
                  setSelectedCategory('all');
                }}
                className="text-green-500 hover:text-green-600 font-medium"
              >
                Cancella filtri
              </button>
            )}
          </div>
        </div>
        
        {/* Filtri per categoria */}
        {categories.length > 0 && (
          <div className="mb-6">
            <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">Filtra per categoria</h3>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setSelectedCategory('all')}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                  selectedCategory === 'all'
                    ? 'bg-green-500 text-white'
                    : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                }`}
              >
                Tutti ({articles.length})
              </button>
              {categories.map(category => {
                const count = articles.filter(article => article.category === category).length;
                return (
                  <button
                    key={category}
                    onClick={() => setSelectedCategory(category)}
                    className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                      selectedCategory === category
                        ? 'bg-green-500 text-white'
                        : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                    }`}
                  >
                    {category} ({count})
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Articoli in evidenza */}
        {filteredArticles.some(article => article.featured) && selectedCategory === 'all' && (
          <div className="mb-8">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Articoli in Evidenza</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              {filteredArticles.filter(article => article.featured).map((article) => (
                <div
                  key={article.id}
                  className="bg-gradient-to-r from-green-500 to-blue-500 rounded-lg p-1 cursor-pointer hover:shadow-lg transition-shadow"
                  onClick={() => navigate(`/articles/${article.id}`)}
                >
                  <div className="bg-white dark:bg-gray-800 rounded-lg p-6 h-full">
                    <div className="flex items-center gap-2 mb-3">
                      <Star className="h-4 w-4 text-yellow-500 fill-current" />
                      <span className="text-xs font-medium text-green-500 bg-green-100 dark:bg-green-900/20 dark:text-green-400 px-2 py-1 rounded-full">
                        In Evidenza
                      </span>
                    </div>
                    <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                      {article.title}
                    </h4>
                    <p className="text-gray-600 dark:text-gray-300 text-sm mb-4 line-clamp-2">
                      {article.description}
                    </p>
                    <div className="flex items-center justify-between text-sm text-gray-500 dark:text-gray-400">
                      <div className="flex items-center gap-4">
                        <div className="flex items-center gap-1">
                          <Clock className="h-4 w-4" />
                          <span>{article.readTime || '5 min'}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Eye className="h-4 w-4" />
                          <span>{formatViews(article.views)}</span>
                        </div>
                      </div>
                      <span>{formatDate(article.publishedAt)}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Lista articoli */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            {selectedCategory === 'all' ? 'Tutti gli Articoli' : `Articoli - ${selectedCategory}`}
          </h3>
          
          {filteredArticles.length > 0 ? (
            filteredArticles.map((article) => (
              <div
                key={article.id}
                className="bg-white dark:bg-gray-800 rounded-lg shadow-sm hover:shadow-md transition-shadow cursor-pointer overflow-hidden border border-gray-200 dark:border-gray-700"
                onClick={() => navigate(`/articles/${article.id}`)}
              >
                <div className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-3">
                        <span className="text-sm font-medium text-green-500 bg-green-100 dark:bg-green-900/20 dark:text-green-400 px-3 py-1 rounded-full">
                          {article.category || 'Generale'}
                        </span>
                        {article.featured && (
                          <Star className="h-4 w-4 text-yellow-500 fill-current" />
                        )}
                      </div>
                      
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                        {article.title}
                      </h3>
                      
                      <p className="text-gray-600 dark:text-gray-300 text-sm mb-4 line-clamp-2">
                        {article.description}
                      </p>
                      
                      <div className="flex items-center justify-between text-sm text-gray-500 dark:text-gray-400">
                        <div className="flex items-center gap-4">
                          <div className="flex items-center gap-1">
                            <Clock className="h-4 w-4" />
                            <span>{article.readTime || '5 min'}</span>
                          </div>
                          {article.views && (
                            <div className="flex items-center gap-1">
                              <Eye className="h-4 w-4" />
                              <span>{formatViews(article.views)}</span>
                            </div>
                          )}
                          {article.author && (
                            <span>di {article.author}</span>
                          )}
                        </div>
                        <span>{formatDate(article.publishedAt)}</span>
                      </div>
                    </div>
                    
                    <div className="ml-4 flex flex-col items-center gap-2">
                      <button className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
                        <Bookmark className="h-5 w-5" />
                      </button>
                      <div className="p-2 bg-green-500 hover:bg-green-600 text-white rounded-full transition-colors">
                        <FileText className="h-4 w-4" />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-12">
              <div className="text-gray-400 dark:text-gray-600 mb-4">
                <BookOpen className="h-16 w-16 mx-auto opacity-50" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                Nessun articolo trovato
              </h3>
              <p className="text-gray-500 dark:text-gray-400">
                {selectedCategory === 'all' 
                  ? 'Non ci sono articoli disponibili al momento'
                  : `Non ci sono articoli nella categoria "${selectedCategory}"`
                }
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ArticlesWorkspacePage;