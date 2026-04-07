/**
 * BrowseBuddy Feature — Screenshot Buddy
 * Pet poses and captures a screenshot of the current page
 */
(() => {
  function takeScreenshot() {
    BrowseBuddy.say("Say cheese! 📸");

    // Camera flash effect
    const flash = document.createElement('div');
    flash.className = 'bb-screenshot-flash';
    document.body.appendChild(flash);

    const canvas = BrowseBuddy.getCanvas();
    if (canvas) {
      canvas.style.transition = 'transform 0.3s ease';
      canvas.style.transform = 'scale(1.2)';
      setTimeout(() => { canvas.style.transform = ''; }, 500);
    }

    setTimeout(() => {
      flash.remove();

      // Request screenshot from background service worker
      try {
        chrome.runtime.sendMessage({ type: 'CAPTURE_SCREENSHOT' }, (response) => {
          if (chrome.runtime.lastError) {
            BrowseBuddy.say("Oops! Couldn't take the screenshot. Try again?");
            return;
          }

          if (response?.dataUrl) {
            // Create download link
            const link = document.createElement('a');
            const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
            link.download = `browsebuddy-screenshot-${timestamp}.png`;
            link.href = response.dataUrl;
            link.click();

            BrowseBuddy.say("Screenshot saved! Looking good! 📸");
            BrowseBuddy.spawnHeart();
            try { BuddyRewards.addXP(5); } catch (e) {}
          } else {
            BrowseBuddy.say("Hmm, something went wrong with the camera. Try again?");
          }
        });
      } catch (e) {
        BrowseBuddy.say("I couldn't access the camera. Maybe try reloading?");
      }
    }, 400);
  }

  BrowseBuddy.registerMenuAction('screenshot', '📸', 'Screenshot', takeScreenshot);
})();
