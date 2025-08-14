import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FileText, Clock, User, Calendar } from 'lucide-react';
import { db } from '../config/firebase';
import { collection, getDocs, query, orderBy, where } from 'firebase/firestore';

const ArticlesPage = () => {
  const navigate = useNavigate();
  const [articles, setArticles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('all');

  useEffect(() => {
    const fetchArticles = async () => {
      try {
        // Prova dalla collezione appArticles
        let q = query(
          collection(db, 'appArticles'), 
          where('isPublished', '==', true),
          orderBy('order', 'asc')
        );
        
        let querySnapshot = await getDocs(q);
        let articlesData = [];
        
        querySnapshot.forEach((doc) => {
          articlesData.push({ id: doc.id, ...doc.data() });
        });

        // Se non ci sono risultati, prova dalla collezione articles
        if (articlesData.length === 0) {
          q = query(
            collection(db, 'articles'), 
            where('isPublished', '==', true),
            orderBy('createdAt', 'desc')
          );
          
          querySnapshot = await getDocs(q);
          querySnapshot.forEach((doc) => {
            articlesData.push({ id: doc.id, ...doc.data() });
          });
        }

        // Se ancora non ci sono dati, usa dati mock
        if (articlesData.length === 0) {
          articlesData = [
            {
              id: '1',
              title: 'La Psicologia dello Sport: Come Allenare la Mente',
              description: 'Scopri le tecniche fondamentali per sviluppare la forza mentale negli sport',
              content: 'Contenuto completo dell\'articolo...',
              category: 'Psicologia',
              author: 'Dr. Marco Rossi',
              readTime: '5 min',
              publishedAt: new Date(),
              isPublished: true
            },
            {
              id: '2',
              title: 'Gestire la Pressione nelle Competizioni',
              description: 'Strategie pratiche per mantenere la calma durante le gare più importanti',
              content: 'Contenuto completo dell\'articolo...',
              category: 'Prestazione',
              author: 'Coach Lisa Bianchi',
              readTime: '8 min',
              publishedAt: new Date(),
              isPublished: true
            }
          ];
        }

        setArticles(articlesData);
        
        // Estrai le categorie uniche
        const uniqueCategories = [...new Set(articlesData.map(article => article.category || 'Generale'))];
        setCategories(uniqueCategories);
        
      } catch (error) {
        console.error('Errore nel caricamento degli articoli:', error);
        // Usa dati mock in caso di errore
        const mockData = [
          {
            id: '1',
            title: 'La Psicologia dello Sport: Come Allenare la Mente',
            description: 'Scopri le tecniche fondamentali per sviluppare la forza mentale negli sport',
            category: 'Psicologia',
            author: 'Dr. Marco Rossi',
            readTime: '5 min'
          }
        ];
        setArticles(mockData);
        setCategories(['Psicologia']);
      } finally {
        setLoading(false);
      }
    };

    fetchArticles();
  }, []);

  const filteredArticles = selectedCategory === 'all' 
    ? articles 
    : articles.filter(article => article.category === selectedCategory);

  const formatDate = (date) => {
    if (!date) return '';
    const dateObj = date.toDate ? date.toDate() : new Date(date);
    return dateObj.toLocaleDateString('it-IT', { 
      day: 'numeric', 
      month: 'short', 
      year: 'numeric' 
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="px-4 py-6">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Articoli</h1>
          <p className="text-gray-600 dark:text-gray-300">
            Approfondimenti e guide sulla preparazione mentale sportiva
          </p>
        </div>

        {/* Filtri per categoria */}
        {categories.length > 0 && (
          <div className="mb-6">
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setSelectedCategory('all')}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                  selectedCategory === 'all'
                    ? 'bg-blue-500 text-white'
                    : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                }`}
              >
                Tutti
              </button>
              {categories.map(category => (
                <button
                  key={category}
                  onClick={() => setSelectedCategory(category)}
                  className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                    selectedCategory === category
                      ? 'bg-blue-500 text-white'
                      : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                  }`}
                >
                  {category}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Lista articoli */}
        <div className="space-y-4">
          {filteredArticles.length > 0 ? (
            filteredArticles.map((article) => (
              <div
                key={article.id}
                className="bg-white dark:bg-gray-800 rounded-lg shadow-sm hover:shadow-md transition-shadow cursor-pointer overflow-hidden"
                onClick={() => navigate(`/articles/${article.id}`)}
              >
                <div className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-sm font-medium text-purple-500 bg-purple-100 dark:bg-purple-900/20 dark:text-purple-400 px-2 py-1 rounded-full">
                          {article.category || 'Generale'}
                        </span>
                      </div>
                      
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                        {article.title}
                      </h3>
                      
                      <p className="text-gray-600 dark:text-gray-300 text-sm mb-4 line-clamp-2">
                        {article.description}
                      </p>
                      
                      <div className="flex items-center gap-4 text-sm text-gray-500 dark:text-gray-400">
                        {article.author && (
                          <div className="flex items-center gap-1">
                            <User className="h-4 w-4" />
                            <span>{article.author}</span>
                          </div>
                        )}
                        {article.readTime && (
                          <div className="flex items-center gap-1">
                            <Clock className="h-4 w-4" />
                            <span>{article.readTime}</span>
                          </div>
                        )}
                        {article.publishedAt && (
                          <div className="flex items-center gap-1">
                            <Calendar className="h-4 w-4" />
                            <span>{formatDate(article.publishedAt)}</span>
                          </div>
                        )}
                      </div>
                    </div>
                    
                    <button className="ml-4 p-3 bg-purple-500 hover:bg-purple-600 text-white rounded-full transition-colors">
                      <FileText className="h-5 w-5" />
                    </button>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-12">
              <div className="text-gray-400 dark:text-gray-600 mb-4">
                <FileText className="h-16 w-16 mx-auto opacity-50" />
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

export default ArticlesPage;