import { MODULE_ID, MODULE_TITLE } from "../../constants";
import designSystemCss from "../../../styles/design-system.css?inline";
import { startParticleCanvas, type ParticleController } from "../landing-scene";
import { BannerService, type BannerOptions } from "./banner-service";
import { registerEndlessTowerSheets } from "./celestial-sheets";
import { ChatEnhancer } from "./chat-enhancer";
import { GLOBAL_PARTICLE_COUNT, UI_TEXT } from "./config";
import {
  AGENTIC_DESIGN_TOKENS,
  COMPONENT_CONTRACTS,
  auditAgenticTokens,
  type AgenticTokenDefinition,
  type ComponentContract,
  type DesignSystemAuditReport,
} from "./rules";
import { DesignSystemSound } from "./sound-effects";

/**
 * Master controller for the Celestial Chronicle Design System, coordinating theme styles,
 * audio dispatch, banners, chat enhancement, opt-in actor sheets, and WCAG token audits.
 */
export class DesignSystem {
  private static instance: DesignSystem | null = null;
  private particleController: ParticleController | null = null;
  private particleCanvasEl: HTMLCanvasElement | null = null;

  private constructor() {}

  public static getInstance(): DesignSystem {
    if (!DesignSystem.instance) {
      DesignSystem.instance = new DesignSystem();
    }
    return DesignSystem.instance;
  }

  public init(): void {
    this.injectStyles();
    this.registerSettings();

    DesignSystemSound.getInstance().init();
    BannerService.getInstance().init();
    ChatEnhancer.getInstance().init();

    this.registerHooks();
    console.log(`${MODULE_TITLE} | Celestial Chronicle Design System initialized.`);
  }

  private injectStyles(): void {
    if (document.getElementById("et-design-system-styles")) return;
    const styleEl = document.createElement("style");
    styleEl.id = "et-design-system-styles";
    styleEl.textContent = designSystemCss;
    document.head.appendChild(styleEl);
  }

  private registerSettings(): void {
    const s = (game as any).settings;
    if (!s) return;

    s.register(MODULE_ID, "dsEnableTheme", {
      name: UI_TEXT.settingThemeName,
      hint: UI_TEXT.settingThemeHint,
      scope: "client",
      config: true,
      type: Boolean,
      default: true,
      onChange: (enabled: boolean) => {
        if (enabled) {
          document.body.classList.add("et-celestial-active");
        } else {
          document.body.classList.remove("et-celestial-active");
        }
      },
    });

    s.register(MODULE_ID, "dsEnableGlobalParticles", {
      name: UI_TEXT.settingGlobalParticlesName,
      hint: UI_TEXT.settingGlobalParticlesHint,
      scope: "client",
      config: true,
      type: Boolean,
      default: false,
      onChange: (enabled: boolean) => {
        if (enabled) {
          this.startGlobalParticles();
        } else {
          this.stopGlobalParticles();
        }
      },
    });
  }

  private registerHooks(): void {
    Hooks.once("setup", () => {
      registerEndlessTowerSheets();
    });

    Hooks.once("ready", () => {
      document.body.classList.add("et-celestial-active");

      const enableParticles =
        (game as any).settings?.get?.(MODULE_ID, "dsEnableGlobalParticles") ?? false;
      if (enableParticles) {
        this.startGlobalParticles();
      }
    });
  }

  public startGlobalParticles(): void {
    if (this.particleController) return;

    let canvasEl = document.getElementById("et-global-particles") as HTMLCanvasElement | null;
    if (!canvasEl) {
      canvasEl = document.createElement("canvas");
      canvasEl.id = "et-global-particles";
      document.body.appendChild(canvasEl);
    }

    this.particleCanvasEl = canvasEl;
    this.particleController = startParticleCanvas(canvasEl, GLOBAL_PARTICLE_COUNT);
  }

  public stopGlobalParticles(): void {
    if (this.particleController) {
      this.particleController.stop();
      this.particleController = null;
    }
    if (this.particleCanvasEl) {
      this.particleCanvasEl.remove();
      this.particleCanvasEl = null;
    }
  }

  public showBanner(options: BannerOptions): void {
    BannerService.getInstance().show(options);
  }

  public playSound(soundName: any, vol = 1.0): void {
    DesignSystemSound.getInstance().play(soundName, vol);
  }

  public getTokens(): Record<string, AgenticTokenDefinition> {
    return AGENTIC_DESIGN_TOKENS;
  }

  public getContracts(): Record<string, ComponentContract> {
    return COMPONENT_CONTRACTS;
  }

  /**
   * Executes deterministic WCAG 2.1, anti-halation, and 60-30-10 audits across registered tokens.
   */
  public auditTokens(): DesignSystemAuditReport {
    return auditAgenticTokens();
  }
}

/**
 * Registers and initializes the Celestial Chronicle Design System.
 */
export function registerDesignSystem(): void {
  DesignSystem.getInstance().init();
}
