/**
 * Shared utility functions for LinguaStudy.
 */

/**
 * Return today's date as an ISO string (YYYY-MM-DD).
 * @returns {string}
 */
function getToday() {
  return new Date().toISOString().split('T')[0];
}

/**
 * Add a number of days to a date string and return the new date string.
 * @param {string} dateStr - ISO date string (YYYY-MM-DD)
 * @param {number} days - Number of days to add
 * @returns {string}
 */
function addDays(dateStr, days) {
  const d = new Date(dateStr);
  d.setDate(d.getDate() + days);
  return d.toISOString().split('T')[0];
}

/**
 * Shuffle an array in place using the Fisher-Yates algorithm.
 * @param {Array} arr - The array to shuffle
 * @returns {Array} The shuffled array (same reference)
 */
function shuffleArray(arr) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

/**
 * Speak text using the Web Speech API (no external requests needed).
 * @param {string} text - The text to speak
 * @param {string} langCode - BCP-47 language code ('de', 'en', etc.)
 */
function speak(text, langCode) {
  if (!window.speechSynthesis) return;
  window.speechSynthesis.cancel();
  const utt = new SpeechSynthesisUtterance(text);
  utt.lang = langCode;
  window.speechSynthesis.speak(utt);
}

/**
 * @deprecated Use speak() instead. Kept for backwards compatibility.
 */
function buildTTSUrl(text, langCode) {
  return null;
}

/**
 * Map a language key to its BCP-47 code for TTS.
 * @param {string} lang - 'german' or 'english'
 * @returns {string}
 */
function getLangCode(lang) {
  return lang === 'german' ? 'de' : 'en';
}

/**
 * Escape HTML special characters to prevent XSS.
 * @param {string} str
 * @returns {string}
 */
function escapeHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

export { getToday, addDays, shuffleArray, speak, buildTTSUrl, getLangCode, escapeHtml };
