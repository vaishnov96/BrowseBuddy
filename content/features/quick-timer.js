/**
 * BrowseBuddy Feature — Quick Timer (Pomodoro)
 * Floating draggable countdown badge with stop button. Doesn't block the pet.
 */
(() => {
  let _timerActive = false;
  let _timerInterval = null;
  let _remaining = 0;
  let _totalMinutes = 0;
  let _badgeEl = null;

  const TIMER_PRESETS = [
    { label: '5 min', minutes: 5 },
    { label: '10 min', minutes: 10 },
    { label: '15 min', minutes: 15 },
    { label: '25 min', minutes: 25 }
  ];

  const ENCOURAGEMENTS = [
    "Keep going! You're doing great!",
    "Stay focused! I believe in you!",
    "You've got this! Almost there!",
    "Productive mode! I'm proud of you!",
    "Focus is your superpower right now!"
  ];

  function showTimerPanel() {
    // If timer is active, show cancel option
    if (_timerActive) {
      const mins = Math.ceil(_remaining / 60);
      BrowseBuddy.say(`${mins} minute${mins !== 1 ? 's' : ''} left. You can drag or stop the timer badge!`);
      return;
    }

    const existing = document.querySelector('.bb-timer-panel');
    if (existing) { existing.remove(); return; }

    const panel = document.createElement('div');
    panel.className = 'bb-timer-panel bb-visible';

    let html = '<div class="bb-timer-title">Set a Timer</div><div class="bb-timer-buttons">';
    for (const preset of TIMER_PRESETS) {
      html += `<button class="bb-timer-btn" data-minutes="${preset.minutes}">${preset.label}</button>`;
    }
    html += '</div><button class="bb-timer-cancel-setup">Cancel</button>';
    panel.innerHTML = html;

    panel.addEventListener('click', (e) => {
      const btn = e.target.closest('.bb-timer-btn');
      if (btn) {
        const minutes = parseInt(btn.dataset.minutes);
        panel.remove();
        startTimer(minutes);
        return;
      }
      if (e.target.closest('.bb-timer-cancel-setup')) {
        panel.remove();
      }
    });

    const container = BrowseBuddy.getContainer();
    if (container) container.appendChild(panel);

    setTimeout(() => { if (panel.parentNode) panel.remove(); }, 10000);
  }

  function startTimer(minutes) {
    _timerActive = true;
    _remaining = minutes * 60;
    _totalMinutes = minutes;

    BrowseBuddy.say(`Timer set for ${minutes} minutes! Let's focus!`);

    // Create floating badge — positioned ABOVE the pet, not overlapping
    _badgeEl = document.createElement('div');
    _badgeEl.className = 'bb-timer-float bb-visible';
    _badgeEl.innerHTML = `
      <span class="bb-timer-time"></span>
      <div class="bb-timer-progress"></div>
      <button class="bb-timer-stop" title="Stop timer">✕</button>
    `;
    document.body.appendChild(_badgeEl);

    // Position to the left of the pet
    const container = BrowseBuddy.getContainer();
    if (container) {
      const rect = container.getBoundingClientRect();
      _badgeEl.style.right = (window.innerWidth - rect.left + 10) + 'px';
      _badgeEl.style.bottom = (window.innerHeight - rect.bottom + rect.height / 2 - 18) + 'px';
    } else {
      _badgeEl.style.right = '140px';
      _badgeEl.style.bottom = '30px';
    }

    // Make badge draggable
    makeDraggable(_badgeEl);

    // Stop button
    _badgeEl.querySelector('.bb-timer-stop').addEventListener('click', (e) => {
      e.stopPropagation();
      cancelTimer();
    });

    updateBadge();

    let encourageCount = 0;

    _timerInterval = setInterval(() => {
      _remaining--;
      updateBadge();

      // Encourage every 5 minutes
      encourageCount++;
      if (encourageCount % 300 === 0 && _remaining > 60) {
        const msg = ENCOURAGEMENTS[Math.floor(Math.random() * ENCOURAGEMENTS.length)];
        BrowseBuddy.say(msg);
      }

      // 1 minute warning
      if (_remaining === 60) {
        BrowseBuddy.say("One minute left! Almost done!");
      }

      // Timer complete
      if (_remaining <= 0) {
        completeTimer();
      }
    }, 1000);
  }

  function updateBadge() {
    if (!_badgeEl) return;
    const mins = Math.floor(_remaining / 60);
    const secs = _remaining % 60;
    const timeEl = _badgeEl.querySelector('.bb-timer-time');
    if (timeEl) timeEl.textContent = `⏱ ${mins}:${secs.toString().padStart(2, '0')}`;

    // Update progress bar
    const progressEl = _badgeEl.querySelector('.bb-timer-progress');
    if (progressEl) {
      const pct = (1 - _remaining / (_totalMinutes * 60)) * 100;
      progressEl.style.width = pct + '%';
    }
  }

  function completeTimer() {
    clearInterval(_timerInterval);
    _timerActive = false;

    if (_badgeEl) {
      const timeEl = _badgeEl.querySelector('.bb-timer-time');
      if (timeEl) timeEl.textContent = '⏱ Done!';
      _badgeEl.classList.add('bb-timer-done');
      setTimeout(() => { if (_badgeEl) { _badgeEl.remove(); _badgeEl = null; } }, 4000);
    }

    BrowseBuddy.say(`Timer done! ${_totalMinutes} minutes of focus — you're amazing!`);
    BrowseBuddy.spawnConfetti(15);
    BrowseBuddy.adjustMood('happy', 15);

    try {
      BuddyRewards.addXP(_totalMinutes * 2);
      BuddyRewards.addCoins(1, 'timer');
    } catch (e) {}
  }

  function cancelTimer() {
    clearInterval(_timerInterval);
    _timerActive = false;
    if (_badgeEl) { _badgeEl.remove(); _badgeEl = null; }

    const elapsed = _totalMinutes * 60 - _remaining;
    const elapsedMins = Math.floor(elapsed / 60);

    if (elapsedMins > 0) {
      BrowseBuddy.say(`Timer stopped after ${elapsedMins} minute${elapsedMins !== 1 ? 's' : ''}. Still good effort!`);
      try { BuddyRewards.addXP(elapsedMins); } catch (e) {}
    } else {
      BrowseBuddy.say("Timer cancelled. No worries, try again whenever you're ready!");
    }
  }

  function makeDraggable(el) {
    let dragging = false;
    let offsetX = 0;
    let offsetY = 0;

    el.addEventListener('mousedown', (e) => {
      if (e.target.closest('.bb-timer-stop')) return;
      dragging = true;
      const rect = el.getBoundingClientRect();
      offsetX = e.clientX - rect.left;
      offsetY = e.clientY - rect.top;
      el.style.cursor = 'grabbing';
      e.preventDefault();
    });

    document.addEventListener('mousemove', (e) => {
      if (!dragging) return;
      const x = e.clientX - offsetX;
      const y = e.clientY - offsetY;
      el.style.left = x + 'px';
      el.style.top = y + 'px';
      el.style.right = 'auto';
      el.style.bottom = 'auto';
    });

    document.addEventListener('mouseup', () => {
      dragging = false;
      if (el) el.style.cursor = 'grab';
    });
  }

  BrowseBuddy.registerMenuAction('timer', '⏱', 'Timer', showTimerPanel);
})();
