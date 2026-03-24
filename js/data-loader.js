/**
 * Async JSON data loader with in-memory cache.
 * All content files live at data/{lang}/{module}.json.
 */

const DataLoader = {
  /** @type {Object.<string, Object>} In-memory cache keyed by "lang/module" */
  cache: {},

  /**
   * Load a content JSON file, using the cache if already loaded.
   * @param {string} lang - 'german' or 'english'
   * @param {string} module - e.g. 'grammar', 'vocabulary'
   * @returns {Promise<Object>} Parsed JSON data
   */
  async load(lang, module) {
    const key = `${lang}/${module}`;
    if (this.cache[key]) return this.cache[key];

    const url = `data/${lang}/${module}.json`;
    const res = await fetch(url);

    if (!res.ok) {
      throw new Error(`Failed to load ${url} (HTTP ${res.status})`);
    }

    const data = await res.json();
    this.cache[key] = data;
    return data;
  },

  /**
   * Attempt to preload all modules for a language in parallel.
   * Failed modules are silently ignored (they may not exist yet).
   * @param {string} lang
   * @returns {Promise<void>}
   */
  async preloadLanguage(lang) {
    const modules = ['grammar', 'vocabulary', 'texts', 'conversation', 'writing', 'pronunciation'];
    await Promise.allSettled(modules.map(m => this.load(lang, m)));
  },

  /**
   * Clear the in-memory cache (useful for testing).
   */
  clearCache() {
    this.cache = {};
  },
};

export { DataLoader };
