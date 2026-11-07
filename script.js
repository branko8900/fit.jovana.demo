/* Jovana Pašalić — demo. Bez biblioteka. */
(function () {
  "use strict";

  var doc = document.documentElement;
  doc.classList.add("js");
  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var IG_DM = "https://ig.me/m/_fitjoo";

  /* Hero naslov red po red — odmah po učitavanju DOM-a, bez čekanja slika */
  requestAnimationFrame(function () {
    requestAnimationFrame(function () { doc.classList.add("is-loaded"); });
  });

  /* Godina u footeru */
  var y = document.getElementById("year");
  if (y) y.textContent = new Date().getFullYear();

  /* Header postaje solidan pri skrolu */
  var header = document.querySelector(".site-header");
  function onScroll() {
    header.classList.toggle("is-solid", window.scrollY > 8);
  }
  onScroll();
  window.addEventListener("scroll", onScroll, { passive: true });

  /* Mobilni meni preko celog ekrana */
  var toggle = document.querySelector(".menu-toggle");
  var menu = document.getElementById("menu");
  var toggleLabel = toggle.querySelector(".menu-toggle__label");

  function setMenu(open) {
    toggle.setAttribute("aria-expanded", String(open));
    toggleLabel.textContent = open ? "Zatvori" : "Meni";
    document.body.classList.toggle("menu-open", open);
    if (open) {
      menu.hidden = false;
      requestAnimationFrame(function () { menu.classList.add("is-open"); });
      var first = menu.querySelector("a");
      if (first) first.focus({ preventScroll: true });
    } else {
      menu.classList.remove("is-open");
      setTimeout(function () { if (!menu.classList.contains("is-open")) menu.hidden = true; }, reduceMotion ? 0 : 350);
    }
  }
  toggle.addEventListener("click", function () {
    setMenu(toggle.getAttribute("aria-expanded") !== "true");
  });
  menu.addEventListener("click", function (e) {
    if (e.target.closest("a")) setMenu(false);
  });
  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape" && toggle.getAttribute("aria-expanded") === "true") {
      setMenu(false);
      toggle.focus();
    }
  });
  window.matchMedia("(min-width: 960px)").addEventListener("change", function (m) {
    if (m.matches) setMenu(false);
  });

  /* Reveal pri skrolu */
  var reveals = document.querySelectorAll(".reveal");
  if (!("IntersectionObserver" in window) || reduceMotion) {
    reveals.forEach(function (el) { el.classList.add("is-in"); });
  } else {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) {
          en.target.classList.add("is-in");
          io.unobserve(en.target);
        }
      });
    }, { rootMargin: "0px 0px -8% 0px", threshold: 0.08 });
    reveals.forEach(function (el) { io.observe(el); });

    // Skok (anchor link, brzi skrol) može da preskoči element — sve iznad ekrana otkrij odmah.
    var ticking = false;
    window.addEventListener("scroll", function () {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(function () {
        ticking = false;
        document.querySelectorAll(".reveal:not(.is-in)").forEach(function (el) {
          if (el.getBoundingClientRect().top < window.innerHeight) {
            el.classList.add("is-in");
            io.unobserve(el);
          }
        });
      });
    }, { passive: true });
  }

  /* Sticky "Prijavi se" na mobilnom: posle hero sekcije, nestaje kad je forma vidljiva */
  var sticky = document.querySelector(".sticky-cta");
  var hero = document.querySelector(".hero");
  var apply = document.getElementById("prijava");
  var footer = document.querySelector(".site-footer");
  if (sticky && "IntersectionObserver" in window) {
    var heroGone = false, applyVisible = false, footerVisible = false;
    var update = function () {
      sticky.classList.toggle("is-visible", heroGone && !applyVisible && !footerVisible);
    };
    new IntersectionObserver(function (e) {
      heroGone = !e[0].isIntersecting && e[0].boundingClientRect.top < 0;
      update();
    }, { threshold: 0 }).observe(hero);
    new IntersectionObserver(function (e) {
      applyVisible = e[0].isIntersecting;
      update();
    }, { threshold: 0, rootMargin: "0px 0px -15% 0px" }).observe(apply);
    new IntersectionObserver(function (e) {
      footerVisible = e[0].isIntersecting;
      update();
    }).observe(footer);
  }

  /* Paket -> forma (popunjava skriveno polje) */
  document.querySelectorAll("[data-goal]").forEach(function (a) {
    a.addEventListener("click", function () {
      var pkg = document.getElementById("f-pkg");
      if (pkg) pkg.value = a.getAttribute("data-goal") === "online" ? "Online coaching" : "Personalni treninzi";
    });
  });

  /* Before / after slajder — pointer events (miš + dodir) i tastatura */
  document.querySelectorAll(".ba__frame").forEach(function (frame) {
    var range = frame.querySelector(".ba__range");
    var dragging = false;

    function set(pct) {
      pct = Math.max(0, Math.min(100, pct));
      frame.style.setProperty("--pos", pct + "%");
      if (range) range.value = Math.round(pct);
    }
    function fromEvent(e) {
      var r = frame.getBoundingClientRect();
      set(((e.clientX - r.left) / r.width) * 100);
    }

    frame.addEventListener("pointerdown", function (e) {
      dragging = true;
      frame.setPointerCapture(e.pointerId);
      fromEvent(e);
    });
    frame.addEventListener("pointermove", function (e) {
      if (dragging) fromEvent(e);
    });
    ["pointerup", "pointercancel", "lostpointercapture"].forEach(function (t) {
      frame.addEventListener(t, function () { dragging = false; });
    });
    if (range) {
      range.style.pointerEvents = "none";
      range.addEventListener("input", function () { set(Number(range.value)); });
    }
  });

  /* Forma za prijavu: ne šalje podatke nigde. Otvara Instagram DM i kopira poruku. */
  var form = document.getElementById("apply-form");
  var confirmBox = document.getElementById("confirm");
  var lastMessage = "";

  function showError(id, show, input) {
    var el = document.getElementById(id);
    if (el) el.hidden = !show;
    if (input) {
      if (show) {
        input.setAttribute("aria-invalid", "true");
        input.setAttribute("aria-describedby", id);
      } else {
        input.removeAttribute("aria-invalid");
        input.removeAttribute("aria-describedby");
      }
    }
  }

  function copy(text) {
    if (navigator.clipboard && window.isSecureContext) {
      return navigator.clipboard.writeText(text).catch(fallbackCopy.bind(null, text));
    }
    fallbackCopy(text);
    return Promise.resolve();
  }
  function fallbackCopy(text) {
    var ta = document.createElement("textarea");
    ta.value = text;
    ta.setAttribute("readonly", "");
    ta.style.position = "fixed";
    ta.style.opacity = "0";
    document.body.appendChild(ta);
    ta.select();
    try { document.execCommand("copy"); } catch (e) { /* korisnik može ručno */ }
    document.body.removeChild(ta);
  }

  if (form) {
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      var name = form.elements["ime"];
      var contact = form.elements["kontakt"];
      var goal = form.querySelector('input[name="cilj"]:checked');
      var exp = form.querySelector('input[name="iskustvo"]:checked');
      var msg = form.elements["poruka"].value.trim();
      var pkg = form.elements["paket"].value;

      var okName = name.value.trim().length > 1;
      var okContact = contact.value.trim().length > 2;
      showError("f-name-err", !okName, name);
      showError("f-contact-err", !okContact, contact);
      showError("f-goal-err", !goal);

      if (!okName) { name.focus(); return; }
      if (!okContact) { contact.focus(); return; }
      if (!goal) { form.querySelector('input[name="cilj"]').focus(); return; }

      var lines = [
        "Ćao Jovana! Prijava sa sajta:",
        "",
        "Ime: " + name.value.trim(),
        "Kontakt: " + contact.value.trim(),
        "Cilj: " + goal.value,
        "Iskustvo: " + (exp ? exp.value : "-")
      ];
      if (pkg) lines.push("Paket: " + pkg);
      if (msg) lines.push("", msg);
      lastMessage = lines.join("\n");

      // Otvara DM sinhrono (da ga browser ne blokira), pa kopira poruku.
      window.open(IG_DM, "_blank", "noopener");
      copy(lastMessage);

      document.getElementById("confirm-name").textContent = name.value.trim().split(" ")[0];
      document.getElementById("confirm-msg").textContent = lastMessage;
      form.hidden = true;
      confirmBox.hidden = false;
      confirmBox.focus({ preventScroll: true });
      confirmBox.scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth", block: "center" });
    });

    document.getElementById("copy-again").addEventListener("click", function (e) {
      var btn = e.currentTarget;
      copy(lastMessage).then(function () {
        btn.textContent = "Kopirano";
        setTimeout(function () { btn.textContent = "Kopiraj poruku ponovo"; }, 1800);
      });
    });
  }
})();
