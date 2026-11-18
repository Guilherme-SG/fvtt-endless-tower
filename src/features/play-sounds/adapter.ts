import { MODULE_TITLE } from "../../constants";
import {
  FANFARE_VIDEO_URL,
  START_ENCOUNTER_SOUND,
  UI_TEXT,
  YOUTUBE_MODULE_ID,
  YOUTUBE_VIDEO_SETTING,
} from "./config";
import { isFirstRoundStart } from "./rules";

function playVictoryFanfare(): void {
  (ui as any).notifications?.info(UI_TEXT.playingNotification);
  (game as any).settings?.set?.(YOUTUBE_MODULE_ID, YOUTUBE_VIDEO_SETTING, FANFARE_VIDEO_URL);
}

/**
 * Registers combat start sound and end-of-combat victory fanfare prompt hooks.
 */
export function registerPlaySoundsHooks(): void {
  Hooks.on("updateCombat", (combat: any, updates: any) => {
    if (isFirstRoundStart(updates?.round, combat?.previous?.round)) {
      if (typeof combat._playCombatSound === "function") {
        combat._playCombatSound(START_ENCOUNTER_SOUND);
      }
    }
  });

  Hooks.on("deleteCombat", async () => {
    if (!game.user?.isGM) return;

    const DialogV2 = (foundry as any)?.applications?.api?.DialogV2;
    if (DialogV2) {
      await DialogV2.confirm({
        window: { title: UI_TEXT.dialogTitle },
        content: UI_TEXT.dialogContent,
        yes: {
          icon: '<i class="fas fa-music"></i>',
          label: UI_TEXT.yesLabel,
          callback: () => playVictoryFanfare(),
        },
        no: {
          icon: '<i class="fas fa-times"></i>',
          label: UI_TEXT.noLabel,
          callback: () => console.log(`${MODULE_TITLE} | Victory fanfare cancelled.`),
        },
        defaultYes: true,
      });
      return;
    }

    new (Dialog as any)({
      title: UI_TEXT.dialogTitle,
      content: UI_TEXT.dialogContent,
      buttons: {
        yes: {
          icon: '<i class="fas fa-music"></i>',
          label: UI_TEXT.yesLabel,
          callback: () => playVictoryFanfare(),
        },
        no: {
          icon: '<i class="fas fa-times"></i>',
          label: UI_TEXT.noLabel,
          callback: () => console.log(`${MODULE_TITLE} | Victory fanfare cancelled.`),
        },
      },
      default: "yes",
    }).render(true);
  });
}
