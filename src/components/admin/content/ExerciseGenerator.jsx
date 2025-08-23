import React, { useState } from 'react';
import { 
  addDoc, 
  collection,
  serverTimestamp 
} from 'firebase/firestore';
import { db } from '../../../config/firebase';
import { 
  Wand2, 
  Eye, 
  Save, 
  FileText,
  AlertCircle,
  CheckCircle,
  Copy,
  Sparkles
} from 'lucide-react';

const ExerciseGenerator = () => {
  const [coachingText, setCoachingText] = useState('');
  const [parsedExercise, setParsedExercise] = useState(null);
  const [showPreview, setShowPreview] = useState(false);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState([]);

  // Parser per la sintassi coaching
  const parseCoachingText = (text) => {
    try {
      const lines = text.trim().split('\n').filter(line => line.trim());
      
      if (lines.length < 2) {
        throw new Error('Il testo deve contenere almeno un titolo e una descrizione');
      }

      // Estrai titolo (prima riga)
      const title = lines[0].trim();
      
      // Estrai sottotitolo/descrizione (seconda riga)
      const description = lines[1].trim();
      
      // Parse delle sezioni
      const sections = [];
      let currentSection = null;
      let sectionContent = [];
      
      for (let i = 2; i < lines.length; i++) {
        const line = lines[i].trim();
        
        // Identifica inizio di nuova sezione con **TESTO**:
        if (line.match(/^\*\*.*\*\*:/)) {
          // Salva sezione precedente se esiste
          if (currentSection) {
            sections.push({
              ...currentSection,
              content: sectionContent.join(' ').trim()
            });
          }
          
          // Inizia nuova sezione
          currentSection = {
            title: line.replace(/^\*\*/, '').replace(/\*\*:.*$/, '').trim(),
            questions: []
          };
          sectionContent = [line.replace(/^\*\*.*\*\*:\s*/, '')];
        } else if (currentSection) {
          // Identifica domande con [tipo]
          const questionMatch = line.match(/^(.+?)\s+\[(\w+)\]$/);
          if (questionMatch) {
            const questionText = questionMatch[1].trim();
            const fieldType = questionMatch[2].toLowerCase();
            
            const question = {
              id: `q_${sections.length}_${currentSection.questions.length}`,
              question: questionText,
              type: fieldType,
              required: true
            };
            
            // Gestisci opzioni per scale e multiple
            if (fieldType === 'scala' || fieldType === 'multipla') {
              question.options = [];
              // Le opzioni verranno aggiunte nelle righe successive
            }
            
            currentSection.questions.push(question);
          } 
          // Identifica opzioni (righe che iniziano con - o numeri)
          else if (line.match(/^-\s+(.+)$/) || line.match(/^\d+:\s+(.+)$/)) {
            const optionText = line.replace(/^[-\d]+[:.]?\s*/, '').trim();
            
            if (currentSection.questions.length > 0) {
              const lastQuestion = currentSection.questions[currentSection.questions.length - 1];
              if (lastQuestion.type === 'scala' || lastQuestion.type === 'multipla') {
                if (!lastQuestion.options) lastQuestion.options = [];
                lastQuestion.options.push(optionText);
              }
            }
          } else {
            // Aggiungi alla descrizione della sezione
            sectionContent.push(line);
          }
        }
      }
      
      // Aggiungi ultima sezione
      if (currentSection) {
        sections.push({
          ...currentSection,
          content: sectionContent.join(' ').trim()
        });
      }
      
      return {
        title,
        description,
        sections,
        category: 'coaching',
        type: 'multi-section',
        isPublished: false,
        order: Date.now()
      };
      
    } catch (error) {
      console.error('Errore parsing:', error);
      throw error;
    }
  };

  const handleGenerate = () => {
    setLoading(true);
    setErrors([]);
    
    try {
      if (!coachingText.trim()) {
        throw new Error('Inserisci il testo dell\'esercizio di coaching');
      }
      
      const parsed = parseCoachingText(coachingText);
      setParsedExercise(parsed);
      setShowPreview(true);
      
    } catch (error) {
      setErrors([error.message]);
      setParsedExercise(null);
      setShowPreview(false);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!parsedExercise) return;
    
    try {
      setSaving(true);
      
      await addDoc(collection(db, 'exercises'), {
        ...parsedExercise,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        generatedFrom: 'coaching-text',
        originalText: coachingText
      });
      
      alert('✅ Esercizio generato e salvato con successo!');
      
      // Reset form
      setCoachingText('');
      setParsedExercise(null);
      setShowPreview(false);
      
    } catch (error) {
      console.error('Errore salvataggio:', error);
      alert('❌ Errore nel salvataggio dell\'esercizio');
    } finally {
      setSaving(false);
    }
  };

  const getFieldTypeIcon = (type) => {
    switch (type) {
      case 'testo': return '📝';
      case 'area': case 'textarea': return '📄';
      case 'scala': return '📊';
      case 'multipla': return '🔘';
      default: return '❓';
    }
  };

  const exampleText = `Il Ritmo della Settimana del Portiere
Trasforma la paura in alleata seguendo il ritmo naturale della settimana sportiva

**PRIMI GIORNI (lunedì-martedì)**: Prima di ogni allenamento, prenditi 30 secondi per dire "Sono felice per quello che ho costruito" e nomina una cosa concreta che hai guadagnato.

Cosa ti ha reso felice oggi dei tuoi progressi? [testo]

**GIORNI CENTRALI (mercoledì-giovedì)**: Durante l'allenamento, quando senti la paura, trasformala in cura: "Faccio questo esercizio perfetto per non perdere quello che ho."

Come hai trasformato la paura in cura oggi? [area]

**GIORNO PRIMA DELLA PARTITA**: Ripetiti "Lotto con forza per quello che voglio" e visualizza te stesso che pari bene e giochi bene con i piedi.

Quanto hai sentito la paura come alleata invece che come nemica oggi? [scala]
- 1: Per nulla
- 2: Poco
- 3: Abbastanza
- 4: Molto
- 5: Completamente

Qual è stata la sensazione più forte oggi: "devo dimostrare" o "sono già forte"? [multipla]
- Devo dimostrare
- Sono già forte
- Un mix equilibrato
- Non ho fatto caso

Note aggiuntive sulla giornata: [textarea]`;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <div className="flex items-center mb-4">
          <Wand2 className="h-8 w-8 text-purple-600 mr-3" />
          <div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
              Generatore Esercizi da Coaching
            </h2>
            <p className="text-gray-600 dark:text-gray-300">
              Scrivi il testo dell'esercizio in linguaggio naturale e lascia che l'AI lo trasformi automaticamente
            </p>
          </div>
        </div>

        {/* Sintassi Guide */}
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 mb-6">
          <h3 className="font-semibold text-blue-800 dark:text-blue-200 mb-2 flex items-center">
            <Sparkles className="h-4 w-4 mr-2" />
            Sintassi supportata:
          </h3>
          <div className="text-sm text-blue-700 dark:text-blue-300 space-y-1">
            <div><code className="bg-blue-100 dark:bg-blue-800 px-2 py-1 rounded">**SEZIONE**:</code> per creare una nuova sezione</div>
            <div><code className="bg-blue-100 dark:bg-blue-800 px-2 py-1 rounded">[testo]</code> per campo di input</div>
            <div><code className="bg-blue-100 dark:bg-blue-800 px-2 py-1 rounded">[area]</code> per textarea</div>
            <div><code className="bg-blue-100 dark:bg-blue-800 px-2 py-1 rounded">[scala]</code> per rating con opzioni</div>
            <div><code className="bg-blue-100 dark:bg-blue-800 px-2 py-1 rounded">[multipla]</code> per scelta multipla</div>
            <div><code className="bg-blue-100 dark:bg-blue-800 px-2 py-1 rounded">- Opzione</code> per aggiungere opzioni</div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Editor */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Testo Coaching
            </h3>
            <button
              onClick={() => setCoachingText(exampleText)}
              className="flex items-center space-x-2 px-3 py-1 text-sm bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded hover:bg-gray-200 dark:hover:bg-gray-600"
            >
              <Copy className="h-4 w-4" />
              <span>Usa Esempio</span>
            </button>
          </div>

          <textarea
            value={coachingText}
            onChange={(e) => setCoachingText(e.target.value)}
            placeholder="Scrivi qui il testo dell'esercizio di coaching..."
            className="w-full h-96 px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none font-mono text-sm"
          />

          <div className="flex justify-between items-center mt-4">
            <span className="text-sm text-gray-500">
              {coachingText.length} caratteri
            </span>
            <button
              onClick={handleGenerate}
              disabled={loading || !coachingText.trim()}
              className="flex items-center space-x-2 px-6 py-3 bg-purple-600 text-white rounded-lg font-medium hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  <span>Generando...</span>
                </>
              ) : (
                <>
                  <Wand2 className="h-4 w-4" />
                  <span>Genera Esercizio</span>
                </>
              )}
            </button>
          </div>

          {/* Errors */}
          {errors.length > 0 && (
            <div className="mt-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
              <div className="flex items-center">
                <AlertCircle className="h-5 w-5 text-red-400 mr-2" />
                <h4 className="text-sm font-medium text-red-800 dark:text-red-200">
                  Errori rilevati:
                </h4>
              </div>
              <ul className="text-sm text-red-700 dark:text-red-300 mt-2 list-disc list-inside">
                {errors.map((error, index) => (
                  <li key={index}>{error}</li>
                ))}
              </ul>
            </div>
          )}
        </div>

        {/* Preview */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center">
              <Eye className="h-5 w-5 mr-2" />
              Anteprima Esercizio
            </h3>
            {parsedExercise && (
              <button
                onClick={handleSave}
                disabled={saving}
                className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 disabled:opacity-50 transition-colors"
              >
                {saving ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    <span>Salvando...</span>
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4" />
                    <span>Salva Esercizio</span>
                  </>
                )}
              </button>
            )}
          </div>

          {!showPreview ? (
            <div className="text-center py-12 text-gray-500">
              <FileText className="h-16 w-16 mx-auto mb-4 opacity-50" />
              <p>L'anteprima dell'esercizio apparirà qui dopo la generazione</p>
            </div>
          ) : parsedExercise ? (
            <div className="space-y-6">
              {/* Exercise Header */}
              <div className="border-b border-gray-200 dark:border-gray-700 pb-4">
                <h4 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                  {parsedExercise.title}
                </h4>
                <p className="text-gray-600 dark:text-gray-300">
                  {parsedExercise.description}
                </p>
                <div className="flex items-center space-x-4 mt-3 text-sm text-gray-500">
                  <span>📊 {parsedExercise.sections?.length || 0} sezioni</span>
                  <span>❓ {parsedExercise.sections?.reduce((total, section) => total + (section.questions?.length || 0), 0) || 0} domande</span>
                  <span>🏷️ {parsedExercise.category}</span>
                </div>
              </div>

              {/* Exercise Sections */}
              <div className="space-y-6">
                {parsedExercise.sections?.map((section, sIndex) => (
                  <div key={sIndex} className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4">
                    <h5 className="font-semibold text-gray-900 dark:text-white mb-2">
                      {section.title}
                    </h5>
                    <p className="text-sm text-gray-600 dark:text-gray-300 mb-4">
                      {section.content}
                    </p>
                    
                    {section.questions?.map((question, qIndex) => (
                      <div key={question.id} className="bg-white dark:bg-gray-800 rounded-lg p-4 mb-3">
                        <div className="flex items-start space-x-3">
                          <span className="text-lg">{getFieldTypeIcon(question.type)}</span>
                          <div className="flex-1">
                            <p className="font-medium text-gray-900 dark:text-white mb-2">
                              {question.question}
                            </p>
                            <div className="text-xs text-gray-500 mb-2">
                              Tipo: <code className="bg-gray-200 dark:bg-gray-600 px-1 rounded">{question.type}</code>
                              {question.required && <span className="ml-2 text-red-500">*</span>}
                            </div>
                            
                            {question.options && question.options.length > 0 && (
                              <div className="mt-2">
                                <p className="text-xs text-gray-500 mb-1">Opzioni:</p>
                                <ul className="text-sm space-y-1">
                                  {question.options.map((option, oIndex) => (
                                    <li key={oIndex} className="flex items-center space-x-2">
                                      <span className="w-2 h-2 bg-gray-400 rounded-full"></span>
                                      <span>{option}</span>
                                    </li>
                                  ))}
                                </ul>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ))}
              </div>

              <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
                <div className="flex items-center">
                  <CheckCircle className="h-5 w-5 text-green-400 mr-2" />
                  <span className="text-sm font-medium text-green-800 dark:text-green-200">
                    Esercizio generato con successo! Clicca "Salva Esercizio" per aggiungerlo al database.
                  </span>
                </div>
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
};

export default ExerciseGenerator;