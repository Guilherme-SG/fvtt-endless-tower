import { MODULE_ID, MODULE_TITLE } from "../../constants";
import {
  DEFAULT_JUMP_CONFIG,
  JUMP_CAPPED_EPSILON,
  JUMP_CONFIRM_DELAY_MS,
  JUMP_ICON,
  JUMP_ITEM_FLAG,
  JUMP_ITEM_NAME,
  JUMP_MIN_DISTANCE_THRESHOLD,
  JUMP_POST_WAIT_MS,
  JUMP_SHAKE_DURATION_MS,
  JUMP_SOUND_VOLUME,
  LEGACY_JUMP_ITEM_NAME,
  SHEET_RENDER_HOOKS,
  UI_TEXT,
} from "./config";
import {
  calculateJumpDistances,
  calculateJumpTravelDuration,
  calculateParabolicWaypoints,
  selectLandingEffect,
} from "./rules";

declare const Sequencer: any;
declare const Sequence: any;

/**
 * Checks if an item is the Jump feature (supporting both current and legacy names).
 */
export function isJumpItem(item: any): boolean {
  if (!item) return false;
  return (
    Boolean(item.getFlag?.(MODULE_ID, JUMP_ITEM_FLAG)) ||
    ((item.name === JUMP_ITEM_NAME || item.name === LEGACY_JUMP_ITEM_NAME) &&
      item.type === "feat")
  );
}

/**
 * Ensures the 'Jump' feature item exists on the character or NPC sheet.
 */
export async function ensureJumpItemOnActor(actor: any): Promise<void> {
  if (!actor || !actor.isOwner) return;

  const existingItem = actor.items?.find((i: any) => isJumpItem(i));

  if (existingItem) {
    if (existingItem.name === LEGACY_JUMP_ITEM_NAME) {
      try {
        await existingItem.update({ name: JUMP_ITEM_NAME });
      } catch (e) {
        console.warn(`${MODULE_TITLE} | Failed to rename legacy Jump item on ${actor.name}:`, e);
      }
    }
    return;
  }

  try {
    console.log(`${MODULE_TITLE} | Creating Jump item on: ${actor.name}`);
    await actor.createEmbeddedDocuments("Item", [
      {
        name: JUMP_ITEM_NAME,
        type: "feat",
        img: JUMP_ICON,
        system: {
          description: {
            value: UI_TEXT.itemDescription,
          },
          activation: {
            type: "action",
            value: 1,
          },
          actionType: "util",
          identifier: "jump",
          activities: {
            dnd5eactivity000: {
              _id: "dnd5eactivity000",
              type: "utility",
              name: JUMP_ITEM_NAME,
              activation: {
                type: "action",
                value: 1,
              },
            },
          },
        },
        flags: {
          [MODULE_ID]: {
            [JUMP_ITEM_FLAG]: true,
          },
        },
      },
    ]);
  } catch (err) {
    console.error(`${MODULE_TITLE} | Error creating Jump item on ${actor.name}:`, err);
  }
}

/**
 * Synchronizes the Jump item across all world actors and active scene tokens.
 */
export async function syncJumpOnAllActors(): Promise<void> {
  if (!(game.user as any)?.isGM) return;

  console.log(`${MODULE_TITLE} | Synchronizing Jump item on all actors...`);
  if ((game.actors as any)) {
    for (const actor of (game.actors as any)) {
      await ensureJumpItemOnActor(actor);
    }
  }

  if ((canvas as any)?.tokens?.placeables) {
    for (const token of (canvas as any).tokens.placeables) {
      if (token.actor) {
        await ensureJumpItemOnActor(token.actor);
      }
    }
  }
}

function getActorFromApp(app: any, data?: any): any {
  return app?.document ?? app?.actor ?? data?.actor ?? data?.document ?? null;
}

function resolveActorToken(actor: any, explicitToken?: any): any {
  if (explicitToken?.actor?.id === actor.id) return explicitToken;

  if (actor.isToken && actor.token?.object) {
    return actor.token.object;
  }

  const controlled = (canvas as any).tokens?.controlled || [];
  const selectedToken = controlled.find(
    (t: any) => t.actor?.id === actor.id || t.document?.actorId === actor.id
  );
  if (selectedToken) return selectedToken;

  const activeTokens = actor.getActiveTokens?.() || [];
  if (activeTokens.length > 0 && activeTokens[0]) {
    return activeTokens[0].object ?? activeTokens[0];
  }

  const sceneToken = (canvas as any).tokens?.placeables?.find(
    (t: any) => t.actor?.id === actor.id || t.document?.actorId === actor.id
  );
  if (sceneToken) return sceneToken;

  return null;
}

/**
 * Executes the full jump workflow with parabolic trajectory and Sequencer visual effects.
 */
export async function executeJump(actor: any, targetToken?: any): Promise<void> {
  console.log(`${MODULE_TITLE} | Executing Jump action for:`, actor?.name);

  if (!actor) {
    (ui as any).notifications?.warn(UI_TEXT.noActorWarning);
    return;
  }

  if (
    !(game.modules as any).get("sequencer")?.active ||
    typeof Sequence === "undefined" ||
    !(globalThis as any).Sequencer
  ) {
    (ui as any).notifications?.error(UI_TEXT.sequencerMissingError);
    return;
  }

  const token = resolveActorToken(actor, targetToken);
  if (!token) {
    (ui as any).notifications?.warn(UI_TEXT.noTokenWarning(actor.name));
    return;
  }

  const strength = Number(actor.system?.abilities?.str?.value) || 10;
  const units = (canvas as any).scene?.grid?.units || "ft";
  const gridDistance = (canvas as any).grid?.distance || 5;

  const { running: runningDistance, standing: standingDistance } =
    calculateJumpDistances(strength);

  let jumpType: "running" | "standing" | null = null;
  const DialogV2 = (foundry as any)?.applications?.api?.DialogV2;

  if (DialogV2) {
    jumpType = await DialogV2.wait({
      classes: ["et-dialog"],
      window: { title: UI_TEXT.dialogTitle(strength, actor.name) },
      content: `
        <div class="et-dialog-body">
          <p>${UI_TEXT.dialogPrompt}</p>
          <ul class="et-dialog-list">
            <li><strong>${UI_TEXT.runningTypeLabel}:</strong> ${UI_TEXT.runningHint(runningDistance, units)}</li>
            <li><strong>${UI_TEXT.standingTypeLabel}:</strong> ${UI_TEXT.standingHint(standingDistance, units)}</li>
          </ul>
        </div>
      `,
      buttons: [
        {
          action: "running",
          label: UI_TEXT.runningButtonLabel(runningDistance, units),
          icon: "fas fa-running",
          default: true,
          callback: () => "running",
        },
        {
          action: "standing",
          label: UI_TEXT.standingButtonLabel(standingDistance, units),
          icon: "fas fa-child",
          callback: () => "standing",
        },
      ],
      close: () => null,
    });
  } else {
    jumpType = await new Promise<"running" | "standing" | null>((resolve) => {
      new (Dialog as any)(
        {
          title: UI_TEXT.dialogTitle(strength, actor.name),
          content: `
            <div class="et-dialog-body">
              <p>${UI_TEXT.dialogPrompt}</p>
              <ul class="et-dialog-list">
                <li><strong>${UI_TEXT.runningTypeLabel}:</strong> ${UI_TEXT.runningHint(runningDistance, units)}</li>
                <li><strong>${UI_TEXT.standingTypeLabel}:</strong> ${UI_TEXT.standingHint(standingDistance, units)}</li>
              </ul>
            </div>
          `,
          buttons: {
            running: {
              icon: '<i class="fas fa-running"></i>',
              label: UI_TEXT.runningButtonLabel(runningDistance, units),
              callback: () => resolve("running"),
            },
            standing: {
              icon: '<i class="fas fa-child"></i>',
              label: UI_TEXT.standingButtonLabel(standingDistance, units),
              callback: () => resolve("standing"),
            },
          },
          default: "running",
          close: () => resolve(null),
        },
        { classes: ["et-dialog"] }
      ).render(true);
    });
  }

  if (!jumpType) {
    console.log(`${MODULE_TITLE} | Jump dialog cancelled.`);
    return;
  }

  const maxDistance = jumpType === "running" ? runningDistance : standingDistance;
  const typeLabel =
    jumpType === "running" ? UI_TEXT.runningTypeLabel : UI_TEXT.standingTypeLabel;
  const crosshairLabel = UI_TEXT.crosshairRangeLabel(typeLabel, maxDistance, units);
  const startCenter = { x: token.center.x, y: token.center.y };

  console.log(`${MODULE_TITLE} | Opening jump crosshair with range:`, maxDistance, units);

  let lastOutOfRange = false;

  const crosshair = await Sequencer.Crosshair.show(
    {
      t: CONST.MEASURED_TEMPLATE_TYPES.CIRCLE,
      gridHighlight: true,
      icon: {
        texture: DEFAULT_JUMP_CONFIG.vfx.crosshair,
        borderVisible: true,
      },
      label: {
        text: crosshairLabel,
        dy: DEFAULT_JUMP_CONFIG.ui.offsetLabelY,
      },
      snap: {
        position: CONST.GRID_SNAPPING_MODES.CENTER,
        resolution: 1,
      },
      location: {
        obj: token,
        showRange: true,
        wallBehavior: Sequencer.Crosshair.PLACEMENT_RESTRICTIONS.NO_COLLIDABLES,
      },
    },
    {
      [Sequencer.Crosshair.CALLBACKS.MOVE]: (ch: any) => {
        const outOfRange = ch.range > maxDistance;
        if (outOfRange === lastOutOfRange) return;

        lastOutOfRange = outOfRange;
        ch.updateCrosshair({
          "label.text": outOfRange
            ? `${crosshairLabel}${UI_TEXT.crosshairOutOfRangeSuffix}`
            : crosshairLabel,
        });
      },
    }
  );

  if (!crosshair) {
    console.log(`${MODULE_TITLE} | Jump targeting cancelled.`);
    return;
  }

  const orientation = crosshair.getOrientation?.();
  const targetPoint = orientation?.source
    ? { x: orientation.source.x, y: orientation.source.y }
    : { x: crosshair.x, y: crosshair.y };

  const measured = (canvas as any).grid.measurePath([startCenter, targetPoint]);
  if (measured.distance < JUMP_MIN_DISTANCE_THRESHOLD) {
    (ui as any).notifications?.warn(UI_TEXT.invalidDestinationWarning);
    return;
  }

  let finalCenter = targetPoint;
  let isCapped = false;

  if (measured.distance > maxDistance) {
    isCapped = true;
    const angle =
      (Math.atan2(targetPoint.y - startCenter.y, targetPoint.x - startCenter.x) * 180) /
      Math.PI;
    finalCenter = (canvas as any).grid.getTranslatedPoint(startCenter, angle, maxDistance);
    finalCenter = (canvas as any).grid.getSnappedPoint(finalCenter, {
      mode: CONST.GRID_SNAPPING_MODES.CENTER,
    });
  }

  const rawTopLeft = {
    x: finalCenter.x - token.w / 2,
    y: finalCenter.y - token.h / 2,
  };
  const snappedTopLeft = (canvas as any).grid.getSnappedPoint(rawTopLeft, {
    mode: CONST.GRID_SNAPPING_MODES.TOP_LEFT_VERTEX,
    resolution: 1,
  });
  const targetDocCoords = { x: snappedTopLeft.x, y: snappedTopLeft.y };
  finalCenter = {
    x: targetDocCoords.x + token.w / 2,
    y: targetDocCoords.y + token.h / 2,
  };

  const finalDistance = (canvas as any).grid.measurePath([startCenter, finalCenter]).distance;
  if (finalDistance < JUMP_MIN_DISTANCE_THRESHOLD) {
    (ui as any).notifications?.warn(UI_TEXT.sameSpaceWarning);
    return;
  }

  if (finalDistance > maxDistance + JUMP_CAPPED_EPSILON) isCapped = true;

  const finalSquares = Math.max(1, Math.round(finalDistance / gridDistance));
  const elevation = token.document.elevation ?? 0;
  const vfxStartPoint = { x: startCenter.x, y: startCenter.y, elevation };
  const vfxEndPoint = { x: finalCenter.x, y: finalCenter.y, elevation };
  const tokenWidth = token.document.width;

  const duration = calculateJumpTravelDuration(finalDistance);
  const startDocCoords = { x: token.document.x, y: token.document.y };
  const waypoints = calculateParabolicWaypoints(startDocCoords, targetDocCoords);

  const hasPatreon = Boolean((game.modules as any).get("jb2a_patreon")?.active);
  const landing = selectLandingEffect(tokenWidth, hasPatreon);

  const safeName = (foundry.utils as any).escapeHTML(token.name);
  const formattedDistance = Number.isInteger(finalDistance)
    ? finalDistance
    : finalDistance.toFixed(1);
  const cappedNotice = isCapped ? UI_TEXT.chatCappedNotice(maxDistance, units) : "";

  ChatMessage.create({
    speaker: ChatMessage.getSpeaker({ actor, token }),
    content: `${UI_TEXT.chatSummary(safeName, typeLabel, formattedDistance, units, finalSquares)}${cappedNotice}`,
    whisper: (ChatMessage as any).getWhisperRecipients("GM"),
  } as any).catch((err) => {
    console.error(`${MODULE_TITLE} | Failed to create jump chat message:`, err);
  });

  (ui as any).notifications?.info(
    UI_TEXT.jumpNotification(token.name, formattedDistance, units, finalSquares)
  );

  try {
    const sequence = new Sequence();

    if (DEFAULT_JUMP_CONFIG.sfx.jump) {
      sequence.sound().file(DEFAULT_JUMP_CONFIG.sfx.jump).volume(JUMP_SOUND_VOLUME);
    }

    sequence
      .effect()
      .file(DEFAULT_JUMP_CONFIG.vfx.takeoff)
      .atLocation(vfxStartPoint)
      .belowTokens()
      .scaleToObject(tokenWidth * 1.5, { considerTokenScale: true });

    if (typeof (sequence as any).motion === "function") {
      (sequence as any)
        .motion()
        .on(token)
        .moveTo(waypoints, {
          duration,
          return: false,
          ease: "linear",
        })
        .scaleTo([1, 1.35, 1], {
          duration,
          return: false,
          ease: "easeInOutQuad",
        })
        .persistUntilUpdate();
    } else {
      sequence
        .animation()
        .on(token)
        .moveTowards(targetDocCoords, {
          ease: "easeInOutQuad",
          rotate: false,
        })
        .duration(duration);
    }

    sequence
      .wait(duration + JUMP_POST_WAIT_MS)
      .animation()
      .on(token)
      .teleportTo(targetDocCoords);

    sequence
      .effect()
      .file(landing.file)
      .atLocation(vfxEndPoint)
      .belowTokens()
      .scaleToObject(landing.scale, { considerTokenScale: true });

    if (landing.isHeavy) {
      if (DEFAULT_JUMP_CONFIG.sfx.heavyLanding) {
        sequence
          .sound()
          .file(DEFAULT_JUMP_CONFIG.sfx.heavyLanding)
          .volume(JUMP_SOUND_VOLUME);
      }
      sequence.canvasPan().shake({
        duration: JUMP_SHAKE_DURATION_MS,
        strength: tokenWidth * 2,
        rotation: false,
      });
    }

    await sequence.play();
    await new Promise((resolve) => setTimeout(resolve, JUMP_CONFIRM_DELAY_MS));

    if (token.document.x !== targetDocCoords.x || token.document.y !== targetDocCoords.y) {
      await token.document.update({ x: targetDocCoords.x, y: targetDocCoords.y });
    }
  } catch (error) {
    console.error(`${MODULE_TITLE} | Jump sequence error:`, error);
    try {
      await token.document.update({ x: targetDocCoords.x, y: targetDocCoords.y });
      (ui as any).notifications?.warn(UI_TEXT.fallbackMoveWarning);
    } catch (moveErr) {
      console.error(`${MODULE_TITLE} | Failed to move token:`, moveErr);
      (ui as any).notifications?.error(UI_TEXT.moveFailedError);
    }
  }
}

/**
 * Registers all hooks required for the Jump feature.
 */
export function registerJumpFeature(): void {
  console.log(`${MODULE_TITLE} | Registering Jump feature`);

  Hooks.once("ready", async () => {
    await syncJumpOnAllActors();
  });

  Hooks.on("canvasReady", async () => {
    if (!(game.user as any)?.isGM) return;
    if ((canvas as any)?.tokens?.placeables) {
      for (const token of (canvas as any).tokens.placeables) {
        if (token.actor) {
          await ensureJumpItemOnActor(token.actor);
        }
      }
    }
  });

  Hooks.on("renderApplication", async (app: any) => {
    const actor = app.document?.documentName === "Actor" ? app.document : (app.actor ?? null);
    if (actor && actor.isOwner) {
      await ensureJumpItemOnActor(actor);
    }
  });

  for (const hookName of SHEET_RENDER_HOOKS) {
    Hooks.on(hookName, async (app: any, _html: any, data: any) => {
      const actor = getActorFromApp(app, data);
      if (actor && actor.isOwner) {
        await ensureJumpItemOnActor(actor);
      }
    });
  }

  Hooks.on("dnd5e.preUseItem", (item: any) => {
    if (isJumpItem(item)) {
      console.log(`${MODULE_TITLE} | Intercepted dnd5e.preUseItem for Jump`);
      executeJump(item.actor);
      return false;
    }
  });

  Hooks.on("dnd5e.preUseActivity", (activity: any) => {
    if (isJumpItem(activity?.item)) {
      console.log(`${MODULE_TITLE} | Intercepted dnd5e.preUseActivity for Jump`);
      executeJump(activity.item.actor);
      return false;
    }
  });

  Hooks.on("midi-qol.preItemRoll", (workflow: any) => {
    if (isJumpItem(workflow?.item)) {
      console.log(`${MODULE_TITLE} | Intercepted midi-qol.preItemRoll for Jump`);
      executeJump(workflow.item.actor);
      return false;
    }
  });
}
