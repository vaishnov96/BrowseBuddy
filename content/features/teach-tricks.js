/**
 * BrowseBuddy Feature — Teach Tricks
 * Unlockable tricks based on pet level. Tap to teach, perform on command.
 */
(() => {
  const TRICKS = {
    sit:      { level: 1,  icon: '🐕', label: 'Sit',       taps: 1, xp: 30 },
    shake:    { level: 5,  icon: '🤝', label: 'Shake',     taps: 2, xp: 50 },
    rollover: { level: 10, icon: '🔄', label: 'Roll Over', taps: 3, xp: 80 },
    spin:     { level: 15, icon: '💫', label: 'Spin',       taps: 4, xp: 100 },
    dance:    { level: 25, icon: '💃', label: 'Dance',      taps: 5, xp: 150 }
  };

  let _unlockedTricks = [];
  let _teaching = false;

  async function loadTricks() {
    try {
      const data = await BuddyStorage.get('unlockedTricks');
      _unlockedTricks = Array.isArray(data) ? data : [];
    } catch (e) { _unlockedTricks = []; }
  }

  async function saveTricks() {
    try { await BuddyStorage.set({ unlockedTricks: _unlockedTricks }); } catch (e) {}
  }

  async function getPetLevel() {
    try {
      const stats = await BuddyRewards.getStats();
      return stats.petLevel || 1;
    } catch (e) { return 1; }
  }

  function performTrick(trickId) {
    const canvas = BrowseBuddy.getCanvas();
    if (!canvas) return;

    BrowseBuddy.adjustMood('playful', 15);
    BrowseBuddy.adjustMood('happy', 10);

    switch (trickId) {
      case 'sit':
        canvas.style.transition = 'transform 0.3s ease';
        canvas.style.transform = 'translateY(8px) scaleY(0.85)';
        BrowseBuddy.say("*sits down like a good boy*");
        setTimeout(() => { canvas.style.transition = ''; canvas.style.transform = ''; }, 1500);
        break;

      case 'shake':
        let shakeCount = 0;
        canvas.style.transition = 'transform 0.15s ease';
        const shakeInterval = setInterval(() => {
          canvas.style.transform = shakeCount % 2 === 0 ? 'rotate(-15deg)' : 'rotate(15deg)';
          shakeCount++;
          if (shakeCount > 6) {
            clearInterval(shakeInterval);
            canvas.style.transition = '';
            canvas.style.transform = '';
          }
        }, 150);
        BrowseBuddy.say("*extends paw* Shake! Nice to meet you!");
        break;

      case 'rollover':
        canvas.style.transition = 'transform 0.8s ease-in-out';
        canvas.style.transform = 'rotate(360deg)';
        BrowseBuddy.say("*rolls over* Ta-da! Belly rubs now?");
        setTimeout(() => { canvas.style.transition = ''; canvas.style.transform = ''; }, 1000);
        break;

      case 'spin':
        canvas.style.transition = 'transform 0.6s ease-in-out';
        canvas.style.transform = 'rotate(720deg)';
        BrowseBuddy.say("*spins around twice* Wheeeee!");
        setTimeout(() => { canvas.style.transition = ''; canvas.style.transform = ''; }, 800);
        break;

      case 'dance':
        let danceStep = 0;
        const danceFrames = [
          'translateX(-5px) rotate(-10deg)',
          'translateX(5px) rotate(10deg)',
          'translateY(-8px) scale(1.1)',
          'translateX(-5px) rotate(-10deg)',
          'translateX(5px) rotate(10deg)',
          'translateY(-10px) scale(1.15)',
          ''
        ];
        canvas.style.transition = 'transform 0.2s ease';
        const danceInterval = setInterval(() => {
          canvas.style.transform = danceFrames[danceStep];
          danceStep++;
          if (danceStep >= danceFrames.length) {
            clearInterval(danceInterval);
            canvas.style.transition = '';
            canvas.style.transform = '';
          }
        }, 200);
        BrowseBuddy.say("*busts out the moves* I've been practicing!");
        BrowseBuddy.spawnConfetti(8);
        break;
    }
    try { BuddyRewards.addXP(10); } catch (e) {}
  }

  function startTeaching(trickId) {
    if (_teaching) return;
    _teaching = true;

    const trick = TRICKS[trickId];
    let tapCount = 0;
    let tapTimer = null;

    // Suppress buddy.js default click behavior
    BrowseBuddy.suppressClick();

    // Remove existing panel
    const panel = document.querySelector('.bb-tricks-panel');
    if (panel) panel.remove();

    BrowseBuddy.say(`Tap me ${trick.taps} time${trick.taps > 1 ? 's' : ''} to teach me "${trick.label}"!`);

    // Show tap counter overlay
    const counter = document.createElement('div');
    counter.className = 'bb-teach-counter bb-visible';
    counter.textContent = `0 / ${trick.taps}`;
    const container = BrowseBuddy.getContainer();
    if (container) container.appendChild(counter);

    const canvas = BrowseBuddy.getCanvas();
    if (!canvas) { endTeaching(); return; }

    function onTap(e) {
      e.stopPropagation();
      e.preventDefault();
      tapCount++;

      // Update counter
      counter.textContent = `${tapCount} / ${trick.taps}`;

      // Visual feedback per tap
      BrowseBuddy.spawnHeart();
      canvas.style.transition = 'transform 0.1s ease';
      canvas.style.transform = 'scale(1.15)';
      setTimeout(() => { canvas.style.transform = ''; }, 100);

      // Reset timeout on each tap
      clearTimeout(tapTimer);

      if (tapCount >= trick.taps) {
        // Learned!
        endTeaching();
        _unlockedTricks.push(trickId);
        saveTricks();

        setTimeout(() => {
          BrowseBuddy.say(`I learned "${trick.label}"! I'm so smart!`);
          BrowseBuddy.spawnConfetti(12);
          performTrick(trickId);
          try { BuddyRewards.addXP(trick.xp); } catch (e) {}
        }, 200);
      } else {
        // Give more time for next tap
        tapTimer = setTimeout(() => {
          endTeaching();
          BrowseBuddy.say("Hmm, I got confused. Let's try again later!");
        }, 4000);
      }
    }

    function endTeaching() {
      _teaching = false;
      canvas.removeEventListener('click', onTap, true);
      BrowseBuddy.unsuppressClick();
      clearTimeout(tapTimer);
      if (counter.parentNode) counter.remove();
    }

    // Use capture phase so our handler fires BEFORE buddy.js handler
    canvas.addEventListener('click', onTap, true);

    // Timeout: 6 seconds to start tapping
    tapTimer = setTimeout(() => {
      endTeaching();
      BrowseBuddy.say("Hmm, I got confused. Let's try again later!");
    }, 6000);
  }

  async function showTricksPanel() {
    if (_teaching) return;

    const existing = document.querySelector('.bb-tricks-panel');
    if (existing) { existing.remove(); return; }

    await loadTricks();
    const level = await getPetLevel();

    const panel = document.createElement('div');
    panel.className = 'bb-tricks-panel bb-visible';

    let html = '<div class="bb-tricks-title">My Tricks</div>';

    for (const [id, trick] of Object.entries(TRICKS)) {
      const unlocked = _unlockedTricks.includes(id);
      const canUnlock = level >= trick.level;

      if (unlocked) {
        html += `<div class="bb-trick-item bb-trick-learned">
          <span>${trick.icon} ${trick.label}</span>
          <button class="bb-trick-btn bb-trick-perform" data-trick="${id}">Perform</button>
        </div>`;
      } else if (canUnlock) {
        html += `<div class="bb-trick-item bb-trick-teachable">
          <span>${trick.icon} ${trick.label}</span>
          <button class="bb-trick-btn bb-trick-teach" data-trick="${id}">Teach (${trick.taps} tap${trick.taps > 1 ? 's' : ''})</button>
        </div>`;
      } else {
        html += `<div class="bb-trick-item bb-trick-locked">
          <span>🔒 ${trick.label}</span>
          <span class="bb-trick-level">Level ${trick.level}</span>
        </div>`;
      }
    }

    panel.innerHTML = html;

    panel.addEventListener('click', (e) => {
      const btn = e.target.closest('.bb-trick-btn');
      if (!btn) return;
      const trickId = btn.dataset.trick;
      panel.remove();
      if (btn.classList.contains('bb-trick-perform')) {
        performTrick(trickId);
      } else if (btn.classList.contains('bb-trick-teach')) {
        startTeaching(trickId);
      }
    });

    const container = BrowseBuddy.getContainer();
    if (container) container.appendChild(panel);

    setTimeout(() => { if (panel.parentNode) panel.remove(); }, 12000);
  }

  BrowseBuddy.registerMenuAction('tricks', '🎓', 'Tricks', showTricksPanel);
})();
