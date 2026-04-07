/**
 * BrowseBuddy — Options / Settings Page
 */
document.addEventListener('DOMContentLoaded', async () => {
  setupTabs();
  await loadSettings();
  await loadPrivacy();
  await loadRewards();
  renderSkinPreviews();
  setupEventHandlers();
  checkOnboarding();
});

// ===================== TABS =====================
function setupTabs() {
  const tabs = document.querySelectorAll('.tab');
  tabs.forEach((tab) => {
    tab.addEventListener('click', () => {
      tabs.forEach((t) => t.classList.remove('active'));
      document.querySelectorAll('.tab-content').forEach((c) => c.classList.remove('active'));
      tab.classList.add('active');
      document.getElementById('tab-' + tab.dataset.tab).classList.add('active');
    });
  });

  // Check URL params for specific tab
  const params = new URLSearchParams(window.location.search);
  const tabParam = params.get('tab');
  if (tabParam) {
    tabs.forEach((t) => t.classList.remove('active'));
    document.querySelectorAll('.tab-content').forEach((c) => c.classList.remove('active'));
    const targetTab = document.querySelector(`.tab[data-tab="${tabParam}"]`);
    const targetContent = document.getElementById('tab-' + tabParam);
    if (targetTab && targetContent) {
      targetTab.classList.add('active');
      targetContent.classList.add('active');
    }
  }
}

// ===================== ONBOARDING =====================
async function checkOnboarding() {
  const params = new URLSearchParams(window.location.search);
  if (params.get('onboarding') === 'true') {
    const data = await chrome.storage.sync.get(['settings']);
    const settings = data.settings || {};
    if (!settings.onboardingComplete) {
      showOnboarding();
    }
  }
}

function showOnboarding() {
  const modal = document.getElementById('onboardingModal');
  modal.style.display = 'flex';

  // Draw pet in onboarding
  const canvas = document.getElementById('onboardingPetCanvas');
  if (canvas) drawMiniPet(canvas);

  document.getElementById('onboardingDone').addEventListener('click', async () => {
    const settings = {
      contextDetection: document.getElementById('onb_contextDetection').checked,
      affiliateSuggestions: document.getElementById('onb_affiliateSuggestions').checked,
      searchQueryAnalysis: document.getElementById('onb_searchQueryAnalysis').checked,
      browsingHistorySync: document.getElementById('onb_browsingHistorySync').checked,
      onboardingComplete: true
    };

    const data = await chrome.storage.sync.get(['settings']);
    const current = data.settings || {};
    await chrome.storage.sync.set({ settings: { ...current, ...settings } });

    modal.style.display = 'none';
    await loadSettings();
  });
}

// ===================== SETTINGS =====================
async function loadSettings() {
  const data = await chrome.storage.sync.get(['settings', 'petName', 'birthday']);
  const settings = data.settings || {};

  setChecked('opt_petVisible', settings.petVisible !== false);
  setChecked('opt_soundEnabled', settings.soundEnabled === true);
  setChecked('opt_contextDetection', settings.contextDetection !== false);
  setChecked('opt_affiliateSuggestions', settings.affiliateSuggestions !== false);
  setChecked('opt_searchQueryAnalysis', settings.searchQueryAnalysis === true);

  document.getElementById('opt_petName').value = data.petName || 'Buddy';
  if (data.birthday) {
    document.getElementById('opt_birthday').value = data.birthday;
  }
}

function setChecked(id, value) {
  const el = document.getElementById(id);
  if (el) el.checked = value;
}

async function saveSettings() {
  const settings = {
    petVisible: document.getElementById('opt_petVisible').checked,
    soundEnabled: document.getElementById('opt_soundEnabled').checked,
    contextDetection: document.getElementById('opt_contextDetection').checked,
    affiliateSuggestions: document.getElementById('opt_affiliateSuggestions').checked,
    searchQueryAnalysis: document.getElementById('opt_searchQueryAnalysis').checked
  };

  const data = await chrome.storage.sync.get(['settings']);
  const current = data.settings || {};
  await chrome.storage.sync.set({
    settings: { ...current, ...settings },
    petName: document.getElementById('opt_petName').value.trim() || 'Buddy',
    birthday: document.getElementById('opt_birthday').value || null
  });

  // Broadcast to tabs
  chrome.runtime.sendMessage({ type: 'UPDATE_SETTINGS', settings });
}

// ===================== PRIVACY =====================
async function loadPrivacy() {
  try {
    const response = await chrome.runtime.sendMessage({ type: 'GET_PRIVACY_LOG' });
    if (!response) return;

    // Categories
    const catEl = document.getElementById('privacyCategories');
    if (response.categoriesDetected?.length > 0) {
      catEl.innerHTML = response.categoriesDetected.map((c) =>
        `<span class="tag">${c}</span>`
      ).join('');
    } else {
      catEl.innerHTML = '<span class="tag">No detections yet</span>';
    }

    // Affiliate
    const affEl = document.getElementById('privacyAffiliate');
    if (response.affiliateImpressions?.length > 0) {
      affEl.innerHTML = response.affiliateImpressions.map((a) =>
        `<p>${a.retailer} at ${a.time}</p>`
      ).join('');
    } else {
      affEl.innerHTML = '<p class="muted">No affiliate impressions today</p>';
    }

    // Event count
    document.getElementById('privacyEventCount').textContent =
      `${response.totalEventsStored} events stored locally`;
  } catch {
    // Service worker may not be ready
  }
}

// ===================== REWARDS =====================
async function loadRewards() {
  const data = await chrome.storage.sync.get(['coins', 'referralCode']);
  document.getElementById('redeemBalance').textContent = data.coins || 0;
  document.getElementById('referralCode').textContent = data.referralCode || 'BB-SHARE';
}

// ===================== SKIN PREVIEWS =====================
function renderSkinPreviews() {
  const skins = {
    default: { body: '#FFD93D', dark: '#F4C430', light: '#FFE566' },
    golden: { body: '#FFD700', dark: '#DAA520', light: '#FFEC8B' },
    ice: { body: '#87CEEB', dark: '#4682B4', light: '#B0E0E6' },
    fire: { body: '#FF6347', dark: '#DC143C', light: '#FF7F7F' }
  };

  document.querySelectorAll('[data-skin-render]').forEach((canvas) => {
    const skinName = canvas.dataset.skinRender;
    const colors = skins[skinName];
    if (colors) drawMiniPet(canvas, colors);
  });
}

function drawMiniPet(canvas, colors) {
  const ctx = canvas.getContext('2d');
  const c = colors || { body: '#FFD93D', dark: '#F4C430', light: '#FFE566' };

  ctx.clearRect(0, 0, 32, 32);

  for (let x = 8; x < 24; x++) {
    for (let y = 10; y < 26; y++) {
      const dx = x < 10 ? 10 - x : x > 21 ? x - 21 : 0;
      const dy = y < 12 ? 12 - y : y > 23 ? y - 23 : 0;
      if (dx + dy > 2) continue;
      if (dx + dy === 2 || x === 8 || x === 23 || y === 10 || y === 25) {
        px(ctx, x, y, '#2C2C2C');
      } else if (x < 12) {
        px(ctx, x, y, c.dark);
      } else {
        px(ctx, x, y, c.body);
      }
    }
  }

  // Ears
  px(ctx, 9, 9, '#2C2C2C'); px(ctx, 10, 8, '#2C2C2C'); px(ctx, 10, 9, c.body);
  px(ctx, 22, 9, '#2C2C2C'); px(ctx, 21, 8, '#2C2C2C'); px(ctx, 21, 9, c.body);

  // Eyes
  px(ctx, 12, 15, '#FFF'); px(ctx, 13, 15, '#FFF');
  px(ctx, 12, 16, '#FFF'); px(ctx, 13, 16, '#333');
  px(ctx, 19, 15, '#FFF'); px(ctx, 20, 15, '#FFF');
  px(ctx, 19, 16, '#333'); px(ctx, 20, 16, '#FFF');

  // Mouth
  px(ctx, 14, 20, '#E74C3C'); px(ctx, 15, 21, '#E74C3C');
  px(ctx, 16, 21, '#E74C3C'); px(ctx, 17, 20, '#E74C3C');

  // Feet
  px(ctx, 10, 26, '#2C2C2C'); px(ctx, 11, 26, c.dark); px(ctx, 12, 26, '#2C2C2C');
  px(ctx, 19, 26, '#2C2C2C'); px(ctx, 20, 26, c.dark); px(ctx, 21, 26, '#2C2C2C');
}

function px(ctx, x, y, color) {
  ctx.fillStyle = color;
  ctx.fillRect(x, y, 1, 1);
}

// ===================== EVENT HANDLERS =====================
function setupEventHandlers() {
  // Auto-save on toggle change
  document.querySelectorAll('.tab-content input[type="checkbox"]').forEach((input) => {
    input.addEventListener('change', saveSettings);
  });

  // Save on text input blur
  document.getElementById('opt_petName').addEventListener('blur', saveSettings);
  document.getElementById('opt_birthday').addEventListener('change', saveSettings);

  // Clear analytics
  document.getElementById('btnClearAnalytics').addEventListener('click', async () => {
    if (confirm('Clear all analytics data? This cannot be undone.')) {
      await chrome.storage.local.set({ analyticsEvents: [] });
      await loadPrivacy();
    }
  });

  // Clear all data
  document.getElementById('btnClearAll').addEventListener('click', async () => {
    if (confirm('Clear ALL data? This will reset your coins, streak, pet level, and all settings. This cannot be undone!')) {
      chrome.runtime.sendMessage({ type: 'CLEAR_ALL_DATA' }, () => {
        window.location.reload();
      });
    }
  });

  // Reset position
  document.getElementById('btnResetPosition').addEventListener('click', async () => {
    const data = await chrome.storage.sync.get(['settings']);
    const settings = data.settings || {};
    settings.petPosition = { x: null, y: null };
    await chrome.storage.sync.set({ settings });
    chrome.runtime.sendMessage({ type: 'UPDATE_SETTINGS', settings: { petPosition: { x: null, y: null } } });
    alert('Pet position reset to default (bottom-right corner).');
  });

  // Copy referral code
  document.getElementById('btnCopyReferral').addEventListener('click', async () => {
    const code = document.getElementById('referralCode').textContent;
    try {
      await navigator.clipboard.writeText(code);
      const btn = document.getElementById('btnCopyReferral');
      btn.textContent = 'Copied!';
      setTimeout(() => { btn.textContent = 'Copy'; }, 2000);
    } catch {
      // Fallback
      const textArea = document.createElement('textarea');
      textArea.value = code;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      textArea.remove();
    }
  });
}
