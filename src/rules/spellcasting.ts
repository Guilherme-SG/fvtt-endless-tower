/**
 * Regras puras de conjuração e preparação de magias para D&D 5e.
 * Desacopladas de variáveis globais do Foundry VTT.
 */

export const FULL_CASTERS = ["cleric", "druid", "wizard"];
export const HALF_CASTERS = ["artificer", "paladin", "ranger"];
export const PREP_CASTERS = [
  "artificer",
  "cleric",
  "druid",
  "paladin",
  "ranger",
  "wizard",
  "witch",
];

export function isFullCaster(className: string): boolean {
  const normalized = className.toLowerCase();
  return FULL_CASTERS.some((c) => normalized.includes(c));
}

export function isHalfCaster(className: string): boolean {
  const normalized = className.toLowerCase();
  return HALF_CASTERS.some((c) => normalized.includes(c));
}

export function getCasterMultiplier(className: string): number {
  if (isFullCaster(className)) return 1;
  if (isHalfCaster(className)) return 0.5;
  return 0;
}

export function hasPreparingClasses(classNames: string[]): boolean {
  return classNames.some((c) => {
    const normalized = c.toLowerCase();
    return PREP_CASTERS.some((p) => normalized.includes(p));
  });
}

export interface ClassSpellcastingInfo {
  name: string;
  level: number;
  abilityModifier: number;
}

/**
 * Calcula o número máximo esperado de magias preparadas para uma lista de classes.
 * Fórmula por classe: modificador do atributo chave + floor(nível * multiplicador).
 * Mínimo de 1 magia por classe preparadora (salvo modificador negativo severo).
 */
export function calculateMaxPreparedSpells(classes: ClassSpellcastingInfo[]): number {
  let total = 0;
  for (const cls of classes) {
    const mult = getCasterMultiplier(cls.name);
    if (mult > 0) {
      const classMax = cls.abilityModifier + Math.floor(mult * cls.level);
      total += Math.max(1, classMax);
    }
  }
  return total;
}
