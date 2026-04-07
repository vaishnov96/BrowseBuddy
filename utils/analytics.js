/**
 * BrowseBuddy — Anonymized Analytics (Local-only in Phase 1)
 * Tracks usage events locally for the privacy dashboard
 */
const BuddyAnalytics = (() => {
  const MAX_EVENTS = 500;

  async function track(eventName, data = {}) {
    if (!BuddyStorage.isContextValid()) return;
    try {
      const events = (await BuddyStorage.getLocal(['analyticsEvents'])).analyticsEvents || [];
      events.push({
        event: eventName,
        data,
        timestamp: Date.now()
      });

      if (events.length > MAX_EVENTS) {
        events.splice(0, events.length - MAX_EVENTS);
      }

      await BuddyStorage.setLocal({ analyticsEvents: events });
    } catch {
      // Extension context invalidated — silently stop
    }
  }

  async function getEvents(filter = {}) {
    const events = (await BuddyStorage.getLocal(['analyticsEvents'])).analyticsEvents || [];

    return events.filter((e) => {
      if (filter.event && e.event !== filter.event) return false;
      if (filter.since && e.timestamp < filter.since) return false;
      return true;
    });
  }

  async function getSessionSummary() {
    const oneDayAgo = Date.now() - 86400000;
    const events = await getEvents({ since: oneDayAgo });

    const contextChanges = events.filter((e) => e.event === 'context_detected');
    const affiliateImpressions = events.filter((e) => e.event === 'affiliate_impression');
    const interactions = events.filter((e) => e.event === 'pet_interaction');

    const categoryCounts = {};
    contextChanges.forEach((e) => {
      const cat = e.data.category || 'unknown';
      categoryCounts[cat] = (categoryCounts[cat] || 0) + 1;
    });

    return {
      totalEvents: events.length,
      contextChanges: contextChanges.length,
      affiliateImpressions: affiliateImpressions.length,
      interactions: interactions.length,
      categoryCounts
    };
  }

  async function clearEvents() {
    await BuddyStorage.setLocal({ analyticsEvents: [] });
  }

  return {
    track,
    getEvents,
    getSessionSummary,
    clearEvents
  };
})();
