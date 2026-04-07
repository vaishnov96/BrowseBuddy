/**
 * BrowseBuddy — Background Service Worker
 * Handles tab events, incognito detection, alarms, and cross-tab communication
 */

// ===================== INSTALLATION =====================
chrome.runtime.onInstalled.addListener(async (details) => {
  if (details.reason === 'install') {
    // Set up initial storage
    await chrome.storage.sync.set({
      installDate: new Date().toISOString(),
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
      referralCode: 'BB-' + Math.random().toString(36).substring(2, 10).toUpperCase(),
      contextHistory: [],
      dialogueHistory: [],
      memeHistory: [],
      settings: {
        contextDetection: true,
        affiliateSuggestions: true,
        searchQueryAnalysis: false,
        browsingHistorySync: false,
        soundEnabled: false,
        petVisible: true,
        petPosition: { x: null, y: null },
        onboardingComplete: false
      }
    });

    // Open onboarding tab
    chrome.tabs.create({
      url: chrome.runtime.getURL('options/options.html?onboarding=true')
    });
  }

  // Set up alarms
  chrome.alarms.create('dailyCheck', { periodInMinutes: 60 });
  chrome.alarms.create('xpTick', { periodInMinutes: 5 });
});

// ===================== TAB EVENTS =====================
chrome.tabs.onActivated.addListener(async (activeInfo) => {
  try {
    const tab = await chrome.tabs.get(activeInfo.tabId);
    sendIncognitoStatus(tab);
    checkTabCount();
  } catch {
    // Tab may have been closed
  }
});

chrome.tabs.onUpdated.addListener(async (tabId, changeInfo, tab) => {
  if (changeInfo.status === 'complete') {
    sendIncognitoStatus(tab);
  }
});

function sendIncognitoStatus(tab) {
  if (!tab.id || tab.id < 0) return;
  try {
    chrome.tabs.sendMessage(tab.id, {
      type: 'INCOGNITO_STATUS',
      isIncognito: tab.incognito
    }).catch(() => {});
  } catch {
    // Content script may not be loaded yet
  }
}

async function checkTabCount() {
  try {
    const tabs = await chrome.tabs.query({});
    if (tabs.length >= 100) {
      const activeTab = tabs.find((t) => t.active);
      if (activeTab?.id) {
        chrome.tabs.sendMessage(activeTab.id, {
          type: 'TAB_COUNT',
          count: tabs.length
        }).catch(() => {});
      }
    }
  } catch {
    // Ignore errors
  }
}

// ===================== MESSAGE HANDLING =====================
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  switch (message.type) {
    case 'CHECK_INCOGNITO':
      if (sender.tab) {
        sendResponse({ isIncognito: sender.tab.incognito });
      } else {
        sendResponse({ isIncognito: false });
      }
      break;

    case 'GET_STATS':
      getStats().then((stats) => sendResponse(stats));
      return true;

    case 'GET_ACTIVE_DEALS':
      sendResponse({ deals: getActiveDeals() });
      break;

    case 'GET_SESSION_SUMMARY':
      getSessionSummary().then((summary) => sendResponse(summary));
      return true;

    case 'UPDATE_SETTINGS':
      updateSettings(message.settings).then(() => {
        broadcastToTabs({ type: 'SETTINGS_UPDATED', settings: message.settings });
        sendResponse({ success: true });
      });
      return true;

    case 'CLEAR_ALL_DATA':
      chrome.storage.sync.clear(() => {
        chrome.storage.local.clear(() => {
          sendResponse({ success: true });
        });
      });
      return true;

    case 'GET_PRIVACY_LOG':
      getPrivacyLog().then((log) => sendResponse(log));
      return true;

    case 'CAPTURE_SCREENSHOT':
      chrome.tabs.captureVisibleTab(null, { format: 'png' }, (dataUrl) => {
        if (chrome.runtime.lastError) {
          sendResponse({ error: chrome.runtime.lastError.message });
        } else {
          sendResponse({ dataUrl });
        }
      });
      return true;
  }
});

// ===================== ALARMS =====================
chrome.alarms.onAlarm.addListener(async (alarm) => {
  if (alarm.name === 'dailyCheck') {
    // Check streak and award daily coin
    const data = await chrome.storage.sync.get(['lastActiveDate', 'streak']);
    const today = new Date().toISOString().split('T')[0];

    if (data.lastActiveDate !== today) {
      const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];
      let newStreak = data.lastActiveDate === yesterday ? (data.streak || 0) + 1 : 1;

      await chrome.storage.sync.set({
        streak: newStreak,
        lastActiveDate: today
      });
    }
  }

  if (alarm.name === 'xpTick') {
    // Award passive XP for having the extension active
    const data = await chrome.storage.sync.get(['petXP']);
    await chrome.storage.sync.set({ petXP: (data.petXP || 0) + 2 });
  }
});

// ===================== HELPERS =====================
async function getStats() {
  const data = await chrome.storage.sync.get([
    'coins', 'streak', 'lifetimeEarnings', 'petLevel', 'petXP',
    'petHappiness', 'petName', 'petSkin', 'petAccessories', 'installDate'
  ]);
  return data;
}

function getActiveDeals() {
  return [
    { name: 'Amazon', domain: 'amazon.com', cashbackPercent: 3 },
    { name: 'Amazon India', domain: 'amazon.in', cashbackPercent: 3 },
    { name: 'Flipkart', domain: 'flipkart.com', cashbackPercent: 4 },
    { name: 'eBay', domain: 'ebay.com', cashbackPercent: 2 },
    { name: 'Walmart', domain: 'walmart.com', cashbackPercent: 2 },
    { name: 'Etsy', domain: 'etsy.com', cashbackPercent: 4 },
    { name: 'Best Buy', domain: 'bestbuy.com', cashbackPercent: 2 },
    { name: 'Target', domain: 'target.com', cashbackPercent: 2 }
  ];
}

async function updateSettings(partial) {
  const data = await chrome.storage.sync.get(['settings']);
  const current = data.settings || {};
  const merged = { ...current, ...partial };
  await chrome.storage.sync.set({ settings: merged });
}

async function broadcastToTabs(message) {
  try {
    const tabs = await chrome.tabs.query({});
    for (const tab of tabs) {
      if (tab.id && tab.id > 0) {
        chrome.tabs.sendMessage(tab.id, message).catch(() => {});
      }
    }
  } catch {
    // Ignore errors
  }
}

async function getSessionSummary() {
  const data = await chrome.storage.local.get(['analyticsEvents']);
  const events = data.analyticsEvents || [];
  const oneDayAgo = Date.now() - 86400000;
  const recent = events.filter((e) => e.timestamp > oneDayAgo);

  const categoryCounts = {};
  recent.filter((e) => e.event === 'context_detected').forEach((e) => {
    const cat = e.data?.category || 'unknown';
    categoryCounts[cat] = (categoryCounts[cat] || 0) + 1;
  });

  return {
    totalEvents: recent.length,
    categoryCounts,
    affiliateImpressions: recent.filter((e) => e.event === 'affiliate_impression').length
  };
}

async function getPrivacyLog() {
  const data = await chrome.storage.local.get(['analyticsEvents']);
  const events = data.analyticsEvents || [];
  const oneDayAgo = Date.now() - 86400000;

  return {
    categoriesDetected: [...new Set(
      events.filter((e) => e.timestamp > oneDayAgo && e.event === 'context_detected')
        .map((e) => e.data?.category).filter(Boolean)
    )],
    affiliateImpressions: events.filter((e) => e.timestamp > oneDayAgo && e.event === 'affiliate_impression')
      .map((e) => ({ retailer: e.data?.retailer, time: new Date(e.timestamp).toLocaleTimeString() })),
    totalEventsStored: events.length
  };
}
