import { RAGNAROK_FX_PATH } from "./config";

export interface RagnarokFxDatabase {
  conditions: {
    cursed: string;
  };
  mobs: {
    "wraith-idle": string;
    "wraith-attack": string;
  };
}

/**
 * Builds the Sequencer database map for Ragnarok Online animation assets.
 */
export function buildRagnarokFxDatabase(basePath: string = RAGNAROK_FX_PATH): RagnarokFxDatabase {
  return {
    conditions: {
      cursed: `${basePath}/conditions/cursed.webm`,
    },
    mobs: {
      "wraith-idle": `${basePath}/mobs/wraith-idle.webm`,
      "wraith-attack": `${basePath}/mobs/wraith-attack.webm`,
    },
  };
}
