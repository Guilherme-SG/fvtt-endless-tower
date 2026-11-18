import { MODULE_ID, MODULE_TITLE } from "../../constants";
import { getDistanceInFeet } from "../solitude";
import {
  BLESSING_COMPENDIUM_ID,
  DIALOG_WIDTH_PX,
  EFFECT_ICON,
  EFFECT_NAME,
  MAX_RANGE_FEET,
  RANGE_EPSILON_FEET,
  SOCKET_ACTION_APPLY,
  SOCKET_ACTION_PROMPT,
  TEMPORAL_EFFECT_CHANGES,
  TEMPORAL_SPECIAL_DURATION,
  TEMPORAL_VFX,
  UI_TEXT,
} from "./config";
import {
  buildTemporalChatCardHtml,
  buildTemporalDialogHtml,
  buildTemporalEffectDescription,
  calculateTemporalSynchronyUses,
  shouldDebounceTrigger,
  type TemporalUsesSummary,
} from "./rules";

declare const Sequence: any;

const lastPromptTimestamps = new Map<string, number>();

/**
 * Finds the Temporal Synchrony blessing item on an actor.
 */
export function getTemporalSynchronyItem(actor: any): any {
  if (!actor?.items) return null;
  return actor.items.find(
    (item: any) =>
      item.name?.toLowerCase().includes("no lugar certo") ||
      item.flags?.core?.sourceId?.includes(BLESSING_COMPENDIUM_ID) ||
      item.getFlag?.(MODULE_ID, "isNoLugarCerto")
  );
}

/**
 * Returns the current and maximum uses of Temporal Synchrony for an actor.
 */
export function getTemporalSynchronyUses(actor: any, item?: any): TemporalUsesSummary {
  const blessItem = item ?? getTemporalSynchronyItem(actor);
  const prof = Number(actor.system?.attributes?.prof);

  if (!blessItem) {
    return { current: 0, max: calculateTemporalSynchronyUses(prof).max };
  }

  return calculateTemporalSynchronyUses(
    prof,
    blessItem.system?.uses,
    blessItem.getFlag?.(MODULE_ID, "temporalUses")
  );
}

/**
 * Consumes 1 use of Temporal Synchrony from item uses or module flag.
 */
export async function consumeTemporalSynchronyUse(actor: any, item?: any): Promise<number> {
  const blessItem = item ?? getTemporalSynchronyItem(actor);
  if (!blessItem) return 0;

  const { current } = getTemporalSynchronyUses(actor, blessItem);
  const newCurrent = Math.max(0, current - 1);

  if (blessItem.system?.uses?.max) {
    await blessItem.update({ "system.uses.value": newCurrent });
  } else {
    await blessItem.setFlag(MODULE_ID, "temporalUses", newCurrent);
  }

  return newCurrent;
}

/**
 * Restores all uses of Temporal Synchrony (typically on a Long Rest).
 */
export async function recoverTemporalSynchronyUses(actor: any): Promise<void> {
  const blessItem = getTemporalSynchronyItem(actor);
  if (!blessItem) return;

  const { max } = calculateTemporalSynchronyUses(Number(actor.system?.attributes?.prof));
  if (blessItem.system?.uses?.max) {
    await blessItem.update({ "system.uses.value": max });
  } else {
    await blessItem.setFlag(MODULE_ID, "temporalUses", max);
  }
}

/**
 * Finds all conscious creatures within range of the source token.
 */
export function getValidTargetsInRange(
  sourceToken: any
): Array<{ token: any; name: string; distance: number }> {
  if (!canvas.scene?.tokens || !sourceToken) return [];

  const sourceBounds = {
    x: sourceToken.x,
    y: sourceToken.y,
    width: sourceToken.document?.width ?? sourceToken.width ?? 1,
    height: sourceToken.document?.height ?? sourceToken.height ?? 1,
  };

  const results: Array<{ token: any; name: string; distance: number }> = [];

  for (const other of canvas.scene.tokens) {
    if (other.id === sourceToken.id || other.actorId === sourceToken.actorId) continue;
    if (!other.actor) continue;

    const hp = other.actor.system?.attributes?.hp?.value ?? 0;
    if (hp <= 0) continue;

    const otherBounds = {
      x: other.x,
      y: other.y,
      width: other.width ?? 1,
      height: other.height ?? 1,
    };

    const dist = getDistanceInFeet(sourceBounds, otherBounds, sourceToken, other);
    if (dist <= MAX_RANGE_FEET + RANGE_EPSILON_FEET) {
      results.push({
        token: other,
        name: other.name,
        distance: Math.round(dist),
      });
    }
  }

  return results.sort((a, b) => a.distance - b.distance);
}

/**
 * Applies the active Advantage effect for Temporal Synchrony onto the target actor.
 */
export async function applyTemporalAdvantageEffect(targetActor: any, sourceActor: any): Promise<void> {
  if (!targetActor) return;

  const existing = targetActor.effects.find((e: any) => e.name === EFFECT_NAME);
  if (existing) await existing.delete();

  const effectData = {
    name: EFFECT_NAME,
    img: EFFECT_ICON,
    origin: sourceActor?.uuid ?? targetActor.uuid,
    duration: {
      turns: 1,
      rounds: 1,
    },
    changes: TEMPORAL_EFFECT_CHANGES.map((c) => ({ ...c })),
    flags: {
      [MODULE_ID]: {
        isTemporalSynchrony: true,
        sourceActorUuid: sourceActor?.uuid,
        targetCombatantId: game.combat?.combatants.find((c: any) => c.actor === targetActor)?.id,
      },
      dae: {
        specialDuration: [...TEMPORAL_SPECIAL_DURATION],
      },
    },
    description: buildTemporalEffectDescription(sourceActor?.name),
  };

  await targetActor.createEmbeddedDocuments("ActiveEffect", [effectData]);
}

function playTemporalVFX(sourceToken: any, targetToken: any): void {
  if (typeof Sequence === "undefined") return;

  try {
    new Sequence()
      .effect()
      .file(TEMPORAL_VFX.strandFile)
      .atLocation(sourceToken)
      .stretchTo(targetToken)
      .playbackRate(TEMPORAL_VFX.playbackRate)
      .effect()
      .file(TEMPORAL_VFX.circleFile)
      .atLocation(targetToken)
      .scaleToObject(TEMPORAL_VFX.scale)
      .duration(TEMPORAL_VFX.durationMs)
      .fadeOut(TEMPORAL_VFX.fadeOutMs)
      .play();
  } catch {
    // Gracefully ignore Sequencer playback errors
  }
}

async function postTemporalChatCard(
  sourceActor: any,
  targetName: string,
  remainingUses: number,
  maxUses: number
): Promise<void> {
  const content = buildTemporalChatCardHtml(
    sourceActor.name,
    targetName,
    remainingUses,
    maxUses,
    EFFECT_ICON
  );

  await ChatMessage.create({
    speaker: ChatMessage.getSpeaker({ actor: sourceActor }),
    content,
    flags: { [MODULE_ID]: { isTemporalSyncCard: true } },
  });
}

/**
 * Prompts the character owner to choose a target for Temporal Synchrony.
 */
export async function promptTemporalSynchrony(actor: any): Promise<void> {
  if (!actor) return;

  const blessItem = getTemporalSynchronyItem(actor);
  if (!blessItem) return;

  const { current, max } = getTemporalSynchronyUses(actor, blessItem);
  if (current <= 0) return;

  const tokenDoc = actor.token ?? actor.getActiveTokens(false, true)[0];
  if (!tokenDoc) return;

  const validTargets = getValidTargetsInRange(tokenDoc);
  if (validTargets.length === 0) {
    ui.notifications?.info(UI_TEXT.noTargetsNotification(actor.name));
    return;
  }

  const content = buildTemporalDialogHtml(
    validTargets.map((t) => ({ id: t.token.id, name: t.name, distance: t.distance })),
    current,
    max
  );

  new Dialog(
    {
      title: UI_TEXT.dialogTitle,
      content,
      buttons: {
        confirm: {
          icon: '<i class="fas fa-hourglass-start"></i>',
          label: UI_TEXT.dialogConfirmLabel,
          callback: async (html: any) => {
            const selectedTokenId = html.find("#temporal-target-select").val();
            const targetToken = canvas.scene.tokens.get(selectedTokenId);
            if (!targetToken?.actor) return;

            if (game.user?.isGM) {
              await executeApplyEffect(
                actor.uuid,
                targetToken.actor.uuid,
                tokenDoc.id,
                targetToken.id
              );
            } else {
              await consumeTemporalSynchronyUse(actor, blessItem);
              const remaining = current - 1;

              (game.socket as any)?.emit(`module.${MODULE_ID}`, {
                action: SOCKET_ACTION_APPLY,
                sourceActorUuid: actor.uuid,
                targetActorUuid: targetToken.actor.uuid,
                sourceTokenId: tokenDoc.id,
                targetTokenId: targetToken.id,
                remainingUses: remaining,
                maxUses: max,
              });

              await postTemporalChatCard(actor, targetToken.name, remaining, max);
              playTemporalVFX(tokenDoc.object ?? tokenDoc, targetToken.object ?? targetToken);
            }
          },
        },
        cancel: {
          icon: '<i class="fas fa-times"></i>',
          label: UI_TEXT.dialogCancelLabel,
        },
      },
      default: "confirm",
    },
    { width: DIALOG_WIDTH_PX }
  ).render(true);
}

async function executeApplyEffect(
  sourceActorUuid: string,
  targetActorUuid: string,
  sourceTokenId?: string,
  targetTokenId?: string,
  remaining?: number,
  max?: number
): Promise<void> {
  const sourceActor = await fromUuid(sourceActorUuid);
  const targetActor = await fromUuid(targetActorUuid);
  if (!sourceActor || !targetActor) return;

  let remainingUses = remaining;
  let maxUses = max;
  if (remainingUses === undefined || maxUses === undefined) {
    const uses = getTemporalSynchronyUses(sourceActor);
    maxUses = uses.max;
    remainingUses = await consumeTemporalSynchronyUse(sourceActor);
  }

  await applyTemporalAdvantageEffect(targetActor, sourceActor);

  const sourceToken =
    canvas.scene?.tokens.get(sourceTokenId)?.object ?? canvas.scene?.tokens.get(sourceTokenId);
  const targetToken =
    canvas.scene?.tokens.get(targetTokenId)?.object ?? canvas.scene?.tokens.get(targetTokenId);
  if (sourceToken && targetToken) {
    playTemporalVFX(sourceToken, targetToken);
  }

  await postTemporalChatCard(sourceActor, targetActor.name, remainingUses, maxUses);
}

function handleReactionTrigger(actor: any): void {
  if (!actor) return;

  const item = getTemporalSynchronyItem(actor);
  if (!item) return;

  const { current } = getTemporalSynchronyUses(actor, item);
  if (current <= 0) return;

  const now = Date.now();
  const lastTime = lastPromptTimestamps.get(actor.id) || 0;
  if (shouldDebounceTrigger(lastTime, now)) return;
  lastPromptTimestamps.set(actor.id, now);

  const activeOwners = (game.users as any)?.filter(
    (u: any) => u.active && !u.isGM && actor.testUserPermission(u, "OWNER")
  );
  const targetUser = activeOwners?.[0] ?? (game.users as any)?.activeGM ?? game.user;

  if (game.user?.id === targetUser?.id) {
    promptTemporalSynchrony(actor);
  } else {
    (game.socket as any)?.emit(`module.${MODULE_ID}`, {
      action: SOCKET_ACTION_PROMPT,
      actorUuid: actor.uuid,
      targetUserId: targetUser.id,
    });
  }
}

function registerSocketListeners(): void {
  (game.socket as any)?.on(`module.${MODULE_ID}`, async (data: any) => {
    if (!data) return;

    if (data.action === SOCKET_ACTION_PROMPT && data.targetUserId === game.user?.id) {
      const actor = await fromUuid(data.actorUuid);
      if (actor) promptTemporalSynchrony(actor);
      return;
    }

    if (data.action === SOCKET_ACTION_APPLY && game.user?.isGM) {
      await executeApplyEffect(
        data.sourceActorUuid,
        data.targetActorUuid,
        data.sourceTokenId,
        data.targetTokenId,
        data.remainingUses,
        data.maxUses
      );
    }
  });
}

/**
 * Registers hooks and socket listeners for Temporal Synchrony.
 */
export function registerTemporalSynchronyFeature(): void {
  console.log(`${MODULE_TITLE} | Registering Temporal Synchrony feature`);

  registerSocketListeners();

  Hooks.on("midi-qol.RollComplete", (workflow: any) => {
    if (!workflow?.actor) return;
    const isReaction =
      workflow.isReaction ||
      workflow.workflowOptions?.isReaction ||
      workflow.item?.system?.activities?.some((a: any) => a.activation?.type?.includes("reaction")) ||
      workflow.item?.system?.activation?.type?.includes("reaction");

    if (isReaction) {
      handleReactionTrigger(workflow.actor);
    }
  });

  Hooks.on("dnd5e.postUseActivity", (activity: any) => {
    if (!activity?.actor) return;
    const isReaction = activity.activation?.type?.includes("reaction");
    if (isReaction) {
      handleReactionTrigger(activity.actor);
    }
  });

  Hooks.on("dnd5e.preRollAttack", (config: any) => {
    const actor = config?.subject?.actor ?? config?.actor;
    if (!actor) return;

    const effect = actor.effects.find((e: any) => e.name === EFFECT_NAME && !e.disabled);
    if (!effect) return;

    if (Array.isArray(config.rolls) && config.rolls[0]) {
      config.rolls[0].options = { ...(config.rolls[0].options ?? {}), advantage: true };
    }

    effect.delete().catch(console.error);
  });

  Hooks.on("dnd5e.preRollAbilityCheck", (config: any) => {
    const actor = config?.subject?.documentName === "Actor" ? config.subject : config?.actor;
    if (!actor) return;

    const effect = actor.effects.find((e: any) => e.name === EFFECT_NAME && !e.disabled);
    if (!effect) return;

    if (Array.isArray(config.rolls) && config.rolls[0]) {
      config.rolls[0].options = { ...(config.rolls[0].options ?? {}), advantage: true };
    }

    effect.delete().catch(console.error);
  });

  Hooks.on("updateCombat", async (combat: any) => {
    if (!game.user?.isGM) return;

    const currentCombatant = combat?.combatant;
    if (!currentCombatant?.actor) return;

    for (const combatant of combat.combatants) {
      const actor = combatant.actor;
      if (!actor) continue;

      const effect = actor.effects.find((e: any) => e.name === EFFECT_NAME);
      if (!effect) continue;

      const flagCombatantId = effect.getFlag(MODULE_ID, "targetCombatantId");
      if (flagCombatantId && flagCombatantId === combat.previous?.combatantId) {
        await effect.delete();
      }
    }
  });

  Hooks.on("dnd5e.restCompleted", async (actor: any, restData: any) => {
    if (restData?.longRest) {
      await recoverTemporalSynchronyUses(actor);
    }
  });
}
