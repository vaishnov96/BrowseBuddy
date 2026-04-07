/**
 * BrowseBuddy Feature — Send to Friend
 * Generate a shareable pet card with stats
 */
(() => {
  async function showSharePanel() {
    const existing = document.querySelector('.bb-share-panel');
    if (existing) { existing.remove(); return; }

    // Gather pet data
    let stats = { petLevel: 1, coins: 0, petName: 'Buddy', streak: 0 };
    try {
      const data = await BuddyRewards.getStats();
      stats = { ...stats, ...data };
    } catch (e) {}

    let referralCode = 'BB-FRIEND';
    try {
      referralCode = await BuddyStorage.get('referralCode') || referralCode;
    } catch (e) {}

    const mood = BrowseBuddy.getMood();
    const state = BrowseBuddy.getState();

    // Generate the share card on a canvas
    const cardCanvas = document.createElement('canvas');
    cardCanvas.width = 400;
    cardCanvas.height = 220;
    const ctx = cardCanvas.getContext('2d');

    // Background gradient
    const grad = ctx.createLinearGradient(0, 0, 400, 220);
    grad.addColorStop(0, '#667eea');
    grad.addColorStop(1, '#764ba2');
    ctx.fillStyle = grad;
    ctx.roundRect(0, 0, 400, 220, 16);
    ctx.fill();

    // Pet sprite area
    ctx.fillStyle = 'rgba(255,255,255,0.15)';
    ctx.beginPath();
    ctx.arc(70, 110, 50, 0, Math.PI * 2);
    ctx.fill();

    // Draw pet canvas onto card
    const petCanvas = BrowseBuddy.getCanvas();
    if (petCanvas) {
      ctx.drawImage(petCanvas, 30, 70, 80, 80);
    }

    // Text
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 20px system-ui, sans-serif';
    ctx.fillText(stats.petName || 'Buddy', 140, 50);

    ctx.font = '14px system-ui, sans-serif';
    ctx.fillStyle = 'rgba(255,255,255,0.9)';
    ctx.fillText(`Level ${stats.petLevel} | ${stats.coins} coins`, 140, 75);
    ctx.fillText(`Streak: ${stats.streak} day${stats.streak !== 1 ? 's' : ''}`, 140, 100);

    // Mood bars (simplified)
    const moodEntries = [
      { label: '😊', val: mood.happy, color: '#6bcb77' },
      { label: '🍖', val: mood.hungry, color: '#ff9f43' },
      { label: '😴', val: mood.sleepy, color: '#a29bfe' },
      { label: '🎾', val: mood.playful, color: '#4d96ff' }
    ];

    moodEntries.forEach((m, i) => {
      const y = 125 + i * 20;
      ctx.font = '12px sans-serif';
      ctx.fillText(m.label, 140, y + 4);
      // Bar track
      ctx.fillStyle = 'rgba(255,255,255,0.2)';
      ctx.fillRect(162, y - 6, 100, 10);
      // Bar fill
      ctx.fillStyle = m.color;
      ctx.fillRect(162, y - 6, m.val, 10);
      ctx.fillStyle = '#fff';
    });

    // Watermark
    ctx.fillStyle = 'rgba(255,255,255,0.5)';
    ctx.font = '10px system-ui, sans-serif';
    ctx.fillText('BrowseBuddy | browsebuddy.xyz', 140, 210);

    // Create share panel
    const panel = document.createElement('div');
    panel.className = 'bb-share-panel bb-visible';

    const preview = document.createElement('img');
    preview.src = cardCanvas.toDataURL('image/png');
    preview.className = 'bb-share-preview';

    const btnRow = document.createElement('div');
    btnRow.className = 'bb-share-buttons';

    const copyBtn = document.createElement('button');
    copyBtn.className = 'bb-share-btn';
    copyBtn.innerHTML = '📋 Copy Link';
    copyBtn.addEventListener('click', async () => {
      const shareText = `Check out my BrowseBuddy pet "${stats.petName}"! Level ${stats.petLevel} with ${stats.coins} coins and a ${stats.streak}-day streak! Join me: browsebuddy.xyz/ref/${referralCode}`;
      try {
        await navigator.clipboard.writeText(shareText);
        BrowseBuddy.say("Link copied! Share it with your friends!");
        BrowseBuddy.showToast('Copied to clipboard!');
      } catch (e) {
        BrowseBuddy.say("Couldn't copy. Try saving the card instead!");
      }
    });

    const saveBtn = document.createElement('button');
    saveBtn.className = 'bb-share-btn';
    saveBtn.innerHTML = '💾 Save Card';
    saveBtn.addEventListener('click', () => {
      const link = document.createElement('a');
      link.download = `browsebuddy-${stats.petName}-card.png`;
      link.href = cardCanvas.toDataURL('image/png');
      link.click();
      BrowseBuddy.say("Card saved! Show everyone your awesome pet!");
    });

    btnRow.appendChild(copyBtn);
    btnRow.appendChild(saveBtn);
    panel.appendChild(preview);
    panel.appendChild(btnRow);

    const container = BrowseBuddy.getContainer();
    if (container) container.appendChild(panel);

    BrowseBuddy.say("Here's your pet card! Share it with friends!");
    try { BuddyRewards.addXP(10); } catch (e) {}

    // Auto-dismiss after 15 seconds
    setTimeout(() => { if (panel.parentNode) panel.remove(); }, 15000);
    panel.addEventListener('click', (e) => {
      if (e.target === panel) panel.remove();
    });
  }

  BrowseBuddy.registerMenuAction('share', '💌', 'Share Pet', showSharePanel);
})();
