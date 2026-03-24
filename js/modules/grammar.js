/**
 * Grammar module renderer.
 * Milestone 2 will implement the full lesson/quiz/flashcard rendering.
 */

import { escapeHtml, speak, getLangCode } from '../core/utils.js';
import { ProgressStore } from '../core/progress.js';

const LANG_NAMES = { german: 'Alemão', english: 'Inglês' };

const GrammarModule = {
  /**
   * Entry point called by the Router.
   * @param {string} lang - 'german' or 'english'
   * @param {{ subLevel: string|null, lessonId: number|null, data: Object }} params
   */
  render(lang, { subLevel, lessonId, data }) {
    if (lessonId !== null && subLevel) {
      this.renderLesson(lang, data, subLevel, lessonId);
    } else if (subLevel) {
      this.renderSubLevelList(lang, data, subLevel);
    } else {
      this.renderOverview(lang, data);
    }
  },

  /**
   * Show all sub-levels with their lesson counts and completion progress.
   * @param {string} lang
   * @param {Object} data - grammar.json content
   */
  renderOverview(lang, data) {
    const root = document.getElementById('appRoot');
    const topics = data.topics || [];
    const subLevels = [...new Set(topics.map(t => t.sub_level))].sort();

    const sectionsHtml = subLevels.map(sl => {
      const items = topics.filter(t => t.sub_level === sl);
      const done = items.filter(t => ProgressStore.isLessonComplete(lang, 'grammar', sl, t.id)).length;
      const pct = items.length ? Math.round((done / items.length) * 100) : 0;

      return `
        <div class="level-section">
          <h2>
            <span class="level-badge ${sl.toLowerCase().replace('.', '-')}">${sl}</span>
            ${escapeHtml(sl)}
            <span class="sublevel-progress">${done}/${items.length} lições</span>
          </h2>
          <div class="progress-bar-container" style="margin-bottom:0.75rem;">
            <div class="progress-bar-fill" style="width:${pct}%"></div>
          </div>
          <div class="topic-list">
            ${items.map(t => this._topicItem(lang, sl, t)).join('')}
          </div>
        </div>`;
    }).join('');

    root.innerHTML = `
      <div class="module-header">
        <h2>Gramática — ${LANG_NAMES[lang]}</h2>
        <p class="module-desc">Lições estruturadas com teoria, exemplos e exercícios.</p>
      </div>
      ${sectionsHtml || '<div class="empty-state"><h3>Conteúdo em construção</h3></div>'}`;
  },

  /**
   * Show lessons for a specific sub-level.
   * @param {string} lang
   * @param {Object} data
   * @param {string} subLevel
   */
  renderSubLevelList(lang, data, subLevel) {
    const root = document.getElementById('appRoot');
    const topics = (data.topics || []).filter(t => t.sub_level === subLevel);

    root.innerHTML = `
      <div class="content-detail">
        <div class="detail-header">
          <button class="back-btn" onclick="history.back()">← Voltar</button>
          <h2><span class="level-badge ${subLevel.toLowerCase().replace('.', '-')}">${subLevel}</span> Gramática</h2>
        </div>
        <div class="topic-list">
          ${topics.map(t => this._topicItem(lang, subLevel, t)).join('')}
        </div>
      </div>`;
  },

  /**
   * Render a full lesson with theory, examples, and exercises.
   * @param {string} lang
   * @param {Object} data
   * @param {string} subLevel
   * @param {number} lessonId
   */
  renderLesson(lang, data, subLevel, lessonId) {
    const root = document.getElementById('appRoot');
    const topic = (data.topics || []).find(t => t.id === lessonId);
    if (!topic) {
      root.innerHTML = '<div class="empty-state"><h3>Lição não encontrada</h3></div>';
      return;
    }

    const isDone = ProgressStore.isLessonComplete(lang, 'grammar', subLevel, lessonId);
    const targetLang = lang === 'german' ? 'de' : 'en';
    const langCode = getLangCode(lang);
    window._speak = (text) => speak(text, langCode);

    root.innerHTML = `
      <div class="content-detail">
        <div class="detail-header">
          <button class="back-btn" onclick="location.hash='#${lang}/grammar/${subLevel}'">← Voltar</button>
          <h2>${escapeHtml(topic.title_pt || topic.topic)}</h2>
          <span class="level-badge ${subLevel.toLowerCase().replace('.', '-')}">${subLevel}</span>
        </div>

        ${topic.explanation ? `
        <div class="content-section explanation-section">
          <h3>📖 Explicação</h3>
          <div class="explanation-box">
            ${this._formatExplanation(topic.explanation)}
          </div>
        </div>` : ''}

        ${topic.rules?.length ? `
        <div class="content-section">
          <h3>📏 Regras</h3>
          <ul class="rules-list">
            ${topic.rules.map(r => this._formatRule(r)).join('')}
          </ul>
        </div>` : ''}

        ${topic.tips?.length ? `
        <div class="content-section">
          <h3>💡 Dicas Práticas</h3>
          <ul class="tips-list">
            ${topic.tips.map(tip => `<li>${escapeHtml(tip)}</li>`).join('')}
          </ul>
        </div>` : ''}

        ${topic.examples?.length ? `
        <div class="content-section">
          <h3>✏️ Exemplos</h3>
          ${topic.examples.map(ex => {
            const exText = ex[targetLang] || ex.de || ex.en || '';
            const safeEx = exText.replace(/'/g, "\\'");
            return `
            <div class="example-card">
              <span class="en">${escapeHtml(exText)}</span>
              ${exText ? `<button class="audio-btn audio-btn--sm" onclick="window._speak('${safeEx}')" title="Ouvir exemplo">🔊</button>` : ''}
              <span class="pt">${escapeHtml(ex.pt || '')}</span>
              ${ex.note ? `<span class="example-note">${escapeHtml(ex.note)}</span>` : ''}
            </div>`;
          }).join('')}
        </div>` : ''}

        ${topic.common_mistakes?.length ? `
        <div class="content-section">
          <h3>⚠️ Erros Comuns</h3>
          ${topic.common_mistakes.map(m => `
            <div class="mistake-card">
              <div class="wrong">✗ ${escapeHtml(m.wrong)}</div>
              <div class="correct">✓ ${escapeHtml(m.correct)}</div>
              <div class="mistake-explanation">${escapeHtml(m.explanation)}</div>
            </div>`).join('')}
        </div>` : ''}

        <div class="detail-actions">
          <button class="btn btn-primary" onclick="window._grammarStartFlashcards(${lessonId})">Flashcards</button>
          <button class="btn btn-outline" onclick="window._grammarStartQuiz(${lessonId})">Quiz</button>
        </div>

        <div id="exerciseArea"></div>

        <label class="lesson-check ${isDone ? 'completed' : ''}" id="lessonCheckLabel">
          <input type="checkbox" id="lessonCheck" ${isDone ? 'checked' : ''}>
          <span>${isDone ? 'Lição concluída!' : 'Marcar como concluída'}</span>
        </label>
      </div>`;

    document.getElementById('lessonCheck').addEventListener('change', (e) => {
      if (e.target.checked) {
        ProgressStore.markLessonComplete(lang, 'grammar', subLevel, lessonId);
        document.getElementById('lessonCheckLabel').classList.add('completed');
        document.querySelector('#lessonCheckLabel span').textContent = 'Lição concluída!';
      }
    });

    window._grammarStartFlashcards = (id) => this._startFlashcards(lang, topic);
    window._grammarStartQuiz = (id) => this._startQuiz(lang, topic, subLevel);
  },

  // ─── Flashcards ───────────────────────────────────────────────────────────

  /**
   * @param {string} lang
   * @param {Object} topic
   */
  _startFlashcards(lang, topic) {
    const area = document.getElementById('exerciseArea');
    const cards = topic.flashcards || [];
    if (!cards.length) {
      area.innerHTML = '<p style="color:var(--gray-500);margin-top:1rem;">Sem flashcards disponíveis.</p>';
      return;
    }
    let idx = 0;
    const render = () => {
      const card = cards[idx];
      const key = ProgressStore.getCardKey('grammar', topic.id, idx);
      area.innerHTML = `
        <div style="margin-top:1.5rem;">
          <h3 style="margin-bottom:0.75rem;">Flashcards (${idx + 1}/${cards.length})</h3>
          <div class="flashcard-area" style="perspective:1000px">
            <div class="flashcard" id="fc" style="cursor:pointer;transition:transform .6s;transform-style:preserve-3d;position:relative;min-height:180px;">
              <div class="flashcard-face flashcard-front" style="position:absolute;width:100%;min-height:180px;backface-visibility:hidden;display:flex;flex-direction:column;align-items:center;justify-content:center;padding:2rem;border-radius:12px;box-shadow:var(--shadow-lg);text-align:center;background:white;border:2px solid var(--gray-200);">
                <div class="card-text">${escapeHtml(card.front)}</div>
                <div class="card-hint">Clique para virar</div>
              </div>
              <div class="flashcard-face flashcard-back" style="position:absolute;width:100%;min-height:180px;backface-visibility:hidden;display:flex;flex-direction:column;align-items:center;justify-content:center;padding:2rem;border-radius:12px;box-shadow:var(--shadow-lg);text-align:center;background:linear-gradient(135deg,var(--primary-light),white);border:2px solid var(--primary);transform:rotateY(180deg);">
                <div class="card-text">${escapeHtml(card.back)}</div>
              </div>
            </div>
          </div>
          <div class="rating-buttons" id="fcRating" style="display:none;margin-top:1.25rem;">
            <button class="rating-btn wrong" onclick="window._fcRate(1)">Errei</button>
            <button class="rating-btn hard" onclick="window._fcRate(3)">Difícil</button>
            <button class="rating-btn medium" onclick="window._fcRate(4)">Médio</button>
            <button class="rating-btn easy" onclick="window._fcRate(5)">Fácil</button>
          </div>
          <div class="card-nav" style="margin-top:1rem;">
            <button class="btn btn-outline btn-sm" onclick="window._fcNav(-1)">Anterior</button>
            <span class="card-counter">${idx + 1}/${cards.length}</span>
            <button class="btn btn-outline btn-sm" onclick="window._fcNav(1)">Próximo</button>
          </div>
        </div>`;

      const fc = document.getElementById('fc');
      fc.addEventListener('click', () => {
        fc.style.transform = fc.style.transform === 'rotateY(180deg)' ? '' : 'rotateY(180deg)';
        document.getElementById('fcRating').style.display = 'flex';
      });
    };

    window._fcRate = (quality) => {
      ProgressStore.updateCard(lang, ProgressStore.getCardKey('grammar', topic.id, idx), quality);
      window._fcNav(1);
    };
    window._fcNav = (dir) => {
      idx = Math.max(0, Math.min(cards.length - 1, idx + dir));
      render();
    };
    render();
  },

  // ─── Quiz ─────────────────────────────────────────────────────────────────

  /**
   * @param {string} lang
   * @param {Object} topic
   * @param {string} subLevel
   */
  _startQuiz(lang, topic, subLevel) {
    const area = document.getElementById('exerciseArea');
    const questions = topic.quiz_questions || [];
    if (!questions.length) {
      area.innerHTML = '<p style="color:var(--gray-500);margin-top:1rem;">Sem perguntas disponíveis.</p>';
      return;
    }
    let idx = 0, score = 0;

    const renderQ = () => {
      if (idx >= questions.length) {
        area.innerHTML = `
          <div class="score-display" style="margin-top:1.5rem;">
            <div class="score-number">${score}/${questions.length}</div>
            <div class="score-label">respostas corretas</div>
            <div class="score-message">${score === questions.length ? 'Perfeito!' : score >= questions.length / 2 ? 'Bom trabalho!' : 'Continue praticando!'}</div>
            <button class="btn btn-primary" onclick="window._grammarStartQuiz(0)">Repetir Quiz</button>
          </div>`;
        return;
      }
      const q = questions[idx];
      area.innerHTML = `
        <div class="quiz-card" style="margin-top:1.5rem;">
          <div class="question-label">Pergunta ${idx + 1}/${questions.length}</div>
          <div class="question-text">${escapeHtml(q.question)}</div>
          <div id="qOpts">${this._renderQuizOptions(q)}</div>
          <div class="feedback" id="qFeedback"></div>
          <div style="text-align:center;margin-top:1rem;">
            <button class="btn btn-primary" id="qNext" style="display:none;" onclick="window._qNext()">Próxima</button>
          </div>
        </div>`;
      this._attachQuizHandlers(q, () => { idx++; score += window._lastCorrect ? 1 : 0; renderQ(); });
    };

    window._qNext = () => {};
    renderQ();
  },

  /**
   * @param {Object} q
   * @returns {string}
   */
  _renderQuizOptions(q) {
    if (q.type === 'multiple_choice') {
      return `<div class="quiz-options">${q.options.map((opt, i) =>
        `<button class="quiz-option" data-idx="${i}" onclick="window._qAnswer(${i})">${escapeHtml(opt)}</button>`
      ).join('')}</div>`;
    }
    return `<input class="fill-blank-input" id="fillInput" placeholder="Digite sua resposta...">
      <button class="btn btn-primary" style="margin-top:0.75rem;" onclick="window._qSubmit()">Confirmar</button>`;
  },

  /**
   * @param {Object} q
   * @param {Function} onNext
   */
  _attachQuizHandlers(q, onNext) {
    window._lastCorrect = false;
    const showFeedback = (correct, explanation) => {
      window._lastCorrect = correct;
      const fb = document.getElementById('qFeedback');
      fb.className = `feedback show ${correct ? 'correct' : 'incorrect'}`;
      fb.innerHTML = `<div class="correct-answer">${correct ? '✓ Correto!' : '✗ Incorreto'}</div>${explanation ? escapeHtml(explanation) : ''}`;
      document.getElementById('qNext').style.display = 'inline-flex';
      document.getElementById('qNext').onclick = onNext;
    };

    if (q.type === 'multiple_choice') {
      window._qAnswer = (idx) => {
        document.querySelectorAll('.quiz-option').forEach((btn, i) => {
          btn.classList.add('disabled');
          if (i === q.answer) btn.classList.add('correct');
          else if (i === idx && idx !== q.answer) btn.classList.add('incorrect');
        });
        showFeedback(idx === q.answer, q.explanation);
      };
    } else {
      window._qSubmit = () => {
        const input = document.getElementById('fillInput');
        const answer = input.value.trim();
        const correct = answer.toLowerCase() === (q.answer || '').toLowerCase();
        input.classList.add(correct ? 'correct' : 'incorrect');
        input.disabled = true;
        document.querySelector('.quiz-option ~ button, #fillInput ~ button').style.display = 'none';
        showFeedback(correct, (correct ? '' : `Resposta: ${q.answer}. `) + (q.explanation || ''));
      };
    }
  },

  // ─── Helpers ──────────────────────────────────────────────────────────────

  /**
   * Format an explanation string into readable paragraphs.
   * Splits on sentence boundaries before capital letters.
   * @param {string} text
   * @returns {string} HTML
   */
  _formatExplanation(text) {
    if (!text) return '';
    // Split into sentences: break after '. ' followed by uppercase or number
    const sentences = text.split(/(?<=[.!?])\s+(?=[A-ZÁÀÂÃÉÈÊÍÏÓÕÔÚÜ0-9"'])/u);
    return sentences.map(s => `<p class="explanation-para">${escapeHtml(s.trim())}</p>`).join('');
  },

  /**
   * Format a rule string — items ending in ':' become sub-headers.
   * @param {string} rule
   * @returns {string} HTML <li>
   */
  _formatRule(rule) {
    const trimmed = rule.trim();
    if (trimmed.endsWith(':') || (trimmed.endsWith(':') && trimmed.length < 50)) {
      return `<li class="rule-header">${escapeHtml(trimmed)}</li>`;
    }
    // Highlight text in single quotes as code-like span
    const html = escapeHtml(trimmed).replace(/'([^']+)'/g, '<code class="rule-code">$1</code>');
    return `<li>${html}</li>`;
  },

  /**
   * @param {string} lang
   * @param {string} subLevel
   * @param {Object} topic
   * @returns {string}
   */
  _topicItem(lang, subLevel, topic) {
    const done = ProgressStore.isLessonComplete(lang, 'grammar', subLevel, topic.id);
    return `
      <div class="topic-item" onclick="location.hash='#${lang}/grammar/${subLevel}/${topic.id}'">
        <div class="topic-name">${done ? '✓ ' : ''}${escapeHtml(topic.title_pt || topic.topic)}</div>
        <div class="topic-meta">
          <span>${(topic.flashcards || []).length} cards</span>
          <span>${(topic.quiz_questions || []).length} questões</span>
        </div>
      </div>`;
  },
};

export default GrammarModule;
