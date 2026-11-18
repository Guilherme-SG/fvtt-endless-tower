export const BLESSING_ITEM_NAME = "No Lugar Certo, Na Hora Certa";
export const BLESSING_COMPENDIUM_ID = "2HJTHlWHvEvSHNrk";
export const EFFECT_NAME = "Sincronia Temporal (Vantagem)";
export const EFFECT_ICON = "icons/magic/time/clock-stopwatch-hourglass-blue.webp";
export const MAX_RANGE_FEET = 30;
export const RANGE_EPSILON_FEET = 0.1;
export const DEFAULT_PROFICIENCY_BONUS = 2;
export const REACTION_DEBOUNCE_MS = 2000;
export const DIALOG_WIDTH_PX = 440;

export const SOCKET_ACTION_PROMPT = "TEMPORAL_SYNCHRONY_PROMPT";
export const SOCKET_ACTION_APPLY = "TEMPORAL_SYNCHRONY_APPLY";

export const TEMPORAL_VFX = {
  strandFile: "jb2a.energy_strands.complete.blue",
  circleFile: "jb2a.magic_signs.circle.02.divination.intro.blue",
  playbackRate: 1.2,
  scale: 1.4,
  durationMs: 2000,
  fadeOutMs: 500,
} as const;

export const TEMPORAL_EFFECT_CHANGES = [
  {
    key: "flags.midi-qol.advantage.attack.all",
    mode: 5,
    value: "1",
    priority: 20,
  },
  {
    key: "flags.midi-qol.advantage.ability.all",
    mode: 5,
    value: "1",
    priority: 20,
  },
] as const;

export const TEMPORAL_SPECIAL_DURATION = ["1Attack:all", "1Check:all", "turnEnd"] as const;

export const UI_TEXT = {
  effectTitle: "Sincronia Temporal",
  blessingSubtitle: BLESSING_ITEM_NAME,
  defaultSourceName: "um aliado",
  effectDescription: (sourceName: string): string => `
      <p><strong>Sincronia Temporal</strong></p>
      <p>Concedido por <em>${sourceName}</em> em resposta a uma reação temporal.</p>
      <p>Vantagem na próxima jogada de ataque ou teste de habilidade até o fim do seu próximo turno.</p>
    `,
  chatCardHeadline: (sourceName: string): string =>
    `<strong>${sourceName}</strong> entrelaçou a causalidade em resposta à sua reação!`,
  chatCardBenefit: (targetName: string): string =>
    `✨ <strong>${targetName}</strong> recebe <strong>Vantagem</strong> na sua próxima jogada de ataque ou teste de habilidade (até o final do próximo turno).`,
  chatCardFooter: (remaining: number, max: number): string =>
    `Usos restantes: <strong>${remaining} / ${max}</strong>`,
  noTargetsNotification: (actorName: string): string =>
    `Sincronia Temporal: Nenhuma criatura consciente encontrada em até ${MAX_RANGE_FEET} ft de ${actorName}.`,
  dialogTitle: "Sincronia Temporal — No Lugar Certo, Na Hora Certa",
  dialogIntro:
    "Você acabou de realizar uma <strong>Reação</strong>. Deseja canalizar a <strong>Sincronia Temporal</strong> para abençoar uma criatura visível?",
  dialogEffectSummary:
    "<strong>Efeito:</strong> Concede <strong>Vantagem</strong> na próxima jogada de ataque ou teste de habilidade do alvo até o final do próximo turno dele.",
  dialogUsesAvailable: (current: number, max: number): string =>
    `<strong>Usos disponíveis:</strong> ${current} / ${max} (recupera em Descanso Longo)`,
  dialogTargetLabel: `Escolha o Alvo (até ${MAX_RANGE_FEET} ft):`,
  dialogConfirmLabel: "Conceder Vantagem",
  dialogCancelLabel: "Não Usar",
} as const;
