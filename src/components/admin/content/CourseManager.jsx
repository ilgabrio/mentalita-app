import React, { useState, useEffect } from 'react';
import { 
  GraduationCap,
  Plus, 
  Edit, 
  Trash2, 
  Save, 
  X, 
  Eye,
  Play,
  Clock,
  Users,
  Star,
  Crown,
  Search,
  Filter,
  ChevronDown,
  ChevronUp,
  BookOpen
} from 'lucide-react';
import { 
  collection, 
  addDoc, 
  getDocs, 
  doc, 
  updateDoc, 
  deleteDoc,
  serverTimestamp,
  query,
  orderBy
} from 'firebase/firestore';
import { db } from '../../../config/firebase';

const CourseManager = () => {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingCourse, setEditingCourse] = useState(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState('all');
  const [expandedCourse, setExpandedCourse] = useState(null);

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: '',
    instructor: '',
    thumbnailUrl: '',
    isPremium: true,
    duration: '',
    difficulty: 'beginner',
    price: '',
    language: 'it',
    tags: '',
    lessons: [],
    maxStudents: '',
    status: 'draft'
  });

  const [currentLesson, setCurrentLesson] = useState({
    title: '',
    description: '',
    videoUrl: '',
    duration: '',
    order: 1
  });

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
    { value: 'beginner', label: 'Principiante' },
    { value: 'intermediate', label: 'Intermedio' },
    { value: 'advanced', label: 'Avanzato' }
  ];

  const statuses = [
    { value: 'draft', label: 'Bozza' },
    { value: 'published', label: 'Pubblicato' },
    { value: 'archived', label: 'Archiviato' }
  ];

  useEffect(() => {
    fetchCourses();
  }, []);

  const fetchCourses = async () => {
    try {
      setLoading(true);
      const q = query(collection(db, 'courses'), orderBy('createdAt', 'desc'));
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

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleLessonChange = (e) => {
    const { name, value } = e.target;
    setCurrentLesson(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const addLesson = () => {
    if (currentLesson.title && currentLesson.videoUrl) {
      setFormData(prev => ({
        ...prev,
        lessons: [...prev.lessons, { ...currentLesson, id: Date.now() }]
      }));
      setCurrentLesson({
        title: '',
        description: '',
        videoUrl: '',
        duration: '',
        order: formData.lessons.length + 2
      });
    }
  };

  const removeLesson = (lessonId) => {
    setFormData(prev => ({
      ...prev,
      lessons: prev.lessons.filter(lesson => lesson.id !== lessonId)
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const courseData = {
        ...formData,
        price: formData.price ? parseFloat(formData.price) : null,
        maxStudents: formData.maxStudents ? parseInt(formData.maxStudents) : null,
        tags: formData.tags.split(',').map(tag => tag.trim()).filter(tag => tag),
        totalLessons: formData.lessons.length,
        totalDuration: formData.lessons.reduce((total, lesson) => {
          const duration = lesson.duration ? parseInt(lesson.duration) : 0;
          return total + duration;
        }, 0),
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      };

      if (editingCourse) {
        await updateDoc(doc(db, 'courses', editingCourse.id), {
          ...courseData,
          createdAt: editingCourse.createdAt, // Preserve original creation date
        });
        console.log('Course updated successfully');
      } else {
        await addDoc(collection(db, 'courses'), courseData);
        console.log('Course added successfully');
      }

      await fetchCourses();
      resetForm();
    } catch (error) {
      console.error('Error saving course:', error);
    }
  };

  const handleEdit = (course) => {
    setEditingCourse(course);
    setFormData({
      title: course.title || '',
      description: course.description || '',
      category: course.category || '',
      instructor: course.instructor || '',
      thumbnailUrl: course.thumbnailUrl || '',
      isPremium: course.isPremium !== false,
      duration: course.duration || '',
      difficulty: course.difficulty || 'beginner',
      price: course.price ? course.price.toString() : '',
      language: course.language || 'it',
      tags: course.tags ? course.tags.join(', ') : '',
      lessons: course.lessons || [],
      maxStudents: course.maxStudents ? course.maxStudents.toString() : '',
      status: course.status || 'draft'
    });
    setShowAddForm(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm('Sei sicuro di voler eliminare questo corso?')) {
      try {
        await deleteDoc(doc(db, 'courses', id));
        await fetchCourses();
        console.log('Course deleted successfully');
      } catch (error) {
        console.error('Error deleting course:', error);
      }
    }
  };

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      category: '',
      instructor: '',
      thumbnailUrl: '',
      isPremium: true,
      duration: '',
      difficulty: 'beginner',
      price: '',
      language: 'it',
      tags: '',
      lessons: [],
      maxStudents: '',
      status: 'draft'
    });
    setCurrentLesson({
      title: '',
      description: '',
      videoUrl: '',
      duration: '',
      order: 1
    });
    setEditingCourse(null);
    setShowAddForm(false);
  };

  const filteredCourses = courses.filter(course => {
    const matchesSearch = course.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         course.instructor?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         course.description?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesCategory = filterCategory === 'all' || course.category === filterCategory;
    
    return matchesSearch && matchesCategory;
  });

  const formatDuration = (minutes) => {
    if (!minutes) return '';
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours > 0) {
      return `${hours}h ${mins}m`;
    }
    return `${mins}m`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <GraduationCap className="h-6 w-6 text-blue-600" />
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            Gestione Corsi
          </h2>
        </div>
        <button
          onClick={() => setShowAddForm(true)}
          className="flex items-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors"
        >
          <Plus className="h-4 w-4" />
          <span>Aggiungi Corso</span>
        </button>
      </div>

      {/* Search and Filter */}
      <div className="mb-6 flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="Cerca corsi..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
          />
        </div>
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
      </div>

      {/* Add/Edit Form */}
      {showAddForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  {editingCourse ? 'Modifica Corso' : 'Aggiungi Nuovo Corso'}
                </h3>
                <button
                  onClick={resetForm}
                  className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Basic Info */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Titolo Corso *
                    </label>
                    <input
                      type="text"
                      name="title"
                      value={formData.title}
                      onChange={handleInputChange}
                      required
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Istruttore *
                    </label>
                    <input
                      type="text"
                      name="instructor"
                      value={formData.instructor}
                      onChange={handleInputChange}
                      required
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Descrizione
                  </label>
                  <textarea
                    name="description"
                    value={formData.description}
                    onChange={handleInputChange}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Categoria
                    </label>
                    <select
                      name="category"
                      value={formData.category}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    >
                      <option value="">Seleziona categoria</option>
                      {categories.map(category => (
                        <option key={category} value={category}>{category}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Difficoltà
                    </label>
                    <select
                      name="difficulty"
                      value={formData.difficulty}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    >
                      {difficulties.map(diff => (
                        <option key={diff.value} value={diff.value}>{diff.label}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Stato
                    </label>
                    <select
                      name="status"
                      value={formData.status}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    >
                      {statuses.map(status => (
                        <option key={status.value} value={status.value}>{status.label}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    URL Immagine Copertina
                  </label>
                  <input
                    type="url"
                    name="thumbnailUrl"
                    value={formData.thumbnailUrl}
                    onChange={handleInputChange}
                    placeholder="https://example.com/thumbnail.jpg"
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Prezzo (€)
                    </label>
                    <input
                      type="number"
                      name="price"
                      value={formData.price}
                      onChange={handleInputChange}
                      min="0"
                      step="0.01"
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Max Studenti
                    </label>
                    <input
                      type="number"
                      name="maxStudents"
                      value={formData.maxStudents}
                      onChange={handleInputChange}
                      min="1"
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Lingua
                    </label>
                    <select
                      name="language"
                      value={formData.language}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    >
                      <option value="it">Italiano</option>
                      <option value="en">English</option>
                      <option value="es">Español</option>
                      <option value="fr">Français</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Tags (separati da virgola)
                  </label>
                  <input
                    type="text"
                    name="tags"
                    value={formData.tags}
                    onChange={handleInputChange}
                    placeholder="motivazione, sport, mente"
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  />
                </div>

                <div className="flex items-center">
                  <input
                    type="checkbox"
                    name="isPremium"
                    checked={formData.isPremium}
                    onChange={handleInputChange}
                    className="mr-2"
                  />
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center">
                    <Crown className="h-4 w-4 text-yellow-500 mr-1" />
                    Solo Premium
                  </label>
                </div>

                {/* Lessons Section */}
                <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
                  <h4 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
                    Lezioni del Corso
                  </h4>
                  
                  {/* Add New Lesson */}
                  <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg mb-4">
                    <h5 className="text-sm font-medium text-gray-900 dark:text-white mb-3">
                      Aggiungi Nuova Lezione
                    </h5>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
                      <input
                        type="text"
                        name="title"
                        value={currentLesson.title}
                        onChange={handleLessonChange}
                        placeholder="Titolo lezione"
                        className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm"
                      />
                      <input
                        type="url"
                        name="videoUrl"
                        value={currentLesson.videoUrl}
                        onChange={handleLessonChange}
                        placeholder="URL video (YouTube, Vimeo, etc.)"
                        className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm"
                      />
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
                      <input
                        type="number"
                        name="duration"
                        value={currentLesson.duration}
                        onChange={handleLessonChange}
                        placeholder="Durata (minuti)"
                        min="1"
                        className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm"
                      />
                      <input
                        type="number"
                        name="order"
                        value={currentLesson.order}
                        onChange={handleLessonChange}
                        placeholder="Ordine"
                        min="1"
                        className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm"
                      />
                    </div>
                    <textarea
                      name="description"
                      value={currentLesson.description}
                      onChange={handleLessonChange}
                      placeholder="Descrizione lezione"
                      rows={2}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm mb-3"
                    />
                    <button
                      type="button"
                      onClick={addLesson}
                      className="flex items-center space-x-2 bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded text-sm transition-colors"
                    >
                      <Plus className="h-3 w-3" />
                      <span>Aggiungi Lezione</span>
                    </button>
                  </div>

                  {/* Lessons List */}
                  {formData.lessons.length > 0 && (
                    <div className="space-y-2">
                      <h5 className="text-sm font-medium text-gray-900 dark:text-white">
                        Lezioni Aggiunte ({formData.lessons.length})
                      </h5>
                      {formData.lessons.map((lesson, index) => (
                        <div key={lesson.id} className="flex items-center justify-between bg-white dark:bg-gray-800 p-3 rounded border border-gray-200 dark:border-gray-600">
                          <div className="flex-1">
                            <div className="flex items-center space-x-2">
                              <span className="text-sm font-medium text-gray-900 dark:text-white">
                                {index + 1}. {lesson.title}
                              </span>
                              {lesson.duration && (
                                <span className="text-xs text-gray-500 dark:text-gray-400">
                                  ({lesson.duration}m)
                                </span>
                              )}
                            </div>
                            {lesson.description && (
                              <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                                {lesson.description}
                              </p>
                            )}
                          </div>
                          <button
                            type="button"
                            onClick={() => removeLesson(lesson.id)}
                            className="text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 ml-2"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="flex justify-end space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={resetForm}
                    className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                  >
                    Annulla
                  </button>
                  <button
                    type="submit"
                    className="flex items-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors"
                  >
                    <Save className="h-4 w-4" />
                    <span>{editingCourse ? 'Aggiorna' : 'Salva'}</span>
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Courses List */}
      <div className="space-y-4">
        {filteredCourses.length === 0 ? (
          <div className="text-center py-8">
            <GraduationCap className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
              Nessun corso trovato
            </h3>
            <p className="text-gray-600 dark:text-gray-400">
              {searchTerm || filterCategory !== 'all' 
                ? 'Prova a modificare i filtri di ricerca.' 
                : 'Inizia aggiungendo il tuo primo corso.'
              }
            </p>
          </div>
        ) : (
          filteredCourses.map((course) => (
            <div key={course.id} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
              <div className="flex items-start justify-between">
                <div className="flex space-x-4 flex-1">
                  {course.thumbnailUrl && (
                    <img
                      src={course.thumbnailUrl}
                      alt={course.title}
                      className="w-20 h-16 object-cover rounded"
                    />
                  )}
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-1">
                      <h3 className="font-semibold text-gray-900 dark:text-white">
                        {course.title}
                      </h3>
                      {course.isPremium && (
                        <Crown className="h-4 w-4 text-yellow-500" />
                      )}
                      <span className={`px-2 py-1 rounded text-xs font-medium ${
                        course.status === 'published' 
                          ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300'
                          : course.status === 'draft'
                          ? 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300'
                          : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
                      }`}>
                        {statuses.find(s => s.value === course.status)?.label || course.status}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                      Istruttore: {course.instructor}
                    </p>
                    {course.description && (
                      <p className="text-sm text-gray-600 dark:text-gray-400 mb-2 line-clamp-2">
                        {course.description}
                      </p>
                    )}
                    <div className="flex flex-wrap items-center gap-2 text-xs">
                      {course.category && (
                        <span className="bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 px-2 py-1 rounded">
                          {course.category}
                        </span>
                      )}
                      {course.difficulty && (
                        <span className="bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-300 px-2 py-1 rounded">
                          {difficulties.find(d => d.value === course.difficulty)?.label}
                        </span>
                      )}
                      {course.totalLessons > 0 && (
                        <span className="bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 px-2 py-1 rounded flex items-center">
                          <BookOpen className="h-3 w-3 mr-1" />
                          {course.totalLessons} lezioni
                        </span>
                      )}
                      {course.totalDuration > 0 && (
                        <span className="bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 px-2 py-1 rounded flex items-center">
                          <Clock className="h-3 w-3 mr-1" />
                          {formatDuration(course.totalDuration)}
                        </span>
                      )}
                      {course.price && (
                        <span className="bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300 px-2 py-1 rounded">
                          €{course.price}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex items-center space-x-2 ml-4">
                  <button
                    onClick={() => setExpandedCourse(expandedCourse === course.id ? null : course.id)}
                    className="p-2 text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                    title="Visualizza lezioni"
                  >
                    {expandedCourse === course.id ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                  </button>
                  <button
                    onClick={() => handleEdit(course)}
                    className="p-2 text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                    title="Modifica"
                  >
                    <Edit className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(course.id)}
                    className="p-2 text-gray-600 dark:text-gray-400 hover:text-red-600 dark:hover:text-red-400 transition-colors"
                    title="Elimina"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>

              {/* Expanded Lessons */}
              {expandedCourse === course.id && course.lessons && course.lessons.length > 0 && (
                <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                  <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-3">
                    Lezioni del Corso ({course.lessons.length})
                  </h4>
                  <div className="space-y-2">
                    {course.lessons.map((lesson, index) => (
                      <div key={lesson.id || index} className="bg-gray-50 dark:bg-gray-700 p-3 rounded">
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <div className="flex items-center space-x-2">
                              <span className="text-sm font-medium text-gray-900 dark:text-white">
                                {index + 1}. {lesson.title}
                              </span>
                              {lesson.duration && (
                                <span className="text-xs text-gray-500 dark:text-gray-400 flex items-center">
                                  <Clock className="h-3 w-3 mr-1" />
                                  {lesson.duration}m
                                </span>
                              )}
                            </div>
                            {lesson.description && (
                              <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                                {lesson.description}
                              </p>
                            )}
                          </div>
                          {lesson.videoUrl && (
                            <a
                              href={lesson.videoUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 ml-2"
                              title="Apri video"
                            >
                              <Play className="h-4 w-4" />
                            </a>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default CourseManager;