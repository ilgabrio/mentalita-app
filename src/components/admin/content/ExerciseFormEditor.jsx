import React, { useState, useEffect } from 'react';
import { doc, updateDoc, collection, getDocs, query, orderBy } from 'firebase/firestore';
import { db } from '../../../config/firebase';
import { 
  Plus, 
  Trash2, 
  Save, 
  X, 
  ArrowUp, 
  ArrowDown,
  Eye,
  Play,
  Edit3,
  Type,
  List,
  CheckSquare,
  MessageSquare,
  Music
} from 'lucide-react';

const ExerciseFormEditor = ({ exercise, onClose, onSave }) => {
  const [elements, setElements] = useState([]);
  const [saving, setSaving] = useState(false);
  const [previewMode, setPreviewMode] = useState(false);
  const [previewAnswers, setPreviewAnswers] = useState({});
  const [availableAudios, setAvailableAudios] = useState([]);

  useEffect(() => {
    if (exercise) {
      // Gestisce sia gli esercizi con elementi che quelli senza
      const exerciseElements = exercise.elements || [];
      setElements([...exerciseElements]);
      
      // Inizializza risposte per preview
      const initialAnswers = {};
      exerciseElements.forEach(element => {
        if (element.id) {
          initialAnswers[element.id] = '';
        }
      });
      setPreviewAnswers(initialAnswers);
    }
    
    // Carica gli audio disponibili
    fetchAvailableAudios();
  }, [exercise]);

  const fetchAvailableAudios = async () => {
    try {
      const audiosQuery = query(
        collection(db, 'audioContent'),
        orderBy('title', 'asc')
      );
      const snapshot = await getDocs(audiosQuery);
      const audiosData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setAvailableAudios(audiosData);
    } catch (error) {
      console.error('Error loading audios:', error);
      // Fallback without orderBy
      try {
        const snapshot = await getDocs(collection(db, 'audioContent'));
        const audiosData = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        setAvailableAudios(audiosData);
      } catch (fallbackError) {
        console.error('Fallback audio loading failed:', fallbackError);
      }
    }
  };

  const generateElementId = () => {
    return `element_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  };

  const addElement = (type) => {
    const newElement = {
      id: generateElementId(),
      type,
      title: `Nuova ${type === 'text' ? 'domanda' : type === 'select' ? 'selezione' : type === 'radio' ? 'scelta multipla' : type === 'audio' ? 'traccia audio' : 'area di testo'}`,
      description: '',
      options: type === 'select' || type === 'radio' ? ['Opzione 1', 'Opzione 2'] : [],
      audioId: type === 'audio' ? '' : undefined
    };
    setElements([...elements, newElement]);
  };

  const updateElement = (index, field, value) => {
    const newElements = [...elements];
    newElements[index] = {
      ...newElements[index],
      [field]: value
    };
    setElements(newElements);
  };

  const removeElement = (index) => {
    const newElements = elements.filter((_, i) => i !== index);
    setElements(newElements);
  };

  const moveElement = (index, direction) => {
    const newElements = [...elements];
    const newIndex = direction === 'up' ? index - 1 : index + 1;
    
    if (newIndex >= 0 && newIndex < newElements.length) {
      [newElements[index], newElements[newIndex]] = [newElements[newIndex], newElements[index]];
      setElements(newElements);
    }
  };

  const updateOption = (elementIndex, optionIndex, value) => {
    const newElements = [...elements];
    const newOptions = [...newElements[elementIndex].options];
    newOptions[optionIndex] = value;
    newElements[elementIndex].options = newOptions;
    setElements(newElements);
  };

  const addOption = (elementIndex) => {
    const newElements = [...elements];
    newElements[elementIndex].options.push(`Opzione ${newElements[elementIndex].options.length + 1}`);
    setElements(newElements);
  };

  const removeOption = (elementIndex, optionIndex) => {
    const newElements = [...elements];
    newElements[elementIndex].options = newElements[elementIndex].options.filter((_, i) => i !== optionIndex);
    setElements(newElements);
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      
      // Aggiorna l'esercizio in Firestore
      const exerciseRef = doc(db, 'exercises', exercise.id);
      await updateDoc(exerciseRef, {
        elements: elements,
        updatedAt: new Date()
      });

      console.log('✅ Elementi salvati:', elements);
      onSave && onSave({ ...exercise, elements });
      onClose();
    } catch (error) {
      console.error('❌ Errore nel salvataggio:', error);
      alert('Errore nel salvataggio degli elementi');
    } finally {
      setSaving(false);
    }
  };

  const handlePreviewAnswerChange = (elementId, value) => {
    setPreviewAnswers(prev => ({
      ...prev,
      [elementId]: value
    }));
  };

  const renderElementEditor = (element, index) => {
    return (
      <div key={element.id} className="border border-gray-200 dark:border-gray-600 rounded-lg p-4 mb-4">
        {/* Header elemento */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded">
              #{index + 1}
            </span>
            <span className="text-sm font-medium text-blue-600 dark:text-blue-400 bg-blue-100 dark:bg-blue-900/20 px-2 py-1 rounded">
              {element.type}
            </span>
          </div>
          
          <div className="flex items-center gap-1">
            <button
              onClick={() => moveElement(index, 'up')}
              disabled={index === 0}
              className="p-1 text-gray-400 hover:text-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ArrowUp className="h-4 w-4" />
            </button>
            <button
              onClick={() => moveElement(index, 'down')}
              disabled={index === elements.length - 1}
              className="p-1 text-gray-400 hover:text-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ArrowDown className="h-4 w-4" />
            </button>
            <button
              onClick={() => removeElement(index)}
              className="p-1 text-red-400 hover:text-red-600"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Campi elemento */}
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Titolo/Domanda
            </label>
            <input
              type="text"
              value={element.title || ''}
              onChange={(e) => updateElement(index, 'title', e.target.value)}
              className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
              placeholder="Inserisci la domanda..."
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Descrizione (opzionale)
            </label>
            <textarea
              value={element.description || ''}
              onChange={(e) => updateElement(index, 'description', e.target.value)}
              className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white resize-none"
              rows={2}
              placeholder="Aggiungi una descrizione o istruzioni..."
            />
          </div>

          {/* Opzioni per select e radio */}
          {(element.type === 'select' || element.type === 'radio') && (
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Opzioni
              </label>
              <div className="space-y-2">
                {element.options?.map((option, optionIndex) => (
                  <div key={optionIndex} className="flex items-center gap-2">
                    <input
                      type="text"
                      value={option}
                      onChange={(e) => updateOption(index, optionIndex, e.target.value)}
                      className="flex-1 p-2 border border-gray-300 dark:border-gray-600 rounded dark:bg-gray-700 dark:text-white"
                      placeholder={`Opzione ${optionIndex + 1}`}
                    />
                    <button
                      onClick={() => removeOption(index, optionIndex)}
                      className="p-2 text-red-400 hover:text-red-600"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                ))}
                <button
                  onClick={() => addOption(index)}
                  className="flex items-center gap-2 px-3 py-2 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded"
                >
                  <Plus className="h-4 w-4" />
                  Aggiungi opzione
                </button>
              </div>
            </div>
          )}

          {/* Selezione audio per elementi audio */}
          {element.type === 'audio' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Seleziona Audio
              </label>
              <select
                value={element.audioId || ''}
                onChange={(e) => updateElement(index, 'audioId', e.target.value)}
                className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
              >
                <option value="">Seleziona un audio...</option>
                {availableAudios.map((audio) => (
                  <option key={audio.id} value={audio.id}>
                    {audio.title} {audio.duration && `(${audio.duration})`}
                  </option>
                ))}
              </select>
              {availableAudios.length === 0 && (
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
                  Nessun audio disponibile. Crea prima alcuni audio nella sezione Audio.
                </p>
              )}
            </div>
          )}
        </div>
      </div>
    );
  };

  const renderElementPreview = (element, index) => {
    const value = previewAnswers[element.id] || '';

    switch (element.type) {
      case 'text':
        return (
          <div key={element.id} className="mb-6">
            <label className="block text-lg font-semibold text-gray-900 dark:text-white mb-3">
              {element.title || `Domanda ${index + 1}`}
            </label>
            {element.description && (
              <p className="text-gray-600 dark:text-gray-300 mb-4 text-sm">
                {element.description}
              </p>
            )}
            <textarea
              value={value}
              onChange={(e) => handlePreviewAnswerChange(element.id, e.target.value)}
              placeholder="Scrivi la tua risposta qui..."
              className="w-full p-4 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white resize-none"
              rows={4}
            />
          </div>
        );

      case 'textarea':
        return (
          <div key={element.id} className="mb-6">
            <label className="block text-lg font-semibold text-gray-900 dark:text-white mb-3">
              {element.title || `Domanda ${index + 1}`}
            </label>
            {element.description && (
              <p className="text-gray-600 dark:text-gray-300 mb-4 text-sm">
                {element.description}
              </p>
            )}
            <textarea
              value={value}
              onChange={(e) => handlePreviewAnswerChange(element.id, e.target.value)}
              placeholder="Scrivi la tua risposta qui..."
              className="w-full p-4 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white resize-none"
              rows={6}
            />
          </div>
        );

      case 'select':
        return (
          <div key={element.id} className="mb-6">
            <label className="block text-lg font-semibold text-gray-900 dark:text-white mb-3">
              {element.title || `Domanda ${index + 1}`}
            </label>
            {element.description && (
              <p className="text-gray-600 dark:text-gray-300 mb-4 text-sm">
                {element.description}
              </p>
            )}
            <select
              value={value}
              onChange={(e) => handlePreviewAnswerChange(element.id, e.target.value)}
              className="w-full p-4 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
            >
              <option value="">Seleziona una risposta...</option>
              {element.options?.map((option, optIndex) => (
                <option key={optIndex} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </div>
        );

      case 'radio':
        return (
          <div key={element.id} className="mb-6">
            <label className="block text-lg font-semibold text-gray-900 dark:text-white mb-3">
              {element.title || `Domanda ${index + 1}`}
            </label>
            {element.description && (
              <p className="text-gray-600 dark:text-gray-300 mb-4 text-sm">
                {element.description}
              </p>
            )}
            <div className="space-y-3">
              {element.options?.map((option, optIndex) => (
                <label key={optIndex} className="flex items-center cursor-pointer">
                  <input
                    type="radio"
                    name={element.id}
                    value={option}
                    checked={value === option}
                    onChange={(e) => handlePreviewAnswerChange(element.id, e.target.value)}
                    className="mr-3 text-blue-500 focus:ring-blue-500"
                  />
                  <span className="text-gray-700 dark:text-gray-300">{option}</span>
                </label>
              ))}
            </div>
          </div>
        );

      case 'audio':
        const selectedAudio = availableAudios.find(audio => audio.id === element.audioId);
        return (
          <div key={element.id} className="mb-6">
            <label className="block text-lg font-semibold text-gray-900 dark:text-white mb-3">
              {element.title || `Audio ${index + 1}`}
            </label>
            {element.description && (
              <p className="text-gray-600 dark:text-gray-300 mb-4 text-sm">
                {element.description}
              </p>
            )}
            {selectedAudio ? (
              <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                <div className="flex items-center gap-3 mb-3">
                  <Music className="h-6 w-6 text-blue-500" />
                  <div>
                    <h4 className="font-medium text-gray-900 dark:text-white">{selectedAudio.title}</h4>
                    {selectedAudio.duration && (
                      <p className="text-sm text-gray-500 dark:text-gray-400">Durata: {selectedAudio.duration}</p>
                    )}
                  </div>
                </div>
                {selectedAudio.audioUrl ? (
                  <audio controls className="w-full">
                    <source src={selectedAudio.audioUrl} type="audio/mpeg" />
                    Il tuo browser non supporta l'elemento audio.
                  </audio>
                ) : (
                  <div className="text-center py-4 text-gray-500 dark:text-gray-400">
                    <Music className="h-8 w-8 mx-auto mb-2" />
                    <p>URL audio non disponibile</p>
                  </div>
                )}
              </div>
            ) : (
              <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 text-center">
                <Music className="h-8 w-8 mx-auto mb-2 text-gray-400" />
                <p className="text-gray-500 dark:text-gray-400">Nessun audio selezionato</p>
              </div>
            )}
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg w-full max-w-6xl max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-600">
          <div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">
              Editor Elementi Form
            </h2>
            <p className="text-gray-600 dark:text-gray-400 text-sm">
              {exercise?.title}
            </p>
          </div>
          
          <div className="flex items-center gap-2">
            <button
              onClick={() => setPreviewMode(!previewMode)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                previewMode 
                  ? 'bg-green-500 text-white' 
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
              }`}
            >
              {previewMode ? <Edit3 className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              {previewMode ? 'Modifica' : 'Preview'}
            </button>
            
            <button
              onClick={handleSave}
              disabled={saving}
              className="flex items-center gap-2 px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg disabled:opacity-50"
            >
              <Save className="h-4 w-4" />
              {saving ? 'Salvataggio...' : 'Salva'}
            </button>
            
            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="overflow-y-auto max-h-[calc(90vh-80px)]">
          {previewMode ? (
            /* Preview Mode */
            <div className="p-6">
              <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg mb-6">
                <div className="flex items-center gap-2 mb-2">
                  <Play className="h-5 w-5 text-blue-500" />
                  <h3 className="font-semibold text-blue-900 dark:text-blue-100">
                    Modalità Preview
                  </h3>
                </div>
                <p className="text-blue-700 dark:text-blue-300 text-sm">
                  Questa è l'anteprima di come l'esercizio apparirà agli utenti. Puoi interagire con i campi per testare la funzionalità.
                </p>
              </div>
              
              {elements.length > 0 ? (
                <div className="space-y-6">
                  {elements.map((element, index) => renderElementPreview(element, index))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <MessageSquare className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500 dark:text-gray-400">
                    Nessun elemento nel form. Aggiungi alcuni elementi per vederli in preview.
                  </p>
                </div>
              )}
            </div>
          ) : (
            /* Edit Mode */
            <div className="p-6">
              {/* Toolbar aggiungi elementi */}
              <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg mb-6">
                <h3 className="font-semibold text-gray-900 dark:text-white mb-3">
                  Aggiungi Elemento
                </h3>
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={() => addElement('text')}
                    className="flex items-center gap-2 px-3 py-2 bg-blue-100 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 rounded-lg hover:bg-blue-200 dark:hover:bg-blue-900/30"
                  >
                    <Type className="h-4 w-4" />
                    Campo Testo
                  </button>
                  <button
                    onClick={() => addElement('textarea')}
                    className="flex items-center gap-2 px-3 py-2 bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-300 rounded-lg hover:bg-green-200 dark:hover:bg-green-900/30"
                  >
                    <MessageSquare className="h-4 w-4" />
                    Area Testo
                  </button>
                  <button
                    onClick={() => addElement('select')}
                    className="flex items-center gap-2 px-3 py-2 bg-purple-100 dark:bg-purple-900/20 text-purple-700 dark:text-purple-300 rounded-lg hover:bg-purple-200 dark:hover:bg-purple-900/30"
                  >
                    <List className="h-4 w-4" />
                    Menu Selezione
                  </button>
                  <button
                    onClick={() => addElement('radio')}
                    className="flex items-center gap-2 px-3 py-2 bg-orange-100 dark:bg-orange-900/20 text-orange-700 dark:text-orange-300 rounded-lg hover:bg-orange-200 dark:hover:bg-orange-900/30"
                  >
                    <CheckSquare className="h-4 w-4" />
                    Scelta Multipla
                  </button>
                  <button
                    onClick={() => addElement('audio')}
                    className="flex items-center gap-2 px-3 py-2 bg-red-100 dark:bg-red-900/20 text-red-700 dark:text-red-300 rounded-lg hover:bg-red-200 dark:hover:bg-red-900/30"
                  >
                    <Music className="h-4 w-4" />
                    Audio Player
                  </button>
                </div>
              </div>

              {/* Lista elementi */}
              {elements.length > 0 ? (
                <div className="space-y-4">
                  {elements.map((element, index) => renderElementEditor(element, index))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <MessageSquare className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                    Nessun elemento nel form
                  </h3>
                  <p className="text-gray-500 dark:text-gray-400 mb-6">
                    Inizia aggiungendo il primo elemento usando i pulsanti sopra.
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ExerciseFormEditor;