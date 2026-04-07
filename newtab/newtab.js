/**
 * BrowseBuddy — New Tab Page
 */
document.addEventListener('DOMContentLoaded', () => {
  updateClock();
  setInterval(updateClock, 1000);
  loadStats();
  drawPet();
  showPetGreeting();
  setupSearch();
  setupLinks();
});

function updateClock() {
  const now = new Date();
  const hours = now.getHours();
  const mins = String(now.getMinutes()).padStart(2, '0');
  const timeStr = `${String(hours).padStart(2, '0')}:${mins}`;

  document.getElementById('currentTime').textContent = timeStr;

  const options = { weekday: 'long', month: 'long', day: 'numeric' };
  document.getElementById('currentDate').textContent = now.toLocaleDateString('en-US', options);

  let greeting;
  if (hours >= 0 && hours < 5) greeting = 'Still up? Go to sleep!';
  else if (hours >= 5 && hours < 12) greeting = 'Good morning!';
  else if (hours >= 12 && hours < 17) greeting = 'Good afternoon!';
  else if (hours >= 17 && hours < 21) greeting = 'Good evening!';
  else greeting = 'Good night!';

  document.getElementById('greeting').textContent = greeting;
}

async function loadStats() {
  try {
    const data = await chrome.storage.sync.get(['coins', 'streak', 'petLevel']);
    document.getElementById('statCoins').textContent = data.coins || 0;
    document.getElementById('statStreak').textContent = data.streak || 0;
    document.getElementById('statLevel').textContent = data.petLevel || 1;
  } catch {
    // Storage may not be available
  }
}

function drawPet() {
  const canvas = document.getElementById('newtabPetCanvas');
  const ctx = canvas.getContext('2d');

  const c = {
    body: '#FFD93D', bodyDark: '#F4C430', bodyLight: '#FFE566',
    eyes: '#333333', eyeWhite: '#FFFFFF', mouth: '#E74C3C',
    outline: '#2C2C2C', cheeks: '#FF9999'
  };

  let frame = 0;

  function animate() {
    frame++;
    ctx.clearRect(0, 0, 32, 32);
    const bounce = Math.sin(frame * 0.06) * 1;
    const yOff = Math.round(bounce);
    const blink = frame % 150 < 4;

    // Shadow
    ctx.fillStyle = 'rgba(0,0,0,0.15)';
    ctx.beginPath();
    ctx.ellipse(16, 30, 8, 2, 0, 0, Math.PI * 2);
    ctx.fill();

    // Body
    for (let x = 8; x < 24; x++) {
      for (let y = 10 + yOff; y < 26 + yOff; y++) {
        const dx = x < 10 ? 10 - x : x > 21 ? x - 21 : 0;
        const dy = y < 12 + yOff ? 12 + yOff - y : y > 23 + yOff ? y - (23 + yOff) : 0;
        if (dx + dy > 2) continue;
        if (dx + dy === 2 || x === 8 || x === 23 || y === 10 + yOff || y === 25 + yOff) {
          px(ctx, x, y, c.outline);
        } else if (x < 12) {
          px(ctx, x, y, c.bodyDark);
        } else if (x > 19 && y < 15 + yOff) {
          px(ctx, x, y, c.bodyLight);
        } else {
          px(ctx, x, y, c.body);
        }
      }
    }

    // Ears
    px(ctx, 9, 9 + yOff, c.outline); px(ctx, 10, 8 + yOff, c.outline); px(ctx, 10, 9 + yOff, c.body);
    px(ctx, 22, 9 + yOff, c.outline); px(ctx, 21, 8 + yOff, c.outline); px(ctx, 21, 9 + yOff, c.body);

    // Feet
    px(ctx, 10, 26 + yOff, c.outline); px(ctx, 11, 26 + yOff, c.bodyDark); px(ctx, 12, 26 + yOff, c.outline);
    px(ctx, 19, 26 + yOff, c.outline); px(ctx, 20, 26 + yOff, c.bodyDark); px(ctx, 21, 26 + yOff, c.outline);

    // Eyes
    if (blink) {
      px(ctx, 12, 16 + yOff, c.eyes); px(ctx, 13, 16 + yOff, c.eyes);
      px(ctx, 19, 16 + yOff, c.eyes); px(ctx, 20, 16 + yOff, c.eyes);
    } else {
      px(ctx, 12, 15 + yOff, c.eyeWhite); px(ctx, 13, 15 + yOff, c.eyeWhite);
      px(ctx, 12, 16 + yOff, c.eyeWhite); px(ctx, 13, 16 + yOff, c.eyes);
      px(ctx, 19, 15 + yOff, c.eyeWhite); px(ctx, 20, 15 + yOff, c.eyeWhite);
      px(ctx, 19, 16 + yOff, c.eyes); px(ctx, 20, 16 + yOff, c.eyeWhite);
    }

    // Smile
    px(ctx, 14, 20 + yOff, c.mouth); px(ctx, 15, 21 + yOff, c.mouth);
    px(ctx, 16, 21 + yOff, c.mouth); px(ctx, 17, 20 + yOff, c.mouth);

    // Cheeks
    px(ctx, 10, 19 + yOff, c.cheeks); px(ctx, 11, 19 + yOff, c.cheeks);
    px(ctx, 21, 19 + yOff, c.cheeks); px(ctx, 22, 19 + yOff, c.cheeks);

    // Waving hand (occasional)
    if (frame % 200 < 40) {
      const waveOff = Math.sin(frame * 0.3) > 0 ? 0 : 1;
      px(ctx, 24, 14 + yOff + waveOff, c.body);
      px(ctx, 25, 13 + yOff + waveOff, c.body);
      px(ctx, 25, 14 + yOff + waveOff, c.body);
    }

    requestAnimationFrame(animate);
  }

  animate();
}

function px(ctx, x, y, color) {
  ctx.fillStyle = color;
  ctx.fillRect(x, y, 1, 1);
}

function showPetGreeting() {
  const greetings = [
    "Welcome back! What shall we explore?",
    "New tab, new adventure!",
    "Hey! Ready to browse?",
    "I was waiting for you!",
    "Let's find something cool today!",
    "Another tab? I like your style.",
    "The internet awaits!"
  ];

  const hour = new Date().getHours();
  let extraGreetings = [];
  if (hour >= 0 && hour < 5) {
    extraGreetings = ["Go. To. Sleep.", "Night owl energy...", "Even I'm tired!"];
  }

  const all = [...greetings, ...extraGreetings];
  const msg = all[Math.floor(Math.random() * all.length)];

  const el = document.getElementById('petSpeech');
  typeWriter(el, msg);
}

function typeWriter(el, text, i = 0) {
  if (i <= text.length) {
    el.textContent = text.substring(0, i);
    setTimeout(() => typeWriter(el, text, i + 1), 35);
  }
}

function setupSearch() {
  const input = document.getElementById('searchInput');
  const btn = document.getElementById('searchBtn');

  function doSearch() {
    const query = input.value.trim();
    if (!query) return;

    if (query.match(/^https?:\/\//)) {
      window.location.href = query;
    } else if (query.includes('.') && !query.includes(' ')) {
      window.location.href = 'https://' + query;
    } else {
      window.location.href = 'https://www.google.com/search?q=' + encodeURIComponent(query);
    }
  }

  input.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') doSearch();
  });
  btn.addEventListener('click', doSearch);
}

function setupLinks() {
  document.getElementById('openDashboard').addEventListener('click', (e) => {
    e.preventDefault();
    chrome.tabs.create({ url: chrome.runtime.getURL('options/options.html') });
  });
}
