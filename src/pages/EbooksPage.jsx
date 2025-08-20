import React, { useState, useEffect } from 'react';
import { 
  Book,
  Search,
  Filter,
  Download,
  ExternalLink,
  Crown,
  Star,
  Calendar,
  User,
  FileText,
  Globe,
  ArrowRight,
  Lock
} from 'lucide-react';
import { 
  collection, 
  getDocs,
  query,
  where,
  orderBy
} from 'firebase/firestore';
import { db } from '../config/firebase';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

const EbooksPage = () => {
  const { userProfile } = useAuth();
  const navigate = useNavigate();
  const [ebooks, setEbooks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState('all');
  const [showPremiumOnly, setShowPremiumOnly] = useState(false);

  const isPremium = userProfile?.premiumStatus === 'active';

  const categories = [
    'Mentalità',
    'Motivazione',
    'Prestazione',
    'Concentrazione',
    'Leadership',
    'Resilienza',
    'Crescita Personale',
    'Psicologia Sportiva',
    'Mindfulness',
    'Altro'
  ];

  useEffect(() => {
    fetchEbooks();
  }, []);

  const fetchEbooks = async () => {
    try {
      setLoading(true);
      // Fetch all ebooks (we'll filter on the frontend for premium access)
      const q = query(collection(db, 'ebooks'), orderBy('createdAt', 'desc'));
      const querySnapshot = await getDocs(q);
      const ebooksData = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setEbooks(ebooksData);
    } catch (error) {
      console.error('Error fetching ebooks:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredEbooks = ebooks.filter(ebook => {
    const matchesSearch = ebook.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         ebook.author?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         ebook.description?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesCategory = filterCategory === 'all' || ebook.category === filterCategory;
    
    const matchesPremiumFilter = !showPremiumOnly || ebook.isPremium;
    
    return matchesSearch && matchesCategory && matchesPremiumFilter;
  });

  const canAccessEbook = (ebook) => {
    return !ebook.isPremium || isPremium;
  };

  const handleEbookClick = (ebook) => {
    if (!canAccessEbook(ebook)) {
      navigate('/premium');
      return;
    }
    
    if (ebook.fileUrl) {
      window.open(ebook.fileUrl, '_blank');
    }
  };

  const formatDate = (timestamp) => {
    if (!timestamp) return '';
    let date;
    if (timestamp.toDate) {
      date = timestamp.toDate();
    } else {
      date = new Date(timestamp);
    }
    return date.toLocaleDateString('it-IT');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center space-x-3 mb-4">
            <Book className="h-8 w-8 text-blue-600" />
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              Biblioteca Ebook
            </h1>
          </div>
          <p className="text-gray-600 dark:text-gray-400 max-w-3xl">
            Scopri la nostra collezione di ebook dedicati al mental coaching e alla crescita personale nello sport.
          </p>
        </div>

        {/* Premium Status Banner */}
        {!isPremium && (
          <div className="mb-6 p-4 bg-gradient-to-r from-yellow-50 to-amber-50 dark:from-yellow-900/20 dark:to-amber-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <Crown className="h-6 w-6 text-yellow-600" />
                <div>
                  <h3 className="font-medium text-yellow-900 dark:text-yellow-100">
                    Accesso Limitato
                  </h3>
                  <p className="text-sm text-yellow-700 dark:text-yellow-300">
                    Alcuni ebook sono disponibili solo per gli utenti Premium
                  </p>
                </div>
              </div>
              <button
                onClick={() => navigate('/premium')}
                className="flex items-center space-x-2 bg-yellow-600 hover:bg-yellow-700 text-white px-4 py-2 rounded-lg transition-colors"
              >
                <Crown className="h-4 w-4" />
                <span>Diventa Premium</span>
              </button>
            </div>
          </div>
        )}

        {/* Search and Filters */}
        <div className="mb-6 bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Cerca ebook per titolo, autore o contenuto..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              />
            </div>
            <div className="flex gap-3">
              <div className="relative">
                <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <select
                  value={filterCategory}
                  onChange={(e) => setFilterCategory(e.target.value)}
                  className="pl-10 pr-8 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                >
                  <option value="all">Tutte le categorie</option>
                  {categories.map(category => (
                    <option key={category} value={category}>{category}</option>
                  ))}
                </select>
              </div>
              <button
                onClick={() => setShowPremiumOnly(!showPremiumOnly)}
                className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors ${
                  showPremiumOnly
                    ? 'bg-yellow-600 text-white'
                    : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
                }`}
              >
                <Crown className="h-4 w-4" />
                <span>Solo Premium</span>
              </button>
            </div>
          </div>
        </div>

        {/* Ebooks Grid */}
        {filteredEbooks.length === 0 ? (
          <div className="text-center py-12">
            <Book className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-medium text-gray-900 dark:text-white mb-2">
              Nessun ebook trovato
            </h3>
            <p className="text-gray-600 dark:text-gray-400">
              {searchTerm || filterCategory !== 'all' || showPremiumOnly
                ? 'Prova a modificare i filtri di ricerca.'
                : 'La biblioteca ebook è in preparazione.'
              }
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredEbooks.map((ebook) => {
              const hasAccess = canAccessEbook(ebook);
              
              return (
                <div 
                  key={ebook.id} 
                  className={`bg-white dark:bg-gray-800 rounded-lg shadow hover:shadow-lg transition-all cursor-pointer group ${
                    !hasAccess ? 'opacity-75' : ''
                  }`}
                  onClick={() => handleEbookClick(ebook)}
                >
                  {/* Cover Image */}
                  <div className="relative">
                    {ebook.coverImageUrl ? (
                      <img
                        src={ebook.coverImageUrl}
                        alt={ebook.title}
                        className="w-full h-48 object-cover rounded-t-lg"
                      />
                    ) : (
                      <div className="w-full h-48 bg-gradient-to-br from-blue-500 to-purple-600 rounded-t-lg flex items-center justify-center">
                        <Book className="h-16 w-16 text-white" />
                      </div>
                    )}
                    
                    {/* Premium Badge */}
                    {ebook.isPremium && (
                      <div className="absolute top-2 right-2">
                        <div className="bg-yellow-500 text-white px-2 py-1 rounded-full flex items-center space-x-1 text-xs font-medium">
                          <Crown className="h-3 w-3" />
                          <span>Premium</span>
                        </div>
                      </div>
                    )}

                    {/* Lock Overlay for Non-Premium Users */}
                    {!hasAccess && (
                      <div className="absolute inset-0 bg-black bg-opacity-50 rounded-t-lg flex items-center justify-center">
                        <div className="text-center text-white">
                          <Lock className="h-8 w-8 mx-auto mb-2" />
                          <p className="text-sm font-medium">Premium Richiesto</p>
                        </div>
                      </div>
                    )}

                    {/* Download Icon */}
                    {hasAccess && (
                      <div className="absolute top-2 left-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <div className="bg-white dark:bg-gray-800 p-2 rounded-full shadow">
                          <Download className="h-4 w-4 text-gray-600 dark:text-gray-400" />
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Content */}
                  <div className="p-4">
                    <div className="flex items-start justify-between mb-2">
                      <h3 className="font-semibold text-gray-900 dark:text-white line-clamp-2 flex-1 group-hover:text-blue-600 transition-colors">
                        {ebook.title}
                      </h3>
                      {hasAccess && (
                        <ArrowRight className="h-4 w-4 text-gray-400 group-hover:text-blue-600 transition-colors ml-2 flex-shrink-0" />
                      )}
                    </div>

                    {ebook.author && (
                      <p className="text-sm text-gray-600 dark:text-gray-400 mb-2 flex items-center">
                        <User className="h-3 w-3 mr-1" />
                        {ebook.author}
                      </p>
                    )}

                    {ebook.description && (
                      <p className="text-sm text-gray-600 dark:text-gray-400 mb-3 line-clamp-3">
                        {ebook.description}
                      </p>
                    )}

                    {/* Metadata */}
                    <div className="flex flex-wrap gap-2 mb-3">
                      {ebook.category && (
                        <span className="bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 px-2 py-1 rounded text-xs">
                          {ebook.category}
                        </span>
                      )}
                      {ebook.pages && (
                        <span className="bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 px-2 py-1 rounded text-xs flex items-center">
                          <FileText className="h-3 w-3 mr-1" />
                          {ebook.pages} pag.
                        </span>
                      )}
                      {ebook.language && (
                        <span className="bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300 px-2 py-1 rounded text-xs flex items-center">
                          <Globe className="h-3 w-3 mr-1" />
                          {ebook.language.toUpperCase()}
                        </span>
                      )}
                    </div>

                    {/* Footer */}
                    <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
                      {ebook.publishedDate && (
                        <div className="flex items-center">
                          <Calendar className="h-3 w-3 mr-1" />
                          {formatDate(ebook.publishedDate)}
                        </div>
                      )}
                      {!hasAccess && (
                        <div className="flex items-center text-yellow-600 dark:text-yellow-400">
                          <Crown className="h-3 w-3 mr-1" />
                          <span>Premium</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Call to Action for Premium */}
        {!isPremium && filteredEbooks.some(ebook => ebook.isPremium) && (
          <div className="mt-12 text-center">
            <div className="bg-gradient-to-r from-yellow-500 to-amber-500 rounded-lg p-8 text-white">
              <Crown className="h-12 w-12 mx-auto mb-4" />
              <h3 className="text-2xl font-bold mb-2">
                Accedi a Tutti gli Ebook Premium
              </h3>
              <p className="text-yellow-100 mb-6 max-w-2xl mx-auto">
                Sblocca l'accesso completo alla nostra biblioteca di ebook esclusivi e accelera la tua crescita nel mental coaching sportivo.
              </p>
              <button
                onClick={() => navigate('/premium')}
                className="bg-white text-yellow-600 hover:bg-gray-100 px-8 py-3 rounded-lg font-medium transition-colors"
              >
                Scopri i Piani Premium
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default EbooksPage;