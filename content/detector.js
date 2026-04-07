/**
 * BrowseBuddy — Context Detection Engine
 * Analyzes the current page to determine browsing context category
 */
const BuddyDetector = (() => {
  const CONTEXT_MAP = {
    incognito: {
      trigger: 'browser_state',
      buddyState: 'NAUGHTY_REACTION',
      priority: 10
    },
    adult: {
      keywords: ['porn', 'xxx', 'nsfw', 'onlyfans', 'xvideos', 'pornhub', 'xhamster', 'redtube'],
      domains: ['pornhub.com', 'xvideos.com', 'xhamster.com', 'onlyfans.com', 'redtube.com'],
      buddyState: 'SHY_COVERING_EYES',
      priority: 9
    },
    shopping: {
      keywords: ['buy', 'cart', 'checkout', 'price', 'deal', 'sale', 'discount', 'add to cart', 'shop', 'order now'],
      domains: ['amazon.*', 'ebay.com', 'walmart.com', 'flipkart.com', 'shopee.*', 'lazada.*', 'etsy.com', 'target.com', 'bestbuy.com', 'myntra.com', 'ajio.com'],
      buddyState: 'SHOPPING_EXCITED',
      priority: 8
    },
    sports: {
      keywords: ['score', 'match', 'cricket', 'football', 'nba', 'nfl', 'fifa', 'league', 'tournament', 'ipl', 'goal', 'wicket', 'touchdown', 'innings', 'batsman', 'bowling'],
      domains: ['espn.com', 'espncricinfo.com', 'cricbuzz.com', 'goal.com', 'nba.com', 'nfl.com', 'skysports.com', 'bcci.tv', 'icc-cricket.com'],
      buddyState: 'SPORTS_FAN',
      priority: 7
    },
    gaming: {
      keywords: ['game', 'steam', 'playstation', 'xbox', 'nintendo', 'esports', 'twitch', 'gameplay', 'walkthrough', 'fps'],
      domains: ['store.steampowered.com', 'twitch.tv', 'ign.com', 'gamespot.com', 'epicgames.com', 'riotgames.com'],
      buddyState: 'GAMER_MODE',
      priority: 7
    },
    coding: {
      keywords: ['function', 'const', 'import', 'class', 'api', 'github', 'stackoverflow', 'code', 'debug', 'error', 'repository', 'commit', 'pull request', 'merge'],
      domains: ['github.com', 'stackoverflow.com', 'gitlab.com', 'codepen.io', 'leetcode.com', 'replit.com', 'dev.to', 'hackernews.com', 'news.ycombinator.com', 'codeforces.com'],
      buddyState: 'HACKER_MODE',
      priority: 6
    },
    music: {
      keywords: ['playlist', 'song', 'album', 'artist', 'listen', 'track', 'lyrics', 'concert'],
      domains: ['spotify.com', 'music.youtube.com', 'soundcloud.com', 'music.apple.com', 'bandcamp.com', 'last.fm', 'gaana.com', 'jiosaavn.com'],
      buddyState: 'VIBING',
      priority: 6
    },
    social: {
      keywords: ['feed', 'post', 'tweet', 'story', 'reel', 'follow', 'like', 'share', 'comment', 'viral'],
      domains: ['twitter.com', 'x.com', 'instagram.com', 'facebook.com', 'reddit.com', 'linkedin.com', 'threads.net', 'tiktok.com', 'mastodon.social'],
      buddyState: 'SOCIAL_SCROLLING',
      priority: 5
    },
    food: {
      keywords: ['recipe', 'restaurant', 'food', 'delivery', 'menu', 'order', 'cook', 'ingredients', 'cuisine', 'calories'],
      domains: ['zomato.com', 'swiggy.com', 'ubereats.com', 'doordash.com', 'grubhub.com', 'foodpanda.*', 'grab.com', 'allrecipes.com'],
      buddyState: 'FOODIE_MODE',
      priority: 5
    },
    finance: {
      keywords: ['stock', 'crypto', 'invest', 'trading', 'portfolio', 'market', 'bitcoin', 'nifty', 'sensex', 'mutual fund', 'etf', 'dividend'],
      domains: ['tradingview.com', 'coinmarketcap.com', 'moneycontrol.com', 'robinhood.com', 'zerodha.com', 'binance.com', 'coingecko.com', 'finance.yahoo.com'],
      buddyState: 'MONEY_EYES',
      priority: 5
    },
    news: {
      keywords: ['breaking', 'headline', 'report', 'politics', 'election', 'world', 'exclusive', 'investigation'],
      domains: ['bbc.com', 'cnn.com', 'reuters.com', 'aljazeera.com', 'straitstimes.com', 'nytimes.com', 'theguardian.com', 'washingtonpost.com', 'ndtv.com', 'thehindu.com'],
      buddyState: 'NEWS_READER',
      priority: 4
    },
    video: {
      keywords: ['watch', 'video', 'stream', 'episode', 'movie', 'series', 'trailer', 'subscribe'],
      domains: ['youtube.com', 'netflix.com', 'primevideo.com', 'disneyplus.com', 'hotstar.com', 'hulu.com', 'vimeo.com', 'crunchyroll.com'],
      buddyState: 'WATCHING_MODE',
      priority: 4
    }
  };

  let _isIncognito = false;
  let _lastContext = 'default';

  function setIncognito(value) {
    _isIncognito = value;
  }

  function isIncognito() {
    return _isIncognito;
  }

  function matchesDomain(hostname, pattern) {
    // Handle wildcard patterns like "amazon.*"
    if (pattern.includes('*')) {
      const regex = new RegExp('^' + pattern.replace(/\./g, '\\.').replace(/\*/g, '.*') + '$');
      return regex.test(hostname);
    }
    return hostname === pattern || hostname.endsWith('.' + pattern);
  }

  function extractSearchQuery() {
    const url = new URL(window.location.href);
    const searchParams = ['q', 'query', 'search_query', 'search', 'p'];
    for (const param of searchParams) {
      const val = url.searchParams.get(param);
      if (val) return val.toLowerCase();
    }
    return '';
  }

  function getMetaContent() {
    const tags = ['description', 'keywords', 'og:type', 'og:title', 'og:description'];
    let content = '';
    tags.forEach((name) => {
      const el = document.querySelector(`meta[name="${name}"], meta[property="${name}"]`);
      if (el) content += ' ' + (el.getAttribute('content') || '');
    });
    return content.toLowerCase();
  }

  function getBodySample() {
    const body = document.body;
    if (!body) return '';
    const text = body.innerText || '';
    return text.substring(0, 500).toLowerCase();
  }

  function detect() {
    if (_isIncognito) {
      return {
        category: 'incognito',
        buddyState: 'NAUGHTY_REACTION',
        priority: 10,
        confidence: 1.0
      };
    }

    const hostname = window.location.hostname.replace(/^www\./, '');
    const url = window.location.href.toLowerCase();
    const title = (document.title || '').toLowerCase();
    const searchQuery = extractSearchQuery();
    const metaContent = getMetaContent();
    const bodySample = getBodySample();

    const allText = `${url} ${title} ${searchQuery} ${metaContent} ${bodySample}`;

    let bestMatch = { category: 'default', buddyState: 'IDLE', priority: 0, confidence: 0 };

    for (const [category, config] of Object.entries(CONTEXT_MAP)) {
      if (category === 'incognito') continue;

      let score = 0;
      let maxScore = 0;

      // Domain matching (highest weight)
      if (config.domains) {
        maxScore += 10;
        for (const domain of config.domains) {
          if (matchesDomain(hostname, domain)) {
            score += 10;
            break;
          }
        }
      }

      // Keyword matching
      if (config.keywords) {
        maxScore += config.keywords.length;
        let keywordHits = 0;
        for (const keyword of config.keywords) {
          if (allText.includes(keyword)) {
            keywordHits++;
          }
        }
        score += keywordHits;

        // Title keywords get extra weight
        for (const keyword of config.keywords) {
          if (title.includes(keyword)) score += 2;
        }

        // Search query keywords get extra weight
        if (searchQuery) {
          for (const keyword of config.keywords) {
            if (searchQuery.includes(keyword)) score += 3;
          }
        }
      }

      const confidence = maxScore > 0 ? Math.min(score / maxScore, 1.0) : 0;

      // Must have at least some signal
      if (score < 2 && !config.domains?.some((d) => matchesDomain(hostname, d))) continue;

      const effectivePriority = config.priority + confidence * 2;

      if (effectivePriority > bestMatch.priority + bestMatch.confidence * 2) {
        bestMatch = {
          category,
          buddyState: config.buddyState,
          priority: config.priority,
          confidence
        };
      }
    }

    _lastContext = bestMatch.category;
    return bestMatch;
  }

  function getLastContext() {
    return _lastContext;
  }

  function getContextMap() {
    return CONTEXT_MAP;
  }

  return {
    detect,
    setIncognito,
    isIncognito,
    getLastContext,
    getContextMap,
    matchesDomain
  };
})();
