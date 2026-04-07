/**
 * BrowseBuddy — Rewards & Points System
 * Manages BuddyCoin economy, streaks, leveling, and XP
 */
const BuddyRewards = (() => {
  const XP_PER_LEVEL = [
    0, 100, 250, 500, 800, 1200, 1800, 2500, 3500, 5000,
    7000, 9500, 12500, 16000, 20000, 25000, 31000, 38000, 46000, 55000,
    65000, 76000, 88000, 101000, 115000, 130000, 146000, 163000, 181000, 200000,
    220000, 241000, 263000, 286000, 310000, 335000, 361000, 388000, 416000, 445000,
    475000, 506000, 538000, 571000, 605000, 640000, 676000, 713000, 751000, 800000
  ];

  const LEVEL_TITLES = {
    1: 'Newborn Pixel',
    5: 'Curious Critter',
    10: 'Digital Explorer',
    15: 'Web Wanderer',
    20: 'Cyber Companion',
    25: 'Browser Beast',
    30: 'Pixel Prodigy',
    35: 'Chrome Champion',
    40: 'Tab Titan',
    45: 'Internet Icon',
    50: 'Legendary Buddy'
  };

  function getTitleForLevel(level) {
    let title = 'Newborn Pixel';
    for (const [lvl, t] of Object.entries(LEVEL_TITLES)) {
      if (level >= parseInt(lvl)) title = t;
    }
    return title;
  }

  function getXPForLevel(level) {
    if (level <= 0) return 0;
    if (level > 50) return XP_PER_LEVEL[49] + (level - 50) * 20000;
    return XP_PER_LEVEL[level - 1];
  }

  function getXPForNextLevel(level) {
    return getXPForLevel(level + 1);
  }

  async function addXP(amount) {
    const { petXP, petLevel } = await BuddyStorage.get(['petXP', 'petLevel']);
    let newXP = petXP + amount;
    let newLevel = petLevel;
    let leveledUp = false;

    while (newXP >= getXPForNextLevel(newLevel)) {
      newLevel++;
      leveledUp = true;
    }

    await BuddyStorage.set({ petXP: newXP, petLevel: newLevel });
    return { newXP, newLevel, leveledUp, title: getTitleForLevel(newLevel) };
  }

  async function addCoins(amount, source) {
    const { coins, lifetimeEarnings } = await BuddyStorage.get(['coins', 'lifetimeEarnings']);
    const newCoins = coins + amount;
    const newLifetime = lifetimeEarnings + amount;
    await BuddyStorage.set({ coins: newCoins, lifetimeEarnings: newLifetime });

    BuddyAnalytics.track('coins_earned', { amount, source });

    return { newBalance: newCoins, lifetimeEarnings: newLifetime };
  }

  async function spendCoins(amount) {
    const coins = await BuddyStorage.get('coins');
    if (coins < amount) return { success: false, balance: coins };
    const newCoins = coins - amount;
    await BuddyStorage.set({ coins: newCoins });
    return { success: true, balance: newCoins };
  }

  async function checkAndUpdateStreak() {
    const { streak, lastActiveDate } = await BuddyStorage.get(['streak', 'lastActiveDate']);
    const today = new Date().toISOString().split('T')[0];

    if (lastActiveDate === today) {
      return { streak, isNewDay: false, bonusAwarded: false };
    }

    const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];
    let newStreak;
    let bonusAwarded = false;

    if (lastActiveDate === yesterday) {
      newStreak = streak + 1;
    } else {
      newStreak = 1;
    }

    await BuddyStorage.set({ streak: newStreak, lastActiveDate: today });

    // Daily active coin
    await addCoins(1, 'daily_active');
    await addXP(10);

    // Streak bonus every 7 days
    if (newStreak > 0 && newStreak % 7 === 0) {
      await addCoins(10, 'streak_bonus');
      await addXP(50);
      bonusAwarded = true;
    }

    return { streak: newStreak, isNewDay: true, bonusAwarded };
  }

  async function awardInteraction() {
    const today = new Date().toISOString().split('T')[0];
    const key = `interactions_${today}`;
    const data = await BuddyStorage.getLocal([key]);
    const count = data[key] || 0;

    if (count < 10) {
      await BuddyStorage.setLocal({ [key]: count + 1 });
      if (count < 2) {
        await addCoins(1, 'interaction');
      }
      await addXP(5);
      return true;
    }
    return false;
  }

  async function awardAffiliateConversion(commissionAmount) {
    const userShare = Math.floor(commissionAmount * 0.30 * 100); // 30% in BuddyCoins
    await addCoins(userShare, 'affiliate');
    await addXP(100);
    return userShare;
  }

  async function getStats() {
    const data = await BuddyStorage.get([
      'coins', 'streak', 'lifetimeEarnings', 'petLevel', 'petXP',
      'petHappiness', 'petName', 'petSkin', 'petAccessories'
    ]);
    return {
      ...data,
      title: getTitleForLevel(data.petLevel),
      xpForNext: getXPForNextLevel(data.petLevel),
      xpProgress: data.petXP - getXPForLevel(data.petLevel),
      xpNeeded: getXPForNextLevel(data.petLevel) - getXPForLevel(data.petLevel)
    };
  }

  return {
    addXP,
    addCoins,
    spendCoins,
    checkAndUpdateStreak,
    awardInteraction,
    awardAffiliateConversion,
    getStats,
    getTitleForLevel,
    getXPForLevel,
    getXPForNextLevel,
    LEVEL_TITLES
  };
})();
