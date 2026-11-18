import { FULL_CASTERS, HALF_CASTERS, PREP_CASTERS, UI_TEXT } from "./config";

export interface ClassSpellcastingInfo {
  name: string;
  level: number;
  abilityModifier: number;
}

/**
 * Checks whether a class name belongs to a full preparation caster.
 */
export function isFullCaster(className: string): boolean {
  const normalized = className.toLowerCase();
  return FULL_CASTERS.some((c) => normalized.includes(c));
}

/**
 * Checks whether a class name belongs to a half preparation caster.
 */
export function isHalfCaster(className: string): boolean {
  const normalized = className.toLowerCase();
  return HALF_CASTERS.some((c) => normalized.includes(c));
}

/**
 * Returns the spellcasting progression multiplier for a class name.
 */
export function getCasterMultiplier(className: string): number {
  if (isFullCaster(className)) return 1;
  if (isHalfCaster(className)) return 0.5;
  return 0;
}

/**
 * Checks whether any class in the list prepares spells daily.
 */
export function hasPreparingClasses(classNames: string[]): boolean {
  return classNames.some((c) => {
    const normalized = c.toLowerCase();
    return PREP_CASTERS.some((p) => normalized.includes(p));
  });
}

/**
 * Calculates the expected maximum prepared spells across all preparing classes.
 * Formula per class: key ability modifier + floor(level * multiplier), minimum 1 per class.
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

/**
 * Builds the HTML body for the spell preparation reminder dialog.
 */
export function buildPrepareSpellsDialogHtml(preparedCount: number, maxPreparedCount: number): string {
  return `
      <form>
        <div class='prep-spells-dialog'>${UI_TEXT.dialogMessage}</div>
        <br>
        <div style='text-align: center; font-weight: bold; opacity: 0.5'>${UI_TEXT.preparedCountLabel(preparedCount, maxPreparedCount)}</div>
      </form>`;
}
