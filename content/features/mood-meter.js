/**
 * BrowseBuddy Feature — Mood Meter
 * Shows pet's current mood with animated bars and contextual comments
 */
(() => {
  const MOOD_CONFIG = {
    happy:   { color: '#6bcb77', icon: '😊', label: 'Happy' },
    hungry:  { color: '#ff9f43', icon: '🍖', label: 'Hungry' },
    sleepy:  { color: '#a29bfe', icon: '😴', label: 'Sleepy' },
    playful: { color: '#4d96ff', icon: '🎾', label: 'Playful' }
  };

  const MOOD_COMMENTS = {
    happy: {
      high: ["I'm feeling great! Life is good!", "Best day ever!", "Everything is awesome!"],
      mid: ["I'm doing okay! Could be better.", "Pretty decent mood today.", "Not bad, not bad at all."],
      low: ["I'm a bit down... maybe pet me?", "Could use some attention...", "Feeling kinda meh."]
    },
    hungry: {
      high: ["I'm STARVING! Please feed me!", "My tummy is rumbling SO loud!", "Food... I need food..."],
      mid: ["Getting a bit hungry here.", "A snack would be nice!", "Starting to think about food..."],
      low: ["All fed and happy!", "Tummy is full!", "Couldn't eat another byte!"]
    },
    sleepy: {
      high: ["So... tired... can barely keep my eyes open...", "I need a nap ASAP!", "zzz... huh? Oh, I'm awake..."],
      mid: ["Starting to get a little drowsy.", "A short nap sounds nice.", "Yawning a bit..."],
      low: ["Wide awake and ready to go!", "Full of energy!", "Let's DO this!"]
    },
    playful: {
      high: ["I wanna PLAY! Let's do something fun!", "So much energy! Throw me a ball!", "Can't sit still! Let's play!"],
      mid: ["I could go for a game!", "Feeling a bit playful today.", "Wanna play something?"],
      low: ["Not really in the mood to play...", "Maybe later for games.", "Just wanna chill right now."]
    }
  };

  function getComment(mood) {
    // Find the dominant mood dimension
    let dominant = 'happy';
    let dominantVal = 0;
    for (const [key, val] of Object.entries(mood)) {
      if (key === 'hungry' || key === 'sleepy') {
        // For negative moods, high value = high urgency
        if (val > dominantVal + 20) { dominant = key; dominantVal = val; }
      } else {
        if (val > dominantVal) { dominant = key; dominantVal = val; }
      }
    }
    // Also check if hungry or sleepy is critically high
    if (mood.hungry > 70) dominant = 'hungry';
    if (mood.sleepy > 70) dominant = 'sleepy';

    const val = mood[dominant];
    const tier = val > 65 ? 'high' : val > 35 ? 'mid' : 'low';
    const comments = MOOD_COMMENTS[dominant][tier];
    return comments[Math.floor(Math.random() * comments.length)];
  }

  function showMoodMeter() {
    // Remove existing
    const existing = document.querySelector('.bb-mood-meter');
    if (existing) { existing.remove(); return; }

    const mood = BrowseBuddy.getMood();
    const comment = getComment(mood);

    const panel = document.createElement('div');
    panel.className = 'bb-mood-meter bb-visible';

    let barsHTML = '';
    for (const [key, config] of Object.entries(MOOD_CONFIG)) {
      const val = mood[key] || 0;
      barsHTML += `
        <div class="bb-mood-row">
          <span class="bb-mood-icon">${config.icon}</span>
          <span class="bb-mood-label">${config.label}</span>
          <div class="bb-mood-bar-track">
            <div class="bb-mood-bar-fill" style="width:${val}%;background:${config.color}"></div>
          </div>
          <span class="bb-mood-val">${val}%</span>
        </div>`;
    }

    panel.innerHTML = `
      <div class="bb-mood-title">How I'm Feeling</div>
      ${barsHTML}
      <div class="bb-mood-comment">"${comment}"</div>
    `;

    const container = BrowseBuddy.getContainer();
    if (container) container.appendChild(panel);

    // Show the comment as speech too
    BrowseBuddy.say(comment);

    // Auto-dismiss after 8 seconds
    setTimeout(() => panel.remove(), 8000);
    panel.addEventListener('click', () => panel.remove());
  }

  // Register with menu
  BrowseBuddy.registerMenuAction('mood', '😊', 'Mood', showMoodMeter);
})();
