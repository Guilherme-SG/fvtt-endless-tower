/**
 * Pure Design System rules (attack roll critical detection, opt-in sheet class factory,
 * volume clamping, and W3C DTCG token audit helpers). Free of external runtime globals.
 */

import {
  ENDLESS_TOWER_SHEET_CLASS,
  NON_ATTACK_ROLL_TYPES,
} from "./config";

export {
  AGENTIC_DESIGN_TOKENS,
  COMPONENT_CONTRACTS,
  auditAgenticTokens,
  getContrastRatio,
  getRelativeLuminance,
  parseColorToRgb,
  extractAlphaFromCssValue,
  type AgenticTokenDefinition,
  type ComponentContract,
  type DesignSystemAuditReport,
  type RgbColor,
  type TokenAuditResult,
  type TokenRole,
} from "./agentic-tokens";

export interface AttackRollOutcome {
  isCritical: boolean;
  isFumble: boolean;
}

export interface SheetRegistryResult {
  CharacterSheetClass: any;
  NPCSheetClass: any;
}

/**
 * Inspects active d20 terms on a single roll object for natural 20 or natural 1 results.
 */
export function inspectD20RollTerms(roll: any): AttackRollOutcome {
  let isCritical = false;
  let isFumble = false;

  if (!roll || roll.options?.type === "damage") {
    return { isCritical, isFumble };
  }

  for (const term of roll.terms || []) {
    if (term?.faces !== 20 || !Array.isArray(term.results)) continue;

    for (const res of term.results) {
      if (res.active === false || res.discarded || res.rerolled) continue;
      if (res.critical || res.result === 20) isCritical = true;
      if (res.fumble || res.result === 1) isFumble = true;
    }
  }

  return { isCritical, isFumble };
}

/**
 * Evaluates whether a chat message contains a critical hit or fumble exclusively on an attack roll.
 * Never triggers on damage dice (e.g., 1d6 rolling 1), saving throws, skill checks, or discarded dice.
 */
export function isAttackRollCriticalOrFumble(
  message: any,
  el?: HTMLElement | null
): AttackRollOutcome {
  const midiAttackEl = el?.querySelector?.(".midi-qol-attack-roll") as HTMLElement | null;
  const midiFlags = message?.flags?.["midi-qol"];

  if (midiAttackEl) {
    const attackTotalEl = midiAttackEl.querySelector(".dice-total");
    let isCritical =
      attackTotalEl?.classList?.contains("critical") ||
      attackTotalEl?.classList?.contains("high") ||
      midiFlags?.isCritical === true;
    let isFumble =
      attackTotalEl?.classList?.contains("fumble") ||
      attackTotalEl?.classList?.contains("low") ||
      midiFlags?.isFumble === true;

    if (!isCritical && !isFumble && Array.isArray(message?.rolls) && message.rolls.length > 0) {
      const firstRollOutcome = inspectD20RollTerms(message.rolls[0]);
      isCritical = firstRollOutcome.isCritical;
      isFumble = firstRollOutcome.isFumble;
    }

    return { isCritical: Boolean(isCritical), isFumble: Boolean(isFumble) };
  }

  if (el?.querySelector?.(".midi-qol-damage-roll")) {
    return { isCritical: false, isFumble: false };
  }

  const rollType = message?.flags?.dnd5e?.roll?.type ?? message?.flags?.dnd5e?.activity?.type;
  if (typeof rollType === "string" && rollType !== "attack") {
    if (NON_ATTACK_ROLL_TYPES.has(rollType) || rollType.length > 0) {
      return { isCritical: false, isFumble: false };
    }
  }

  let isCritical = Boolean(midiFlags?.isCritical === true);
  let isFumble = Boolean(midiFlags?.isFumble === true);

  if (!isCritical && !isFumble) {
    for (const roll of message?.rolls || []) {
      const outcome = inspectD20RollTerms(roll);
      if (outcome.isCritical) isCritical = true;
      if (outcome.isFumble) isFumble = true;
    }
  }

  return { isCritical, isFumble };
}

/**
 * Builds pure subclasses of CharacterActorSheet and NPCActorSheet tagged with `.et-sheet`,
 * preserving 100% of native D&D 5e sheet layout and behavior.
 */
export function createEndlessTowerSheetClasses(dnd5eActorApps: {
  CharacterActorSheet?: any;
  NPCActorSheet?: any;
}): SheetRegistryResult | null {
  const BaseCharacterSheet = dnd5eActorApps?.CharacterActorSheet;
  const BaseNPCSheet = dnd5eActorApps?.NPCActorSheet;

  if (!BaseCharacterSheet || !BaseNPCSheet) {
    return null;
  }

  class EndlessTowerCharacterSheet extends BaseCharacterSheet {
    static DEFAULT_OPTIONS = {
      classes: [ENDLESS_TOWER_SHEET_CLASS],
    };
  }

  class EndlessTowerNPCSheet extends BaseNPCSheet {
    static DEFAULT_OPTIONS = {
      classes: [ENDLESS_TOWER_SHEET_CLASS],
    };
  }

  // Preserve base constructor names so third-party sheet adapters (e.g., Plutonium Level Up button)
  // recognize Endless Tower opt-in sheets identically to native CharacterActorSheet / NPCActorSheet.
  Object.defineProperty(EndlessTowerCharacterSheet, "name", {
    value: BaseCharacterSheet.name || "CharacterActorSheet",
    configurable: true,
  });
  Object.defineProperty(EndlessTowerNPCSheet, "name", {
    value: BaseNPCSheet.name || "NPCActorSheet",
    configurable: true,
  });

  return {
    CharacterSheetClass: EndlessTowerCharacterSheet,
    NPCSheetClass: EndlessTowerNPCSheet,
  };
}

/**
 * Clamps an audio volume value into the [0, 1] range.
 */
export function clampAudioVolume(volume: number): number {
  return Math.max(0, Math.min(1, volume));
}
