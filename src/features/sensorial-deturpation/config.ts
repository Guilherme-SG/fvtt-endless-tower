export const OWNERSHIP_OWNER = 3;
export const DETURPATION_ROLL_FORMULA = "1d4 - 1";

export const DETURPATION_EFFECT_NAMES = {
  immune: "Imune a todo dano",
  resistant: "Resistência a todo dano",
  vulnerable: "Vulnerável a todo dano",
} as const;

export const UI_TEXT = {
  noActorWarning: "Selecione um token ou ator para executar a Deturpação Sensorial.",
  whisperImmune:
    "Sua sensibilidade a dor foi desativada, você desconhece a dor! Você se sente invulnerável a tudo.",
  whisperResistant: "Sua sensibilidade a dor está deficiente! Você se sente resistente a tudo.",
  whisperVulnerable:
    "Sua sensibilidade a dor está hipersensível! Você se sente vulnerável a tudo.",
  whisperNormal: "Sua sensibilidade a dor parece normal.",
} as const;
