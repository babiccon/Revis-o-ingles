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
  exercises: 'Exercícios',
};

const MODULE_ICONS = {
  grammar: '📖',
  vocabulary: '🔤',
  texts: '📄',
  conversation: '💬',
  writing: '✏️',
  pronunciation: '🔊',
  exercises: '🏋️',
};
const DATA_KEYS = {
  grammar: 'topics',
  vocabulary: 'categories',
  texts: 'texts',
  conversation: 'dialogues',
  writing: 'exercises',
  pronunciation: 'sections',
  exercises: 'exercises',
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

    // Compute overall totals
    const totalLessons = subLevels.reduce((s, sl) => s + bySubLevel[sl].total, 0);
    const doneLessons  = subLevels.reduce((s, sl) => s + bySubLevel[sl].done, 0);
    const overallPct   = totalLessons > 0 ? Math.round((doneLessons / totalLessons) * 100) : 0;

    // Helper: color class for a percentage
    const barClass = (pct) => pct >= 66 ? 'progress-bar-fill--high' : pct >= 33 ? 'progress-bar-fill--mid' : '';

    // Overall progress bar
    const overallHtml = `
      <div class="progress-overall">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:.4rem;">
          <span style="font-weight:600;">Progresso Geral</span>
          <span style="font-size:.9rem;color:var(--gray-500);">${doneLessons}/${totalLessons} lições • ${overallPct}%</span>
        </div>
        <div class="progress-bar-container" style="height:12px;">
          <div class="progress-bar-fill ${barClass(overallPct)}" style="width:${overallPct}%"></div>
        </div>
        ${overallPct === 100 ? '<p style="color:var(--success);font-weight:600;margin-top:.5rem;text-align:center;">🎉 Nível completo!</p>' : ''}
      </div>`;

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
        <div class="progress-card ${stats.dueToday > 0 ? 'progress-card--due' : ''}">
          <div class="number">${stats.dueToday}</div>
          <div class="label">Revisões Hoje</div>
        </div>
      </div>`;

    // Sub-level breakdown
    const subLevelHtml = subLevels.length ? `
      <h3 class="progress-section-title">Por Sub-nível</h3>
      ${subLevels.map(sl => {
        const { total, done, pct } = bySubLevel[sl];
        return `
          <div class="progress-sublevel-row">
            <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:.3rem;">
              <span><span class="level-badge ${sl.toLowerCase().replace('.', '-')}">${sl}</span></span>
              <span style="font-size:.85rem;color:var(--gray-500);">${done}/${total} lições (${pct}%)</span>
            </div>
            <div class="progress-bar-container">
              <div class="progress-bar-fill ${barClass(pct)}" style="width:${pct}%"></div>
            </div>
          </div>`;
      }).join('')}` : '';

    // Per-module breakdown
    const lessons = ProgressStore.loadLessons(lang);
    const moduleHtml = Object.keys(MODULE_LABELS).map(mod => {
      const d = allData[mod];
      if (!d) return '';
      const key = DATA_KEYS[mod];
      const items = d[key] || [];
      const done = items.filter(item => lessons[`${mod}_${item.sub_level}_${item.id}`]).length;
      const pct = items.length ? Math.round((done / items.length) * 100) : 0;
      return `
        <div class="progress-module-row">
          <div style="display:flex;justify-content:space-between;margin-bottom:.25rem;align-items:center;">
            <span style="font-size:.9rem;font-weight:500;">${MODULE_ICONS[mod]} ${MODULE_LABELS[mod]}</span>
            <span style="font-size:.8rem;color:var(--gray-500);">${done}/${items.length} ${pct === 100 ? '✓' : ''}</span>
          </div>
          <div class="progress-bar-container">
            <div class="progress-bar-fill ${barClass(pct)}" style="width:${pct}%"></div>
          </div>
        </div>`;
    }).join('');

    root.innerHTML = `
      <div class="module-header">
        <h2>Progresso — ${LANG_NAMES[lang]}</h2>
        <p class="module-desc">Acompanhe sua evolução por sub-nível e módulo.</p>
      </div>

      ${overallHtml}
      ${statsHtml}

      ${subLevelHtml ? `<div class="content-section">${subLevelHtml}</div>` : ''}

      ${moduleHtml ? `
        <div class="content-section">
          <h3 class="progress-section-title">Por Módulo</h3>
          ${moduleHtml}
        </div>` : ''}

      <div style="text-align:center;margin-top:2rem;padding-top:1.5rem;border-top:1px solid var(--gray-200);">
        <p style="font-size:.85rem;color:var(--gray-500);margin-bottom:.75rem;">
          Isso apaga todas as lições concluídas e flashcards estudados de ${LANG_NAMES[lang]}.
        </p>
        <button class="btn btn-outline" onclick="window._resetProgress()">
          🗑 Resetar progresso de ${LANG_NAMES[lang]}
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
