/**
 * Progress dashboard renderer.
 * Shows SM-2 stats, lesson completion by sub-level and module, and a reset button.
 */

import { ProgressStore } from '../core/progress.js';
import { DataLoader } from '../data-loader.js';

const LANG_NAMES = { german: 'Alemão', english: 'Inglês' };
const MODULE_LABELS = {
  grammar: 'Gramática',
  vocabulary: 'Vocabulário',
  texts: 'Textos',
  conversation: 'Conversação',
  writing: 'Escrita',
  pronunciation: 'Pronúncia',
};
const DATA_KEYS = {
  grammar: 'topics',
  vocabulary: 'categories',
  texts: 'texts',
  conversation: 'dialogues',
  writing: 'exercises',
  pronunciation: 'sections',
};

const ProgressView = {
  /**
   * Entry point called by the Router.
   * @param {string} lang
   * @param {{ data: null }} params - data is null for the progress module
   */
  async render(lang, { data }) {
    const root = document.getElementById('appRoot');
    root.innerHTML = '<div class="loading-state">Calculando progresso...</div>';

    // Load all module data to compute completion totals
    const allData = {};
    await Promise.allSettled(
      Object.keys(MODULE_LABELS).map(async (mod) => {
        try { allData[mod] = await DataLoader.load(lang, mod); } catch { /* module not available yet */ }
      })
    );

    const stats = ProgressStore.getStats(lang);
    const bySubLevel = ProgressStore.getProgressSummary(lang, allData);
    const subLevels = Object.keys(bySubLevel).sort();

    // Stats cards
    const statsHtml = `
      <div class="progress-grid">
        <div class="progress-card">
          <div class="number">${stats.studied}</div>
          <div class="label">Cards Estudados</div>
        </div>
        <div class="progress-card">
          <div class="number">${stats.mastered}</div>
          <div class="label">Dominados (SM-2)</div>
        </div>
        <div class="progress-card">
          <div class="number">${stats.streak}</div>
          <div class="label">Dias Seguidos</div>
        </div>
        <div class="progress-card">
          <div class="number">${stats.dueToday}</div>
          <div class="label">Revisões Hoje</div>
        </div>
      </div>`;

    // Sub-level breakdown
    const subLevelHtml = subLevels.length ? `
      <h3 style="margin:1.5rem 0 .75rem;">Progresso por Sub-nível</h3>
      ${subLevels.map(sl => {
        const { total, done, pct } = bySubLevel[sl];
        return `
          <div style="margin-bottom:1rem;">
            <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:.25rem;">
              <span><span class="level-badge ${sl.toLowerCase().replace('.', '-')}">${sl}</span></span>
              <span style="font-size:.85rem;color:var(--gray-500);">${done}/${total} lições (${pct}%)</span>
            </div>
            <div class="progress-bar-container">
              <div class="progress-bar-fill" style="width:${pct}%"></div>
            </div>
          </div>`;
      }).join('')}` : '';

    // Per-module breakdown
    const moduleHtml = Object.keys(MODULE_LABELS).map(mod => {
      const d = allData[mod];
      if (!d) return '';
      const key = DATA_KEYS[mod];
      const items = d[key] || [];
      const lessons = ProgressStore.loadLessons(lang);
      const done = items.filter(item =>
        lessons[`${mod}_${item.sub_level}_${item.id}`]
      ).length;
      const pct = items.length ? Math.round((done / items.length) * 100) : 0;
      return `
        <div style="margin-bottom:.75rem;">
          <div style="display:flex;justify-content:space-between;margin-bottom:.2rem;">
            <span style="font-size:.9rem;font-weight:500;">${MODULE_LABELS[mod]}</span>
            <span style="font-size:.8rem;color:var(--gray-500);">${done}/${items.length}</span>
          </div>
          <div class="progress-bar-container">
            <div class="progress-bar-fill" style="width:${pct}%"></div>
          </div>
        </div>`;
    }).join('');

    root.innerHTML = `
      <div class="module-header">
        <h2>Progresso — ${LANG_NAMES[lang]}</h2>
      </div>

      ${statsHtml}

      ${subLevelHtml}

      ${moduleHtml ? `<h3 style="margin:1.5rem 0 .75rem;">Progresso por Módulo</h3>${moduleHtml}` : ''}

      <div style="text-align:center;margin-top:2rem;padding-top:1.5rem;border-top:1px solid var(--gray-200);">
        <button class="btn btn-outline" onclick="window._resetProgress()">
          Resetar progresso do ${LANG_NAMES[lang]}
        </button>
      </div>`;

    window._resetProgress = () => {
      if (confirm(`Tem certeza que quer apagar TODO o progresso de ${LANG_NAMES[lang]}? Esta ação não pode ser desfeita.`)) {
        ProgressStore.reset(lang);
        location.reload();
      }
    };
  },
};

export default ProgressView;
