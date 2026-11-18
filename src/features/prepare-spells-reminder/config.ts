export const FULL_CASTERS = ["cleric", "druid", "wizard"] as const;
export const HALF_CASTERS = ["artificer", "paladin", "ranger"] as const;
export const PREP_CASTERS = [
  "artificer",
  "cleric",
  "druid",
  "paladin",
  "ranger",
  "wizard",
  "witch",
] as const;

export const UI_TEXT = {
  dialogTitle: "Descanso Longo Concluído",
  dialogMessage:
    "Parece que você completou um descanso longo. Agora você pode preparar as novas magias para o dia.",
  preparedCountLabel: (prepared: number, maxPrepared: number): string =>
    `Magias Preparadas: ${prepared}/${maxPrepared}`,
  confirmButtonLabel: "Ok",
} as const;
