import { MODULE_ID, MODULE_TITLE } from "../../constants";
import {
  CRIT_SOUND_DELAY_MS,
  DEFAULT_UI_SOUND_VOLUME,
  DICE_ROLL_VOLUME_SCALE,
  SOUND_LIBRARY,
  UI_TEXT,
  type SoundProfile,
  type UISoundType,
} from "./config";

export { type SoundProfile, type UISoundType };

/**
 * Decoupled UI audio dispatcher for Design System stingers and roll sounds.
 * Supported profiles include diceRoll, criticalSuccess, criticalFail, bannerEncounter,
 * bannerVictory, bannerCelestial, bannerArcane, windowOpen, windowClose, and tabSwitch.
 */
export class DesignSystemSound {
  private static instance: DesignSystemSound | null = null;
  private audioCache = new Map<string, HTMLAudioElement>();

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
    console.log(`${MODULE_TITLE} | Design System UI Audio dispatcher ready.`);
  }

  private registerSettings(): void {
    const s = (game as any).settings;
    if (!s) return;

    s.register(MODULE_ID, "dsEnableUISounds", {
      name: UI_TEXT.settingSoundsName,
      hint: UI_TEXT.settingSoundsHint,
      scope: "client",
      config: true,
      type: Boolean,
      default: true,
    });

    s.register(MODULE_ID, "dsUISoundVolume", {
      name: UI_TEXT.settingSoundVolumeName,
      hint: UI_TEXT.settingSoundVolumeHint,
      scope: "client",
      config: true,
      type: Number,
      range: { min: 0, max: 1, step: 0.05 },
      default: DEFAULT_UI_SOUND_VOLUME,
    });

    s.register(MODULE_ID, "dsEnableChatRollSounds", {
      name: UI_TEXT.settingChatRollSoundsName,
      hint: UI_TEXT.settingChatRollSoundsHint,
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
      return typeof vol === "number" ? Math.max(0, Math.min(1, vol)) : DEFAULT_UI_SOUND_VOLUME;
    } catch {
      return DEFAULT_UI_SOUND_VOLUME;
    }
  }

  public play(type: UISoundType, volumeMultiplier = 1.0): void {
    if (!this.isEnabled()) return;

    const profile = SOUND_LIBRARY[type];
    if (!profile) return;

    const finalVolume = Math.min(
      1,
      Math.max(0, profile.defaultVolume * this.getMasterVolume() * volumeMultiplier)
    );
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
    } catch {
      // Ignore AudioHelper playback failures
    }
  }

  private attachFoundryHooks(): void {
    Hooks.on("createChatMessage", (message: any) => {
      let rollSoundsEnabled = true;
      try {
        rollSoundsEnabled =
          (game as any).settings?.get?.(MODULE_ID, "dsEnableChatRollSounds") ?? true;
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
        setTimeout(() => this.play("criticalSuccess", 1.0), CRIT_SOUND_DELAY_MS);
      } else if (hasFumble) {
        setTimeout(() => this.play("criticalFail", 1.0), CRIT_SOUND_DELAY_MS);
      } else {
        this.play("diceRoll", DICE_ROLL_VOLUME_SCALE);
      }
    });
  }
}
