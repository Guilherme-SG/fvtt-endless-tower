export const SOCKET_ACTION_ABRACADO = "ABRACADO_PELO_DESTINO_ANIMATION";
export const BLESS_NAME_NORMALIZED = "abraçado pelo destino";
export const BLESS_NAME_ASCII = "abracado pelo destino";
export const BLESS_COMPENDIUM_UUID = "Compendium.world.endless-tower-items.Item.TB6Qd10CF3XdZ3O9";
export const EFFECT_NAME = "Sorte de Calax";
export const EFFECT_ICON = "icons/sundries/gaming/dice-runed-brown.webp";
export const DEFAULT_BANNER_DURATION_MS = 4000;
export const DEFAULT_LUCK_SOUND = "sounds/combat/epic-start-horn.ogg";
export const QUEUE_STEP_DELAY_MS = 400;
export const FALLBACK_ROLL_DELAY_MS = 600;
export const SOUND_VOLUME = 0.85;

export const ABRACADO_EFFECT_CHANGES = [
  { key: "system.bonuses.mwak.attack", mode: 2, value: "+1", priority: 20 },
  { key: "system.bonuses.rwak.attack", mode: 2, value: "+1", priority: 20 },
  { key: "system.bonuses.msak.attack", mode: 2, value: "+1", priority: 20 },
  { key: "system.bonuses.rsak.attack", mode: 2, value: "+1", priority: 20 },
  { key: "system.bonuses.abilities.check", mode: 2, value: "+1", priority: 20 },
] as const;

export const UI_TEXT = {
  settingLuckSoundName: "Abraçado Pelo Destino: Som de Sorte",
  settingLuckSoundHint:
    "Efeito sonoro reproduzido quando a moeda cai em Par (Destino o abraça).",
  settingEmptySoundName: "Abraçado Pelo Destino: Som de Vazio",
  settingEmptySoundHint:
    "Efeito sonoro reproduzido quando a moeda cai em Ímpar (O acaso é indiferente).",
  settingDurationName: "Abraçado Pelo Destino: Duração do Banner (ms)",
  settingDurationHint:
    "Tempo de exibição do banner e partículas na tela antes de desaparecer.",
  defaultTitle: "O DESTINO ABRAÇA",
  defaultSubtitle: "O acaso sorriu para você.",
  faceHeads: "Cara",
  faceTails: "Coroa",
  bannerTitleLuck: (actorName: string): string => `O DESTINO ABRAÇA: ${actorName.toUpperCase()}`,
  bannerTitleEmpty: (actorName: string): string =>
    `O ACASO É INDIFERENTE: ${actorName.toUpperCase()}`,
  bannerSubtitleLuck: (faceName: string, actorName: string): string =>
    `A moeda caiu em ${faceName}! O acaso sorriu para ${actorName}. +1 em ataques e testes!`,
  bannerSubtitleEmpty: (faceName: string, actorName: string): string =>
    `A moeda caiu em ${faceName}. O destino permanece em silêncio para ${actorName}.`,
  chatFlavor: "Bênção de Calax: Abraçado pelo Destino",
  chatTitleLuck: "O Destino Abraça",
  chatTitleEmpty: "O Acaso é Indiferente",
  chatCardHeading: (title: string): string => `Bênção de Calax: ${title}`,
  chatLore:
    "\"Calax não escolhe favoritos, ele apenas distribui as cartas. No início de cada conflito, a moeda é lançada ao vento...\"",
  chatRollLabel: "Resultado da Moeda:",
  chatRollLuckTag: "🍀 (O Destino o abraça!)",
  chatRollEmptyTag: "✦ (O Acaso é indiferente)",
  chatBodyLuck: (faceName: string, actorName: string): string =>
    `A moeda caiu em <b>${faceName}</b>! O destino sorri para <b>${actorName}</b>. Você recebe um bônus de <b>+1</b> em todas as suas jogadas de ataque e testes de habilidade até o fim deste combate!`,
  chatBodyEmpty: (faceName: string, actorName: string): string =>
    `A moeda caiu em <b>${faceName}</b>. O acaso permanece em silêncio para <b>${actorName}</b>. Nenhum bônus foi concedido desta vez.`,
} as const;
