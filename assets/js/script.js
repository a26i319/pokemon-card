'use strict';

/* ═══════════════════════════════════════════════════════════
   UNNECESSARY PROJECT v1.0  ·  script.js
   Phase 7 — Loading → reveal → ambient scene → holo tilt → sparkles
   Phase 9 — Sakura petal rain (canvas) + background music
   ═══════════════════════════════════════════════════════════ */

(() => {

  /* ── Utilities ──────────────────────────────────────────── */
  const $ = (sel, root = document) => root.querySelector(sel);
  const rand = (min, max) => Math.random() * (max - min) + min;
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;


  /* ── Element refs ───────────────────────────────────────── */
  const loadingScreen   = $('#loading-screen');
  const loadingLog      = $('#loading-log');
  const progressFill    = $('#loading-progress-fill');
  const progressPct     = $('#loading-progress-pct');
  const sceneParticles  = $('#scene-particles');
  const sceneSparkles   = $('#scene-sparkles');
  const revealFlash     = $('#reveal-flash');
  const card            = $('#card');
  const cardShine       = $('#card-shine');
  const portraitFrame   = $('#portrait-frame');
  const portraitSparkles = $('#portrait-sparkles');
  const petalCanvas     = $('#petal-canvas');
  const bgMusic         = $('#bg-music');
  const soundToggle     = $('#sound-toggle');


  /* ─────────────────────────────────────────────────────────
     § A  LOADING SEQUENCE
  ───────────────────────────────────────────────────────── */
  const LOG_STEPS = [
    'Initializing UI',
    'Loading Sakura Theme',
    'Generating Sparkles',
    'Applying Holographic Foil',
    'Summoning Sakura Petals',
    'Detecting Special Person',
    'Preparing Reveal Sequence',
  ];

  function buildLogLines() {
    LOG_STEPS.forEach(label => {
      const li = document.createElement('li');
      li.className = 'log-line';
      li.innerHTML = `<span class="log-check">○</span><span>${label}</span>`;
      loadingLog.appendChild(li);
    });
    return [...loadingLog.querySelectorAll('.log-line')];
  }

  function runLoadingSequence(onComplete) {
    const lines = buildLogLines();
    const duration = prefersReducedMotion ? 500 : rand(2400, 3400);
    const start = performance.now();
    let nextStep = 0;

    function tick(now) {
      const ratio = Math.min((now - start) / duration, 1);
      const pct   = Math.round(ratio * 100);
      progressFill.style.width  = `${pct}%`;
      progressPct.textContent   = `${pct}%`;

      if (nextStep < lines.length && ratio >= (nextStep + 1) / LOG_STEPS.length) {
        lines[nextStep].classList.add('is-done');
        lines[nextStep].querySelector('.log-check').textContent = '✓';
        nextStep++;
      }

      if (ratio < 1) {
        requestAnimationFrame(tick);
      } else {
        setTimeout(() => {
          loadingScreen.classList.add('is-hidden');
          setTimeout(onComplete, prefersReducedMotion ? 50 : 650);
        }, prefersReducedMotion ? 50 : 380);
      }
    }

    requestAnimationFrame(tick);
  }


  /* ─────────────────────────────────────────────────────────
     § B  SPARKLE SPAWNER
  ───────────────────────────────────────────────────────── */
  function spawnSparkle(container, { x, y, size = 10, duration = 1.6, delay = 0 } = {}) {
    const el = document.createElement('span');
    el.className = 'sparkle';
    el.style.cssText = `left:${x}px;top:${y}px;width:${size}px;height:${size}px;--sparkle-dur:${duration}s;animation-delay:${delay}s`;
    container.appendChild(el);
    requestAnimationFrame(() => el.classList.add('is-twinkling'));
    el.addEventListener('animationend', () => el.remove(), { once: true });
  }

  function spawnSparkleBurst(container, count, bounds) {
    if (prefersReducedMotion) return;
    for (let i = 0; i < count; i++) {
      spawnSparkle(container, {
        x: rand(bounds.minX, bounds.maxX),
        y: rand(bounds.minY, bounds.maxY),
        size: rand(6, 14),
        duration: rand(1.1, 1.9),
        delay: rand(0, 0.5),
      });
    }
  }


  /* ─────────────────────────────────────────────────────────
     § C  AMBIENT PARTICLES (CSS div dots)
  ───────────────────────────────────────────────────────── */
  function initAmbientParticles() {
    if (prefersReducedMotion || !sceneParticles) return;
    const count = window.innerWidth < 640 ? 10 : 18;
    for (let i = 0; i < count; i++) {
      const el = document.createElement('span');
      el.className = 'particle';
      el.style.cssText = [
        `left:${rand(0,100)}%`,
        `--particle-size:${rand(3,7)}px`,
        `--particle-dur:${rand(11,20)}s`,
        `--particle-delay:${rand(0,16)}s`,
        `--particle-drift:${rand(-40,40)}px`,
      ].join(';');
      sceneParticles.appendChild(el);
    }
  }


  /* ─────────────────────────────────────────────────────────
     § D  PHASE 9 — SAKURA PETAL RAIN (canvas)
     Each petal is a soft ellipse that sways as it falls,
     drawn with canvas 2D — zero DOM overhead, ~55 petals max.
  ───────────────────────────────────────────────────────── */

  /* Petal colours sampled from the sakura design tokens */
  const PETAL_COLORS = [
    [345, 80, 88],   /* #F9C5D5 — true sakura  */
    [335, 70, 92],   /* #FFE0EC — light sakura  */
    [350, 65, 85],   /* warm rose               */
    [330, 50, 94],   /* palest blush            */
    [320, 60, 88],   /* soft lavender-rose      */
    [355, 75, 82],   /* deep rose tint          */
  ];

  class Petal {
    constructor(W, H, scattered = false) {
      this.reset(W, H, scattered);
    }

    reset(W, H, scattered = false) {
      this.x         = rand(0, W);
      this.y         = scattered ? rand(-H, H * 0.3) : rand(-60, -10);
      this.size      = rand(4.5, 10.5);
      this.speedY    = rand(0.55, 1.65);
      this.speedX    = rand(-0.35, 0.35);
      this.angle     = rand(0, Math.PI * 2);
      this.spin      = rand(-0.018, 0.018);
      this.swayPhase = rand(0, Math.PI * 2);
      this.swaySpeed = rand(0.007, 0.019);
      this.swayAmp   = rand(0.25, 1.15);
      this.opacity   = rand(0.30, 0.72);
      const [h, s, l] = PETAL_COLORS[Math.floor(rand(0, PETAL_COLORS.length))];
      this.color     = `hsla(${h},${s}%,${l}%,${this.opacity})`;
    }

    update(W, H) {
      this.swayPhase += this.swaySpeed;
      this.x         += this.speedX + Math.sin(this.swayPhase) * this.swayAmp;
      this.y         += this.speedY;
      this.angle     += this.spin;
      if (this.y > H + 20) this.reset(W, H);
    }

    draw(ctx) {
      ctx.save();
      ctx.translate(this.x, this.y);
      ctx.rotate(this.angle);
      ctx.globalAlpha = this.opacity;
      ctx.fillStyle   = this.color;
      ctx.beginPath();
      /* A simple ellipse: wider than tall, flutters nicely when rotated */
      ctx.ellipse(0, 0, this.size * 0.55, this.size, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
  }

  function initSakuraPetals() {
    if (prefersReducedMotion || !petalCanvas) return;

    const ctx = petalCanvas.getContext('2d');
    let W, H, petals, rafId;

    function resize() {
      W = petalCanvas.width  = window.innerWidth;
      H = petalCanvas.height = window.innerHeight;
      /* Re-scatter existing petals so they aren't all at the top after resize */
      if (petals) petals.forEach(p => p.reset(W, H, true));
    }

    function buildPetals() {
      const count = window.innerWidth < 640 ? 28 : 52;
      petals = Array.from({ length: count }, () => new Petal(W, H, true));
    }

    function loop() {
      ctx.clearRect(0, 0, W, H);
      petals.forEach(p => { p.update(W, H); p.draw(ctx); });
      rafId = requestAnimationFrame(loop);
    }

    resize();
    buildPetals();
    loop();

    /* Pause petals when the tab is hidden to save battery */
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        cancelAnimationFrame(rafId);
      } else {
        rafId = requestAnimationFrame(loop);
      }
    });

    /* Debounced resize */
    let resizeTimer;
    window.addEventListener('resize', () => {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(resize, 150);
    });
  }


  /* ─────────────────────────────────────────────────────────
     § E  PHASE 9 — BACKGROUND MUSIC
     Browsers block autoplaying audio with volume > 0, so we:
       1. Start playing immediately — muted (always allowed).
       2. On the very first user gesture anywhere on the page,
          unmute and fade the volume up smoothly.
       3. A toggle button lets them mute/unmute at will.
  ───────────────────────────────────────────────────────── */
  function initBackgroundMusic() {
    if (!bgMusic) return;

    const TARGET_VOL = 0.38;
    let isUnlocked  = false;

    /* Start muted — no browser permission needed */
    bgMusic.volume = 0;
    bgMusic.muted  = true;
    bgMusic.play().catch(() => { /* file might be missing — handled by error event */ });

    /* Hide toggle if the file doesn't exist */
    bgMusic.addEventListener('error', () => {
      if (soundToggle) soundToggle.style.display = 'none';
    }, { once: true });

    /* Smooth volume ramp */
    function fadeVolume(target, ms) {
      const from  = bgMusic.volume;
      const start = performance.now();
      function step(now) {
        const t = Math.min((now - start) / ms, 1);
        /* ease-out quad */
        bgMusic.volume = from + (target - from) * (1 - (1 - t) * (1 - t));
        if (t < 1) requestAnimationFrame(step);
      }
      requestAnimationFrame(step);
    }

    function setToggleUI(muted) {
      if (!soundToggle) return;
      soundToggle.classList.toggle('is-muted', muted);
      soundToggle.setAttribute('aria-pressed', String(muted));
      soundToggle.setAttribute(
        'aria-label',
        muted ? 'Unmute background music' : 'Mute background music'
      );
    }

    function enableSound() {
      isUnlocked    = true;
      bgMusic.muted = false;
      if (bgMusic.paused) bgMusic.play().catch(() => {});
      fadeVolume(TARGET_VOL, 1200);
      setToggleUI(false);
    }

    function disableSound() {
      fadeVolume(0, 400);
      setTimeout(() => { bgMusic.muted = true; }, 450);
      setToggleUI(true);
    }

    /* Unlock on first gesture — but let the toggle's own click handler
       own the action when the toggle itself is the first thing tapped */
    function unlockOnFirstGesture(e) {
      if (isUnlocked) return;
      if (soundToggle && soundToggle.contains(e.target)) return;
      enableSound();
    }

    document.addEventListener('pointerdown', unlockOnFirstGesture);
    document.addEventListener('keydown',     unlockOnFirstGesture);

    if (soundToggle) {
      soundToggle.addEventListener('click', () => {
        if (bgMusic.muted || !isUnlocked) {
          enableSound();
        } else {
          disableSound();
        }
      });
    }
  }


  /* ─────────────────────────────────────────────────────────
     § F  REVEAL SEQUENCE
  ───────────────────────────────────────────────────────── */
  function revealCard() {
    /* Flash */
    if (!prefersReducedMotion) revealFlash.classList.add('is-flashing');

    /* Sparkle burst around card */
    const cardRect  = card.getBoundingClientRect();
    const sceneRect = card.closest('#scene').getBoundingClientRect();
    spawnSparkleBurst(sceneSparkles, prefersReducedMotion ? 0 : 14, {
      minX: cardRect.left - sceneRect.left - 20,
      maxX: cardRect.right  - sceneRect.left + 20,
      minY: cardRect.top    - sceneRect.top  - 20,
      maxY: cardRect.bottom - sceneRect.top  + 20,
    });

    /* Card entrance */
    card.classList.remove('card--hidden');
    card.classList.add('card--visible');

    function afterReveal() {
      card.classList.replace('card--visible', 'card--settled');
      /* Shine sweep once, then idle ambient repeat */
      cardShine.classList.add('is-sweeping');
      cardShine.addEventListener('animationend', () => {
        cardShine.classList.remove('is-sweeping');
        cardShine.classList.add('is-idle');
      }, { once: true });

      initCardTilt();
      initPortraitSparkles();
    }

    if (prefersReducedMotion) {
      afterReveal();
    } else {
      card.addEventListener('animationend', afterReveal, { once: true });
    }
  }


  /* ─────────────────────────────────────────────────────────
     § G  POINTER-TRACKED HOLOGRAPHIC TILT
  ───────────────────────────────────────────────────────── */
  function initCardTilt() {
    if (prefersReducedMotion || !window.matchMedia('(hover: hover)').matches) return;
    const foil   = $('.card-foil', card);
    const MAX_T  = 7; /* degrees */

    card.addEventListener('mousemove', e => {
      const r  = card.getBoundingClientRect();
      const px = (e.clientX - r.left)  / r.width;
      const py = (e.clientY - r.top)   / r.height;
      card.style.setProperty('--rx', `${(px - 0.5) * MAX_T * 2}deg`);
      card.style.setProperty('--ry', `${(0.5 - py) * MAX_T * 2}deg`);
      card.classList.add('is-tracking');
      if (foil) foil.style.backgroundPosition = `${px * 100}% ${py * 100}%`;
    });

    card.addEventListener('mouseleave', () => {
      card.style.setProperty('--rx', '0deg');
      card.style.setProperty('--ry', '0deg');
      card.classList.remove('is-tracking');
      if (foil) foil.style.backgroundPosition = '';
    });
  }


  /* ─────────────────────────────────────────────────────────
     § H  PORTRAIT HOVER — sparkle reaction
  ───────────────────────────────────────────────────────── */
  function initPortraitSparkles() {
    if (prefersReducedMotion || !portraitFrame) return;
    let burstTimer = null;

    function burst() {
      const r = portraitFrame.getBoundingClientRect();
      spawnSparkle(portraitSparkles, {
        x: rand(r.width * 0.15, r.width * 0.85),
        y: rand(r.height * 0.15, r.height * 0.85),
        size: rand(7, 13),
        duration: rand(1, 1.5),
      });
    }

    portraitFrame.addEventListener('mouseenter', () => {
      for (let i = 0; i < 4; i++) setTimeout(burst, i * 90);
      burstTimer = setInterval(burst, 750);
    });
    portraitFrame.addEventListener('mouseleave', () => clearInterval(burstTimer));
  }


  /* ── Boot ───────────────────────────────────────────────── */
  document.addEventListener('DOMContentLoaded', () => {
    initAmbientParticles();
    initSakuraPetals();
    initBackgroundMusic();
    runLoadingSequence(revealCard);
  });

})();