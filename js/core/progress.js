/**
 * Progress store for LinguaStudy.
 * Handles SM-2 spaced repetition, lesson completion, and writing storage.
 * All data is scoped per language to avoid cross-language collisions.
 */

import { getToday, addDays } from './utils.js';

// localStorage key prefixes
const STUDY_PREFIX = 'lang_study_v2_';
const LESSONS_PREFIX = 'lang_lessons_';
const WRITING_PREFIX = 'lang_writing_';

const ProgressStore = {

  // ─── SM-2 / Card Storage ──────────────────────────────────────────────────

  /**
   * Load the full progress object for a language.
   * @param {string} lang - 'german' or 'english'
   * @returns {{ cards: Object, stats: Object }}
   */
  loadProgress(lang) {
    const raw = localStorage.getItem(STUDY_PREFIX + lang);
    if (raw) return JSON.parse(raw);
    return {
      cards: {},
      stats: { total_reviews: 0, streak_days: 0, last_review_date: null },
    };
  },

  /**
   * Save the full progress object for a language.
   * @param {string} lang
   * @param {{ cards: Object, stats: Object }} progress
   */
  saveProgress(lang, progress) {
    localStorage.setItem(STUDY_PREFIX + lang, JSON.stringify(progress));
  },

  /**
   * Build a unique card key.
   * @param {string} module - e.g. 'grammar'
   * @param {number} topicId
   * @param {number} index - flashcard index within the topic
   * @returns {string}
   */
  getCardKey(module, topicId, index) {
    return `${module}_${topicId}_${index}`;
  },

  /**
   * Retrieve or initialize card state.
   * @param {{ cards: Object }} progress
   * @param {string} key
   * @returns {Object}
   */
  getCardData(progress, key) {
    return progress.cards[key] ?? {
      repetitions: 0,
      easiness: 2.5,
      interval: 0,
      next_review: getToday(),
      last_quality: null,
      review_count: 0,
    };
  },

  /**
   * Apply the SM-2 algorithm.
   * @param {number} quality - 1 (wrong) to 5 (easy)
   * @param {number} reps
   * @param {number} ease - easiness factor
   * @param {number} interval - current interval in days
   * @returns {{ repetitions: number, easiness: number, interval: number }}
   */
  sm2(quality, reps, ease, interval) {
    let newInterval, newReps;
    if (quality >= 3) {
      if (reps === 0) newInterval = 1;
      else if (reps === 1) newInterval = 6;
      else newInterval = Math.round(interval * ease);
      newReps = reps + 1;
    } else {
      newReps = 0;
      newInterval = 1;
    }
    let newEase = ease + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02));
    if (newEase < 1.3) newEase = 1.3;
    return {
      repetitions: newReps,
      easiness: Math.round(newEase * 100) / 100,
      interval: newInterval,
    };
  },

  /**
   * Update a card after a review and persist to localStorage.
   * @param {string} lang
   * @param {string} key - Card key from getCardKey()
   * @param {number} quality - 1–5
   */
  updateCard(lang, key, quality) {
    const progress = this.loadProgress(lang);
    const card = this.getCardData(progress, key);
    const result = this.sm2(quality, card.repetitions, card.easiness, card.interval);
    const today = getToday();

    progress.cards[key] = {
      repetitions: result.repetitions,
      easiness: result.easiness,
      interval: result.interval,
      next_review: addDays(today, result.interval),
      last_quality: quality,
      review_count: card.review_count + 1,
    };

    progress.stats.total_reviews++;
    if (progress.stats.last_review_date !== today) {
      const last = progress.stats.last_review_date;
      if (last) {
        const diff = Math.round((new Date(today) - new Date(last)) / 86400000);
        progress.stats.streak_days = diff === 1 ? progress.stats.streak_days + 1 : 1;
      } else {
        progress.stats.streak_days = 1;
      }
      progress.stats.last_review_date = today;
    }

    this.saveProgress(lang, progress);
  },

  /**
   * Compute summary statistics for the stats bar.
   * @param {string} lang
   * @returns {{ studied: number, mastered: number, streak: number, dueToday: number }}
   */
  getStats(lang) {
    const progress = this.loadProgress(lang);
    const cards = Object.values(progress.cards);
    const today = getToday();
    return {
      studied: cards.length,
      mastered: cards.filter(c => c.repetitions >= 3 && c.easiness >= 2.5).length,
      streak: progress.stats.streak_days,
      dueToday: cards.filter(c => c.next_review <= today).length,
    };
  },

  /**
   * Return all cards due for review today.
   * @param {string} lang
   * @returns {Array<{ key: string, cardData: Object }>}
   */
  getDueCards(lang) {
    const progress = this.loadProgress(lang);
    const today = getToday();
    return Object.entries(progress.cards)
      .filter(([, card]) => card.next_review <= today)
      .map(([key, cardData]) => ({ key, cardData }));
  },

  /**
   * Return cards that have never been reviewed (not in localStorage).
   * @param {string} lang
   * @param {Array<{ module: string, topicId: number, index: number }>} allCardRefs
   * @returns {Array}
   */
  getNewCards(lang, allCardRefs) {
    const progress = this.loadProgress(lang);
    return allCardRefs.filter(ref => {
      const key = this.getCardKey(ref.module, ref.topicId, ref.index);
      return !progress.cards[key];
    });
  },

  // ─── Lesson Completion ────────────────────────────────────────────────────

  /**
   * Load lesson completion map for a language.
   * @param {string} lang
   * @returns {Object} Map of "module_subLevel_id" → true
   */
  loadLessons(lang) {
    const raw = localStorage.getItem(LESSONS_PREFIX + lang);
    return raw ? JSON.parse(raw) : {};
  },

  /**
   * Mark a lesson as completed.
   * @param {string} lang
   * @param {string} module
   * @param {string} subLevel - e.g. 'A1.1'
   * @param {number} id
   */
  markLessonComplete(lang, module, subLevel, id) {
    const lessons = this.loadLessons(lang);
    lessons[`${module}_${subLevel}_${id}`] = true;
    localStorage.setItem(LESSONS_PREFIX + lang, JSON.stringify(lessons));
  },

  /**
   * Check if a lesson has been marked as completed.
   * @param {string} lang
   * @param {string} module
   * @param {string} subLevel
   * @param {number} id
   * @returns {boolean}
   */
  isLessonComplete(lang, module, subLevel, id) {
    const lessons = this.loadLessons(lang);
    return lessons[`${module}_${subLevel}_${id}`] === true;
  },

  /**
   * Compute progress summary grouped by sub-level.
   * @param {string} lang
   * @param {Object} allData - Map of module → loaded JSON data
   * @returns {Object} { 'A1.1': { total, done, pct }, ... }
   */
  getProgressSummary(lang, allData) {
    const lessons = this.loadLessons(lang);
    const bySubLevel = {};

    const modules = ['grammar', 'vocabulary', 'texts', 'conversation', 'writing', 'pronunciation'];
    const dataKeys = { grammar: 'topics', vocabulary: 'categories', texts: 'texts', conversation: 'dialogues', writing: 'exercises', pronunciation: 'sections' };

    for (const mod of modules) {
      const data = allData[mod];
      if (!data) continue;
      const key = dataKeys[mod];
      const items = data[key] || [];
      for (const item of items) {
        const sl = item.sub_level;
        if (!sl) continue;
        if (!bySubLevel[sl]) bySubLevel[sl] = { total: 0, done: 0 };
        bySubLevel[sl].total++;
        if (lessons[`${mod}_${sl}_${item.id}`]) bySubLevel[sl].done++;
      }
    }

    for (const sl of Object.keys(bySubLevel)) {
      const { total, done } = bySubLevel[sl];
      bySubLevel[sl].pct = total > 0 ? Math.round((done / total) * 100) : 0;
    }

    return bySubLevel;
  },

  // ─── Writing Storage ──────────────────────────────────────────────────────

  /**
   * Load saved writing texts for a language.
   * @param {string} lang
   * @returns {Object} Map of exercise id → text string
   */
  loadWriting(lang) {
    const raw = localStorage.getItem(WRITING_PREFIX + lang);
    return raw ? JSON.parse(raw) : {};
  },

  /**
   * Save a writing exercise text.
   * @param {string} lang
   * @param {number} id
   * @param {string} text
   */
  saveWriting(lang, id, text) {
    const writing = this.loadWriting(lang);
    writing[id] = text;
    localStorage.setItem(WRITING_PREFIX + lang, JSON.stringify(writing));
  },

  // ─── Reset ────────────────────────────────────────────────────────────────

  /**
   * Reset all progress for a language.
   * @param {string} lang
   */
  reset(lang) {
    localStorage.removeItem(STUDY_PREFIX + lang);
    localStorage.removeItem(LESSONS_PREFIX + lang);
    localStorage.removeItem(WRITING_PREFIX + lang);
  },
};

export { ProgressStore };
