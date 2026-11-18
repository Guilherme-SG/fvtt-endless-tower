import { DETURPATION_ROLL_FORMULA, UI_TEXT } from "./config";
import { getOwnerUserIds, resolveDeturpationOutcome } from "./rules";

async function setDfredsEffect(
  dfreds: any,
  uuid: string,
  effectName: string,
  shouldApply: boolean
): Promise<void> {
  if (!dfreds?.effectInterface) return;
  const has = await dfreds.effectInterface.hasEffectApplied(effectName, uuid);
  if (shouldApply && !has) {
    await dfreds.effectInterface.addEffect({ effectName, uuid });
  } else if (!shouldApply && has) {
    await dfreds.effectInterface.removeEffect({ effectName, uuid });
  }
}

/**
 * Rolls the Sensorial Deturpation table on an actor, updating DFreds damage modifiers and whispering the result.
 */
export async function runSensorialDeturpation(actor: any): Promise<void> {
  if (!actor) {
    (ui as any).notifications?.warn(UI_TEXT.noActorWarning);
    return;
  }

  const dfreds = (game as any).dfreds;
  const dice = new (Roll as any)(DETURPATION_ROLL_FORMULA);
  const result = await dice.roll();

  if ((game as any).dice3d) {
    (game as any).dice3d.showForRoll(dice, undefined, true);
  }

  const outcome = resolveDeturpationOutcome(Number(result.total));
  const { uuid } = actor;

  for (const effectName of outcome.removeEffects) {
    await setDfredsEffect(dfreds, uuid, effectName, false);
  }
  for (const effectName of outcome.addEffects) {
    await setDfredsEffect(dfreds, uuid, effectName, true);
  }

  const ownerIds = getOwnerUserIds(actor.ownership);
  await ChatMessage.create({
    content: outcome.whisperMessage,
    whisper: ownerIds,
  } as any);
}

/**
 * Initializes the Sensorial Deturpation feature (API-triggered feature).
 */
export function registerSensorialDeturpation(): void {
  // Triggered on demand via module API / macros
}
