import {
  DEFAULT_FEET_PER_GRID,
  DEFAULT_GRID_SIZE,
  INCAPACITATED_STATUSES,
  ISOLATION_DISTANCE_FEET,
} from "./config";

export interface Point2D {
  x: number;
  y: number;
}

export interface TokenBounds {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface AllyStatus {
  id: string;
  isConscious: boolean;
  bounds: TokenBounds;
}

/**
 * Calculates the center coordinates of each grid cell occupied by a token.
 */
export function calculateTokenGridCenters(
  bounds: TokenBounds,
  gridSize: number = DEFAULT_GRID_SIZE
): Point2D[] {
  const centers: Point2D[] = [];
  const width = bounds.width || 1;
  const height = bounds.height || 1;

  if (width < 1 || height < 1) {
    centers.push({
      x: bounds.x + (width * gridSize) / 2,
      y: bounds.y + (height * gridSize) / 2,
    });
    return centers;
  }

  const cols = Math.max(1, Math.round(width));
  const rows = Math.max(1, Math.round(height));

  for (let gx = 0; gx < cols; gx++) {
    for (let gy = 0; gy < rows; gy++) {
      centers.push({
        x: bounds.x + (gx + 0.5) * gridSize,
        y: bounds.y + (gy + 0.5) * gridSize,
      });
    }
  }

  return centers;
}

/**
 * Measures the shortest distance in feet between two token bounding boxes
 * using the Chebyshev metric (standard D&D 5e 5/5/5 diagonal rule).
 */
export function measureMinDistanceChebyshev(
  boundsA: TokenBounds,
  boundsB: TokenBounds,
  gridSize: number = DEFAULT_GRID_SIZE,
  feetPerGrid: number = DEFAULT_FEET_PER_GRID
): number {
  const centersA = calculateTokenGridCenters(boundsA, gridSize);
  const centersB = calculateTokenGridCenters(boundsB, gridSize);

  let minDistance = Infinity;

  for (const cA of centersA) {
    for (const cB of centersB) {
      const dx = Math.abs(cA.x - cB.x) / gridSize;
      const dy = Math.abs(cA.y - cB.y) / gridSize;
      const distFeet = Math.max(dx, dy) * feetPerGrid;
      if (distFeet < minDistance) {
        minDistance = distFeet;
      }
    }
  }

  return minDistance;
}

/**
 * Evaluates whether the Solitude bearer is isolated (no conscious allies within maxDistanceFeet).
 */
export function isBearerIsolated(
  bearerBounds: TokenBounds,
  allies: AllyStatus[],
  maxDistanceFeet: number = ISOLATION_DISTANCE_FEET,
  gridSize: number = DEFAULT_GRID_SIZE,
  feetPerGrid: number = DEFAULT_FEET_PER_GRID
): boolean {
  for (const ally of allies) {
    if (!ally.isConscious) continue;

    const dist = measureMinDistanceChebyshev(
      bearerBounds,
      ally.bounds,
      gridSize,
      feetPerGrid
    );

    if (dist <= maxDistanceFeet) {
      return false;
    }
  }
  return true;
}

/**
 * Applies pending coordinate/size updates onto a token's current bounds.
 */
export function resolveTokenBoundsWithChanges(
  current: TokenBounds,
  changes?: Partial<TokenBounds> | null
): TokenBounds {
  if (!changes) {
    return { ...current };
  }
  return {
    x: "x" in changes && changes.x !== undefined ? changes.x : current.x,
    y: "y" in changes && changes.y !== undefined ? changes.y : current.y,
    width: "width" in changes && changes.width !== undefined ? changes.width : current.width,
    height: "height" in changes && changes.height !== undefined ? changes.height : current.height,
  };
}

/**
 * Checks whether an actor is conscious based on current HP and incapacitated status IDs.
 */
export function isActorConsciousState(hpValue: number | undefined, activeStatuses: Iterable<string>): boolean {
  if ((hpValue ?? 0) <= 0) return false;
  for (const status of activeStatuses) {
    if ((INCAPACITATED_STATUSES as readonly string[]).includes(status)) {
      return false;
    }
  }
  return true;
}
