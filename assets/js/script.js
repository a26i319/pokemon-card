/**
 * UNNECESSARY PROJECT v1.1
 * script.js — Phase 6: Loading screen + Reveal sequence
 *
 * Architecture:
 *   State    — body[data-state] drives all CSS visibility
 *   Loader   — steps log items, lerps progress bar
 *   Reveal   — flash → card entrance → idle float
 *
 * Phase 7 will add:
 *   CardTilt     — holographic mouse tracking
 *   Particles    — ambient background dots/petals
 *   Sparkles     — gold star bursts
 */

'use strict';

/* ─────────────────────────────────────────────────────────
   CONFIG — all timing in one place
───────────────────────────────────────────────────────── */
const CONFIG = {
  loader: {
    stepInterval:  320,   // ms between each log line appearing
    holdAfterDone: 320,   // ms to hold at 100% before revealing
    progressLerp:  0.09,  // smoothing factor (lower = smoother)
  },
  reveal: {
    loaderFade:    700,   // ms for loader to fade out
    cardDelay:     400,   // ms after state=idle before card entrance starts
    entranceDur:   1100,  // must match CSS animation duration
    flashDur:      180,   // ms for the white flash to peak
    flashFade:     650,   // ms for flash to fade out
  },
};


/* ─────────────────────────────────────────────────────────
   STATE — single source of truth
───────────────────────────────────────────────────────── */
const State = {
  _current: 'loading',

  set(next) {
    this._current = next;
    document.body.setAttribute('data-state', next);
  },

  get() {
    return this._current;
  },
};


/* ─────────────────────────────────────────────────────────
   LOADER
───────────────────────────────────────────────────────── */
const Loader = (() => {
  const logItems   = document.querySelectorAll('.loader-log');
  const barFill    = document.querySelector('.loader-bar-fill');
  const barEl      = document.querySelector('.loader-bar');
  const pctEl      = document.querySelector('.loader-pct');

  let target  = 0;
  let current = 0;
  let rafId   = null;

  /* Lerp the progress bar smoothly toward target */
  function tickProgress() {
    current += (target - current) * CONFIG.loader.progressLerp;

    const display = Math.min(100, Math.round(current));
    barFill.style.width = `${current}%`;
    barEl.setAttribute('aria-valuenow', display);
    pctEl.textContent  = `${display}%`;

    if (Math.abs(target - current) > 0.15) {
      rafId = requestAnimationFrame(tickProgress);
    } else {
      /* Snap to exact target when close enough */
      current = target;
      barFill.style.width = `${target}%`;
      pctEl.textContent   = `${target}%`;
    }
  }

  function setProgress(value) {
    target = Math.max(0, Math.min(100, value));
    cancelAnimationFrame(rafId);
    rafId = requestAnimationFrame(tickProgress);
  }

  /* Reveal log items one by one, driving progress as we go */
  function runSteps(onComplete) {
    const total    = logItems.length;
    const perStep  = 92 / total;  /* reserve last 8% for snap-to-100 */

    logItems.forEach((item, i) => {
      setTimeout(() => {

        /* Mark previous item done */
        if (i > 0) {
          logItems[i - 1].classList.remove('is-active');
          logItems[i - 1].classList.add('is-done');
        }

        /* Activate current item */
        item.classList.add('is-active');
        setProgress(Math.round((i + 1) * perStep));

        /* Last item — snap to 100, then call back */
        if (i === total - 1) {
          setTimeout(() => {
            item.classList.remove('is-active');
            item.classList.add('is-done');
            setProgress(100);

            setTimeout(onComplete, CONFIG.loader.holdAfterDone);
          }, CONFIG.loader.stepInterval);
        }

      }, i * CONFIG.loader.stepInterval);
    });
  }

  function start(onComplete) {
    setProgress(4);   /* tiny initial nudge so bar isn't dead */
    runSteps(onComplete);
  }

  return { start };
})();


/* ─────────────────────────────────────────────────────────
   REVEAL
───────────────────────────────────────────────────────── */
const Reveal = (() => {
  const card = document.getElementById('card');

  /* 1 — Loader fades → scene fades in */
  function begin() {
    State.set('revealing');

    setTimeout(() => {
      State.set('idle');
      flashScene();

      /* 2 — Card entrance starts after scene is visible */
      setTimeout(entranceCard, CONFIG.reveal.cardDelay);

    }, CONFIG.reveal.loaderFade);
  }

  /* Soft full-screen flash — the "pack opening" moment */
  function flashScene() {
    const flash = document.createElement('div');
    Object.assign(flash.style, {
      position:   'fixed',
      inset:      '0',
      zIndex:     '90',
      pointerEvents: 'none',
      opacity:    '0',
      background: 'radial-gradient(ellipse 55% 55% at 50% 50%, hsla(330, 60%, 96%, 0.75), transparent 80%)',
      transition: `opacity ${CONFIG.reveal.flashDur}ms ease`,
    });
    document.body.appendChild(flash);

    /* Peak */
    requestAnimationFrame(() => {
      flash.style.opacity = '1';

      /* Fade out */
      setTimeout(() => {
        flash.style.opacity    = '0';
        flash.style.transition = `opacity ${CONFIG.reveal.flashFade}ms ease`;
        setTimeout(() => flash.remove(), CONFIG.reveal.flashFade + 50);
      }, CONFIG.reveal.flashDur);
    });
  }

  /* Card scales into view */
  function entranceCard() {
    card.classList.add('is-revealed');

    /* After entrance animation finishes → hand off to idle */
    setTimeout(() => {
      card.classList.remove('is-revealed');
      card.classList.add('is-idle');
    }, CONFIG.reveal.entranceDur);
  }

  return { begin };
})();


/* ─────────────────────────────────────────────────────────
   INIT
───────────────────────────────────────────────────────── */
function init() {
  Loader.start(() => {
    Reveal.begin();
  });
}

/* Start when DOM is ready */
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}