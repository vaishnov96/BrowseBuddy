/**
 * BrowseBuddy Feature — Page Summary
 * Actually reads page content and delivers a meaningful summary.
 * Uses priority speech to override generic greetings/dialogues.
 */
(() => {
  let _dailyCount = 0;
  const MAX_DAILY = 20;

  // Signal to other scripts that a page summary is coming
  // This prevents content.js initial greeting and buddy.js state dialogue from firing
  window.__bbSummaryPending = true;
  try { BrowseBuddy.setSummaryPending(true); } catch (e) {}

  // ====== TIME-AWARE GREETING PREFIX ======
  function getGreetingPrefix() {
    const hour = new Date().getHours();
    const greetings = {
      night: [
        "Hey night owl!",
        "Still up?",
        "Late browsing session!"
      ],
      morning: [
        "Good morning!",
        "Morning!",
        "Hey, early start today!"
      ],
      afternoon: [
        "Hey there!",
        "Good afternoon!",
        "Hey!"
      ],
      evening: [
        "Good evening!",
        "Hey there!",
        "Evening!"
      ]
    };

    let pool;
    if (hour >= 0 && hour < 5) pool = greetings.night;
    else if (hour >= 5 && hour < 12) pool = greetings.morning;
    else if (hour >= 12 && hour < 17) pool = greetings.afternoon;
    else pool = greetings.evening;

    return pool[Math.floor(Math.random() * pool.length)];
  }

  // ====== CONTENT EXTRACTION ======

  function getPageData() {
    const data = {
      title: '',
      description: '',
      headings: [],
      searchQuery: '',
      siteName: '',
      mainText: '',
      linkCount: 0,
      imageCount: 0,
      wordCount: 0,
      isSearch: false,
      isArticle: false,
      isProduct: false,
      isVideo: false
    };

    // Title
    data.title = document.title || '';

    // Site name from hostname
    const hostname = window.location.hostname.replace(/^www\./, '');
    data.siteName = hostname.split('.')[0];
    data.siteName = data.siteName.charAt(0).toUpperCase() + data.siteName.slice(1);

    // Meta description
    const descMeta = document.querySelector('meta[name="description"], meta[property="og:description"]');
    data.description = descMeta?.getAttribute('content') || '';

    // Search query extraction (Google, Bing, DuckDuckGo, Yahoo, etc.)
    const url = new URL(window.location.href);
    for (const param of ['q', 'query', 'search_query', 'p', 'search', 'text']) {
      const val = url.searchParams.get(param);
      if (val) { data.searchQuery = val; data.isSearch = true; break; }
    }

    // Also detect search pages by URL pattern
    if (!data.isSearch) {
      const searchDomains = ['google', 'bing', 'duckduckgo', 'yahoo', 'baidu', 'yandex'];
      if (searchDomains.some(d => hostname.includes(d)) && url.pathname.includes('search')) {
        data.isSearch = true;
      }
    }

    // Headings (first 8)
    const headingEls = document.querySelectorAll('h1, h2, h3');
    for (let i = 0; i < Math.min(headingEls.length, 8); i++) {
      const text = headingEls[i].textContent.trim();
      if (text && text.length > 2 && text.length < 200) {
        data.headings.push(text);
      }
    }

    // Main content sampling — get visible text from likely content areas
    const contentSelectors = [
      'article', 'main', '[role="main"]',
      '.post-content', '.article-body', '.entry-content',
      '.story-body', '#content', '.content'
    ];

    let contentEl = null;
    for (const sel of contentSelectors) {
      contentEl = document.querySelector(sel);
      if (contentEl) break;
    }

    if (!contentEl) contentEl = document.body;

    // Get first ~1200 chars of visible text for better analysis
    const walker = document.createTreeWalker(
      contentEl,
      NodeFilter.SHOW_TEXT,
      {
        acceptNode: (node) => {
          const parent = node.parentElement;
          if (!parent) return NodeFilter.FILTER_REJECT;
          const tag = parent.tagName;
          if (['SCRIPT', 'STYLE', 'NOSCRIPT', 'SVG', 'NAV', 'HEADER', 'FOOTER'].includes(tag)) {
            return NodeFilter.FILTER_REJECT;
          }
          const style = window.getComputedStyle(parent);
          if (style.display === 'none' || style.visibility === 'hidden') {
            return NodeFilter.FILTER_REJECT;
          }
          if (node.textContent.trim().length < 3) return NodeFilter.FILTER_REJECT;
          return NodeFilter.FILTER_ACCEPT;
        }
      }
    );

    let collected = '';
    let node;
    while ((node = walker.nextNode()) && collected.length < 1200) {
      const text = node.textContent.trim();
      if (text.length > 2) {
        collected += text + ' ';
      }
    }
    data.mainText = collected.trim();
    data.wordCount = data.mainText.split(/\s+/).filter(w => w.length > 1).length;

    // Counts
    data.linkCount = document.querySelectorAll('a[href]').length;
    data.imageCount = document.querySelectorAll('img').length;

    // Page type detection
    const allText = (data.title + ' ' + data.description + ' ' + data.mainText).toLowerCase();
    data.isArticle = !!(
      document.querySelector('article') ||
      allText.includes('published') ||
      allText.includes('author') ||
      data.wordCount > 200
    );
    data.isProduct = !!(
      allText.includes('add to cart') ||
      allText.includes('buy now') ||
      allText.includes('price') ||
      document.querySelector('[class*="product"], [class*="price"]')
    );
    data.isVideo = !!(
      document.querySelector('video, iframe[src*="youtube"], iframe[src*="vimeo"]') ||
      hostname.includes('youtube') ||
      hostname.includes('vimeo')
    );

    return data;
  }

  function shorten(text, maxLen = 50) {
    if (!text) return '';
    const clean = text.trim();
    return clean.length > maxLen ? clean.substring(0, maxLen - 3) + '...' : clean;
  }

  // ====== SUMMARY GENERATION ======

  function generateSummary(data) {
    const greeting = getGreetingPrefix();
    const parts = [];

    // 1. Search engine results
    if (data.isSearch && data.searchQuery) {
      parts.push(`${greeting} You're searching for "${shorten(data.searchQuery, 40)}".`);

      // Count visible search results
      const resultEls = document.querySelectorAll('.g, [data-snf], .rc, .result, .b_algo, .result__body');
      const resultCount = resultEls.length;

      // Extract top result titles
      const topResults = [];
      const resultHeadings = document.querySelectorAll('.g h3, .b_algo h2, .result__title');
      for (let i = 0; i < Math.min(resultHeadings.length, 3); i++) {
        const t = resultHeadings[i]?.textContent?.trim();
        if (t) topResults.push(shorten(t, 45));
      }

      if (topResults.length > 0) {
        parts.push(`Top results: "${topResults[0]}"`);
        if (topResults.length > 1) {
          parts.push(`and "${topResults[1]}".`);
        } else {
          parts[parts.length - 1] += '.';
        }
      }

      if (resultCount > 0) {
        parts.push(`${resultCount} results on this page.`);
      }

      parts.push('Let me know if you need help finding something!');
      return parts.join(' ');
    }

    // 2. YouTube video
    if (data.siteName.toLowerCase() === 'youtube' && window.location.pathname === '/watch') {
      const videoTitle = document.querySelector('h1.ytd-watch-metadata yt-formatted-string, #title h1')?.textContent?.trim();
      const channel = document.querySelector('#channel-name a, ytd-channel-name a')?.textContent?.trim();
      const views = document.querySelector('.ytd-video-primary-info-renderer .view-count, #info-strings yt-formatted-string')?.textContent?.trim();

      parts.push(`${greeting} You're watching "${shorten(videoTitle || data.title, 50)}".`);
      if (channel) parts.push(`By ${channel}.`);
      if (views) parts.push(`${views}.`);
      parts.push('Enjoy the video!');
      return parts.join(' ');
    }

    // 3. YouTube homepage / browse
    if (data.siteName.toLowerCase() === 'youtube' && window.location.pathname !== '/watch') {
      parts.push(`${greeting} Browsing YouTube!`);
      if (data.searchQuery) {
        parts.push(`Searching for "${shorten(data.searchQuery, 35)}".`);
      } else {
        parts.push("Looking for something to watch?");
      }
      return parts.join(' ');
    }

    // 4. Product page
    if (data.isProduct) {
      parts.push(`${greeting} This looks like a product page on ${data.siteName}.`);
      if (data.headings[0]) {
        parts.push(`Product: "${shorten(data.headings[0], 50)}".`);
      }
      if (data.description) {
        parts.push(shorten(data.description, 80));
      }
      parts.push('Want me to check for deals?');
      return parts.join(' ');
    }

    // 5. Article / blog post
    if (data.isArticle && data.wordCount > 100) {
      parts.push(`${greeting} This is an article on ${data.siteName}.`);
      if (data.headings[0]) {
        parts.push(`"${shorten(data.headings[0], 55)}".`);
      }
      if (data.description) {
        parts.push(shorten(data.description, 100));
      } else if (data.mainText) {
        const firstSentence = data.mainText.split(/[.!?]/).filter(s => s.trim().length > 20)[0];
        if (firstSentence) parts.push(shorten(firstSentence.trim(), 100) + '.');
      }
      const readTime = Math.ceil(data.wordCount / 200);
      parts.push(`About ${readTime} min read.`);
      return parts.join(' ');
    }

    // 6. Video page (non-YouTube)
    if (data.isVideo) {
      parts.push(`${greeting} Video page on ${data.siteName}!`);
      if (data.headings[0]) parts.push(`"${shorten(data.headings[0], 50)}".`);
      parts.push('Looks interesting!');
      return parts.join(' ');
    }

    // 7. General page with content
    if (data.title) {
      const cleanTitle = data.title.replace(/\s*[-|–]\s*.*$/, '').trim();
      parts.push(`${greeting} You're on "${shorten(cleanTitle, 50)}" — ${data.siteName}.`);
    } else {
      parts.push(`${greeting} Browsing ${data.siteName}.`);
    }

    if (data.description) {
      parts.push(shorten(data.description, 100));
    } else if (data.headings.length > 1) {
      parts.push(`Sections: ${data.headings.slice(0, 3).map(h => '"' + shorten(h, 25) + '"').join(', ')}.`);
    } else if (data.mainText && data.wordCount > 20) {
      const snippet = data.mainText.split(/[.!?]/).filter(s => s.trim().length > 15)[0];
      if (snippet) parts.push(shorten(snippet.trim(), 100) + '.');
    }

    if (data.imageCount > 10) {
      parts.push(`Lots of images here (${data.imageCount})!`);
    }

    return parts.join(' ') || `${greeting} Browsing ${data.siteName}. Interesting page!`;
  }

  // ====== MAIN ACTION ======

  // Manual read (from menu) — with "reading" animation
  function readPage() {
    if (_dailyCount >= MAX_DAILY) {
      BrowseBuddy.say("I've read so many pages today! My eyes need a rest.");
      return;
    }
    _dailyCount++;

    BrowseBuddy.say("Let me read this page for you...");

    const canvas = BrowseBuddy.getCanvas();
    if (canvas) {
      canvas.style.animation = 'bb-wiggle 0.4s ease 3';
      setTimeout(() => { canvas.style.animation = ''; }, 1200);
    }

    setTimeout(() => {
      deliverSummary(false); // manual read — don't include greeting
    }, 2500);
  }

  // Auto read — priority delivery, includes greeting
  function autoRead() {
    if (_dailyCount >= MAX_DAILY) return;
    _dailyCount++;
    deliverSummary(true); // auto read — include greeting prefix
  }

  function deliverSummary(withGreeting) {
    try {
      const data = getPageData();
      const summary = generateSummary(data);

      if (withGreeting) {
        // Use priority speech to override any queued generic messages
        BrowseBuddy.sayPriority(summary);
      } else {
        // Manual read — just use normal say (user triggered it)
        BrowseBuddy.say(summary);
      }
    } catch (err) {
      console.error('[BrowseBuddy] Page summary error:', err);
      const hostname = window.location.hostname.replace(/^www\./, '');
      const fallback = `${getGreetingPrefix()} Browsing ${hostname}. Interesting page!`;
      if (withGreeting) {
        BrowseBuddy.sayPriority(fallback);
      } else {
        BrowseBuddy.say(fallback);
      }
    }

    // Clear pending flag
    window.__bbSummaryPending = false;
    try { BrowseBuddy.setSummaryPending(false); } catch (e) {}

    try { BuddyRewards.addXP(5); } catch (e) {}
  }

  // ====== AUTO-TRIGGER ON PAGE LOAD ======
  let _lastSummarizedUrl = '';

  function autoSummarizeIfNew() {
    const currentUrl = window.location.href.split('#')[0]; // ignore hash changes
    if (currentUrl === _lastSummarizedUrl) return;
    _lastSummarizedUrl = currentUrl;

    // Delay to let page content load — 3s gives enough time for DOM to render
    setTimeout(() => {
      autoRead();
    }, 3000);
  }

  // Initial auto-summary on page load
  autoSummarizeIfNew();

  // Watch for SPA navigations (URL changes without full reload)
  let _urlCheckInterval = setInterval(() => {
    const currentUrl = window.location.href.split('#')[0];
    if (currentUrl !== _lastSummarizedUrl) {
      // Set pending flag again for SPA nav
      window.__bbSummaryPending = true;
      try { BrowseBuddy.setSummaryPending(true); } catch (e) {}
      autoSummarizeIfNew();
    }
  }, 6000);

  // Cleanup
  window.addEventListener('beforeunload', () => {
    clearInterval(_urlCheckInterval);
  });

  // Manual read still available from menu
  BrowseBuddy.registerMenuAction('summary', '📖', 'Read Page', readPage);
})();
