/**
 * LinguaStudy — Main application entry point.
 * Initializes navigation, module tabs, and the router.
 */

import { Router } from './js/core/router.js';
import { ProgressStore } from './js/core/progress.js';

/** @type {Array<{ id: string, label: string }>} */
const MODULES = [
  { id: 'grammar',       label: 'Gramática'   },
  { id: 'vocabulary',    label: 'Vocabulário' },
  { id: 'texts',         label: 'Textos'      },
  { id: 'conversation',  label: 'Conversação' },
  { id: 'writing',       label: 'Escrita'     },
  { id: 'pronunciation', label: 'Pronúncia'   },
  { id: 'progress',      label: 'Progresso'   },
];

const App = {
  currentLang: 'english',
  currentModule: 'grammar',

  /**
   * Bootstrap the application.
   */
  init() {
    this.renderModuleTabs();
    this.setupLangButtons();
    Router.init(this);
    if (!location.hash || location.hash === '#') {
      location.hash = '#english/grammar';
    }
    this.updateStatsBar();
  },

  /**
   * Render the module tab bar from the MODULES list.
   */
  renderModuleTabs() {
    const nav = document.getElementById('moduleTabs');
    nav.innerHTML = MODULES.map(m =>
      `<button class="tab-btn" data-module="${m.id}">${m.label}</button>`
    ).join('');

    nav.querySelectorAll('.tab-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        location.hash = `#${this.currentLang}/${btn.dataset.module}`;
      });
    });
  },

  /**
   * Set the visually active language button and module tab.
   * Called by the Router on every route change.
   * @param {string} lang - 'german' or 'english'
   * @param {string} module - Module id
   */
  setActiveTab(lang, module) {
    document.querySelectorAll('.lang-btn').forEach(b =>
      b.classList.toggle('active', b.dataset.lang === lang)
    );
    document.querySelectorAll('#moduleTabs .tab-btn').forEach(b =>
      b.classList.toggle('active', b.dataset.module === module)
    );
    this.currentLang = lang;
    this.currentModule = module;
  },

  /**
   * Attach click handlers to the language selector buttons in the header.
   */
  setupLangButtons() {
    document.querySelectorAll('.lang-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        location.hash = `#${btn.dataset.lang}/${this.currentModule}`;
      });
    });
  },

  /**
   * Refresh the stats bar with data from localStorage for the current language.
   */
  updateStatsBar() {
    const stats = ProgressStore.getStats(this.currentLang);
    document.getElementById('statStudied').textContent = stats.studied;
    document.getElementById('statMastered').textContent = stats.mastered;
    document.getElementById('statStreak').textContent = stats.streak;
    document.getElementById('statDueToday').textContent = stats.dueToday;
  },
};

document.addEventListener('DOMContentLoaded', () => App.init());

export { App, MODULES };
