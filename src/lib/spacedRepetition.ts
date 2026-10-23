import { createEmptyCard, fsrs, generatorParameters, Rating, State } from 'ts-fsrs';
import type { Card, Grade } from 'ts-fsrs';

export interface StudyCard {
  id: string;
  noteId?: string;
  front: string;
  back: string;
  card: Card;
  lastReview?: string;
}

// Initialize FSRS scheduler with student-optimized parameters (target 90% retention)
const params = generatorParameters({
  request_retention: 0.9,
  maximum_interval: 365,
  enable_fuzz: true,
});

export const fScheduler = fsrs(params);

export { Rating, State };
export type { Card };

/**
 * Creates a new StudyCard initialized with FSRS empty state
 */
export function createStudyCard(front: string, back: string, noteId?: string): StudyCard {
  return {
    id: `card_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
    noteId,
    front,
    back,
    card: createEmptyCard(),
  };
}

/**
 * Schedules a review for a card given a rating (Again, Hard, Good, Easy)
 */
export function processCardReview(card: Card, rating: Rating, reviewTime = new Date()) {
  const result = fScheduler.next(card, reviewTime, rating as Grade);
  return {
    updatedCard: result.card,
    log: result.log,
  };
}

export type ReviewIntervalMap = Record<Rating.Again | Rating.Hard | Rating.Good | Rating.Easy, string>;

/**
 * Previews intervals for all 4 ratings so the student sees button labels (e.g. "< 10m", "1d", "3d", "7d")
 */
export function previewReviewIntervals(card: Card, now = new Date()): ReviewIntervalMap {
  const preview = fScheduler.repeat(card, now);
  
  const formatInterval = (targetDate: Date): string => {
    const diffMs = targetDate.getTime() - now.getTime();
    const diffMinutes = Math.round(diffMs / (1000 * 60));
    const diffHours = Math.round(diffMs / (1000 * 60 * 60));
    const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24));

    if (diffMinutes <= 15) return '< 10m';
    if (diffMinutes < 60) return `${diffMinutes}m`;
    if (diffHours < 24) return `${diffHours}h`;
    if (diffDays <= 1) return '1d';
    return `${diffDays}d`;
  };

  return {
    [Rating.Again]: formatInterval(new Date(preview[Rating.Again].card.due)),
    [Rating.Hard]: formatInterval(new Date(preview[Rating.Hard].card.due)),
    [Rating.Good]: formatInterval(new Date(preview[Rating.Good].card.due)),
    [Rating.Easy]: formatInterval(new Date(preview[Rating.Easy].card.due)),
  };
}

/**
 * Filter cards that are due for review (due <= now or State.New)
 */
export function getDueStudyCards(cards: StudyCard[], now = new Date()): StudyCard[] {
  return cards.filter((sc) => {
    if (sc.card.state === State.New) return true;
    return new Date(sc.card.due).getTime() <= now.getTime();
  });
}

/**
 * Storage helpers for FSRS flashcards in localStorage
 */
export function loadFSRSCards(noteId: string): StudyCard[] {
  try {
    const raw = localStorage.getItem(`studyos_fsrs_${noteId}`);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (e) {
    console.error('Failed to load FSRS cards from storage', e);
    return [];
  }
}

export function saveFSRSCards(noteId: string, cards: StudyCard[]) {
  try {
    localStorage.setItem(`studyos_fsrs_${noteId}`, JSON.stringify(cards));
  } catch (e) {
    console.error('Failed to save FSRS cards to storage', e);
  }
}
