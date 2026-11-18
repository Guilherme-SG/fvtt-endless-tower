import { describe, it, expect } from "vitest";
import {
  isFullCaster,
  isHalfCaster,
  hasPreparingClasses,
  calculateMaxPreparedSpells,
} from "../src/features/prepare-spells-reminder/rules";
import { isUndeadCreature } from "../src/features/cemetery-bless/rules";
import {
  calculateTokenGridCenters,
  measureMinDistanceChebyshev,
  isBearerIsolated,
} from "../src/features/solitude/rules";

describe("Regras Puras (P-003: Desacoplamento do Foundry)", () => {
  describe("Regras de Conjuração (spellcasting)", () => {
    it("identifica corretamente full casters e half casters", () => {
      expect(isFullCaster("Wizard")).toBe(true);
      expect(isFullCaster("Cleric")).toBe(true);
      expect(isFullCaster("Fighter")).toBe(false);

      expect(isHalfCaster("Paladin")).toBe(true);
      expect(isHalfCaster("Ranger")).toBe(true);
      expect(isHalfCaster("Wizard")).toBe(false);
    });

    it("reconhece presença de classes preparadoras", () => {
      expect(hasPreparingClasses(["fighter", "rogue"])).toBe(false);
      expect(hasPreparingClasses(["rogue", "wizard"])).toBe(true);
      expect(hasPreparingClasses(["paladin"])).toBe(true);
    });

    it("calcula corretamente limite de magias preparadas para conjuradores", () => {
      // Mago nível 5 com Int 18 (+4) => 4 + floor(1 * 5) = 9
      const wizardPrep = calculateMaxPreparedSpells([
        { name: "wizard", level: 5, abilityModifier: 4 },
      ]);
      expect(wizardPrep).toBe(9);

      // Paladino nível 6 com Car 14 (+2) => 2 + floor(0.5 * 6) = 5
      const paladinPrep = calculateMaxPreparedSpells([
        { name: "paladin", level: 6, abilityModifier: 2 },
      ]);
      expect(paladinPrep).toBe(5);

      // Multiclasse Mago 3 (Int +3) + Clérigo 2 (Sab +2) => (3 + 3) + (2 + 2) = 10
      const multiclassPrep = calculateMaxPreparedSpells([
        { name: "wizard", level: 3, abilityModifier: 3 },
        { name: "cleric", level: 2, abilityModifier: 2 },
      ]);
      expect(multiclassPrep).toBe(10);
    });
  });

  describe("Identificação de Mortos-Vivos (undead)", () => {
    it("reconhece mortos-vivos por type ou race em inglês e português", () => {
      expect(isUndeadCreature("undead", null)).toBe(true);
      expect(isUndeadCreature("humanoid", "Morto-Vivo")).toBe(true);
      expect(isUndeadCreature("morto-vivo", "Humano")).toBe(true);
      expect(isUndeadCreature("Undead (zombie)", "")).toBe(true);

      expect(isUndeadCreature("humanoid", "elf")).toBe(false);
      expect(isUndeadCreature(null, null)).toBe(false);
    });
  });

  describe("Geometria e Isolamento de Combate (combat)", () => {
    it("gera centros corretos para tokens médios (1x1) e grandes (2x2)", () => {
      const mediumCenters = calculateTokenGridCenters({ x: 0, y: 0, width: 1, height: 1 }, 100);
      expect(mediumCenters).toEqual([{ x: 50, y: 50 }]);

      const largeCenters = calculateTokenGridCenters({ x: 0, y: 0, width: 2, height: 2 }, 100);
      expect(largeCenters.length).toBe(4);
      expect(largeCenters).toContainEqual({ x: 50, y: 50 });
      expect(largeCenters).toContainEqual({ x: 150, y: 150 });
    });

    it("mede distância entre tokens adjacentes e afastados na métrica 5/5/5", () => {
      const tokenA = { x: 0, y: 0, width: 1, height: 1 };
      const adjacentToken = { x: 100, y: 0, width: 1, height: 1 };
      const diagonalToken = { x: 100, y: 100, width: 1, height: 1 };
      const distantToken = { x: 300, y: 0, width: 1, height: 1 };

      expect(measureMinDistanceChebyshev(tokenA, adjacentToken, 100, 5)).toBe(5);
      expect(measureMinDistanceChebyshev(tokenA, diagonalToken, 100, 5)).toBe(5);
      expect(measureMinDistanceChebyshev(tokenA, distantToken, 100, 5)).toBe(15);
    });

    it("determina corretamente se o portador está isolado (Solitude)", () => {
      const bearer = { x: 0, y: 0, width: 1, height: 1 };

      // Caso 1: aliado consciente a 5 ft (adjacente) -> NÃO isolado
      const allyClose = {
        id: "ally-1",
        isConscious: true,
        bounds: { x: 100, y: 0, width: 1, height: 1 },
      };
      expect(isBearerIsolated(bearer, [allyClose])).toBe(false);

      // Caso 2: aliado a 5 ft, mas INCONSCIENTE (morto/desmaiado) -> ISOLADO
      const allyUnconscious = {
        id: "ally-2",
        isConscious: false,
        bounds: { x: 100, y: 0, width: 1, height: 1 },
      };
      expect(isBearerIsolated(bearer, [allyUnconscious])).toBe(true);

      // Caso 3: aliado consciente a 15 ft (além dos 10 ft) -> ISOLADO
      const allyFar = {
        id: "ally-3",
        isConscious: true,
        bounds: { x: 300, y: 0, width: 1, height: 1 },
      };
      expect(isBearerIsolated(bearer, [allyFar])).toBe(true);
    });
  });
});
