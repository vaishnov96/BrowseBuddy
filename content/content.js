/**
 * BrowseBuddy — Main Content Script Orchestrator
 * Connects detector, buddy, affiliate, and service worker messaging
 */
(function () {
  // Guard against double injection
  if (window.__browseBuddyInitialized) return;
  window.__browseBuddyInitialized = true;

  console.log('[BrowseBuddy] Content script loaded');

  // Initialize pet IMMEDIATELY (no async dependency)
  try {
    BrowseBuddy.init();
    console.log('[BrowseBuddy] Pet initialized');
  } catch (err) {
    console.error('[BrowseBuddy] Pet init failed:', err);
    return;
  }

  // Initial greeting — skipped if page summary will handle it (to avoid queueing conflicts)
  setTimeout(() => {
    try {
      // Page summary will deliver a combined greeting+summary instead
      if (window.__bbSummaryPending) return;

      const hour = new Date().getHours();
      if (hour >= 0 && hour < 5) {
        BrowseBuddy.say("Hey, it's pretty late! I'll keep you company though.");
      } else if (hour >= 5 && hour < 12) {
        BrowseBuddy.say("Good morning! Hope you're having a great day so far.");
      } else if (hour >= 12 && hour < 17) {
        BrowseBuddy.say("Hey there! What are we up to this afternoon?");
      } else {
        BrowseBuddy.say("Good evening! I'm here whenever you need me.");
      }
    } catch (err) {
      console.error('[BrowseBuddy] Greeting failed:', err);
    }
  }, 2000);

  // Async setup (storage, streaks, detection) — runs in background, won't block pet
  asyncSetup();

  async function asyncSetup() {
    try {
      await BuddyStorage.init();
      console.log('[BrowseBuddy] Storage initialized');
    } catch (err) {
      console.error('[BrowseBuddy] Storage init failed:', err);
    }

    // Check settings and apply
    let settings;
    try {
      settings = await BuddyStorage.getSettings();
      if (settings.petVisible === false) {
        BrowseBuddy.hide();
        return;
      }
    } catch (err) {
      console.error('[BrowseBuddy] Settings load failed:', err);
      settings = { contextDetection: true, affiliateSuggestions: true };
    }

    // Streak check
    try {
      const streakResult = await BuddyRewards.checkAndUpdateStreak();
      if (streakResult.isNewDay) {
        setTimeout(() => {
          BrowseBuddy.say(`Day ${streakResult.streak} streak! Keep it up!`);
          if (streakResult.bonusAwarded) {
            setTimeout(() => {
              BrowseBuddy.say("7-day streak bonus! +10 BuddyCoins!");
              BrowseBuddy.spawnConfetti(15);
            }, 6000);
          }
        }, 3000);
      }
    } catch (err) {
      console.error('[BrowseBuddy] Streak check failed:', err);
    }

    // Context detection
    if (settings.contextDetection !== false) {
      try {
        runDetection();

        let lastUrl = window.location.href;
        setInterval(() => {
          const currentUrl = window.location.href;
          if (currentUrl !== lastUrl) {
            lastUrl = currentUrl;
            runDetection();
          }
        }, 8000);

        // Re-detect less often to avoid spammy state changes
        setInterval(runDetection, 60000);
      } catch (err) {
        console.error('[BrowseBuddy] Detection setup failed:', err);
      }
    }

    // YouTube context detection
    try {
      setupYouTubeWatcher();
    } catch (err) {
      console.error('[BrowseBuddy] YouTube watcher failed:', err);
    }

    // Affiliate engine
    if (settings.affiliateSuggestions !== false) {
      try {
        BuddyAffiliate.init();
      } catch (err) {
        console.error('[BrowseBuddy] Affiliate init failed:', err);
      }
    }

    // Browsing XP (stops itself if extension context dies)
    try {
      const browsingXPInterval = setInterval(() => {
        if (!BuddyStorage.isContextValid()) {
          clearInterval(browsingXPInterval);
          return;
        }
        if (!document.hidden) {
          BuddyRewards.addXP(1);
        }
      }, 60000);

      window.addEventListener('beforeunload', () => {
        clearInterval(browsingXPInterval);
      });
    } catch (err) {
      console.error('[BrowseBuddy] XP tracking failed:', err);
    }
  }

  // Listen for messages from service worker
  try {
    chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
      try {
        switch (message.type) {
          case 'INCOGNITO_STATUS':
            BuddyDetector.setIncognito(message.isIncognito);
            if (message.isIncognito) {
              BrowseBuddy.setState('NAUGHTY_REACTION');
            }
            sendResponse({ received: true });
            break;

          case 'TAB_COUNT':
            if (message.count >= 100) {
              BrowseBuddy.say("Your RAM called. It's filing for divorce.");
            }
            sendResponse({ received: true });
            break;

          case 'SETTINGS_UPDATED':
            handleSettingsUpdate(message.settings);
            sendResponse({ received: true });
            break;

          case 'GET_STATE':
            sendResponse({
              state: BrowseBuddy.getState(),
              context: BuddyDetector.getLastContext(),
              affiliate: BuddyAffiliate.isActive() ? BuddyAffiliate.getCurrentRetailer()?.name : null
            });
            break;

          case 'TRIGGER_LEVEL_UP':
            BrowseBuddy.say(`LEVEL UP! You're now Level ${message.level}!`);
            BrowseBuddy.spawnConfetti(20);
            sendResponse({ received: true });
            break;
        }
      } catch (err) {
        console.error('[BrowseBuddy] Message handler error:', err);
      }
      return true;
    });

    // Request incognito status
    chrome.runtime.sendMessage({ type: 'CHECK_INCOGNITO' }, (response) => {
      if (chrome.runtime.lastError) return;
      if (response?.isIncognito) {
        BuddyDetector.setIncognito(true);
        BrowseBuddy.setState('NAUGHTY_REACTION');
      }
    });
  } catch (err) {
    console.error('[BrowseBuddy] Message listener setup failed:', err);
  }

  // Easter egg: Long session
  let sessionStart = Date.now();
  setInterval(() => {
    const hours = (Date.now() - sessionStart) / 3600000;
    if (hours >= 3 && Math.random() < 0.1) {
      BrowseBuddy.say("You've been here a while... need an intervention?");
    }
  }, 10 * 60 * 1000);

  // Easter egg: Alt-tab warrior
  let switchCount = 0;
  document.addEventListener('visibilitychange', () => {
    if (!document.hidden) {
      switchCount++;
      if (switchCount >= 10 && switchCount % 10 === 0) {
        BrowseBuddy.say("Alt-tab warrior!");
      }
    }
  });

  // === HELPER FUNCTIONS ===

  function runDetection() {
    try {
      const context = BuddyDetector.detect();
      BrowseBuddy.setState(context.buddyState);

      if (context.category === 'shopping' && BuddyAffiliate.isActive()) {
        const retailer = BuddyAffiliate.getCurrentRetailer();
        if (retailer) {
          BrowseBuddy.showAffiliateBadge(`${retailer.cashbackPercent}% back`);
        }
      } else {
        BrowseBuddy.hideAffiliateBadge();
      }

      BuddyAnalytics.track('context_detected', {
        category: context.category,
        confidence: context.confidence,
        url: window.location.hostname
      });
    } catch (err) {
      console.error('[BrowseBuddy] Detection failed:', err);
    }
  }

  function handleSettingsUpdate(newSettings) {
    if (newSettings.petVisible === false) {
      BrowseBuddy.hide();
    } else if (newSettings.petVisible === true) {
      BrowseBuddy.show();
    }
  }

  // === YOUTUBE CONTEXT WATCHER ===
  function setupYouTubeWatcher() {
    const hostname = window.location.hostname.replace(/^www\./, '');
    const isYouTube = hostname === 'youtube.com' || hostname === 'm.youtube.com';
    if (!isYouTube) return;

    let lastVideoId = '';

    function extractVideoTitle() {
      // Method 1: YouTube's own structured element
      const ytTitle = document.querySelector(
        'h1.ytd-watch-metadata yt-formatted-string, ' +
        '#title h1 yt-formatted-string, ' +
        'h1.title'
      );
      if (ytTitle?.textContent?.trim()) return ytTitle.textContent.trim();

      // Method 2: Document title (fallback, strip " - YouTube")
      const docTitle = document.title.replace(/\s*-\s*YouTube\s*$/i, '').trim();
      if (docTitle && docTitle !== 'YouTube') return docTitle;

      return null;
    }

    function extractVideoId() {
      const url = new URL(window.location.href);
      return url.searchParams.get('v') || '';
    }

    function checkYouTubeVideo() {
      try {
        const videoId = extractVideoId();

        // Not on a watch page
        if (!videoId) {
          if (lastVideoId) {
            lastVideoId = '';
            BrowseBuddy.clearYouTubeContext();
          }
          return;
        }

        // Same video, no update needed
        if (videoId === lastVideoId) return;

        // New video detected — wait a moment for title to render
        lastVideoId = videoId;
        setTimeout(() => {
          const title = extractVideoTitle();
          if (title) {
            console.log('[BrowseBuddy] YouTube video:', title);
            BrowseBuddy.setYouTubeContext(title);
          }
        }, 2000);
      } catch (err) {
        console.error('[BrowseBuddy] YouTube check failed:', err);
      }
    }

    // Initial check
    checkYouTubeVideo();

    // YouTube is a SPA — watch for navigation changes
    let ytLastUrl = window.location.href;
    const ytUrlObserver = setInterval(() => {
      const currentUrl = window.location.href;
      if (currentUrl !== ytLastUrl) {
        ytLastUrl = currentUrl;
        checkYouTubeVideo();
      }
    }, 3000);

    // Also listen for YouTube's own navigation events
    document.addEventListener('yt-navigate-finish', () => {
      setTimeout(checkYouTubeVideo, 1500);
    });

    // Cleanup on page unload
    window.addEventListener('beforeunload', () => {
      clearInterval(ytUrlObserver);
    });

    console.log('[BrowseBuddy] YouTube watcher active');
  }
})();
