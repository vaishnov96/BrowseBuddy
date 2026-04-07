/**
 * BrowseBuddy — Chrome Storage Wrapper
 * Provides a clean async API over chrome.storage.sync and chrome.storage.local
 * All calls guard against "Extension context invalidated" after reload
 */
const BuddyStorage = (() => {
  const DEFAULTS = {
    coins: 0,
    streak: 0,
    lastActiveDate: null,
    lifetimeEarnings: 0,
    petLevel: 1,
    petXP: 0,
    petName: 'Buddy',
    petHappiness: 100,
    petSkin: 'default',
    petAccessories: [],
    referralCode: null,
    contextHistory: [],
    dialogueHistory: [],
    memeHistory: [],
    affiliateImpressions: [],
    affiliateConversions: [],
    settings: {
      contextDetection: true,
      affiliateSuggestions: true,
      searchQueryAnalysis: false,
      browsingHistorySync: false,
      soundEnabled: false,
      petVisible: true,
      petPosition: { x: null, y: null },
      onboardingComplete: false
    },
    privacyLog: [],
    birthday: null,
    installDate: null,
    petMood: { happy: 80, hungry: 30, sleepy: 20, playful: 60 },
    unlockedTricks: [],
    trickProgress: {},
    dailySpinDate: null,
    petSkins: ['default']
  };

  // Returns false when the extension has been reloaded and this script is orphaned
  function isContextValid() {
    try {
      return !!(chrome && chrome.runtime && chrome.runtime.id);
    } catch {
      return false;
    }
  }

  async function get(keys) {
    if (!isContextValid()) {
      // Return defaults so the pet keeps working visually even if storage is gone
      if (Array.isArray(keys)) {
        const merged = {};
        keys.forEach((k) => { merged[k] = DEFAULTS[k]; });
        return merged;
      }
      if (typeof keys === 'string') return DEFAULTS[keys];
      return {};
    }
    return new Promise((resolve) => {
      try {
        chrome.storage.sync.get(keys, (result) => {
          if (chrome.runtime.lastError) {
            console.warn('[BrowseBuddy] storage.get error:', chrome.runtime.lastError.message);
            // Fall back to defaults
            if (Array.isArray(keys)) {
              const merged = {};
              keys.forEach((k) => { merged[k] = DEFAULTS[k]; });
              resolve(merged);
            } else if (typeof keys === 'string') {
              resolve(DEFAULTS[keys]);
            } else {
              resolve({});
            }
            return;
          }
          if (Array.isArray(keys)) {
            const merged = {};
            keys.forEach((k) => {
              merged[k] = result[k] !== undefined ? result[k] : DEFAULTS[k];
            });
            resolve(merged);
          } else if (typeof keys === 'string') {
            resolve(result[keys] !== undefined ? result[keys] : DEFAULTS[keys]);
          } else {
            resolve(result);
          }
        });
      } catch {
        // Context invalidated mid-call
        if (typeof keys === 'string') resolve(DEFAULTS[keys]);
        else resolve({});
      }
    });
  }

  async function set(data) {
    if (!isContextValid()) return;
    return new Promise((resolve) => {
      try {
        chrome.storage.sync.set(data, () => {
          if (chrome.runtime.lastError) {
            console.warn('[BrowseBuddy] storage.set error:', chrome.runtime.lastError.message);
          }
          resolve();
        });
      } catch {
        resolve();
      }
    });
  }

  async function getLocal(keys) {
    if (!isContextValid()) return {};
    return new Promise((resolve) => {
      try {
        chrome.storage.local.get(keys, (result) => {
          if (chrome.runtime.lastError) { resolve({}); return; }
          resolve(result);
        });
      } catch {
        resolve({});
      }
    });
  }

  async function setLocal(data) {
    if (!isContextValid()) return;
    return new Promise((resolve) => {
      try {
        chrome.storage.local.set(data, () => {
          if (chrome.runtime.lastError) {}
          resolve();
        });
      } catch {
        resolve();
      }
    });
  }

  async function remove(keys) {
    if (!isContextValid()) return;
    return new Promise((resolve) => {
      try {
        chrome.storage.sync.remove(keys, resolve);
      } catch {
        resolve();
      }
    });
  }

  async function clearAll() {
    if (!isContextValid()) return;
    return new Promise((resolve) => {
      try {
        chrome.storage.sync.clear(() => {
          chrome.storage.local.clear(resolve);
        });
      } catch {
        resolve();
      }
    });
  }

  async function init() {
    if (!isContextValid()) return;
    const existing = await get(Object.keys(DEFAULTS));
    const toSet = {};
    for (const [key, defaultVal] of Object.entries(DEFAULTS)) {
      if (existing[key] === undefined || existing[key] === null) {
        toSet[key] = defaultVal;
      }
    }
    if (!toSet.installDate) {
      toSet.installDate = new Date().toISOString();
    }
    if (!toSet.referralCode) {
      toSet.referralCode = 'BB-' + Math.random().toString(36).substring(2, 10).toUpperCase();
    }
    if (Object.keys(toSet).length > 0) {
      await set(toSet);
    }
  }

  async function getSettings() {
    return get('settings');
  }

  async function updateSettings(partial) {
    const current = await getSettings();
    const merged = { ...current, ...partial };
    await set({ settings: merged });
    return merged;
  }

  async function addToContextHistory(context) {
    if (!isContextValid()) return;
    const history = await get('contextHistory') || [];
    history.push({ context, timestamp: Date.now() });
    if (history.length > 50) history.splice(0, history.length - 50);
    await set({ contextHistory: history });
  }

  return {
    DEFAULTS,
    isContextValid,
    get,
    set,
    getLocal,
    setLocal,
    remove,
    clearAll,
    init,
    getSettings,
    updateSettings,
    addToContextHistory
  };
})();
