/**
 * Regras puras de manobras de combate (Agarrar, Empurrar, Desarmar) desacopladas do Foundry.
 * P-003: Este módulo não deve referenciar `game`, `canvas`, `Hooks` ou `ui`.
 */

import { measureMinDistanceChebyshev, type TokenBounds } from './combat';

// ---------------------------------------------------------------------------
// Tipos
// ---------------------------------------------------------------------------

export type ManeuverType = 'grapple' | 'shove' | 'disarm';

export type CreatureSize = 'tiny' | 'small' | 'medium' | 'large' | 'huge' | 'gargantuan';

// ---------------------------------------------------------------------------
// Interfaces internas
// ---------------------------------------------------------------------------

export interface CreatureInfo {
  size: CreatureSize;
  bounds: TokenBounds;
}

// ---------------------------------------------------------------------------
// 1. getSizeRank
// ---------------------------------------------------------------------------

/**
 * Retorna a posição numérica de um tamanho de criatura na escala D&D 5e.
 * tiny=0, small=1, medium=2, large=3, huge=4, gargantuan=5
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

// ---------------------------------------------------------------------------
// 2. validateManeuverPrerequisites
// ---------------------------------------------------------------------------

export interface ManeuverValidationResult {
  valid: boolean;
  reason?: string;
}

/**
 * Valida os pré-requisitos de uma manobra de combate.
 *
 * Regras:
 * - Qualquer manobra falha se o alvo estiver a mais de 5 pés (distância Chebyshev).
 * - Agarrar e Empurrar falham se o alvo for mais de 1 categoria de tamanho maior que o atacante.
 * - Desarmar não tem restrição de tamanho relativo (além das vantagens/desvantagens em getDisarmModifiers).
 */
export function validateManeuverPrerequisites(
  attacker: CreatureInfo,
  target: CreatureInfo,
  maneuverType: ManeuverType,
  distanceFeet: number,
  gridSize = 100,
  feetPerGrid = 5
): ManeuverValidationResult {
  // Verificação de alcance (AC-002)
  if (distanceFeet > 5) {
    return {
      valid: false,
      reason: `Alvo está a ${distanceFeet} pés — manobras de combate exigem alcance corpo a corpo (máx. 5 pés).`,
    };
  }

  // Verificação de tamanho relativo para Agarrar e Empurrar (AC-003)
  if (maneuverType === 'grapple' || maneuverType === 'shove') {
    const attackerRank = getSizeRank(attacker.size);
    const targetRank = getSizeRank(target.size);
    if (targetRank > attackerRank + 1) {
      return {
        valid: false,
        reason: `Não é possível ${maneuverType === 'grapple' ? 'Agarrar' : 'Empurrar'} um alvo com mais de 1 categoria de tamanho acima do atacante (atacante: ${attacker.size}, alvo: ${target.size}).`,
      };
    }
  }

  return { valid: true };
}

// ---------------------------------------------------------------------------
// 3. determineContestWinner
// ---------------------------------------------------------------------------

/**
 * Determina o vencedor de um teste de resistência contestado.
 * Em empate, o defensor vence (AC-006).
 */
export function determineContestWinner(
  attackerTotal: number,
  defenderTotal: number
): 'attacker' | 'defender' {
  return attackerTotal > defenderTotal ? 'attacker' : 'defender';
}

// ---------------------------------------------------------------------------
// 4. getDisarmModifiers
// ---------------------------------------------------------------------------

export interface DisarmModifiers {
  advantage: boolean;
  disadvantage: boolean;
}

/**
 * Calcula vantagens e desvantagens no teste de Desarmar.
 *
 * Vantagem: atacante for maior que o defensor em tamanho.
 * Desvantagem: defensor for maior que o atacante OU a arma for de duas mãos.
 * Ambas podem ser verdadeiras simultaneamente (se anulam na mesa, mas são
 * reportadas separadamente para que a lógica de chamada decida).
 */
export function getDisarmModifiers(
  attackerSize: CreatureSize,
  defenderSize: CreatureSize,
  isTwoHanded: boolean
): DisarmModifiers {
  const attackerRank = getSizeRank(attackerSize);
  const defenderRank = getSizeRank(defenderSize);

  const advantage = attackerRank > defenderRank;
  const disadvantage = defenderRank > attackerRank || isTwoHanded;

  return { advantage, disadvantage };
}

// ---------------------------------------------------------------------------
// 5. calculatePushVector
// ---------------------------------------------------------------------------

export interface Point2D {
  x: number;
  y: number;
}

/**
 * Calcula a nova posição do alvo após ser empurrado 5 pés na direção oposta ao atacante.
 *
 * O deslocamento é normalizado (8 direções: ortogonal/diagonal), convertido para
 * pixels de grade e ajustado ao centro da célula mais próxima.
 *
 * @param attackerPos  Centro do atacante em pixels de tela.
 * @param targetPos    Centro do alvo em pixels de tela (posição atual).
 * @param gridSize     Tamanho da célula em pixels (padrão: 100).
 * @param feetPerGrid  Pés por célula de grade (padrão: 5).
 * @returns Nova posição em pixels (centro da célula de destino) — AC-008.
 */
export function calculatePushVector(
  attackerPos: Point2D,
  targetPos: Point2D,
  gridSize = 100,
  feetPerGrid = 5
): Point2D {
  const dx = targetPos.x - attackerPos.x;
  const dy = targetPos.y - attackerPos.y;

  // Normaliza para 8 direções (chebyshev)
  const dirX = dx === 0 ? 0 : Math.sign(dx);
  const dirY = dy === 0 ? 0 : Math.sign(dy);

  // 5 pés em pixels
  const pixelsPerFoot = gridSize / feetPerGrid;
  const pushPixels = 5 * pixelsPerFoot;

  const rawX = targetPos.x + dirX * pushPixels;
  const rawY = targetPos.y + dirY * pushPixels;

  // Ajusta ao centro da célula mais próxima (usa floor para manter posição em coordenadas negativas)
  const snappedX = Math.floor(rawX / gridSize) * gridSize + gridSize / 2;
  const snappedY = Math.floor(rawY / gridSize) * gridSize + gridSize / 2;

  return { x: snappedX, y: snappedY };
}
