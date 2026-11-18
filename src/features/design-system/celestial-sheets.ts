import { MODULE_ID, MODULE_TITLE } from "../../constants";

export const ENDLESS_TOWER_SHEET_LABEL = "Endless Tower Sheet";
export const ENDLESS_TOWER_SHEET_CLASS = "et-sheet";

export interface SheetRegistryResult {
  CharacterSheetClass: any;
  NPCSheetClass: any;
}

/**
 * Cria subclasses puras de CharacterActorSheet e NPCActorSheet com a classe `.et-sheet`,
 * mantendo 100% do layout e funcionalidades nativas do D&D 5e.
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

  return {
    CharacterSheetClass: EndlessTowerCharacterSheet,
    NPCSheetClass: EndlessTowerNPCSheet,
  };
}

/**
 * Registra as fichas "Endless Tower Sheet" (Player e NPC) sem sobrescrever o padrão do sistema.
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

  console.log(`${MODULE_TITLE} | Fichas "Endless Tower Sheet" (Character e NPC) registradas.`);
  return true;
}
