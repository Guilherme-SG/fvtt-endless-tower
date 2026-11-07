import { MODULE_TITLE } from "../constants";

export function registerCemeteryBless(): void {
  console.warn(`${MODULE_TITLE} | Cemetery Bless`);

  const CE_NAME = "Bênção do Cemitério";
  const SCENE_TAG = `[${CE_NAME}]`;

  async function applyUndeadBlessingAuto(tokenDocument: any): Promise<void> {
    const actor = tokenDocument.actor;
    if (!actor) return;

    if (!tokenDocument.parent?.name?.includes(SCENE_TAG)) return;

    const typeValue = actor.system?.details?.type?.value?.toLowerCase() || "";
    const raceValue = actor.system?.details?.race?.toString().toLowerCase() || "";
    const isUndead =
      typeValue === "undead" ||
      raceValue.includes("undead") ||
      raceValue.includes("morto-vivo");

    const dfreds = (game as any).dfreds;
    if (isUndead && dfreds?.effectInterface) {
      const hasEffect = dfreds.effectInterface.hasEffectApplied(CE_NAME, actor.uuid);

      if (!hasEffect) {
        await dfreds.effectInterface.addEffect({
          effectName: CE_NAME,
          uuid: actor.uuid,
        });

        setTimeout(async () => {
          const effect = actor.effects.find((e: any) => e.name === CE_NAME);
          if (effect) {
            await effect.update({
              img: null,
              "flags.core.statusId": null,
              "visual.overlay": false,
              hidden: true,
            });
          }
        }, 500);
      }
    }
  }

  Hooks.on("canvasReady", async (canvas: any) => {
    if (!game.user?.isGM) return;
    for (const token of canvas.tokens.placeables) {
      await applyUndeadBlessingAuto(token.document);
    }
  });

  Hooks.on("createToken", async (tokenDocument: any, _options: any, userId: string) => {
    if (game.user?.id !== userId) return;
    setTimeout(() => applyUndeadBlessingAuto(tokenDocument), 200);
  });
}
