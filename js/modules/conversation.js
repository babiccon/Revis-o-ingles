/**
 * Conversation module renderer.
 * Shows situational dialogues with TTS audio and line-by-line translations.
 */

import { escapeHtml, buildTTSUrl, getLangCode } from '../core/utils.js';
import { ProgressStore } from '../core/progress.js';

const LANG_NAMES = { german: 'Alemão', english: 'Inglês' };

const ConversationModule = {
  /**
   * Entry point called by the Router.
   * @param {string} lang
   * @param {{ subLevel: string|null, lessonId: number|null, data: Object }} params
   */
  render(lang, { subLevel, lessonId, data }) {
    if (lessonId !== null) {
      this.renderDialogue(lang, data, subLevel, lessonId);
    } else {
      this.renderOverview(lang, data);
    }
  },

  /**
   * Show list of dialogues grouped by sub-level.
   * @param {string} lang
   * @param {Object} data
   */
  renderOverview(lang, data) {
    const root = document.getElementById('appRoot');
    const dialogues = data.dialogues || [];
    const subLevels = [...new Set(dialogues.map(d => d.sub_level))].sort();

    const sectionsHtml = subLevels.map(sl => {
      const items = dialogues.filter(d => d.sub_level === sl);
      return `
        <div class="level-section">
          <h2><span class="level-badge ${sl.toLowerCase().replace('.', '-')}">${sl}</span></h2>
          <div class="topic-list">
            ${items.map(d => `
              <div class="topic-item" onclick="location.hash='#${lang}/conversation/${sl}/${d.id}'">
                <div class="topic-name">${ProgressStore.isLessonComplete(lang,'conversation',sl,d.id)?'✓ ':''}${escapeHtml(d.situation_pt || d.situation)}</div>
                <div class="topic-meta"><span>${(d.lines||[]).length} falas</span></div>
              </div>`).join('')}
          </div>
        </div>`;
    }).join('');

    root.innerHTML = `
      <div class="module-header">
        <h2>Conversação — ${LANG_NAMES[lang]}</h2>
        <p class="module-desc">Diálogos situacionais com áudio e tradução linha por linha.</p>
      </div>
      ${sectionsHtml || '<div class="empty-state"><h3>Conteúdo em construção</h3></div>'}`;
  },

  /**
   * Render a full dialogue with speaker lines, TTS, and key phrases.
   * @param {string} lang
   * @param {Object} data
   * @param {string} subLevel
   * @param {number} dialogueId
   */
  renderDialogue(lang, data, subLevel, dialogueId) {
    const root = document.getElementById('appRoot');
    const dialogue = (data.dialogues || []).find(d => d.id === dialogueId);
    if (!dialogue) {
      root.innerHTML = '<div class="empty-state"><h3>Diálogo não encontrado</h3></div>';
      return;
    }

    const isDone = ProgressStore.isLessonComplete(lang, 'conversation', subLevel, dialogueId);
    const langCode = getLangCode(lang);

    const linesHtml = (dialogue.lines || []).map((line, i) => {
      const ttsUrl = buildTTSUrl(line.audio_tts || line.de || line.en || '', langCode);
      return `
        <div class="dialogue-line">
          <div class="dialogue-speaker">${escapeHtml(line.speaker)}</div>
          <div class="dialogue-bubble">
            <div class="de">${escapeHtml(line.de || line.en || '')}</div>
            <div class="pt" id="dpt_${i}">${escapeHtml(line.pt)}</div>
            ${line.notes ? `<div class="dialogue-note">${escapeHtml(line.notes)}</div>` : ''}
            <div style="display:flex;gap:.5rem;margin-top:.35rem;align-items:center;">
              <button class="toggle-translation-btn" onclick="window._toggleDPT(${i})">▸ Tradução</button>
              <a class="audio-btn" href="${escapeHtml(ttsUrl)}" target="_blank" rel="noopener" title="Ouvir pronúncia">🔊 Áudio</a>
            </div>
          </div>
        </div>`;
    }).join('');

    const keyPhrasesHtml = (dialogue.key_phrases || []).map(kp => `
      <div class="example-card">
        <span class="en">${escapeHtml(kp.de || kp.en || '')}</span>
        <span class="pt">${escapeHtml(kp.pt)}</span>
      </div>`).join('');

    const forvoHtml = (dialogue.forvo_links || []).map(fl =>
      `<a href="${escapeHtml(fl.url)}" target="_blank" rel="noopener" class="btn btn-outline btn-sm">${escapeHtml(fl.word)} →</a>`
    ).join('');

    root.innerHTML = `
      <div class="content-detail">
        <div class="detail-header">
          <button class="back-btn" onclick="location.hash='#${lang}/conversation'">← Voltar</button>
          <h2>${escapeHtml(dialogue.situation_pt || dialogue.situation)}</h2>
          <span class="level-badge ${(subLevel||'').toLowerCase().replace('.', '-')}">${subLevel || ''}</span>
        </div>

        ${dialogue.context ? `<p class="dialogue-context">${escapeHtml(dialogue.context)}</p>` : ''}

        <div style="display:flex;gap:.5rem;margin-bottom:1rem;flex-wrap:wrap;">
          <button class="btn btn-outline btn-sm" onclick="window._toggleAllDPT()">Mostrar/Ocultar traduções</button>
        </div>

        <div class="dialogue-container">${linesHtml}</div>

        ${keyPhrasesHtml ? `
        <div class="content-section" style="margin-top:1.5rem;">
          <h3>💬 Frases-chave</h3>
          ${keyPhrasesHtml}
        </div>` : ''}

        ${forvoHtml ? `
        <div class="content-section">
          <h3>🔊 Pronúncia no Forvo</h3>
          <div style="display:flex;gap:.5rem;flex-wrap:wrap;">${forvoHtml}</div>
        </div>` : ''}

        <label class="lesson-check ${isDone ? 'completed' : ''}" id="lessonCheckLabel" style="margin-top:1.5rem;">
          <input type="checkbox" id="lessonCheck" ${isDone ? 'checked' : ''}>
          <span>${isDone ? 'Lição concluída!' : 'Marcar como concluída'}</span>
        </label>
      </div>`;

    let allShown = false;
    window._toggleDPT = (i) => {
      const el = document.getElementById(`dpt_${i}`);
      if (el) el.classList.toggle('visible');
    };
    window._toggleAllDPT = () => {
      allShown = !allShown;
      (dialogue.lines || []).forEach((_, i) => {
        const el = document.getElementById(`dpt_${i}`);
        if (el) el.classList.toggle('visible', allShown);
      });
    };

    document.getElementById('lessonCheck').addEventListener('change', (e) => {
      if (e.target.checked) {
        ProgressStore.markLessonComplete(lang, 'conversation', subLevel, dialogueId);
        document.getElementById('lessonCheckLabel').classList.add('completed');
        document.querySelector('#lessonCheckLabel span').textContent = 'Lição concluída!';
      }
    });
  },
};

export default ConversationModule;
