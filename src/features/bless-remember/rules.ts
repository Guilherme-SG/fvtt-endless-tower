import { OWNERSHIP_OWNER, UI_TEXT } from "./config";

/**
 * Extracts user IDs that hold OWNER permission on an actor.
 */
export function getOwnerUserIds(
  ownership: Record<string, number> | undefined,
  ownerLevel: number = OWNERSHIP_OWNER
): string[] {
  return Object.keys(ownership || {}).filter((id) => ownership?.[id] === ownerLevel);
}

/**
 * Filters item names against the known divine blessing catalog.
 */
export function filterActorBlessingNames(itemNames: string[], knownBlessings: string[]): string[] {
  return itemNames.filter((name) => knownBlessings.includes(name));
}

/**
 * Formats the whisper reminder sent when rolling initiative with an initiative blessing.
 */
export function formatInitiativeWhisper(
  actorName: string,
  blessName: string,
  description: string
): string {
  return UI_TEXT.initiativeReminder(actorName, blessName, description);
}

/**
 * Formats the whisper reminder sent on a combatant's turn when they own divine blessings.
 */
export function formatTurnWhisper(actorName: string, blessNames: string[]): string {
  return UI_TEXT.turnReminder(actorName, blessNames);
}
