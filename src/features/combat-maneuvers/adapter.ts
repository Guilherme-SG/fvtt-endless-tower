import { MODULE_ID, MODULE_TITLE } from "../../constants";
import { measureMinDistanceChebyshev, type TokenBounds } from "../solitude/rules";
import {
  DEFAULT_FEET_PER_GRID,
  DEFAULT_GRID_SIZE,
  DEFENSE_SOCKET_BUFFER_MS,
  DEFENSE_TIMEOUT_MS,
  MANEUVER_DEFINITIONS,
  MANEUVER_ITEM_FLAG,
  MANEUVER_VFX,
  SETTING_MANEUVER_EFFECTS,
  SHEET_RENDER_HOOKS,
  SOCKET_ACTION_DEFENSE_PROMPT,
  SOCKET_ACTION_DEFENSE_RESPONSE,
  UI_TEXT,
} from "./config";
import {
  calculatePushVector,
  determineContestWinner,
  normalizeCreatureSize,
  selectFallbackDefenseSkill,
  validateManeuverPrerequisites,
  type ManeuverType,
} from "./rules";

declare const Sequence: any;

export interface ManeuverDefinition {
  type: ManeuverType;
  name: string;
  img: string;
  description: string;
}

interface ManeuverSocketPayload {
  action: string;
  maneuverId: string;
  maneuverType?: ManeuverType;
  attackerTokenId?: string;
  targetTokenId?: string;
  attackerName?: string;
  targetName?: string;
  targetActorUuid?: string;
  chosenSkill?: "ath" | "acr";
}

const pendingDefenseResolvers = new Map<string, (chosenSkill: "ath" | "acr") => void>();

/**
 * Checks whether an item represents one of the module's combat maneuvers.
 */
export function isManeuverItem(item: any): boolean {
  if (!item) return false;
  const flag = item.getFlag?.(MODULE_ID, MANEUVER_ITEM_FLAG);
  if (flag) return true;
  const name = item.name?.trim?.() ?? "";
  return (
    item.type === "feat" &&
    (name === MANEUVER_DEFINITIONS.grapple.name ||
      name === MANEUVER_DEFINITIONS.shove.name ||
      name === MANEUVER_DEFINITIONS.disarm.name ||
      name === "Maneuver: Grapple" ||
      name === "Maneuver: Shove" ||
      name === "Maneuver: Disarm")
  );
}

/**
 * Resolves the ManeuverType from an item's flags or name.
 */
export function getManeuverTypeFromItem(item: any): ManeuverType | null {
  if (!item) return null;
  const flag = item.getFlag?.(MODULE_ID, MANEUVER_ITEM_FLAG);
  if (flag && (flag === "grapple" || flag === "shove" || flag === "disarm")) {
    return flag as ManeuverType;
  }
  const name = item.name?.toLowerCase?.() ?? "";
  if (name.includes("agarrar") || name.includes("grapple")) return "grapple";
  if (name.includes("empurrar") || name.includes("shove")) return "shove";
  if (name.includes("desarmar") || name.includes("disarm")) return "disarm";
  return null;
}

/**
 * Ensures all 3 combat maneuver items exist on the actor sheet without duplicates.
 */
export async function ensureManeuverItemsOnActor(actor: any): Promise<void> {
  if (!actor || !actor.isOwner) return;

  const existingItems = actor.items?.filter((i: any) => isManeuverItem(i)) || [];
  const existingTypes = new Set<string>();

  for (const item of existingItems) {
    const type = getManeuverTypeFromItem(item);
    if (type) {
      existingTypes.add(type);
      const def = MANEUVER_DEFINITIONS[type];
      if (def && item.img !== def.img) {
        try {
          await item.update({ img: def.img });
        } catch (e) {
          console.warn(`${MODULE_TITLE} | Failed to update icon for ${def.name}:`, e);
        }
      }
    }
  }

  const itemsToCreate: any[] = [];

  for (const [typeKey, def] of Object.entries(MANEUVER_DEFINITIONS)) {
    const type = typeKey as ManeuverType;
    if (!existingTypes.has(type)) {
      itemsToCreate.push({
        name: def.name,
        type: "feat",
        img: def.img,
        system: {
          description: {
            value: def.description,
          },
          type: {
            value: "",
            subtype: "",
          },
          activation: {
            type: "action",
            value: 1,
          },
          actionType: "util",
          identifier: `maneuver-${def.type}`,
          activities: {
            dnd5eactivity000: {
              _id: "dnd5eactivity000",
              type: "utility",
              name: def.name,
              activation: {
                type: "action",
                value: 1,
              },
            },
          },
        },
        flags: {
          [MODULE_ID]: {
            [MANEUVER_ITEM_FLAG]: def.type,
          },
        },
      });
    }
  }

  if (itemsToCreate.length > 0) {
    try {
      console.log(
        `${MODULE_TITLE} | Creating ${itemsToCreate.length} maneuver items on actor: ${actor.name}`
      );
      await actor.createEmbeddedDocuments("Item", itemsToCreate);
    } catch (err) {
      console.error(`${MODULE_TITLE} | Error creating maneuver items on ${actor.name}:`, err);
    }
  }
}

/**
 * Synchronizes combat maneuvers across all world actors and active scene tokens.
 */
export async function syncManeuversOnAllActors(): Promise<void> {
  if (!(game.user as any)?.isGM) return;

  console.log(`${MODULE_TITLE} | [Maneuvers] Synchronizing maneuvers across all actors...`);
  if ((game.actors as any)) {
    for (const actor of (game.actors as any)) {
      await ensureManeuverItemsOnActor(actor);
    }
  }

  if ((canvas as any)?.tokens?.placeables) {
    for (const token of (canvas as any).tokens.placeables) {
      if (token.actor) {
        await ensureManeuverItemsOnActor(token.actor);
      }
    }
  }
}

function resolveActorToken(actor: any): any {
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

function getTokenBounds(token: any): TokenBounds {
  const doc = token.document ?? token;
  return {
    x: doc.x,
    y: doc.y,
    width: doc.width ?? 1,
    height: doc.height ?? 1,
  };
}

async function promptVisibilityDialog(
  maneuverName: string,
  targetName: string
): Promise<string | null> {
  const currentRollMode =
    (game.settings as any)?.get?.("core", "rollMode") ||
    (ui as any)?.chat?.rollMode ||
    "publicroll";

  return new Promise((resolve) => {
    const content = `
      <form class="et-maneuver-visibility-form" style="padding: 6px 0;">
        <p style="margin-bottom: 10px;">${UI_TEXT.visibilityPromptIntro(maneuverName, targetName)}</p>
        <div class="form-group" style="margin-bottom: 12px;">
          <label style="display:block;margin-bottom:4px;font-weight:bold;">${UI_TEXT.visibilityModeLabel}</label>
          <select name="rollMode" style="width:100%;height:32px;">
            <option value="publicroll" ${currentRollMode === "publicroll" ? "selected" : ""}>${UI_TEXT.visibilityOptions.publicroll}</option>
            <option value="gmroll" ${currentRollMode === "gmroll" ? "selected" : ""}>${UI_TEXT.visibilityOptions.gmroll}</option>
            <option value="blindroll" ${currentRollMode === "blindroll" ? "selected" : ""}>${UI_TEXT.visibilityOptions.blindroll}</option>
            <option value="selfroll" ${currentRollMode === "selfroll" ? "selected" : ""}>${UI_TEXT.visibilityOptions.selfroll}</option>
          </select>
        </div>
      </form>
    `;

    new (Dialog as any)({
      title: UI_TEXT.visibilityDialogTitle(maneuverName),
      content,
      buttons: {
        confirm: {
          icon: '<i class="fas fa-dice-d20"></i>',
          label: UI_TEXT.visibilityConfirmLabel,
          callback: (html: any) => {
            const form = html.find("select[name='rollMode']");
            resolve(form.val() || currentRollMode);
          },
        },
        cancel: {
          icon: '<i class="fas fa-times"></i>',
          label: UI_TEXT.visibilityCancelLabel,
          callback: () => resolve(null),
        },
      },
      default: "confirm",
      close: () => resolve(null),
    }).render(true);
  });
}

async function showDefenseSelectionDialog(
  maneuverName: string,
  attackerName: string,
  targetActor: any
): Promise<"ath" | "acr"> {
  const athMod = targetActor.system?.skills?.ath?.total ?? targetActor.system?.skills?.ath?.mod ?? 0;
  const acrMod = targetActor.system?.skills?.acr?.total ?? targetActor.system?.skills?.acr?.mod ?? 0;

  const athSign = athMod >= 0 ? `+${athMod}` : `${athMod}`;
  const acrSign = acrMod >= 0 ? `+${acrMod}` : `${acrMod}`;
  const defaultSkill = selectFallbackDefenseSkill(athMod, acrMod);

  return new Promise((resolve) => {
    let resolved = false;
    let timerInterval: any = null;
    let secondsLeft = Math.floor(DEFENSE_TIMEOUT_MS / 1000);

    const safeResolve = (skill: "ath" | "acr") => {
      if (resolved) return;
      resolved = true;
      if (timerInterval) clearInterval(timerInterval);
      resolve(skill);
    };

    const fallbackLabel =
      defaultSkill === "acr" ? UI_TEXT.skillAcrobatics : UI_TEXT.skillAthletics;

    const content = `
      <div style="text-align:center;padding:8px 0;">
        <p style="font-size:1.1em;margin-bottom:8px;">
          ${UI_TEXT.defensePromptLead(attackerName, maneuverName)}
        </p>
        <p style="color:#777;margin-bottom:12px;">${UI_TEXT.defensePromptSubtitle}</p>
        <div id="et-defense-timer" style="font-size:0.9em;color:#e67e22;font-weight:bold;margin-bottom:8px;">
          ${UI_TEXT.defenseTimerPrefix} <span id="et-seconds">${secondsLeft}</span>s ${UI_TEXT.defenseTimerFallback(fallbackLabel)}
        </div>
      </div>
    `;

    const dialog = new (Dialog as any)({
      title: UI_TEXT.defenseDialogTitle(maneuverName),
      content,
      buttons: {
        athletics: {
          icon: '<i class="fas fa-fist-raised"></i>',
          label: UI_TEXT.defenseButtonAthletics(athSign),
          callback: () => safeResolve("ath"),
        },
        acrobatics: {
          icon: '<i class="fas fa-running"></i>',
          label: UI_TEXT.defenseButtonAcrobatics(acrSign),
          callback: () => safeResolve("acr"),
        },
      },
      default: defaultSkill === "acr" ? "acrobatics" : "athletics",
      close: () => safeResolve(defaultSkill),
    });

    dialog.render(true);

    timerInterval = setInterval(() => {
      secondsLeft--;
      const el = document.getElementById("et-seconds");
      if (el) el.textContent = `${secondsLeft}`;
      if (secondsLeft <= 0) {
        clearInterval(timerInterval);
        dialog.close();
        safeResolve(defaultSkill);
      }
    }, 1000);
  });
}

async function requestDefenseSkill(
  maneuverId: string,
  maneuverType: ManeuverType,
  attackerName: string,
  targetToken: any
): Promise<"ath" | "acr"> {
  const targetActor = targetToken.actor;
  const isOwnerLocal = targetActor?.isOwner;

  if (isOwnerLocal) {
    const def = MANEUVER_DEFINITIONS[maneuverType];
    return await showDefenseSelectionDialog(def.name, attackerName, targetActor);
  }

  const activeUsers = (game.users as any)?.filter((u: any) => u.active) || [];
  const targetOwner =
    activeUsers.find((u: any) => targetActor.testUserPermission(u, "OWNER") && !u.isGM) ||
    activeUsers.find((u: any) => u.isGM);

  const athMod = targetActor.system?.skills?.ath?.total ?? targetActor.system?.skills?.ath?.mod ?? 0;
  const acrMod = targetActor.system?.skills?.acr?.total ?? targetActor.system?.skills?.acr?.mod ?? 0;
  const defaultSkill = selectFallbackDefenseSkill(athMod, acrMod);

  if (!targetOwner) {
    return defaultSkill;
  }

  return new Promise((resolve) => {
    const timeoutHandle = setTimeout(() => {
      pendingDefenseResolvers.delete(maneuverId);
      resolve(defaultSkill);
    }, DEFENSE_TIMEOUT_MS + DEFENSE_SOCKET_BUFFER_MS);

    pendingDefenseResolvers.set(maneuverId, (chosenSkill) => {
      clearTimeout(timeoutHandle);
      resolve(chosenSkill);
    });

    const payload: ManeuverSocketPayload = {
      action: SOCKET_ACTION_DEFENSE_PROMPT,
      maneuverId,
      maneuverType,
      attackerName,
      targetName: targetToken.name,
      targetTokenId: targetToken.id,
      targetActorUuid: targetActor.uuid,
    };

    (game.socket as any)?.emit(`module.${MODULE_ID}`, payload);
  });
}

async function playManeuverEffects(
  maneuverType: ManeuverType,
  _attackerToken: any,
  targetToken: any
): Promise<void> {
  const isEnabled = (game.settings as any)?.get(MODULE_ID, SETTING_MANEUVER_EFFECTS) ?? true;
  if (!isEnabled) return;
  if (typeof Sequence === "undefined") return;

  try {
    const sequence = new Sequence();

    if (maneuverType === "grapple") {
      sequence
        .effect()
        .file(MANEUVER_VFX.grappleFile)
        .atLocation(targetToken)
        .scaleToObject(MANEUVER_VFX.grappleScale)
        .duration(MANEUVER_VFX.grappleDurationMs);
    } else if (maneuverType === "shove") {
      sequence
        .effect()
        .file(MANEUVER_VFX.shoveFile)
        .atLocation(targetToken)
        .scaleToObject(MANEUVER_VFX.shoveScale)
        .duration(MANEUVER_VFX.shoveDurationMs);
      sequence.canvasPan().shake({
        duration: MANEUVER_VFX.shoveShakeDurationMs,
        strength: MANEUVER_VFX.shoveShakeStrength,
        rotation: false,
      });
    } else if (maneuverType === "disarm") {
      sequence
        .sound()
        .file(MANEUVER_VFX.disarmSound)
        .volume(MANEUVER_VFX.disarmVolume);
    }

    await sequence.play();
  } catch (err) {
    console.warn(`${MODULE_TITLE} | Failed to play maneuver Sequencer effect:`, err);
  }
}

async function applyConditionToActor(
  actor: any,
  coreStatusId: string,
  dfredsName: string
): Promise<void> {
  const dfreds = (game as any)?.dfreds?.effectInterface;
  if (dfreds) {
    try {
      const hasEffect = await dfreds.hasEffect({ effectName: dfredsName, uuid: actor.uuid });
      if (!hasEffect) {
        await dfreds.addEffect({ effectName: dfredsName, uuid: actor.uuid });
        return;
      }
    } catch (err) {
      console.warn(
        `${MODULE_TITLE} | DFreds failed to apply ${dfredsName}, falling back to native status:`,
        err
      );
    }
  }

  try {
    if (actor.toggleStatusEffect) {
      await actor.toggleStatusEffect(coreStatusId, { active: true });
    }
  } catch (err) {
    console.error(`${MODULE_TITLE} | Error applying status ${coreStatusId}:`, err);
  }
}

async function executeShoveOutcome(
  attackerToken: any,
  targetToken: any,
  attackerName: string,
  targetName: string
): Promise<void> {
  return new Promise((resolve) => {
    new (Dialog as any)({
      title: UI_TEXT.shoveDialogTitle,
      content: `<div style="padding: 8px 0;">${UI_TEXT.shoveDialogPrompt(targetName)}</div>`,
      buttons: {
        prone: {
          icon: '<i class="fas fa-bed"></i>',
          label: UI_TEXT.shoveProneButton,
          callback: async () => {
            await applyConditionToActor(targetToken.actor, "prone", "Prone");
            await ChatMessage.create({
              speaker: ChatMessage.getSpeaker({ token: attackerToken }),
              content: `<div class="et-maneuver-card">
                <h3>${UI_TEXT.shoveSuccessTitle}</h3>
                <p>${UI_TEXT.shoveProneBody(attackerName, targetName)}</p>
              </div>`,
            });
            resolve();
          },
        },
        push: {
          icon: '<i class="fas fa-arrow-right"></i>',
          label: UI_TEXT.shovePushButton,
          callback: async () => {
            const gridSize = (canvas as any)?.grid?.size || DEFAULT_GRID_SIZE;
            const feetPerGrid = (canvas as any)?.grid?.distance || DEFAULT_FEET_PER_GRID;

            const attackerCenter = {
              x: attackerToken.document.x + (attackerToken.document.width * gridSize) / 2,
              y: attackerToken.document.y + (attackerToken.document.height * gridSize) / 2,
            };
            const targetCenter = {
              x: targetToken.document.x + (targetToken.document.width * gridSize) / 2,
              y: targetToken.document.y + (targetToken.document.height * gridSize) / 2,
            };

            const destCenter = calculatePushVector(
              attackerCenter,
              targetCenter,
              gridSize,
              feetPerGrid
            );

            let hasCollision = false;
            try {
              if (typeof (Ray as any) !== "undefined" && (canvas as any)?.walls?.checkCollision) {
                const ray = new (Ray as any)(targetCenter, destCenter);
                hasCollision = (canvas as any).walls.checkCollision(ray, {
                  type: "move",
                  mode: "any",
                });
              }
            } catch (err) {
              console.warn(`${MODULE_TITLE} | Error checking wall collision:`, err);
            }

            if (hasCollision) {
              (ui as any).notifications?.warn(UI_TEXT.shoveCollisionWarn(targetName));
              await ChatMessage.create({
                speaker: ChatMessage.getSpeaker({ token: attackerToken }),
                content: `<div class="et-maneuver-card">
                  <h3>${UI_TEXT.shoveCollisionTitle}</h3>
                  <p>${UI_TEXT.shoveCollisionBody(attackerName, targetName)}</p>
                </div>`,
              });
            } else {
              const targetDocX = destCenter.x - (targetToken.document.width * gridSize) / 2;
              const targetDocY = destCenter.y - (targetToken.document.height * gridSize) / 2;

              try {
                await targetToken.document.update({ x: targetDocX, y: targetDocY });
              } catch (moveErr) {
                console.error(`${MODULE_TITLE} | Error shifting token position:`, moveErr);
              }

              await ChatMessage.create({
                speaker: ChatMessage.getSpeaker({ token: attackerToken }),
                content: `<div class="et-maneuver-card">
                  <h3>${UI_TEXT.shoveSuccessTitle}</h3>
                  <p>${UI_TEXT.shovePushBody(attackerName, targetName)}</p>
                </div>`,
              });
            }
            resolve();
          },
        },
      },
      default: "prone",
    }).render(true);
  });
}

/**
 * Executes the full combat maneuver workflow when a maneuver item is used.
 */
export async function executeManeuverWorkflow(item: any, actor: any): Promise<boolean> {
  const maneuverType = getManeuverTypeFromItem(item);
  if (!maneuverType) return true;

  const maneuverDef = MANEUVER_DEFINITIONS[maneuverType];
  console.log(`${MODULE_TITLE} | [Maneuvers] Starting ${maneuverDef.name} workflow for ${actor.name}`);

  const targets = Array.from((game.user as any)?.targets || []);
  if (targets.length !== 1) {
    (ui as any).notifications?.warn(UI_TEXT.selectSingleTargetWarn(maneuverDef.name));
    return false;
  }

  const targetToken: any = targets[0];
  const targetActor: any = targetToken.actor;

  if (!targetActor) {
    (ui as any).notifications?.warn(UI_TEXT.invalidTargetActorWarn);
    return false;
  }

  const attackerToken = resolveActorToken(actor);
  if (!attackerToken) {
    (ui as any).notifications?.warn(UI_TEXT.missingAttackerTokenWarn);
    return false;
  }

  const gridSize = (canvas as any)?.grid?.size || DEFAULT_GRID_SIZE;
  const feetPerGrid = (canvas as any)?.grid?.distance || DEFAULT_FEET_PER_GRID;

  const attackerBounds = getTokenBounds(attackerToken);
  const targetBounds = getTokenBounds(targetToken);

  const distanceFeet = measureMinDistanceChebyshev(
    attackerBounds,
    targetBounds,
    gridSize,
    feetPerGrid
  );

  const attackerCreature = {
    size: normalizeCreatureSize(actor.system?.traits?.size),
    bounds: attackerBounds,
  };
  const targetCreature = {
    size: normalizeCreatureSize(targetActor.system?.traits?.size),
    bounds: targetBounds,
  };

  const validation = validateManeuverPrerequisites(
    attackerCreature,
    targetCreature,
    maneuverType,
    distanceFeet,
    gridSize,
    feetPerGrid
  );

  if (!validation.valid) {
    (ui as any).notifications?.warn(validation.reason);
    return false;
  }

  const selectedRollMode = await promptVisibilityDialog(maneuverDef.name, targetToken.name);
  if (!selectedRollMode) {
    console.log(`${MODULE_TITLE} | [Maneuvers] User cancelled maneuver.`);
    return false;
  }

  const maneuverId = foundry.utils.randomID();
  const chosenSkill = await requestDefenseSkill(
    maneuverId,
    maneuverType,
    actor.name,
    targetToken
  );

  console.log(`${MODULE_TITLE} | [Maneuvers] Defender selected skill: ${chosenSkill}`);

  const isBlind = selectedRollMode === "blindroll" || selectedRollMode === "gmroll";
  const epicRollsApi = (globalThis as any).ui?.EpicRolls5e;

  let attackerTotal = 0;
  let defenderTotal = 0;

  if (epicRollsApi?.requestRoll) {
    try {
      const epicResult = await epicRollsApi.requestRoll({
        actors: [actor.uuid],
        contestants: [targetActor.uuid],
        type: "skill.ath",
        contest: `skill.${chosenSkill}`,
        options: {
          formula: "",
          DC: 0,
          showDC: false,
          blindRoll: isBlind,
          autoColor: true,
          showRollResults: true,
          noMessage: false,
        },
      });

      const attRes = epicResult.results?.find((r: any) => r.actor?.uuid === actor.uuid);
      const defRes = epicResult.results?.find((r: any) => r.actor?.uuid === targetActor.uuid);

      attackerTotal = Number(attRes?.value ?? attRes?.roll?.total ?? 0);
      defenderTotal = Number(defRes?.value ?? defRes?.roll?.total ?? 0);
    } catch (epicErr) {
      console.warn(`${MODULE_TITLE} | Epic Rolls failed, falling back to native dnd5e rolls:`, epicErr);
      const attRoll = await actor.rollSkill(
        { skill: "ath" },
        { configure: false },
        { rollMode: selectedRollMode }
      );
      const defRoll = await targetActor.rollSkill(
        { skill: chosenSkill },
        { configure: false },
        { rollMode: selectedRollMode }
      );
      attackerTotal = attRoll.total;
      defenderTotal = defRoll.total;
    }
  } else {
    const attRoll = await actor.rollSkill(
      { skill: "ath" },
      { configure: false },
      { rollMode: selectedRollMode }
    );
    const defRoll = await targetActor.rollSkill(
      { skill: chosenSkill },
      { configure: false },
      { rollMode: selectedRollMode }
    );
    attackerTotal = attRoll.total;
    defenderTotal = defRoll.total;
  }

  const winner = determineContestWinner(attackerTotal, defenderTotal);
  console.log(
    `${MODULE_TITLE} | [Maneuvers] Contest result: Attacker ${attackerTotal} vs Defender ${defenderTotal} => Winner: ${winner}`
  );

  if (winner === "defender") {
    await ChatMessage.create({
      speaker: ChatMessage.getSpeaker({ token: targetToken }),
      content: `<div class="et-maneuver-card">
        <h3>${UI_TEXT.resistedTitle}</h3>
        <p>${UI_TEXT.resistedBody(targetToken.name, maneuverDef.name, actor.name)}</p>
        <p>${UI_TEXT.resistedOutcome(defenderTotal, attackerTotal)}</p>
      </div>`,
    });
    return false;
  }

  await playManeuverEffects(maneuverType, attackerToken, targetToken);

  if (maneuverType === "grapple") {
    await applyConditionToActor(targetActor, "grappled", "Grappled");
    await ChatMessage.create({
      speaker: ChatMessage.getSpeaker({ token: attackerToken }),
      content: `<div class="et-maneuver-card">
        <h3>${UI_TEXT.grappleSuccessTitle}</h3>
        <p>${UI_TEXT.grappleSuccessBody(actor.name, targetToken.name)}</p>
        <p>${UI_TEXT.grappleSuccessEffect}</p>
      </div>`,
    });
  } else if (maneuverType === "shove") {
    await executeShoveOutcome(attackerToken, targetToken, actor.name, targetToken.name);
  } else if (maneuverType === "disarm") {
    const equippedWeapon = targetActor.items?.find(
      (i: any) => i.type === "weapon" && i.system?.equipped
    );
    const weaponName = equippedWeapon?.name ?? UI_TEXT.disarmFallbackWeapon;

    await ChatMessage.create({
      speaker: ChatMessage.getSpeaker({ token: attackerToken }),
      content: `
        <div class="et-maneuver-card" style="border-left: 4px solid #f39c12; padding: 8px 12px; background: rgba(0,0,0,0.3);">
          <h3 style="margin-top:0; color:#f1c40f;">${UI_TEXT.disarmSuccessTitle}</h3>
          <p>${UI_TEXT.disarmSuccessBody(actor.name, targetToken.name)}</p>
          <p style="color:#e67e22; font-weight:bold; font-size:1.05em;">${UI_TEXT.disarmWeaponDropped(weaponName)}</p>
          <p style="font-size:0.85em; color:#bbb; margin-bottom:0;">
            ${UI_TEXT.disarmHitlNotice}
          </p>
        </div>
      `,
    });
  }

  return false;
}

/**
 * Toggles audiovisual effects for combat maneuvers (P-004 reversibility).
 */
export function toggleManeuverEffects(): boolean {
  const current = (game.settings as any)?.get(MODULE_ID, SETTING_MANEUVER_EFFECTS) ?? true;
  const next = !current;
  (game.settings as any)?.set(MODULE_ID, SETTING_MANEUVER_EFFECTS, next);
  console.log(`${MODULE_TITLE} | Maneuver audiovisual effects: ${next ? "ENABLED" : "DISABLED"}`);
  return next;
}

function registerSocketListeners(): void {
  (game.socket as any)?.on(`module.${MODULE_ID}`, async (data: ManeuverSocketPayload) => {
    if (!data || !data.action) return;

    if (data.action === SOCKET_ACTION_DEFENSE_PROMPT) {
      const targetActor: any = data.targetActorUuid ? fromUuidSync(data.targetActorUuid) : null;
      if (!targetActor || !targetActor.isOwner) return;

      if ((game.user as any)?.isGM && targetActor.hasPlayerOwner) {
        const activePlayerOwner = (game.users as any)?.some(
          (u: any) => u.active && !u.isGM && targetActor.testUserPermission(u, "OWNER")
        );
        if (activePlayerOwner) return;
      }

      const maneuverType = data.maneuverType || "grapple";
      const maneuverDef = MANEUVER_DEFINITIONS[maneuverType];
      const chosenSkill = await showDefenseSelectionDialog(
        maneuverDef.name,
        data.attackerName || UI_TEXT.defaultAttackerName,
        targetActor
      );

      const responsePayload: ManeuverSocketPayload = {
        action: SOCKET_ACTION_DEFENSE_RESPONSE,
        maneuverId: data.maneuverId,
        chosenSkill,
      };
      (game.socket as any)?.emit(`module.${MODULE_ID}`, responsePayload);
    } else if (data.action === SOCKET_ACTION_DEFENSE_RESPONSE) {
      const resolver = pendingDefenseResolvers.get(data.maneuverId);
      if (resolver && data.chosenSkill) {
        pendingDefenseResolvers.delete(data.maneuverId);
        resolver(data.chosenSkill);
      }
    }
  });
}

/**
 * Registers the Combat Maneuvers feature into Foundry VTT lifecycle hooks.
 */
export function registerCombatManeuvers(): void {
  console.log(`${MODULE_TITLE} | Registering Combat Maneuvers automation`);

  (game.settings as any).register(MODULE_ID, SETTING_MANEUVER_EFFECTS, {
    name: UI_TEXT.settingEffectsName,
    hint: UI_TEXT.settingEffectsHint,
    scope: "client",
    config: true,
    type: Boolean,
    default: true,
  });

  registerSocketListeners();

  Hooks.once("ready", async () => {
    await syncManeuversOnAllActors();
  });

  (Hooks as any).on("canvasReady", async () => {
    if (!(game.user as any)?.isGM) return;
    if ((canvas as any)?.tokens?.placeables) {
      for (const token of (canvas as any).tokens.placeables) {
        if (token.actor) {
          await ensureManeuverItemsOnActor(token.actor);
        }
      }
    }
  });

  (Hooks as any).on("renderApplication", async (app: any) => {
    const actor = app.document?.documentName === "Actor" ? app.document : (app.actor ?? null);
    if (actor && actor.isOwner) {
      await ensureManeuverItemsOnActor(actor);
    }
  });

  for (const hookName of SHEET_RENDER_HOOKS) {
    (Hooks as any).on(hookName, async (app: any, _html: any, data: any) => {
      const actor = app.document ?? app.actor ?? data?.actor ?? data?.document ?? null;
      if (actor && actor.isOwner) {
        await ensureManeuverItemsOnActor(actor);
      }
    });
  }

  (Hooks as any).on("dnd5e.preUseItem", (item: any) => {
    if (isManeuverItem(item)) {
      console.log(`${MODULE_TITLE} | [Maneuvers] Intercepted dnd5e.preUseItem`);
      executeManeuverWorkflow(item, item.actor);
      return false;
    }
  });

  (Hooks as any).on("dnd5e.preUseActivity", (activity: any) => {
    if (isManeuverItem(activity?.item)) {
      console.log(`${MODULE_TITLE} | [Maneuvers] Intercepted dnd5e.preUseActivity`);
      executeManeuverWorkflow(activity.item, activity.item.actor);
      return false;
    }
  });

  (Hooks as any).on("midi-qol.preItemRoll", (workflow: any) => {
    if (isManeuverItem(workflow?.item)) {
      console.log(`${MODULE_TITLE} | [Maneuvers] Intercepted midi-qol.preItemRoll`);
      executeManeuverWorkflow(workflow.item, workflow.item.actor);
      return false;
    }
  });
}
