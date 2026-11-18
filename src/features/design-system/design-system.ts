import { MODULE_ID, MODULE_TITLE } from "../../constants";
import designSystemCss from "../../../styles/design-system.css?inline";
import { DesignSystemSound } from "./sound-effects";
import { BannerService, BannerOptions } from "./banner-service";
import { ChatEnhancer } from "./chat-enhancer";
import { registerEndlessTowerSheets } from "./celestial-sheets";
import { ParticleController, startParticleCanvas } from "../particle-canvas";

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

    // Inicializa subsistemas
    DesignSystemSound.getInstance().init();
    BannerService.getInstance().init();
    ChatEnhancer.getInstance().init();

    this.registerHooks();
    console.log(`${MODULE_TITLE} | Celestial Chronicle Design System inicializado com sucesso.`);
  }

  /**
   * Injeta os estilos do Design System imediatamente no DOM para garantir renderização instantânea.
   */
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
      name: "Design System: Tema Celestial Chronicle",
      hint: "Aplica o visual unificado Dark Obsidian Glass & Celestial Gold em toda a interface do Foundry.",
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
      name: "Partículas Douradas Ambientais (Global)",
      hint: "Adiciona uma camada suave de partículas douradas flutuantes no fundo da mesa de jogo.",
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

      // Inicia partículas se configurado
      const enableParticles = (game as any).settings?.get?.(MODULE_ID, "dsEnableGlobalParticles") ?? false;
      if (enableParticles) {
        this.startGlobalParticles();
      }
    });
  }

  public startGlobalParticles(): void {
    if (this.particleController) return;

    let canvas = document.getElementById("et-global-particles") as HTMLCanvasElement | null;
    if (!canvas) {
      canvas = document.createElement("canvas");
      canvas.id = "et-global-particles";
      document.body.appendChild(canvas);
    }

    this.particleCanvasEl = canvas;
    this.particleController = startParticleCanvas(canvas, 35);
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

  /**
   * Helper conveniente para exibir banners cinemáticos.
   */
  public showBanner(options: BannerOptions): void {
    BannerService.getInstance().show(options);
  }

  /**
   * Helper conveniente para tocar sons de interface.
   */
  public playSound(soundName: any, vol = 1.0): void {
    DesignSystemSound.getInstance().play(soundName, vol);
  }
}

export function registerDesignSystem(): void {
  DesignSystem.getInstance().init();
}
