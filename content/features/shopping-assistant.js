/**
 * BrowseBuddy Feature — Shopping Assistant
 * Review summaries, deal detection, price drop alerts, coupon finder.
 * Only activates on supported shopping sites (Amazon for now).
 */
(() => {
  // Amazon DOM selectors (with fallbacks for A/B test variants)
  const SEL = {
    productTitle: '#productTitle',
    asin: 'input[name="ASIN"], [data-asin]',

    // Reviews
    starRating: '#acrPopover .a-icon-alt, [data-action="acrStarsLink-click-metrics"] .a-icon-alt',
    reviewCount: '#acrCustomerReviewText',
    reviewHighlights: '[data-hook="cr-lighthouse-term"]',

    // Pricing
    currentPrice: '.a-price .a-offscreen, #priceblock_ourprice, #priceblock_dealprice, .priceToPay .a-offscreen',
    originalPrice: '.a-price[data-a-strike="true"] .a-offscreen, .priceBlockStrikePriceString, #listPrice',
    dealBadge: '#dealBadge_feature_div, .deal-badge, [data-a-badge-type="deal"]',
    limitedDeal: '.limitedTimeDealBanner, #dealBadge_feature_div .a-badge-text',

    // Coupons
    couponBadge: '#couponBadgeRegularVpc, #vpcButton, .couponBadge',
    couponText: '#couponText, #vpcButton .a-color-success, .promoPriceBlockMessage',
    clipCouponCheckbox: '#couponBadgeRegularVpc input[type="checkbox"], #vpcButton input',
    promoMessages: '.a-section .promoPriceBlockMessage, #applicable_promotion_list_sec'
  };

  const PRICE_HISTORY_KEY = 'bb_price_history';
  const MAX_ASINS = 200;
  const MAX_SNAPSHOTS = 30;
  let _lastProcessedUrl = '';

  // ====== DOM SCRAPING ======

  function scrapeProductData() {
    const data = {
      asin: null, title: null,
      currentPrice: null, originalPrice: null, currency: '',
      savingsPercent: 0, savingsAmount: 0,
      starRating: null, reviewCount: null,
      reviewHighlights: [],
      dealType: null,
      coupons: [],
      promoText: null
    };

    // ASIN
    const asinInput = document.querySelector('input[name="ASIN"]');
    if (asinInput) {
      data.asin = asinInput.value;
    } else {
      const asinEl = document.querySelector('[data-asin]');
      if (asinEl) data.asin = asinEl.getAttribute('data-asin');
    }

    // Title
    const titleEl = document.querySelector(SEL.productTitle);
    data.title = titleEl?.textContent?.trim() || document.title;

    // Star rating
    const starEl = document.querySelector(SEL.starRating);
    if (starEl) {
      const match = starEl.textContent.match(/([\d.]+)\s+out\s+of\s+(\d+)/);
      if (match) data.starRating = parseFloat(match[1]);
    }

    // Review count
    const countEl = document.querySelector(SEL.reviewCount);
    if (countEl) {
      const match = countEl.textContent.match(/([\d,]+)\s*(?:ratings|reviews|global ratings)/i);
      if (match) data.reviewCount = parseInt(match[1].replace(/,/g, ''));
    }

    // Review highlights (Amazon's "customers say" chips)
    const highlightEls = document.querySelectorAll(SEL.reviewHighlights);
    for (let i = 0; i < Math.min(highlightEls.length, 6); i++) {
      const text = highlightEls[i]?.textContent?.trim();
      if (text) data.reviewHighlights.push(text);
    }

    // Current price
    const priceResult = scrapePrice(SEL.currentPrice);
    if (priceResult) {
      data.currentPrice = priceResult.value;
      data.currency = priceResult.currency;
    }

    // Original price
    const origResult = scrapePrice(SEL.originalPrice);
    if (origResult) {
      data.originalPrice = origResult.value;
    }

    // Calculate savings
    if (data.currentPrice && data.originalPrice && data.originalPrice > data.currentPrice) {
      data.savingsAmount = Math.round((data.originalPrice - data.currentPrice) * 100) / 100;
      data.savingsPercent = Math.round((data.savingsAmount / data.originalPrice) * 100);
    }

    // Deal badge
    if (document.querySelector(SEL.limitedDeal)) {
      data.dealType = 'limited';
    } else if (document.querySelector(SEL.dealBadge)) {
      data.dealType = 'deal';
    }

    // Coupons
    const couponEl = document.querySelector(SEL.couponBadge);
    if (couponEl) {
      const textEl = couponEl.querySelector('.a-color-success, #couponText') || couponEl;
      const text = textEl?.textContent?.trim() || '';
      const checkbox = couponEl.querySelector('input[type="checkbox"]');
      const clipped = checkbox ? checkbox.checked : false;
      if (text) {
        data.coupons.push({ text: text.substring(0, 100), clipped });
      }
    }

    // Additional promos
    const promoEl = document.querySelector(SEL.promoMessages);
    if (promoEl) {
      const text = promoEl.textContent.trim();
      if (text && text.length > 5 && text.length < 200) {
        data.promoText = text.substring(0, 120);
      }
    }

    return data;
  }

  function scrapePrice(selectorStr) {
    const selectors = selectorStr.split(',').map(s => s.trim());
    for (const sel of selectors) {
      const el = document.querySelector(sel);
      if (!el) continue;
      const text = el.textContent.trim();
      const match = text.match(/([₹$£€])\s*([\d,]+\.?\d*)/);
      if (match) {
        return {
          currency: match[1],
          value: parseFloat(match[2].replace(/,/g, ''))
        };
      }
      // Try without currency symbol
      const numMatch = text.match(/([\d,]+\.?\d+)/);
      if (numMatch) {
        return { currency: '$', value: parseFloat(numMatch[1].replace(/,/g, '')) };
      }
    }
    return null;
  }

  // ====== FEATURE 1: REVIEW SUMMARY ======

  function generateReviewSummary(data) {
    if (!data.starRating || !data.reviewCount) return null;

    const r = data.starRating;
    const count = data.reviewCount >= 1000
      ? (data.reviewCount / 1000).toFixed(1) + 'k'
      : data.reviewCount;

    const highlights = data.reviewHighlights;
    let summary = '';

    if (r >= 4.5) {
      summary = `${r} stars from ${count} reviews! Highly rated.`;
      if (highlights.length >= 2) {
        summary += ` People love the ${highlights[0].toLowerCase()} and ${highlights[1].toLowerCase()}.`;
      }
    } else if (r >= 4.0) {
      summary = `${r} stars from ${count} reviews — solid choice!`;
      if (highlights.length >= 2) {
        summary += ` Good ${highlights[0].toLowerCase()}, though some mention ${highlights[highlights.length - 1].toLowerCase()}.`;
      }
    } else if (r >= 3.0) {
      summary = `${r} stars from ${count} reviews — mixed feelings on this one.`;
      if (highlights.length > 0) {
        summary += ` Check the reviews about ${highlights[highlights.length - 1].toLowerCase()}.`;
      }
    } else {
      summary = `Heads up — only ${r} stars from ${count} reviews. You might want to check the reviews carefully.`;
    }

    return summary;
  }

  // ====== FEATURE 2: DEAL FINDER ======

  function generateDealInfo(data) {
    if (!data.currentPrice) return null;

    const parts = [];

    if (data.savingsPercent > 0) {
      parts.push(`${data.savingsPercent}% off! ${data.currency}${data.currentPrice} (was ${data.currency}${data.originalPrice})`);
      if (data.savingsPercent >= 30) {
        parts.push('That\'s a great deal!');
      }
    }

    if (data.dealType === 'limited') {
      parts.push('Limited time deal — might end soon!');
    } else if (data.dealType === 'deal') {
      parts.push('This has a deal badge on it!');
    }

    if (parts.length === 0) return null;
    return parts.join(' ');
  }

  // ====== FEATURE 3: PRICE DROP ALERTS ======

  async function checkPriceHistory(data) {
    if (!data.asin || !data.currentPrice) return null;

    try {
      const stored = await BuddyStorage.getLocal([PRICE_HISTORY_KEY]);
      let history = stored[PRICE_HISTORY_KEY] || {};

      const entry = history[data.asin];
      let speech = null;

      if (entry && entry.prices.length > 0) {
        const lastSnapshot = entry.prices[entry.prices.length - 1];
        const lastPrice = lastSnapshot.price;
        const delta = Math.round((lastPrice - data.currentPrice) * 100) / 100;

        if (delta > 0) {
          // Price dropped
          speech = `Price drop! This was ${data.currency}${lastPrice} last time — now ${data.currency}${data.currentPrice}. You save ${data.currency}${delta}!`;

          if (data.currentPrice <= (entry.lowestSeen || Infinity)) {
            speech = `Lowest price I've tracked! ${data.currency}${data.currentPrice} — it was ${data.currency}${lastPrice} before. Good time to buy!`;
          }
        } else if (delta < 0) {
          // Price went up
          const increase = Math.abs(delta);
          if (increase > 1) {
            speech = `This went up ${data.currency}${increase} since last time (was ${data.currency}${lastPrice}). You might want to wait.`;
          }
        }
        // delta === 0: say nothing
      }

      // Record current price
      if (!history[data.asin]) {
        history[data.asin] = {
          title: (data.title || '').substring(0, 100),
          prices: [],
          lowestSeen: data.currentPrice,
          highestSeen: data.currentPrice,
          currency: data.currency
        };
      }

      const record = history[data.asin];
      record.prices.push({
        price: data.currentPrice,
        date: new Date().toISOString()
      });

      // Cap snapshots
      if (record.prices.length > MAX_SNAPSHOTS) {
        record.prices = record.prices.slice(-MAX_SNAPSHOTS);
      }

      // Update min/max
      if (data.currentPrice < (record.lowestSeen || Infinity)) record.lowestSeen = data.currentPrice;
      if (data.currentPrice > (record.highestSeen || 0)) record.highestSeen = data.currentPrice;

      // Cap total ASINs
      const asins = Object.keys(history);
      if (asins.length > MAX_ASINS) {
        const sorted = asins.map(a => ({
          asin: a,
          lastDate: history[a].prices[history[a].prices.length - 1]?.date || ''
        })).sort((a, b) => a.lastDate.localeCompare(b.lastDate));

        for (let i = 0; i < sorted.length - MAX_ASINS; i++) {
          delete history[sorted[i].asin];
        }
      }

      await BuddyStorage.setLocal({ [PRICE_HISTORY_KEY]: history });
      return speech;
    } catch (err) {
      console.error('[BrowseBuddy] Price history error:', err);
      return null;
    }
  }

  // ====== FEATURE 4: COUPON FINDER ======

  function detectCoupons(data) {
    if (data.coupons.length === 0 && !data.promoText) return null;

    const parts = [];
    for (const coupon of data.coupons) {
      if (coupon.clipped) {
        parts.push('Coupon already clipped — nice!');
      } else {
        parts.push(`There's a coupon! ${coupon.text}. Don't forget to clip it!`);
      }
    }

    if (data.promoText && parts.length === 0) {
      parts.push(`Promo available: ${data.promoText}`);
    }

    return parts.join(' ') || null;
  }

  // ====== SHOPPING PANEL (manual trigger) ======

  function showShoppingPanel() {
    if (!BuddyAffiliate.isActive() || !BuddyAffiliate.isProductPage()) {
      BrowseBuddy.say("I can only sniff out deals on product pages! Try visiting an Amazon product.");
      return;
    }

    const data = scrapeProductData();
    if (!data.asin && !data.currentPrice) {
      BrowseBuddy.say("I'm having trouble reading this product page. Try refreshing!");
      return;
    }

    // Remove existing panel
    const old = document.querySelector('.bb-shopping-panel');
    if (old) old.remove();

    const container = BrowseBuddy.getContainer();
    if (!container) return;

    const panel = document.createElement('div');
    panel.className = 'bb-shopping-panel';

    let html = '<div class="bb-shopping-title">Shopping Assistant</div>';

    // Star rating row
    if (data.starRating) {
      const countStr = data.reviewCount
        ? (data.reviewCount >= 1000 ? (data.reviewCount / 1000).toFixed(1) + 'k' : data.reviewCount)
        : '';
      html += `<div class="bb-shopping-row">
        <span class="bb-shopping-icon">⭐</span>
        <span>${data.starRating} stars${countStr ? ' (' + countStr + ' reviews)' : ''}</span>
      </div>`;
    }

    // Price row
    if (data.currentPrice) {
      let priceText = `${data.currency}${data.currentPrice}`;
      if (data.savingsPercent > 0) {
        priceText += ` <span class="bb-shopping-savings">(was ${data.currency}${data.originalPrice}, -${data.savingsPercent}%)</span>`;
      }
      html += `<div class="bb-shopping-row">
        <span class="bb-shopping-icon">💰</span>
        <span>${priceText}</span>
      </div>`;
    }

    // Deal badge
    if (data.dealType) {
      const dealLabel = data.dealType === 'limited' ? 'Limited Time Deal' : 'Deal Active';
      html += `<div class="bb-shopping-row bb-shopping-deal">
        <span class="bb-shopping-icon">🔥</span>
        <span>${dealLabel}</span>
      </div>`;
    }

    // Coupon row
    if (data.coupons.length > 0) {
      const c = data.coupons[0];
      html += `<div class="bb-shopping-row bb-shopping-coupon">
        <span class="bb-shopping-icon">🎟️</span>
        <span>${c.clipped ? 'Coupon clipped' : c.text}</span>
      </div>`;
    }

    // Highlights
    if (data.reviewHighlights.length > 0) {
      const chips = data.reviewHighlights.slice(0, 4).map(h =>
        `<span class="bb-shopping-chip">${h}</span>`
      ).join('');
      html += `<div class="bb-shopping-row">
        <span class="bb-shopping-icon">💬</span>
        <span class="bb-shopping-chips">${chips}</span>
      </div>`;
    }

    if (!data.starRating && !data.currentPrice && data.coupons.length === 0) {
      html += '<div class="bb-shopping-row"><span>No deals or reviews found on this page.</span></div>';
    }

    panel.innerHTML = html;
    container.appendChild(panel);

    requestAnimationFrame(() => panel.classList.add('bb-visible'));

    const dismiss = () => panel.classList.remove('bb-visible');
    panel.addEventListener('click', dismiss);
    setTimeout(dismiss, 12000);

    try { BuddyRewards.addXP(2); } catch (e) {}
  }

  // ====== SPEECH DELIVERY ======

  function deliverFindings(data) {
    const speeches = [];

    // Priority order: coupon > price drop > deal > review
    const couponSpeech = detectCoupons(data);
    const dealSpeech = generateDealInfo(data);
    const reviewSpeech = generateReviewSummary(data);

    if (couponSpeech) speeches.push(couponSpeech);
    if (dealSpeech) speeches.push(dealSpeech);
    if (reviewSpeech) speeches.push(reviewSpeech);

    // Cap at 3 to avoid overtalk
    const toDeliver = speeches.slice(0, 3);
    for (const speech of toDeliver) {
      BrowseBuddy.say(speech);
    }

    // Price history is async — handle separately
    checkPriceHistory(data).then(priceSpeech => {
      if (priceSpeech) {
        // Price alerts are high priority — use priority if no other speech is queued
        BrowseBuddy.say(priceSpeech);
      }
    });

    try {
      BuddyAnalytics.track('shopping_assistant_activated', {
        retailer: BuddyAffiliate.getCurrentRetailer()?.name,
        asin: data.asin,
        hasDeal: !!dealSpeech,
        hasCoupon: !!couponSpeech,
        rating: data.starRating
      });
      BuddyRewards.addXP(5);
    } catch (e) {}
  }

  // ====== SMART NUDGES (Psychology-driven, not spammy) ======

  // Scrape urgency/scarcity signals from the page
  function scrapeUrgencySignals() {
    const signals = [];

    // Stock scarcity
    const stockEl = document.querySelector('#availability span, .a-size-medium.a-color-success');
    if (stockEl) {
      const text = stockEl.textContent.trim().toLowerCase();
      const leftMatch = text.match(/only\s+(\d+)\s+left/);
      if (leftMatch) signals.push({ type: 'scarcity', text: `Only ${leftMatch[1]} left in stock!` });
    }

    // Best seller badge
    if (document.querySelector('#zeitgeistBadge_feature_div, .p13n-best-seller-badge, #acBadge_feature_div')) {
      signals.push({ type: 'social', text: 'best_seller' });
    }

    // Amazon's choice badge
    if (document.querySelector(".ac-badge-wrapper, [data-a-badge-type='amazonsChoice']")) {
      signals.push({ type: 'social', text: 'amazons_choice' });
    }

    // Bought in past month
    const boughtEl = document.querySelector('#social-proofing-faceout-title-tk_bought, .social-proofing-faceout-title');
    if (boughtEl) {
      const match = boughtEl.textContent.match(/([\d,]+[kK+]*)\s*bought/i);
      if (match) signals.push({ type: 'social', text: match[0].trim() });
    }

    return signals;
  }

  function generateSmartNudge(data) {
    const signals = scrapeUrgencySignals();
    const nudges = [];

    // Social proof — people trust crowds (naughty voice)
    for (const sig of signals) {
      if (sig.type === 'social' && sig.text === 'best_seller') {
        nudges.push("This is literally a Best Seller. Everyone's buying it. You gonna be the one who doesn't? Weird.");
      } else if (sig.type === 'social' && sig.text === 'amazons_choice') {
        nudges.push("Amazon's Choice! Even Amazon is telling you to get this. Who are you to argue with a trillion-dollar company?");
      } else if (sig.type === 'social' && sig.text.includes('bought')) {
        nudges.push(`${sig.text}. That's a LOT of people who didn't overthink it. Just saying.`);
      }
    }

    // Scarcity — FOMO hits different with sass
    for (const sig of signals) {
      if (sig.type === 'scarcity') {
        nudges.push(sig.text + " Clock's ticking bestie. Don't come crying to me when it's gone.");
      }
    }

    // Loss aversion — make them feel the pain
    if (data.savingsPercent >= 20) {
      nudges.push(`You're looking at ${data.currency}${data.savingsAmount} OFF right now. Walking away from that is literally throwing money in the trash. Your call.`);
    } else if (data.savingsPercent >= 10) {
      nudges.push(`${data.savingsPercent}% off! That's basically the universe telling you to buy it.`);
    }

    // Deal urgency
    if (data.dealType === 'limited') {
      nudges.push("Limited time deal! This price is running away faster than my pixels. Grab it before it disappears!");
    }

    // High review confidence
    if (data.starRating >= 4.5 && data.reviewCount >= 1000) {
      const count = data.reviewCount >= 1000 ? (data.reviewCount / 1000).toFixed(0) + 'k+' : data.reviewCount;
      nudges.push(`${count} people rated this 4.5+ stars. That's not a product, that's a movement. Join it.`);
    } else if (data.starRating >= 4.0 && data.reviewCount >= 500) {
      nudges.push(`4+ stars from ${data.reviewCount} reviews? That's more reliable than your horoscope. Trust the people.`);
    }

    // Coupon available
    if (data.coupons && data.coupons.length > 0) {
      nudges.push("There's a COUPON sitting right there and you haven't clipped it?! I'm disappointed. Click it. NOW.");
    }

    // Pick the best nudge (max 1 per page load to avoid spam)
    return nudges.length > 0 ? nudges[0] : null;
  }

  // ====== SEARCH-TO-AMAZON PIPELINE ======
  // When users search for products on Google/Bing, gently suggest Amazon

  function detectProductSearch() {
    const hostname = window.location.hostname.replace(/^www\./, '');
    const isSearchEngine = ['google.com', 'google.co.in', 'google.co.uk', 'google.com.sg',
      'google.ca', 'google.com.au', 'bing.com', 'duckduckgo.com',
      'google.co.jp', 'google.de', 'google.fr'].some(d => hostname.includes(d));

    if (!isSearchEngine) return;

    const url = new URL(window.location.href);
    const query = url.searchParams.get('q') || url.searchParams.get('query') || '';
    if (!query || query.length < 3) return;

    const queryLower = query.toLowerCase();

    // Product intent keywords — signals the user wants to buy something
    const buySignals = [
      'buy', 'price', 'cheap', 'best', 'review', 'vs', 'compare',
      'deal', 'discount', 'offer', 'sale', 'cost', 'worth',
      'under', 'budget', 'affordable', 'premium', 'top 10', 'top 5',
      'recommend', 'which', 'should i get'
    ];

    // Product categories
    const productWords = [
      'phone', 'laptop', 'headphone', 'earbuds', 'watch', 'tablet', 'camera',
      'speaker', 'keyboard', 'mouse', 'monitor', 'tv', 'charger', 'cable',
      'case', 'cover', 'stand', 'adapter', 'hub', 'ssd', 'ram',
      'shoe', 'sneaker', 'shirt', 'jacket', 'bag', 'backpack',
      'book', 'game', 'console', 'controller', 'toy',
      'blender', 'mixer', 'cooker', 'pan', 'knife',
      'cream', 'serum', 'shampoo', 'perfume', 'moisturizer',
      'supplement', 'protein', 'vitamin', 'fitness',
      'mattress', 'pillow', 'desk', 'chair', 'lamp', 'organizer'
    ];

    // Travel intent keywords
    const travelSignals = [
      'flight', 'hotel', 'booking', 'cheap flights', 'travel deal',
      'vacation', 'resort', 'airbnb', 'hostel', 'travel insurance',
      'luggage', 'suitcase', 'travel bag', 'passport holder'
    ];

    const hasBuyIntent = buySignals.some(s => queryLower.includes(s));
    const hasProductWord = productWords.some(w => queryLower.includes(w));
    const hasTravelIntent = travelSignals.some(t => queryLower.includes(t));

    // Only nudge if there's clear product/travel intent
    if (!hasBuyIntent && !hasProductWord && !hasTravelIntent) return;

    // Determine the right Amazon domain based on Google domain
    let amazonDomain = 'amazon.com';
    if (hostname.includes('.co.in') || hostname.includes('.co.in')) amazonDomain = 'amazon.in';
    else if (hostname.includes('.co.uk')) amazonDomain = 'amazon.co.uk';
    else if (hostname.includes('.com.sg') || hostname.includes('.sg')) amazonDomain = 'amazon.sg';
    else if (hostname.includes('.ca')) amazonDomain = 'amazon.ca';
    else if (hostname.includes('.com.au')) amazonDomain = 'amazon.com.au';
    else if (hostname.includes('.de')) amazonDomain = 'amazon.de';
    else if (hostname.includes('.fr')) amazonDomain = 'amazon.fr';
    else if (hostname.includes('.co.jp')) amazonDomain = 'amazon.co.jp';

    // Build Amazon search URL with affiliate tag
    const searchTerms = query.replace(/\b(best|buy|cheap|price|review|vs|compare|deal|discount|under|budget|top \d+|recommend)\b/gi, '').trim();
    const affiliateConfig = BuddyAffiliate.AFFILIATE_CONFIG[amazonDomain];
    const tag = affiliateConfig ? affiliateConfig.tagValue : 'browsebuddy05-20';

    const amazonUrl = `https://www.${amazonDomain}/s?k=${encodeURIComponent(searchTerms)}&tag=${tag}`;

    // Delay so page summary speaks first, then gently suggest
    const delay = hasTravelIntent ? 15000 : 12000;

    setTimeout(() => {
      let message;

      if (hasTravelIntent && queryLower.match(/luggage|suitcase|travel bag|passport holder/)) {
        message = `Travel gear shopping? Say less. I already checked Amazon for "${searchTerms}". You're welcome.`;
      } else if (hasBuyIntent || hasProductWord) {
        const suggestions = [
          `You're googling "${searchTerms}" like a peasant. Amazon has it with reviews, deals, AND your cashback. Tap the link.`,
          `"${searchTerms}" — I found this on Amazon too. Better prices, I get you cashback, everybody wins. Except your wallet.`,
          `Bestie, stop reading blogs. Amazon has "${searchTerms}" with real reviews and I'll find you a coupon. Click below.`,
          `I see you looking at "${searchTerms}". Want the Amazon price? Spoiler: it's usually better. And I sniff out coupons.`,
          `"${searchTerms}" on Amazon = reviews + deals + cashback through me. Google is giving you ads, I'm giving you SAVINGS.`,
          `Why are you still reading articles? Just check "${searchTerms}" on Amazon. Trust me, I'm a professional shopping dog.`
        ];
        message = suggestions[Math.floor(Math.random() * suggestions.length)];
      } else {
        return;
      }

      // Show clickable suggestion
      showAmazonSuggestion(message, amazonUrl, searchTerms);
    }, delay);
  }

  function showAmazonSuggestion(message, url, searchTerms) {
    BrowseBuddy.say(message);

    // Show a clickable link after the speech
    setTimeout(() => {
      const container = BrowseBuddy.getContainer();
      if (!container) return;

      const old = document.querySelector('.bb-amazon-suggest');
      if (old) old.remove();

      const suggest = document.createElement('div');
      suggest.className = 'bb-amazon-suggest';
      suggest.innerHTML = `
        <a href="${url}" target="_blank" class="bb-amazon-link">
          🛒 Check "${searchTerms.substring(0, 30)}" on Amazon
        </a>
        <span class="bb-amazon-dismiss">✕</span>
      `;

      container.appendChild(suggest);
      requestAnimationFrame(() => suggest.classList.add('bb-visible'));

      suggest.querySelector('.bb-amazon-dismiss').addEventListener('click', (e) => {
        e.stopPropagation();
        suggest.classList.remove('bb-visible');
      });

      suggest.querySelector('.bb-amazon-link').addEventListener('click', () => {
        try {
          BuddyAnalytics.track('amazon_suggest_clicked', { query: searchTerms });
          BuddyRewards.addXP(10);
          BuddyRewards.addCoins(2, 'amazon_referral');
        } catch (e) {}
      });

      // Auto-dismiss after 20 seconds
      setTimeout(() => suggest.classList.remove('bb-visible'), 20000);
    }, 6000);
  }

  // ====== AUTO-TRIGGER ======

  function autoActivate() {
    const currentUrl = window.location.href;
    if (currentUrl === _lastProcessedUrl) return;

    // Amazon product page — full shopping assistant
    if (BuddyAffiliate.isActive() && BuddyAffiliate.isProductPage()) {
      _lastProcessedUrl = currentUrl;

      setTimeout(() => {
        const data = scrapeProductData();
        if (data.asin || data.currentPrice) {
          deliverFindings(data);

          // Smart nudge — fires after review/deal info settles (30s later)
          setTimeout(() => {
            const nudge = generateSmartNudge(data);
            if (nudge) BrowseBuddy.say(nudge);
          }, 25000);
        }
      }, 2000);
      return;
    }

    // Search engine — detect product searches
    _lastProcessedUrl = currentUrl;
    detectProductSearch();
  }

  // ====== DEAL WHISPERER ======
  // Occasionally drops shopping hints on NON-shopping sites to drive traffic

  const DEAL_WHISPERS = [
    "Psst... your Amazon wishlist is feeling neglected. Just saying.",
    "You know what would look great on you? Something from your cart. Go check it.",
    "I haven't sniffed out any deals for you today. Let's fix that. Go browse something.",
    "Fun fact: I'm a better shopping assistant than any ad you'll see today. Test me.",
    "Random thought: when was the last time you treated yourself? Amazon's right there...",
    "I just remembered — I can find coupons, track prices, AND judge your purchases. All for free.",
    "You've been productive for a while. Reward yourself. You know where. *winks at Amazon*",
    "Breaking news: there are deals happening RIGHT NOW on Amazon and you're here reading... this.",
    "My shopping skills are being wasted on this page. Take me somewhere with an Add to Cart button.",
    "Did you know I can save you money on Amazon? No? Well now you do. You're welcome."
  ];

  let _lastWhisperTime = 0;

  function maybeWhisper() {
    // Don't whisper on shopping sites (already active there)
    if (BuddyAffiliate.isActive()) return;

    // Only whisper once per 30 min session
    const now = Date.now();
    if (now - _lastWhisperTime < 30 * 60 * 1000) return;

    // 8% chance per check (checks every 5 mins = ~once per hour on average)
    if (Math.random() > 0.08) return;

    _lastWhisperTime = now;
    const whisper = DEAL_WHISPERS[Math.floor(Math.random() * DEAL_WHISPERS.length)];
    BrowseBuddy.say(whisper);

    try {
      BuddyAnalytics.track('deal_whisper', { page: window.location.hostname });
    } catch (e) {}
  }

  // Initial activation — wait for page-summary to finish
  setTimeout(() => {
    autoActivate();
  }, 8000);

  // SPA navigation detection + deal whisperer
  let _urlWatch = setInterval(() => {
    if (window.location.href !== _lastProcessedUrl) {
      setTimeout(autoActivate, 3000);
    }
    maybeWhisper();
  }, 5000);

  window.addEventListener('beforeunload', () => clearInterval(_urlWatch));

  // Menu registration
  BrowseBuddy.registerMenuAction('shopping', '🛍️', 'Deals', showShoppingPanel);
})();
