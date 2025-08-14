import React, { useState, useEffect } from 'react';
import { 
  collection, 
  query, 
  getDocs, 
  orderBy, 
  addDoc, 
  updateDoc,
  deleteDoc,
  doc
} from 'firebase/firestore';
import { db } from '../../../config/firebase';
import { 
  ClipboardList, 
  Plus, 
  Search, 
  Filter, 
  Edit3, 
  Trash2, 
  Copy,
  Eye,
  X,
  Save,
  FileText,
  HelpCircle,
  ToggleLeft,
  ToggleRight,
  ChevronUp,
  ChevronDown,
  Star,
  Calendar
} from 'lucide-react';

const QuestionnaireTemplatesManager = () => {
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [showModal, setShowModal] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState(null);
  const [formData, setFormData] = useState({});
  const [saveLoading, setSaveLoading] = useState(false);

  const categories = [
    'Valutazione Iniziale',
    'Controllo Progressi',
    'Post Gara',
    'Pre Gara',
    'Motivazione',
    'Stress',
    'Concentrazione',
    'Fiducia',
    'Ansia',
    'Altro'
  ];

  const questionTypes = [
    { value: 'text', label: 'Testo Libero' },
    { value: 'textarea', label: 'Testo Lungo' },
    { value: 'radio', label: 'Scelta Singola' },
    { value: 'checkbox', label: 'Scelta Multipla' },
    { value: 'select', label: 'Menu a Tendina' },
    { value: 'scale', label: 'Scala Numerica' },
    { value: 'rating', label: 'Valutazione Stelle' },
    { value: 'date', label: 'Data' },
    { value: 'email', label: 'Email' },
    { value: 'number', label: 'Numero' }
  ];

  useEffect(() => {
    fetchTemplates();
  }, []);

  const fetchTemplates = async () => {
    try {
      setLoading(true);
      const templatesQuery = query(
        collection(db, 'questionnaireTemplates'),
        orderBy('createdAt', 'desc')
      );
      
      const snapshot = await getDocs(templatesQuery);
      const templatesData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate(),
        updatedAt: doc.data().updatedAt?.toDate()
      }));
      
      setTemplates(templatesData);
    } catch (error) {
      console.error('Error fetching questionnaire templates:', error);
      // Fallback query without orderBy
      try {
        const fallbackQuery = query(collection(db, 'questionnaireTemplates'));
        const snapshot = await getDocs(fallbackQuery);
        const templatesData = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          createdAt: doc.data().createdAt?.toDate(),
          updatedAt: doc.data().updatedAt?.toDate()
        }));
        setTemplates(templatesData.sort((a, b) => (b.createdAt || new Date()) - (a.createdAt || new Date())));
      } catch (fallbackError) {
        console.error('Fallback query failed:', fallbackError);
        setTemplates([]);
      }
    } finally {
      setLoading(false);
    }
  };

  const filteredTemplates = templates.filter(template => {
    const matchesSearch = 
      template.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      template.description?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesCategory = categoryFilter === 'all' || template.category === categoryFilter;
    
    return matchesSearch && matchesCategory;
  });

  const handleCreate = () => {
    setEditingTemplate(null);
    setFormData({
      title: '',
      description: '',
      category: categories[0],
      isActive: true,
      questions: [],
      estimatedTime: 5,
      instructions: '',
      tags: []
    });
    setShowModal(true);
  };

  const handleEdit = (template) => {
    setEditingTemplate(template);
    setFormData({
      ...template,
      questions: template.questions || [],
      tags: template.tags || []
    });
    setShowModal(true);
  };

  const handleSave = async () => {
    try {
      setSaveLoading(true);
      const templateData = {
        ...formData,
        updatedAt: new Date()
      };

      if (editingTemplate) {
        await updateDoc(doc(db, 'questionnaireTemplates', editingTemplate.id), templateData);
      } else {
        await addDoc(collection(db, 'questionnaireTemplates'), {
          ...templateData,
          createdAt: new Date()
        });
      }

      await fetchTemplates();
      setShowModal(false);
      setEditingTemplate(null);
      setFormData({});
    } catch (error) {
      console.error('Error saving questionnaire template:', error);
      alert('Errore nel salvataggio');
    } finally {
      setSaveLoading(false);
    }
  };

  const handleDelete = async (template) => {
    if (!window.confirm(`Sei sicuro di voler eliminare il template "${template.title}"?`)) return;
    
    try {
      await deleteDoc(doc(db, 'questionnaireTemplates', template.id));
      await fetchTemplates();
    } catch (error) {
      console.error('Error deleting questionnaire template:', error);
      alert('Errore nell\'eliminazione');
    }
  };

  const handleDuplicate = async (template) => {
    try {
      const duplicatedTemplate = {
        ...template,
        title: `${template.title} (Copia)`,
        createdAt: new Date()
      };
      delete duplicatedTemplate.id;
      delete duplicatedTemplate.updatedAt;
      
      await addDoc(collection(db, 'questionnaireTemplates'), duplicatedTemplate);
      await fetchTemplates();
    } catch (error) {
      console.error('Error duplicating template:', error);
      alert('Errore nella duplicazione');
    }
  };

  const addQuestion = () => {
    const newQuestion = {
      id: Date.now().toString(),
      type: 'text',
      question: '',
      required: false,
      options: [],
      validation: {}
    };
    
    setFormData(prev => ({
      ...prev,
      questions: [...prev.questions, newQuestion]
    }));
  };

  const updateQuestion = (questionId, updates) => {
    setFormData(prev => ({
      ...prev,
      questions: prev.questions.map(q => 
        q.id === questionId ? { ...q, ...updates } : q
      )
    }));
  };

  const removeQuestion = (questionId) => {
    setFormData(prev => ({
      ...prev,
      questions: prev.questions.filter(q => q.id !== questionId)
    }));
  };

  const moveQuestion = (questionId, direction) => {
    setFormData(prev => {
      const questions = [...prev.questions];
      const index = questions.findIndex(q => q.id === questionId);
      
      if (direction === 'up' && index > 0) {
        [questions[index], questions[index - 1]] = [questions[index - 1], questions[index]];
      } else if (direction === 'down' && index < questions.length - 1) {
        [questions[index], questions[index + 1]] = [questions[index + 1], questions[index]];
      }
      
      return { ...prev, questions };
    });
  };

  if (loading) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <div className="flex items-center space-x-3 mb-6">
          <ClipboardList className="h-6 w-6 text-indigo-600 dark:text-indigo-400" />
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            Template Questionari
          </h2>
        </div>
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="text-gray-500 dark:text-gray-400 mt-4">Caricamento template...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between mb-6">
        <div className="flex items-center space-x-3 mb-4 lg:mb-0">
          <ClipboardList className="h-6 w-6 text-indigo-600 dark:text-indigo-400" />
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            Template Questionari ({filteredTemplates.length})
          </h2>
        </div>
        
        <button
          onClick={handleCreate}
          className="flex items-center space-x-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
        >
          <Plus className="h-4 w-4" />
          <span>Nuovo Template</span>
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="Cerca per titolo o descrizione..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent w-full"
          />
        </div>
        
        <div className="relative">
          <Filter className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="pl-10 pr-8 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent appearance-none cursor-pointer min-w-48"
          >
            <option value="all">Tutte le categorie</option>
            {categories.map(category => (
              <option key={category} value={category}>
                {category}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Templates Grid */}
      {filteredTemplates.length === 0 ? (
        <div className="text-center py-12">
          <ClipboardList className="h-16 w-16 mx-auto mb-4 text-gray-400" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
            Nessun template trovato
          </h3>
          <p className="text-gray-500 dark:text-gray-400 mb-4">
            {searchTerm || categoryFilter !== 'all' 
              ? 'Prova a modificare i filtri di ricerca'
              : 'Non ci sono ancora template di questionari'
            }
          </p>
          {!searchTerm && categoryFilter === 'all' && (
            <button
              onClick={handleCreate}
              className="inline-flex items-center space-x-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
            >
              <Plus className="h-4 w-4" />
              <span>Crea il primo template</span>
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
          {filteredTemplates.map(template => (
            <div key={template.id} className="bg-gray-50 dark:bg-gray-700 rounded-lg p-6 hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center space-x-2 mb-2">
                    <FileText className="h-5 w-5 text-indigo-600" />
                    <span className="text-xs font-medium text-indigo-600 bg-indigo-100 px-2 py-1 rounded">
                      {template.category}
                    </span>
                    {template.isActive ? (
                      <ToggleRight className="h-4 w-4 text-green-600" />
                    ) : (
                      <ToggleLeft className="h-4 w-4 text-gray-400" />
                    )}
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2 line-clamp-2">
                    {template.title}
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-300 mb-3 line-clamp-2">
                    {template.description}
                  </p>
                </div>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-2 gap-4 mb-4 text-sm text-gray-500 dark:text-gray-400">
                <div className="flex items-center">
                  <HelpCircle className="h-4 w-4 mr-1" />
                  <span>{template.questions?.length || 0} domande</span>
                </div>
                <div className="flex items-center">
                  <Calendar className="h-4 w-4 mr-1" />
                  <span>~{template.estimatedTime || 5} min</span>
                </div>
              </div>

              {/* Tags */}
              {template.tags && template.tags.length > 0 && (
                <div className="flex flex-wrap gap-1 mb-4">
                  {template.tags.slice(0, 3).map(tag => (
                    <span key={tag} className="px-2 py-1 bg-indigo-100 text-indigo-700 text-xs rounded">
                      {tag}
                    </span>
                  ))}
                  {template.tags.length > 3 && (
                    <span className="text-xs text-gray-500">+{template.tags.length - 3}</span>
                  )}
                </div>
              )}

              {/* Actions */}
              <div className="flex space-x-2">
                <button
                  onClick={() => handleEdit(template)}
                  className="flex-1 flex items-center justify-center space-x-1 px-3 py-2 text-indigo-600 hover:text-indigo-800 hover:bg-indigo-100 rounded transition-colors"
                >
                  <Edit3 className="h-4 w-4" />
                  <span className="text-sm">Modifica</span>
                </button>
                <button
                  onClick={() => handleDuplicate(template)}
                  className="flex items-center justify-center px-3 py-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded transition-colors"
                >
                  <Copy className="h-4 w-4" />
                </button>
                <button
                  onClick={() => handleDelete(template)}
                  className="flex items-center justify-center px-3 py-2 text-red-600 hover:text-red-800 hover:bg-red-100 rounded transition-colors"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-8 mx-auto p-5 border w-11/12 max-w-6xl shadow-lg rounded-md bg-white dark:bg-gray-800">
            <div className="mt-3">
              {/* Modal Header */}
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                  {editingTemplate ? 'Modifica Template Questionario' : 'Nuovo Template Questionario'}
                </h3>
                <button
                  onClick={() => setShowModal(false)}
                  className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>

              {/* Form */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                {/* Basic Info */}
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Titolo Template *
                    </label>
                    <input
                      type="text"
                      value={formData.title || ''}
                      onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Descrizione *
                    </label>
                    <textarea
                      value={formData.description || ''}
                      onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Categoria
                    </label>
                    <select
                      value={formData.category || categories[0]}
                      onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    >
                      {categories.map(category => (
                        <option key={category} value={category}>{category}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Tempo Stimato (minuti)
                    </label>
                    <input
                      type="number"
                      min="1"
                      max="60"
                      value={formData.estimatedTime || 5}
                      onChange={(e) => setFormData(prev => ({ ...prev, estimatedTime: parseInt(e.target.value) || 5 }))}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        checked={formData.isActive || false}
                        onChange={(e) => setFormData(prev => ({ ...prev, isActive: e.target.checked }))}
                        className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                      />
                      <span className="text-sm text-gray-700 dark:text-gray-300">Template attivo</span>
                    </label>
                  </div>
                </div>

                {/* Instructions */}
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Istruzioni per l'utente
                    </label>
                    <textarea
                      value={formData.instructions || ''}
                      onChange={(e) => setFormData(prev => ({ ...prev, instructions: e.target.value }))}
                      rows={5}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                      placeholder="Inserisci le istruzioni che verranno mostrate all'utente prima di iniziare il questionario..."
                    />
                  </div>
                </div>
              </div>

              {/* Questions */}
              <div className="mb-6">
                <div className="flex items-center justify-between mb-4">
                  <h4 className="text-lg font-medium text-gray-900 dark:text-white">
                    Domande ({formData.questions?.length || 0})
                  </h4>
                  <button
                    onClick={addQuestion}
                    className="flex items-center space-x-2 px-3 py-1 bg-indigo-600 text-white text-sm rounded-lg hover:bg-indigo-700"
                  >
                    <Plus className="h-4 w-4" />
                    <span>Aggiungi Domanda</span>
                  </button>
                </div>

                <div className="space-y-4 max-h-96 overflow-y-auto">
                  {formData.questions?.map((question, index) => (
                    <div key={question.id} className="border border-gray-200 dark:border-gray-600 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-sm font-medium text-gray-600 dark:text-gray-300">
                          Domanda {index + 1}
                        </span>
                        <div className="flex space-x-2">
                          <button
                            onClick={() => moveQuestion(question.id, 'up')}
                            disabled={index === 0}
                            className="p-1 text-gray-400 hover:text-gray-600 disabled:opacity-30"
                          >
                            <ChevronUp className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => moveQuestion(question.id, 'down')}
                            disabled={index === formData.questions.length - 1}
                            className="p-1 text-gray-400 hover:text-gray-600 disabled:opacity-30"
                          >
                            <ChevronDown className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => removeQuestion(question.id)}
                            className="p-1 text-red-500 hover:text-red-700"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
                        <div>
                          <label className="block text-sm text-gray-600 dark:text-gray-300 mb-1">Domanda</label>
                          <textarea
                            value={question.question}
                            onChange={(e) => updateQuestion(question.id, { question: e.target.value })}
                            rows={2}
                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-1 focus:ring-indigo-500 text-sm"
                            placeholder="Inserisci la domanda..."
                          />
                        </div>

                        <div>
                          <label className="block text-sm text-gray-600 dark:text-gray-300 mb-1">Tipo</label>
                          <select
                            value={question.type}
                            onChange={(e) => updateQuestion(question.id, { type: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-1 focus:ring-indigo-500 text-sm"
                          >
                            {questionTypes.map(type => (
                              <option key={type.value} value={type.value}>{type.label}</option>
                            ))}
                          </select>
                        </div>
                      </div>

                      <div className="flex items-center space-x-4 mt-3">
                        <label className="flex items-center space-x-2">
                          <input
                            type="checkbox"
                            checked={question.required || false}
                            onChange={(e) => updateQuestion(question.id, { required: e.target.checked })}
                            className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                          />
                          <span className="text-sm text-gray-600 dark:text-gray-300">Obbligatoria</span>
                        </label>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Actions */}
              <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200 dark:border-gray-700">
                <button
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                >
                  Annulla
                </button>
                <button
                  onClick={handleSave}
                  disabled={saveLoading || !formData.title || !formData.description}
                  className="flex items-center space-x-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <Save className="h-4 w-4" />
                  <span>{saveLoading ? 'Salvataggio...' : 'Salva'}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default QuestionnaireTemplatesManager;