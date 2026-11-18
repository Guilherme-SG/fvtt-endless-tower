export const SOCKET_ACTION_BANNER = "CRITICAL_ENCOUNTER_BANNER";
export const DEFAULT_BANNER_DURATION_MS = 3800;
export const DEFAULT_CRITICAL_SOUND = "sounds/combat/epic-start-horn.ogg";
export const CRITICAL_SOUND_VOLUME = 0.85;
export const MAX_PROCESSED_WORKFLOWS = 200;

export const CRITICAL_TABLE_NAMES = {
  hitPiercing: "Sucesso Perfurante",
  hitBludgeoning: "Sucesso Impactante",
  hitSlashing: "Sucesso Cortante",
  hitMagic: "Sucesso Mágico",
  fumbleMagic: "Falha Mágica",
  fumbleRanged: "Falha a Distância",
  fumbleNatural: "Falha Desarmada/Arma Natural",
  fumbleMelee: "Falha Corpo-a-Corpo",
} as const;

export const UI_TEXT = {
  settingTitleName: "Julgamento da Torre: Título do Banner",
  settingTitleHint: "Título exibido em destaque no banner cinemático ao ativar o encontro crítico.",
  defaultTitle: "JULGAMENTO DA TORRE",
  settingSubtitleName: "Julgamento da Torre: Subtítulo do Banner",
  settingSubtitleHint: "Subtítulo explicativo com o aviso sobre as tabelas de crítico e falha.",
  defaultSubtitle: "Nenhum golpe será perdoado. Tabelas de Crítico & Falha ativas.",
  settingSoundName: "Julgamento da Torre: Som de Impacto",
  settingSoundHint:
    "Caminho do arquivo de som para o anúncio cinemático (compatível com Sequencer e Foundry).",
  settingDurationName: "Julgamento da Torre: Duração do Banner (ms)",
  settingDurationHint: "Tempo de exibição do banner na tela em milissegundos antes de desaparecer.",
  midiMissingWarn: "Midi-QoL não está ativo.",
  rollSystemSwitched: (label: string): string =>
    `Sistema de salvaguardas alternado para: ${label}.`,
  rollSystemRerLabel: "Ripper's Epic Rolls",
  rollSystemMtbLabel: "Monk's Token Bar",
  rollSystemTooltipRer:
    "Sistema de Salvaguardas: Ripper's Epic Rolls (Clique para Monk's Token Bar)",
  rollSystemTooltipMtb:
    "Sistema de Salvaguardas: Monk's Token Bar (Clique para Ripper's Epic Rolls)",
  toggleTooltipActive: (title: string): string => `${title}: ATIVO (Clique para desativar)`,
  toggleTooltipInactive: (title: string): string => `Ativar ${title} (Encontro Crítico)`,
  announcementDescription:
    "Todos os Acertos e Falhas Críticas consultarão as Tabelas Decisivas até o encerramento deste confronto.",
  speakerAlias: "Endless Tower",
  defaultActorName: "Personagem",
  defaultItemName: "Ataque",
  badgeTitle: "Julgamento da Torre",
  criticalHitTitle: "ACERTO CRÍTICO",
  criticalHitNarrative: (actorName: string, itemName: string): string =>
    `<strong>${actorName}</strong> desferiu um golpe decisivo com <em>${itemName}</em>!`,
  criticalFumbleTitle: "FALHA CRÍTICA",
  criticalFumbleNarrative: (actorName: string, itemName: string): string =>
    `<strong>${actorName}</strong> cometeu um erro desastroso com <em>${itemName}</em>!`,
  tableLabel: "Tabela:",
  rollButtonLabel: "Rolar",
  rolledButtonLabel: "Rolado",
  permissionWarn: "Apenas o Mestre ou o jogador dono deste personagem pode rolar a tabela.",
  tableNotFoundError: (tableName: string): string =>
    `Tabela rollable "${tableName}" não encontrada no mundo! Verifique a pasta de tabelas.`,
  rollError: (tableName: string): string => `Erro ao rolar ${tableName}.`,
} as const;
