export const MANEUVER_ITEM_FLAG = "isCombatManeuver";
export const SETTING_MANEUVER_EFFECTS = "enableManeuverEffects";
export const SOCKET_ACTION_DEFENSE_PROMPT = "COMBAT_MANEUVER_DEFENSE_PROMPT";
export const SOCKET_ACTION_DEFENSE_RESPONSE = "COMBAT_MANEUVER_DEFENSE_RESPONSE";
export const DEFENSE_TIMEOUT_MS = 30000;
export const DEFENSE_SOCKET_BUFFER_MS = 2000;
export const MELEE_REACH_FEET = 5;
export const PUSH_DISTANCE_FEET = 5;
export const DEFAULT_GRID_SIZE = 100;
export const DEFAULT_FEET_PER_GRID = 5;

export const SHEET_RENDER_HOOKS = [
  "renderActorSheet",
  "dnd5e.renderActorSheet",
  "renderActorSheet5e2",
  "renderNPCSheet2",
  "renderCharacterSheet2",
  "renderActorSheetV2",
] as const;

export const MANEUVER_VFX = {
  grappleFile:
    "modules/animated-spell-effects-cartoon/spell-effects/cartoon/air/air_puff_CIRCLE_01.webm",
  grappleScale: 1.5,
  grappleDurationMs: 800,
  shoveFile:
    "modules/animated-spell-effects-cartoon/spell-effects/cartoon/air/air_explosion_800x800.webm",
  shoveScale: 1.8,
  shoveDurationMs: 600,
  shoveShakeDurationMs: 300,
  shoveShakeStrength: 5,
  disarmSound:
    "modules/dnd5e-animations/assets/sounds/Weapons/Melee_Bludgeoning/bludgeoning-swing-impact-blunt-1.mp3",
  disarmVolume: 0.8,
} as const;

export const UI_TEXT = {
  validationOutOfReach: (distanceFeet: number): string =>
    `Alvo está a ${distanceFeet} pés — manobras de combate exigem alcance corpo a corpo (máx. 5 pés).`,
  validationSizeExceeded: (
    maneuverType: "grapple" | "shove",
    attackerSize: string,
    targetSize: string
  ): string =>
    `Não é possível ${maneuverType === "grapple" ? "Agarrar" : "Empurrar"} um alvo com mais de 1 categoria de tamanho acima do atacante (atacante: ${attackerSize}, alvo: ${targetSize}).`,
  settingEffectsName: "Efeitos Audiovisuais de Manobras",
  settingEffectsHint:
    "Ativa animações visuais do Sequencer e efeitos sonoros ao concluir manobras de combate com sucesso.",
  selectSingleTargetWarn: (maneuverName: string): string =>
    `Selecione exatamente 1 alvo no canvas para realizar ${maneuverName}.`,
  invalidTargetActorWarn: "O alvo selecionado não possui uma ficha de ator válida.",
  missingAttackerTokenWarn: "Não foi possível encontrar o token do atacante na cena.",
  visibilityPromptIntro: (maneuverName: string, targetName: string): string =>
    `Executar <strong>${maneuverName}</strong> contra <strong>${targetName}</strong>.`,
  visibilityModeLabel: "Modo de Visibilidade da Disputa:",
  visibilityOptions: {
    publicroll: "Rolagem Pública",
    gmroll: "Rolagem para o Mestre (GM Roll)",
    blindroll: "Rolagem às Cegas (Blind Roll)",
    selfroll: "Apenas para Você (Self Roll)",
  },
  visibilityDialogTitle: (maneuverName: string): string =>
    `${maneuverName} — Configuração de Rolagem`,
  visibilityConfirmLabel: "Iniciar Disputa",
  visibilityCancelLabel: "Cancelar",
  defenseDialogTitle: (maneuverName: string): string => `Defesa — ${maneuverName}`,
  defensePromptLead: (attackerName: string, maneuverName: string): string =>
    `<strong>${attackerName}</strong> está tentando usar <strong>${maneuverName}</strong> contra você!`,
  defensePromptSubtitle: "Escolha como você deseja resistir à manobra:",
  defenseTimerPrefix: "Tempo restante:",
  defenseTimerFallback: (skillName: string): string => `(fallback: ${skillName})`,
  skillAthletics: "Atletismo",
  skillAcrobatics: "Acrobacia",
  defenseButtonAthletics: (sign: string): string => `Atletismo (Força) [${sign}]`,
  defenseButtonAcrobatics: (sign: string): string => `Acrobacia (Destreza) [${sign}]`,
  defaultAttackerName: "Atacante",
  resistedTitle: "🛡️ Manobra Resistida!",
  resistedBody: (targetName: string, maneuverName: string, attackerName: string): string =>
    `<strong>${targetName}</strong> resistiu com sucesso à tentativa de <strong>${maneuverName}</strong> de <strong>${attackerName}</strong>!`,
  resistedOutcome: (defenderTotal: number, attackerTotal: number): string =>
    `<em>(Resultado: Defesa ${defenderTotal} vs Ataque ${attackerTotal} — empate mantém o status quo).</em>`,
  grappleSuccessTitle: "✊ Agarrar Bem-Sucedido!",
  grappleSuccessBody: (attackerName: string, targetName: string): string =>
    `<strong>${attackerName}</strong> agarrou <strong>${targetName}</strong> com sucesso!`,
  grappleSuccessEffect:
    "O alvo está com a condição <strong>Agarrado (Grappled)</strong> (deslocamento reduzido a 0).",
  shoveDialogTitle: "Manobra: Empurrar — Escolha o Efeito",
  shoveDialogPrompt: (targetName: string): string =>
    `<p>Você venceu a disputa contra <strong>${targetName}</strong>!</p><p>Escolha o resultado da manobra:</p>`,
  shoveProneButton: "Derrubar Caído (Prone)",
  shovePushButton: "Empurrar 5 Pés",
  shoveSuccessTitle: "🛡️ Empurrar Bem-Sucedido!",
  shoveProneBody: (attackerName: string, targetName: string): string =>
    `<strong>${attackerName}</strong> derrubou <strong>${targetName}</strong> no chão (condição <em>Caído / Prone</em> aplicada)!`,
  shoveCollisionWarn: (targetName: string): string =>
    `${targetName} colidiu com um obstáculo e não pôde ser empurrado completamente.`,
  shoveCollisionTitle: "🛡️ Empurrar — Obstáculo Encontrado!",
  shoveCollisionBody: (attackerName: string, targetName: string): string =>
    `<strong>${attackerName}</strong> empurrou <strong>${targetName}</strong>, mas o alvo colidiu contra uma parede/obstáculo!`,
  shovePushBody: (attackerName: string, targetName: string): string =>
    `<strong>${attackerName}</strong> empurrou <strong>${targetName}</strong> 5 pés para longe!`,
  disarmFallbackWeapon: "sua arma",
  disarmSuccessTitle: "🗡️ Desarme Bem-Sucedido!",
  disarmSuccessBody: (attackerName: string, targetName: string): string =>
    `<strong>${attackerName}</strong> conseguiu desarmar <strong>${targetName}</strong>!`,
  disarmWeaponDropped: (weaponName: string): string =>
    `A arma empunhada (${weaponName}) caiu no chão aos pés do alvo!`,
  disarmHitlNotice:
    "<em>(Salvaguarda HITL: Por segurança, a arma não foi excluída da ficha; o Mestre e os jogadores devem considerar o alvo desarmado).</em>",
} as const;

export const MANEUVER_DEFINITIONS = {
  grapple: {
    type: "grapple" as const,
    name: "Manobra: Agarrar",
    img: "icons/skills/melee/unarmed-punch-fist-white.webp",
    description:
      "<p><strong>Manobra de Combate: Agarrar</strong> (D&D 5e PHB p. 195).</p><p>Substitui um ataque corpo a corpo. Você tenta agarrar uma criatura a até 5 pés com uma mão livre. O alvo não pode ser mais do que uma categoria de tamanho maior que você.</p><p><strong>Disputa:</strong> Seu teste de Força (Atletismo) contra o teste de Força (Atletismo) ou Destreza (Acrobacia) do alvo.</p><p><strong>Sucesso:</strong> O alvo ganha a condição <em>Agarrado (Grappled)</em>.</p>",
  },
  shove: {
    type: "shove" as const,
    name: "Manobra: Empurrar",
    img: "icons/skills/melee/unarmed-punch-fist-blue.webp",
    description:
      "<p><strong>Manobra de Combate: Empurrar</strong> (D&D 5e PHB p. 195).</p><p>Substitui um ataque corpo a corpo. Você tenta derrubar ou afastar uma criatura a até 5 pés. O alvo não pode ser mais do que uma categoria de tamanho maior que você.</p><p><strong>Disputa:</strong> Seu teste de Força (Atletismo) contra o teste de Força (Atletismo) ou Destreza (Acrobacia) do alvo.</p><p><strong>Sucesso:</strong> Você escolhe derrubar o alvo no chão (<em>Caído / Prone</em>) ou empurrá-lo 5 pés para longe.</p>",
  },
  disarm: {
    type: "disarm" as const,
    name: "Manobra: Desarmar",
    img: "icons/skills/melee/shield-damaged-broken-orange.webp",
    description:
      "<p><strong>Manobra de Combate: Desarmar</strong> (D&D 5e DMG p. 271 — Regra Opcional).</p><p>Substitui um ataque corpo a corpo. Você tenta forçar o alvo a soltar um item ou arma empunhada.</p><p><strong>Disputa:</strong> Seu teste de Força (Atletismo) contra o teste de Força (Atletismo) ou Destreza (Acrobacia) do alvo.</p><p><strong>Modificadores:</strong> Desvantagem se o defensor empunhar o item com as duas mãos ou for maior que você; Vantagem se você for maior que o defensor.</p><p><strong>Sucesso:</strong> O alvo larga o item empunhado no chão.</p>",
  },
} as const;
