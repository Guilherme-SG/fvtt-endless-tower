import { MODULE_ID, MODULE_TITLE } from "../../constants";

export type UISoundType =
  | "windowOpen"
  | "windowClose"
  | "tabSwitch"
  | "diceRoll"
  | "criticalSuccess"
  | "criticalFail"
  | "bannerEncounter"
  | "bannerVictory"
  | "bannerCelestial"
  | "bannerArcane";

export interface SoundProfile {
  src: string;
  fallback?: string;
  defaultVolume: number;
}

const SOUND_LIBRARY: Record<UISoundType, SoundProfile> = {
  windowOpen: {
    src: "endless-tower/audios/skills/begin_cast.wav",
    fallback: "sounds/doors/magic/wall-open.ogg",
    defaultVolume: 0.3,
  },
  windowClose: {
    src: "endless-tower/audios/skills/hide_sound.wav",
    fallback: "sounds/doors/sliding/close-wood.ogg",
    defaultVolume: 0.25,
  },
  tabSwitch: {
    src: "sounds/lock.wav",
    fallback: "endless-tower/audios/ui/ragnarok-login.mp3",
    defaultVolume: 0.25,
  },
  diceRoll: {
    src: "sounds/dice.wav",
    defaultVolume: 0.5,
  },
  criticalSuccess: {
    src: "endless-tower/audios/critical-sounds/pharmacy_success.wav",
    fallback: "endless-tower/audios/critical-sounds/stage-win.wav",
    defaultVolume: 0.75,
  },
  criticalFail: {
    src: "endless-tower/audios/critical-sounds/pharmacy_fail.wav",
    fallback: "endless-tower/audios/critical-sounds/eh_eh_eeeeeh.wav",
    defaultVolume: 0.75,
  },
  bannerEncounter: {
    src: "sounds/combat/epic-start-horn.ogg",
    defaultVolume: 0.85,
  },
  bannerVictory: {
    src: "endless-tower/audios/critical-sounds/stage-win.wav",
    defaultVolume: 0.8,
  },
  bannerCelestial: {
    src: "endless-tower/audios/skills/sanctuary-sound.wav",
    fallback: "endless-tower/audios/skills/Aspersio.wav",
    defaultVolume: 0.75,
  },
  bannerArcane: {
    src: "endless-tower/audios/skills/begin_cast.wav",
    defaultVolume: 0.75,
  },
};

export class DesignSystemSound {
  private static instance: DesignSystemSound | null = null;
  private audioCache = new Map<string, HTMLAudioElement>();
  private lastWindowOpenTime = 0;

  private constructor() {}

  public static getInstance(): DesignSystemSound {
    if (!DesignSystemSound.instance) {
      DesignSystemSound.instance = new DesignSystemSound();
    }
    return DesignSystemSound.instance;
  }

  public init(): void {
    this.registerSettings();
    this.attachFoundryHooks();
    console.log(`${MODULE_TITLE} | Sistema de Áudio UI do Design System pronto.`);
  }

  private registerSettings(): void {
    const s = (game as any).settings;
    if (!s) return;

    s.register(MODULE_ID, "dsEnableUISounds", {
      name: "Sons de Interface (Design System)",
      hint: "Ativa efeitos sonoros rúnicos/cinemáticos em janelas e rolagens.",
      scope: "client",
      config: true,
      type: Boolean,
      default: true,
    });

    s.register(MODULE_ID, "dsUISoundVolume", {
      name: "Volume dos Sons de Interface",
      hint: "Ajusta o volume padrão dos efeitos sonoros da interface (0% a 100%).",
      scope: "client",
      config: true,
      type: Number,
      range: { min: 0, max: 1, step: 0.05 },
      default: 0.35,
    });

    s.register(MODULE_ID, "dsEnableChatRollSounds", {
      name: "Sons em Rolagens de Dados e Críticos",
      hint: "Toca fanfarras e efeitos de dados ao rolar no chat.",
      scope: "client",
      config: true,
      type: Boolean,
      default: true,
    });
  }

  public isEnabled(): boolean {
    try {
      return (game as any).settings?.get?.(MODULE_ID, "dsEnableUISounds") ?? true;
    } catch {
      return true;
    }
  }

  public getMasterVolume(): number {
    try {
      const vol = (game as any).settings?.get?.(MODULE_ID, "dsUISoundVolume");
      return typeof vol === "number" ? Math.max(0, Math.min(1, vol)) : 0.35;
    } catch {
      return 0.35;
    }
  }

  public play(type: UISoundType, volumeMultiplier = 1.0): void {
    if (!this.isEnabled()) return;

    const profile = SOUND_LIBRARY[type];
    if (!profile) return;

    const finalVolume = Math.min(1, Math.max(0, profile.defaultVolume * this.getMasterVolume() * volumeMultiplier));
    if (finalVolume <= 0) return;

    this.playAudioFile(profile.src, finalVolume, profile.fallback);
  }

  private playAudioFile(src: string, volume: number, fallbackSrc?: string): void {
    try {
      let audio = this.audioCache.get(src);
      if (!audio) {
        audio = new Audio(src);
        this.audioCache.set(src, audio);
      }
      audio.currentTime = 0;
      audio.volume = volume;
      const playPromise = audio.play();
      if (playPromise) {
        playPromise.catch(() => {
          if (fallbackSrc) {
            this.playFallbackAudio(fallbackSrc, volume);
          } else {
            this.playFoundryAudioHelper(src, volume);
          }
        });
      }
    } catch {
      if (fallbackSrc) {
        this.playFallbackAudio(fallbackSrc, volume);
      }
    }
  }

  private playFallbackAudio(fallbackSrc: string, volume: number): void {
    try {
      let audio = this.audioCache.get(fallbackSrc);
      if (!audio) {
        audio = new Audio(fallbackSrc);
        this.audioCache.set(fallbackSrc, audio);
      }
      audio.currentTime = 0;
      audio.volume = volume;
      audio.play().catch(() => {
        this.playFoundryAudioHelper(fallbackSrc, volume);
      });
    } catch {
      this.playFoundryAudioHelper(fallbackSrc, volume);
    }
  }

  private playFoundryAudioHelper(src: string, volume: number): void {
    try {
      const audioHelper = (foundry as any)?.audio?.AudioHelper ?? (window as any).AudioHelper;
      if (audioHelper && typeof audioHelper.play === "function") {
        audioHelper.play({ src, volume, loop: false }, false);
      }
    } catch {}
  }

  /**
   * Conecta aos Hooks nativos do Foundry para janelas e rolagens de chat.
   */
  private attachFoundryHooks(): void {
    Hooks.on("createChatMessage", (message: any) => {
      let rollSoundsEnabled = true;
      try {
        rollSoundsEnabled = (game as any).settings?.get?.(MODULE_ID, "dsEnableChatRollSounds") ?? true;
      } catch {
        rollSoundsEnabled = true;
      }
      if (!rollSoundsEnabled) return;

      const isRoll = message.isRoll || (message.rolls && message.rolls.length > 0);
      if (!isRoll) return;

      const rolls = message.rolls || [];
      let hasCrit = false;
      let hasFumble = false;

      for (const roll of rolls) {
        for (const term of roll.terms || []) {
          if (term.results && Array.isArray(term.results)) {
            for (const res of term.results) {
              if (res.result === 20 || res.critical) hasCrit = true;
              if (res.result === 1 || res.fumble) hasFumble = true;
            }
          }
        }
      }

      if (hasCrit) {
        setTimeout(() => this.play("criticalSuccess", 1.0), 300);
      } else if (hasFumble) {
        setTimeout(() => this.play("criticalFail", 1.0), 300);
      } else {
        this.play("diceRoll", 0.7);
      }
    });
  }
}
