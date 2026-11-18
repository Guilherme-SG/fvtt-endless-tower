import { describe, it, expect } from 'vitest';
import {
  getSizeRank,
  validateManeuverPrerequisites,
  determineContestWinner,
  getDisarmModifiers,
  calculatePushVector,
  type CreatureInfo,
} from '../src/features/combat-maneuvers/rules';

// ---------------------------------------------------------------------------
// Proof for P-003: rules.ts must not reference Foundry globals
// ---------------------------------------------------------------------------
describe('P-003 — Foundry decoupling', () => {
  it('combat-maneuvers/rules.ts contains no references to game, canvas, Hooks, ui, or ChatMessage', async () => {
    const fs = await import('node:fs/promises');
    const rawSrc = await fs.readFile(new URL('../src/features/combat-maneuvers/rules.ts', import.meta.url), 'utf-8');

    const codeOnly = rawSrc
      .split('\n')
      .filter(line => !/^\s*(\/\/|\/\*|\*)/.test(line))
      .join('\n');

    const forbidden: Array<[RegExp, string]> = [
      [/\bgame\s*[.[(]/, 'game (property/method access)'],
      [/\bcanvas\s*[.[(]/, 'canvas (property/method access)'],
      [/\bHooks\s*[.[(]/, 'Hooks (property/method access)'],
      [/\bui\s*[.[(]/, 'ui (property/method access)'],
      [/\bChatMessage\s*[.[(]/, 'ChatMessage (property/method access)'],
    ];

    for (const [pattern, label] of forbidden) {
      expect(codeOnly, `Forbidden pattern found: ${label}`).not.toMatch(pattern);
    }
  });
});

// ---------------------------------------------------------------------------
// getSizeRank
// ---------------------------------------------------------------------------
describe('getSizeRank', () => {
  it('mapeia todos os tamanhos corretamente', () => {
    expect(getSizeRank('tiny')).toBe(0);
    expect(getSizeRank('small')).toBe(1);
    expect(getSizeRank('medium')).toBe(2);
    expect(getSizeRank('large')).toBe(3);
    expect(getSizeRank('huge')).toBe(4);
    expect(getSizeRank('gargantuan')).toBe(5);
  });
});

// ---------------------------------------------------------------------------
// validateManeuverPrerequisites
// ---------------------------------------------------------------------------
describe('validateManeuverPrerequisites', () => {
  const mediumAttacker: CreatureInfo = {
    size: 'medium',
    bounds: { x: 0, y: 0, width: 1, height: 1 },
  };
  const mediumTarget: CreatureInfo = {
    size: 'medium',
    bounds: { x: 100, y: 0, width: 1, height: 1 },
  };
  const hugeTarget: CreatureInfo = {
    size: 'huge',
    bounds: { x: 100, y: 0, width: 3, height: 3 },
  };
  const largeTarget: CreatureInfo = {
    size: 'large',
    bounds: { x: 100, y: 0, width: 2, height: 2 },
  };

  it('@spec:AC-022 — válido a 5 pés com mesmo tamanho (grapple)', () => {
    const result = validateManeuverPrerequisites(mediumAttacker, mediumTarget, 'grapple', 5);
    expect(result.valid).toBe(true);
    expect(result.reason).toBeUndefined();
  });

  it('@spec:AC-022 — falha se alvo estiver a 10 pés', () => {
    const result = validateManeuverPrerequisites(mediumAttacker, mediumTarget, 'shove', 10);
    expect(result.valid).toBe(false);
    expect(result.reason).toMatch(/10 pés/);
  });

  it('@spec:AC-022 — falha se alvo estiver a 15 pés (disarm)', () => {
    const result = validateManeuverPrerequisites(mediumAttacker, mediumTarget, 'disarm', 15);
    expect(result.valid).toBe(false);
    expect(result.reason).toMatch(/15 pés/);
  });

  it('@spec:AC-023 — falha: Huge vs Medium no grapple (diferença > 1 categoria)', () => {
    const result = validateManeuverPrerequisites(mediumAttacker, hugeTarget, 'grapple', 5);
    expect(result.valid).toBe(false);
    expect(result.reason).toMatch(/Agarrar/);
  });

  it('@spec:AC-023 — falha: Huge vs Medium no shove (diferença > 1 categoria)', () => {
    const result = validateManeuverPrerequisites(mediumAttacker, hugeTarget, 'shove', 5);
    expect(result.valid).toBe(false);
    expect(result.reason).toMatch(/Empurrar/);
  });

  it('@spec:AC-023 — válido: Large vs Medium no grapple (diferença = 1 categoria)', () => {
    const result = validateManeuverPrerequisites(mediumAttacker, largeTarget, 'grapple', 5);
    expect(result.valid).toBe(true);
  });

  it('@spec:AC-023 — Huge vs Medium no disarm é válido (sem restrição de tamanho)', () => {
    const result = validateManeuverPrerequisites(mediumAttacker, hugeTarget, 'disarm', 5);
    expect(result.valid).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// determineContestWinner
// ---------------------------------------------------------------------------
describe('determineContestWinner', () => {
  it('@spec:AC-026 — empate favorece o defensor (15 vs 15)', () => {
    expect(determineContestWinner(15, 15)).toBe('defender');
  });

  it('@spec:AC-026 — atacante vence com total maior (16 vs 15)', () => {
    expect(determineContestWinner(16, 15)).toBe('attacker');
  });

  it('@spec:AC-026 — defensor vence com total maior (10 vs 20)', () => {
    expect(determineContestWinner(10, 20)).toBe('defender');
  });

  it('@spec:AC-026 — atacante vence por 1 ponto (21 vs 20)', () => {
    expect(determineContestWinner(21, 20)).toBe('attacker');
  });
});

// ---------------------------------------------------------------------------
// getDisarmModifiers
// ---------------------------------------------------------------------------
describe('getDisarmModifiers', () => {
  it('arma de duas mãos concede desvantagem ao atacante', () => {
    const result = getDisarmModifiers('medium', 'medium', true);
    expect(result.disadvantage).toBe(true);
    expect(result.advantage).toBe(false);
  });

  it('atacante Large vs defensor Medium concede vantagem', () => {
    const result = getDisarmModifiers('large', 'medium', false);
    expect(result.advantage).toBe(true);
    expect(result.disadvantage).toBe(false);
  });

  it('defensor Large vs atacante Medium concede desvantagem', () => {
    const result = getDisarmModifiers('medium', 'large', false);
    expect(result.advantage).toBe(false);
    expect(result.disadvantage).toBe(true);
  });

  it('mesmo tamanho, arma de uma mão: sem vantagem nem desvantagem', () => {
    const result = getDisarmModifiers('medium', 'medium', false);
    expect(result.advantage).toBe(false);
    expect(result.disadvantage).toBe(false);
  });

  it('atacante maior E arma de duas mãos: ambos podem ser verdadeiros (se anulam)', () => {
    const result = getDisarmModifiers('huge', 'medium', true);
    expect(result.advantage).toBe(true);
    expect(result.disadvantage).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// calculatePushVector
// ---------------------------------------------------------------------------
describe('calculatePushVector', () => {
  // gridSize=100, feetPerGrid=5 → push 5ft = 100px = 1 célula
  // Snap: Math.floor(raw / gridSize) * gridSize + gridSize/2

  it('@spec:AC-028 — empurrão para o Norte (atacante abaixo do alvo)', () => {
    // atk=(50,150), tgt=(50,50) → dir=(0,-1) → rawX=50, rawY=-50
    // snapX: floor(0.5)=0 → 50; snapY: floor(-0.5)=-1 → -100+50=-50
    const result = calculatePushVector({ x: 50, y: 150 }, { x: 50, y: 50 });
    expect(result.x).toBe(50);
    expect(result.y).toBe(-50);
  });

  it('@spec:AC-028 — empurrão para o Sul (atacante acima do alvo)', () => {
    // atk=(50,50), tgt=(50,150) → dir=(0,1) → rawX=50, rawY=250
    // snapX: floor(0.5)=0 → 50; snapY: floor(2.5)=2 → 200+50=250
    const result = calculatePushVector({ x: 50, y: 50 }, { x: 50, y: 150 });
    expect(result.x).toBe(50);
    expect(result.y).toBe(250);
  });

  it('@spec:AC-028 — empurrão para o Leste (atacante à esquerda)', () => {
    // atk=(50,50), tgt=(150,50) → dir=(1,0) → rawX=250, rawY=50
    // snapX: floor(2.5)=2 → 250; snapY: floor(0.5)=0 → 50
    const result = calculatePushVector({ x: 50, y: 50 }, { x: 150, y: 50 });
    expect(result.x).toBe(250);
    expect(result.y).toBe(50);
  });

  it('@spec:AC-028 — empurrão para o Oeste (atacante à direita)', () => {
    // atk=(150,50), tgt=(50,50) → dir=(-1,0) → rawX=-50, rawY=50
    // snapX: floor(-0.5)=-1 → -100+50=-50; snapY: floor(0.5)=0 → 50
    const result = calculatePushVector({ x: 150, y: 50 }, { x: 50, y: 50 });
    expect(result.x).toBe(-50);
    expect(result.y).toBe(50);
  });

  it('@spec:AC-028 — empurrão diagonal (NE): atacante SW do alvo', () => {
    // atk=(50,150), tgt=(150,50) → dir=(1,-1)
    // rawX=250, rawY=-50 → snapX: floor(2.5)=2 → 250; snapY: floor(-0.5)=-1 → -50
    const result = calculatePushVector({ x: 50, y: 150 }, { x: 150, y: 50 });
    expect(result.x).toBe(250);
    expect(result.y).toBe(-50);
  });

  it('@spec:AC-028 — empurrão diagonal (SW): atacante NE do alvo', () => {
    // atk=(250,50), tgt=(150,150) → dir=(-1,1)
    // rawX=50, rawY=250 → snapX: floor(0.5)=0 → 50; snapY: floor(2.5)=2 → 250
    const result = calculatePushVector({ x: 250, y: 50 }, { x: 150, y: 150 });
    expect(result.x).toBe(50);
    expect(result.y).toBe(250);
  });

  it('@spec:AC-028 — retorna posição snappada ao centro da célula', () => {
    // atk=(0,200), tgt=(0,100) → dir=(0,-1) → rawX=0, rawY=0
    // snapX: floor(0)=0 → 50; snapY: floor(0)=0 → 50
    const result = calculatePushVector({ x: 0, y: 200 }, { x: 0, y: 100 });
    expect(result.x).toBe(50);
    expect(result.y).toBe(50);
  });
});
