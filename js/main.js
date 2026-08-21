(function () {
  "use strict";

  var prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ---------------------------------------------------------------------
     Mobile nav toggle
     ------------------------------------------------------------------- */
  var navToggle = document.querySelector("[data-nav-toggle]");
  var navClose = document.querySelector("[data-nav-close]");
  var mobileNav = document.querySelector("[data-mobile-nav]");

  function openMobileNav() {
    if (!mobileNav) return;
    mobileNav.classList.add("is-open");
    mobileNav.removeAttribute("hidden");
    document.body.style.overflow = "hidden";
    navToggle && navToggle.setAttribute("aria-expanded", "true");
    var firstLink = mobileNav.querySelector("a, button");
    firstLink && firstLink.focus();
  }
  function closeMobileNav() {
    if (!mobileNav) return;
    mobileNav.classList.remove("is-open");
    document.body.style.overflow = "";
    navToggle && navToggle.setAttribute("aria-expanded", "false");
    setTimeout(function () {
      if (!mobileNav.classList.contains("is-open")) mobileNav.setAttribute("hidden", "");
    }, 400);
    navToggle && navToggle.focus();
  }
  navToggle && navToggle.addEventListener("click", openMobileNav);
  navClose && navClose.addEventListener("click", closeMobileNav);
  mobileNav && mobileNav.addEventListener("keydown", function (e) {
    if (e.key === "Escape") closeMobileNav();
  });
  mobileNav && mobileNav.querySelectorAll("a").forEach(function (a) {
    a.addEventListener("click", closeMobileNav);
  });

  /* ---------------------------------------------------------------------
     Scroll reveal (IntersectionObserver, GSAP-free fallback-safe)
     ------------------------------------------------------------------- */
  var revealEls = document.querySelectorAll("[data-reveal]");
  if (revealEls.length) {
    if (prefersReducedMotion || !("IntersectionObserver" in window)) {
      revealEls.forEach(function (el) { el.classList.add("is-visible"); });
    } else {
      var io = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry, i) {
          if (entry.isIntersecting) {
            var delay = entry.target.getAttribute("data-reveal-delay") || (i * 60);
            setTimeout(function () {
              entry.target.classList.add("is-visible");
            }, Number(delay));
            io.unobserve(entry.target);
          }
        });
      }, { threshold: 0.15, rootMargin: "0px 0px -8% 0px" });
      revealEls.forEach(function (el) { io.observe(el); });
    }
  }

  /* ---------------------------------------------------------------------
     GSAP enhancement layer (progressive — page works fully without it)
     ------------------------------------------------------------------- */
  if (window.gsap && !prefersReducedMotion) {
    if (window.ScrollTrigger) gsap.registerPlugin(ScrollTrigger);

    gsap.utils.toArray(".gallery-card").forEach(function (card, i) {
      gsap.fromTo(card,
        { y: 30, opacity: 0 },
        {
          y: 0, opacity: 1, duration: 0.6, ease: "power3.out",
          delay: (i % 4) * 0.06,
          scrollTrigger: { trigger: card, start: "top 92%", once: true }
        }
      );
    });

    gsap.utils.toArray(".hero__mark").forEach(function (mark) {
      gsap.to(mark, {
        y: -14, duration: 3.2, ease: "sine.inOut", repeat: -1, yoyo: true
      });
    });
  }

  /* ---------------------------------------------------------------------
     Magnetic hover for primary buttons (desktop only, subtle)
     ------------------------------------------------------------------- */
  if (!prefersReducedMotion && window.matchMedia("(hover: hover) and (pointer: fine)").matches) {
    document.querySelectorAll("[data-magnetic]").forEach(function (btn) {
      btn.addEventListener("mousemove", function (e) {
        var r = btn.getBoundingClientRect();
        var x = e.clientX - r.left - r.width / 2;
        var y = e.clientY - r.top - r.height / 2;
        btn.style.transform = "translate(" + x * 0.12 + "px," + y * 0.28 + "px)";
      });
      btn.addEventListener("mouseleave", function () {
        btn.style.transform = "";
      });
    });
  }

  /* ---------------------------------------------------------------------
     Footer year
     ------------------------------------------------------------------- */
  document.querySelectorAll("[data-year]").forEach(function (el) {
    el.textContent = new Date().getFullYear();
  });

  /* ---------------------------------------------------------------------
     Booking form: client-side validation + Formspree submission.
     Submits via fetch so the page never leaves and the existing
     on-brand success/error messaging keeps working.
     ------------------------------------------------------------------- */
  document.querySelectorAll("[data-booking-form]").forEach(function (form) {
    form.addEventListener("submit", function (e) {
      e.preventDefault();

      var valid = true;
      form.querySelectorAll("[required]").forEach(function (input) {
        var field = input.closest(".field");
        var isEmpty = input.type === "checkbox" ? !input.checked : !input.value.trim();
        if (isEmpty) {
          valid = false;
          field && field.classList.add("has-error");
        } else {
          field && field.classList.remove("has-error");
        }
      });

      if (!valid) {
        var firstError = form.querySelector(".has-error input, .has-error select, .has-error textarea");
        firstError && firstError.focus();
        return;
      }

      var submitBtn = form.querySelector("[type='submit']");
      var status = form.querySelector("[data-form-status]");

      function showStatus(kind, message) {
        if (!status) return;
        status.textContent = message;
        status.className = "form-status form-status--" + kind + " is-visible";
      }

      submitBtn && submitBtn.classList.add("is-loading");
      submitBtn && (submitBtn.disabled = true);

      fetch(form.action, {
        method: "POST",
        body: new FormData(form),
        headers: { Accept: "application/json" }
      })
        .then(function (response) {
          submitBtn && submitBtn.classList.remove("is-loading");
          submitBtn && (submitBtn.disabled = false);
          if (response.ok) {
            showStatus(
              "success",
              form.getAttribute("data-success-message") ||
                (form.hasAttribute("data-notify-form")
                  ? "Thanks! You're on the list. We'll email you the moment the store opens."
                  : "Thanks! Your request is in. We'll email you within 1 to 2 business days.")
            );
            form.reset();
          } else {
            showStatus("error", "Something went wrong sending that. Please try again or email us directly.");
          }
        })
        .catch(function () {
          submitBtn && submitBtn.classList.remove("is-loading");
          submitBtn && (submitBtn.disabled = false);
          showStatus("error", "Something went wrong sending that. Please try again or email us directly.");
        });
    });

    form.querySelectorAll("[required]").forEach(function (input) {
      input.addEventListener("input", function () {
        var field = input.closest(".field");
        if (field && field.classList.contains("has-error") && input.value.trim()) {
          field.classList.remove("has-error");
        }
      });
    });
  });

  /* ---------------------------------------------------------------------
     Store countdown: no drop date exists yet, so the digits just scramble
     forever instead of counting down to a real target.
     ------------------------------------------------------------------- */
  var countdownEl = document.querySelector("[data-countdown]");
  if (countdownEl) {
    var cdDays = countdownEl.querySelector("[data-countdown-days]");
    var cdHours = countdownEl.querySelector("[data-countdown-hours]");
    var cdMinutes = countdownEl.querySelector("[data-countdown-minutes]");
    var cdSeconds = countdownEl.querySelector("[data-countdown-seconds]");

    function randomTwoDigits() {
      return String(Math.floor(Math.random() * 100)).padStart(2, "0");
    }

    function scrambleCountdown() {
      cdDays && (cdDays.textContent = randomTwoDigits());
      cdHours && (cdHours.textContent = randomTwoDigits());
      cdMinutes && (cdMinutes.textContent = randomTwoDigits());
      cdSeconds && (cdSeconds.textContent = randomTwoDigits());
    }

    scrambleCountdown();
    setInterval(scrambleCountdown, prefersReducedMotion ? 2500 : 130);
  }

  /* ---------------------------------------------------------------------
     Sketchpad: a small retro-Paint-style drawing widget. Decorative and
     for-fun only, so it's mouse/touch driven, not keyboard-navigable.
     ------------------------------------------------------------------- */
  var paintCanvas = document.querySelector("[data-paint-canvas]");
  if (paintCanvas) {
    var pctx = paintCanvas.getContext("2d", { willReadFrequently: true });
    var paintPalette = document.querySelector("[data-paint-palette]");
    var fgSwatch = document.querySelector("[data-paint-fg-swatch]");
    var toolButtons = document.querySelectorAll("[data-paint-tool]");
    var sizeButtons = document.querySelectorAll("[data-paint-size]");
    var undoBtn = document.querySelector("[data-paint-undo]");
    var clearBtn = document.querySelector("[data-paint-clear]");
    var saveBtn = document.querySelector("[data-paint-save]");

    var paintColors = [
      "#000000", "#7f7f7f", "#880015", "#ed1c24", "#ff7f27", "#fff200", "#22b14c", "#00a2e8", "#3f48cc", "#a349a4",
      "#ffffff", "#c3c3c3", "#b97a57", "#ffaec9", "#ffc90e", "#efe4b0", "#b5e61d", "#99d9ea", "#7092be", "#c8bfe7"
    ];
    var currentColor = "#000000";
    var currentTool = "pencil";
    var currentSize = 4;
    var drawing = false;
    var startPoint = null;
    var lastX, lastY, snapshotBeforeDrag;
    var undoStack = [];

    function fillWhite() {
      pctx.fillStyle = "#ffffff";
      pctx.fillRect(0, 0, paintCanvas.width, paintCanvas.height);
    }
    fillWhite();

    paintColors.forEach(function (color) {
      var sw = document.createElement("button");
      sw.type = "button";
      sw.className = "paint-app__swatch";
      sw.style.background = color;
      sw.setAttribute("aria-label", "Color " + color);
      if (color === currentColor) sw.classList.add("is-active");
      sw.addEventListener("click", function () {
        currentColor = color;
        fgSwatch.style.background = color;
        paintPalette.querySelectorAll(".paint-app__swatch").forEach(function (s) { s.classList.remove("is-active"); });
        sw.classList.add("is-active");
      });
      paintPalette.appendChild(sw);
    });
    fgSwatch.style.background = currentColor;

    toolButtons.forEach(function (btn) {
      btn.addEventListener("click", function () {
        currentTool = btn.getAttribute("data-paint-tool");
        toolButtons.forEach(function (b) { b.classList.remove("is-active"); b.setAttribute("aria-pressed", "false"); });
        btn.classList.add("is-active");
        btn.setAttribute("aria-pressed", "true");
      });
    });

    sizeButtons.forEach(function (btn) {
      btn.addEventListener("click", function () {
        currentSize = parseInt(btn.getAttribute("data-paint-size"), 10);
        sizeButtons.forEach(function (b) { b.classList.remove("is-active"); });
        btn.classList.add("is-active");
      });
    });

    function getPos(e) {
      var rect = paintCanvas.getBoundingClientRect();
      var scaleX = paintCanvas.width / rect.width;
      var scaleY = paintCanvas.height / rect.height;
      var point = e.touches && e.touches[0] ? e.touches[0] : e;
      return {
        x: (point.clientX - rect.left) * scaleX,
        y: (point.clientY - rect.top) * scaleY
      };
    }

    function pushUndo() {
      undoStack.push(pctx.getImageData(0, 0, paintCanvas.width, paintCanvas.height));
      if (undoStack.length > 15) undoStack.shift();
    }

    function strokeColor() {
      return currentTool === "eraser" ? "#ffffff" : currentColor;
    }

    function strokeWidth() {
      if (currentTool === "eraser") return 18;
      if (currentTool === "brush") return currentSize * 2.5;
      return currentSize;
    }

    function strokeTo(x, y, lastPointX, lastPointY) {
      pctx.strokeStyle = strokeColor();
      pctx.lineWidth = strokeWidth();
      pctx.lineCap = "round";
      pctx.lineJoin = "round";
      pctx.beginPath();
      pctx.moveTo(lastPointX, lastPointY);
      pctx.lineTo(x, y);
      pctx.stroke();
    }

    function dotAt(x, y) {
      pctx.fillStyle = strokeColor();
      pctx.beginPath();
      pctx.arc(x, y, strokeWidth() / 2, 0, Math.PI * 2);
      pctx.fill();
    }

    function floodFill(startX, startY, fillColor) {
      var x = Math.floor(startX), y = Math.floor(startY);
      var w = paintCanvas.width, h = paintCanvas.height;
      if (x < 0 || x >= w || y < 0 || y >= h) return;
      var imgData = pctx.getImageData(0, 0, w, h);
      var data = imgData.data;
      var startIdx = (y * w + x) * 4;
      var targetR = data[startIdx], targetG = data[startIdx + 1], targetB = data[startIdx + 2], targetA = data[startIdx + 3];

      var fr = parseInt(fillColor.slice(1, 3), 16);
      var fg = parseInt(fillColor.slice(3, 5), 16);
      var fb = parseInt(fillColor.slice(5, 7), 16);
      if (targetR === fr && targetG === fg && targetB === fb && targetA === 255) return;

      var stack = [[x, y]];
      var visited = new Uint8Array(w * h);
      while (stack.length) {
        var p = stack.pop();
        var px = p[0], py = p[1];
        if (px < 0 || px >= w || py < 0 || py >= h) continue;
        var vIdx = py * w + px;
        if (visited[vIdx]) continue;
        var i = vIdx * 4;
        if (data[i] !== targetR || data[i + 1] !== targetG || data[i + 2] !== targetB || data[i + 3] !== targetA) continue;
        visited[vIdx] = 1;
        data[i] = fr; data[i + 1] = fg; data[i + 2] = fb; data[i + 3] = 255;
        stack.push([px + 1, py]); stack.push([px - 1, py]); stack.push([px, py + 1]); stack.push([px, py - 1]);
      }
      pctx.putImageData(imgData, 0, 0);
    }

    function handleStart(e) {
      if (e.cancelable) e.preventDefault();
      var pos = getPos(e);

      if (currentTool === "fill") {
        pushUndo();
        floodFill(pos.x, pos.y, currentColor);
        return;
      }

      pushUndo();
      drawing = true;
      startPoint = pos;
      lastX = pos.x; lastY = pos.y;

      if (currentTool === "line" || currentTool === "rect") {
        snapshotBeforeDrag = pctx.getImageData(0, 0, paintCanvas.width, paintCanvas.height);
      } else {
        dotAt(pos.x, pos.y);
      }
    }

    function handleMove(e) {
      if (!drawing) return;
      if (e.cancelable) e.preventDefault();
      var pos = getPos(e);

      if (currentTool === "pencil" || currentTool === "brush" || currentTool === "eraser") {
        strokeTo(pos.x, pos.y, lastX, lastY);
        lastX = pos.x; lastY = pos.y;
      } else if (currentTool === "line") {
        pctx.putImageData(snapshotBeforeDrag, 0, 0);
        pctx.strokeStyle = currentColor;
        pctx.lineWidth = currentSize;
        pctx.lineCap = "round";
        pctx.beginPath();
        pctx.moveTo(startPoint.x, startPoint.y);
        pctx.lineTo(pos.x, pos.y);
        pctx.stroke();
      } else if (currentTool === "rect") {
        pctx.putImageData(snapshotBeforeDrag, 0, 0);
        pctx.strokeStyle = currentColor;
        pctx.lineWidth = currentSize;
        pctx.strokeRect(startPoint.x, startPoint.y, pos.x - startPoint.x, pos.y - startPoint.y);
      }
    }

    function handleEnd() {
      drawing = false;
    }

    paintCanvas.addEventListener("mousedown", handleStart);
    paintCanvas.addEventListener("mousemove", handleMove);
    window.addEventListener("mouseup", handleEnd);
    paintCanvas.addEventListener("touchstart", handleStart, { passive: false });
    paintCanvas.addEventListener("touchmove", handleMove, { passive: false });
    window.addEventListener("touchend", handleEnd);

    undoBtn && undoBtn.addEventListener("click", function () {
      if (!undoStack.length) return;
      pctx.putImageData(undoStack.pop(), 0, 0);
    });

    clearBtn && clearBtn.addEventListener("click", function () {
      pushUndo();
      fillWhite();
    });

    saveBtn && saveBtn.addEventListener("click", function () {
      var link = document.createElement("a");
      link.download = "pencilfingerz-drawing.png";
      link.href = paintCanvas.toDataURL("image/png");
      link.click();
    });
  }

  /* ---------------------------------------------------------------------
     Mouse trails: decorative canvas overlays that follow the cursor.
     Fine-pointer only, and skipped under reduced-motion.
     ------------------------------------------------------------------- */
  var hasFinePointerForTrail = window.matchMedia("(hover: hover) and (pointer: fine)").matches;

  function setupTrailCanvas(canvas) {
    var ctx = canvas.getContext("2d");
    var dpr = Math.min(window.devicePixelRatio || 1, 2);
    function resize() {
      canvas.width = window.innerWidth * dpr;
      canvas.height = window.innerHeight * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }
    resize();
    window.addEventListener("resize", resize);
    return ctx;
  }

  /* A thin pencil-line scribble that follows the cursor and fades, site-wide. */
  var pencilTrailCanvas = document.querySelector("[data-pencil-trail]");
  if (pencilTrailCanvas && !prefersReducedMotion && hasFinePointerForTrail) {
    var ptx = setupTrailCanvas(pencilTrailCanvas);
    var pencilPoints = [];
    var lastPointSpawn = 0;
    var LINE_LIFE = 1300;
    var hasLastPos = false;
    var lastPosX, lastPosY;

    document.addEventListener("mousemove", function (e) {
      if ((e.target.nodeType === 1 && e.target.closest("button, a, .paint-app, .no-pencil-trail"))) {
        hasLastPos = false;
        return;
      }
      var now = performance.now();
      if (now - lastPointSpawn < 12) return;
      lastPointSpawn = now;
      if (hasLastPos) {
        pencilPoints.push({ x1: lastPosX, y1: lastPosY, x2: e.clientX, y2: e.clientY, created: Date.now() });
      }
      lastPosX = e.clientX; lastPosY = e.clientY;
      hasLastPos = true;
      if (pencilPoints.length > 220) pencilPoints.splice(0, pencilPoints.length - 220);
    });

    function drawPencilTrail() {
      ptx.clearRect(0, 0, window.innerWidth, window.innerHeight);
      var now = Date.now();
      ptx.lineCap = "round";
      ptx.lineWidth = 1.4;
      ptx.strokeStyle = "#0a0a0a";
      for (var i = pencilPoints.length - 1; i >= 0; i--) {
        var seg = pencilPoints[i];
        var age = now - seg.created;
        if (age >= LINE_LIFE) { pencilPoints.splice(i, 1); continue; }
        ptx.globalAlpha = Math.max(0, 1 - age / LINE_LIFE) * 0.5;
        ptx.beginPath();
        ptx.moveTo(seg.x1, seg.y1);
        ptx.lineTo(seg.x2, seg.y2);
        ptx.stroke();
      }
      ptx.globalAlpha = 1;
      requestAnimationFrame(drawPencilTrail);
    }
    requestAnimationFrame(drawPencilTrail);
  }

  /* ---------------------------------------------------------------------
     Coming-soon page: hidden password gate for early access to the site.
     ------------------------------------------------------------------- */
  var earlyAccessForm = document.querySelector("[data-early-access-form]");
  if (earlyAccessForm) {
    var EARLY_ACCESS_PASSWORD = "edsondr";
    var earlyAccessInput = earlyAccessForm.querySelector("input[name='password']");

    earlyAccessForm.addEventListener("submit", function (e) {
      e.preventDefault();
      var field = earlyAccessInput.closest(".field");
      var value = earlyAccessInput.value.trim().toLowerCase();

      if (value === EARLY_ACCESS_PASSWORD) {
        field && field.classList.remove("has-error");
        var submitBtn = earlyAccessForm.querySelector("[type='submit']");
        submitBtn && (submitBtn.disabled = true);
        submitBtn && (submitBtn.textContent = "Unlocking…");
        setTimeout(function () {
          window.location.href = "home.html";
        }, 400);
      } else {
        field && field.classList.add("has-error");
        earlyAccessInput.focus();
      }
    });

    earlyAccessInput.addEventListener("input", function () {
      var field = earlyAccessInput.closest(".field");
      if (field && field.classList.contains("has-error")) {
        field.classList.remove("has-error");
      }
    });
  }

})();
