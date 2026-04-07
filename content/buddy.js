/**
 * BrowseBuddy — Pet State Machine, Renderer & Interactions
 * Image-based sprite rendering with emoji overlays per state
 */
const BrowseBuddy = (() => {
  // ===================== PET STATES =====================
  const PET_STATES = {
    IDLE: {
      animation: 'idle',
      dialogues: [
        "Hey! I'm here if you need anything.",
        "Just hanging out with you.",
        "Take your time, I'm not going anywhere.",
        "Anything interesting happening?",
        "I like this page. It's got good vibes.",
        "You know you can double-click me for options, right?",
        "Just a pixel pup keeping you company.",
        "Let me know if you find something cool!",
        "I'm always here, just chilling.",
        "Need a break? I could use a snack too."
      ],
      emojis: ['😊', '✨', '💫'],
      accessory: null
    },
    SLEEPING: {
      animation: 'idle',
      dialogues: [
        "zzz...",
        "Five more minutes...",
        "Shh... I'm resting my pixels...",
        "*soft snoring*"
      ],
      emojis: ['💤', '😴', '🌙'],
      accessory: '💤'
    },
    WALKING: {
      animation: 'walk',
      dialogues: [
        "Just stretching my legs a bit!",
        "Going for a little walk.",
        "Exploring your screen real estate!"
      ],
      emojis: ['🐾', '✨'],
      accessory: null
    },
    NAUGHTY_REACTION: {
      animation: 'bark',
      dialogues: [
        "Oh! Incognito mode, huh? Your secret's safe with me.",
        "Going off the grid, I see. I respect that.",
        "Private browsing activated. I'll look the other way.",
        "Incognito! Just so you know, I can still see you... but I won't tell.",
        "Fun fact: incognito doesn't hide you from your ISP. Just saying!",
        "Don't worry, what happens here stays here.",
        "Stealth mode! I feel like a spy dog right now.",
        "I'll pretend I didn't see anything.",
        "Private time? I'll just sit here quietly.",
        "Between you and me, this never happened."
      ],
      emojis: ['😏', '👀', '🫣', '🕶️'],
      accessory: '🕶️',
      memes: ['peter_parker_naughty', 'hey_boiii', 'side_eye']
    },
    SHY_COVERING_EYES: {
      animation: 'bark',
      dialogues: [
        "Oh my... I'm gonna look away now.",
        "I'm covering my eyes! ...mostly.",
        "This is a bit much for a little pixel pup.",
        "I'll just be here, not looking. Nope. Not at all.",
        "Maybe switch to something else? For my sake?"
      ],
      emojis: ['🙈', '😳', '🫣'],
      accessory: '🙈',
      memes: ['surprised_pikachu']
    },
    SHOPPING_EXCITED: {
      animation: 'walk',
      dialogues: [
        "Shopping time! I'll keep an eye out for deals.",
        "Nice find! Want me to check for cashback?",
        "I spotted some potential savings on this page.",
        "Take your time picking — I'm enjoying window shopping too!",
        "Ooh, good taste! I'd add that to cart if I had hands.",
        "Before you checkout, maybe check for coupon codes?",
        "I love shopping with you. You have great taste!",
        "Pro tip: I can help you earn cashback on this store.",
        "Browsing or buying today? Either way, I'm here!",
        "Found something you like? Let me see if there's a deal!"
      ],
      emojis: ['🛍️', '💳', '🏷️', '💰'],
      accessory: '🛍️'
    },
    SPORTS_FAN: {
      animation: 'bark',
      dialogues: [
        "Ooh, a match! Who are we cheering for?",
        "Sports time! I love watching games with you.",
        "This is getting exciting, isn't it?",
        "I can feel the energy even through the screen!",
        "Big game day, huh? I'll keep you company.",
        "These scores are looking interesting...",
        "Nothing beats live sports. Well, maybe treats. But close!",
        "I'd cheer louder but I'm just a pixel pup.",
        "Match day vibes! Got any snacks for us?",
        "Who's your favorite player? I'm curious!",
        "Want me to stay quiet so you can focus on the game?",
        "I'm rooting for whoever you're rooting for!"
      ],
      emojis: ['⚽', '🏏', '🏀', '🔥', '🏆'],
      accessory: '🏆'
    },
    HACKER_MODE: {
      animation: 'idle',
      dialogues: [
        "Coding time! Need a rubber duck? I'm right here.",
        "I see code! I'll keep quiet and let you focus.",
        "You're in the zone — I can tell. Keep going!",
        "Debugging? Remember: the bug is always where you least expect it.",
        "Stack Overflow again, huh? We've all been there.",
        "Ship it! ...after one more code review maybe.",
        "I believe in your code. Even if the compiler doesn't.",
        "Take breaks! Your brain works better after a rest.",
        "Clean code, clear mind. You've got this!",
        "I may not understand code, but I understand you're working hard."
      ],
      emojis: ['💻', '⌨️', '🤓', '🐛', '✅'],
      accessory: '💻'
    },
    VIBING: {
      animation: 'walk',
      dialogues: [
        "Ooh, music! This is a great pick.",
        "I love listening along with you!",
        "Good playlist! Your taste is impeccable.",
        "Music makes everything better, don't you think?",
        "I'm bobbing my head along. Can you tell?",
        "Turn it up! ...or keep it chill. Either way I'm happy.",
        "What a vibe. I could listen to this all day.",
        "Discovering new music? That's always exciting!"
      ],
      emojis: ['🎵', '🎶', '🎧', '🎤', '💃'],
      accessory: '🎧'
    },
    SOCIAL_SCROLLING: {
      animation: 'idle',
      dialogues: [
        "Scrolling through feeds? I'll scroll with you!",
        "See anything interesting? Share with me!",
        "Social media is fun, but remember to take breaks too.",
        "I bet your posts get way more likes than mine.",
        "Ooh, this feed is entertaining today!",
        "Don't forget to look up from the screen once in a while!",
        "Anything good trending today?",
        "I'd follow you if I had an account. Just saying!"
      ],
      emojis: ['📱', '👍', '❤️', '📸', '🔔'],
      accessory: '📱'
    },
    FOODIE_MODE: {
      animation: 'walk',
      dialogues: [
        "Mmm, looking at food! Now I'm hungry too.",
        "That looks delicious! What are you thinking of ordering?",
        "Good food choices! You know what you like.",
        "I wish I could taste things. Being a pixel pup has its limits.",
        "Ordering in tonight? Smart move!",
        "Take your time deciding — the best meals are worth the wait.",
        "If you need a recommendation, I'd say... get dessert too!",
        "Whatever you pick, I'm sure it'll be amazing."
      ],
      emojis: ['🍕', '🍔', '🌮', '🤤', '👨‍🍳'],
      accessory: '🍕'
    },
    MONEY_EYES: {
      animation: 'idle',
      dialogues: [
        "Checking the markets? I hope the numbers look good!",
        "Finance stuff! You're being responsible. I respect that.",
        "Markets can be wild. Remember — patience is key.",
        "I'm not a financial advisor, but I am a good listener.",
        "Green candles are the best candles, am I right?",
        "Whatever you do, I'm rooting for your portfolio!",
        "Smart money moves! I'm impressed.",
        "Remember to diversify. Even my treats come in different flavors."
      ],
      emojis: ['📈', '💎', '🚀', '🤑', '💸'],
      accessory: '🤑'
    },
    NEWS_READER: {
      animation: 'idle',
      dialogues: [
        "Staying informed! That's always a good idea.",
        "Lots happening in the world today, huh?",
        "Reading the news? I'll keep you company.",
        "Remember, it's okay to step away if it gets heavy.",
        "Knowledge is power! Keep reading.",
        "I admire that you stay up to date on things.",
        "Interesting headlines today. What caught your eye?",
        "Take breaks between heavy news. Your wellbeing matters!"
      ],
      emojis: ['📰', '🗞️', '🧐', '☕'],
      accessory: '📰'
    },
    WATCHING_MODE: {
      animation: 'idle',
      dialogues: [
        "Movie time! Or is it a series? Either way, I'm in!",
        "I'll try not to spoil anything. Promise!",
        "Pass the popcorn! ...oh wait, I'm a pixel pup.",
        "Great choice! I've heard good things about this one.",
        "One more episode won't hurt, right?",
        "I love watching stuff with you. Best seat in the house!",
        "Let me know if it's good. I trust your taste!",
        "Streaming and chilling? Count me in!"
      ],
      emojis: ['🍿', '🎬', '📺', '🫠'],
      accessory: '🍿'
    },
    GAMER_MODE: {
      animation: 'bark',
      dialogues: [
        "Gaming session! Let's go! I'll be your cheerleader.",
        "You're really good at this! ...I think. I'm a dog.",
        "Need a break between matches? I'll be here!",
        "I'd play too if I had opposable thumbs.",
        "Focus up! You've got this!",
        "Win or lose, you're still my favorite human.",
        "That looked like an awesome play!",
        "Gaming is the best way to unwind. I totally get it."
      ],
      emojis: ['🎮', '🕹️', '👾', '🏆', '💪'],
      accessory: '🎮'
    }
  };

  // Site-specific greetings (triggered on first detection)
  const SITE_GREETINGS = {
    'cricbuzz.com': "Hey! Checking cricket scores on Cricbuzz? Let's see how the match is going!",
    'espncricinfo.com': "ESPNcricinfo! The cricket encyclopedia. Who's batting?",
    'espn.com': "ESPN! Let's catch up on the latest in sports.",
    'goal.com': "Football fan! Let's see what's happening on the pitch.",
    'nba.com': "NBA! Who's leading the standings?",
    'amazon.com': "Amazon! I'll help keep an eye out for deals and cashback.",
    'amazon.in': "Amazon India! Let's find some great deals together.",
    'flipkart.com': "Flipkart time! Let me check if there's cashback available.",
    'github.com': "GitHub! Working on something cool? I'll keep you company.",
    'stackoverflow.com': "Stack Overflow! Let's find that answer together.",
    'youtube.com': "YouTube! What are we watching today?",
    'netflix.com': "Netflix! Grab some popcorn, I'll settle in too.",
    'spotify.com': "Spotify! Great music taste, I can already tell.",
    'reddit.com': "Reddit! Let's see what's trending today.",
    'twitter.com': "Checking Twitter? Let's see what's happening!",
    'x.com': "On X! What's the buzz today?",
    'instagram.com': "Instagram! Let's scroll through some nice content.",
    'twitch.tv': "Twitch! Who are we watching stream today?",
    'zomato.com': "Zomato! I can smell the food already. What are you craving?",
    'swiggy.com': "Swiggy! Ordering in? Smart choice!",
    'tradingview.com': "TradingView! Analyzing charts? You look like a pro.",
    'moneycontrol.com': "Moneycontrol! Keeping tabs on the markets. Smart!",
    'leetcode.com': "LeetCode! Time to crack some algorithms. You've got this!"
  };

  const TIME_DIALOGUES = {
    lateNight: [
      "It's getting pretty late. Don't forget to rest!",
      "Still up? I'm here with you, but sleep is important too.",
      "Late night browsing, huh? I'll keep the watch."
    ],
    morning: [
      "Good morning! Fresh start, let's make it a great day.",
      "Rise and shine! What's on the agenda today?",
      "Morning! Hope you slept well."
    ],
    workHours: [
      "Looks like a productive session! Keep it up.",
      "You're doing great! Stay focused.",
      "Need anything? I'm here if you need a break."
    ]
  };

  // ===================== SPRITE ASSETS =====================
  const SPRITE_BASE = 'assets/sprites/dog/';

  // Frame helper: generates array of frame paths
  function framePaths(animType, direction, count) {
    const paths = [];
    for (let i = 0; i < count; i++) {
      paths.push(`${animType}/${direction}/frame_${String(i).padStart(3, '0')}.png`);
    }
    return paths;
  }

  const SPRITE_MANIFEST = {
    rotations: {
      south: 'rotations/south.png',
      east: 'rotations/east.png',
      west: 'rotations/west.png',
      north: 'rotations/north.png',
      'south-east': 'rotations/south-east.png',
      'south-west': 'rotations/south-west.png',
      'north-east': 'rotations/north-east.png',
      'north-west': 'rotations/north-west.png'
    },
    sneaking: {
      south:       framePaths('sneaking', 'south', 8),
      east:        framePaths('sneaking', 'east', 8),
      west:        framePaths('sneaking', 'west', 8),
      north:       framePaths('sneaking', 'north', 8),
      'south-east': framePaths('sneaking', 'south-east', 8),
      'south-west': framePaths('sneaking', 'south-west', 8),
      'north-west': framePaths('sneaking', 'north-west', 8)
    },
    bark: {
      east:        framePaths('bark', 'east', 6),
      west:        framePaths('bark', 'west', 6),
      north:       framePaths('bark', 'north', 6),
      'north-east': framePaths('bark', 'north-east', 6),
      'south-east': framePaths('bark', 'south-east', 6),
      'south-west': framePaths('bark', 'south-west', 6)
    }
  };

  // Direction fallbacks: if exact direction missing for an animation, use closest
  const DIR_FALLBACKS = {
    south:       ['south-east', 'south-west', 'east', 'west'],
    north:       ['north-east', 'north-west', 'east', 'west'],
    east:        ['south-east', 'north-east', 'south', 'north'],
    west:        ['south-west', 'north-west', 'south', 'north'],
    'south-east': ['east', 'south', 'south-west', 'north-east'],
    'south-west': ['west', 'south', 'south-east', 'north-west'],
    'north-east': ['east', 'north', 'north-west', 'south-east'],
    'north-west': ['west', 'north', 'north-east', 'south-west']
  };

  // Loaded images: { rotations: {dir: img}, sneaking: {dir: [imgs]}, bark: {dir: [imgs]} }
  const _images = { rotations: {}, sneaking: {}, bark: {} };
  let _imagesLoaded = false;

  function loadImages() {
    return new Promise((resolve) => {
      let remaining = 0;

      function onLoad() {
        remaining--;
        if (remaining <= 0) {
          _imagesLoaded = true;
          resolve();
        }
      }

      // Load rotations (static direction sprites)
      for (const [dir, path] of Object.entries(SPRITE_MANIFEST.rotations)) {
        remaining++;
        const img = new Image();
        img.src = chrome.runtime.getURL(SPRITE_BASE + path);
        img.onload = onLoad;
        img.onerror = onLoad;
        _images.rotations[dir] = img;
      }

      // Load directional animation frames (sneaking & bark)
      for (const animType of ['sneaking', 'bark']) {
        for (const [dir, paths] of Object.entries(SPRITE_MANIFEST[animType])) {
          _images[animType][dir] = [];
          for (const path of paths) {
            remaining++;
            const img = new Image();
            img.src = chrome.runtime.getURL(SPRITE_BASE + path);
            img.onload = onLoad;
            img.onerror = onLoad;
            _images[animType][dir].push(img);
          }
        }
      }

      if (remaining === 0) resolve();
    });
  }

  // Get animation frames for the current facing direction, with fallback
  function getAnimFrames(animType) {
    const animSet = _images[animType];
    if (!animSet) return null;
    // Try exact direction
    if (animSet[_facing]?.length) return animSet[_facing];
    // Try fallbacks
    const fallbacks = DIR_FALLBACKS[_facing] || [];
    for (const fb of fallbacks) {
      if (animSet[fb]?.length) return animSet[fb];
    }
    // Last resort: grab any available direction
    for (const dir of Object.keys(animSet)) {
      if (animSet[dir]?.length) return animSet[dir];
    }
    return null;
  }

  // ===================== STATE =====================
  let _currentState = 'IDLE';
  let _previousStates = [];
  let _container = null;
  let _canvas = null;
  let _ctx = null;
  let _speechBubble = null;
  let _memeOverlay = null;
  let _menu = null;
  let _affiliateBadge = null;
  let _emojiRing = null;
  let _accessoryEl = null;
  let _animFrame = null;
  let _frameCount = 0;
  let _isDragging = false;
  let _dragOffset = { x: 0, y: 0 };
  let _clickSuppressed = false;
  let _dialogueTimer = null;
  let _lastDialogues = [];
  let _lastMemes = [];
  let _speechQueue = [];
  let _isSpeaking = false;
  let _idleTimer = null;
  let _menuVisible = false;
  let _initialized = false;
  let _particleContainer = null;
  let _minigameActive = false;
  let _emojiInterval = null;
  let _facing = 'south';

  // ===================== INIT =====================
  function init() {
    if (_initialized) return;
    if (document.querySelector('.bb-container')) return;
    _initialized = true;

    _container = document.createElement('div');
    _container.className = 'bb-container';

    _canvas = document.createElement('canvas');
    _canvas.className = 'bb-pet-canvas';
    _canvas.width = 68;
    _canvas.height = 68;
    _ctx = _canvas.getContext('2d');

    _speechBubble = document.createElement('div');
    _speechBubble.className = 'bb-speech-bubble';

    _memeOverlay = document.createElement('div');
    _memeOverlay.className = 'bb-meme-overlay';

    _affiliateBadge = document.createElement('div');
    _affiliateBadge.className = 'bb-affiliate-badge';

    _particleContainer = document.createElement('div');
    _particleContainer.className = 'bb-particles';

    _emojiRing = document.createElement('div');
    _emojiRing.className = 'bb-emoji-ring';

    _accessoryEl = document.createElement('div');
    _accessoryEl.className = 'bb-accessory';

    _menu = document.createElement('div');
    _menu.className = 'bb-menu';
    rebuildMenu();

    _container.appendChild(_particleContainer);
    _container.appendChild(_emojiRing);
    _container.appendChild(_memeOverlay);
    _container.appendChild(_affiliateBadge);
    _container.appendChild(_accessoryEl);
    _container.appendChild(_canvas);
    _container.appendChild(_speechBubble);
    _container.appendChild(_menu);
    document.body.appendChild(_container);

    try {
      BuddyStorage.get('settings').then((settings) => {
        if (settings?.petPosition?.x != null) {
          _container.style.left = settings.petPosition.x + 'px';
          _container.style.bottom = settings.petPosition.y + 'px';
          _container.style.right = 'auto';
        }
      }).catch(() => {});
    } catch (e) {}

    // Load sprite images then start rendering
    loadImages().then(() => {
      console.log('[BrowseBuddy] Sprites loaded');
      startAnimation();
    });

    setupEvents();
    startIdleTracking();
    startRandomWalk();
    setupKonamiCode();
    startEmojiOrbit();
    loadMood();
    startMoodDecay();
  }

  // ===================== EVENTS =====================
  function setupEvents() {
    _canvas.addEventListener('click', (e) => {
      e.stopPropagation();
      if (_isDragging) return;
      if (_menuVisible) { hideMenu(); return; }
      // If click is suppressed (e.g., trick teaching mode), let the feature handle it
      if (_clickSuppressed) return;
      try { BuddyRewards.awardInteraction(); } catch (e) {}
      try { BuddyAnalytics.track('pet_interaction', { type: 'click', state: _currentState }); } catch (e) {}
      sayRandom();
      spawnHeart();
      spawnClickEmoji();
      // Wiggle animation on click
      _canvas.style.animation = 'bb-wiggle 0.4s ease';
      setTimeout(() => { _canvas.style.animation = ''; }, 400);
    });

    _canvas.addEventListener('dblclick', (e) => {
      e.stopPropagation();
      e.preventDefault();
      toggleMenu();
    });

    _canvas.addEventListener('mousedown', onDragStart);
    document.addEventListener('mousemove', onDragMove);
    document.addEventListener('mouseup', onDragEnd);
    _canvas.addEventListener('touchstart', onDragStart, { passive: false });
    document.addEventListener('touchmove', onDragMove, { passive: false });
    document.addEventListener('touchend', onDragEnd);

    _menu.addEventListener('click', (e) => {
      const item = e.target.closest('.bb-menu-item');
      if (!item) return;
      hideMenu();
      handleMenuAction(item.dataset.action);
    });

    document.addEventListener('click', (e) => {
      if (_menuVisible && !_container.contains(e.target)) hideMenu();
    });

    _speechBubble.addEventListener('click', () => hideSpeechBubble());

    ['mousemove', 'keydown', 'scroll', 'click'].forEach((evt) => {
      document.addEventListener(evt, resetIdleTimer, { passive: true });
    });
  }

  // ===================== DRAG =====================
  let _dragStartTime = 0;

  function onDragStart(e) {
    e.preventDefault();
    _dragStartTime = Date.now();
    const pos = e.touches ? e.touches[0] : e;
    const rect = _container.getBoundingClientRect();
    _dragOffset.x = pos.clientX - rect.left;
    _dragOffset.y = pos.clientY - rect.top;
    _isDragging = false;
  }

  function onDragMove(e) {
    if (_dragStartTime === 0) return;
    if (Date.now() - _dragStartTime < 150 && !_isDragging) return;
    _isDragging = true;
    _container.classList.add('bb-dragging');
    const pos = e.touches ? e.touches[0] : e;
    const x = pos.clientX - _dragOffset.x;
    const y = window.innerHeight - pos.clientY - (_container.offsetHeight - _dragOffset.y);
    _container.style.left = Math.max(0, Math.min(x, window.innerWidth - 120)) + 'px';
    _container.style.bottom = Math.max(0, Math.min(y, window.innerHeight - 120)) + 'px';
    _container.style.right = 'auto';
  }

  function onDragEnd() {
    if (_isDragging) {
      const left = parseInt(_container.style.left);
      const bottom = parseInt(_container.style.bottom);
      try { BuddyStorage.updateSettings({ petPosition: { x: left, y: bottom } }); } catch (e) {}
    }
    _container.classList.remove('bb-dragging');
    setTimeout(() => { _isDragging = false; }, 50);
    _dragStartTime = 0;
  }

  // ===================== ANIMATION LOOP =====================
  function startAnimation() {
    function loop() {
      _frameCount++;
      renderFrame();
      _animFrame = requestAnimationFrame(loop);
    }
    loop();
  }

  function stopAnimation() {
    if (_animFrame) cancelAnimationFrame(_animFrame);
  }

  // ===================== SPRITE RENDERER =====================
  let _spriteFrame = 0;
  // Frames between sprite changes (higher = slower, smoother)
  // At 60fps: walk changes every 12/60=0.2s, bark every 15/60=0.25s
  const ANIM_SPEEDS = { walk: 12, bark: 15, idle: 0 };

  function renderFrame() {
    _ctx.clearRect(0, 0, 68, 68);

    if (!_imagesLoaded) return;

    const state = PET_STATES[_currentState];
    const animType = state?.animation || 'idle';

    // Gentle breathing bounce (disabled when sleeping)
    const bounceY = _currentState === 'SLEEPING'
      ? 0
      : Math.sin(_frameCount * 0.03) * 1.2;

    // Shadow
    _ctx.fillStyle = 'rgba(0,0,0,0.1)';
    _ctx.beginPath();
    _ctx.ellipse(34, 64, 18, 4, 0, 0, Math.PI * 2);
    _ctx.fill();

    _ctx.save();
    _ctx.translate(0, Math.round(bounceY));

    if (animType === 'walk' || animType === 'bark') {
      // Directional animation: sneaking (walk) or bark
      const sourceType = animType === 'walk' ? 'sneaking' : 'bark';
      const frames = getAnimFrames(sourceType);
      if (frames && frames.length > 0) {
        const speed = ANIM_SPEEDS[animType] || 8;
        if (_frameCount % speed === 0) {
          _spriteFrame = (_spriteFrame + 1) % frames.length;
        }
        const frame = frames[_spriteFrame];
        if (frame && frame.complete && frame.naturalWidth > 0) {
          _ctx.drawImage(frame, 0, 0, 68, 68);
        }
      } else {
        // Fallback to static rotation if no animation frames exist
        const img = _images.rotations[_facing] || _images.rotations['south'];
        if (img && img.complete && img.naturalWidth > 0) {
          _ctx.drawImage(img, 0, 0, 68, 68);
        }
      }
    } else {
      // Static rotation sprite (idle)
      const img = _images.rotations[_facing] || _images.rotations['south'];
      if (img && img.complete && img.naturalWidth > 0) {
        _ctx.drawImage(img, 0, 0, 68, 68);
      }
    }

    _ctx.restore();

    // Sleeping: draw dark overlay
    if (_currentState === 'SLEEPING') {
      _ctx.fillStyle = 'rgba(0,0,0,0.08)';
      _ctx.fillRect(0, 0, 68, 68);
    }

    // Update accessory emoji
    updateAccessory();
  }

  function updateAccessory() {
    const state = PET_STATES[_currentState];
    if (state?.accessory) {
      _accessoryEl.textContent = state.accessory;
      _accessoryEl.classList.add('bb-visible');
    } else {
      _accessoryEl.classList.remove('bb-visible');
    }
  }

  // ===================== EMOJI ORBIT SYSTEM =====================
  function startEmojiOrbit() {
    updateEmojiRing();
    _emojiInterval = setInterval(updateEmojiRing, 8000);

    // Periodic floating emoji
    setInterval(() => {
      if (Math.random() < 0.4) spawnStateParticle();
    }, 4000);
  }

  function updateEmojiRing() {
    if (!_emojiRing) return;
    const state = PET_STATES[_currentState];
    if (!state?.emojis) return;
    _emojiRing.innerHTML = '';
    const emojis = state.emojis;
    const count = Math.min(emojis.length, 4);
    for (let i = 0; i < count; i++) {
      const emoji = document.createElement('span');
      emoji.className = 'bb-orbit-emoji';
      emoji.textContent = emojis[i];
      emoji.style.setProperty('--orbit-delay', `${i * (6 / count)}s`);
      emoji.style.setProperty('--orbit-radius', '55px');
      emoji.style.setProperty('--orbit-start', `${(i / count) * 360}deg`);
      _emojiRing.appendChild(emoji);
    }
  }

  function spawnClickEmoji() {
    const state = PET_STATES[_currentState];
    if (!state?.emojis) return;
    const emoji = state.emojis[Math.floor(Math.random() * state.emojis.length)];
    const el = document.createElement('span');
    el.className = 'bb-pop-emoji';
    el.textContent = emoji;
    el.style.left = (20 + Math.random() * 80) + 'px';
    el.style.bottom = (50 + Math.random() * 50) + 'px';
    _particleContainer.appendChild(el);
    setTimeout(() => el.remove(), 1200);
  }

  // ===================== PARTICLE EFFECTS =====================
  function spawnHeart() {
    const el = document.createElement('span');
    el.className = 'bb-heart';
    el.textContent = '❤️';
    el.style.left = (20 + Math.random() * 60) + 'px';
    el.style.bottom = (60 + Math.random() * 40) + 'px';
    _particleContainer.appendChild(el);
    setTimeout(() => el.remove(), 800);
  }

  function spawnConfetti(count = 12) {
    const colors = ['#ff6b6b', '#ffd93d', '#6bcb77', '#4d96ff', '#ff6bd6', '#ff9f43'];
    for (let i = 0; i < count; i++) {
      const el = document.createElement('div');
      el.className = 'bb-confetti';
      el.style.left = (30 + Math.random() * 60) + 'px';
      el.style.bottom = '80px';
      el.style.background = colors[Math.floor(Math.random() * colors.length)];
      el.style.setProperty('--bb-x', (Math.random() * 60 - 30) + 'px');
      el.style.animationDuration = (1 + Math.random()) + 's';
      _particleContainer.appendChild(el);
      setTimeout(() => el.remove(), 2000);
    }
  }

  function spawnStateParticle() {
    const state = PET_STATES[_currentState];
    if (!state?.emojis) return;
    const emoji = state.emojis[Math.floor(Math.random() * state.emojis.length)];
    const el = document.createElement('span');
    el.className = 'bb-float-emoji';
    el.textContent = emoji;
    el.style.left = (Math.random() * 100) + 'px';
    el.style.bottom = '30px';
    _particleContainer.appendChild(el);
    setTimeout(() => el.remove(), 2500);
  }

  // ===================== SPEECH BUBBLE =====================
  let _summaryPending = false;

  function say(text) {
    if (_isSpeaking) { _speechQueue.push(text); return; }
    _isSpeaking = true;
    _speechBubble.innerHTML = '';
    _speechBubble.classList.add('bb-visible');
    typeWriter(text, 0, () => {
      clearTimeout(_dialogueTimer);
      _dialogueTimer = setTimeout(() => { hideSpeechBubble(); processQueue(); }, 5000);
    });
  }

  // Priority speech — clears queue and speaks immediately (used by page summary)
  function sayPriority(text) {
    _speechQueue = [];
    clearTimeout(_dialogueTimer);
    if (_isSpeaking) {
      _speechBubble.classList.remove('bb-visible');
      _isSpeaking = false;
    }
    say(text);
  }

  function setSummaryPending(val) { _summaryPending = val; }

  function typeWriter(text, i, onDone) {
    if (i <= text.length) {
      _speechBubble.innerHTML = text.substring(0, i) + '<span class="bb-speech-cursor"></span>';
      setTimeout(() => typeWriter(text, i + 1, onDone), 30);
    } else {
      _speechBubble.innerHTML = text;
      if (onDone) onDone();
    }
  }

  function hideSpeechBubble() {
    _speechBubble.classList.remove('bb-visible');
    _isSpeaking = false;
  }

  function processQueue() {
    if (_speechQueue.length > 0) setTimeout(() => say(_speechQueue.shift()), 500);
  }

  function sayRandom() {
    const state = PET_STATES[_currentState];
    if (!state?.dialogues?.length) return;

    // YouTube-aware: 40% chance to comment on the video instead of generic dialogue
    if (_ytContext.category && (_currentState === 'WATCHING_MODE' || _currentState === 'VIBING') && Math.random() < 0.4) {
      const comment = _generateYTComment();
      if (comment) { say(comment); return; }
    }

    // Time-based dialogues (15% chance)
    const hour = new Date().getHours();
    if (Math.random() < 0.15) {
      let td = null;
      if (hour >= 0 && hour < 5) td = TIME_DIALOGUES.lateNight;
      else if (hour >= 6 && hour < 9) td = TIME_DIALOGUES.morning;
      else if (hour >= 9 && hour < 18) td = TIME_DIALOGUES.workHours;
      if (td) { say(td[Math.floor(Math.random() * td.length)]); return; }
    }

    // State dialogues (avoid repeats)
    let available = state.dialogues.filter((d) => !_lastDialogues.includes(d));
    if (available.length === 0) { _lastDialogues = []; available = state.dialogues; }
    const dialogue = available[Math.floor(Math.random() * available.length)];
    _lastDialogues.push(dialogue);
    if (_lastDialogues.length > 10) _lastDialogues.shift();
    say(dialogue);
  }

  // ===================== MEME OVERLAY =====================
  function showMeme(memeId) {
    if (_lastMemes.length >= 3 && _lastMemes.includes(memeId)) return;
    const img = document.createElement('img');
    img.src = chrome.runtime.getURL(`assets/memes/${memeId}.png`);
    img.alt = memeId;
    _memeOverlay.innerHTML = '';
    _memeOverlay.appendChild(img);
    _memeOverlay.classList.add('bb-visible');
    _lastMemes.push(memeId);
    if (_lastMemes.length > 3) _lastMemes.shift();
    setTimeout(() => {
      _memeOverlay.classList.remove('bb-visible');
      _memeOverlay.classList.add('bb-fading');
      setTimeout(() => { _memeOverlay.classList.remove('bb-fading'); _memeOverlay.innerHTML = ''; }, 500);
    }, 3500);
  }

  function showRandomMeme() {
    const state = PET_STATES[_currentState];
    if (!state?.memes?.length) return;
    const available = state.memes.filter((m) => !_lastMemes.slice(-1).includes(m));
    if (available.length === 0) return;
    showMeme(available[Math.floor(Math.random() * available.length)]);
  }

  // ===================== FEATURE REGISTRATION =====================
  const _registeredActions = [];

  function registerMenuAction(id, icon, label, handler) {
    _registeredActions.push({ id, icon, label, handler });
    rebuildMenu();
  }

  function rebuildMenu() {
    if (!_menu) return;
    const coreItems = [
      { id: 'feed', icon: '🍕', label: 'Feed' },
      { id: 'play', icon: '🎮', label: 'Play' },
      { id: 'stats', icon: '📊', label: 'Stats' },
      { id: 'talk', icon: '💬', label: 'Talk' }
    ];
    let html = coreItems.map(i =>
      `<button class="bb-menu-item" data-action="${i.id}"><span class="bb-menu-icon">${i.icon}</span>${i.label}</button>`
    ).join('');

    if (_registeredActions.length > 0) {
      html += '<div class="bb-menu-divider"></div>';
      html += _registeredActions.map(i =>
        `<button class="bb-menu-item" data-action="${i.id}"><span class="bb-menu-icon">${i.icon}</span>${i.label}</button>`
      ).join('');
    }
    _menu.innerHTML = html;
  }

  // ===================== MOOD SYSTEM =====================
  let _petMood = { happy: 80, hungry: 30, sleepy: 20, playful: 60 };

  function adjustMood(dimension, delta) {
    if (_petMood[dimension] === undefined) return;
    _petMood[dimension] = Math.max(0, Math.min(100, _petMood[dimension] + delta));
    // Persist
    try { BuddyStorage.set({ petMood: _petMood }); } catch (e) {}
  }

  function getMood() { return { ..._petMood }; }

  // Load mood from storage on init
  function loadMood() {
    try {
      BuddyStorage.get('petMood').then(m => {
        if (m && typeof m === 'object') _petMood = { ..._petMood, ...m };
      }).catch(() => {});
    } catch (e) {}
  }

  // Passive mood decay every 10 minutes
  function startMoodDecay() {
    setInterval(() => {
      adjustMood('happy', -1);
      adjustMood('hungry', 1);
      adjustMood('sleepy', 1);
      adjustMood('playful', -1);
    }, 600000);
  }

  // ===================== MENU & INTERACTIONS =====================
  function toggleMenu() {
    _menuVisible = !_menuVisible;
    _menuVisible ? _menu.classList.add('bb-visible') : _menu.classList.remove('bb-visible');
    if (_menuVisible) hideSpeechBubble();
  }

  function hideMenu() { _menuVisible = false; _menu.classList.remove('bb-visible'); }

  function handleMenuAction(action) {
    try { BuddyAnalytics.track('pet_interaction', { type: action, state: _currentState }); } catch (e) {}
    // Check core actions
    switch (action) {
      case 'feed': feedPet(); return;
      case 'play': startMiniGame(); return;
      case 'stats': showStats(); return;
      case 'talk': sayRandom(); return;
    }
    // Check registered feature actions
    const registered = _registeredActions.find(a => a.id === action);
    if (registered) registered.handler();
  }

  function feedPet() {
    const foods = ['🍕', '🍔', '🌮', '🍩', '🍪', '🍎', '🍣', '🧁', '🍦', '🥐', '🍟', '🦴'];
    const food = foods[Math.floor(Math.random() * foods.length)];
    const el = document.createElement('span');
    el.className = 'bb-feed-emoji';
    el.textContent = food;
    _particleContainer.appendChild(el);
    setTimeout(() => {
      el.classList.add('bb-eaten');
      say(food === '🦴' ? "A bone! My favorite!" : "Yum! Nom nom nom!");
      spawnHeart();
      adjustMood('happy', 10);
      adjustMood('hungry', -20);
      setTimeout(() => el.remove(), 500);
    }, 800);
    try { BuddyRewards.awardInteraction(); } catch (e) {}
  }

  async function showStats() {
    try {
      const stats = await BuddyRewards.getStats();
      const xpPercent = stats.xpNeeded > 0 ? Math.round((stats.xpProgress / stats.xpNeeded) * 100) : 0;
      say(`Lvl ${stats.petLevel} ${stats.title} | ${stats.coins} coins | ${xpPercent}% to next level`);
    } catch (e) {
      say("I'm level awesome, that's all you need to know!");
    }
  }

  // ===================== MINI-GAME: COIN CATCH =====================
  function startMiniGame() {
    if (_minigameActive) return;
    _minigameActive = true;

    const GAME_DURATION = 40; // seconds
    const CANVAS_W = 240;
    const CANVAS_H = 260;

    const overlay = document.createElement('div');
    overlay.className = 'bb-minigame-overlay bb-visible';
    const gameCanvas = document.createElement('canvas');
    gameCanvas.className = 'bb-minigame-canvas';
    gameCanvas.width = CANVAS_W;
    gameCanvas.height = CANVAS_H;
    const scoreEl = document.createElement('div');
    scoreEl.className = 'bb-minigame-score';
    scoreEl.textContent = 'Score: 0 | Missed: 0';
    const closeBtn = document.createElement('button');
    closeBtn.className = 'bb-minigame-close';
    closeBtn.textContent = '✕';
    overlay.appendChild(gameCanvas);
    overlay.appendChild(scoreEl);
    overlay.appendChild(closeBtn);
    document.body.appendChild(overlay);

    const gCtx = gameCanvas.getContext('2d');
    let score = 0;
    let missed = 0;
    let combo = 0;
    let bestCombo = 0;
    let paddle = { x: CANVAS_W / 2 - 22, w: 44, h: 6 };
    let coins = [];
    let particles = [];
    let gameRunning = true;
    let elapsed = 0;

    // Progressive difficulty: coins spawn faster and fall faster over time
    function getDifficulty() {
      const t = elapsed / 60 / GAME_DURATION; // 0 to 1 over game duration
      return {
        spawnRate: Math.max(12, Math.floor(28 - t * 18)),  // frames between spawns: 28 → 10
        minSpeed: 1.2 + t * 1.5,                           // 1.2 → 2.7
        maxSpeed: 2.2 + t * 2.0,                           // 2.2 → 4.2
        paddleW: Math.max(30, 44 - Math.floor(t * 14))     // paddle shrinks: 44 → 30
      };
    }

    function spawnCoin() {
      const d = getDifficulty();
      const isBomb = Math.random() < 0.12 && elapsed > 300; // bombs after 5s, 12% chance
      coins.push({
        x: Math.random() * (CANVAS_W - 20) + 10,
        y: -12,
        speed: d.minSpeed + Math.random() * (d.maxSpeed - d.minSpeed),
        size: isBomb ? 10 : 8,
        isBomb: isBomb,
        rotation: 0
      });
    }

    function spawnCatchParticle(x, y, color) {
      for (let i = 0; i < 5; i++) {
        particles.push({
          x, y,
          vx: (Math.random() - 0.5) * 4,
          vy: -Math.random() * 3 - 1,
          life: 20 + Math.random() * 10,
          color
        });
      }
    }

    function gameLoop() {
      if (!gameRunning) return;
      elapsed++;

      const d = getDifficulty();
      paddle.w = d.paddleW;

      // Background
      gCtx.fillStyle = '#1a1a2e';
      gCtx.fillRect(0, 0, CANVAS_W, CANVAS_H);

      // Starfield background
      if (elapsed % 3 === 0) {
        gCtx.fillStyle = 'rgba(255,255,255,0.3)';
        gCtx.fillRect(Math.random() * CANVAS_W, Math.random() * CANVAS_H, 1, 1);
      }

      // Paddle (with glow)
      gCtx.shadowColor = '#e94560';
      gCtx.shadowBlur = combo >= 3 ? 12 : 4;
      gCtx.fillStyle = combo >= 5 ? '#f7c948' : combo >= 3 ? '#ff9f43' : '#e94560';
      gCtx.beginPath();
      gCtx.roundRect(paddle.x, CANVAS_H - 18, paddle.w, paddle.h, 3);
      gCtx.fill();
      gCtx.shadowBlur = 0;

      // Spawn coins
      if (elapsed % d.spawnRate === 0) spawnCoin();

      // Update & draw coins
      for (let i = coins.length - 1; i >= 0; i--) {
        const coin = coins[i];
        coin.y += coin.speed;
        coin.rotation += 0.1;

        if (coin.isBomb) {
          // Bomb (red circle with X)
          gCtx.fillStyle = '#ff4444';
          gCtx.beginPath();
          gCtx.arc(coin.x, coin.y, coin.size / 2, 0, Math.PI * 2);
          gCtx.fill();
          gCtx.strokeStyle = '#fff';
          gCtx.lineWidth = 1.5;
          gCtx.beginPath();
          gCtx.moveTo(coin.x - 3, coin.y - 3);
          gCtx.lineTo(coin.x + 3, coin.y + 3);
          gCtx.moveTo(coin.x + 3, coin.y - 3);
          gCtx.lineTo(coin.x - 3, coin.y + 3);
          gCtx.stroke();
        } else {
          // Gold coin with spinning effect
          const scaleX = Math.cos(coin.rotation);
          gCtx.fillStyle = '#f7c948';
          gCtx.beginPath();
          gCtx.ellipse(coin.x, coin.y, Math.abs(scaleX) * coin.size / 2, coin.size / 2, 0, 0, Math.PI * 2);
          gCtx.fill();
          gCtx.fillStyle = '#d4a017';
          gCtx.beginPath();
          gCtx.ellipse(coin.x, coin.y, Math.abs(scaleX) * coin.size / 4, coin.size / 4, 0, 0, Math.PI * 2);
          gCtx.fill();
        }

        // Catch detection
        if (coin.y > CANVAS_H - 24 && coin.y < CANVAS_H - 10 && coin.x > paddle.x - 4 && coin.x < paddle.x + paddle.w + 4) {
          if (coin.isBomb) {
            // Hit a bomb! Lose points
            score = Math.max(0, score - 3);
            combo = 0;
            spawnCatchParticle(coin.x, coin.y, '#ff4444');
            scoreEl.textContent = `Score: ${score} | Missed: ${missed}`;
          } else {
            combo++;
            const comboBonus = combo >= 5 ? 3 : combo >= 3 ? 2 : 1;
            score += comboBonus;
            if (combo > bestCombo) bestCombo = combo;
            spawnCatchParticle(coin.x, coin.y, combo >= 3 ? '#ff9f43' : '#f7c948');
            scoreEl.textContent = `Score: ${score} | Combo: x${combo}`;
          }
          coins.splice(i, 1);
          continue;
        }

        // Missed (fell off bottom)
        if (coin.y > CANVAS_H + 10) {
          if (!coin.isBomb) {
            missed++;
            combo = 0;
            scoreEl.textContent = `Score: ${score} | Missed: ${missed}`;
          }
          coins.splice(i, 1);
        }
      }

      // Particles
      for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        p.x += p.vx;
        p.y += p.vy;
        p.vy += 0.15;
        p.life--;
        gCtx.globalAlpha = p.life / 30;
        gCtx.fillStyle = p.color;
        gCtx.fillRect(p.x - 1, p.y - 1, 3, 3);
        gCtx.globalAlpha = 1;
        if (p.life <= 0) particles.splice(i, 1);
      }

      // Combo display
      if (combo >= 3) {
        gCtx.fillStyle = combo >= 5 ? '#f7c948' : '#ff9f43';
        gCtx.font = 'bold 14px monospace';
        gCtx.textAlign = 'center';
        gCtx.fillText(`COMBO x${combo}!`, CANVAS_W / 2, CANVAS_H / 2);
        gCtx.textAlign = 'left';
      }

      // Timer & difficulty indicator
      const remaining = Math.max(0, GAME_DURATION - Math.floor(elapsed / 60));
      gCtx.fillStyle = '#fff';
      gCtx.font = '11px monospace';
      gCtx.fillText(`Time: ${remaining}s`, CANVAS_W - 75, 14);

      // Progress bar at top
      const progress = 1 - remaining / GAME_DURATION;
      gCtx.fillStyle = 'rgba(255,255,255,0.1)';
      gCtx.fillRect(0, 0, CANVAS_W, 3);
      const barColor = progress > 0.75 ? '#ff4444' : progress > 0.5 ? '#ff9f43' : '#4d96ff';
      gCtx.fillStyle = barColor;
      gCtx.fillRect(0, 0, CANVAS_W * progress, 3);

      if (remaining <= 0) { endGame(); return; }
      requestAnimationFrame(gameLoop);
    }

    function endGame() {
      gameRunning = false;

      // Game over screen
      gCtx.fillStyle = 'rgba(0,0,0,0.8)';
      gCtx.fillRect(0, 0, CANVAS_W, CANVAS_H);

      gCtx.textAlign = 'center';
      gCtx.fillStyle = '#f7c948';
      gCtx.font = 'bold 20px monospace';
      gCtx.fillText('GAME OVER', CANVAS_W / 2, 70);

      gCtx.fillStyle = '#fff';
      gCtx.font = '14px monospace';
      gCtx.fillText(`Coins: ${score}`, CANVAS_W / 2, 110);
      gCtx.fillText(`Missed: ${missed}`, CANVAS_W / 2, 135);
      gCtx.fillText(`Best Combo: x${bestCombo}`, CANVAS_W / 2, 160);

      // Rating
      let rating = '';
      if (score >= 40) rating = 'LEGENDARY!';
      else if (score >= 25) rating = 'Amazing!';
      else if (score >= 15) rating = 'Great job!';
      else if (score >= 8) rating = 'Not bad!';
      else rating = 'Keep practicing!';

      gCtx.fillStyle = '#f7c948';
      gCtx.font = 'bold 16px monospace';
      gCtx.fillText(rating, CANVAS_W / 2, 195);

      gCtx.fillStyle = 'rgba(255,255,255,0.5)';
      gCtx.font = '10px monospace';
      gCtx.fillText('Click ✕ to close', CANVAS_W / 2, 230);
      gCtx.textAlign = 'left';

      // Rewards: more generous with longer game
      const coinReward = Math.min(Math.floor(score / 3), 15);
      if (coinReward > 0) {
        try {
          BuddyRewards.addCoins(coinReward, 'minigame');
          BuddyRewards.addXP(score * 3);
        } catch (e) {}
      }

      adjustMood('playful', 20);
      adjustMood('happy', 10);

      if (score >= 25) {
        say(`${score} coins caught! ${rating} You earned ${coinReward} BuddyCoins!`);
        spawnConfetti(15);
      } else {
        say(`Game over! ${score} coins. ${rating} You earned ${coinReward} BuddyCoins.`);
      }
    }

    function moveHandler(e) {
      const rect = gameCanvas.getBoundingClientRect();
      const x = (e.touches ? e.touches[0].clientX : e.clientX) - rect.left;
      paddle.x = Math.max(0, Math.min(x - paddle.w / 2, CANVAS_W - paddle.w));
    }

    gameCanvas.addEventListener('mousemove', moveHandler);
    gameCanvas.addEventListener('touchmove', moveHandler, { passive: true });
    closeBtn.addEventListener('click', () => {
      gameRunning = false;
      overlay.remove();
      _minigameActive = false;
    });

    gameLoop();

    // Safety timeout (game duration + 5s buffer)
    setTimeout(() => {
      if (gameRunning) endGame();
      setTimeout(() => {
        if (overlay.parentNode) { overlay.remove(); _minigameActive = false; }
      }, 5000);
    }, (GAME_DURATION + 5) * 1000);
  }

  // ===================== IDLE & WALK =====================
  function startIdleTracking() { resetIdleTimer(); }

  function resetIdleTimer() {
    if (_currentState === 'SLEEPING') setState('IDLE');
    clearTimeout(_idleTimer);
    _idleTimer = setTimeout(() => {
      if (_currentState === 'IDLE') {
        setState('SLEEPING');
        say(PET_STATES.SLEEPING.dialogues[Math.floor(Math.random() * PET_STATES.SLEEPING.dialogues.length)]);
      }
    }, 5 * 60 * 1000);
  }

  function startRandomWalk() {
    setInterval(() => {
      if (_currentState === 'IDLE' && Math.random() < 0.3) {
        // Pick a random direction and walk (sneaking animation)
        const dirs = Object.keys(SPRITE_MANIFEST.sneaking);
        _facing = dirs[Math.floor(Math.random() * dirs.length)];
        _spriteFrame = 0;

        // Temporarily switch to WALKING state
        const prevState = _currentState;
        _currentState = 'WALKING';
        updateEmojiRing();
        say(PET_STATES.WALKING.dialogues[Math.floor(Math.random() * PET_STATES.WALKING.dialogues.length)]);

        // Walk for 5 seconds, then go back to idle facing south
        setTimeout(() => {
          _facing = 'south';
          _currentState = prevState;
          _spriteFrame = 0;
          updateEmojiRing();
        }, 5000);
      }

      // Random bark (excited) occasionally
      if (_currentState === 'IDLE' && Math.random() < 0.15) {
        const dirs = Object.keys(SPRITE_MANIFEST.bark);
        _facing = dirs[Math.floor(Math.random() * dirs.length)];
        _spriteFrame = 0;
        // Quick bark then back
        const tmpAnim = PET_STATES.IDLE.animation;
        PET_STATES.IDLE.animation = 'bark';
        say("Woof! 🐾");
        setTimeout(() => {
          PET_STATES.IDLE.animation = tmpAnim;
          _facing = 'south';
          _spriteFrame = 0;
        }, 2500);
      }
    }, 45000); // Every 45 seconds (more frequent for liveliness)
  }

  // ===================== STATE MANAGEMENT =====================
  function setState(newState) {
    if (newState === _currentState) return;
    const prevState = _currentState;
    _previousStates.push(prevState);
    if (_previousStates.length > 5) _previousStates.shift();
    _currentState = newState;
    _spriteFrame = 0;
    _particleContainer.innerHTML = '';
    updateEmojiRing();
    updateAccessory();

    try { BuddyAnalytics.track('context_detected', { category: newState, previous: prevState }); } catch (e) {}
    try { BuddyStorage.addToContextHistory(newState); } catch (e) {}

    if (PET_STATES[newState]?.memes) setTimeout(() => showRandomMeme(), 2000);

    // Gentle emoji on state change (reduced from burst)
    setTimeout(() => spawnStateParticle(), 400);

    // Smart greeting: use site-specific greeting if available, else use state dialogue
    // Skip if page summary is pending — it will handle the first message
    setTimeout(() => {
      if (_summaryPending) return;

      // Check for site-specific greeting first (only on fresh state changes)
      const hostname = window.location.hostname.replace(/^www\./, '');
      const siteGreeting = SITE_GREETINGS[hostname];

      if (siteGreeting && prevState === 'IDLE') {
        // First time arriving at a recognized site
        say(siteGreeting);
      } else if (_previousStates.length > 1 && Math.random() < 0.15) {
        const prev = _previousStates[_previousStates.length - 2];
        if (prev === 'NAUGHTY_REACTION' || prev === 'SHY_COVERING_EYES') {
          say("Okay, back to normal. That was... something.");
          return;
        }
      } else {
        sayRandom();
      }
    }, 800);
  }

  function getState() { return _currentState; }

  // ===================== AFFILIATE BADGE =====================
  function showAffiliateBadge(text) { _affiliateBadge.textContent = text; _affiliateBadge.classList.add('bb-visible'); }
  function hideAffiliateBadge() { _affiliateBadge.classList.remove('bb-visible'); }
  function onAffiliateBadgeClick(handler) { _affiliateBadge.addEventListener('click', handler); }

  // ===================== TOAST =====================
  function showToast(message, duration = 3000) {
    let toast = document.querySelector('.bb-toast');
    if (!toast) { toast = document.createElement('div'); toast.className = 'bb-toast'; document.body.appendChild(toast); }
    toast.textContent = message;
    toast.classList.add('bb-visible');
    setTimeout(() => toast.classList.remove('bb-visible'), duration);
  }

  // ===================== KONAMI CODE =====================
  function setupKonamiCode() {
    const code = ['ArrowUp','ArrowUp','ArrowDown','ArrowDown','ArrowLeft','ArrowRight','ArrowLeft','ArrowRight','KeyB','KeyA'];
    let progress = 0;
    document.addEventListener('keydown', (e) => {
      if (e.code === code[progress]) { progress++; if (progress === code.length) { progress = 0; activateDragonMode(); } }
      else progress = 0;
    });
  }

  function activateDragonMode() {
    say("DRAGON MODE ACTIVATED!! RAWR!!");
    _canvas.style.filter = 'hue-rotate(180deg) saturate(2)';
    spawnConfetti(20);
    showToast("Dragon Mode! 60 seconds!");
    setTimeout(() => { _canvas.style.filter = ''; say("Back to normal... that was fun!"); }, 60000);
  }

  // ===================== YOUTUBE CONTEXT SYSTEM =====================
  let _ytContext = { title: '', category: '', lastTitle: '', commentTimer: null };

  // Video category keyword map
  const YT_CATEGORIES = {
    music: {
      keywords: ['official video', 'music video', 'lyrics', 'song', 'album', 'remix', 'live performance', 'concert', 'acoustic', 'cover', 'ft.', 'feat.', 'audio', 'mv', 'karaoke'],
      comments: [
        (t) => `"${_shortTitle(t)}" — nice pick! I'm vibing with this.`,
        () => "Great music taste! This is a solid track.",
        () => "I'd add this to my playlist if I had one!",
        () => "This beat is infectious. I can feel it in my pixels!",
        () => "Good song choice! You always pick the best ones.",
        (t) => `Listening to "${_shortTitle(t)}"? You have such good taste.`,
        () => "Music really does make browsing better, doesn't it?",
        () => "I could listen to this on repeat honestly."
      ]
    },
    gaming: {
      keywords: ['gameplay', 'walkthrough', 'playthrough', 'let\'s play', 'gaming', 'speedrun', 'minecraft', 'fortnite', 'gta', 'valorant', 'elden ring', 'zelda', 'boss fight', 'pvp', 'ranked', 'esports', 'stream highlights'],
      comments: [
        (t) => `Watching some "${_shortTitle(t)}"? This looks fun!`,
        () => "That was a really good play! Did you see that?",
        () => "I wish I could play too. Paws aren't great for controllers though.",
        () => "The graphics in this game look amazing!",
        () => "Gaming content is the best to chill with.",
        () => "I'm learning strategies just by watching this!",
        () => "This player is really skilled. Are you taking notes?",
        () => "One more video and then maybe we play something?"
      ]
    },
    cooking: {
      keywords: ['recipe', 'cooking', 'baking', 'chef', 'kitchen', 'how to cook', 'food', 'meal prep', 'mukbang', 'eating', 'taste test', 'restaurant', 'street food', 'gordon ramsay', 'masterchef'],
      comments: [
        (t) => `"${_shortTitle(t)}" — now I'm hungry just watching!`,
        () => "That looks absolutely delicious. Save some for me!",
        () => "I can almost smell it through the screen!",
        () => "You should try making this! I believe in you.",
        () => "Food content always makes me wish I could eat real food.",
        () => "This is making me drool... do pixels drool?",
        () => "Great recipe! I'm mentally bookmarking this for you.",
        () => "The way they plate that is so satisfying!"
      ]
    },
    tech: {
      keywords: ['review', 'unboxing', 'tech', 'iphone', 'android', 'laptop', 'setup', 'build', 'pc build', 'gadget', 'mkbhd', 'linus', 'benchmark', 'specs', 'comparison', 'vs', 'best of'],
      comments: [
        (t) => `"${_shortTitle(t)}" — interesting! Learning something new.`,
        () => "Ooh, tech content! I love seeing new gadgets.",
        () => "That's a cool setup! Wish I had one.",
        () => "The specs on that look impressive!",
        () => "Are you thinking of getting one? I'd say go for it!",
        () => "Tech reviews help a lot with decisions. Smart research!",
        () => "That design is really sleek!",
        () => "I wonder how that compares to what you have now."
      ]
    },
    tutorial: {
      keywords: ['tutorial', 'how to', 'learn', 'course', 'beginner', 'guide', 'explained', 'tips', 'tricks', 'for beginners', 'step by step', 'introduction to', 'crash course', 'masterclass'],
      comments: [
        (t) => `Learning about "${_shortTitle(t)}"? That's awesome!`,
        () => "I love that you're learning new things!",
        () => "Take notes if you need to — I'll wait.",
        () => "This tutorial seems really well made.",
        () => "You're investing in yourself. That's always worth it!",
        () => "Pause it anytime if you need to practice along!",
        () => "Knowledge is the best investment. Keep going!",
        () => "Want me to stay quiet so you can focus? Just click me."
      ]
    },
    comedy: {
      keywords: ['funny', 'comedy', 'meme', 'try not to laugh', 'prank', 'fail', 'bloopers', 'stand up', 'sketch', 'parody', 'roast', 'compilation', 'hilarious'],
      comments: [
        (t) => `"${_shortTitle(t)}" — this should be fun!`,
        () => "Haha! That was actually really funny!",
        () => "I may be a pixel dog but even I found that hilarious!",
        () => "Laughter is the best medicine. Good choice!",
        () => "Your sense of humor is great!",
        () => "I love comedy videos. They make everything better!",
        () => "Send this to someone, they'd love it too!",
        () => "I'm trying not to bark-laugh right now!"
      ]
    },
    podcast: {
      keywords: ['podcast', 'interview', 'conversation', 'talk show', 'discussion', 'joe rogan', 'lex fridman', 'ted talk', 'tedx', 'debate', 'panel', 'q&a', 'fireside chat'],
      comments: [
        (t) => `"${_shortTitle(t)}" — sounds like a great conversation.`,
        () => "Podcasts are perfect for chilling. Good call!",
        () => "This is really insightful. I'm learning a lot!",
        () => "Interesting perspective they have there.",
        () => "Long-form content really lets you dive deep.",
        () => "I enjoy listening along with you!",
        () => "This host asks really good questions.",
        () => "Want to listen at 1.5x? Just kidding, take your time!"
      ]
    },
    sports: {
      keywords: ['highlights', 'match', 'goal', 'score', 'cricket', 'football', 'nba', 'ipl', 'world cup', 'premier league', 'final', 'wicket', 'slam dunk', 'championship', 'best moments'],
      comments: [
        (t) => `"${_shortTitle(t)}" — let's watch this together!`,
        () => "What a play! Did you catch that?!",
        () => "Sports highlights are so satisfying to watch!",
        () => "The athleticism here is incredible!",
        () => "I'm getting excited just watching!",
        () => "This is why sports are the best entertainment.",
        () => "Reliving the best moments — I love it!",
        () => "That was amazing! Can we watch that part again?"
      ]
    },
    vlog: {
      keywords: ['vlog', 'day in', 'my life', 'daily', 'routine', 'morning routine', 'travel', 'trip', 'vacation', 'adventure', 'moving to', 'house tour', 'room tour', 'haul', 'grwm', 'get ready'],
      comments: [
        (t) => `"${_shortTitle(t)}" — this looks like a cool vlog!`,
        () => "I love seeing how other people spend their days!",
        () => "This place looks beautiful! Wish I could visit.",
        () => "Living vicariously through vlogs is the best.",
        () => "Their energy is really nice. Good content!",
        () => "Travel content always inspires me.",
        () => "What a lifestyle! This is really interesting.",
        () => "I'd vlog too but nobody wants to watch a pixel dog sleep."
      ]
    },
    news: {
      keywords: ['breaking', 'news', 'update', 'report', 'crisis', 'election', 'politics', 'world news', 'latest', 'analysis'],
      comments: [
        (t) => `"${_shortTitle(t)}" — staying informed. That's responsible!`,
        () => "Important stuff. Take it in at your own pace.",
        () => "The world has a lot going on right now.",
        () => "It's good to stay updated, but don't forget self-care too.",
        () => "Interesting developments. What do you think about this?",
        () => "I appreciate that you keep up with what's happening."
      ]
    }
  };

  // Helper: shorten title for display in speech bubble
  function _shortTitle(title) {
    if (!title) return 'this';
    // Remove common YouTube suffixes
    let clean = title
      .replace(/\s*[-|]\s*(YouTube|Official.*|Full.*|HD|4K|Lyrics).*$/i, '')
      .replace(/\s*\(.*?(official|lyric|audio|video|hd|4k).*?\)\s*/gi, '')
      .trim();
    if (clean.length > 40) clean = clean.substring(0, 37) + '...';
    return clean;
  }

  // Detect video category from title
  function _detectYTCategory(title) {
    if (!title) return null;
    const lower = title.toLowerCase();
    let bestCat = null;
    let bestScore = 0;

    for (const [category, config] of Object.entries(YT_CATEGORIES)) {
      let score = 0;
      for (const kw of config.keywords) {
        if (lower.includes(kw)) score++;
      }
      if (score > bestScore) {
        bestScore = score;
        bestCat = category;
      }
    }
    return bestScore > 0 ? bestCat : null;
  }

  // Generate a contextual YouTube comment
  function _generateYTComment() {
    const cat = _ytContext.category;
    if (!cat || !YT_CATEGORIES[cat]) return null;

    const comments = YT_CATEGORIES[cat].comments;
    const comment = comments[Math.floor(Math.random() * comments.length)];
    // Comments can be functions (for title interpolation) or strings
    return typeof comment === 'function' ? comment(_ytContext.title) : comment;
  }

  // Called from content.js when YouTube video is detected
  function setYouTubeContext(videoTitle) {
    if (!videoTitle || videoTitle === _ytContext.lastTitle) return;

    _ytContext.lastTitle = videoTitle;
    _ytContext.title = videoTitle;
    _ytContext.category = _detectYTCategory(videoTitle);

    console.log('[BrowseBuddy] YouTube context:', _ytContext.category, '—', _shortTitle(videoTitle));

    // Initial comment about the video (after a short natural delay)
    if (_ytContext.category) {
      setTimeout(() => {
        const comment = _generateYTComment();
        if (comment) say(comment);
      }, 3000);
    }

    // Set up periodic contextual comments (every 90-150 seconds)
    clearInterval(_ytContext.commentTimer);
    _ytContext.commentTimer = setInterval(() => {
      // Only comment if still on a video page and not sleeping
      if (_currentState !== 'WATCHING_MODE' && _currentState !== 'VIBING') return;
      if (Math.random() < 0.5) return; // 50% chance to stay silent — don't be annoying

      const comment = _generateYTComment();
      if (comment) say(comment);
    }, 120000); // Every 2 minutes
  }

  function clearYouTubeContext() {
    _ytContext = { title: '', category: '', lastTitle: '', commentTimer: null };
    clearInterval(_ytContext.commentTimer);
  }

  // ===================== VISIBILITY =====================
  function show() { if (_container) _container.style.display = ''; }
  function hide() { if (_container) _container.style.display = 'none'; }
  function destroy() { stopAnimation(); clearInterval(_ytContext.commentTimer); if (_container) _container.remove(); _initialized = false; }

  return {
    init, setState, getState, say, sayPriority, sayRandom,
    setSummaryPending,
    showMeme, showRandomMeme, showAffiliateBadge, hideAffiliateBadge,
    onAffiliateBadgeClick, showToast, spawnConfetti, spawnHeart,
    show, hide, destroy, PET_STATES,
    setYouTubeContext, clearYouTubeContext,
    registerMenuAction, adjustMood, getMood,
    getContainer: () => _container,
    getCanvas: () => _canvas,
    suppressClick: () => { _clickSuppressed = true; },
    unsuppressClick: () => { _clickSuppressed = false; }
  };
})();
