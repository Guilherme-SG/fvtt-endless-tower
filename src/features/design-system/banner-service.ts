import { MODULE_ID, MODULE_TITLE } from "../../constants";
import {
  BANNER_CUSTOM_SOUND_SCALE,
  BANNER_TRANSITION_DELAY_MS,
  DEFAULT_BANNER_DURATION_MS,
  SOCKET_ACTION_BANNER,
} from "./config";
import { DesignSystemSound, type UISoundType } from "./sound-effects";

export type BannerType = "encounter" | "victory" | "celestial" | "arcane" | "curse";

export interface BannerOptions {
  title: string;
  subtitle?: string;
  crest?: string;
  type?: BannerType;
  duration?: number;
  sound?: string | boolean;
  onComplete?: () => void;
  broadcast?: boolean;
}

/**
 * Queues and displays fullscreen edge-to-edge cinematic ribbon banners with optional socket broadcast.
 */
export class BannerService {
  private static instance: BannerService | null = null;
  private overlayEl: HTMLElement | null = null;
  private crestEl: HTMLElement | null = null;
  private titleEl: HTMLElement | null = null;
  private subtitleEl: HTMLElement | null = null;
  private queue: BannerOptions[] = [];
  private isShowing = false;
  private hideTimer: number | null = null;

  private constructor() {}

  public static getInstance(): BannerService {
    if (!BannerService.instance) {
      BannerService.instance = new BannerService();
    }
    return BannerService.instance;
  }

  public init(): void {
    this.injectOverlayDOM();
    this.registerSocketListener();
    console.log(`${MODULE_TITLE} | Cinematic BannerService initialized.`);
  }

  private injectOverlayDOM(): void {
    if (document.getElementById("et-universal-banner-overlay")) {
      this.overlayEl = document.getElementById("et-universal-banner-overlay");
      this.crestEl = this.overlayEl?.querySelector(".et-banner-crest") ?? null;
      this.titleEl = this.overlayEl?.querySelector(".et-banner-title") ?? null;
      this.subtitleEl = this.overlayEl?.querySelector(".et-banner-subtitle") ?? null;
      return;
    }

    const overlay = document.createElement("div");
    overlay.id = "et-universal-banner-overlay";
    overlay.className = "et-banner-overlay";
    overlay.innerHTML = `
      <div class="et-banner-vignette"></div>
      <div class="et-banner-ribbon">
        <div class="et-banner-crest">
          <span class="et-rune-sparkle">✦</span>
          <i class="fas fa-crown"></i>
          <span class="et-rune-sparkle">✦</span>
        </div>
        <h1 class="et-banner-title"></h1>
        <div class="et-banner-divider"></div>
        <p class="et-banner-subtitle"></p>
      </div>
    `;

    document.body.appendChild(overlay);
    this.overlayEl = overlay;
    this.crestEl = overlay.querySelector(".et-banner-crest");
    this.titleEl = overlay.querySelector(".et-banner-title");
    this.subtitleEl = overlay.querySelector(".et-banner-subtitle");
  }

  private registerSocketListener(): void {
    Hooks.once("ready", () => {
      const socket = (game as any).socket;
      if (!socket) return;

      socket.on(`module.${MODULE_ID}`, (data: any) => {
        if (data?.action === SOCKET_ACTION_BANNER && data?.payload) {
          this.enqueue(data.payload, false);
        }
      });
    });
  }

  /**
   * Displays an edge-to-edge cinematic banner, optionally broadcasting to all clients when called by a GM.
   */
  public show(options: BannerOptions): void {
    if (options.broadcast && (game.user as any)?.isGM) {
      const socket = (game as any).socket;
      if (socket) {
        socket.emit(`module.${MODULE_ID}`, {
          action: SOCKET_ACTION_BANNER,
          payload: { ...options, broadcast: false },
        });
      }
    }

    this.enqueue(options, true);
  }

  private enqueue(options: BannerOptions, _isOriginator: boolean): void {
    this.queue.push(options);
    if (!this.isShowing) {
      this.processNext();
    }
  }

  private processNext(): void {
    if (this.queue.length === 0) {
      this.isShowing = false;
      return;
    }

    this.isShowing = true;
    const current = this.queue.shift()!;
    this.displayBanner(current);
  }

  private displayBanner(opts: BannerOptions): void {
    if (!this.overlayEl) this.injectOverlayDOM();
    if (!this.overlayEl) return;

    const bannerType: BannerType = opts.type ?? "celestial";
    const duration = opts.duration ?? DEFAULT_BANNER_DURATION_MS;

    this.overlayEl.classList.remove(
      "et-type-encounter",
      "et-type-victory",
      "et-type-celestial",
      "et-type-arcane",
      "et-type-curse"
    );
    this.overlayEl.classList.add(`et-type-${bannerType}`);

    if (this.titleEl) {
      this.titleEl.textContent = opts.title.trim().toUpperCase();
    }

    if (this.subtitleEl) {
      if (opts.subtitle && opts.subtitle.trim().length > 0) {
        this.subtitleEl.textContent = opts.subtitle.trim();
        this.subtitleEl.style.display = "block";
      } else {
        this.subtitleEl.style.display = "none";
      }
    }

    if (this.crestEl) {
      if (opts.crest) {
        this.crestEl.innerHTML = opts.crest;
      } else {
        this.crestEl.innerHTML = this.getDefaultCrestForType(bannerType);
      }
    }

    this.playBannerSound(opts.sound, bannerType);
    this.overlayEl.classList.add("et-active");

    if (this.hideTimer) {
      window.clearTimeout(this.hideTimer);
      this.hideTimer = null;
    }

    this.hideTimer = window.setTimeout(() => {
      this.overlayEl?.classList.remove("et-active");

      window.setTimeout(() => {
        try {
          opts.onComplete?.();
        } catch (err) {
          console.error(`${MODULE_TITLE} | Error in banner onComplete callback:`, err);
        }
        this.processNext();
      }, BANNER_TRANSITION_DELAY_MS);
    }, duration);
  }

  private getDefaultCrestForType(type: BannerType): string {
    switch (type) {
      case "encounter":
        return `<span class="et-rune-sparkle">✦</span> <i class="fas fa-skull"></i> <span class="et-rune-sparkle">✦</span>`;
      case "victory":
        return `<span class="et-rune-sparkle">✦</span> <i class="fas fa-trophy"></i> <span class="et-rune-sparkle">✦</span>`;
      case "arcane":
        return `<span class="et-rune-sparkle">✦</span> <i class="fas fa-wand-magic-sparkles"></i> <span class="et-rune-sparkle">✦</span>`;
      case "curse":
        return `<span class="et-rune-sparkle">✦</span> <i class="fas fa-eye"></i> <span class="et-rune-sparkle">✦</span>`;
      case "celestial":
      default:
        return `<span class="et-rune-sparkle">✦</span> <i class="fas fa-crown"></i> <span class="et-rune-sparkle">✦</span>`;
    }
  }

  private playBannerSound(customSound: string | boolean | undefined, type: BannerType): void {
    if (customSound === false) return;

    if (typeof customSound === "string" && customSound.trim().length > 0) {
      try {
        const audio = new Audio(customSound);
        audio.volume = DesignSystemSound.getInstance().getMasterVolume() * BANNER_CUSTOM_SOUND_SCALE;
        audio.play().catch(() => {});
        return;
      } catch {
        // Ignore custom audio errors
      }
    }

    const soundManager = DesignSystemSound.getInstance();
    let soundType: UISoundType = "bannerCelestial";

    switch (type) {
      case "encounter":
        soundType = "bannerEncounter";
        break;
      case "victory":
        soundType = "bannerVictory";
        break;
      case "arcane":
        soundType = "bannerArcane";
        break;
      case "curse":
        soundType = "criticalFail";
        break;
      case "celestial":
      default:
        soundType = "bannerCelestial";
        break;
    }

    soundManager.play(soundType);
  }
}
