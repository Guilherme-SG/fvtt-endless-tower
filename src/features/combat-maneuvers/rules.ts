/**
 * Pure combat maneuver rules (Grapple, Shove, Disarm), decoupled from external runtime globals.
 */

import { type Point2D, type TokenBounds } from "../solitude/rules";
import {
  DEFAULT_FEET_PER_GRID,
  DEFAULT_GRID_SIZE,
  MELEE_REACH_FEET,
  PUSH_DISTANCE_FEET,
  UI_TEXT,
} from "./config";

export type ManeuverType = "grapple" | "shove" | "disarm";

export type CreatureSize = "tiny" | "small" | "medium" | "large" | "huge" | "gargantuan";

export interface CreatureInfo {
  size: CreatureSize;
  bounds: TokenBounds;
}

export interface ManeuverValidationResult {
  valid: boolean;
  reason?: string;
}

export interface DisarmModifiers {
  advantage: boolean;
  disadvantage: boolean;
}

export type { Point2D };

/**
 * Returns the numeric rank of a D&D 5e creature size category (tiny=0 .. gargantuan=5).
 */
export function getSizeRank(size: CreatureSize): number {
  const ranks: Record<CreatureSize, number> = {
    tiny: 0,
    small: 1,
    medium: 2,
    large: 3,
    huge: 4,
    gargantuan: 5,
  };
  return ranks[size];
}

/**
 * Validates combat maneuver prerequisites (reach and relative creature size).
 */
export function validateManeuverPrerequisites(
  attacker: CreatureInfo,
  target: CreatureInfo,
  maneuverType: ManeuverType,
  distanceFeet: number,
  _gridSize: number = DEFAULT_GRID_SIZE,
  _feetPerGrid: number = DEFAULT_FEET_PER_GRID
): ManeuverValidationResult {
  if (distanceFeet > MELEE_REACH_FEET) {
    return {
      valid: false,
      reason: UI_TEXT.validationOutOfReach(distanceFeet),
    };
  }

  if (maneuverType === "grapple" || maneuverType === "shove") {
    const attackerRank = getSizeRank(attacker.size);
    const targetRank = getSizeRank(target.size);
    if (targetRank > attackerRank + 1) {
      return {
        valid: false,
        reason: UI_TEXT.validationSizeExceeded(maneuverType, attacker.size, target.size),
      };
    }
  }

  return { valid: true };
}

/**
 * Resolves the winner of an opposed check; ties preserve the status quo in the defender's favor.
 */
export function determineContestWinner(
  attackerTotal: number,
  defenderTotal: number
): "attacker" | "defender" {
  return attackerTotal > defenderTotal ? "attacker" : "defender";
}

/**
 * Calculates advantage and disadvantage modifiers for a Disarm attempt.
 */
export function getDisarmModifiers(
  attackerSize: CreatureSize,
  defenderSize: CreatureSize,
  isTwoHanded: boolean
): DisarmModifiers {
  const attackerRank = getSizeRank(attackerSize);
  const defenderRank = getSizeRank(defenderSize);

  return {
    advantage: attackerRank > defenderRank,
    disadvantage: defenderRank > attackerRank || isTwoHanded,
  };
}

/**
 * Calculates the destination token center after pushing a target 5 ft away from the attacker,
 * snapped to the nearest grid cell center across 8 Chebyshev directions.
 */
export function calculatePushVector(
  attackerPos: Point2D,
  targetPos: Point2D,
  gridSize: number = DEFAULT_GRID_SIZE,
  feetPerGrid: number = DEFAULT_FEET_PER_GRID
): Point2D {
  const dx = targetPos.x - attackerPos.x;
  const dy = targetPos.y - attackerPos.y;

  const dirX = dx === 0 ? 0 : Math.sign(dx);
  const dirY = dy === 0 ? 0 : Math.sign(dy);

  const pixelsPerFoot = gridSize / feetPerGrid;
  const pushPixels = PUSH_DISTANCE_FEET * pixelsPerFoot;

  const rawX = targetPos.x + dirX * pushPixels;
  const rawY = targetPos.y + dirY * pushPixels;

  const snappedX = Math.floor(rawX / gridSize) * gridSize + gridSize / 2;
  const snappedY = Math.floor(rawY / gridSize) * gridSize + gridSize / 2;

  return { x: snappedX, y: snappedY };
}

/**
 * Normalizes D&D 5e or Portuguese size tokens into the CreatureSize enum.
 */
export function normalizeCreatureSize(size: string | undefined): CreatureSize {
  const s = (size || "med").toLowerCase();
  switch (s) {
    case "tiny":
    case "miudo":
    case "miúdo":
      return "tiny";
    case "sm":
    case "small":
    case "pequeno":
      return "small";
    case "lg":
    case "large":
    case "grande":
      return "large";
    case "huge":
    case "enorme":
      return "huge";
    case "grg":
    case "gargantuan":
    case "imenso":
      return "gargantuan";
    case "med":
    case "medium":
    case "medio":
    case "médio":
    default:
      return "medium";
  }
}

/**
 * Selects the higher-bonus defensive skill ("ath" or "acr") as the timeout fallback.
 */
export function selectFallbackDefenseSkill(athMod: number, acrMod: number): "ath" | "acr" {
  return acrMod > athMod ? "acr" : "ath";
}
