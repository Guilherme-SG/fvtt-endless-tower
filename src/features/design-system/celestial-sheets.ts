import { MODULE_ID, MODULE_TITLE } from "../../constants";
import {
  ENDLESS_TOWER_SHEET_CLASS,
  ENDLESS_TOWER_SHEET_LABEL,
} from "./config";
import { createEndlessTowerSheetClasses, type SheetRegistryResult } from "./rules";

export {
  ENDLESS_TOWER_SHEET_CLASS,
  ENDLESS_TOWER_SHEET_LABEL,
  createEndlessTowerSheetClasses,
  type SheetRegistryResult,
};

/**
 * Registers the opt-in "Endless Tower Sheet" variants (Character and NPC) without overriding system defaults.
 */
export function registerEndlessTowerSheets(): boolean {
  const dnd5eActors = (globalThis as any).dnd5e?.applications?.actor;
  const DocumentSheetConfig = (foundry as any)?.applications?.apps?.DocumentSheetConfig;

  if (!dnd5eActors || !DocumentSheetConfig) {
    return false;
  }

  const classes = createEndlessTowerSheetClasses(dnd5eActors);
  if (!classes) {
    return false;
  }

  const ActorCls = (globalThis as any).Actor;

  DocumentSheetConfig.registerSheet(ActorCls, MODULE_ID, classes.CharacterSheetClass, {
    types: ["character"],
    makeDefault: false,
    label: ENDLESS_TOWER_SHEET_LABEL,
  });

  DocumentSheetConfig.registerSheet(ActorCls, MODULE_ID, classes.NPCSheetClass, {
    types: ["npc"],
    makeDefault: false,
    label: ENDLESS_TOWER_SHEET_LABEL,
  });

  console.log(
    `${MODULE_TITLE} | Registered "${ENDLESS_TOWER_SHEET_LABEL}" sheets (Character and NPC).`
  );
  return true;
}
