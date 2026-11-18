import { DETURPATION_EFFECT_NAMES, OWNERSHIP_OWNER, UI_TEXT } from "./config";

export interface DeturpationOutcome {
  addEffects: string[];
  removeEffects: string[];
  whisperMessage: string;
}

/**
 * Resolves which DFreds effects and whisper text correspond to a 1d4 - 1 roll result.
 */
export function resolveDeturpationOutcome(rollTotal: number): DeturpationOutcome {
  const { immune, resistant, vulnerable } = DETURPATION_EFFECT_NAMES;

  switch (rollTotal) {
    case 0:
      return {
        addEffects: [immune],
        removeEffects: [resistant, vulnerable],
        whisperMessage: UI_TEXT.whisperImmune,
      };
    case 1:
      return {
        addEffects: [resistant],
        removeEffects: [immune, vulnerable],
        whisperMessage: UI_TEXT.whisperResistant,
      };
    case 2:
      return {
        addEffects: [vulnerable],
        removeEffects: [immune, resistant],
        whisperMessage: UI_TEXT.whisperVulnerable,
      };
    case 3:
    default:
      return {
        addEffects: [],
        removeEffects: [immune, resistant, vulnerable],
        whisperMessage: UI_TEXT.whisperNormal,
      };
  }
}

/**
 * Extracts user IDs that hold OWNER permission on an actor.
 */
export function getOwnerUserIds(
  ownership: Record<string, number> | undefined,
  ownerLevel: number = OWNERSHIP_OWNER
): string[] {
  return Object.keys(ownership || {}).filter((id) => ownership?.[id] === ownerLevel);
}
