/**
 * Vocabulary module renderer.
 * Shows themed word lists, flashcards, and association exercises.
 */

import { escapeHtml, shuffleArray } from '../core/utils.js';
import { ProgressStore } from '../core/progress.js';

const LANG_NAMES = { german: 'Alemão', english: 'Inglês' };

const VocabularyModule = {
  /**
   * Entry point called by the Router.
   * @param {string} lang
   * @param {{ subLevel: string|null, lessonId: number|null, data: Object }} params
   */
  render(lang, { subLevel, lessonId, data }) {
    if (lessonId !== null && subLevel) {
      this.renderCategory(lang, data, subLevel, lessonId);
    } else if (subLevel) {
      this.renderSubLevelList(lang, data, subLevel);
    } else {
      this.renderOverview(lang, data);
    }
  },

  /**
   * Show all sub-levels grouped with category counts.
   * @param {string} lang
   * @param {Object} data
   */
  renderOverview(lang, data) {
    const root = document.getElementById('appRoot');
    const categories = data.categories || [];
    const subLevels = [...new Set(categories.map(c => c.sub_level))].sort();

    const sectionsHtml = subLevels.map(sl => {
      const items = categories.filter(c => c.sub_level === sl);
      const done = items.filter(c => ProgressStore.isLessonComplete(lang, 'vocabulary', sl, c.id)).length;
      const pct = items.length ? Math.round((done / items.length) * 100) : 0;

      return `
        <div class="level-section">
          <h2>
            <span class="level-badge ${sl.toLowerCase().replace('.', '-')}">${sl}</span>
            ${escapeHtml(sl)}
            <span class="sublevel-progress">${done}/${items.length} categorias</span>
          </h2>
          <div class="progress-bar-container" style="margin-bottom:0.75rem;">
            <div class="progress-bar-fill" style="width:${pct}%"></div>
          </div>
          <div class="topic-list">
            ${items.map(c => this._categoryItem(lang, sl, c)).join('')}
          </div>
        </div>`;
    }).join('');

    root.innerHTML = `
      <div class="module-header">
        <h2>Vocabulário — ${LANG_NAMES[lang]}</h2>
        <p class="module-desc">Palavras organizadas por tema com flashcards e exercícios de associação.</p>
      </div>
      ${sectionsHtml || '<div class="empty-state"><h3>Conteúdo em construção</h3></div>'}`;
  },

  /**
   * @param {string} lang
   * @param {Object} data
   * @param {string} subLevel
   */
  renderSubLevelList(lang, data, subLevel) {
    const root = document.getElementById('appRoot');
    const categories = (data.categories || []).filter(c => c.sub_level === subLevel);

    root.innerHTML = `
      <div class="content-detail">
        <div class="detail-header">
          <button class="back-btn" onclick="history.back()">← Voltar</button>
          <h2><span class="level-badge ${subLevel.toLowerCase().replace('.', '-')}">${subLevel}</span> Vocabulário</h2>
        </div>
        <div class="topic-list">
          ${categories.map(c => this._categoryItem(lang, subLevel, c)).join('')}
        </div>
      </div>`;
  },

  /**
   * Render a full vocabulary category with word list, flashcards, and association.
   * @param {string} lang
   * @param {Object} data
   * @param {string} subLevel
   * @param {number} catId
   */
  renderCategory(lang, data, subLevel, catId) {
    const root = document.getElementById('appRoot');
    const cat = (data.categories || []).find(c => c.id === catId);
    if (!cat) {
      root.innerHTML = '<div class="empty-state"><h3>Categoria não encontrada</h3></div>';
      return;
    }

    const targetLang = lang === 'german' ? 'de' : 'en';
    const isDone = ProgressStore.isLessonComplete(lang, 'vocabulary', subLevel, catId);

    const wordsHtml = (cat.words || []).map(w => `
      <div class="vocab-word-row">
        <div class="vocab-term">
          ${w.article ? `<span class="vocab-article">${escapeHtml(w.article)}</span> ` : ''}${escapeHtml(w[targetLang] || w.de || w.en || '')}
          ${w.plural ? `<span class="vocab-plural">(pl: ${escapeHtml(w.plural)})</span>` : ''}
        </div>
        <div class="vocab-translation">${escapeHtml(w.pt)}</div>
        <div class="vocab-example">${escapeHtml(w[`example_${targetLang}`] || w.example_de || w.example_en || w.example || '')}</div>
      </div>`).join('');

    root.innerHTML = `
      <div class="content-detail">
        <div class="detail-header">
          <button class="back-btn" onclick="location.hash='#${lang}/vocabulary/${subLevel}'">← Voltar</button>
          <h2>${escapeHtml(cat.title_pt || cat.category)}</h2>
          <span class="level-badge ${subLevel.toLowerCase().replace('.', '-')}">${subLevel}</span>
        </div>

        <div class="content-section">
          <h3>📚 Palavras</h3>
          <div class="vocab-word-list">${wordsHtml}</div>
        </div>

        <div class="detail-actions">
          <button class="btn btn-primary" onclick="window._vocabFlashcards()">Flashcards</button>
          <button class="btn btn-outline" onclick="window._vocabAssociation()">Associação</button>
        </div>

        <div id="exerciseArea"></div>

        <label class="lesson-check ${isDone ? 'completed' : ''}" id="lessonCheckLabel" style="margin-top:1.5rem;">
          <input type="checkbox" id="lessonCheck" ${isDone ? 'checked' : ''}>
          <span>${isDone ? 'Concluído!' : 'Marcar como concluído'}</span>
        </label>
      </div>`;

    document.getElementById('lessonCheck').addEventListener('change', (e) => {
      if (e.target.checked) {
        ProgressStore.markLessonComplete(lang, 'vocabulary', subLevel, catId);
        document.getElementById('lessonCheckLabel').classList.add('completed');
        document.querySelector('#lessonCheckLabel span').textContent = 'Concluído!';
      }
    });

    window._vocabFlashcards = () => this._startFlashcards(lang, cat);
    window._vocabAssociation = () => this._startAssociation(lang, cat);
  },

  /**
   * @param {string} lang
   * @param {Object} cat
   */
  _startFlashcards(lang, cat) {
    const area = document.getElementById('exerciseArea');
    const cards = cat.flashcards || [];
    if (!cards.length) {
      area.innerHTML = '<p style="color:var(--gray-500);margin-top:1rem;">Sem flashcards.</p>';
      return;
    }
    let idx = 0;
    const render = () => {
      const card = cards[idx];
      area.innerHTML = `
        <div style="margin-top:1.5rem;">
          <h3 style="margin-bottom:0.75rem;">Flashcards (${idx + 1}/${cards.length})</h3>
          <div class="flashcard-area" style="perspective:1000px">
            <div id="fc" class="flashcard" style="cursor:pointer;transition:transform .6s;transform-style:preserve-3d;position:relative;min-height:180px;">
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
            <button class="rating-btn wrong" onclick="window._vfcRate(1)">Errei</button>
            <button class="rating-btn hard" onclick="window._vfcRate(3)">Difícil</button>
            <button class="rating-btn medium" onclick="window._vfcRate(4)">Médio</button>
            <button class="rating-btn easy" onclick="window._vfcRate(5)">Fácil</button>
          </div>
          <div class="card-nav" style="margin-top:1rem;">
            <button class="btn btn-outline btn-sm" onclick="window._vfcNav(-1)">Anterior</button>
            <span class="card-counter">${idx + 1}/${cards.length}</span>
            <button class="btn btn-outline btn-sm" onclick="window._vfcNav(1)">Próximo</button>
          </div>
        </div>`;

      document.getElementById('fc').addEventListener('click', function() {
        this.style.transform = this.style.transform === 'rotateY(180deg)' ? '' : 'rotateY(180deg)';
        document.getElementById('fcRating').style.display = 'flex';
      });
    };

    window._vfcRate = (q) => {
      ProgressStore.updateCard(lang, ProgressStore.getCardKey('vocabulary', cat.id, idx), q);
      window._vfcNav(1);
    };
    window._vfcNav = (d) => { idx = Math.max(0, Math.min(cards.length - 1, idx + d)); render(); };
    render();
  },

  /**
   * Association exercise: click to match pairs.
   * @param {string} lang
   * @param {Object} cat
   */
  _startAssociation(lang, cat) {
    const area = document.getElementById('exerciseArea');
    const pairs = cat.association_pairs || (cat.words || []).slice(0, 6).map(w => ({
      de: w.de || w.en || '',
      pt: w.pt,
    }));

    if (pairs.length < 2) {
      area.innerHTML = '<p style="color:var(--gray-500);margin-top:1rem;">Sem pares disponíveis.</p>';
      return;
    }

    const lefts = shuffleArray([...pairs].map(p => ({ text: p.de || p.en, id: pairs.indexOf(p) })));
    const rights = shuffleArray([...pairs].map(p => ({ text: p.pt, id: pairs.indexOf(p) })));
    let selected = null;
    let matched = new Set();

    const render = () => {
      area.innerHTML = `
        <div style="margin-top:1.5rem;">
          <h3 style="margin-bottom:0.75rem;">Exercício de Associação</h3>
          <p style="color:var(--gray-500);font-size:.85rem;margin-bottom:1rem;">Clique em uma palavra de cada lado para combiná-las.</p>
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:0.5rem;">
            <div>${lefts.map(l => `
              <button class="assoc-btn ${matched.has('l'+l.id)?'matched':''} ${selected&&selected.side==='l'&&selected.id===l.id?'selected':''}"
                data-side="l" data-id="${l.id}" onclick="window._assocClick('l',${l.id})" ${matched.has('l'+l.id)?'disabled':''}>
                ${escapeHtml(l.text)}
              </button>`).join('')}
            </div>
            <div>${rights.map(r => `
              <button class="assoc-btn ${matched.has('r'+r.id)?'matched':''} ${selected&&selected.side==='r'&&selected.id===r.id?'selected':''}"
                data-side="r" data-id="${r.id}" onclick="window._assocClick('r',${r.id})" ${matched.has('r'+r.id)?'disabled':''}>
                ${escapeHtml(r.text)}
              </button>`).join('')}
            </div>
          </div>
          ${matched.size === pairs.length * 2 ? `<div class="feedback show correct" style="margin-top:1rem;"><strong>Parabéns! Todos os pares combinados!</strong></div>` : ''}
        </div>`;
    };

    window._assocClick = (side, id) => {
      if (!selected) {
        selected = { side, id };
      } else if (selected.side === side) {
        selected = { side, id };
      } else {
        if (selected.id === id) {
          matched.add('l' + id);
          matched.add('r' + id);
        }
        selected = null;
      }
      render();
    };
    render();
  },

  // ─── Helpers ──────────────────────────────────────────────────────────────

  /**
   * @param {string} lang
   * @param {string} subLevel
   * @param {Object} cat
   * @returns {string}
   */
  _categoryItem(lang, subLevel, cat) {
    const done = ProgressStore.isLessonComplete(lang, 'vocabulary', subLevel, cat.id);
    return `
      <div class="topic-item" onclick="location.hash='#${lang}/vocabulary/${subLevel}/${cat.id}'">
        <div class="topic-name">${done ? '✓ ' : ''}${escapeHtml(cat.title_pt || cat.category)}</div>
        <div class="topic-meta">
          <span>${(cat.words || []).length} palavras</span>
          <span>${(cat.flashcards || []).length} cards</span>
        </div>
      </div>`;
  },
};

export default VocabularyModule;
