/**
 * Texts module renderer.
 * Shows reading texts with highlighted vocabulary tooltips and comprehension questions.
 */

import { escapeHtml } from '../core/utils.js';
import { ProgressStore } from '../core/progress.js';

const LANG_NAMES = { german: 'Alemão', english: 'Inglês' };

const TextsModule = {
  /**
   * Entry point called by the Router.
   * @param {string} lang
   * @param {{ subLevel: string|null, lessonId: number|null, data: Object }} params
   */
  render(lang, { subLevel, lessonId, data }) {
    if (lessonId !== null) {
      this.renderText(lang, data, subLevel, lessonId);
    } else {
      this.renderOverview(lang, data);
    }
  },

  /**
   * Show list of all texts grouped by sub-level.
   * @param {string} lang
   * @param {Object} data
   */
  renderOverview(lang, data) {
    const root = document.getElementById('appRoot');
    const texts = data.texts || [];
    const subLevels = [...new Set(texts.map(t => t.sub_level))].sort();

    const sectionsHtml = subLevels.map(sl => {
      const items = texts.filter(t => t.sub_level === sl);
      return `
        <div class="level-section">
          <h2><span class="level-badge ${sl.toLowerCase().replace('.', '-')}">${sl}</span></h2>
          <div class="topic-list">
            ${items.map(t => `
              <div class="topic-item" onclick="location.hash='#${lang}/texts/${sl}/${t.id}'">
                <div class="topic-name">${ProgressStore.isLessonComplete(lang,'texts',sl,t.id)?'✓ ':''}${escapeHtml(t.title_pt || t.title)}</div>
                <div class="topic-meta"><span>${(t.content||[]).length} frases</span></div>
              </div>`).join('')}
          </div>
        </div>`;
    }).join('');

    root.innerHTML = `
      <div class="module-header">
        <h2>Textos — ${LANG_NAMES[lang]}</h2>
        <p class="module-desc">Textos curtos com vocabulário destacado e questões de compreensão.</p>
      </div>
      ${sectionsHtml || '<div class="empty-state"><h3>Conteúdo em construção</h3></div>'}`;
  },

  /**
   * Render a full text with vocab tooltips and comprehension quiz.
   * @param {string} lang
   * @param {Object} data
   * @param {string} subLevel
   * @param {number} textId
   */
  renderText(lang, data, subLevel, textId) {
    const root = document.getElementById('appRoot');
    const text = (data.texts || []).find(t => t.id === textId);
    if (!text) {
      root.innerHTML = '<div class="empty-state"><h3>Texto não encontrado</h3></div>';
      return;
    }

    const isDone = ProgressStore.isLessonComplete(lang, 'texts', subLevel, textId);

    const paragraphsHtml = (text.content || []).map((sentence, si) => {
      let html = escapeHtml(sentence.sentence);
      (sentence.vocabulary || []).forEach(v => {
        const escaped = escapeHtml(v.word);
        const tooltip = escapeHtml(v.translation + (v.note ? ` — ${v.note}` : ''));
        html = html.replace(escaped, `<span class="vocab-word">${escaped}<span class="vocab-tooltip">${tooltip}</span></span>`);
      });

      return `
        <div class="text-sentence">
          <p class="sentence-text">${html}</p>
          <button class="toggle-translation-btn" onclick="window._toggleTranslation(${si})">▸ Tradução</button>
          <p class="sentence-translation" id="tr_${si}" style="display:none;">${escapeHtml(sentence.translation)}</p>
        </div>`;
    }).join('');

    root.innerHTML = `
      <div class="content-detail">
        <div class="detail-header">
          <button class="back-btn" onclick="location.hash='#${lang}/texts'">← Voltar</button>
          <h2>${escapeHtml(text.title_pt || text.title)}</h2>
          <span class="level-badge ${(subLevel||'').toLowerCase().replace('.', '-')}">${subLevel || ''}</span>
        </div>

        <div class="content-section">
          <div id="textContent">${paragraphsHtml}</div>
          <button class="btn btn-outline btn-sm" style="margin-top:0.75rem;" onclick="window._toggleAllTranslations()">
            Mostrar/Ocultar todas as traduções
          </button>
        </div>

        <div class="content-section" id="comprehensionSection">
          <h3>🔍 Questões de Compreensão</h3>
          <div id="comprehensionQuiz"></div>
          <button class="btn btn-primary" onclick="window._startComprehension()">Responder</button>
        </div>

        <label class="lesson-check ${isDone ? 'completed' : ''}" id="lessonCheckLabel">
          <input type="checkbox" id="lessonCheck" ${isDone ? 'checked' : ''}>
          <span>${isDone ? 'Lição concluída!' : 'Marcar como concluída'}</span>
        </label>
      </div>`;

    let allShown = false;
    window._toggleTranslation = (si) => {
      const el = document.getElementById(`tr_${si}`);
      el.style.display = el.style.display === 'none' ? 'block' : 'none';
    };
    window._toggleAllTranslations = () => {
      allShown = !allShown;
      (text.content || []).forEach((_, si) => {
        const el = document.getElementById(`tr_${si}`);
        if (el) el.style.display = allShown ? 'block' : 'none';
      });
    };
    window._startComprehension = () => this._renderComprehension(lang, text, subLevel, textId);

    document.getElementById('lessonCheck').addEventListener('change', (e) => {
      if (e.target.checked) {
        ProgressStore.markLessonComplete(lang, 'texts', subLevel, textId);
        document.getElementById('lessonCheckLabel').classList.add('completed');
        document.querySelector('#lessonCheckLabel span').textContent = 'Lição concluída!';
      }
    });
  },

  /**
   * Render comprehension questions inline.
   * @param {string} lang
   * @param {Object} text
   * @param {string} subLevel
   * @param {number} textId
   */
  _renderComprehension(lang, text, subLevel, textId) {
    const container = document.getElementById('comprehensionQuiz');
    const btn = document.querySelector('#comprehensionSection button');
    if (btn) btn.style.display = 'none';

    const questions = text.comprehension_questions || [];
    let idx = 0;

    const renderQ = () => {
      if (idx >= questions.length) {
        container.innerHTML = `<div class="feedback show correct"><strong>Concluído! Todas as perguntas respondidas.</strong></div>`;
        return;
      }
      const q = questions[idx];

      if (q.type === 'true_false') {
        container.innerHTML = `
          <div class="quiz-card">
            <div class="question-label">Verdadeiro ou Falso — ${idx + 1}/${questions.length}</div>
            <div class="question-text">${escapeHtml(q.question)}</div>
            <div class="quiz-options">
              <button class="quiz-option" onclick="window._tfAnswer(true)">Verdadeiro</button>
              <button class="quiz-option" onclick="window._tfAnswer(false)">Falso</button>
            </div>
            <div class="feedback" id="tfFeedback"></div>
          </div>`;
        window._tfAnswer = (ans) => {
          const correct = ans === q.answer;
          document.querySelectorAll('.quiz-option').forEach(b => {
            b.classList.add('disabled');
            if (b.textContent === 'Verdadeiro' && q.answer) b.classList.add('correct');
            if (b.textContent === 'Falso' && !q.answer) b.classList.add('correct');
            if (b.textContent === 'Verdadeiro' && !q.answer && ans) b.classList.add('incorrect');
            if (b.textContent === 'Falso' && q.answer && !ans) b.classList.add('incorrect');
          });
          const fb = document.getElementById('tfFeedback');
          fb.className = `feedback show ${correct ? 'correct' : 'incorrect'}`;
          fb.innerHTML = `${correct ? '✓ Correto!' : '✗ Incorreto.'} ${escapeHtml(q.explanation || '')}
            <div style="margin-top:.5rem;"><button class="btn btn-primary btn-sm" onclick="(function(){idx++;renderQ()})()">Próxima</button></div>`;
          container.querySelector('button[onclick]')?.remove();
          document.querySelector('#tfFeedback .btn')?.addEventListener('click', () => { idx++; renderQ(); });
        };
        return;
      }

      // multiple_choice
      container.innerHTML = `
        <div class="quiz-card">
          <div class="question-label">Compreensão — ${idx + 1}/${questions.length}</div>
          <div class="question-text">${escapeHtml(q.question)}</div>
          <div class="quiz-options">
            ${q.options.map((opt, i) =>
              `<button class="quiz-option" onclick="window._mcAnswer(${i})">${escapeHtml(opt)}</button>`
            ).join('')}
          </div>
          <div class="feedback" id="mcFeedback"></div>
        </div>`;

      window._mcAnswer = (chosen) => {
        document.querySelectorAll('.quiz-option').forEach((b, i) => {
          b.classList.add('disabled');
          if (i === q.answer) b.classList.add('correct');
          else if (i === chosen) b.classList.add('incorrect');
        });
        const fb = document.getElementById('mcFeedback');
        const correct = chosen === q.answer;
        fb.className = `feedback show ${correct ? 'correct' : 'incorrect'}`;
        fb.innerHTML = `${correct ? '✓ Correto!' : '✗ Incorreto.'} ${escapeHtml(q.explanation || '')}`;
        setTimeout(() => { idx++; renderQ(); }, 1500);
      };
    };
    renderQ();
  },
};

export default TextsModule;
