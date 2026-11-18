import {
  DEFAULT_JUMP_CONFIG,
  JUMP_DEFAULT_STRENGTH,
  JUMP_PEAK_ARC_MAX,
  JUMP_PEAK_ARC_MIN,
  JUMP_PEAK_ARC_RATIO,
  JUMP_WAYPOINT_STEPS,
} from "./config";

export interface JumpDistances {
  running: number;
  standing: number;
}

export interface Point2D {
  x: number;
  y: number;
}

export interface LandingEffectSelection {
  file: string;
  scale: number;
  isHeavy: boolean;
}

/**
 * Computes running and standing jump distances in grid units from an actor's Strength score.
 */
export function calculateJumpDistances(strengthScore?: number): JumpDistances {
  const strength = Number(strengthScore) || JUMP_DEFAULT_STRENGTH;
  return {
    running: strength,
    standing: Math.max(1, Math.floor(strength / 2)),
  };
}

/**
 * Computes the jump travel duration in milliseconds proportional to the jump distance.
 */
export function calculateJumpTravelDuration(
  distance: number,
  minTravelMs: number = DEFAULT_JUMP_CONFIG.timing.minTravelMs,
  travelSpeedMs: number = DEFAULT_JUMP_CONFIG.timing.travelSpeedMs
): number {
  return Math.max(minTravelMs, distance * travelSpeedMs);
}

/**
 * Generates parabolic trajectory waypoints between start and target token coordinates.
 */
export function calculateParabolicWaypoints(
  startCoords: Point2D,
  targetCoords: Point2D,
  steps: number = JUMP_WAYPOINT_STEPS
): Point2D[] {
  const deltaX = targetCoords.x - startCoords.x;
  const deltaY = targetCoords.y - startCoords.y;
  const distancePixels = Math.hypot(deltaX, deltaY);

  const arcHeight = Math.min(
    JUMP_PEAK_ARC_MAX,
    Math.max(JUMP_PEAK_ARC_MIN, distancePixels * JUMP_PEAK_ARC_RATIO)
  );

  const waypoints: Point2D[] = [];
  for (let i = 1; i <= steps; i++) {
    const t = i / steps;
    const interpX = startCoords.x + deltaX * t;
    const interpY = startCoords.y + deltaY * t;
    const verticalOffset = -4 * arcHeight * t * (1 - t);
    waypoints.push({
      x: Math.round(interpX),
      y: Math.round(interpY + verticalOffset),
    });
  }

  return waypoints;
}

/**
 * Selects the landing VFX file and scale based on creature token width and JB2A availability.
 */
export function selectLandingEffect(
  tokenWidth: number,
  hasJb2aPatreon: boolean
): LandingEffectSelection {
  const isHeavy = tokenWidth > 1;
  if (!isHeavy) {
    return {
      file: DEFAULT_JUMP_CONFIG.vfx.lightLanding,
      scale: tokenWidth * 1.5,
      isHeavy: false,
    };
  }

  const crackIndex = tokenWidth === 2 ? 3 : tokenWidth === 3 ? 2 : 1;
  const crackColor = hasJb2aPatreon ? "white" : "orange";
  return {
    file: `${DEFAULT_JUMP_CONFIG.vfx.heavyLandingPrefix}${crackIndex}.${crackColor}`,
    scale: DEFAULT_JUMP_CONFIG.heavy.landingScale,
    isHeavy: true,
  };
}
