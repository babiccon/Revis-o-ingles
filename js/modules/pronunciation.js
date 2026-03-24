/**
 * Pronunciation module renderer.
 * Shows phoneme guides with IPA, descriptions, examples, and links to Forvo/YouTube.
 */

import { escapeHtml, speak, getLangCode } from '../core/utils.js';
import { ProgressStore } from '../core/progress.js';

const LANG_NAMES = { german: 'Alemão', english: 'Inglês' };

const PronunciationModule = {
  /**
   * Entry point called by the Router.
   * @param {string} lang
   * @param {{ subLevel: string|null, lessonId: number|null, data: Object }} params
   */
  render(lang, { subLevel, lessonId, data }) {
    if (lessonId !== null) {
      this.renderSection(lang, data, subLevel, lessonId);
    } else {
      this.renderOverview(lang, data);
    }
  },

  /**
   * Show list of pronunciation sections grouped by sub-level.
   * @param {string} lang
   * @param {Object} data
   */
  renderOverview(lang, data) {
    const root = document.getElementById('appRoot');
    const sections = data.sections || [];
    const subLevels = [...new Set(sections.map(s => s.sub_level))].sort();

    const sectionsHtml = subLevels.map(sl => {
      const items = sections.filter(s => s.sub_level === sl);
      return `
        <div class="level-section">
          <h2><span class="level-badge ${sl.toLowerCase().replace('.', '-')}">${sl}</span></h2>
          <div class="topic-list">
            ${items.map(s => `
              <div class="topic-item" onclick="location.hash='#${lang}/pronunciation/${sl}/${s.id}'">
                <div class="topic-name">${ProgressStore.isLessonComplete(lang,'pronunciation',sl,s.id)?'✓ ':''}${escapeHtml(s.title)}</div>
                <div class="topic-meta">
                  <span>${(s.phoneme_groups||[]).reduce((acc,g)=>acc+(g.phonemes||[]).length,0)} fonemas</span>
                </div>
              </div>`).join('')}
          </div>
        </div>`;
    }).join('');

    root.innerHTML = `
      <div class="module-header">
        <h2>Pronúncia — ${LANG_NAMES[lang]}</h2>
        <p class="module-desc">Guia fonético com exemplos, IPA e links para recursos externos.</p>
      </div>
      ${sectionsHtml || '<div class="empty-state"><h3>Conteúdo em construção</h3></div>'}`;
  },

  /**
   * Render a full pronunciation section with phoneme groups.
   * @param {string} lang
   * @param {Object} data
   * @param {string} subLevel
   * @param {number} sectionId
   */
  renderSection(lang, data, subLevel, sectionId) {
    const root = document.getElementById('appRoot');
    const section = (data.sections || []).find(s => s.id === sectionId);
    if (!section) {
      root.innerHTML = '<div class="empty-state"><h3>Seção não encontrada</h3></div>';
      return;
    }

    const isDone = ProgressStore.isLessonComplete(lang, 'pronunciation', subLevel, sectionId);
    const langCode = getLangCode(lang);
    window._speak = (text) => speak(text, langCode);

    const groupsHtml = (section.phoneme_groups || []).map(group => `
      <div class="content-section">
        <h3>${escapeHtml(group.group)}</h3>
        ${(group.phonemes || []).map(p => this._renderPhoneme(p, langCode)).join('')}
      </div>`).join('');

    root.innerHTML = `
      <div class="content-detail">
        <div class="detail-header">
          <button class="back-btn" onclick="location.hash='#${lang}/pronunciation'">← Voltar</button>
          <h2>${escapeHtml(section.title)}</h2>
          <span class="level-badge ${(subLevel||'').toLowerCase().replace('.', '-')}">${subLevel || ''}</span>
        </div>

        ${groupsHtml}

        <label class="lesson-check ${isDone ? 'completed' : ''}" id="lessonCheckLabel" style="margin-top:1.5rem;">
          <input type="checkbox" id="lessonCheck" ${isDone ? 'checked' : ''}>
          <span>${isDone ? 'Lição concluída!' : 'Marcar como concluída'}</span>
        </label>
      </div>`;

    document.getElementById('lessonCheck').addEventListener('change', (e) => {
      if (e.target.checked) {
        ProgressStore.markLessonComplete(lang, 'pronunciation', subLevel, sectionId);
        document.getElementById('lessonCheckLabel').classList.add('completed');
        document.querySelector('#lessonCheckLabel span').textContent = 'Lição concluída!';
      }
    });
  },

  /**
   * Render a single phoneme card.
   * @param {Object} p - Phoneme object from JSON
   * @param {string} langCode - BCP-47 code for TTS
   * @returns {string}
   */
  _renderPhoneme(p, langCode) {
    const examplesHtml = (p.examples || []).map(ex => {
      const safeWord = ex.word.replace(/'/g, "\\'");
      return `
        <div class="phoneme-example">
          <strong>${escapeHtml(ex.word)}</strong>
          <span class="phoneme-ipa-small">${escapeHtml(ex.phonetic || '')}</span>
          <span class="phoneme-meaning">— ${escapeHtml(ex.translation)}</span>
          <button class="audio-btn" onclick="window._speak('${safeWord}')" title="Ouvir pronúncia">🔊</button>
        </div>`;
    }).join('');

    const linksHtml = [
      p.forvo_url ? `<a href="${escapeHtml(p.forvo_url)}" target="_blank" rel="noopener" class="btn btn-outline btn-sm">Forvo →</a>` : '',
      p.youtube_url ? `<a href="${escapeHtml(p.youtube_url)}" target="_blank" rel="noopener" class="btn btn-outline btn-sm">YouTube →</a>` : '',
    ].filter(Boolean).join('');

    return `
      <div class="phoneme-card">
        <div style="display:flex;align-items:baseline;gap:.5rem;margin-bottom:.5rem;">
          <span class="phoneme-symbol">${escapeHtml(p.symbol)}</span>
          <span class="ipa-notation">${escapeHtml(p.ipa)}</span>
        </div>
        <div class="phoneme-description">${this._formatDescription(p.description)}</div>
        <div style="margin-bottom:.5rem;">${examplesHtml}</div>
        ${linksHtml ? `<div style="display:flex;gap:.5rem;flex-wrap:wrap;margin-top:.5rem;">${linksHtml}</div>` : ''}
      </div>`;
  },
  /**
   * Format a phoneme description into readable paragraphs.
   * @param {string} text
   * @returns {string} HTML
   */
  _formatDescription(text) {
    if (!text) return '';
    const sentences = text.split(/(?<=[.!?])\s+(?=[A-ZÁÀÂÃÉÈÊÍÏÓÕÔÚÜ"'])/u);
    return sentences.map(s => `<p class="explanation-para">${escapeHtml(s.trim())}</p>`).join('');
  },
};

export default PronunciationModule;
