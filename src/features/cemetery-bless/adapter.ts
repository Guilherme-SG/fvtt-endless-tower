import { MODULE_TITLE } from "../../constants";
import {
  CEMETERY_EFFECT_NAME,
  CEMETERY_SCENE_TAG,
  HIDE_EFFECT_DELAY_MS,
} from "./config";
import { hasCemeterySceneTag, isUndeadCreature } from "./rules";

async function applyUndeadBlessingAuto(tokenDocument: any): Promise<void> {
  const actor = tokenDocument?.actor;
  if (!actor) return;

  if (!hasCemeterySceneTag(tokenDocument.parent?.name, CEMETERY_SCENE_TAG)) return;

  const typeValue = actor.system?.details?.type?.value;
  const raceValue = actor.system?.details?.race?.toString();
  const isUndead = isUndeadCreature(typeValue, raceValue);

  const dfreds = (game as any).dfreds;
  if (isUndead && dfreds?.effectInterface) {
    const hasEffect = dfreds.effectInterface.hasEffectApplied(CEMETERY_EFFECT_NAME, actor.uuid);

    if (!hasEffect) {
      await dfreds.effectInterface.addEffect({
        effectName: CEMETERY_EFFECT_NAME,
        uuid: actor.uuid,
      });

      setTimeout(async () => {
        const effect = actor.effects.find((e: any) => e.name === CEMETERY_EFFECT_NAME);
        if (effect) {
          await effect.update({
            img: null,
            "flags.core.statusId": null,
            "visual.overlay": false,
            hidden: true,
          });
        }
      }, HIDE_EFFECT_DELAY_MS);
    }
  }
}

/**
 * Registers hooks to automatically apply the Cemetery Blessing effect to undead tokens.
 */
export function registerCemeteryBless(): void {
  console.warn(`${MODULE_TITLE} | Cemetery Bless initialized`);

  Hooks.on("canvasReady", async (activeCanvas: any) => {
    if (!game.user?.isGM) return;
    for (const token of activeCanvas.tokens.placeables) {
      await applyUndeadBlessingAuto(token.document);
    }
  });

  Hooks.on("createToken", async (tokenDocument: any, _options: any, userId: string) => {
    if (game.user?.id !== userId) return;
    await applyUndeadBlessingAuto(tokenDocument);
  });
}
