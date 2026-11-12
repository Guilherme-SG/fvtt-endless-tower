/**
 * Regras puras para identificação de criaturas mortas-vivas.
 * Suporta nomenclaturas D&D 5e em inglês e português.
 */

export function isUndeadCreature(typeValue?: string | null, raceValue?: string | null): boolean {
  const normType = (typeValue || "").toLowerCase().trim();
  const normRace = (raceValue || "").toLowerCase().trim();

  const isTypeUndead =
    normType === "undead" ||
    normType.includes("undead") ||
    normType.includes("morto-vivo") ||
    normType.includes("morta-viva");

  const isRaceUndead =
    normRace === "undead" ||
    normRace.includes("undead") ||
    normRace.includes("morto-vivo") ||
    normRace.includes("morta-viva");

  return isTypeUndead || isRaceUndead;
}
