/**
 * BrowseBuddy — Affiliate Engine
 * Handles affiliate link injection, cashback tracking, and deal detection
 * Supports two tracking types:
 *   - 'direct': URL parameter injection (Amazon Associates)
 *   - 'involve_asia': Redirect-based deeplink tracking (Shopee, Lazada via Involve Asia)
 */
const BuddyAffiliate = (() => {
  const INVOLVE_ASIA_BASE = 'https://invl.me/';

  const AFFILIATE_CONFIG = {
    // Amazon — direct tag injection
    'amazon.com': { type: 'direct', paramName: 'tag', tagValue: 'browsebuddy05-20', cashbackPercent: 3, name: 'Amazon' },
    'amazon.in': { type: 'direct', paramName: 'tag', tagValue: 'browsebuddy05-20', cashbackPercent: 3, name: 'Amazon India' },
    'amazon.co.uk': { type: 'direct', paramName: 'tag', tagValue: 'browsebuddy05-20', cashbackPercent: 3, name: 'Amazon UK' },
    'amazon.sg': { type: 'direct', paramName: 'tag', tagValue: 'browsebuddy05-20', cashbackPercent: 3, name: 'Amazon SG' },
    'amazon.ca': { type: 'direct', paramName: 'tag', tagValue: 'browsebuddy05-20', cashbackPercent: 3, name: 'Amazon CA' },
    'amazon.de': { type: 'direct', paramName: 'tag', tagValue: 'browsebuddy05-20', cashbackPercent: 3, name: 'Amazon DE' },
    'amazon.fr': { type: 'direct', paramName: 'tag', tagValue: 'browsebuddy05-20', cashbackPercent: 3, name: 'Amazon FR' },
    'amazon.co.jp': { type: 'direct', paramName: 'tag', tagValue: 'browsebuddy05-20', cashbackPercent: 3, name: 'Amazon JP' },
    'amazon.com.au': { type: 'direct', paramName: 'tag', tagValue: 'browsebuddy05-20', cashbackPercent: 3, name: 'Amazon AU' },
    'amazon.com.br': { type: 'direct', paramName: 'tag', tagValue: 'browsebuddy05-20', cashbackPercent: 3, name: 'Amazon BR' },
    // Shopee — Involve Asia deeplink tracking
    'shopee.sg': { type: 'involve_asia', deeplink: 'clndq5z', cashbackPercent: 4, name: 'Shopee SG' },
    // Lazada — pending Involve Asia approval
    'lazada.sg': { type: 'involve_asia', deeplink: 'PENDING', cashbackPercent: 1, name: 'Lazada SG', active: false },
    'lazada.com.my': { type: 'involve_asia', deeplink: 'PENDING', cashbackPercent: 1, name: 'Lazada MY', active: false }
  };

  let _currentRetailer = null;
  let _affiliateActive = false;
  let _injectedLinks = new Set();

  function getRetailerForHostname(hostname) {
    hostname = hostname.replace(/^www\./, '');
    for (const [domain, config] of Object.entries(AFFILIATE_CONFIG)) {
      if (config.active === false) continue;
      if (hostname === domain || hostname.endsWith('.' + domain)) {
        return { domain, ...config };
      }
    }
    return null;
  }

  // Build Involve Asia tracking URL for a given destination
  function buildInvolveAsiaUrl(destinationUrl, deeplink) {
    return INVOLVE_ASIA_BASE + deeplink + '?url=' + encodeURIComponent(destinationUrl);
  }

  // Check if we already redirected through Involve Asia this session
  function hasBeenTracked(domain) {
    try {
      return sessionStorage.getItem('bb_ia_' + domain) === '1';
    } catch { return false; }
  }

  function markAsTracked(domain) {
    try {
      sessionStorage.setItem('bb_ia_' + domain, '1');
    } catch { /* private browsing */ }
  }

  function injectAffiliateTag(url, retailer) {
    if (!retailer) return url;

    try {
      if (retailer.type === 'involve_asia') {
        return buildInvolveAsiaUrl(url, retailer.deeplink);
      }

      // Direct type (Amazon)
      const urlObj = new URL(url);
      if (urlObj.searchParams.has(retailer.paramName)) return url;
      urlObj.searchParams.set(retailer.paramName, retailer.tagValue);

      BuddyAnalytics.track('affiliate_impression', {
        retailer: retailer.name,
        domain: retailer.domain
      });

      return urlObj.toString();
    } catch {
      return url;
    }
  }

  function isProductPage() {
    const url = window.location.href.toLowerCase();
    const title = document.title.toLowerCase();
    const indicators = [
      '/dp/', '/product/', '/item/', '/p/',
      'add to cart', 'buy now', 'add to bag'
    ];

    return indicators.some((ind) => url.includes(ind) || title.includes(ind)) ||
           document.querySelector('[data-product-id], [data-item-id], .product-title, .a-price, .product-price') !== null;
  }

  function isCheckoutPage() {
    const url = window.location.href.toLowerCase();
    const checkoutIndicators = ['checkout', 'cart', 'basket', 'order', 'payment'];
    return checkoutIndicators.some((ind) => url.includes(ind));
  }

  function scanAndInjectLinks() {
    if (!_currentRetailer) return;

    // For Involve Asia retailers, don't inject into on-page links (tracking is via redirect)
    if (_currentRetailer.type === 'involve_asia') return;

    const links = document.querySelectorAll('a[href]');
    let injected = 0;

    links.forEach((link) => {
      const href = link.getAttribute('href');
      if (!href || _injectedLinks.has(href)) return;

      try {
        const linkUrl = new URL(href, window.location.origin);
        const linkHost = linkUrl.hostname.replace(/^www\./, '');

        if (linkHost === _currentRetailer.domain || linkHost.endsWith('.' + _currentRetailer.domain)) {
          if (!linkUrl.searchParams.has(_currentRetailer.paramName)) {
            linkUrl.searchParams.set(_currentRetailer.paramName, _currentRetailer.tagValue);
            link.setAttribute('href', linkUrl.toString());
            _injectedLinks.add(href);
            injected++;
          }
        }
      } catch {
        // Invalid URL, skip
      }
    });

    if (injected > 0) {
      BuddyAnalytics.track('affiliate_links_injected', {
        retailer: _currentRetailer.name,
        count: injected
      });
    }

    return injected;
  }

  function init() {
    const hostname = window.location.hostname.replace(/^www\./, '');
    _currentRetailer = getRetailerForHostname(hostname);

    if (!_currentRetailer) return;

    _affiliateActive = true;

    if (_currentRetailer.type === 'involve_asia') {
      // Involve Asia: one-time redirect through tracking URL (product pages only)
      if (isProductPage() && !hasBeenTracked(_currentRetailer.domain)) {
        markAsTracked(_currentRetailer.domain);
        const trackingUrl = buildInvolveAsiaUrl(window.location.href, _currentRetailer.deeplink);

        BuddyAnalytics.track('affiliate_redirect', {
          retailer: _currentRetailer.name,
          domain: _currentRetailer.domain,
          type: 'involve_asia'
        });

        window.location.replace(trackingUrl);
        return; // Page will redirect through Involve Asia
      }
    } else {
      // Direct (Amazon): inject tag into URL on product pages
      if (isProductPage()) {
        const currentUrl = new URL(window.location.href);
        if (!currentUrl.searchParams.has(_currentRetailer.paramName)) {
          currentUrl.searchParams.set(_currentRetailer.paramName, _currentRetailer.tagValue);
          window.location.replace(currentUrl.toString());
          return;
        }
      }

      // Scan and inject links on non-product pages
      scanAndInjectLinks();
    }

    // Show pet badge
    if (typeof BrowseBuddy !== 'undefined') {
      BrowseBuddy.showAffiliateBadge(`${_currentRetailer.cashbackPercent}% back`);

      BrowseBuddy.onAffiliateBadgeClick(() => {
        BrowseBuddy.say(`Shop through BrowseBuddy and earn ${_currentRetailer.cashbackPercent}% cashback on ${_currentRetailer.name}!`);
      });

      if (isCheckoutPage()) {
        BrowseBuddy.say("Checkout time! Your cashback is being tracked!");
      }
    }

    // Re-scan on DOM mutations (direct type only)
    if (_currentRetailer.type !== 'involve_asia') {
      const observer = new MutationObserver(() => {
        scanAndInjectLinks();
      });

      observer.observe(document.body, {
        childList: true,
        subtree: true
      });
    }
  }

  function getActiveDeals() {
    return Object.entries(AFFILIATE_CONFIG)
      .filter(([, config]) => config.active !== false)
      .map(([domain, config]) => ({
        domain,
        name: config.name,
        cashbackPercent: config.cashbackPercent
      }));
  }

  function getCurrentRetailer() {
    return _currentRetailer;
  }

  function isActive() {
    return _affiliateActive;
  }

  return {
    init,
    getActiveDeals,
    getCurrentRetailer,
    isActive,
    isProductPage,
    isCheckoutPage,
    injectAffiliateTag,
    buildInvolveAsiaUrl,
    AFFILIATE_CONFIG
  };
})();
