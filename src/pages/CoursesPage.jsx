import React, { useState, useEffect } from 'react';
import { 
  GraduationCap,
  Search,
  Filter,
  Play,
  Clock,
  Users,
  Star,
  Crown,
  Calendar,
  User,
  BookOpen,
  ArrowRight,
  Lock,
  Target,
  Badge
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

const CoursesPage = () => {
  const { userProfile } = useAuth();
  const navigate = useNavigate();
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState('all');
  const [filterDifficulty, setFilterDifficulty] = useState('all');
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
    'Comunicazione',
    'Team Building',
    'Altro'
  ];

  const difficulties = [
    { value: 'beginner', label: 'Principiante', color: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300' },
    { value: 'intermediate', label: 'Intermedio', color: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300' },
    { value: 'advanced', label: 'Avanzato', color: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300' }
  ];

  useEffect(() => {
    fetchCourses();
  }, []);

  const fetchCourses = async () => {
    try {
      setLoading(true);
      // Fetch only published courses
      const q = query(
        collection(db, 'courses'), 
        where('status', '==', 'published'),
        orderBy('createdAt', 'desc')
      );
      const querySnapshot = await getDocs(q);
      const coursesData = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setCourses(coursesData);
    } catch (error) {
      console.error('Error fetching courses:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredCourses = courses.filter(course => {
    const matchesSearch = course.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         course.instructor?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         course.description?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesCategory = filterCategory === 'all' || course.category === filterCategory;
    const matchesDifficulty = filterDifficulty === 'all' || course.difficulty === filterDifficulty;
    const matchesPremiumFilter = !showPremiumOnly || course.isPremium;
    
    return matchesSearch && matchesCategory && matchesDifficulty && matchesPremiumFilter;
  });

  const canAccessCourse = (course) => {
    return !course.isPremium || isPremium;
  };

  const handleCourseClick = (course) => {
    if (!canAccessCourse(course)) {
      navigate('/premium');
      return;
    }
    
    // Navigate to course detail page (to be created)
    navigate(`/courses/${course.id}`);
  };

  const formatDuration = (minutes) => {
    if (!minutes) return '';
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours > 0) {
      return `${hours}h ${mins}m`;
    }
    return `${mins}m`;
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

  const getDifficultyConfig = (difficulty) => {
    return difficulties.find(d => d.value === difficulty) || difficulties[0];
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
            <GraduationCap className="h-8 w-8 text-blue-600" />
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              Corsi di Formazione
            </h1>
          </div>
          <p className="text-gray-600 dark:text-gray-400 max-w-3xl">
            Scopri i nostri corsi interattivi per sviluppare le tue competenze nel mental coaching e raggiungere il massimo delle tue prestazioni sportive.
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
                    Accesso Limitato ai Corsi
                  </h3>
                  <p className="text-sm text-yellow-700 dark:text-yellow-300">
                    La maggior parte dei corsi è disponibile solo per gli utenti Premium
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
          <div className="flex flex-col space-y-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Cerca corsi per titolo, istruttore o contenuto..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              />
            </div>
            <div className="flex flex-wrap gap-3">
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
              <div className="relative">
                <Target className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <select
                  value={filterDifficulty}
                  onChange={(e) => setFilterDifficulty(e.target.value)}
                  className="pl-10 pr-8 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                >
                  <option value="all">Tutte le difficoltà</option>
                  {difficulties.map(diff => (
                    <option key={diff.value} value={diff.value}>{diff.label}</option>
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

        {/* Courses Grid */}
        {filteredCourses.length === 0 ? (
          <div className="text-center py-12">
            <GraduationCap className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-medium text-gray-900 dark:text-white mb-2">
              Nessun corso trovato
            </h3>
            <p className="text-gray-600 dark:text-gray-400">
              {searchTerm || filterCategory !== 'all' || filterDifficulty !== 'all' || showPremiumOnly
                ? 'Prova a modificare i filtri di ricerca.'
                : 'I corsi sono in preparazione.'
              }
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredCourses.map((course) => {
              const hasAccess = canAccessCourse(course);
              const difficultyConfig = getDifficultyConfig(course.difficulty);
              
              return (
                <div 
                  key={course.id} 
                  className={`bg-white dark:bg-gray-800 rounded-lg shadow hover:shadow-lg transition-all cursor-pointer group ${
                    !hasAccess ? 'opacity-75' : ''
                  }`}
                  onClick={() => handleCourseClick(course)}
                >
                  {/* Thumbnail */}
                  <div className="relative">
                    {course.thumbnailUrl ? (
                      <img
                        src={course.thumbnailUrl}
                        alt={course.title}
                        className="w-full h-48 object-cover rounded-t-lg"
                      />
                    ) : (
                      <div className="w-full h-48 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-t-lg flex items-center justify-center">
                        <GraduationCap className="h-16 w-16 text-white" />
                      </div>
                    )}
                    
                    {/* Premium Badge */}
                    {course.isPremium && (
                      <div className="absolute top-2 right-2">
                        <div className="bg-yellow-500 text-white px-2 py-1 rounded-full flex items-center space-x-1 text-xs font-medium">
                          <Crown className="h-3 w-3" />
                          <span>Premium</span>
                        </div>
                      </div>
                    )}

                    {/* Difficulty Badge */}
                    <div className="absolute top-2 left-2">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${difficultyConfig.color}`}>
                        {difficultyConfig.label}
                      </span>
                    </div>

                    {/* Lock Overlay for Non-Premium Users */}
                    {!hasAccess && (
                      <div className="absolute inset-0 bg-black bg-opacity-50 rounded-t-lg flex items-center justify-center">
                        <div className="text-center text-white">
                          <Lock className="h-8 w-8 mx-auto mb-2" />
                          <p className="text-sm font-medium">Premium Richiesto</p>
                        </div>
                      </div>
                    )}

                    {/* Play Icon */}
                    {hasAccess && (
                      <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                        <div className="bg-white dark:bg-gray-800 p-3 rounded-full shadow-lg">
                          <Play className="h-6 w-6 text-blue-600" />
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Content */}
                  <div className="p-6">
                    <div className="flex items-start justify-between mb-2">
                      <h3 className="font-semibold text-lg text-gray-900 dark:text-white line-clamp-2 flex-1 group-hover:text-blue-600 transition-colors">
                        {course.title}
                      </h3>
                      {hasAccess && (
                        <ArrowRight className="h-5 w-5 text-gray-400 group-hover:text-blue-600 transition-colors ml-2 flex-shrink-0" />
                      )}
                    </div>

                    {course.instructor && (
                      <p className="text-sm text-gray-600 dark:text-gray-400 mb-3 flex items-center">
                        <User className="h-4 w-4 mr-1" />
                        {course.instructor}
                      </p>
                    )}

                    {course.description && (
                      <p className="text-sm text-gray-600 dark:text-gray-400 mb-4 line-clamp-3">
                        {course.description}
                      </p>
                    )}

                    {/* Course Stats */}
                    <div className="flex flex-wrap gap-2 mb-4">
                      {course.totalLessons > 0 && (
                        <div className="flex items-center text-xs text-gray-600 dark:text-gray-400 bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded">
                          <BookOpen className="h-3 w-3 mr-1" />
                          {course.totalLessons} lezioni
                        </div>
                      )}
                      {course.totalDuration > 0 && (
                        <div className="flex items-center text-xs text-gray-600 dark:text-gray-400 bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded">
                          <Clock className="h-3 w-3 mr-1" />
                          {formatDuration(course.totalDuration)}
                        </div>
                      )}
                      {course.maxStudents && (
                        <div className="flex items-center text-xs text-gray-600 dark:text-gray-400 bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded">
                          <Users className="h-3 w-3 mr-1" />
                          Max {course.maxStudents}
                        </div>
                      )}
                    </div>

                    {/* Category */}
                    {course.category && (
                      <div className="mb-4">
                        <span className="bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 px-3 py-1 rounded-full text-xs font-medium">
                          {course.category}
                        </span>
                      </div>
                    )}

                    {/* Footer */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        {course.price && (
                          <span className="text-lg font-bold text-green-600 dark:text-green-400">
                            €{course.price}
                          </span>
                        )}
                        {!hasAccess && (
                          <div className="flex items-center text-yellow-600 dark:text-yellow-400 text-sm">
                            <Crown className="h-4 w-4 mr-1" />
                            <span>Premium</span>
                          </div>
                        )}
                      </div>
                      <div className="flex items-center text-xs text-gray-500 dark:text-gray-400">
                        <Star className="h-3 w-3 mr-1" />
                        <span>Nuovo</span>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Call to Action for Premium */}
        {!isPremium && filteredCourses.some(course => course.isPremium) && (
          <div className="mt-12 text-center">
            <div className="bg-gradient-to-r from-indigo-500 to-purple-600 rounded-lg p-8 text-white">
              <GraduationCap className="h-12 w-12 mx-auto mb-4" />
              <h3 className="text-2xl font-bold mb-2">
                Accedi a Tutti i Corsi Premium
              </h3>
              <p className="text-indigo-100 mb-6 max-w-2xl mx-auto">
                Sblocca l'accesso completo ai nostri corsi di formazione avanzati e diventa un esperto nel mental coaching sportivo.
              </p>
              <button
                onClick={() => navigate('/premium')}
                className="bg-white text-indigo-600 hover:bg-gray-100 px-8 py-3 rounded-lg font-medium transition-colors"
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

export default CoursesPage;