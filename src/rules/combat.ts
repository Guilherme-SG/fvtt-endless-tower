/**
 * Regras puras de combate e distâncias desacopladas do canvas do Foundry.
 */

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

/**
 * Calcula os centros das células ocupadas por um token na grade.
 */
export function calculateTokenGridCenters(
  bounds: TokenBounds,
  gridSize = 100
): Point2D[] {
  const centers: Point2D[] = [];
  const w = Math.max(1, Math.round(bounds.width));
  const h = Math.max(1, Math.round(bounds.height));

  for (let gx = 0; gx < w; gx++) {
    for (let gy = 0; gy < h; gy++) {
      centers.push({
        x: bounds.x + (gx + 0.5) * gridSize,
        y: bounds.y + (gy + 0.5) * gridSize,
      });
    }
  }
  return centers;
}

/**
 * Mede a menor distância pura em pés entre duas caixas de tokens usando métrica de Chebyshev (regra D&D 5e padrão 5/5/5).
 */
export function measureMinDistanceChebyshev(
  boundsA: TokenBounds,
  boundsB: TokenBounds,
  gridSize = 100,
  feetPerGrid = 5
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

export interface AllyStatus {
  id: string;
  isConscious: boolean;
  bounds: TokenBounds;
}

/**
 * Avalia se o portador da bênção Solitude está isolado (sem aliados conscientes a até maxDistanceFeet).
 */
export function isBearerIsolated(
  bearerBounds: TokenBounds,
  allies: AllyStatus[],
  maxDistanceFeet = 10,
  gridSize = 100,
  feetPerGrid = 5
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
      return false; // Aliado consciente próximo encontrado
    }
  }
  return true;
}
