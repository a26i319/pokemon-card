'use strict';

/* ═══════════════════════════════════════════════════════════
   UNNECESSARY PROJECT v1.0  ·  script.js
   Phase 7 — Loading sequence → reveal animation → ambient scene
              → holographic tilt → sparkle micro-interactions
   ═══════════════════════════════════════════════════════════ */

(() => {

  /* ── Utilities ──────────────────────────────────────────── */
  const $ = (sel, root = document) => root.querySelector(sel);
  const rand = (min, max) => Math.random() * (max - min) + min;
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ── Element refs ───────────────────────────────────────── */
  const loadingScreen = $('#loading-screen');
  const loadingLog = $('#loading-log');
  const progressFill = $('#loading-progress-fill');
  const progressPct = $('#loading-progress-pct');
  const sceneParticles = $('#scene-particles');
  const sceneSparkles = $('#scene-sparkles');
  const revealFlash = $('#reveal-flash');
  const card = $('#card');
  const cardShine = $('#card-shine');
  const portraitFrame = $('#portrait-frame');
  const portraitSparkles = $('#portrait-sparkles');

  const LOG_STEPS = [
    'Initializing UI',
    'Loading Sakura Theme',
    'Generating Sparkles',
    'Applying Holographic Foil',
    'Creating Secret Rare Card',
    'Detecting Special Person',
    'Preparing Reveal Sequence',
  ];


  /* ─────────────────────────────────────────────────────────
     SPARKLES — generic one-shot twinkle spawner
  ───────────────────────────────────────────────────────── */
  function spawnSparkle(container, { x, y, size = 10, duration = 1.6, delay = 0 } = {}) {
    const el = document.createElement('span');
    el.className = 'sparkle';
    el.style.left = `${x}px`;
    el.style.top = `${y}px`;
    el.style.width = el.style.height = `${size}px`;
    el.style.setProperty('--sparkle-dur', `${duration}s`);
    el.style.animationDelay = `${delay}s`;
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
     AMBIENT BACKGROUND PARTICLES — created once, loop forever
  ───────────────────────────────────────────────────────── */
  function initAmbientParticles() {
    if (prefersReducedMotion || !sceneParticles) return;
    const count = window.innerWidth < 640 ? 10 : 18;

    for (let i = 0; i < count; i++) {
      const el = document.createElement('span');
      el.className = 'particle';
      el.style.left = `${rand(0, 100)}%`;
      el.style.setProperty('--particle-size', `${rand(3, 7)}px`);
      el.style.setProperty('--particle-dur', `${rand(11, 20)}s`);
      el.style.setProperty('--particle-delay', `${rand(0, 16)}s`);
      el.style.setProperty('--particle-drift', `${rand(-40, 40)}px`);
      sceneParticles.appendChild(el);
    }
  }


  /* ─────────────────────────────────────────────────────────
     LOADING SEQUENCE
  ───────────────────────────────────────────────────────── */
  function buildLogLines() {
    LOG_STEPS.forEach((label) => {
      const li = document.createElement('li');
      li.className = 'log-line';
      li.innerHTML = `<span class="log-check">○</span><span class="log-text">${label}</span>`;
      loadingLog.appendChild(li);
    });
    return Array.from(loadingLog.querySelectorAll('.log-line'));
  }

  function runLoadingSequence(onComplete) {
    const lines = buildLogLines();
    const duration = prefersReducedMotion ? 500 : rand(2400, 3400);
    const start = performance.now();
    let nextStepIndex = 0;

    function tick(now) {
      const ratio = Math.min((now - start) / duration, 1);
      const pct = Math.round(ratio * 100);
      progressFill.style.width = `${pct}%`;
      progressPct.textContent = `${pct}%`;

      const stepThreshold = (nextStepIndex + 1) / LOG_STEPS.length;
      if (ratio >= stepThreshold && nextStepIndex < lines.length) {
        const line = lines[nextStepIndex];
        line.classList.add('is-done');
        line.querySelector('.log-check').textContent = '✓';
        nextStepIndex++;
      }

      if (ratio < 1) {
        requestAnimationFrame(tick);
      } else {
        setTimeout(() => {
          loadingScreen.classList.add('is-hidden');
          setTimeout(onComplete, prefersReducedMotion ? 50 : 650);
        }, prefersReducedMotion ? 50 : 400);
      }
    }

    requestAnimationFrame(tick);
  }


  /* ─────────────────────────────────────────────────────────
     REVEAL SEQUENCE
     flash → sparkles emerge → card scales in → holo sweep → idle float
  ───────────────────────────────────────────────────────── */
  function revealCard() {
    // 1 & 2 — loading screen has already faded by the time this runs.

    // 3 — soft flash
    if (!prefersReducedMotion) {
      revealFlash.classList.add('is-flashing');
    }

    // 4 — sparkles emerge around the card
    const rect = card.getBoundingClientRect();
    const sceneRect = card.closest('#scene').getBoundingClientRect();
    spawnSparkleBurst(sceneSparkles, prefersReducedMotion ? 0 : 14, {
      minX: rect.left - sceneRect.left - 20,
      maxX: rect.right - sceneRect.left + 20,
      minY: rect.top - sceneRect.top - 20,
      maxY: rect.bottom - sceneRect.top + 20,
    });

    // 5 — card scales into view
    card.classList.remove('card--hidden');
    card.classList.add('card--visible');

    const finishReveal = () => {
      // Release the reveal animation's frozen transform back to the
      // --lift/--rx hover vars defined on the base .card rule.
      card.classList.remove('card--visible');
      card.classList.add('card--settled');

      // 6 — holographic sweep crosses the card, once
      cardShine.classList.add('is-sweeping');
      cardShine.addEventListener('animationend', () => {
        cardShine.classList.remove('is-sweeping');
        cardShine.classList.add('is-idle'); // gentle ambient repeat afterwards
      }, { once: true });

      // 7 — idle floating animation is already running on .card-stage;
      // enable pointer interactions now that the card has settled.
      initCardTilt();
      initPortraitSparkles();
    };

    if (prefersReducedMotion) {
      finishReveal();
    } else {
      card.addEventListener('animationend', finishReveal, { once: true });
    }
  }


  /* ─────────────────────────────────────────────────────────
     POINTER-TRACKED HOLOGRAPHIC TILT
  ───────────────────────────────────────────────────────── */
  function initCardTilt() {
    if (prefersReducedMotion || !window.matchMedia('(hover: hover)').matches) return;
    const foil = $('.card-foil', card);
    const MAX_TILT = 7; // degrees

    function handleMove(e) {
      const rect = card.getBoundingClientRect();
      const px = (e.clientX - rect.left) / rect.width;  // 0 → 1, left to right
      const py = (e.clientY - rect.top) / rect.height;  // 0 → 1, top to bottom

      // --rx feeds rotateY() (horizontal cursor position tilts left/right)
      // --ry feeds rotateX() (vertical cursor position tilts up/down)
      const rxValue = (px - 0.5) * MAX_TILT * 2;
      const ryValue = (0.5 - py) * MAX_TILT * 2;

      card.style.setProperty('--rx', `${rxValue}deg`);
      card.style.setProperty('--ry', `${ryValue}deg`);

      card.classList.add('is-tracking');
      if (foil) foil.style.backgroundPosition = `${px * 100}% ${py * 100}%`;
    }

    function handleLeave() {
      card.style.setProperty('--rx', '0deg');
      card.style.setProperty('--ry', '0deg');
      card.classList.remove('is-tracking');
      if (foil) foil.style.backgroundPosition = '';
    }

    card.addEventListener('mousemove', handleMove);
    card.addEventListener('mouseleave', handleLeave);
  }


  /* ─────────────────────────────────────────────────────────
     PORTRAIT HOVER — sparkle reaction
  ───────────────────────────────────────────────────────── */
  function initPortraitSparkles() {
    if (prefersReducedMotion || !portraitFrame) return;
    let burstTimer = null;

    function burst() {
      const rect = portraitFrame.getBoundingClientRect();
      spawnSparkle(portraitSparkles, {
        x: rand(rect.width * 0.15, rect.width * 0.85),
        y: rand(rect.height * 0.15, rect.height * 0.85),
        size: rand(7, 13),
        duration: rand(1, 1.5),
      });
    }

    portraitFrame.addEventListener('mouseenter', () => {
      for (let i = 0; i < 4; i++) setTimeout(burst, i * 90);
      burstTimer = setInterval(burst, 750);
    });

    portraitFrame.addEventListener('mouseleave', () => {
      clearInterval(burstTimer);
    });
  }


  /* ── Boot ───────────────────────────────────────────────── */
  document.addEventListener('DOMContentLoaded', () => {
    initAmbientParticles();
    runLoadingSequence(revealCard);
  });

})();