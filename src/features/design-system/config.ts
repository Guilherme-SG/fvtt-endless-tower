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

export const SOCKET_ACTION_BANNER = "DS_UNIVERSAL_BANNER";
export const ENDLESS_TOWER_SHEET_LABEL = "Endless Tower Sheet";
export const ENDLESS_TOWER_SHEET_CLASS = "et-sheet";

export const DEFAULT_BANNER_DURATION_MS = 3800;
export const BANNER_TRANSITION_DELAY_MS = 500;
export const BANNER_CUSTOM_SOUND_SCALE = 0.85;
export const DEFAULT_UI_SOUND_VOLUME = 0.35;
export const CRIT_SOUND_DELAY_MS = 300;
export const DICE_ROLL_VOLUME_SCALE = 0.7;
export const GLOBAL_PARTICLE_COUNT = 35;

export const NON_ATTACK_ROLL_TYPES = new Set([
  "damage",
  "healing",
  "save",
  "skill",
  "tool",
  "ability",
  "initiative",
  "death",
  "hitDie",
]);

export const SOUND_LIBRARY: Record<UISoundType, SoundProfile> = {
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

export const UI_TEXT = {
  settingThemeName: "Design System: Tema Celestial Chronicle",
  settingThemeHint:
    "Aplica o visual unificado Dark Obsidian Glass & Celestial Gold em toda a interface do Foundry.",
  settingGlobalParticlesName: "Partículas Douradas Ambientais (Global)",
  settingGlobalParticlesHint:
    "Adiciona uma camada suave de partículas douradas flutuantes no fundo da mesa de jogo.",
  settingSoundsName: "Sons de Interface (Design System)",
  settingSoundsHint: "Ativa efeitos sonoros rúnicos/cinemáticos em janelas e rolagens.",
  settingSoundVolumeName: "Volume dos Sons de Interface",
  settingSoundVolumeHint:
    "Ajusta o volume padrão dos efeitos sonoros da interface (0% a 100%).",
  settingChatRollSoundsName: "Sons em Rolagens de Dados e Críticos",
  settingChatRollSoundsHint: "Toca fanfarras e efeitos de dados ao rolar no chat.",
  chatCriticalBadge: "SUCESSO CRÍTICO",
  chatFumbleBadge: "FALHA CRÍTICA",
  chatWhisperBadge: "Comunicação Sigilosa",
} as const;
