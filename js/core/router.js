/**
 * Hash-based router for the LinguaStudy SPA.
 * Route format: #:lang/:module/:subLevel?/:lessonId?
 * Examples:
 *   #english/grammar
 *   #german/grammar/A1.1
 *   #german/grammar/A1.1/3
 *   #english/progress
 */

import { DataLoader } from '../data-loader.js';

const VALID_LANGS = ['german', 'english'];
const VALID_MODULES = ['grammar', 'vocabulary', 'texts', 'conversation', 'writing', 'pronunciation', 'exercises', 'progress'];

const Router = {
  /** @type {Object|null} Reference to the main App instance */
  app: null,

  /**
   * Initialize the router and attach the hashchange listener.
   * @param {Object} app - The main App instance (must expose setActiveTab, updateStatsBar)
   */
  init(app) {
    this.app = app;
    window.addEventListener('hashchange', () => this.handleRoute(location.hash));
    if (location.hash && location.hash !== '#') {
      this.handleRoute(location.hash);
    }
  },

  /**
   * Parse a location hash into its route components.
   * @param {string} hash - Raw hash string, e.g. '#german/grammar/A1.1/3'
   * @returns {{ lang: string, module: string, subLevel: string|null, lessonId: number|null }}
   */
  parseHash(hash) {
    const clean = (hash || '').replace(/^#\/?/, '');
    const [p0, p1, p2, p3] = clean.split('/');
    return {
      lang: VALID_LANGS.includes(p0) ? p0 : 'english',
      module: VALID_MODULES.includes(p1) ? p1 : 'grammar',
      subLevel: p2 || null,
      lessonId: p3 !== undefined ? parseInt(p3, 10) : null,
    };
  },

  /**
   * Handle a route change: update UI state, load data, render module.
   * @param {string} hash - The current location.hash value
   */
  async handleRoute(hash) {
    const { lang, module, subLevel, lessonId } = this.parseHash(hash);
    this.app.setActiveTab(lang, module);

    const root = document.getElementById('appRoot');
    root.innerHTML = '<div class="loading-state">Carregando...</div>';

    try {
      const [moduleExport, data] = await Promise.all([
        import(`../modules/${module}.js`),
        module !== 'progress' ? DataLoader.load(lang, module) : Promise.resolve(null),
      ]);

      moduleExport.default.render(lang, { subLevel, lessonId, data });
    } catch (err) {
      // Module not yet implemented or data file missing
      const isDataMissing = err.message && err.message.includes('Failed to load');
      root.innerHTML = `
        <div class="empty-state">
          <h3>${isDataMissing ? 'Conteúdo em construção' : 'Módulo em construção'}</h3>
          <p>${isDataMissing
            ? 'Os dados para este módulo ainda estão sendo preparados.'
            : 'Este módulo estará disponível em breve.'
          }</p>
        </div>`;
    }

    this.app.updateStatsBar();
  },
};

export { Router };
