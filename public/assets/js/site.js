/* Mel Writes — site behaviour. No dependencies. */
(function () {
  "use strict";
  document.documentElement.classList.add("js");

  /* Header hairline once the page scrolls */
  var header = document.querySelector(".site-header");
  if (header) {
    var onScroll = function () { header.classList.toggle("is-scrolled", window.scrollY > 8); };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
  }

  /* Local time in the meta strip: <span data-clock data-tz="America/New_York"> */
  document.querySelectorAll("[data-clock]").forEach(function (el) {
    var fmt;
    try {
      fmt = new Intl.DateTimeFormat("en-US", { hour: "2-digit", minute: "2-digit", hour12: false, timeZone: el.dataset.tz || undefined });
    } catch (e) {
      fmt = new Intl.DateTimeFormat("en-US", { hour: "2-digit", minute: "2-digit", hour12: false });
    }
    var tick = function () { el.textContent = fmt.format(new Date()); };
    tick();
    setInterval(tick, 15000);
  });

  document.querySelectorAll("[data-year]").forEach(function (el) { el.textContent = new Date().getFullYear(); });

  /* Reveal on scroll */
  var reveals = document.querySelectorAll(".reveal");
  if ("IntersectionObserver" in window) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) { e.target.classList.add("is-in"); io.unobserve(e.target); }
      });
    }, { rootMargin: "0px 0px -8% 0px" });
    reveals.forEach(function (el) { io.observe(el); });
  } else {
    reveals.forEach(function (el) { el.classList.add("is-in"); });
  }

  /* YouTube: <div class="yt" data-id="VIDEO_ID" data-title="…"> — thumbnail until clicked */
  document.querySelectorAll(".yt[data-id]").forEach(function (el) {
    var id = el.dataset.id;
    var title = el.dataset.title || "Video";
    el.style.backgroundImage = "url(https://i.ytimg.com/vi/" + encodeURIComponent(id) + "/hqdefault.jpg)";
    el.setAttribute("role", "group");
    el.setAttribute("aria-label", title);
    el.insertAdjacentHTML("beforeend",
      '<div class="yt__title"><span class="label">' + escapeHtml(title) + '</span><span class="label">YouTube</span></div>' +
      '<button class="yt__btn" type="button" aria-label="Play video: ' + escapeHtml(title) + '">' +
      '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M6 4l15 8-15 8z"/></svg></button>');
    var play = function () {
      if (el.querySelector("iframe")) return;
      var iframe = document.createElement("iframe");
      iframe.src = "https://www.youtube-nocookie.com/embed/" + encodeURIComponent(id) + "?autoplay=1&rel=0&modestbranding=1";
      iframe.title = title;
      iframe.allow = "accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share";
      iframe.allowFullscreen = true;
      el.innerHTML = "";
      el.appendChild(iframe);
      el.style.cursor = "default";
    };
    el.addEventListener("click", play);
  });

  /* Audio: enhance <figure class="audio"><audio controls src> … */
  document.querySelectorAll(".audio").forEach(function (wrap) {
    var audio = wrap.querySelector("audio");
    if (!audio) return;
    var title = wrap.dataset.title || "Audio";
    audio.removeAttribute("controls");
    audio.hidden = true;
    audio.preload = "metadata";
    wrap.insertAdjacentHTML("afterbegin",
      '<button class="audio__play" type="button" aria-label="Play ' + escapeHtml(title) + '">' +
      '<svg class="i-play" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M7 4l13 8-13 8z"/></svg>' +
      '<svg class="i-pause" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M6 4h4v16H6zM14 4h4v16h-4z"/></svg></button>' +
      '<span class="audio__title">' + escapeHtml(title) + '</span>' +
      '<span class="audio__time"><span data-cur>00:00</span> / <span data-dur>--:--</span></span>' +
      '<div class="audio__bar"><input type="range" min="0" max="1000" value="0" step="1" aria-label="Seek"></div>');
    var btn = wrap.querySelector(".audio__play");
    var range = wrap.querySelector("input[type=range]");
    var cur = wrap.querySelector("[data-cur]");
    var dur = wrap.querySelector("[data-dur]");
    var seeking = false;

    var paint = function () {
      var p = audio.duration ? audio.currentTime / audio.duration : 0;
      if (!seeking) range.value = Math.round(p * 1000);
      range.style.setProperty("--p", (range.value / 10) + "%");
      cur.textContent = clock(audio.currentTime);
    };
    btn.addEventListener("click", function () {
      if (audio.paused) {
        document.querySelectorAll(".audio audio").forEach(function (a) { if (a !== audio) a.pause(); });
        audio.play();
      } else {
        audio.pause();
      }
    });
    audio.addEventListener("play", function () { wrap.classList.add("is-playing"); btn.setAttribute("aria-label", "Pause " + title); });
    audio.addEventListener("pause", function () { wrap.classList.remove("is-playing"); btn.setAttribute("aria-label", "Play " + title); });
    audio.addEventListener("loadedmetadata", function () { dur.textContent = clock(audio.duration); });
    audio.addEventListener("timeupdate", paint);
    audio.addEventListener("ended", function () { audio.currentTime = 0; paint(); });
    range.addEventListener("input", function () {
      seeking = true;
      range.style.setProperty("--p", (range.value / 10) + "%");
      if (audio.duration) cur.textContent = clock(audio.duration * range.value / 1000);
    });
    range.addEventListener("change", function () {
      if (audio.duration) audio.currentTime = audio.duration * range.value / 1000;
      seeking = false;
    });
    if (audio.readyState >= 1) dur.textContent = clock(audio.duration);
  });

  /* Resume download, gated by Cloudflare Turnstile */
  var form = document.getElementById("resume-form");
  if (form) {
    var btn = form.querySelector("button[type=submit]");
    var status = form.querySelector(".form-status");
    var token = null;
    var setStatus = function (msg, kind) {
      status.textContent = msg;
      status.className = "form-status label" + (kind ? " is-" + kind : "");
    };

    window.onResumeVerified = function (t) {
      token = t;
      btn.disabled = false;
      setStatus("Verified — ready to download.", "ok");
    };
    window.onResumeExpired = function () {
      token = null;
      btn.disabled = true;
      setStatus("Verification expired. Please check the box again.");
    };
    window.onResumeError = function () {
      token = null;
      btn.disabled = true;
      setStatus("Verification couldn’t load. Refresh the page or email me for a copy.", "error");
    };

    form.addEventListener("submit", function (ev) {
      ev.preventDefault();
      if (!token) { setStatus("Please complete the verification first.", "error"); return; }
      btn.disabled = true;
      btn.setAttribute("aria-busy", "true");
      setStatus("Preparing your download…");

      fetch(form.action, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token: token })
      }).then(function (res) {
        if (!res.ok) {
          return res.json().catch(function () { return {}; }).then(function (data) {
            throw new Error(data.error || "Download unavailable right now.");
          });
        }
        var name = (/filename="([^"]+)"/.exec(res.headers.get("Content-Disposition") || "") || [])[1] || "resume.pdf";
        return res.blob().then(function (blob) {
          var url = URL.createObjectURL(blob);
          var a = document.createElement("a");
          a.href = url;
          a.download = name;
          document.body.appendChild(a);
          a.click();
          a.remove();
          setTimeout(function () { URL.revokeObjectURL(url); }, 4000);
          setStatus("Downloaded. Thank you for your interest.", "ok");
        });
      }).catch(function (err) {
        setStatus(err.message, "error");
      }).then(function () {
        // Turnstile tokens are single-use: reset so another download needs a fresh check.
        token = null;
        btn.removeAttribute("aria-busy");
        btn.disabled = true;
        if (window.turnstile) window.turnstile.reset(form.querySelector(".cf-turnstile"));
      });
    });
  }

  function clock(s) {
    if (!isFinite(s)) return "--:--";
    s = Math.max(0, Math.floor(s));
    return String(Math.floor(s / 60)).padStart(2, "0") + ":" + String(s % 60).padStart(2, "0");
  }
  function escapeHtml(s) {
    return String(s).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }
})();
