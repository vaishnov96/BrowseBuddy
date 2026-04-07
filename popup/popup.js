/**
 * BrowseBuddy — Popup Dashboard
 */
document.addEventListener('DOMContentLoaded', async () => {
  await loadStats();
  await loadDeals();
  await loadContext();
  drawPetPreview();
  setupActions();
});

async function loadStats() {
  try {
    const data = await chrome.storage.sync.get([
      'coins', 'streak', 'lifetimeEarnings', 'petLevel', 'petXP', 'petName'
    ]);

    const coins = data.coins || 0;
    const streak = data.streak || 0;
    const level = data.petLevel || 1;
    const xp = data.petXP || 0;
    const name = data.petName || 'Buddy';

    document.getElementById('coinBalance').textContent = coins;
    document.getElementById('streakCount').textContent = streak;
    document.getElementById('petName').textContent = name;
    document.getElementById('petLevel').textContent = `Level ${level}`;
    document.getElementById('petTitle').textContent = getTitleForLevel(level);

    // XP bar
    const xpForCurrent = getXPForLevel(level);
    const xpForNext = getXPForLevel(level + 1);
    const progress = xpForNext > xpForCurrent ? ((xp - xpForCurrent) / (xpForNext - xpForCurrent)) * 100 : 0;
    document.getElementById('xpFill').style.width = Math.min(100, Math.max(0, progress)) + '%';
    document.getElementById('xpText').textContent = `${xp - xpForCurrent} / ${xpForNext - xpForCurrent} XP`;

    // Week coins estimation
    const weekData = await chrome.storage.local.get(['analyticsEvents']);
    const events = weekData.analyticsEvents || [];
    const weekAgo = Date.now() - 7 * 86400000;
    const weekCoins = events.filter((e) => e.timestamp > weekAgo && e.event === 'coins_earned')
      .reduce((sum, e) => sum + (e.data?.amount || 0), 0);
    document.getElementById('weekCoins').textContent = `+${weekCoins}`;
  } catch (err) {
    console.error('Error loading stats:', err);
  }
}

async function loadDeals() {
  const deals = [
    { name: 'Amazon', cashbackPercent: 3 },
    { name: 'Flipkart', cashbackPercent: 4 },
    { name: 'eBay', cashbackPercent: 2 },
    { name: 'Walmart', cashbackPercent: 2 },
    { name: 'Etsy', cashbackPercent: 4 },
    { name: 'Best Buy', cashbackPercent: 2 },
    { name: 'Target', cashbackPercent: 2 }
  ];

  const list = document.getElementById('dealsList');
  document.getElementById('dealCount').textContent = deals.length;

  deals.forEach((deal) => {
    const item = document.createElement('div');
    item.className = 'deal-item';
    item.innerHTML = `
      <span class="deal-name">${deal.name}</span>
      <span class="deal-cashback">${deal.cashbackPercent}% cashback</span>
    `;
    list.appendChild(item);
  });
}

async function loadContext() {
  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (!tab?.id) return;

    chrome.tabs.sendMessage(tab.id, { type: 'GET_STATE' }, (response) => {
      if (chrome.runtime.lastError || !response) return;
      const contextMap = {
        'IDLE': { emoji: '😊', text: 'Chilling' },
        'SLEEPING': { emoji: '😴', text: 'Sleeping' },
        'NAUGHTY_REACTION': { emoji: '😏', text: 'Incognito Mode' },
        'SHY_COVERING_EYES': { emoji: '🙈', text: 'Eyes Covered' },
        'SHOPPING_EXCITED': { emoji: '🛍️', text: 'Shopping Mode' },
        'SPORTS_FAN': { emoji: '⚽', text: 'Sports Fan' },
        'HACKER_MODE': { emoji: '💻', text: 'Coding Mode' },
        'VIBING': { emoji: '🎵', text: 'Vibing to Music' },
        'SOCIAL_SCROLLING': { emoji: '📱', text: 'Social Scrolling' },
        'FOODIE_MODE': { emoji: '🍕', text: 'Foodie Mode' },
        'MONEY_EYES': { emoji: '💰', text: 'Finance Mode' },
        'NEWS_READER': { emoji: '📰', text: 'Reading News' },
        'WATCHING_MODE': { emoji: '🍿', text: 'Watching' },
        'GAMER_MODE': { emoji: '🎮', text: 'Gaming Mode' }
      };

      const ctx = contextMap[response.state] || { emoji: '😊', text: 'Chilling' };
      document.getElementById('contextDisplay').innerHTML = `
        <span class="context-emoji">${ctx.emoji}</span>
        <span class="context-text">${ctx.text}</span>
      `;
    });
  } catch {
    // Tab may not have content script
  }
}

function drawPetPreview() {
  const canvas = document.getElementById('petCanvas');
  const ctx = canvas.getContext('2d');

  const c = {
    body: '#FFD93D', bodyDark: '#F4C430', bodyLight: '#FFE566',
    eyes: '#333333', eyeWhite: '#FFFFFF', mouth: '#E74C3C', outline: '#2C2C2C'
  };

  ctx.clearRect(0, 0, 32, 32);

  // Body
  for (let x = 8; x < 24; x++) {
    for (let y = 10; y < 26; y++) {
      const dx = x < 10 ? 10 - x : x > 21 ? x - 21 : 0;
      const dy = y < 12 ? 12 - y : y > 23 ? y - 23 : 0;
      if (dx + dy > 2) continue;
      if (dx + dy === 2 || x === 8 || x === 23 || y === 10 || y === 25) {
        drawPx(ctx, x, y, c.outline);
      } else if (x < 12) {
        drawPx(ctx, x, y, c.bodyDark);
      } else {
        drawPx(ctx, x, y, c.body);
      }
    }
  }

  // Ears
  drawPx(ctx, 9, 9, c.outline); drawPx(ctx, 10, 8, c.outline); drawPx(ctx, 10, 9, c.body);
  drawPx(ctx, 22, 9, c.outline); drawPx(ctx, 21, 8, c.outline); drawPx(ctx, 21, 9, c.body);

  // Eyes
  drawPx(ctx, 12, 15, c.eyeWhite); drawPx(ctx, 13, 15, c.eyeWhite);
  drawPx(ctx, 12, 16, c.eyeWhite); drawPx(ctx, 13, 16, c.eyes);
  drawPx(ctx, 19, 15, c.eyeWhite); drawPx(ctx, 20, 15, c.eyeWhite);
  drawPx(ctx, 19, 16, c.eyes); drawPx(ctx, 20, 16, c.eyeWhite);

  // Mouth
  drawPx(ctx, 14, 20, c.mouth); drawPx(ctx, 15, 21, c.mouth);
  drawPx(ctx, 16, 21, c.mouth); drawPx(ctx, 17, 20, c.mouth);

  // Feet
  drawPx(ctx, 10, 26, c.outline); drawPx(ctx, 11, 26, c.bodyDark); drawPx(ctx, 12, 26, c.outline);
  drawPx(ctx, 19, 26, c.outline); drawPx(ctx, 20, 26, c.bodyDark); drawPx(ctx, 21, 26, c.outline);
}

function drawPx(ctx, x, y, color) {
  ctx.fillStyle = color;
  ctx.fillRect(x, y, 1, 1);
}

function setupActions() {
  document.getElementById('btnSettings').addEventListener('click', () => {
    chrome.runtime.openOptionsPage();
  });

  document.getElementById('btnPrivacy').addEventListener('click', () => {
    chrome.tabs.create({ url: chrome.runtime.getURL('options/options.html?tab=privacy') });
  });

  document.getElementById('btnCustomize').addEventListener('click', () => {
    chrome.tabs.create({ url: chrome.runtime.getURL('options/options.html?tab=customize') });
  });

  document.getElementById('btnShare').addEventListener('click', async () => {
    const data = await chrome.storage.sync.get(['referralCode']);
    const code = data.referralCode || 'BB-SHARE';
    try {
      await navigator.clipboard.writeText(`Check out BrowseBuddy - a cute pixel pet that lives in your browser! Use code ${code} for bonus coins!`);
      const btn = document.getElementById('btnShare');
      btn.innerHTML = '<span>✅</span> Copied!';
      setTimeout(() => { btn.innerHTML = '<span>📤</span> Share'; }, 2000);
    } catch {
      // Clipboard API may not work in popup
    }
  });

  document.getElementById('btnRedeem').addEventListener('click', () => {
    chrome.tabs.create({ url: chrome.runtime.getURL('options/options.html?tab=redeem') });
  });
}

// Level helpers (duplicated from rewards.js since popup can't access content scripts)
const XP_TABLE = [
  0, 100, 250, 500, 800, 1200, 1800, 2500, 3500, 5000,
  7000, 9500, 12500, 16000, 20000, 25000, 31000, 38000, 46000, 55000
];

function getXPForLevel(level) {
  if (level <= 0) return 0;
  if (level > 20) return XP_TABLE[19] + (level - 20) * 10000;
  return XP_TABLE[level - 1];
}

function getTitleForLevel(level) {
  const titles = {
    1: 'Newborn Pixel', 5: 'Curious Critter', 10: 'Digital Explorer',
    15: 'Web Wanderer', 20: 'Cyber Companion', 25: 'Browser Beast',
    30: 'Pixel Prodigy', 35: 'Chrome Champion', 40: 'Tab Titan',
    45: 'Internet Icon', 50: 'Legendary Buddy'
  };
  let title = 'Newborn Pixel';
  for (const [lvl, t] of Object.entries(titles)) {
    if (level >= parseInt(lvl)) title = t;
  }
  return title;
}
