import { MODULE_ID, MODULE_TITLE } from "../../constants";
import { type ChronicleState, type Quote } from "../../types/chronicle";
import defaultQuotesJson from "../../../data/quotes.json";
import chronicleCss from "../../../styles/chronicle.css?inline";
import { startParticleCanvas, type ParticleController } from "../landing-scene";
import {
  DEFAULT_CYCLE_INTERVAL_SEC,
  DEFAULT_GIFT_CHANCE_PERCENT,
  DEFAULT_LANDSCAPE_SRC,
  DEFAULT_MIN_DURATION_SEC,
  DEFAULT_SPLASH_FOLDER,
  GATE_REVEAL_DURATION_MS,
  MIN_CYCLE_INTERVAL_SEC,
  QUOTE_FADE_DURATION_MS,
  TRANSITION_PARTICLE_COUNT,
  UI_TEXT,
} from "./config";
import {
  calculateRemainingTransitionMs,
  formatQuoteHTML,
  parseQuoteText,
  shouldTriggerSecretGift,
  shuffleDeck,
} from "./rules";

/**
 * Manages the Celestial Chronicle quote deck, custom RollTable overrides, and rare GM secret messages.
 */
export class QuoteManager {
  private static instance: QuoteManager | null = null;
  private defaultQuotes: Quote[] = defaultQuotesJson as Quote[];
  private activeDeck: Quote[] = [];
  private currentQuote: Quote | null = null;

  private constructor() {
    this.refreshDeck();
  }

  public static getInstance(): QuoteManager {
    if (!QuoteManager.instance) {
      QuoteManager.instance = new QuoteManager();
    }
    return QuoteManager.instance;
  }

  public init(): void {
    this.refreshDeck();
  }

  public refreshDeck(): void {
    let combinedQuotes: Quote[] = [...this.defaultQuotes];

    try {
      const customTableId = (game as any).settings?.get(MODULE_ID, "chronicleRollTableId");
      if (customTableId && customTableId !== "none") {
        const table = (game as any).tables?.get(customTableId);
        if (table && table.results) {
          const tableQuotes: Quote[] = [];
          for (const result of table.results) {
            const rawText = result.name || result.description || "";
            if (!rawText.trim()) continue;
            tableQuotes.push(parseQuoteText(rawText));
          }
          if (tableQuotes.length > 0) {
            combinedQuotes = tableQuotes;
          }
        }
      }
    } catch {
      // Ignore when settings are not yet initialized
    }

    this.activeDeck = shuffleDeck(combinedQuotes);
    if (!this.currentQuote && this.activeDeck.length > 0) {
      this.currentQuote = this.activeDeck[0];
    }
  }

  private checkSecretGift(): Quote | null {
    try {
      const giftEnabled = Boolean((game as any).settings?.get(MODULE_ID, "chronicleGiftEnabled"));
      if (!giftEnabled) return null;

      const giftChance = Number(
        (game as any).settings?.get(MODULE_ID, "chronicleGiftChance") ??
          DEFAULT_GIFT_CHANCE_PERCENT
      );
      const { triggered, rollPercent } = shouldTriggerSecretGift(giftEnabled, giftChance);

      if (triggered) {
        const giftMessage =
          (game as any).settings?.get(MODULE_ID, "chronicleGiftMessage") || "";
        const giftAuthor =
          (game as any).settings?.get(MODULE_ID, "chronicleGiftAuthor") ||
          UI_TEXT.settingGiftAuthorDefault;
        if (giftMessage && typeof giftMessage === "string" && giftMessage.trim()) {
          console.log(
            `${MODULE_TITLE} | *** EASTER EGG TRIGGERED: Secret message drawn! (Roll: ${rollPercent.toFixed(2)} < Chance: ${giftChance}%) ***`
          );
          return {
            text: giftMessage.trim(),
            author: giftAuthor.trim() || UI_TEXT.settingGiftAuthorDefault,
          };
        }
      }
    } catch {
      // Ignore if world settings are not ready yet
    }
    return null;
  }

  public getNextQuote(): Quote {
    const secretGift = this.checkSecretGift();
    if (secretGift) {
      this.currentQuote = secretGift;
      return secretGift;
    }

    if (this.activeDeck.length === 0) {
      this.refreshDeck();
    }
    if (this.activeDeck.length === 0) {
      return {
        text: UI_TEXT.fallbackQuoteText,
        author: UI_TEXT.fallbackQuoteAuthor,
      };
    }

    const next = this.activeDeck.pop()!;
    this.currentQuote = next;
    return next;
  }

  public getCurrentQuote(): Quote {
    if (!this.currentQuote) {
      return this.getNextQuote();
    }
    return this.currentQuote;
  }
}

/**
 * Controls the Celestial Chronicle pause overlay and full-screen scene transition curtain.
 */
export class CelestialChronicle {
  private static instance: CelestialChronicle | null = null;

  private state: ChronicleState = "IDLE";
  private quoteManager: QuoteManager;
  private particleController: ParticleController | null = null;

  private pauseOverlayEl: HTMLElement | null = null;
  private pauseTextEl: HTMLElement | null = null;
  private pauseAuthorEl: HTMLElement | null = null;

  private transitionScreenEl: HTMLElement | null = null;
  private transitionBgEl: HTMLImageElement | null = null;
  private transitionTextEl: HTMLElement | null = null;
  private transitionAuthorEl: HTMLElement | null = null;
  private transitionParticlesEl: HTMLCanvasElement | null = null;

  private isWorldReady = false;
  private cycleTimer: number | null = null;
  private transitionStartTime = 0;
  private transitionTimeout: number | null = null;
  private isCanvasReady = false;
  private isTransitionRevealing = false;

  private constructor() {
    this.quoteManager = QuoteManager.getInstance();
  }

  public static getInstance(): CelestialChronicle {
    if (!CelestialChronicle.instance) {
      CelestialChronicle.instance = new CelestialChronicle();
    }
    return CelestialChronicle.instance;
  }

  public init(): void {
    this.injectStyles();
    this.registerSettings();
    this.quoteManager.init();
    this.injectDOM();
    this.registerHooks();
    this.suppressNativePause();
    console.log(`${MODULE_TITLE} | Celestial Chronicle initialized.`);
  }

  private injectStyles(): void {
    if (document.getElementById("et-chronicle-styles")) return;
    const styleEl = document.createElement("style");
    styleEl.id = "et-chronicle-styles";
    styleEl.textContent = chronicleCss;
    document.head.appendChild(styleEl);
  }

  /**
   * Hides Foundry's native #pause element so only the Celestial Chronicle lower-third renders.
   */
  public suppressNativePause(): void {
    const pauseEl = document.getElementById("pause");
    if (pauseEl) {
      pauseEl.style.setProperty("display", "none", "important");
    }
  }

  private registerSettings(): void {
    const s = (game as any).settings;

    s.register(MODULE_ID, "chronicleEnableTransitions", {
      name: UI_TEXT.settingEnableTransitionsName,
      hint: UI_TEXT.settingEnableTransitionsHint,
      scope: "client",
      config: true,
      type: Boolean,
      default: true,
    });

    s.register(MODULE_ID, "chronicleEnablePause", {
      name: UI_TEXT.settingEnablePauseName,
      hint: UI_TEXT.settingEnablePauseHint,
      scope: "client",
      config: true,
      type: Boolean,
      default: true,
    });

    s.register(MODULE_ID, "chronicleMinDuration", {
      name: UI_TEXT.settingMinDurationName,
      hint: UI_TEXT.settingMinDurationHint,
      scope: "client",
      config: true,
      type: Number,
      range: {
        min: 1,
        max: 8,
        step: 0.5,
      },
      default: DEFAULT_MIN_DURATION_SEC,
    });

    s.register(MODULE_ID, "chronicleCycleInterval", {
      name: UI_TEXT.settingCycleIntervalName,
      hint: UI_TEXT.settingCycleIntervalHint,
      scope: "client",
      config: true,
      type: Number,
      range: {
        min: MIN_CYCLE_INTERVAL_SEC,
        max: 180,
        step: 5,
      },
      default: DEFAULT_CYCLE_INTERVAL_SEC,
    });

    s.register(MODULE_ID, "chronicleRollTableId", {
      name: UI_TEXT.settingRollTableName,
      hint: UI_TEXT.settingRollTableHint,
      scope: "world",
      config: true,
      type: String,
      choices: () => {
        const choices: Record<string, string> = { none: UI_TEXT.settingRollTableNoneChoice };
        const tables = (game as any).tables;
        if (tables) {
          for (const t of tables) {
            choices[t.id] = t.name;
          }
        }
        return choices;
      },
      default: "none",
      onChange: () => {
        this.quoteManager.refreshDeck();
      },
    });

    s.register(MODULE_ID, "chronicleSplashFolder", {
      name: UI_TEXT.settingSplashFolderName,
      hint: UI_TEXT.settingSplashFolderHint,
      scope: "world",
      config: true,
      type: String,
      default: DEFAULT_SPLASH_FOLDER,
    });

    s.register(MODULE_ID, "chronicleGiftEnabled", {
      name: UI_TEXT.settingGiftEnabledName,
      hint: UI_TEXT.settingGiftEnabledHint,
      scope: "world",
      config: true,
      type: Boolean,
      default: true,
    });

    s.register(MODULE_ID, "chronicleGiftChance", {
      name: UI_TEXT.settingGiftChanceName,
      hint: UI_TEXT.settingGiftChanceHint,
      scope: "world",
      config: true,
      type: Number,
      range: {
        min: 0.1,
        max: 10.0,
        step: 0.1,
      },
      default: DEFAULT_GIFT_CHANCE_PERCENT,
    });

    s.register(MODULE_ID, "chronicleGiftMessage", {
      name: UI_TEXT.settingGiftMessageName,
      hint: UI_TEXT.settingGiftMessageHint,
      scope: "world",
      config: true,
      type: String,
      default: UI_TEXT.settingGiftMessageDefault,
    });

    s.register(MODULE_ID, "chronicleGiftAuthor", {
      name: UI_TEXT.settingGiftAuthorName,
      hint: UI_TEXT.settingGiftAuthorHint,
      scope: "world",
      config: true,
      type: String,
      default: UI_TEXT.settingGiftAuthorDefault,
    });
  }

  private injectDOM(): void {
    if (document.getElementById("et-pause-overlay")) return;

    const pauseOverlay = document.createElement("div");
    pauseOverlay.id = "et-pause-overlay";
    pauseOverlay.innerHTML = `
      <div class="et-pause-vignette"></div>
      <div class="et-pause-bar">
        <div class="et-pause-glyph" title="${UI_TEXT.pauseTooltip}">
          <span class="et-rune-sparkle">✧</span>
          <span class="et-rune-bars">||</span>
          <span class="et-rune-sparkle">✧</span>
        </div>
        <div class="et-pause-content">
          <p class="et-quote-text"></p>
          <span class="et-quote-author"></span>
        </div>
      </div>
    `;
    document.body.appendChild(pauseOverlay);

    this.pauseOverlayEl = pauseOverlay;
    this.pauseTextEl = pauseOverlay.querySelector(".et-quote-text");
    this.pauseAuthorEl = pauseOverlay.querySelector(".et-quote-author");

    const transitionScreen = document.createElement("div");
    transitionScreen.id = "et-transition-screen";
    transitionScreen.innerHTML = `
      <img class="et-transition-bg" src="" alt="${UI_TEXT.transitionAlt}" />
      <div class="et-transition-overlay"></div>
      <div class="et-transition-rays"></div>
      <canvas id="et-transition-particles"></canvas>
      <div class="et-transition-card">
        <p class="et-quote-text"></p>
        <span class="et-quote-author"></span>
      </div>
      <div class="et-transition-hint">${UI_TEXT.transitionHint}</div>
    `;
    document.body.appendChild(transitionScreen);

    this.transitionScreenEl = transitionScreen;
    this.transitionBgEl = transitionScreen.querySelector(".et-transition-bg");
    this.transitionTextEl = transitionScreen.querySelector(".et-transition-card .et-quote-text");
    this.transitionAuthorEl = transitionScreen.querySelector(".et-transition-card .et-quote-author");
    this.transitionParticlesEl = transitionScreen.querySelector("#et-transition-particles");

    transitionScreen.addEventListener("click", () => {
      this.handleEarlyDismiss();
    });
  }

  private registerHooks(): void {
    Hooks.on("renderGamePause", (_app: any, html: any) => {
      this.suppressNativePause();
      const root = html instanceof HTMLElement ? html : html?.[0];
      if (root) {
        root.style.setProperty("display", "none", "important");
      }
      this.syncPause("renderGamePause");
    });

    Hooks.on("pauseGame", () => {
      this.syncPause("pauseGame");
    });

    Hooks.once("ready", () => {
      this.isWorldReady = true;
      this.ensureDOM();
      this.suppressNativePause();
      this.syncPause("ready");
    });

    Hooks.on("canvasInit", () => {
      this.handleCanvasInit();
    });

    Hooks.on("canvasReady", () => {
      this.handleCanvasReady();
    });

    Hooks.on("renderSceneConfig", (app: any, html: any) => {
      this.injectSceneConfigField(app, html);
    });
  }

  private ensureDOM(): void {
    if (!document.getElementById("et-pause-overlay") || !this.pauseOverlayEl?.isConnected) {
      this.pauseOverlayEl = null;
      this.transitionScreenEl?.remove();
      document.getElementById("et-pause-overlay")?.remove();
      this.injectDOM();
    }
  }

  private syncPause(origin = "manual"): void {
    try {
      const paused = Boolean((game as any).paused);
      const enabled = (game as any).settings?.get(MODULE_ID, "chronicleEnablePause") !== false;
      console.log(`${MODULE_TITLE} | syncPause(${origin}) paused=${paused} enabled=${enabled}`);

      if (paused && enabled) {
        if (!this.pauseOverlayEl?.classList.contains("et-active")) {
          this.state = "PAUSED";
          this.showPauseOverlay();
        }
      } else {
        this.state = "IDLE";
        this.hidePauseOverlay();
      }
    } catch (err) {
      console.error(`${MODULE_TITLE} | Error in syncPause:`, err);
    }
  }

  /**
   * Returns runtime diagnostics for console inspection (`api.chronicle.debug()`).
   */
  public debug(): Record<string, unknown> {
    const overlay = document.getElementById("et-pause-overlay");
    const info = {
      paused: (game as any).paused,
      state: this.state,
      worldReady: this.isWorldReady,
      overlayInDom: !!overlay,
      overlayClasses: overlay?.className,
      overlayDisplay: overlay ? getComputedStyle(overlay).display : null,
      overlayOpacity: overlay ? getComputedStyle(overlay).opacity : null,
      overlayZ: overlay ? getComputedStyle(overlay).zIndex : null,
      transitionClasses: this.transitionScreenEl?.className,
      settingEnablePause: (game as any).settings?.get(MODULE_ID, "chronicleEnablePause"),
    };
    console.table(info);
    return info;
  }

  private showPauseOverlay(quote?: Quote): void {
    this.ensureDOM();
    if (!this.pauseOverlayEl) return;

    const currentQuote = quote || this.quoteManager.getNextQuote();

    if (this.pauseTextEl && this.pauseAuthorEl) {
      this.pauseTextEl.innerHTML = formatQuoteHTML(currentQuote.text);
      this.pauseAuthorEl.textContent = `— ${currentQuote.author.toUpperCase()}`;
    }

    const contentEl = this.pauseOverlayEl.querySelector(".et-pause-content");
    contentEl?.classList.remove("et-fade");

    this.pauseOverlayEl.classList.add("et-active");
    this.startQuoteCycling();
  }

  private hidePauseOverlay(): void {
    if (!this.pauseOverlayEl) return;
    this.pauseOverlayEl.classList.remove("et-active");
    this.stopQuoteCycling();
  }

  private updatePauseQuote(quote: Quote): void {
    if (!this.pauseTextEl || !this.pauseAuthorEl) return;

    const contentEl = this.pauseOverlayEl?.querySelector(".et-pause-content");
    if (contentEl) {
      contentEl.classList.add("et-fade");
      setTimeout(() => {
        if (this.pauseTextEl && this.pauseAuthorEl) {
          this.pauseTextEl.innerHTML = formatQuoteHTML(quote.text);
          this.pauseAuthorEl.textContent = `— ${quote.author.toUpperCase()}`;
        }
        contentEl.classList.remove("et-fade");
      }, QUOTE_FADE_DURATION_MS);
    } else {
      this.pauseTextEl.innerHTML = formatQuoteHTML(quote.text);
      this.pauseAuthorEl.textContent = `— ${quote.author.toUpperCase()}`;
    }
  }

  private startQuoteCycling(): void {
    this.stopQuoteCycling();

    const intervalSeconds =
      (game as any).settings?.get(MODULE_ID, "chronicleCycleInterval") ||
      DEFAULT_CYCLE_INTERVAL_SEC;
    const intervalMs = Math.max(MIN_CYCLE_INTERVAL_SEC, intervalSeconds) * 1000;

    this.cycleTimer = window.setInterval(() => {
      if (this.state === "PAUSED") {
        const nextQuote = this.quoteManager.getNextQuote();
        this.updatePauseQuote(nextQuote);
      }
    }, intervalMs);
  }

  private stopQuoteCycling(): void {
    if (this.cycleTimer !== null) {
      clearInterval(this.cycleTimer);
      this.cycleTimer = null;
    }
  }

  private async handleCanvasInit(): Promise<void> {
    if (!this.isWorldReady) return;

    const enableTransitions = (game as any).settings?.get(MODULE_ID, "chronicleEnableTransitions");
    if (!enableTransitions) return;

    const isGamePaused = !!(game as any).paused;
    this.state = isGamePaused ? "TRANSITIONING_PAUSED" : "TRANSITIONING";

    if (this.pauseOverlayEl) {
      this.pauseOverlayEl.classList.remove("et-active");
    }

    this.isCanvasReady = false;
    this.isTransitionRevealing = false;
    this.transitionStartTime = Date.now();

    const splashSrc = await this.resolveSplashImage();
    if (this.transitionBgEl && splashSrc) {
      this.transitionBgEl.src = splashSrc;
    }

    const quote = this.quoteManager.getNextQuote();
    if (this.transitionTextEl && this.transitionAuthorEl) {
      this.transitionTextEl.innerHTML = formatQuoteHTML(quote.text);
      this.transitionAuthorEl.textContent = `— ${quote.author.toUpperCase()}`;
    }

    if (this.transitionScreenEl) {
      this.transitionScreenEl.classList.remove("et-gate-reveal");
      this.transitionScreenEl.classList.add("et-active");
    }

    if (this.transitionParticlesEl) {
      this.particleController?.stop();
      this.particleController = startParticleCanvas(
        this.transitionParticlesEl,
        TRANSITION_PARTICLE_COUNT
      );
    }
  }

  private handleCanvasReady(): void {
    if (!this.isWorldReady) return;

    this.isCanvasReady = true;

    if (this.state !== "TRANSITIONING" && this.state !== "TRANSITIONING_PAUSED") {
      return;
    }

    const minDurationSeconds =
      (game as any).settings?.get(MODULE_ID, "chronicleMinDuration") || DEFAULT_MIN_DURATION_SEC;
    const elapsed = Date.now() - this.transitionStartTime;
    const remaining = calculateRemainingTransitionMs(minDurationSeconds, elapsed);

    if (this.transitionTimeout !== null) {
      clearTimeout(this.transitionTimeout);
    }

    this.transitionTimeout = window.setTimeout(() => {
      this.triggerGateRevelation();
    }, remaining);
  }

  private handleEarlyDismiss(): void {
    if (this.isCanvasReady && !this.isTransitionRevealing) {
      if (this.transitionTimeout !== null) {
        clearTimeout(this.transitionTimeout);
        this.transitionTimeout = null;
      }
      this.triggerGateRevelation();
    }
  }

  private triggerGateRevelation(): void {
    if (this.isTransitionRevealing || !this.transitionScreenEl) return;
    this.isTransitionRevealing = true;

    this.transitionScreenEl.classList.add("et-gate-reveal");

    setTimeout(() => {
      this.particleController?.stop();
      this.particleController = null;

      if (this.transitionScreenEl) {
        this.transitionScreenEl.classList.remove("et-active", "et-gate-reveal");
      }

      const isGamePaused = !!(game as any).paused;
      this.state = isGamePaused ? "PAUSED" : "IDLE";
      this.isTransitionRevealing = false;

      this.pauseOverlayEl?.classList.remove("et-active");
      this.syncPause("transition-end");
    }, GATE_REVEAL_DURATION_MS);
  }

  private async resolveSplashImage(): Promise<string> {
    const scenes = (game as any).scenes;
    const activeScene = scenes?.active || scenes?.current;

    if (activeScene) {
      const customSceneSplash = activeScene.getFlag(MODULE_ID, "splashImage");
      if (customSceneSplash && typeof customSceneSplash === "string" && customSceneSplash.trim()) {
        return customSceneSplash.trim();
      }
    }

    try {
      const folder = (game as any).settings?.get(MODULE_ID, "chronicleSplashFolder");
      if (folder && (game as any).user?.isGM) {
        const fp = new (foundry.applications.apps.FilePicker as any).implementation({
          current: folder,
        });
        const browseResult = await (
          foundry.applications.apps.FilePicker as any
        ).implementation.browse(fp.activeSource, fp.target);
        if (browseResult && browseResult.files && browseResult.files.length > 0) {
          const validImages = browseResult.files.filter((f: string) =>
            /\.(webp|jpg|jpeg|png)$/i.test(f)
          );
          if (validImages.length > 0) {
            const randomIndex = Math.floor(Math.random() * validImages.length);
            return validImages[randomIndex];
          }
        }
      }
    } catch {
      // Ignore browse errors and fall back to default artwork
    }

    return DEFAULT_LANDSCAPE_SRC;
  }

  private injectSceneConfigField(app: any, html: any): void {
    const rootEl = html instanceof HTMLElement ? html : html[0];
    if (!rootEl) return;

    const scene = app.document;
    const currentVal = scene?.getFlag(MODULE_ID, "splashImage") || "";

    const formGroup = document.createElement("div");
    formGroup.className = "form-group";
    formGroup.innerHTML = `
      <label>${UI_TEXT.sceneConfigLabel}</label>
      <div class="form-fields">
        <button type="button" class="file-picker" data-type="imagevideo" data-target="flags.${MODULE_ID}.splashImage" title="${UI_TEXT.sceneConfigBrowseTitle}">
          <i class="fas fa-file-import fa-fw"></i>
        </button>
        <input class="image" type="text" name="flags.${MODULE_ID}.splashImage" placeholder="${UI_TEXT.sceneConfigPlaceholder}" value="${currentVal}">
      </div>
      <p class="notes">${UI_TEXT.sceneConfigNotes}</p>
    `;

    const targetTab =
      rootEl.querySelector('.tab[data-tab="basic"]') ||
      rootEl.querySelector('.tab[data-tab="background"]') ||
      rootEl.querySelector(".tab.active") ||
      rootEl.querySelector("form");

    if (targetTab) {
      targetTab.appendChild(formGroup);

      const btn = formGroup.querySelector("button.file-picker");
      const input = formGroup.querySelector('input[name="flags.' + MODULE_ID + '.splashImage"]');
      if (btn && input) {
        btn.addEventListener("click", () => {
          const fp = new (FilePicker as any)({
            type: "imagevideo",
            current: (input as HTMLInputElement).value || "",
            callback: (path: string) => {
              (input as HTMLInputElement).value = path;
            },
          });
          fp.render(true);
        });
      }
    }
  }

  /**
   * Cycles the pause quote immediately via the public API.
   */
  public triggerManualQuoteCycle(): void {
    const next = this.quoteManager.getNextQuote();
    if (this.state === "PAUSED") {
      this.updatePauseQuote(next);
    }
  }

  /**
   * Toggles the game pause state for GM macros or console usage.
   */
  public togglePause(): void {
    if ((game as any).user?.isGM) {
      (game as any).togglePause(!(game as any).paused, { broadcast: true });
    }
  }
}

/**
 * Registers the Celestial Chronicle pause and scene transition system.
 */
export function registerCelestialChronicleFeature(): void {
  CelestialChronicle.getInstance().init();
}
