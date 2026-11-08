/**
 * Endless Tower: tela de login.
 * Carregado em toda página de layout "setup" do Foundry, mas só age na página /join
 * de um mundo cuja descrição contém <div class="et-login-marker"></div> ou título Endless Tower.
 * Outros mundos e as demais telas não são afetados.
 */
(() => {
  "use strict";

  const WORLD_TITLE = "Endless Tower";
  const isTargetWorld = document.title.trim() === WORLD_TITLE;

  // Ativação ultra-rápida no root para evitar qualquer flash
  if (isTargetWorld) {
    document.documentElement.classList.add("et-world", "et-gate");
    if (document.body) {
      document.body.classList.add("et-world", "et-gate");
    }
  }

  if (document.body && !document.body.classList.contains("join")) return;

  const BGM_URL = "endless-tower/audios/bgm/Ragnarok%20Online_%20Title%20(Remastered).mp3";
  const SFX_URL = "endless-tower/audios/ui/ragnarok-login.mp3";
  const VIDEO_URL = "endless-tower/videos/ro3-intro.webm";
  const POSTER_URL = "endless-tower/landscape/torre.webp";
  const LIVING_IMAGE_URL = "endless-tower/landscape/endless-tower-login-screen.webp";
  const SFX_VOLUME = 0.5;
  const DEFAULT_VOLUME = 0.2;
  const KEY = "endless-tower.login";
  const MARKER = ".et-login-marker";

  /* ---------- Preferências do jogador (por navegador) ---------- */
  const prefs = {
    get volume() {
      const v = parseFloat(localStorage.getItem(`${KEY}.volume`));
      return Number.isFinite(v) ? Math.min(1, Math.max(0, v)) : DEFAULT_VOLUME;
    },
    set volume(v) { localStorage.setItem(`${KEY}.volume`, String(v)); },
    get muted() { return localStorage.getItem(`${KEY}.muted`) === "1"; },
    set muted(v) { localStorage.setItem(`${KEY}.muted`, v ? "1" : "0"); }
  };

  /* ---------- Áudio ---------- */
  const bgm = new Audio(BGM_URL);
  bgm.loop = true;

  const applyAudioPrefs = () => {
    bgm.volume = prefs.volume;
    bgm.muted = prefs.muted;
  };

  const playClick = () => {
    if (prefs.muted) return;
    const sfx = new Audio(SFX_URL);
    sfx.volume = SFX_VOLUME;
    sfx.play().catch(() => {});
  };

  /* ---------- Helpers de DOM ---------- */
  const el = (tag, className, text) => {
    const node = document.createElement(tag);
    if (className) node.className = className;
    if (text) node.textContent = text;
    return node;
  };

  /* ---------- Living Art: Fundo Animado com Ken Burns e Partículas ---------- */
  const mountLivingBackground = () => {
    if (document.getElementById("et-living-bg")) return () => {};
    const wrap = el("div");
    wrap.id = "et-living-bg";

    const img = el("img");
    img.id = "et-living-img";
    img.src = LIVING_IMAGE_URL;
    img.alt = "Endless Tower Pantheon";

    const rays = el("div");
    rays.id = "et-living-rays";

    const canvas = el("canvas");
    canvas.id = "et-living-particles";

    wrap.append(img, rays, canvas);
    document.body.prepend(wrap);

    // Partículas flutuantes douradas celestiais
    const ctx = canvas.getContext("2d");
    let animId = null;
    let w = (canvas.width = window.innerWidth);
    let h = (canvas.height = window.innerHeight);

    const onResize = () => {
      w = canvas.width = window.innerWidth;
      h = canvas.height = window.innerHeight;
    };
    window.addEventListener("resize", onResize);

    const PARTICLE_COUNT = 50;
    const particles = Array.from({ length: PARTICLE_COUNT }, () => ({
      x: Math.random() * w,
      y: Math.random() * h,
      r: 1.2 + Math.random() * 2.2,
      baseAlpha: 0.25 + Math.random() * 0.55,
      alpha: 0,
      vy: 0.25 + Math.random() * 0.45,
      sway: Math.random() * Math.PI * 2,
      swaySpeed: 0.015 + Math.random() * 0.02,
      swayAmp: 0.35 + Math.random() * 0.55
    }));

    const render = () => {
      ctx.clearRect(0, 0, w, h);

      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];
        p.y -= p.vy;
        p.sway += p.swaySpeed;
        p.x += Math.sin(p.sway) * p.swayAmp;

        // Fade in suave na parte inferior, fade out suave perto do topo
        const lifeRatio = p.y / h;
        p.alpha = Math.sin(Math.max(0, Math.min(1, lifeRatio)) * Math.PI) * p.baseAlpha;

        if (p.y < -15) {
          p.y = h + 15;
          p.x = Math.random() * w;
        }

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255, 238, 175, ${p.alpha})`;
        ctx.shadowBlur = 6;
        ctx.shadowColor = "rgba(255, 215, 120, 0.75)";
        ctx.fill();
      }
      animId = requestAnimationFrame(render);
    };

    render();

    return () => {
      if (animId) cancelAnimationFrame(animId);
      window.removeEventListener("resize", onResize);
      wrap.remove();
    };
  };

  /* ---------- Controle de volume (pílula no canto) ---------- */
  const buildVolumePill = () => {
    if (document.querySelector(".et-bgm")) return;
    const pill = el("div", "et-bgm");
    const button = el("button", "et-bgm-btn");
    button.type = "button";
    button.title = "Mute / unmute";
    const icon = el("i", "fa-solid");
    button.append(icon);

    const slider = el("input");
    slider.type = "range";
    slider.min = "0";
    slider.max = "1";
    slider.step = "0.01";
    slider.value = String(prefs.volume);
    slider.setAttribute("aria-label", "Music volume");

    const refresh = () => {
      const silent = prefs.muted || prefs.volume === 0;
      icon.className = "fa-solid " + (silent ? "fa-volume-xmark" : prefs.volume < 0.5 ? "fa-volume-low" : "fa-volume-high");
    };

    button.addEventListener("click", () => {
      prefs.muted = !prefs.muted;
      applyAudioPrefs();
      refresh();
      if (bgm.paused) bgm.play().catch(() => {});
    });

    slider.addEventListener("input", () => {
      prefs.volume = parseFloat(slider.value);
      if (prefs.volume > 0) prefs.muted = false;
      applyAudioPrefs();
      refresh();
    });

    refresh();
    pill.append(button, slider);
    document.body.append(pill);
  };

  /* ---------- Custom Frosted Glass User Select Dropdown ---------- */
  const enhanceUserSelect = () => {
    const select = document.querySelector('#join-game-form select[name="userid"]');
    if (!select || select.dataset.etEnhanced === "true") return;

    select.dataset.etEnhanced = "true";
    select.classList.add("et-hidden-native");

    const container = el("div", "et-dropdown");
    const trigger = el("button", "et-dropdown-trigger");
    trigger.type = "button";
    trigger.setAttribute("aria-haspopup", "listbox");
    trigger.setAttribute("aria-expanded", "false");

    const triggerLabel = el("span", "et-dropdown-label");
    const triggerIcon = el("i", "fa-solid fa-chevron-down et-chevron");
    trigger.append(triggerLabel, triggerIcon);

    const menu = el("div", "et-dropdown-menu");
    menu.setAttribute("role", "listbox");

    container.append(trigger, menu);
    select.parentNode.insertBefore(container, select);

    const updateLabel = () => {
      const selected = select.selectedOptions[0];
      triggerLabel.textContent = (selected && selected.value)
        ? selected.textContent
        : (select.options[0]?.textContent.trim() || "Select User");
    };

    const buildItems = () => {
      menu.innerHTML = "";
      Array.from(select.options).forEach((opt) => {
        if (!opt.value && !opt.textContent.trim()) return;
        const item = el("div", "et-dropdown-item");
        item.setAttribute("role", "option");
        item.dataset.value = opt.value;

        const nameSpan = el("span", "et-item-name", opt.textContent);
        item.append(nameSpan);

        if (opt.value === select.value) {
          item.classList.add("is-selected");
          item.setAttribute("aria-selected", "true");
          const check = el("i", "fa-solid fa-check et-item-check");
          item.append(check);
        }

        if (opt.disabled) {
          item.classList.add("is-disabled");
          const badge = el("span", "et-item-badge", "(online)");
          item.append(badge);
        } else {
          item.addEventListener("click", (e) => {
            e.stopPropagation();
            select.value = opt.value;
            select.dispatchEvent(new Event("change", { bubbles: true }));
            updateLabel();
            closeDropdown();
            playClick();
          });
        }

        menu.append(item);
      });
      updateLabel();
    };

    const openDropdown = () => {
      buildItems();
      container.classList.add("is-open");
      trigger.setAttribute("aria-expanded", "true");
    };

    const closeDropdown = () => {
      container.classList.remove("is-open");
      trigger.setAttribute("aria-expanded", "false");
    };

    const toggleDropdown = (e) => {
      e.stopPropagation();
      e.preventDefault();
      if (container.classList.contains("is-open")) closeDropdown();
      else openDropdown();
    };

    trigger.addEventListener("click", toggleDropdown);

    // Fechar ao clicar fora
    const onClickOutside = (e) => {
      if (!container.contains(e.target)) closeDropdown();
    };
    document.addEventListener("click", onClickOutside);

    // Fechar ao pressionar Escape
    const onKeyDown = (e) => {
      if (e.key === "Escape" && container.classList.contains("is-open")) {
        closeDropdown();
        trigger.focus();
      }
    };
    document.addEventListener("keydown", onKeyDown);

    // Sincronizar se o select mudar externamente
    select.addEventListener("change", updateLabel);

    // Observer para caso as opções mudem (ex: jogadores conectando/desconectando)
    const optObserver = new MutationObserver(() => {
      if (container.classList.contains("is-open")) buildItems();
      else updateLabel();
    });
    optObserver.observe(select, { childList: true, subtree: true, attributes: true });

    buildItems();
  };

  /* ---------- Splash "Click to enter" ---------- */
  const startSplash = () => {
    document.documentElement.classList.add("et-world", "et-gate");
    document.body.classList.add("et-world", "et-gate");

    const cleanupBg = mountLivingBackground();

    const overlay = el("div", "et-gate-overlay");
    overlay.append(el("div", "et-touch", "Click to enter"));
    document.body.append(overlay);

    let entered = false;
    const enter = () => {
      if (entered) return;
      entered = true;
      document.removeEventListener("keydown", onKey);

      playClick();
      applyAudioPrefs();
      bgm.play().catch(() => {});
      buildVolumePill();
      enhanceUserSelect();

      document.documentElement.classList.remove("et-gate");
      document.documentElement.classList.add("et-entered");
      document.body.classList.replace("et-gate", "et-entered");
      overlay.classList.add("et-leaving");
      setTimeout(() => overlay.remove(), 700);
    };

    const onKey = (event) => {
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        enter();
      }
    };

    overlay.addEventListener("pointerdown", enter);
    document.addEventListener("keydown", onKey);

    // Som de clique ao entrar na sessão (botão ou Enter no formulário)
    const onSubmit = (event) => {
      if (event.target.querySelector?.('button[name="join"]')) playClick();
    };
    document.addEventListener("submit", onSubmit, true);

    // Desfaz tudo se o mundo não for o Endless Tower
    return () => {
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("submit", onSubmit, true);
      overlay.remove();
      if (typeof cleanupBg === "function") cleanupBg();
      const video = document.getElementById("et-bg-video");
      if (video) video.remove();
      document.documentElement.classList.remove("et-world", "et-gate", "et-entered");
      document.body.classList.remove("et-world", "et-gate", "et-entered");
    };
  };

  /* ---------- Ativação ---------- */
  let teardown = null;
  if (isTargetWorld) teardown = startSplash();

  const confirmWorld = () => {
    if (!document.querySelector("#join-game-form")) return false;
    const hasMarker = !!document.querySelector(MARKER);
    if (hasMarker && !teardown) teardown = startSplash();
    else if (!hasMarker && !isTargetWorld && teardown) { teardown(); teardown = null; }
    if (isTargetWorld || hasMarker) enhanceUserSelect();
    return true;
  };

  confirmWorld();

  const bodyObserver = new MutationObserver(() => {
    confirmWorld();
  });
  bodyObserver.observe(document.body, { childList: true, subtree: true });
})();
