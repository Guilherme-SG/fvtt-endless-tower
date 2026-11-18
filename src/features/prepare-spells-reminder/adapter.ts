import { UI_TEXT } from "./config";
import {
  buildPrepareSpellsDialogHtml,
  calculateMaxPreparedSpells,
  getCasterMultiplier,
  hasPreparingClasses,
  type ClassSpellcastingInfo,
} from "./rules";

/**
 * Registers a hook to remind spellcasters to prepare spells after completing a long rest.
 */
export function registerPrepareSpellsReminder(): void {
  Hooks.on("dnd5e.restCompleted", async (actor: any, result: any) => {
    const classNames = Object.keys(actor.classes || {});
    if (result?.longRest && hasPreparingClasses(classNames) && actor.hasPlayerOwner) {
      const spellcastingInfos: ClassSpellcastingInfo[] = [];

      for (const className of classNames) {
        if (getCasterMultiplier(className) > 0) {
          const castingAbility = actor.classes[className]?.system.spellcasting?.ability;
          const modifier = actor.system?.abilities?.[castingAbility]?.mod || 0;
          const level = actor.classes[className]?.system.levels || 0;
          spellcastingInfos.push({
            name: className,
            level,
            abilityModifier: modifier,
          });
        }
      }

      const numPrepared = (actor.items || []).filter(
        (i: any) =>
          i.type === "spell" &&
          i.system?.preparation?.prepared &&
          i.system?.preparation?.mode === "prepared"
      ).length;

      const numMaxPrepared = calculateMaxPreparedSpells(spellcastingInfos);
      const content = buildPrepareSpellsDialogHtml(numPrepared, numMaxPrepared);

      new (Dialog as any)(
        {
          title: UI_TEXT.dialogTitle,
          content,
          buttons: {
            yes: {
              label: UI_TEXT.confirmButtonLabel,
            },
          },
        },
        { classes: ["et-dialog"] }
      ).render(true);
    }
  });
}
