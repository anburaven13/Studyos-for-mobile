import React, { useState, useEffect } from 'react';
import { X, Sparkles, RotateCw, CheckCircle2, Brain, Flame, Calendar, Award } from 'lucide-react';
import { 
  Rating, 
  State, 
  processCardReview, 
  previewReviewIntervals,
  saveFSRSCards
} from '../../lib/spacedRepetition';
import type { StudyCard } from '../../lib/spacedRepetition';

interface SpacedReviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  noteId: string;
  noteTitle: string;
  cards: StudyCard[];
  onUpdateCards: (updated: StudyCard[]) => void;
}

export default function SpacedReviewModal({
  isOpen,
  onClose,
  noteId,
  noteTitle,
  cards,
  onUpdateCards,
}: SpacedReviewModalProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [sessionCards, setSessionCards] = useState<StudyCard[]>([]);
  const [allCardsState, setAllCardsState] = useState<StudyCard[]>([]);
  const [isComplete, setIsComplete] = useState(false);
  const [reviewedCount, setReviewedCount] = useState(0);

  // Initialize or reset review session when opened
  useEffect(() => {
    if (isOpen && cards.length > 0) {
      setAllCardsState([...cards]);
      setSessionCards([...cards]);
      setCurrentIndex(0);
      setIsFlipped(false);
      setIsComplete(false);
      setReviewedCount(0);
    }
  }, [isOpen, cards]);

  const currentCard = sessionCards[currentIndex];

  // Keyboard controls: Space to flip, 1-4 to rate
  useEffect(() => {
    if (!isOpen || isComplete || !currentCard) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space' && !isFlipped) {
        e.preventDefault();
        setIsFlipped(true);
      } else if (isFlipped) {
        if (e.key === '1') handleRate(Rating.Again);
        else if (e.key === '2') handleRate(Rating.Hard);
        else if (e.key === '3') handleRate(Rating.Good);
        else if (e.key === '4') handleRate(Rating.Easy);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, isFlipped, currentCard, isComplete]);

  if (!isOpen) return null;

  if (sessionCards.length === 0 || !currentCard) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
        <div className="w-full max-w-md bg-card border rounded-2xl p-6 text-center shadow-xl">
          <Brain className="w-12 h-12 text-primary mx-auto mb-3 opacity-80" />
          <h3 className="text-xl font-semibold mb-2">No Cards Available</h3>
          <p className="text-sm text-muted-foreground mb-6">
            Generate flashcards from your note first before starting an FSRS review session.
          </p>
          <button 
            onClick={onClose}
            className="w-full py-2.5 px-4 bg-primary text-primary-foreground font-medium rounded-lg hover:opacity-90 transition-opacity"
          >
            Back to Notes
          </button>
        </div>
      </div>
    );
  }

  const intervals = isFlipped ? previewReviewIntervals(currentCard.card) : null;

  const handleRate = (rating: Rating) => {
    const { updatedCard } = processCardReview(currentCard.card, rating);
    
    // Update current card in storage & state
    const updatedStudyCard: StudyCard = {
      ...currentCard,
      card: updatedCard,
      lastReview: new Date().toISOString(),
    };

    const newAllCards = allCardsState.map((sc) => 
      sc.id === updatedStudyCard.id ? updatedStudyCard : sc
    );

    setAllCardsState(newAllCards);
    saveFSRSCards(noteId, newAllCards);
    onUpdateCards(newAllCards);
    setReviewedCount((prev) => prev + 1);

    // If "Again", keep in queue at the end of session for re-learning
    let nextSessionCards = [...sessionCards];
    if (rating === Rating.Again) {
      nextSessionCards.push(updatedStudyCard);
    }

    if (currentIndex + 1 < nextSessionCards.length) {
      setSessionCards(nextSessionCards);
      setCurrentIndex((prev) => prev + 1);
      setIsFlipped(false);
    } else {
      setIsComplete(true);
    }
  };

  const getStatusBadge = (state: State) => {
    switch (state) {
      case State.New:
        return <span className="text-[11px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-500 border border-blue-500/20">New</span>;
      case State.Learning:
        return <span className="text-[11px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-500 border border-amber-500/20">Learning</span>;
      case State.Review:
        return <span className="text-[11px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">Review</span>;
      case State.Relearning:
        return <span className="text-[11px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full bg-rose-500/10 text-rose-500 border border-rose-500/20">Relearning</span>;
      default:
        return null;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl bg-card border border-white/10 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="p-4 sm:p-5 border-b flex items-center justify-between bg-muted/20">
          <div className="flex items-center space-x-2">
            <Brain className="w-5 h-5 text-primary" />
            <div>
              <h2 className="font-semibold text-base sm:text-lg flex items-center gap-2">
                <span>FSRS Spaced Repetition</span>
                <span className="text-xs px-2 py-0.5 bg-primary/10 text-primary font-mono rounded">Scientific Anki</span>
              </h2>
              <p className="text-xs text-muted-foreground truncate max-w-[280px] sm:max-w-md">
                {noteTitle || 'Study Note'}
              </p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-2 text-muted-foreground hover:text-foreground rounded-lg transition-colors"
            title="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Completion View */}
        {isComplete ? (
          <div className="p-8 sm:p-12 text-center flex flex-col items-center justify-center my-auto">
            <div className="w-16 h-16 rounded-full bg-emerald-500/10 text-emerald-500 flex items-center justify-center mb-4 border border-emerald-500/20">
              <Award className="w-8 h-8" />
            </div>
            <h3 className="text-2xl font-bold mb-2">Review Session Complete!</h3>
            <p className="text-muted-foreground text-sm max-w-sm mb-6">
              You reviewed {reviewedCount} flashcard{reviewedCount !== 1 ? 's' : ''}. The FSRS algorithm has scheduled their next optimal retention intervals.
            </p>

            <div className="grid grid-cols-2 gap-4 w-full max-w-sm mb-8">
              <div className="border rounded-xl p-4 bg-muted/10 text-center">
                <p className="text-xs text-muted-foreground font-medium mb-1">Total Reviewed</p>
                <p className="text-2xl font-bold text-foreground">{reviewedCount}</p>
              </div>
              <div className="border rounded-xl p-4 bg-muted/10 text-center">
                <p className="text-xs text-muted-foreground font-medium mb-1">Algorithm Target</p>
                <p className="text-2xl font-bold text-primary">90%</p>
              </div>
            </div>

            <button 
              onClick={onClose}
              className="w-full max-w-sm py-3 bg-primary text-primary-foreground font-medium rounded-xl hover:opacity-90 transition-opacity shadow-md"
            >
              Done & Return to Notes
            </button>
          </div>
        ) : (
          <>
            {/* Progress Bar */}
            <div className="w-full bg-muted/40 h-1.5 overflow-hidden">
              <div 
                className="bg-primary h-full transition-all duration-300"
                style={{ width: `${((currentIndex + 1) / sessionCards.length) * 100}%` }}
              />
            </div>

            {/* Sub-header info */}
            <div className="px-5 py-3 flex items-center justify-between text-xs text-muted-foreground border-b border-white/5">
              <div className="flex items-center space-x-2">
                <span>Card {currentIndex + 1} of {sessionCards.length}</span>
                <span>•</span>
                {getStatusBadge(currentCard.card.state)}
              </div>
              <span className="hidden sm:inline">Press <kbd className="px-1.5 py-0.5 bg-muted rounded border text-[10px]">Space</kbd> to flip</span>
            </div>

            {/* Flashcard Body */}
            <div className="p-6 sm:p-8 flex-1 flex flex-col justify-center items-center min-h-[260px] sm:min-h-[320px] text-center select-none overflow-y-auto">
              <div 
                onClick={() => !isFlipped && setIsFlipped(true)}
                className={`w-full max-w-lg cursor-pointer transition-all duration-300 ${!isFlipped ? 'hover:scale-[1.01]' : ''}`}
              >
                <p className="text-xs font-semibold text-primary/80 uppercase tracking-wider mb-3">
                  Question (Front)
                </p>
                <h4 className="text-lg sm:text-xl font-medium leading-relaxed mb-6">
                  {currentCard.front}
                </h4>

                {isFlipped ? (
                  <div className="border-t border-dashed border-white/10 pt-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
                    <p className="text-xs font-semibold text-emerald-500 uppercase tracking-wider mb-3">
                      Answer (Back)
                    </p>
                    <p className="text-base sm:text-lg text-foreground/90 leading-relaxed font-normal">
                      {currentCard.back}
                    </p>
                  </div>
                ) : (
                  <div className="mt-8">
                    <button 
                      onClick={(e) => { e.stopPropagation(); setIsFlipped(true); }}
                      className="inline-flex items-center space-x-2 px-5 py-2.5 rounded-full bg-muted/40 hover:bg-muted text-sm font-medium border border-white/10 transition-colors"
                    >
                      <RotateCw className="w-4 h-4 text-primary" />
                      <span>Show Answer</span>
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Rating Buttons (Revealed when card is flipped) */}
            <div className="p-4 sm:p-6 border-t bg-muted/10">
              {isFlipped && intervals ? (
                <div>
                  <p className="text-center text-xs text-muted-foreground mb-3 font-medium">
                    Rate how well you recalled this concept:
                  </p>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                    {/* Again */}
                    <button 
                      onClick={() => handleRate(Rating.Again)}
                      className="flex flex-col items-center justify-center p-3 rounded-xl border border-rose-500/20 bg-rose-500/5 hover:bg-rose-500/15 text-rose-500 transition-all active:scale-95"
                    >
                      <span className="font-semibold text-sm">Again</span>
                      <span className="text-xs opacity-75 font-mono">{intervals[Rating.Again]}</span>
                      <kbd className="hidden sm:inline mt-1 text-[10px] text-muted-foreground bg-black/20 px-1 rounded">1</kbd>
                    </button>

                    {/* Hard */}
                    <button 
                      onClick={() => handleRate(Rating.Hard)}
                      className="flex flex-col items-center justify-center p-3 rounded-xl border border-amber-500/20 bg-amber-500/5 hover:bg-amber-500/15 text-amber-500 transition-all active:scale-95"
                    >
                      <span className="font-semibold text-sm">Hard</span>
                      <span className="text-xs opacity-75 font-mono">{intervals[Rating.Hard]}</span>
                      <kbd className="hidden sm:inline mt-1 text-[10px] text-muted-foreground bg-black/20 px-1 rounded">2</kbd>
                    </button>

                    {/* Good */}
                    <button 
                      onClick={() => handleRate(Rating.Good)}
                      className="flex flex-col items-center justify-center p-3 rounded-xl border border-emerald-500/20 bg-emerald-500/5 hover:bg-emerald-500/15 text-emerald-500 transition-all active:scale-95"
                    >
                      <span className="font-semibold text-sm">Good</span>
                      <span className="text-xs opacity-75 font-mono">{intervals[Rating.Good]}</span>
                      <kbd className="hidden sm:inline mt-1 text-[10px] text-muted-foreground bg-black/20 px-1 rounded">3</kbd>
                    </button>

                    {/* Easy */}
                    <button 
                      onClick={() => handleRate(Rating.Easy)}
                      className="flex flex-col items-center justify-center p-3 rounded-xl border border-blue-500/20 bg-blue-500/5 hover:bg-blue-500/15 text-blue-500 transition-all active:scale-95"
                    >
                      <span className="font-semibold text-sm">Easy</span>
                      <span className="text-xs opacity-75 font-mono">{intervals[Rating.Easy]}</span>
                      <kbd className="hidden sm:inline mt-1 text-[10px] text-muted-foreground bg-black/20 px-1 rounded">4</kbd>
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-center">
                  <button 
                    onClick={() => setIsFlipped(true)}
                    className="w-full sm:w-auto px-8 py-3 bg-primary text-primary-foreground font-medium rounded-xl hover:opacity-90 transition-opacity shadow-sm flex items-center justify-center space-x-2"
                  >
                    <RotateCw className="w-4 h-4" />
                    <span>Reveal Answer (Spacebar)</span>
                  </button>
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
