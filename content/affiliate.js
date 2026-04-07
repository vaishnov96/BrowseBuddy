/**
 * BrowseBuddy — Affiliate Engine
 * Handles affiliate link injection, cashback tracking, and deal detection
 */
const BuddyAffiliate = (() => {
  // Only include retailers with verified affiliate tags
  // Add more as you sign up for their programs
  const AFFILIATE_CONFIG = {
    'amazon.com': {
      paramName: 'tag',
      tagValue: 'browsebuddy05-20',
      cashbackPercent: 3,
      name: 'Amazon'
    },
    'amazon.in': {
      paramName: 'tag',
      tagValue: 'browsebuddy05-20',
      cashbackPercent: 3,
      name: 'Amazon India'
    },
    'amazon.co.uk': {
      paramName: 'tag',
      tagValue: 'browsebuddy05-20',
      cashbackPercent: 3,
      name: 'Amazon UK'
    }
  };

  let _currentRetailer = null;
  let _affiliateActive = false;
  let _injectedLinks = new Set();

  function getRetailerForHostname(hostname) {
    hostname = hostname.replace(/^www\./, '');
    for (const [domain, config] of Object.entries(AFFILIATE_CONFIG)) {
      if (hostname === domain || hostname.endsWith('.' + domain)) {
        return { domain, ...config };
      }
    }
    return null;
  }

  function injectAffiliateTag(url, retailer) {
    if (!retailer) return url;

    try {
      const urlObj = new URL(url);

      // Don't override existing affiliate tags
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

    // Inject affiliate tag into current URL if it's a product page
    if (isProductPage()) {
      const newUrl = injectAffiliateTag(window.location.href, _currentRetailer);
      if (newUrl !== window.location.href) {
        window.history.replaceState(null, '', newUrl);
      }
    }

    // Scan and inject links
    scanAndInjectLinks();

    // Show pet badge
    if (typeof BrowseBuddy !== 'undefined') {
      BrowseBuddy.showAffiliateBadge(`${_currentRetailer.cashbackPercent}% back`);

      BrowseBuddy.onAffiliateBadgeClick(() => {
        BrowseBuddy.say(`Shop through BrowseBuddy and earn ${_currentRetailer.cashbackPercent}% cashback on ${_currentRetailer.name}!`);
      });

      // Extra excitement on checkout
      if (isCheckoutPage()) {
        BrowseBuddy.say("Checkout time! Your cashback is being tracked!");
      }
    }

    // Re-scan on DOM mutations (for SPAs and dynamic content)
    const observer = new MutationObserver(() => {
      scanAndInjectLinks();
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true
    });
  }

  function getActiveDeals() {
    return Object.entries(AFFILIATE_CONFIG).map(([domain, config]) => ({
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
    AFFILIATE_CONFIG
  };
})();
