/**
 * Checks whether a combat update transitions from round 0 to round 1.
 */
export function isFirstRoundStart(round?: number, previousRound?: number): boolean {
  return round === 1 && previousRound === 0;
}
