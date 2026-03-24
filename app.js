/**
 * LinguaStudy — Main application entry point.
 * Initializes navigation, module tabs, and the router.
 */

import { Router } from './js/core/router.js';
import { ProgressStore } from './js/core/progress.js';

// ─── Auth ─────────────────────────────────────────────────────────────────────
const AUTH_HASH = '05d1b50ba52e573d1e8609bbe413afb9f75d2e641326d3bcffcf4f17031cdefc';
const AUTH_KEY  = 'ls_auth_v1';

async function sha256(str) {
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(str));
  return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, '0')).join('');
}

function checkAuth() {
  if (sessionStorage.getItem(AUTH_KEY) === '1') return Promise.resolve();

  return new Promise((resolve) => {
    const overlay = document.getElementById('loginOverlay');
    const form    = document.getElementById('loginForm');
    const input   = document.getElementById('loginInput');
    const error   = document.getElementById('loginError');

    overlay.style.display = 'flex';

    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const hash = await sha256(input.value);
      if (hash === AUTH_HASH) {
        sessionStorage.setItem(AUTH_KEY, '1');
        overlay.style.display = 'none';
        resolve();
      } else {
        error.style.display = 'block';
        input.value = '';
        input.focus();
      }
    });
  });
}
// ──────────────────────────────────────────────────────────────────────────────

/** @type {Array<{ id: string, label: string }>} */
const MODULES = [
  { id: 'grammar',       label: 'Gramática'   },
  { id: 'vocabulary',    label: 'Vocabulário' },
  { id: 'texts',         label: 'Textos'      },
  { id: 'conversation',  label: 'Conversação' },
  { id: 'writing',       label: 'Escrita'     },
  { id: 'pronunciation', label: 'Pronúncia'   },
  { id: 'exercises',     label: 'Exercícios'  },
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

document.addEventListener('DOMContentLoaded', async () => {
  await checkAuth();
  App.init();
});

export { App, MODULES };
