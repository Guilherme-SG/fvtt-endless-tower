export const JUMP_ITEM_FLAG = "isJumpFeature";
export const JUMP_ITEM_NAME = "Jump";
export const LEGACY_JUMP_ITEM_NAME = "Salto";
export const JUMP_ICON = "icons/skills/movement/figure-running-gray.webp";
export const JUMP_DEFAULT_STRENGTH = 10;
export const JUMP_MIN_DISTANCE_THRESHOLD = 0.1;
export const JUMP_CAPPED_EPSILON = 0.01;
export const JUMP_WAYPOINT_STEPS = 8;
export const JUMP_PEAK_ARC_MIN = 45;
export const JUMP_PEAK_ARC_MAX = 150;
export const JUMP_PEAK_ARC_RATIO = 0.28;
export const JUMP_SOUND_VOLUME = 0.8;
export const JUMP_POST_WAIT_MS = 50;
export const JUMP_CONFIRM_DELAY_MS = 80;
export const JUMP_SHAKE_DURATION_MS = 400;

export const SHEET_RENDER_HOOKS = [
  "renderActorSheet",
  "dnd5e.renderActorSheet",
  "renderActorSheet5e2",
  "renderNPCSheet2",
  "renderCharacterSheet2",
  "renderActorSheetV2",
] as const;

export const DEFAULT_JUMP_CONFIG = {
  vfx: {
    takeoff:
      "modules/animated-spell-effects-cartoon/spell-effects/cartoon/air/air_explosion_800x800.webm",
    lightLanding:
      "modules/animated-spell-effects-cartoon/spell-effects/cartoon/air/air_puff_CIRCLE_01.webm",
    heavyLandingPrefix: "jb2a.impact.ground_crack.0",
    crosshair: JUMP_ICON,
  },
  sfx: {
    jump:
      "modules/endless-tower/assets/sounds/High-Jump-Skill-Sound-Effect-Taekwondo-Ragnarok-Online_005_48k.m4a",
    heavyLanding:
      "modules/dnd5e-animations/assets/sounds/Weapons/Melee_Bludgeoning/bludgeoning-swing-impact-blunt-1.mp3",
  },
  timing: {
    travelSpeedMs: 22,
    minTravelMs: 600,
  },
  ui: {
    offsetLabelY: 35,
  },
  heavy: {
    landingScale: 2.5,
  },
} as const;

export const UI_TEXT = {
  itemDescription:
    "<p>Ação de movimento para executar saltos conforme as regras de D&D 5e.</p><p><strong>Salto com Corrida:</strong> distância de até o valor de Força em pés (requer corrida prévia de 10 pés).</p><p><strong>Salto Parado:</strong> distância de até metade do valor de Força em pés.</p>",
  noActorWarning: "Nenhum ator especificado para o salto.",
  sequencerMissingError: "Ative o módulo Sequencer para usar a ação Salto.",
  noTokenWarning: (actorName: string): string =>
    `Nenhum token de "${actorName}" foi encontrado na cena ativa para realizar o salto.`,
  dialogTitle: (strength: number, actorName: string): string =>
    `Salto (Força: ${strength}) — ${actorName}`,
  dialogPrompt: "Selecione o tipo de salto:",
  runningTypeLabel: "Salto com Corrida",
  standingTypeLabel: "Salto Parado",
  runningButtonLabel: (distance: number, units: string): string =>
    `Com Corrida (${distance} ${units})`,
  standingButtonLabel: (distance: number, units: string): string =>
    `Parado (${distance} ${units})`,
  runningHint: (distance: number, units: string): string =>
    `até <b>${distance} ${units}</b> (requer corrida prévia de 10 ${units}).`,
  standingHint: (distance: number, units: string): string =>
    `até <b>${distance} ${units}</b>.`,
  crosshairRangeLabel: (typeLabel: string, maxDistance: number, units: string): string =>
    `${typeLabel}: até ${maxDistance} ${units}`,
  crosshairOutOfRangeSuffix: " — fora do alcance",
  invalidDestinationWarning: "Selecione um ponto de aterrissagem fora do espaço atual.",
  sameSpaceWarning: "O token já ocupa este espaço; escolha outro local.",
  chatCappedNotice: (maxDistance: number, units: string): string =>
    `<p><em>Salto limitado ao alcance máximo de ${maxDistance} ${units}.</em></p>`,
  chatSummary: (
    safeName: string,
    typeLabel: string,
    formattedDistance: string | number,
    units: string,
    squares: number
  ): string => {
    const plural = squares === 1 ? "" : "s";
    return `<p><strong>${safeName}</strong> realizou um <strong>${typeLabel}</strong> de <strong>${formattedDistance} ${units}</strong> (${squares} quadrado${plural}).</p>`;
  },
  jumpNotification: (
    tokenName: string,
    formattedDistance: string | number,
    units: string,
    squares: number
  ): string => {
    const plural = squares === 1 ? "" : "s";
    return `${tokenName} saltou ${formattedDistance} ${units} (${squares} quadrado${plural}).`;
  },
  fallbackMoveWarning:
    "O token foi reposicionado sem animação devido a um erro de renderização.",
  moveFailedError: "Não foi possível mover o token.",
} as const;
