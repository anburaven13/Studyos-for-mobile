import React, { useState, useEffect } from 'react';
import Markdown from 'react-markdown';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import rehypeRaw from 'rehype-raw';
import remarkGfm from 'remark-gfm';
import { Sparkles, Loader2, Check, Trash, Folder, FileText, Brain } from 'lucide-react';
import SpacedReviewModal from '../components/flashcards/SpacedReviewModal';
import { createStudyCard, loadFSRSCards, saveFSRSCards } from '../lib/spacedRepetition';
import type { StudyCard } from '../lib/spacedRepetition';
import { simulateAiResponse, generateFlashcards, extractTextFromDocument } from '../lib/aiService';
import { cn } from '../lib/utils';
import { useAuth } from '../lib/AuthContext';

type Note = { id: string; title: string; content: string; folder?: string; tags?: any; };

export default function Notes() {
  const [notesList, setNotesList] = useState<Note[]>([{ id: 'new', title: '', content: '' }]);
  const [activeNoteId, setActiveNoteId] = useState<string>('new');
  const [mobileView, setMobileView] = useState<'list' | 'editor' | 'ai'>('editor');
  const [isEditing, setIsEditing] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [summary, setSummary] = useState('');
  const [flashcards, setFlashcards] = useState<{front: string, back: string}[]>([]);
  const [fsrsCards, setFsrsCards] = useState<StudyCard[]>([]);
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);
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
    // Load saved FSRS cards
    if (activeNoteId && activeNoteId !== 'new') {
      const saved = loadFSRSCards(activeNoteId.toString());
      if (saved && saved.length > 0) {
        setFsrsCards(saved);
        setFlashcards(saved.map(s => ({ front: s.front, back: s.back })));
      }
    }
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
  }, [activeNote?.id, activeNote?.content, activeNote?.title, activeNote?.folder, activeNote?.tags]);

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
        setMobileView('editor');
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
    if (result && result.length > 0) {
      const newFsrs = result.map(fc => createStudyCard(fc.front, fc.back, activeNote.id.toString()));
      setFsrsCards(newFsrs);
      saveFSRSCards(activeNote.id.toString(), newFsrs);
    }
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
    <div className="flex-1 flex flex-col min-h-0 md:p-8 max-w-6xl mx-auto w-full h-[calc(100vh-3.5rem)] md:h-[calc(100vh-4rem)] overflow-hidden">
      <div className="hidden md:flex mb-6 flex-col md:flex-row items-start md:items-center justify-between gap-4 flex-shrink-0">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">AI Notes</h1>
          <div className="flex items-center space-x-2 mt-1">
            <p className="text-muted-foreground">Capture ideas, generate flashcards, and learn.</p>
            <span className="text-muted-foreground/50">•</span>
            <div className="flex items-center text-xs text-muted-foreground">
              {saveStatus === 'Saving...' ? <Loader2 className="w-3 h-3 mr-1 animate-spin" /> : <Check className="w-3 h-3 mr-1" />}
              {saveStatus}
            </div>
          </div>
        </div>
        <div className="flex flex-wrap gap-3">
          <button 
            onClick={() => setIsEditing(!isEditing)}
            className="border bg-background text-foreground px-4 py-2 rounded-md font-medium text-sm hover:bg-muted transition-colors"
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
            className="border bg-background text-foreground px-4 py-2 rounded-md font-medium text-sm hover:bg-muted transition-colors flex items-center gap-2"
          >
            Import PDF
          </button>

          <button 
            onClick={createNewNote}
            className="bg-primary text-primary-foreground px-4 py-2 rounded-md font-medium text-sm hover:opacity-90 transition-opacity"
          >
            New Note
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="border-0 md:border md:rounded-2xl shadow-none md:shadow-sm flex flex-col md:flex-row flex-1 min-h-0 overflow-hidden bg-card">
        
        {/* Mobile / Split-screen Navbar for Editor */}
        <div className={`md:hidden flex items-center justify-between px-4 py-3 border-b bg-card flex-shrink-0 ${mobileView !== 'editor' ? 'hidden' : 'flex'}`}>
          <button 
            onClick={() => setMobileView('list')}
            className="text-primary text-sm font-medium hover:underline flex items-center gap-1"
          >
            ← Notes
          </button>
          <div className="flex items-center text-xs text-muted-foreground font-medium bg-muted px-3 py-1 rounded-full">
            {saveStatus === 'Saving...' ? <Loader2 className="w-3 h-3 mr-1 animate-spin" /> : <Check className="w-3 h-3 mr-1 text-emerald-500" />}
            {saveStatus}
          </div>
          <button 
            onClick={() => setMobileView('ai')}
            className="text-primary text-sm font-medium hover:underline flex items-center gap-1"
          >
            <Sparkles className="w-3.5 h-3.5" />
            AI Tools
          </button>
        </div>

        {/* Sidebar - Note List */}
        <div className={`w-full md:w-64 h-full md:h-auto border-r-0 md:border-r bg-muted/20 flex-shrink-0 overflow-y-auto flex-col ${mobileView === 'list' ? 'flex' : 'hidden md:flex'}`}>
          <div className="md:hidden p-4 border-b flex items-center justify-between flex-shrink-0">
            <h2 className="text-xl font-semibold">Your Notes</h2>
            <button 
              onClick={() => { createNewNote(); setMobileView('editor'); }}
              className="bg-primary text-primary-foreground px-3 py-1.5 rounded-lg text-sm font-medium"
            >
              + New Note
            </button>
          </div>

          {Object.keys(groupedNotes).map(folder => (
            <div key={folder} className="mb-4">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 px-6 mt-4">{folder}</p>
              <div className="space-y-1 px-4">
                {groupedNotes[folder].map((note: Note) => (
                  <button 
                    key={note.id}
                    onClick={() => {
                      setActiveNoteId(note.id.toString());
                      setSummary('');
                      setFlashcards([]);
                      setQuizActive(false);
                      setMobileView('editor');
                    }}
                    className={cn(
                      "w-full text-left px-3 py-2 rounded-lg text-sm font-medium transition-colors flex items-center justify-between group",
                      note.id.toString() === activeNoteId.toString() ? 'bg-primary/10 text-primary font-semibold' : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                    )}
                  >
                    <span className="truncate pr-2">{note.title || 'Untitled Note'}</span>
                    <Trash 
                      className={cn(
                        "w-3.5 h-3.5 flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity hover:text-destructive",
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

        {/* Editor / Preview */}
        <div className={`flex-1 flex-col relative min-h-0 overflow-hidden ${mobileView === 'editor' ? 'flex' : 'hidden md:flex'}`}>
          <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
            {quizActive ? (
              <div className="w-full h-full p-4 md:p-8 overflow-y-auto flex flex-col items-center justify-center">
                <div className="max-w-2xl w-full bg-card border rounded-2xl shadow-sm p-6 md:p-8">
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
              <div className="w-full h-full flex flex-col min-h-0 bg-card">
                <div className="px-4 md:px-8 pt-4 md:pt-6 flex flex-col sm:flex-row items-start sm:items-center gap-3 mb-4 flex-shrink-0">
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
                    className="w-full sm:flex-1 px-3 py-1.5 text-sm bg-muted/50 border rounded-md outline-none focus:border-primary/50 transition-colors"
                    placeholder="Tags (comma separated)"
                  />
                  <button 
                    onClick={() => setIsEditing(false)}
                    className="md:hidden w-full border bg-background text-foreground px-4 py-2 rounded-md font-medium text-sm mt-2 shadow-sm"
                  >
                    Preview Note
                  </button>
                </div>
                <input 
                  type="text"
                  value={activeNote.title}
                  onChange={(e) => setNotesList(prev => prev.map(n => n.id.toString() === activeNoteId.toString() ? { ...n, title: e.target.value } : n))}
                  className="w-full px-4 md:px-8 pb-4 text-2xl md:text-3xl font-bold bg-transparent outline-none placeholder:text-muted-foreground/30 flex-shrink-0"
                  placeholder="Note Title..."
                />
                <textarea
                  className="w-full flex-1 px-4 md:px-8 pb-8 resize-none bg-transparent outline-none font-mono text-sm md:text-base leading-relaxed overflow-y-auto"
                  value={activeNote.content}
                  onChange={(e) => updateActiveNoteContent(e.target.value)}
                  placeholder="Start typing your notes here..."
                />
              </div>
            ) : (
              <div className="w-full h-full p-4 md:p-8 overflow-y-auto min-h-0 bg-card">
                <button 
                  onClick={() => setIsEditing(true)}
                  className="md:hidden w-full border bg-background text-foreground px-4 py-2 rounded-md font-medium text-sm mb-6 shadow-sm"
                >
                  Edit Note
                </button>
                <div className="mb-6 md:mb-8">
                  <div className="flex flex-wrap items-center gap-2 mb-3">
                    <span className="text-xs font-semibold px-2.5 py-1 bg-primary/10 text-primary rounded-md">{activeNote.folder || 'General'}</span>
                    {Array.isArray(activeNote.tags) && activeNote.tags.map((tag: string) => (
                      <span key={tag} className="text-xs text-muted-foreground bg-muted px-2.5 py-1 rounded-md">#{tag}</span>
                    ))}
                  </div>
                  <h2 className="text-3xl md:text-4xl font-bold tracking-tight">{activeNote.title || 'Untitled Note'}</h2>
                </div>
                <div className="prose prose-sm md:prose-base dark:prose-invert max-w-none prose-headings:font-semibold prose-a:text-primary">
                  <Markdown remarkPlugins={[remarkGfm, remarkMath]} rehypePlugins={[rehypeRaw, rehypeKatex]}>{activeNote.content}</Markdown>
                </div>
              </div>
            )}
          </div>
        </div>
        
        {/* AI Sidebar */}
        <div className={`w-full md:w-80 h-full md:h-auto border-l-0 md:border-l bg-muted/10 p-5 md:p-6 flex-col flex-shrink-0 overflow-y-auto ${mobileView === 'ai' ? 'flex' : 'hidden md:flex'}`}>
          <div className="md:hidden p-1 mb-6 flex items-center justify-between border-b pb-4 flex-shrink-0">
            <h2 className="text-xl font-semibold flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-primary" />
              AI Tools
            </h2>
            <button 
              onClick={() => setMobileView('editor')}
              className="text-primary text-sm font-medium hover:underline"
            >
              Close
            </button>
          </div>

          <h3 className="hidden md:flex font-semibold mb-6 items-center space-x-2">
            <Sparkles className="w-4 h-4 text-primary" />
            <span>AI Tools</span>
          </h3>
          
          <div className="space-y-3 mb-8">
            <button 
              onClick={handleGenerateSummary}
              disabled={isGenerating || !activeNote.content.trim()}
              className="w-full border bg-background text-sm font-medium py-2 rounded-lg hover:border-primary/50 transition-colors disabled:opacity-50"
            >
              Summarize Note
            </button>
            <button 
              onClick={handleGenerateFlashcards}
              disabled={isGenerating || !activeNote.content.trim()}
              className="w-full border bg-background text-sm font-medium py-2 rounded-lg hover:border-primary/50 transition-colors disabled:opacity-50"
            >
              Generate Flashcards
            </button>
            <button 
              onClick={handleGenerateQuiz}
              disabled={isGenerating || !activeNote.content.trim()}
              className="w-full bg-primary text-primary-foreground text-sm font-medium py-2.5 rounded-lg hover:opacity-90 transition-opacity shadow-sm disabled:opacity-50"
            >
              Take AI Quiz
            </button>
            <button 
              onClick={handleCompileDNA}
              disabled={isGenerating || !activeNote.content.trim()}
              className="w-full bg-purple-600 text-white text-sm font-medium py-2.5 rounded-lg hover:opacity-90 transition-opacity shadow-sm disabled:opacity-50 flex items-center justify-center space-x-2 mt-4"
            >
              <span>Compile Knowledge DNA</span>
            </button>
          </div>

          {isGenerating && (
            <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
              <Loader2 className="w-8 h-8 animate-spin mb-4" />
              <p className="text-sm">AI is thinking...</p>
            </div>
          )}

          {!isGenerating && summary && (
            <div className="bg-primary/5 border-primary/20 border p-4 rounded-xl text-sm leading-relaxed">
              <p className="font-semibold text-primary mb-2">Summary</p>
              {summary}
            </div>
          )}

          {!isGenerating && flashcards.length > 0 && (
            <div className="space-y-4">
              <div className="flex items-center justify-between gap-2">
                <p className="font-semibold text-primary text-sm sm:text-base">Flashcards ({flashcards.length})</p>
                <button
                  onClick={() => setIsReviewModalOpen(true)}
                  className="px-2.5 py-1 bg-primary text-primary-foreground text-xs font-semibold rounded-lg hover:opacity-90 transition-opacity flex items-center gap-1.5 shadow-sm"
                  title="Start FSRS scientific spaced repetition review session"
                >
                  <Brain className="w-3.5 h-3.5" />
                  <span>FSRS Review</span>
                </button>
              </div>
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
      <SpacedReviewModal
        isOpen={isReviewModalOpen}
        onClose={() => setIsReviewModalOpen(false)}
        noteId={activeNote.id.toString()}
        noteTitle={activeNote.title}
        cards={fsrsCards.length > 0 ? fsrsCards : flashcards.map(fc => createStudyCard(fc.front, fc.back, activeNote.id.toString()))}
        onUpdateCards={(updated) => setFsrsCards(updated)}
      />
    </div>
  );
}
