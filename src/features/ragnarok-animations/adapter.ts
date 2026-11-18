import { RAGNAROK_DATABASE_KEY } from "./config";
import { buildRagnarokFxDatabase } from "./rules";

declare const Sequencer: any;

/**
 * Registers Ragnarok Online visual effects in Sequencer's database once ready.
 */
export function registerRagnarokAnimations(): void {
  Hooks.once("sequencer.ready", () => {
    const database = buildRagnarokFxDatabase();

    if (typeof Sequencer !== "undefined" && Sequencer.Database) {
      Sequencer.Database.registerEntries(RAGNAROK_DATABASE_KEY, database);
    }
  });
}
