import { MODULE_ID, MODULE_TITLE } from "../constants";

declare const Sequencer: any;
declare const Sequence: any;

const JUMP_ITEM_FLAG = "isJumpFeature";
const JUMP_ITEM_NAME = "Jump";
const JUMP_ICON = "icons/skills/movement/figure-running-gray.webp";

interface JumpConfig {
  vfx: {
    takeoff: string;
    lightLanding: string;
    heavyLandingPrefix: string;
    crosshair: string;
  };
  sfx: {
    jump: string;
    heavyLanding: string;
  };
  timing: {
    travelSpeedMs: number;
    minTravelMs: number;
  };
  ui: {
    offsetLabelY: number;
  };
  heavy: {
    landingScale: number;
  };
}

const DEFAULT_CONFIG: JumpConfig = {
  vfx: {
    takeoff:
      "modules/animated-spell-effects-cartoon/spell-effects/cartoon/air/air_explosion_800x800.webm",
    lightLanding:
      "modules/animated-spell-effects-cartoon/spell-effects/cartoon/air/air_puff_CIRCLE_01.webm",
    heavyLandingPrefix: "jb2a.impact.ground_crack.0",
    crosshair: JUMP_ICON,
  },
  sfx: {
    jump:
      "modules/endless-tower/assets/sounds/High-Jump-Skill-Sound-Effect-Taekwondo-Ragnarok-Online_005_48k.m4a",
    heavyLanding:
      "modules/dnd5e-animations/assets/sounds/Weapons/Melee_Bludgeoning/bludgeoning-swing-impact-blunt-1.mp3",
  },
  timing: {
    travelSpeedMs: 22,
    minTravelMs: 600,
  },
  ui: {
    offsetLabelY: 35,
  },
  heavy: {
    landingScale: 2.5,
  },
};

/**
 * Checks if an item is the Jump feature (supporting both English 'Jump' and legacy 'Salto').
 */
function isJumpItem(item: any): boolean {
  if (!item) return false;
  return (
    Boolean(item.getFlag?.(MODULE_ID, JUMP_ITEM_FLAG)) ||
    ((item.name === "Jump" || item.name === "Salto") && item.type === "feat")
  );
}

/**
 * Ensures the 'Jump' feature item exists on the character or NPC sheet
 * configured as an Action for the D&D 5e sheet.
 */
export async function ensureJumpItemOnActor(actor: any): Promise<void> {
  if (!actor || !actor.isOwner) return;

  const existingItem = actor.items?.find((i: any) => isJumpItem(i));

  if (existingItem) {
    // If it was named 'Salto' from an earlier test, rename it to 'Jump'
    if (existingItem.name === "Salto") {
      try {
        await existingItem.update({ name: JUMP_ITEM_NAME });
      } catch (e) {
        console.warn(`${MODULE_TITLE} | Failed to rename legacy Salto item on ${actor.name}:`, e);
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
            value:
              "<p>Movement action to handle jumping workflows according to D&D 5e rules.</p><p><strong>Running Jump:</strong> distance up to Strength score in feet (requires a 10-foot run-up).</p><p><strong>Standing Jump:</strong> distance up to half Strength score in feet.</p>",
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
              name: "Jump",
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

/**
 * Safely extracts the Actor document from an Application sheet (supporting AppV1 and AppV2).
 */
function getActorFromApp(app: any, data?: any): any {
  return app?.document ?? app?.actor ?? data?.actor ?? data?.document ?? null;
}

/**
 * Finds the token associated with an actor on the active canvas,
 * handling both linked player characters and unlinked synthetic NPC tokens.
 */
function resolveActorToken(actor: any, explicitToken?: any): any {
  if (explicitToken?.actor?.id === actor.id) return explicitToken;

  // Synthetic actor from an unlinked token on the scene
  if (actor.isToken && actor.token?.object) {
    return actor.token.object;
  }

  // Token currently controlled/selected by the user
  const controlled = (canvas as any).tokens?.controlled || [];
  const selectedToken = controlled.find(
    (t: any) => t.actor?.id === actor.id || t.document?.actorId === actor.id
  );
  if (selectedToken) return selectedToken;

  // Active tokens reported by the actor document
  const activeTokens = actor.getActiveTokens?.() || [];
  if (activeTokens.length > 0 && activeTokens[0]) {
    return activeTokens[0].object ?? activeTokens[0];
  }

  // Fallback: search placeables on active scene
  const sceneToken = (canvas as any).tokens?.placeables?.find(
    (t: any) => t.actor?.id === actor.id || t.document?.actorId === actor.id
  );
  if (sceneToken) return sceneToken;

  return null;
}

/**
 * Executes the full jump workflow with parabolic trajectory and visual effects.
 */
export async function executeJump(actor: any, targetToken?: any): Promise<void> {
  console.log(`${MODULE_TITLE} | Executing Jump action for:`, actor?.name);

  if (!actor) {
    (ui as any).notifications?.warn("No actor specified for jump.");
    return;
  }

  if (
    !(game.modules as any).get("sequencer")?.active ||
    typeof Sequence === "undefined" ||
    !(globalThis as any).Sequencer
  ) {
    (ui as any).notifications?.error("Please enable the Sequencer module to use Jump.");
    return;
  }

  const token = resolveActorToken(actor, targetToken);
  if (!token) {
    (ui as any).notifications?.warn(
      `No token for "${actor.name}" was found on the active scene to perform the jump.`
    );
    return;
  }

  const strength = Number(actor.system?.abilities?.str?.value) || 10;
  const units = (canvas as any).scene?.grid?.units || "ft";
  const gridDistance = (canvas as any).grid?.distance || 5;

  const runningDistance = strength;
  const standingDistance = Math.max(1, Math.floor(strength / 2));

  // Prompt player/GM for Jump Type (Running vs Standing)
  let jumpType: "running" | "standing" | null = null;

  const DialogV2 = (foundry as any)?.applications?.api?.DialogV2;
  if (DialogV2) {
    jumpType = await DialogV2.wait({
      window: { title: `Jump (Strength: ${strength}) — ${actor.name}` },
      content: `
        <p style="margin-bottom: 10px;">Select jump type:</p>
        <ul style="margin-bottom: 12px; line-height: 1.5;">
          <li><strong>Running Jump:</strong> up to <b>${runningDistance} ${units}</b> (requires a 10 ${units} run-up).</li>
          <li><strong>Standing Jump:</strong> up to <b>${standingDistance} ${units}</b>.</li>
        </ul>
      `,
      buttons: [
        {
          action: "running",
          label: `Running (${runningDistance} ${units})`,
          icon: "fas fa-running",
          default: true,
          callback: () => "running",
        },
        {
          action: "standing",
          label: `Standing (${standingDistance} ${units})`,
          icon: "fas fa-child",
          callback: () => "standing",
        },
      ],
      close: () => null,
    });
  } else {
    jumpType = await new Promise<"running" | "standing" | null>((resolve) => {
      new (Dialog as any)({
        title: `Jump (Strength: ${strength}) — ${actor.name}`,
        content: `
          <p>Select jump type:</p>
          <p>• <b>Running Jump:</b> up to ${runningDistance} ${units}</p>
          <p>• <b>Standing Jump:</b> up to ${standingDistance} ${units}</p>
        `,
        buttons: {
          running: {
            icon: '<i class="fas fa-running"></i>',
            label: `Running (${runningDistance} ${units})`,
            callback: () => resolve("running"),
          },
          standing: {
            icon: '<i class="fas fa-child"></i>',
            label: `Standing (${standingDistance} ${units})`,
            callback: () => resolve("standing"),
          },
        },
        default: "running",
        close: () => resolve(null),
      }).render(true);
    });
  }

  if (!jumpType) {
    console.log(`${MODULE_TITLE} | Jump dialog cancelled.`);
    return;
  }

  const maxDistance = jumpType === "running" ? runningDistance : standingDistance;
  const typeLabel = jumpType === "running" ? "Running Jump" : "Standing Jump";
  const crosshairLabel = `${typeLabel}: up to ${maxDistance} ${units}`;
  const startCenter = { x: token.center.x, y: token.center.y };

  console.log(`${MODULE_TITLE} | Opening crosshair with range:`, maxDistance, units);

  // Sequencer Crosshair placement
  let lastOutOfRange = false;

  const crosshair = await Sequencer.Crosshair.show(
    {
      t: CONST.MEASURED_TEMPLATE_TYPES.CIRCLE,
      gridHighlight: true,
      icon: {
        texture: DEFAULT_CONFIG.vfx.crosshair,
        borderVisible: true,
      },
      label: {
        text: crosshairLabel,
        dy: DEFAULT_CONFIG.ui.offsetLabelY,
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
          "label.text": outOfRange ? `${crosshairLabel} — out of range` : crosshairLabel,
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
  if (measured.distance < 0.1) {
    (ui as any).notifications?.warn("Select a landing destination outside the current space.");
    return;
  }

  let finalCenter = targetPoint;
  let isCapped = false;

  if (measured.distance > maxDistance) {
    isCapped = true;
    const angle = (Math.atan2(targetPoint.y - startCenter.y, targetPoint.x - startCenter.x) * 180) / Math.PI;
    finalCenter = (canvas as any).grid.getTranslatedPoint(startCenter, angle, maxDistance);
    finalCenter = (canvas as any).grid.getSnappedPoint(finalCenter, {
      mode: CONST.GRID_SNAPPING_MODES.CENTER,
    });
  }

  // Align top-left corner to grid vertex for multi-cell tokens
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
  if (finalDistance < 0.1) {
    (ui as any).notifications?.warn("The token already occupies this space; choose another location.");
    return;
  }

  if (finalDistance > maxDistance + 0.01) isCapped = true;

  const finalSquares = Math.max(1, Math.round(finalDistance / gridDistance));
  const elevation = token.document.elevation ?? 0;
  const vfxStartPoint = { x: startCenter.x, y: startCenter.y, elevation };
  const vfxEndPoint = { x: finalCenter.x, y: finalCenter.y, elevation };
  const tokenWidth = token.document.width;
  const isHeavyCreature = tokenWidth > 1;

  // Travel duration proportional to distance
  const duration = Math.max(
    DEFAULT_CONFIG.timing.minTravelMs,
    finalDistance * DEFAULT_CONFIG.timing.travelSpeedMs
  );

  // ---------------------------------------------------------------------
  // Parabolic Arc Waypoints Calculation
  // ---------------------------------------------------------------------
  const startDocCoords = { x: token.document.x, y: token.document.y };
  const deltaX = targetDocCoords.x - startDocCoords.x;
  const deltaY = targetDocCoords.y - startDocCoords.y;
  const distancePixels = Math.hypot(deltaX, deltaY);

  // Peak vertical arc height (displaces upwards on screen along negative Y)
  const arcHeight = Math.min(150, Math.max(45, distancePixels * 0.28));

  const waypoints: Array<{ x: number; y: number }> = [];
  const waypointSteps = 8;
  for (let i = 1; i <= waypointSteps; i++) {
    const t = i / waypointSteps;
    const interpX = startDocCoords.x + deltaX * t;
    const interpY = startDocCoords.y + deltaY * t;
    // Quadratic parabola: peaks at t = 0.5 with height = arcHeight
    const jumpVerticalOffset = -4 * arcHeight * t * (1 - t);
    waypoints.push({
      x: Math.round(interpX),
      y: Math.round(interpY + jumpVerticalOffset),
    });
  }

  // Landing VFX selection
  let landingEffect = DEFAULT_CONFIG.vfx.lightLanding;
  let landingScale = tokenWidth * 1.5;

  if (isHeavyCreature) {
    const crackIndex = tokenWidth === 2 ? 3 : tokenWidth === 3 ? 2 : 1;
    const hasPatreon = (game.modules as any).get("jb2a_patreon")?.active;
    const crackColor = hasPatreon ? "white" : "orange";
    landingEffect = `${DEFAULT_CONFIG.vfx.heavyLandingPrefix}${crackIndex}.${crackColor}`;
    landingScale = DEFAULT_CONFIG.heavy.landingScale;
  }

  // Chat notification whispered to GM
  const safeName = (foundry.utils as any).escapeHTML(token.name);
  const formattedDistance = Number.isInteger(finalDistance)
    ? finalDistance
    : finalDistance.toFixed(1);
  const squaresPlural = finalSquares === 1 ? "" : "s";
  const cappedNotice = isCapped
    ? `<p><em>Jump capped at maximum reach of ${maxDistance} ${units}.</em></p>`
    : "";

  ChatMessage.create({
    speaker: ChatMessage.getSpeaker({ actor, token }),
    content: `<p><strong>${safeName}</strong> performed a <strong>${typeLabel}</strong> of <strong>${formattedDistance} ${units}</strong> (${finalSquares} square${squaresPlural}).</p>${cappedNotice}`,
    whisper: (ChatMessage as any).getWhisperRecipients("GM"),
  } as any).catch((err) => {
    console.error(`${MODULE_TITLE} | Failed to create jump chat message:`, err);
  });

  (ui as any).notifications?.info(
    `${token.name} jumped ${formattedDistance} ${units} (${finalSquares} square${squaresPlural}).`
  );

  // ---------------------------------------------------------------------
  // Sequencer Animation Execution
  // ---------------------------------------------------------------------
  try {
    const sequence = new Sequence();

    // Liftoff whoosh sound
    if (DEFAULT_CONFIG.sfx.jump) {
      sequence.sound().file(DEFAULT_CONFIG.sfx.jump).volume(0.8);
    }

    // Liftoff air blast effect
    sequence
      .effect()
      .file(DEFAULT_CONFIG.vfx.takeoff)
      .atLocation(vfxStartPoint)
      .belowTokens()
      .scaleToObject(tokenWidth * 1.5, { considerTokenScale: true });

    // Parabolic arc sprite movement with 3D scale expansion at peak
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

    // Touchdown & final teleportation
    sequence
      .wait(duration + 50)
      .animation()
      .on(token)
      .teleportTo(targetDocCoords);

    // Landing impact VFX
    sequence
      .effect()
      .file(landingEffect)
      .atLocation(vfxEndPoint)
      .belowTokens()
      .scaleToObject(landingScale, { considerTokenScale: true });

    if (isHeavyCreature) {
      if (DEFAULT_CONFIG.sfx.heavyLanding) {
        sequence
          .sound()
          .file(DEFAULT_CONFIG.sfx.heavyLanding)
          .volume(0.8);
      }
      sequence.canvasPan().shake({
        duration: 400,
        strength: tokenWidth * 2,
        rotation: false,
      });
    }

    await sequence.play();
    await new Promise((resolve) => setTimeout(resolve, 80));

    // Confirm final token document position
    if (token.document.x !== targetDocCoords.x || token.document.y !== targetDocCoords.y) {
      await token.document.update({ x: targetDocCoords.x, y: targetDocCoords.y });
    }
  } catch (error) {
    console.error(`${MODULE_TITLE} | Jump sequence error:`, error);
    try {
      await token.document.update({ x: targetDocCoords.x, y: targetDocCoords.y });
      (ui as any).notifications?.warn("Token was repositioned without animation due to a rendering issue.");
    } catch (moveErr) {
      console.error(`${MODULE_TITLE} | Failed to move token:`, moveErr);
      (ui as any).notifications?.error("Could not move token.");
    }
  }
}

/**
 * Registers all hooks required for the Jump feature.
 * Called during the 'init' hook.
 */
export function registerJumpFeature(): void {
  console.log(`${MODULE_TITLE} | Registering Jump feature`);

  // On 'ready', ensure Jump item is present on world actors and scene tokens
  Hooks.once("ready", async () => {
    await syncJumpOnAllActors();
  });

  // On canvas ready / scene change, ensure active tokens have the item
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

  // Universal: catch any Application rendering an Actor document
  Hooks.on("renderApplication", async (app: any) => {
    const actor = app.document?.documentName === "Actor" ? app.document : (app.actor ?? null);
    if (actor && actor.isOwner) {
      await ensureJumpItemOnActor(actor);
    }
  });

  // Specific sheet render hooks
  const sheetHooks = [
    "renderActorSheet",
    "dnd5e.renderActorSheet",
    "renderActorSheet5e2",
    "renderNPCSheet2",
    "renderCharacterSheet2",
    "renderActorSheetV2",
  ];

  for (const hookName of sheetHooks) {
    Hooks.on(hookName, async (app: any, _html: any, data: any) => {
      const actor = getActorFromApp(app, data);
      if (actor && actor.isOwner) {
        await ensureJumpItemOnActor(actor);
      }
    });
  }

  // Intercept item usage (v3 & legacy sheets)
  Hooks.on("dnd5e.preUseItem", (item: any) => {
    if (isJumpItem(item)) {
      console.log(`${MODULE_TITLE} | Intercepted dnd5e.preUseItem for Jump`);
      executeJump(item.actor);
      return false;
    }
  });

  // Intercept activity usage (v4 & v5 sheets)
  Hooks.on("dnd5e.preUseActivity", (activity: any) => {
    if (isJumpItem(activity?.item)) {
      console.log(`${MODULE_TITLE} | Intercepted dnd5e.preUseActivity for Jump`);
      executeJump(activity.item.actor);
      return false;
    }
  });

  // Intercept Midi-QoL if active
  Hooks.on("midi-qol.preItemRoll", (workflow: any) => {
    if (isJumpItem(workflow?.item)) {
      console.log(`${MODULE_TITLE} | Intercepted midi-qol.preItemRoll for Jump`);
      executeJump(workflow.item.actor);
      return false;
    }
  });
}
