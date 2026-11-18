export {
  registerCriticalEncounter,
  CriticalEncounterManager,
} from "./adapter";
export {
  buildUpdatedMidiSaveSettings,
  normalizeTableSearchName,
  resolveCriticalHitTableName,
  resolveCriticalFumbleTableName,
  buildCriticalAnnouncementHtml,
  buildCriticalRollCardHtml,
  type MidiRollSystem,
  type CriticalItemDescriptor,
} from "./rules";
export {
  SOCKET_ACTION_BANNER,
  DEFAULT_BANNER_DURATION_MS,
  DEFAULT_CRITICAL_SOUND,
  CRITICAL_TABLE_NAMES,
  UI_TEXT,
} from "./config";
