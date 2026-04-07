/**
 * BrowseBuddy Feature — Daily Spin Wheel
 * Once per day, spin for coins, XP, or rare skins
 */
(() => {
  const SEGMENTS = [
    { label: '+5 Coins',    color: '#6bcb77', reward: { type: 'coins', amount: 5 } },
    { label: '+50 XP',      color: '#4d96ff', reward: { type: 'xp', amount: 50 } },
    { label: '+10 Coins',   color: '#ff6b6b', reward: { type: 'coins', amount: 10 } },
    { label: '+100 XP',     color: '#ffd93d', reward: { type: 'xp', amount: 100 } },
    { label: 'Rare Skin!',  color: '#ff6bd6', reward: { type: 'skin', name: 'golden' } },
    { label: '+1 Coin',     color: '#a29bfe', reward: { type: 'coins', amount: 1 } },
    { label: '+20 Coins',   color: '#ff9f43', reward: { type: 'coins', amount: 20 } },
    { label: '+200 XP',     color: '#00cec9', reward: { type: 'xp', amount: 200 } }
  ];

  const SEG_COUNT = SEGMENTS.length;
  const SEG_ANGLE = 360 / SEG_COUNT;

  async function canSpin() {
    try {
      const data = await BuddyStorage.get('dailySpinDate');
      const today = new Date().toISOString().split('T')[0];
      return data !== today;
    } catch (e) { return true; }
  }

  async function markSpun() {
    const today = new Date().toISOString().split('T')[0];
    try { await BuddyStorage.set({ dailySpinDate: today }); } catch (e) {}
  }

  async function openSpinWheel() {
    const allowed = await canSpin();
    if (!allowed) {
      BrowseBuddy.say("You already spun today! Come back tomorrow for another chance!");
      return;
    }

    // Create overlay
    const overlay = document.createElement('div');
    overlay.className = 'bb-spin-overlay bb-visible';

    // Wheel container
    const wheelWrap = document.createElement('div');
    wheelWrap.className = 'bb-spin-wheel-wrap';

    // Pointer
    const pointer = document.createElement('div');
    pointer.className = 'bb-spin-pointer';
    pointer.textContent = '▼';

    // Wheel
    const wheel = document.createElement('div');
    wheel.className = 'bb-spin-wheel';

    // Build conic gradient for segments
    let gradient = 'conic-gradient(';
    const segLabels = [];
    for (let i = 0; i < SEG_COUNT; i++) {
      const startAngle = i * SEG_ANGLE;
      const endAngle = (i + 1) * SEG_ANGLE;
      gradient += `${SEGMENTS[i].color} ${startAngle}deg ${endAngle}deg`;
      if (i < SEG_COUNT - 1) gradient += ', ';

      // Segment label
      const label = document.createElement('div');
      label.className = 'bb-spin-label';
      const angle = startAngle + SEG_ANGLE / 2;
      label.style.transform = `rotate(${angle}deg) translateY(-85px)`;
      label.innerHTML = `<span style="transform:rotate(${-angle}deg);display:block;font-size:11px">${SEGMENTS[i].label}</span>`;
      segLabels.push(label);
    }
    gradient += ')';
    wheel.style.background = gradient;

    segLabels.forEach(l => wheel.appendChild(l));

    // Spin button
    const spinBtn = document.createElement('button');
    spinBtn.className = 'bb-spin-btn';
    spinBtn.textContent = 'SPIN!';

    // Close button
    const closeBtn = document.createElement('button');
    closeBtn.className = 'bb-spin-close';
    closeBtn.textContent = '✕';

    wheelWrap.appendChild(pointer);
    wheelWrap.appendChild(wheel);
    wheelWrap.appendChild(spinBtn);
    overlay.appendChild(wheelWrap);
    overlay.appendChild(closeBtn);
    document.body.appendChild(overlay);

    // Close handler
    closeBtn.addEventListener('click', () => overlay.remove());

    // Spin handler
    spinBtn.addEventListener('click', async () => {
      spinBtn.disabled = true;
      spinBtn.textContent = '...';

      // Random winning segment
      const winIdx = Math.floor(Math.random() * SEG_COUNT);
      // Calculate rotation: multiple full spins + land on winning segment
      // The pointer is at top (0deg), segments start from 0deg going clockwise
      // To land on segment winIdx, the wheel needs to stop so that segment is at top
      const targetAngle = 360 - (winIdx * SEG_ANGLE + SEG_ANGLE / 2);
      const totalRotation = 360 * 5 + targetAngle; // 5 full spins + target

      wheel.style.transition = 'transform 4s cubic-bezier(0.17, 0.67, 0.12, 0.99)';
      wheel.style.transform = `rotate(${totalRotation}deg)`;

      // Wait for spin to finish
      setTimeout(async () => {
        const segment = SEGMENTS[winIdx];
        const reward = segment.reward;

        // Award the prize
        try {
          if (reward.type === 'coins') {
            await BuddyRewards.addCoins(reward.amount, 'spin_wheel');
            BrowseBuddy.say(`You won ${reward.amount} BuddyCoins! Lucky you!`);
          } else if (reward.type === 'xp') {
            await BuddyRewards.addXP(reward.amount);
            BrowseBuddy.say(`You won ${reward.amount} XP! Level up time!`);
          } else if (reward.type === 'skin') {
            const skins = await BuddyStorage.get('petSkins') || ['default'];
            if (!skins.includes(reward.name)) {
              skins.push(reward.name);
              await BuddyStorage.set({ petSkins: skins });
              BrowseBuddy.say(`RARE SKIN UNLOCKED: "${reward.name}"! You're so lucky!`);
            } else {
              await BuddyRewards.addCoins(15, 'spin_wheel_dupe');
              BrowseBuddy.say("You already have that skin! Here's 15 coins instead!");
            }
          }
        } catch (e) {}

        await markSpun();
        BrowseBuddy.spawnConfetti(15);
        BrowseBuddy.adjustMood('happy', 20);

        // Result display
        spinBtn.textContent = segment.label + ' !';
        spinBtn.style.background = segment.color;
        spinBtn.style.color = '#fff';

        // Close after a few seconds
        setTimeout(() => overlay.remove(), 4000);
      }, 4200);
    });
  }

  BrowseBuddy.registerMenuAction('spin', '🎡', 'Daily Spin', openSpinWheel);
})();
