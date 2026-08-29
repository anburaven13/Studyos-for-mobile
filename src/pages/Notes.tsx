import React, { useState, useEffect } from 'react';
import Markdown from 'react-markdown';
import { Sparkles, Loader2, Check, Trash } from 'lucide-react';
import { simulateAiResponse, generateFlashcards, extractTextFromDocument } from '../lib/aiService';
import { cn } from '../lib/utils';
import { useAuth } from '../lib/AuthContext';

type Note = { id: string; title: string; content: string; folder?: string; tags?: any; };

export default function Notes() {
  const [notesList, setNotesList] = useState<Note[]>([{ id: 'new', title: '', content: '' }]);
  const [activeNoteId, setActiveNoteId] = useState<string>('new');
  const [isEditing, setIsEditing] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [aiPanelOpen, setAiPanelOpen] = useState(false);
  const [summary, setSummary] = useState('');
  const [flashcards, setFlashcards] = useState<{front: string, back: string}[]>([]);
  const [saveStatus, setSaveStatus] = useState<'Saved' | 'Saving...'>('Saved');
  
  // Quiz State
  const [quizActive, setQuizActive] = useState(false);
  const [quizQuestions, setQuizQuestions] = useState<any[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [quizScore, setQuizScore] = useState<{correct: number, total: number} | null>(null);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [showExplanation, setShowExplanation] = useState(false);

  const { user } = useAuth();
  const userContext = user?.class_level && user?.board ? `${user.class_level} - ${user.board}` : undefined;

  const activeNote = notesList.find(n => n.id.toString() === activeNoteId.toString()) || notesList[0];
  const skipAutosaveRef = React.useRef(false);

  // Fetch notes on mount
  useEffect(() => {
    const fetchNotes = async () => {
      const token = localStorage.getItem('token');
      if (!token) return;
      try {
        const res = await fetch('/api/notes', { headers: { 'Authorization': `Bearer ${token}` } });
        if (res.ok) {
          const data = await res.json();
          if (data.length > 0) {
            setNotesList(data);
            setActiveNoteId(data[0].id.toString());
          } else {
            createNewNote();
          }
        }
      } catch (e) {
        console.error(e);
      }
    };
    fetchNotes();
  }, []);

  // Track latest note for unmount saving
  const latestNoteRef = React.useRef(activeNote);
  useEffect(() => {
    latestNoteRef.current = activeNote;
  }, [activeNote]);

  // Flush save on unmount
  useEffect(() => {
    return () => {
      const note = latestNoteRef.current;
      const token = localStorage.getItem('token');
      if (note && note.id && note.id.toString() !== 'new' && note.id.toString() !== 'temp' && token) {
        fetch(`/api/notes/${note.id}`, {
          method: 'PUT',
          headers: { 
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}` 
          },
          body: JSON.stringify({ title: note.title, content: note.content, folder: note.folder || 'General', tags: note.tags }),
          keepalive: true
        }).catch(() => {});
      }
    };
  }, []);

  // Autosave to API
  useEffect(() => {
    if (!activeNote || !activeNote.id) return;
    // Skip autosave for placeholder notes
    if (activeNote.id.toString() === 'new' || activeNote.id.toString() === 'temp') return;
    // Skip autosave immediately after creating a new note
    if (skipAutosaveRef.current) {
      skipAutosaveRef.current = false;
      return;
    }
    
    const token = localStorage.getItem('token');
    if (!token) return;

    setSaveStatus('Saving...');
    const timer = setTimeout(async () => {
      try {
        const res = await fetch(`/api/notes/${activeNote.id}`, {
          method: 'PUT',
          headers: { 
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}` 
          },
          body: JSON.stringify({ title: activeNote.title, content: activeNote.content, folder: activeNote.folder || 'General', tags: activeNote.tags })
        });
        if (res.ok) setSaveStatus('Saved');
        else setSaveStatus('Saved');
      } catch (e) {
        setSaveStatus('Saved');
      }
    }, 1000);
    return () => clearTimeout(timer);
  }, [activeNote?.content, activeNote?.title, activeNote?.folder, activeNote?.tags]);

  const updateActiveNoteContent = (newContent: string) => {
    setNotesList(prev => prev.map(n => n.id.toString() === activeNoteId.toString() ? { ...n, content: newContent } : n));
  };

  async function createNewNote() {
    const token = localStorage.getItem('token');
    if (!token) return;
    try {
      const res = await fetch('/api/notes', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}` 
        },
        body: JSON.stringify({ title: 'Untitled Note', content: '' })
      });
      if (res.ok) {
        const newNote = await res.json();
        skipAutosaveRef.current = true;
        setNotesList(prev => {
          // Remove initial placeholder if present
          const cleaned = prev.filter(n => n.id.toString() !== 'new' && n.id.toString() !== 'temp');
          return [newNote, ...cleaned];
        });
        setActiveNoteId(newNote.id.toString());
        setIsEditing(true);
        setSummary('');
        setFlashcards([]);
        setQuizActive(false);
      }
    } catch (e) {
      console.error(e);
    }
  }

  const deleteNote = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const token = localStorage.getItem('token');
    if (!token) return;
    try {
      await fetch(`/api/notes/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const updatedNotes = notesList.filter(n => n.id.toString() !== id.toString());
      if (updatedNotes.length > 0) {
        setNotesList(updatedNotes);
        if (activeNoteId.toString() === id.toString()) {
          setActiveNoteId(updatedNotes[0].id.toString());
        }
      } else {
        // Re-initialize with a new blank note if empty
        const blankNote = { id: 'temp', title: '', content: '' };
        setNotesList([blankNote]);
        setActiveNoteId('temp');
        createNewNote();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleGenerateSummary = async () => {
    setIsGenerating(true);
    setFlashcards([]);
    const result = await simulateAiResponse(`Summarize this: ${activeNote.content}`, undefined, userContext);
    setSummary(result);
    setIsGenerating(false);
  };

  const handleGenerateFlashcards = async () => {
    setIsGenerating(true);
    setSummary('');
    setQuizActive(false);
    const result = await generateFlashcards(activeNote.content, userContext);
    setFlashcards(result);
    setIsGenerating(false);
  };

  const handleGenerateQuiz = async () => {
    setIsGenerating(true);
    setSummary('');
    setFlashcards([]);
    
    const token = localStorage.getItem('token');
    if (!token) return;
    
    try {
      const res = await fetch('/api/ai/quiz', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ content: activeNote.content, userContext })
      });
      if (res.ok) {
        const data = await res.json();
        if (data && data.length > 0) {
          setQuizQuestions(data);
          setCurrentQuestionIndex(0);
          setQuizScore(null);
          setSelectedAnswer(null);
          setShowExplanation(false);
          setQuizActive(true);
        }
      }
    } catch (e) {
      console.error(e);
    }
    setIsGenerating(false);
  };

  const handleCompileDNA = async () => {
    setIsGenerating(true);
    setSummary('');
    setFlashcards([]);
    
    const token = localStorage.getItem('token');
    if (!token) return;
    
    try {
      const res = await fetch('/api/dna/compile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ content: activeNote.content, source_id: activeNote.id })
      });
      if (res.ok) {
        setSummary('🧬 Knowledge DNA successfully extracted and compiled into your Genome.');
      } else {
        setSummary('Failed to compile DNA.');
      }
    } catch (e) {
      console.error(e);
      setSummary('Failed to compile DNA.');
    }
    setIsGenerating(false);
  };

  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const handlePdfUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setSummary('Extracting text from document...');
      const extracted = await extractTextFromDocument(file);
      const extractedText = `\n\n--- Imported from ${file.name} ---\n\n${extracted}\n\n`;
      updateActiveNoteContent(activeNote.content + extractedText);
      setSummary('Document text successfully extracted and appended to your note.');
    } catch (err) {
      console.error(err);
      setSummary('Failed to process document.');
    }
    
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleAnswerSubmit = (answer: string) => {
    setSelectedAnswer(answer);
    setShowExplanation(true);
    
    if (answer === quizQuestions[currentQuestionIndex].correctAnswer) {
      setQuizScore(prev => prev ? { ...prev, correct: prev.correct + 1 } : { correct: 1, total: quizQuestions.length });
    } else {
      setQuizScore(prev => prev ? prev : { correct: 0, total: quizQuestions.length });
    }
  };

  const nextQuestion = () => {
    if (currentQuestionIndex < quizQuestions.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
      setSelectedAnswer(null);
      setShowExplanation(false);
    }
  };

  // Group notes by folder
  const groupedNotes = notesList.reduce((acc: any, note) => {
    const folder = note.folder || 'General';
    if (!acc[folder]) acc[folder] = [];
    acc[folder].push(note);
    return acc;
  }, {});

  return (
    <div className="p-3 md:p-8 max-w-6xl mx-auto w-full h-[calc(100vh-4rem)] flex flex-col">
      <div className="mb-3 md:mb-6 flex flex-row items-center justify-between gap-2 flex-shrink-0">
        <div className="min-w-0">
          <h1 className="text-xl md:text-3xl font-semibold tracking-tight">AI Notes</h1>
          <div className="flex items-center space-x-2 mt-0.5">
            <div className="flex items-center text-xs text-muted-foreground">
              {saveStatus === 'Saving...' ? <Loader2 className="w-3 h-3 mr-1 animate-spin" /> : <Check className="w-3 h-3 mr-1" />}
              {saveStatus}
            </div>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <button 
            onClick={() => setIsEditing(!isEditing)}
            className="border bg-background text-foreground px-3 py-1.5 rounded-md font-medium text-xs md:text-sm hover:bg-muted transition-colors"
          >
            {isEditing ? 'Preview' : 'Edit'}
          </button>
          
          <input 
            type="file"
            accept="application/pdf"
            className="hidden"
            ref={fileInputRef}
            onChange={handlePdfUpload}
          />
          <button 
            onClick={() => fileInputRef.current?.click()}
            className="border bg-background text-foreground px-3 py-1.5 rounded-md font-medium text-xs md:text-sm hover:bg-muted transition-colors hidden md:flex items-center gap-2"
          >
            Import PDF
          </button>

          <button 
            onClick={createNewNote}
            className="bg-primary text-primary-foreground px-3 py-1.5 rounded-md font-medium text-xs md:text-sm hover:opacity-90 transition-opacity"
          >
            + New
          </button>
        </div>
      </div>

      <div className="border rounded-2xl shadow-sm flex flex-col md:flex-row flex-1 min-h-0 overflow-hidden bg-card">
        {/* Sidebar - horizontal chips on mobile, vertical list on desktop */}
        <div className="w-full md:w-56 border-b md:border-b-0 md:border-r bg-muted/20 flex-shrink-0">
          {/* Mobile: horizontal scrolling chips */}
          <div className="md:hidden flex items-center gap-2 px-3 py-2 overflow-x-auto no-scrollbar">
            {notesList.map((note: Note) => (
              <button 
                key={note.id}
                onClick={() => {
                  setActiveNoteId(note.id.toString());
                  setSummary('');
                  setFlashcards([]);
                  setQuizActive(false);
                }}
                className={cn(
                  "flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-medium transition-colors whitespace-nowrap",
                  note.id.toString() === activeNoteId.toString() ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
                )}
              >
                {note.title || 'Untitled'}
              </button>
            ))}
          </div>
          {/* Desktop: vertical list */}
          <div className="hidden md:block overflow-y-auto h-full">
            {Object.keys(groupedNotes).map(folder => (
              <div key={folder} className="mb-3">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5 px-4 mt-3">{folder}</p>
                <div className="space-y-0.5 px-3">
                  {groupedNotes[folder].map((note: Note) => (
                    <button 
                      key={note.id}
                      onClick={() => {
                        setActiveNoteId(note.id.toString());
                        setSummary('');
                        setFlashcards([]);
                        setQuizActive(false);
                      }}
                      className={cn(
                        "w-full text-left px-3 py-1.5 rounded-lg text-sm font-medium transition-colors flex items-center justify-between group",
                        note.id.toString() === activeNoteId.toString() ? 'bg-primary/10 text-primary' : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                      )}
                    >
                      <span className="truncate pr-2">{note.title || 'Untitled Note'}</span>
                      <Trash 
                        className={cn(
                          "w-3 h-3 flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity hover:text-destructive",
                          note.id.toString() === activeNoteId.toString() && "opacity-100"
                        )} 
                        onClick={(e) => deleteNote(note.id.toString(), e)}
                      />
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Editor / Preview */}
        <div className="flex-1 flex flex-col lg:flex-row relative min-h-0 overflow-hidden divide-y lg:divide-y-0 lg:divide-x">
          <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
            {quizActive ? (
              <div className="w-full h-full p-8 overflow-y-auto flex flex-col items-center justify-center">
                <div className="max-w-2xl w-full bg-card border rounded-2xl shadow-sm p-8">
                  {quizScore && currentQuestionIndex === quizQuestions.length - 1 && showExplanation ? (
                    <div className="text-center py-12">
                      <h2 className="text-3xl font-bold mb-4">Quiz Complete!</h2>
                      <p className="text-xl text-muted-foreground mb-8">You scored {quizScore.correct} out of {quizScore.total}</p>
                      <button onClick={() => setQuizActive(false)} className="bg-primary text-primary-foreground px-6 py-3 rounded-lg font-medium hover:opacity-90 transition-opacity">
                        Back to Notes
                      </button>
                    </div>
                  ) : (
                    <>
                      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
                        <span className="text-sm font-semibold text-muted-foreground tracking-widest uppercase">Question {currentQuestionIndex + 1} of {quizQuestions.length}</span>
                        <button onClick={() => setQuizActive(false)} className="text-sm text-muted-foreground hover:text-foreground underline">Exit Quiz</button>
                      </div>
                      <h2 className="text-xl font-medium mb-8 leading-relaxed">{quizQuestions[currentQuestionIndex]?.question}</h2>
                      <div className="space-y-3">
                        {quizQuestions[currentQuestionIndex]?.options.map((opt: string, i: number) => {
                          const isSelected = selectedAnswer === opt;
                          const isCorrect = opt === quizQuestions[currentQuestionIndex].correctAnswer;
                          const showStatus = showExplanation;
                          
                          let bg = 'bg-background hover:border-primary/50';
                          if (showStatus) {
                            if (isCorrect) bg = 'bg-emerald-500/10 border-emerald-500/50 text-emerald-600 dark:text-emerald-400';
                            else if (isSelected) bg = 'bg-destructive/10 border-destructive/50 text-destructive';
                            else bg = 'bg-background opacity-50';
                          } else if (isSelected) {
                            bg = 'bg-primary/10 border-primary';
                          }

                          return (
                            <button 
                              key={i}
                              disabled={showExplanation}
                              onClick={() => handleAnswerSubmit(opt)}
                              className={cn("w-full text-left p-4 rounded-xl border transition-all duration-200 font-medium", bg)}
                            >
                              {opt}
                            </button>
                          );
                        })}
                      </div>
                      
                      {showExplanation && (
                        <div className="mt-8 animate-in fade-in slide-in-from-bottom-4">
                          <div className="bg-muted p-5 rounded-xl text-sm leading-relaxed mb-6 border">
                            <span className="font-semibold block mb-2">Explanation:</span>
                            {quizQuestions[currentQuestionIndex].explanation}
                          </div>
                          <button 
                            onClick={nextQuestion}
                            className="w-full bg-primary text-primary-foreground py-3 rounded-xl font-medium hover:opacity-90 transition-opacity"
                          >
                            {currentQuestionIndex < quizQuestions.length - 1 ? 'Next Question' : 'Finish Quiz'}
                          </button>
                        </div>
                      )}
                    </>
                  )}
                </div>
              </div>
            ) : isEditing ? (
              <div className="w-full h-full flex flex-col min-h-0">
                <div className="px-4 md:px-8 pt-8 flex flex-col sm:flex-row items-start sm:items-center gap-4 mb-4">
                  <input 
                    type="text"
                    value={activeNote.folder || ''}
                    onChange={(e) => setNotesList(prev => prev.map(n => n.id.toString() === activeNoteId.toString() ? { ...n, folder: e.target.value } : n))}
                    className="w-full sm:w-1/3 px-3 py-1.5 text-sm font-medium bg-muted/50 border rounded-md outline-none focus:border-primary/50 transition-colors"
                    placeholder="Folder (e.g., Physics)"
                  />
                  <input 
                    type="text"
                    value={Array.isArray(activeNote.tags) ? activeNote.tags.join(', ') : (activeNote.tags || '')}
                    onChange={(e) => {
                      const tagsArray = e.target.value.split(',').map(t => t.trim()).filter(Boolean);
                      setNotesList(prev => prev.map(n => n.id.toString() === activeNoteId.toString() ? { ...n, tags: tagsArray as any } : n));
                    }}
                    className="flex-1 px-3 py-1.5 text-sm bg-muted/50 border rounded-md outline-none focus:border-primary/50 transition-colors"
                    placeholder="Tags (comma separated)"
                  />
                </div>
                <input 
                  type="text"
                  value={activeNote.title}
                  onChange={(e) => setNotesList(prev => prev.map(n => n.id.toString() === activeNoteId.toString() ? { ...n, title: e.target.value } : n))}
                  className="w-full px-8 pb-4 text-3xl font-bold bg-transparent outline-none placeholder:text-muted-foreground/30"
                  placeholder="Note Title..."
                />
                <textarea
                  className="w-full flex-1 px-4 md:px-8 pb-8 resize-none bg-transparent outline-none font-mono text-sm leading-relaxed overflow-y-auto"
                  value={activeNote.content}
                  onChange={(e) => updateActiveNoteContent(e.target.value)}
                  placeholder="Start typing your notes here..."
                />
              </div>
            ) : (
              <div className="w-full h-full p-4 md:p-8 overflow-y-auto min-h-0">
                <div className="mb-8">
                  <div className="flex items-center space-x-2 mb-3">
                    <span className="text-xs font-semibold px-2 py-1 bg-primary/10 text-primary rounded-md">{activeNote.folder || 'General'}</span>
                    {Array.isArray(activeNote.tags) && activeNote.tags.map((tag: string) => (
                      <span key={tag} className="text-xs text-muted-foreground bg-muted px-2 py-1 rounded-md">#{tag}</span>
                    ))}
                  </div>
                  <h2 className="text-4xl font-bold tracking-tight">{activeNote.title || 'Untitled Note'}</h2>
                </div>
                <div className="prose prose-sm md:prose-base dark:prose-invert max-w-none prose-headings:font-semibold prose-a:text-primary">
                  <Markdown>{activeNote.content}</Markdown>
                </div>
              </div>
            )}
          </div>
          
          {/* AI Sidebar - collapsible on mobile */}
          <div className={cn(
            "w-full lg:w-72 bg-muted/10 flex flex-col flex-shrink-0 overflow-y-auto transition-all duration-300",
            aiPanelOpen ? 'h-auto max-h-[40vh] lg:max-h-none lg:h-auto' : 'h-auto lg:h-auto'
          )}>
            {/* Mobile toggle bar */}
            <button 
              onClick={() => setAiPanelOpen(!aiPanelOpen)}
              className="lg:hidden flex items-center justify-between w-full px-4 py-2.5 bg-muted/30 border-t text-sm font-medium"
            >
              <span className="flex items-center space-x-2">
                <Sparkles className="w-3.5 h-3.5 text-primary" />
                <span>AI Tools</span>
              </span>
              <span className={cn("transition-transform text-xs", aiPanelOpen ? 'rotate-180' : '')}>
                ▼
              </span>
            </button>
            {/* Desktop always-visible header */}
            <h3 className="hidden lg:flex font-semibold p-4 pb-2 items-center space-x-2">
              <Sparkles className="w-4 h-4 text-primary" />
              <span>AI Tools</span>
            </h3>
            
            <div className={cn(
              "px-4 pb-4 lg:block",
              aiPanelOpen ? 'block' : 'hidden'
            )}>
              {/* Mobile: compact 2x2 grid. Desktop: stacked */}
              <div className="grid grid-cols-2 lg:grid-cols-1 gap-2 lg:gap-3 lg:mb-6 mt-2 lg:mt-0">
                <button 
                  onClick={handleGenerateSummary}
                  disabled={isGenerating || !activeNote.content.trim()}
                  className="border bg-background text-xs lg:text-sm font-medium py-2 rounded-lg hover:border-primary/50 transition-colors disabled:opacity-50"
                >
                  Summarize
                </button>
                <button 
                  onClick={handleGenerateFlashcards}
                  disabled={isGenerating || !activeNote.content.trim()}
                  className="border bg-background text-xs lg:text-sm font-medium py-2 rounded-lg hover:border-primary/50 transition-colors disabled:opacity-50"
                >
                  Flashcards
                </button>
                <button 
                  onClick={handleGenerateQuiz}
                  disabled={isGenerating || !activeNote.content.trim()}
                  className="bg-primary text-primary-foreground text-xs lg:text-sm font-medium py-2 rounded-lg hover:opacity-90 transition-opacity shadow-sm disabled:opacity-50"
                >
                  AI Quiz
                </button>
                <button 
                  onClick={handleCompileDNA}
                  disabled={isGenerating || !activeNote.content.trim()}
                  className="bg-purple-600 text-white text-xs lg:text-sm font-medium py-2 rounded-lg hover:opacity-90 transition-opacity shadow-sm disabled:opacity-50"
                >
                  DNA
                </button>
              </div>

              {isGenerating && (
                <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
                  <Loader2 className="w-6 h-6 animate-spin mb-3" />
                  <p className="text-sm">AI is thinking...</p>
                </div>
              )}

              {!isGenerating && summary && (
                <div className="bg-primary/5 border-primary/20 border p-4 rounded-xl text-sm leading-relaxed mt-4">
                  <p className="font-semibold text-primary mb-2">Summary</p>
                  {summary}
                </div>
              )}

              {!isGenerating && flashcards.length > 0 && (
                <div className="space-y-4 mt-4">
                  <p className="font-semibold text-primary">Generated Flashcards</p>
                  {flashcards.map((fc, i) => (
                    <div key={i} className="bg-card border p-4 rounded-xl shadow-sm">
                      <p className="text-xs font-semibold text-muted-foreground mb-1 uppercase tracking-wider">Front</p>
                      <p className="text-sm font-medium mb-3">{fc.front}</p>
                      <p className="text-xs font-semibold text-muted-foreground mb-1 uppercase tracking-wider">Back</p>
                      <p className="text-sm">{fc.back}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
        </div>
      </div>
    </div>
  );
}
