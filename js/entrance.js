(function () {
  "use strict";

  var prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var canvas = document.querySelector("[data-entrance-canvas]");
  var enterBtn = document.querySelector("[data-enter-btn]");
  var transitionEl = document.querySelector("[data-entrance-transition]");
  var destination = (enterBtn && enterBtn.getAttribute("data-href")) || "home.html";

  /* ---------------------------------------------------------------------
     Subtle drifting ink-speck canvas background.
     Skipped entirely under reduced-motion or on very low-power devices
     (falls back to a static blank canvas — page still works fine).
     ------------------------------------------------------------------- */
  if (canvas && !prefersReducedMotion) {
    var ctx = canvas.getContext("2d");
    var dpr = Math.min(window.devicePixelRatio || 1, 2);
    var w, h, particles;
    var particleCount = window.innerWidth < 640 ? 26 : 46;

    function resize() {
      w = canvas.clientWidth;
      h = canvas.clientHeight;
      canvas.width = w * dpr;
      canvas.height = h * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }

    function makeParticles() {
      particles = [];
      for (var i = 0; i < particleCount; i++) {
        particles.push({
          x: Math.random() * w,
          y: Math.random() * h,
          r: 0.6 + Math.random() * 1.8,
          vx: (Math.random() - 0.5) * 0.12,
          vy: -0.05 - Math.random() * 0.12,
          a: 0.06 + Math.random() * 0.1
        });
      }
    }

    resize();
    makeParticles();

    /* -------------------------------------------------------------------
       Mouse dust trail — a handful of specks spawn near the cursor as it
       moves and drift off, fading out. Fine-pointer devices only.
       ------------------------------------------------------------------- */
    var trail = [];
    var TRAIL_MAX = 140;
    var lastSpawn = 0;
    var hasFinePointer = window.matchMedia("(pointer: fine)").matches;

    if (hasFinePointer) {
      document.addEventListener("mousemove", function (e) {
        var now = performance.now();
        if (now - lastSpawn < 22) return;
        lastSpawn = now;
        var rect = canvas.getBoundingClientRect();
        var mx = e.clientX - rect.left;
        var my = e.clientY - rect.top;
        var count = 1 + Math.round(Math.random());
        for (var i = 0; i < count; i++) {
          trail.push({
            x: mx + (Math.random() - 0.5) * 10,
            y: my + (Math.random() - 0.5) * 10,
            r: 0.8 + Math.random() * 2,
            vx: (Math.random() - 0.5) * 0.5,
            vy: -0.15 - Math.random() * 0.35,
            life: 1,
            decay: 0.012 + Math.random() * 0.012
          });
        }
        if (trail.length > TRAIL_MAX) trail.splice(0, trail.length - TRAIL_MAX);
      });
    }

    var raf;
    function tick() {
      ctx.clearRect(0, 0, w, h);
      ctx.fillStyle = "#0a0a0a";

      particles.forEach(function (p) {
        p.x += p.vx;
        p.y += p.vy;
        if (p.y < -10) { p.y = h + 10; p.x = Math.random() * w; }
        if (p.x < -10) p.x = w + 10;
        if (p.x > w + 10) p.x = -10;
        ctx.globalAlpha = p.a;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fill();
      });

      if (trail.length) {
        for (var i = trail.length - 1; i >= 0; i--) {
          var t = trail[i];
          t.x += t.vx;
          t.y += t.vy;
          t.vx *= 0.98;
          t.life -= t.decay;
          if (t.life <= 0) { trail.splice(i, 1); continue; }
          ctx.globalAlpha = t.life * 0.5;
          ctx.beginPath();
          ctx.arc(t.x, t.y, t.r * t.life, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      ctx.globalAlpha = 1;
      raf = requestAnimationFrame(tick);
    }

    var visible = true;
    document.addEventListener("visibilitychange", function () {
      visible = document.visibilityState === "visible";
      if (visible && !raf) raf = requestAnimationFrame(tick);
      if (!visible && raf) { cancelAnimationFrame(raf); raf = null; }
    });

    raf = requestAnimationFrame(tick);
    window.addEventListener("resize", function () {
      resize();
      makeParticles();
    });
  }

  /* ---------------------------------------------------------------------
     Click-to-enter transition: the whole page fades into the site.
     ------------------------------------------------------------------- */
  if (enterBtn) {
    enterBtn.addEventListener("click", function (e) {
      e.preventDefault();
      if (prefersReducedMotion || !transitionEl) {
        window.location.href = destination;
        return;
      }
      transitionEl.classList.add("is-active");
      setTimeout(function () {
        window.location.href = destination;
      }, 450);
    });
  }
})();
