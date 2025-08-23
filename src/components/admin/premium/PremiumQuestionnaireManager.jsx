import React, { useState, useEffect } from 'react';
import { 
  collection, 
  query, 
  getDocs,
  doc,
  setDoc,
  deleteDoc
} from 'firebase/firestore';
import { db } from '../../../config/firebase';
import { 
  FileText, 
  Plus, 
  Edit3, 
  Trash2, 
  Save,
  Eye,
  ArrowUp,
  ArrowDown,
  Type,
  AlignLeft,
  List,
  Crown,
  Target,
  Brain,
  Trophy,
  Sparkles,
  CheckCircle,
  Clock,
  User,
  Calendar,
  Timer,
  Award,
  Heart,
  Shield,
  TrendingUp,
  DollarSign
} from 'lucide-react';

const AVAILABLE_ICONS = {
  Crown, Target, Brain, Trophy, Sparkles, CheckCircle, Clock,
  User, Calendar, Timer, Award, Heart, Shield, TrendingUp, DollarSign,
  FileText, Type, AlignLeft, List
};

const PremiumQuestionnaireManager = () => {
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingQuestion, setEditingQuestion] = useState(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [previewMode, setPreviewMode] = useState(false);

  const defaultQuestion = {
    id: '',
    title: '',
    question: '',
    type: 'text',
    options: [],
    placeholder: '',
    icon: 'Target',
    required: true,
    order: 0
  };

  const [formData, setFormData] = useState(defaultQuestion);

  useEffect(() => {
    fetchQuestions();
  }, []);

  const fetchQuestions = async () => {
    try {
      setLoading(true);
      const questionsQuery = query(collection(db, 'premiumQuestions'));
      const snapshot = await getDocs(questionsQuery);
      
      if (snapshot.docs.length === 0) {
        // Se non ci sono domande, crea quelle di default
        await createDefaultQuestions();
        return;
      }
      
      const questionsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })).sort((a, b) => (a.order || 0) - (b.order || 0));
      
      setQuestions(questionsData);
    } catch (error) {
      console.error('Error fetching questions:', error);
    } finally {
      setLoading(false);
    }
  };

  const createDefaultQuestions = async () => {
    const defaultQuestions = [
      {
        id: 'sport',
        title: 'Il Tuo Sport',
        question: 'Qual è il tuo sport principale?',
        type: 'text',
        placeholder: 'es. Calcio, Tennis, Nuoto, Pallavolo...',
        icon: 'Trophy',
        required: true,
        order: 1
      },
      {
        id: 'level',
        title: 'Livello Attuale',
        question: 'A che livello pratichi il tuo sport?',
        type: 'select',
        options: [
          'Amatoriale - Mi diverto e basta',
          'Semi-professionista - Gareggio regolarmente',
          'Professionista - È il mio lavoro',
          'Giovanile/Academy - Sto crescendo',
          'Master/Veterano - Esperienza e passione'
        ],
        icon: 'Award',
        required: true,
        order: 2
      },
      {
        id: 'goals',
        title: 'I Tuoi Obiettivi',
        question: 'Quali sono i tuoi obiettivi principali per i prossimi 6 mesi?',
        type: 'textarea',
        placeholder: 'Descrivi cosa vorresti raggiungere o migliorare...',
        icon: 'Target',
        required: true,
        order: 3
      },
      {
        id: 'budget',
        title: 'Investimento per la Crescita',
        question: 'Quanto sei disposto/a a investire mensilmente per un percorso professionale di mental training?',
        type: 'select',
        options: [
          'Sotto i 50€/mese',
          '50-100€/mese',
          '100-200€/mese', 
          '200-500€/mese',
          'Oltre 500€/mese',
          'Preferirei un pagamento unico'
        ],
        icon: 'DollarSign',
        required: true,
        order: 4
      }
    ];

    try {
      for (const question of defaultQuestions) {
        await setDoc(doc(db, 'premiumQuestions', question.id), question);
      }
      await fetchQuestions();
    } catch (error) {
      console.error('Error creating default questions:', error);
    }
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleOptionsChange = (index, value) => {
    const newOptions = [...formData.options];
    newOptions[index] = value;
    setFormData(prev => ({ ...prev, options: newOptions }));
  };

  const addOption = () => {
    setFormData(prev => ({
      ...prev,
      options: [...prev.options, '']
    }));
  };

  const removeOption = (index) => {
    const newOptions = formData.options.filter((_, i) => i !== index);
    setFormData(prev => ({ ...prev, options: newOptions }));
  };

  const saveQuestion = async () => {
    if (!formData.title || !formData.question) {
      alert('Inserisci almeno titolo e domanda!');
      return;
    }

    if (formData.type === 'select' && formData.options.length === 0) {
      alert('Aggiungi almeno una opzione per le domande a scelta multipla!');
      return;
    }

    try {
      const questionId = formData.id || `question_${Date.now()}`;
      const questionData = {
        ...formData,
        id: questionId,
        order: formData.order || questions.length + 1
      };

      await setDoc(doc(db, 'premiumQuestions', questionId), questionData);
      
      setFormData(defaultQuestion);
      setShowAddForm(false);
      setEditingQuestion(null);
      await fetchQuestions();
      
      alert('Domanda salvata con successo!');
    } catch (error) {
      console.error('Error saving question:', error);
      alert('Errore nel salvataggio della domanda');
    }
  };

  const editQuestion = (question) => {
    setFormData(question);
    setEditingQuestion(question.id);
    setShowAddForm(true);
  };

  const deleteQuestion = async (questionId) => {
    if (!confirm('Eliminare questa domanda?')) return;
    
    try {
      await deleteDoc(doc(db, 'premiumQuestions', questionId));
      await fetchQuestions();
      alert('Domanda eliminata!');
    } catch (error) {
      console.error('Error deleting question:', error);
      alert('Errore nell\'eliminazione');
    }
  };

  const moveQuestion = async (questionId, direction) => {
    const currentIndex = questions.findIndex(q => q.id === questionId);
    if (
      (direction === 'up' && currentIndex === 0) ||
      (direction === 'down' && currentIndex === questions.length - 1)
    ) {
      return;
    }

    const newQuestions = [...questions];
    const targetIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;
    
    // Scambia posizioni
    [newQuestions[currentIndex], newQuestions[targetIndex]] = 
    [newQuestions[targetIndex], newQuestions[currentIndex]];
    
    // Aggiorna ordini
    for (let i = 0; i < newQuestions.length; i++) {
      newQuestions[i].order = i + 1;
      await setDoc(doc(db, 'premiumQuestions', newQuestions[i].id), newQuestions[i]);
    }
    
    await fetchQuestions();
  };

  const getIcon = (iconName) => {
    const IconComponent = AVAILABLE_ICONS[iconName] || Target;
    return <IconComponent className="h-5 w-5" />;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 flex items-center space-x-2">
            <FileText className="h-8 w-8 text-purple-600" />
            <span>Questionario Premium</span>
          </h2>
          <p className="text-gray-600 mt-1">
            Gestisci le domande del questionario Premium per la candidatura
          </p>
        </div>
        
        <div className="flex space-x-3">
          <button
            onClick={() => setPreviewMode(!previewMode)}
            className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors"
          >
            <Eye className="h-4 w-4" />
            <span>{previewMode ? 'Modifica' : 'Anteprima'}</span>
          </button>
          
          {!previewMode && (
            <button
              onClick={() => {
                setFormData(defaultQuestion);
                setEditingQuestion(null);
                setShowAddForm(true);
              }}
              className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors"
            >
              <Plus className="h-4 w-4" />
              <span>Nuova Domanda</span>
            </button>
          )}
        </div>
      </div>

      {previewMode ? (
        // Modalità Anteprima
        <div className="bg-white rounded-xl shadow-lg p-6">
          <h3 className="text-xl font-bold mb-6 text-center">Anteprima Questionario</h3>
          <div className="space-y-6">
            {questions.map((question, index) => (
              <div key={question.id} className="border rounded-lg p-4">
                <div className="flex items-center space-x-3 mb-3">
                  {getIcon(question.icon)}
                  <h4 className="font-semibold text-lg">{question.title}</h4>
                  <span className="text-sm text-gray-500">#{index + 1}</span>
                </div>
                
                <p className="text-gray-700 mb-4">{question.question}</p>
                
                {question.type === 'text' && (
                  <input
                    type="text"
                    placeholder={question.placeholder}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    disabled
                  />
                )}
                
                {question.type === 'textarea' && (
                  <textarea
                    placeholder={question.placeholder}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md resize-none"
                    disabled
                  />
                )}
                
                {question.type === 'select' && (
                  <select className="w-full px-3 py-2 border border-gray-300 rounded-md" disabled>
                    <option>Seleziona una opzione...</option>
                    {question.options?.map((option, i) => (
                      <option key={i} value={option}>{option}</option>
                    ))}
                  </select>
                )}
              </div>
            ))}
          </div>
        </div>
      ) : (
        // Modalità Gestione
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Lista Domande */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-xl shadow-lg overflow-hidden">
              <div className="px-6 py-4 bg-gray-50 border-b">
                <h3 className="font-semibold text-gray-900">
                  Domande Attuali ({questions.length})
                </h3>
              </div>
              
              <div className="divide-y divide-gray-200">
                {questions.map((question, index) => (
                  <div key={question.id} className="p-4 hover:bg-gray-50">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-2">
                          {getIcon(question.icon)}
                          <span className="font-medium text-gray-900">{question.title}</span>
                          <span className="text-xs bg-gray-200 px-2 py-1 rounded">
                            {question.type}
                          </span>
                          {question.required && (
                            <span className="text-xs bg-red-100 text-red-700 px-2 py-1 rounded">
                              Obbligatorio
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-gray-600 mb-2">{question.question}</p>
                        {question.options && question.options.length > 0 && (
                          <div className="text-xs text-gray-500">
                            Opzioni: {question.options.slice(0, 2).join(', ')}
                            {question.options.length > 2 && '...'}
                          </div>
                        )}
                      </div>
                      
                      <div className="flex items-center space-x-1 ml-4">
                        <button
                          onClick={() => moveQuestion(question.id, 'up')}
                          disabled={index === 0}
                          className="p-1 text-gray-400 hover:text-gray-600 disabled:opacity-50"
                        >
                          <ArrowUp className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => moveQuestion(question.id, 'down')}
                          disabled={index === questions.length - 1}
                          className="p-1 text-gray-400 hover:text-gray-600 disabled:opacity-50"
                        >
                          <ArrowDown className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => editQuestion(question)}
                          className="p-1 text-blue-600 hover:text-blue-800"
                        >
                          <Edit3 className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => deleteQuestion(question.id)}
                          className="p-1 text-red-600 hover:text-red-800"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
          
          {/* Form Modifica/Aggiungi */}
          {showAddForm && (
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h3 className="font-semibold text-gray-900 mb-4">
                {editingQuestion ? 'Modifica Domanda' : 'Nuova Domanda'}
              </h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Titolo
                  </label>
                  <input
                    type="text"
                    name="title"
                    value={formData.title}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                    placeholder="es. Il Tuo Sport"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Domanda
                  </label>
                  <textarea
                    name="question"
                    value={formData.question}
                    onChange={handleInputChange}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 resize-none"
                    placeholder="Scrivi la domanda..."
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Tipo
                  </label>
                  <select
                    name="type"
                    value={formData.type}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                  >
                    <option value="text">Testo</option>
                    <option value="textarea">Area Testo</option>
                    <option value="select">Scelta Multipla</option>
                  </select>
                </div>
                
                {formData.type !== 'select' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Placeholder
                    </label>
                    <input
                      type="text"
                      name="placeholder"
                      value={formData.placeholder}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                      placeholder="Testo di esempio..."
                    />
                  </div>
                )}
                
                {formData.type === 'select' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Opzioni
                    </label>
                    <div className="space-y-2">
                      {formData.options.map((option, index) => (
                        <div key={index} className="flex space-x-2">
                          <input
                            type="text"
                            value={option}
                            onChange={(e) => handleOptionsChange(index, e.target.value)}
                            className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                            placeholder={`Opzione ${index + 1}`}
                          />
                          <button
                            onClick={() => removeOption(index)}
                            className="px-3 py-2 text-red-600 hover:text-red-800"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      ))}
                      <button
                        onClick={addOption}
                        className="w-full px-3 py-2 border-2 border-dashed border-gray-300 rounded-md text-gray-500 hover:border-purple-500 hover:text-purple-600 transition-colors"
                      >
                        + Aggiungi Opzione
                      </button>
                    </div>
                  </div>
                )}
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Icona
                  </label>
                  <select
                    name="icon"
                    value={formData.icon}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                  >
                    {Object.keys(AVAILABLE_ICONS).map(iconName => (
                      <option key={iconName} value={iconName}>{iconName}</option>
                    ))}
                  </select>
                </div>
                
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    name="required"
                    checked={formData.required}
                    onChange={handleInputChange}
                    className="h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-300 rounded mr-2"
                  />
                  <label className="text-sm text-gray-700">
                    Domanda obbligatoria
                  </label>
                </div>
                
                <div className="flex space-x-3 pt-4">
                  <button
                    onClick={saveQuestion}
                    className="flex-1 bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg flex items-center justify-center space-x-2 transition-colors"
                  >
                    <Save className="h-4 w-4" />
                    <span>Salva</span>
                  </button>
                  <button
                    onClick={() => {
                      setShowAddForm(false);
                      setEditingQuestion(null);
                      setFormData(defaultQuestion);
                    }}
                    className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    Annulla
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default PremiumQuestionnaireManager;