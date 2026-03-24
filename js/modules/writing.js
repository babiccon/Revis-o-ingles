/**
 * Writing module renderer.
 * Shows writing prompts with a free-text textarea, word counter, hints, and example answers.
 */

import { escapeHtml } from '../core/utils.js';
import { ProgressStore } from '../core/progress.js';

const LANG_NAMES = { german: 'Alemão', english: 'Inglês' };

const WritingModule = {
  /**
   * Entry point called by the Router.
   * @param {string} lang
   * @param {{ subLevel: string|null, lessonId: number|null, data: Object }} params
   */
  render(lang, { subLevel, lessonId, data }) {
    if (lessonId !== null) {
      this.renderExercise(lang, data, subLevel, lessonId);
    } else {
      this.renderOverview(lang, data);
    }
  },

  /**
   * Show list of writing exercises grouped by sub-level.
   * @param {string} lang
   * @param {Object} data
   */
  renderOverview(lang, data) {
    const root = document.getElementById('appRoot');
    const exercises = data.exercises || [];
    const subLevels = [...new Set(exercises.map(e => e.sub_level))].sort();

    const sectionsHtml = subLevels.map(sl => {
      const items = exercises.filter(e => e.sub_level === sl);
      return `
        <div class="level-section">
          <h2><span class="level-badge ${sl.toLowerCase().replace('.', '-')}">${sl}</span></h2>
          <div class="topic-list">
            ${items.map(e => `
              <div class="topic-item" onclick="location.hash='#${lang}/writing/${sl}/${e.id}'">
                <div class="topic-name">${ProgressStore.isLessonComplete(lang,'writing',sl,e.id)?'✓ ':''}${escapeHtml(e.title_pt || e.title)}</div>
                <div class="topic-meta"><span>mín. ${e.min_words || 0} palavras</span></div>
              </div>`).join('')}
          </div>
        </div>`;
    }).join('');

    root.innerHTML = `
      <div class="module-header">
        <h2>Escrita — ${LANG_NAMES[lang]}</h2>
        <p class="module-desc">Exercícios de escrita livre com dicas, gabarito e autoavaliação.</p>
      </div>
      ${sectionsHtml || '<div class="empty-state"><h3>Conteúdo em construção</h3></div>'}`;
  },

  /**
   * Render a writing exercise with textarea and tools.
   * @param {string} lang
   * @param {Object} data
   * @param {string} subLevel
   * @param {number} exerciseId
   */
  renderExercise(lang, data, subLevel, exerciseId) {
    const root = document.getElementById('appRoot');
    const ex = (data.exercises || []).find(e => e.id === exerciseId);
    if (!ex) {
      root.innerHTML = '<div class="empty-state"><h3>Exercício não encontrado</h3></div>';
      return;
    }

    const isDone = ProgressStore.isLessonComplete(lang, 'writing', subLevel, exerciseId);
    const savedText = ProgressStore.loadWriting(lang)[exerciseId] || '';

    const hintsHtml = (ex.vocabulary_hints || []).map(h => `
      <div class="hint-row">
        <span class="hint-pt">${escapeHtml(h.pt)}</span>
        <span class="hint-arrow">→</span>
        <span class="hint-target">${escapeHtml(h.de || h.en || '')}</span>
      </div>`).join('');

    const checklistHtml = (ex.checklist || []).map(item => `
      <label class="checklist-item">
        <input type="checkbox"> <span>${escapeHtml(item)}</span>
      </label>`).join('');

    root.innerHTML = `
      <div class="content-detail">
        <div class="detail-header">
          <button class="back-btn" onclick="location.hash='#${lang}/writing'">← Voltar</button>
          <h2>${escapeHtml(ex.title_pt || ex.title)}</h2>
          <span class="level-badge ${(subLevel||'').toLowerCase().replace('.', '-')}">${subLevel || ''}</span>
        </div>

        <div class="writing-prompt">
          <strong>Tarefa:</strong> ${escapeHtml(ex.prompt_pt)}
          ${ex.prompt_de ? `<div style="margin-top:.4rem;color:var(--gray-600);font-style:italic;">${escapeHtml(ex.prompt_de)}</div>` : ''}
        </div>

        ${ex.grammar_focus?.length ? `
        <div class="content-section">
          <h3>📏 Foco Gramatical</h3>
          <ul class="rules-list">
            ${ex.grammar_focus.map(f => `<li>${escapeHtml(f)}</li>`).join('')}
          </ul>
        </div>` : ''}

        ${hintsHtml ? `
        <div class="content-section">
          <h3>💡 Dicas de Vocabulário</h3>
          <div class="hints-container">${hintsHtml}</div>
        </div>` : ''}

        <div class="content-section">
          <h3>✍️ Sua Resposta</h3>
          <textarea class="writing-textarea" id="writingInput" placeholder="Escreva aqui em ${lang === 'german' ? 'alemão' : 'inglês'}...">${escapeHtml(savedText)}</textarea>
          <div class="word-count">
            <span id="wordCount">0</span> palavras
            ${ex.min_words ? `<span style="color:var(--gray-400)"> (mínimo: ${ex.min_words})</span>` : ''}
          </div>
          <button class="btn btn-primary" style="margin-top:.75rem;" onclick="window._saveWriting()">Salvar</button>
          <span id="savedMsg" style="display:none;color:var(--success);margin-left:.75rem;">✓ Salvo!</span>
        </div>

        ${checklistHtml ? `
        <div class="content-section">
          <h3>✅ Lista de Verificação</h3>
          <div class="checklist">${checklistHtml}</div>
        </div>` : ''}

        <div class="content-section">
          <button class="btn btn-outline" onclick="window._toggleExample()">Ver Exemplo de Resposta</button>
          <div id="exampleAnswer" style="display:none;margin-top:1rem;">
            <div class="example-card">
              <span class="en">${escapeHtml(ex.example_answer || '')}</span>
              <span class="pt">${escapeHtml(ex.example_translation || '')}</span>
            </div>
          </div>
        </div>

        <label class="lesson-check ${isDone ? 'completed' : ''}" id="lessonCheckLabel" style="margin-top:1rem;">
          <input type="checkbox" id="lessonCheck" ${isDone ? 'checked' : ''}>
          <span>${isDone ? 'Exercício concluído!' : 'Marcar como concluído'}</span>
        </label>
      </div>`;

    // Word counter
    const textarea = document.getElementById('writingInput');
    const countEl = document.getElementById('wordCount');
    const updateCount = () => {
      const words = textarea.value.trim().split(/\s+/).filter(Boolean).length;
      countEl.textContent = words;
      countEl.style.color = (ex.min_words && words < ex.min_words) ? 'var(--warning)' : 'var(--success)';
    };
    updateCount();
    textarea.addEventListener('input', updateCount);

    window._saveWriting = () => {
      ProgressStore.saveWriting(lang, exerciseId, textarea.value);
      const msg = document.getElementById('savedMsg');
      msg.style.display = 'inline';
      setTimeout(() => { msg.style.display = 'none'; }, 2000);
    };

    window._toggleExample = () => {
      const el = document.getElementById('exampleAnswer');
      el.style.display = el.style.display === 'none' ? 'block' : 'none';
    };

    document.getElementById('lessonCheck').addEventListener('change', (e) => {
      if (e.target.checked) {
        ProgressStore.markLessonComplete(lang, 'writing', subLevel, exerciseId);
        document.getElementById('lessonCheckLabel').classList.add('completed');
        document.querySelector('#lessonCheckLabel span').textContent = 'Exercício concluído!';
      }
    });
  },
};

export default WritingModule;
