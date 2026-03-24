/**
 * Exercises module renderer.
 * Supports 4 exercise types: dictation, word_order, fill_blank, translation.
 * Progress is saved via ProgressStore when the user completes each exercise.
 */

import { escapeHtml, speak, getLangCode, shuffleArray } from '../core/utils.js';
import { ProgressStore } from '../core/progress.js';

const LANG_NAMES = { german: 'Alemão', english: 'Inglês' };

const ExercisesModule = {
  /**
   * Entry point called by the Router.
   * @param {string} lang
   * @param {{ subLevel: string|null, lessonId: number|null, data: Object }} params
   */
  render(lang, { subLevel, lessonId, data }) {
    if (subLevel && lessonId !== null) {
      this.renderExercise(lang, data, subLevel, lessonId);
    } else if (subLevel) {
      this.renderSubLevelList(lang, data, subLevel);
    } else {
      this.renderOverview(lang, data);
    }
  },

  /**
   * Overview: list of sub-levels with exercise counts.
   * @param {string} lang
   * @param {Object} data
   */
  renderOverview(lang, data) {
    const root = document.getElementById('appRoot');
    const exercises = data.exercises || [];
    const subLevels = [...new Set(exercises.map(e => e.sub_level))].sort();

    const sectionsHtml = subLevels.map(sl => {
      const items = exercises.filter(e => e.sub_level === sl);
      const done = items.filter(e => ProgressStore.isLessonComplete(lang, 'exercises', sl, e.id)).length;
      return `
        <div class="level-section">
          <h2><span class="level-badge ${sl.toLowerCase().replace('.', '-')}">${sl}</span></h2>
          <div class="topic-list">
            <div class="topic-item" onclick="location.hash='#${lang}/exercises/${sl}'">
              <div class="topic-name">${done === items.length && items.length > 0 ? '✓ ' : ''}Exercícios ${sl}</div>
              <div class="topic-meta">
                <span>${done}/${items.length} concluídos</span>
              </div>
            </div>
          </div>
        </div>`;
    }).join('');

    root.innerHTML = `
      <div class="module-header">
        <h2>Exercícios — ${LANG_NAMES[lang]}</h2>
        <p class="module-desc">Ditado, ordem de palavras, lacunas e tradução para praticar.</p>
      </div>
      ${sectionsHtml || '<div class="empty-state"><h3>Conteúdo em construção</h3></div>'}`;
  },

  /**
   * Sub-level list: show each exercise as a card to click.
   * @param {string} lang
   * @param {Object} data
   * @param {string} subLevel
   */
  renderSubLevelList(lang, data, subLevel) {
    const root = document.getElementById('appRoot');
    const items = (data.exercises || []).filter(e => e.sub_level === subLevel);

    const TYPE_LABELS = {
      dictation: '🔊 Ditado',
      word_order: '🔤 Ordem',
      fill_blank: '✏️ Lacuna',
      translation: '🌐 Tradução',
    };

    const listHtml = items.map(e => {
      const done = ProgressStore.isLessonComplete(lang, 'exercises', subLevel, e.id);
      const label = TYPE_LABELS[e.type] || e.type;
      const preview = e.text || e.sentence || e.prompt_pt || (e.words || []).join(' ') || '';
      return `
        <div class="topic-item" onclick="location.hash='#${lang}/exercises/${subLevel}/${e.id}'">
          <div class="topic-name">${done ? '✓ ' : ''}<span class="exercise-type-badge">${label}</span> ${escapeHtml(preview.substring(0, 50))}${preview.length > 50 ? '…' : ''}</div>
          <div class="topic-meta"><span>${escapeHtml(e.instruction_pt || '')}</span></div>
        </div>`;
    }).join('');

    root.innerHTML = `
      <div class="content-detail">
        <div class="detail-header">
          <button class="back-btn" onclick="location.hash='#${lang}/exercises'">← Voltar</button>
          <h2>Exercícios</h2>
          <span class="level-badge ${subLevel.toLowerCase().replace('.', '-')}">${subLevel}</span>
        </div>
        <div class="topic-list">${listHtml || '<div class="empty-state"><h3>Sem exercícios neste nível</h3></div>'}</div>
      </div>`;
  },

  /**
   * Render a single exercise.
   * @param {string} lang
   * @param {Object} data
   * @param {string} subLevel
   * @param {number} exerciseId
   */
  renderExercise(lang, data, subLevel, exerciseId) {
    const ex = (data.exercises || []).find(e => e.id === exerciseId);
    if (!ex) {
      document.getElementById('appRoot').innerHTML = '<div class="empty-state"><h3>Exercício não encontrado</h3></div>';
      return;
    }

    const langCode = getLangCode(lang);
    window._exSpeak = (text) => speak(text, langCode);

    const allItems = (data.exercises || []).filter(e => e.sub_level === subLevel);
    const currentIndex = allItems.findIndex(e => e.id === exerciseId);
    const nextEx = allItems[currentIndex + 1] || null;
    const nextHash = nextEx
      ? `#${lang}/exercises/${subLevel}/${nextEx.id}`
      : `#${lang}/exercises/${subLevel}`;

    const isDone = ProgressStore.isLessonComplete(lang, 'exercises', subLevel, exerciseId);

    const bodyHtml = this._renderExerciseBody(ex, langCode, isDone);

    document.getElementById('appRoot').innerHTML = `
      <div class="content-detail">
        <div class="detail-header">
          <button class="back-btn" onclick="location.hash='#${lang}/exercises/${subLevel}'">← Voltar</button>
          <h2>Exercício ${currentIndex + 1} / ${allItems.length}</h2>
          <span class="level-badge ${subLevel.toLowerCase().replace('.', '-')}">${subLevel}</span>
        </div>
        <div class="exercise-card" id="exerciseCard">
          <p class="exercise-instruction">${escapeHtml(ex.instruction_pt || '')}</p>
          ${bodyHtml}
          <div id="exerciseFeedback" class="exercise-feedback" style="display:none;"></div>
          <div id="exerciseActions" class="exercise-actions">
            <button class="btn btn-primary" id="checkBtn">Verificar</button>
          </div>
          <div id="exerciseNext" style="display:none; margin-top:1rem;">
            <button class="btn btn-primary" onclick="location.hash='${nextHash}'">${nextEx ? 'Próximo →' : 'Concluir'}</button>
          </div>
        </div>
      </div>`;

    this._attachHandlers(ex, lang, subLevel, exerciseId, nextHash);
  },

  /**
   * Render the interactive body of an exercise based on its type.
   * @param {Object} ex
   * @param {string} langCode
   * @param {boolean} isDone
   * @returns {string} HTML
   */
  _renderExerciseBody(ex, langCode, isDone) {
    switch (ex.type) {
      case 'dictation': {
        const safe = (ex.text || '').replace(/'/g, "\\'");
        return `
          <div class="dictation-area">
            <button class="audio-btn" onclick="window._exSpeak('${safe}')" title="Ouvir frase">🔊 Ouvir</button>
            <input type="text" id="exInput" class="exercise-input" placeholder="Digite o que ouviu…" autocomplete="off" spellcheck="false">
          </div>`;
      }
      case 'word_order': {
        const shuffled = shuffleArray([...(ex.words || [])]);
        const chips = shuffled.map(w =>
          `<span class="word-chip" onclick="window._exChipClick(this)">${escapeHtml(w)}</span>`
        ).join('');
        return `
          <div class="word-order-zone" id="wordOrderZone"></div>
          <div class="word-order-bank" id="wordOrderBank">${chips}</div>`;
      }
      case 'fill_blank': {
        const parts = (ex.sentence || '').split('___');
        if (parts.length === 2) {
          return `
            <p class="exercise-sentence">${escapeHtml(parts[0])}<input type="text" id="exInput" class="exercise-input exercise-input--inline" autocomplete="off" spellcheck="false">${escapeHtml(parts[1])}</p>`;
        }
        return `<p class="exercise-sentence">${escapeHtml(ex.sentence || '')}</p>
          <input type="text" id="exInput" class="exercise-input" autocomplete="off" spellcheck="false">`;
      }
      case 'translation': {
        return `
          <p class="exercise-sentence exercise-sentence--pt">${escapeHtml(ex.prompt_pt || '')}</p>
          <input type="text" id="exInput" class="exercise-input" placeholder="Tradução…" autocomplete="off" spellcheck="false">`;
      }
      default:
        return '<p>Tipo de exercício desconhecido.</p>';
    }
  },

  /**
   * Attach event handlers for check/submit logic.
   * @param {Object} ex
   * @param {string} lang
   * @param {string} subLevel
   * @param {number} exerciseId
   * @param {string} nextHash
   */
  _attachHandlers(ex, lang, subLevel, exerciseId, nextHash) {
    // Word-order chip click handler
    if (ex.type === 'word_order') {
      window._exChipClick = (chip) => {
        const zone = document.getElementById('wordOrderZone');
        const bank = document.getElementById('wordOrderBank');
        if (chip.parentElement === bank) {
          zone.appendChild(chip);
        } else {
          bank.appendChild(chip);
        }
      };
    }

    const checkBtn = document.getElementById('checkBtn');
    if (checkBtn) {
      checkBtn.addEventListener('click', () => this._checkAnswer(ex, lang, subLevel, exerciseId));
    }

    // Allow pressing Enter to check (except word_order)
    if (ex.type !== 'word_order') {
      const input = document.getElementById('exInput');
      if (input) {
        input.addEventListener('keydown', (e) => {
          if (e.key === 'Enter') this._checkAnswer(ex, lang, subLevel, exerciseId);
        });
      }
    }
  },

  /**
   * Check the user's answer and display feedback.
   * @param {Object} ex
   * @param {string} lang
   * @param {string} subLevel
   * @param {number} exerciseId
   */
  _checkAnswer(ex, lang, subLevel, exerciseId) {
    const feedback = document.getElementById('exerciseFeedback');
    const actionsEl = document.getElementById('exerciseActions');
    const nextEl = document.getElementById('exerciseNext');

    let userAnswer = '';

    if (ex.type === 'word_order') {
      const zone = document.getElementById('wordOrderZone');
      userAnswer = [...zone.querySelectorAll('.word-chip')].map(c => c.textContent).join(' ');
    } else {
      const input = document.getElementById('exInput');
      userAnswer = input ? input.value.trim() : '';
    }

    if (!userAnswer) return;

    const correct = this._isCorrect(ex, userAnswer);
    const isDone = ProgressStore.isLessonComplete(lang, 'exercises', subLevel, exerciseId);

    if (correct && !isDone) {
      ProgressStore.markLessonComplete(lang, 'exercises', subLevel, exerciseId);
    }

    feedback.style.display = 'block';
    feedback.className = `exercise-feedback ${correct ? 'exercise-feedback--correct' : 'exercise-feedback--wrong'}`;
    feedback.innerHTML = correct
      ? `<strong>✓ Correto!</strong><br><span class="exercise-translation">${escapeHtml(ex.translation || '')}</span>`
      : `<strong>✗ Incorreto.</strong> Resposta: <em>${escapeHtml(ex.answer)}</em><br><span class="exercise-translation">${escapeHtml(ex.translation || '')}</span>`;

    actionsEl.style.display = 'none';
    nextEl.style.display = 'block';

    // Disable inputs
    const input = document.getElementById('exInput');
    if (input) input.disabled = true;
    document.querySelectorAll('.word-chip').forEach(c => c.style.pointerEvents = 'none');
  },

  /**
   * Check if userAnswer matches the expected answer for an exercise.
   * @param {Object} ex
   * @param {string} userAnswer
   * @returns {boolean}
   */
  _isCorrect(ex, userAnswer) {
    const normalize = (s) => s.trim().toLowerCase().replace(/[.,!?;:]/g, '').replace(/\s+/g, ' ');
    const norm = normalize(userAnswer);
    const normAnswer = normalize(ex.answer || '');
    if (norm === normAnswer) return true;
    const alts = (ex.alternatives || []).map(normalize);
    return alts.includes(norm);
  },
};

export default ExercisesModule;
