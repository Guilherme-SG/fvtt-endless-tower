declare const Sequencer: any;

export function registerRagnarokAnimations(): void {
  Hooks.once("sequencer.ready", () => {
    const PATH = "/modules/endless-tower/fx/ragnarok-online-effects";
    const database = {
      conditions: {
        cursed: `${PATH}/conditions/cursed.webm`,
      },
      mobs: {
        "wraith-idle": `${PATH}/mobs/wraith-idle.webm`,
        "wraith-attack": `${PATH}/mobs/wraith-attack.webm`,
      },
    };

    if (typeof Sequencer !== "undefined" && Sequencer.Database) {
      Sequencer.Database.registerEntries("ragnarok-online-effects", database);
    }
  });
}
