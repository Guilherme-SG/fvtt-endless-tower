import { MODULE_ID, MODULE_TITLE } from "../../constants";
import {
  DEFAULT_FEET_PER_GRID,
  DEFAULT_GRID_SIZE,
  DISTANCE_EPSILON_FEET,
  ISOLATION_DISTANCE_FEET,
  ISOLATION_EFFECT_NAME,
  ISOLATION_ICON,
  LEGACY_EFFECT_NAME,
  SOLITUDE_EFFECT_CHANGES,
  UI_TEXT,
} from "./config";
import {
  calculateTokenGridCenters,
  isActorConsciousState,
  resolveTokenBoundsWithChanges,
  type TokenBounds,
} from "./rules";

function getSolitudeItem(actor: any): any {
  if (!actor?.items) return null;
  return actor.items.find(
    (item: any) =>
      item.getFlag?.(MODULE_ID, "isSolitude") ||
      item.name?.toLowerCase().includes("solitude")
  );
}

function getIsolationEffect(actor: any): any {
  return actor.effects.find((e: any) => e.name === ISOLATION_EFFECT_NAME);
}

/**
 * Ensures the "Foco Solitário" ActiveEffect exists on the actor, migrating any legacy effect name.
 */
export async function ensureIsolationEffect(actor: any): Promise<any> {
  if (!actor) return null;

  const effect = getIsolationEffect(actor);
  if (effect) return effect;

  const legacyEffect = actor.effects.find(
    (e: any) => e.name === LEGACY_EFFECT_NAME || e.label === LEGACY_EFFECT_NAME
  );
  if (legacyEffect) {
    try {
      await legacyEffect.update({
        name: ISOLATION_EFFECT_NAME,
        img: ISOLATION_ICON,
        "flags.endless-tower.isSolitudeBuff": true,
      });
      return legacyEffect;
    } catch {
      // Proceed to clean creation if update fails
    }
  }

  const effectData = {
    name: ISOLATION_EFFECT_NAME,
    img: ISOLATION_ICON,
    origin: actor.uuid,
    disabled: true,
    transfer: false,
    system: {},
    flags: {
      [MODULE_ID]: {
        isSolitudeBuff: true,
      },
    },
    description: UI_TEXT.effectDescription,
    changes: SOLITUDE_EFFECT_CHANGES.map((c) => ({ ...c })),
  };

  try {
    const created = await actor.createEmbeddedDocuments("ActiveEffect", [effectData]);
    return created[0] ?? null;
  } catch (err) {
    console.error(`${MODULE_TITLE} | Failed to create ${ISOLATION_EFFECT_NAME} on ${actor.name}:`, err);
    return null;
  }
}

function getActorTokenDocument(actor: any, movedDoc?: any, preferredTokenId?: string): any {
  if (movedDoc && (movedDoc.actorId === actor.id || movedDoc.actor === actor)) {
    return movedDoc;
  }
  if (preferredTokenId) {
    const preferred = canvas.scene?.tokens?.get(preferredTokenId);
    if (preferred && (preferred.actor === actor || preferred.actorId === actor.id)) {
      return preferred;
    }
  }
  if (actor.token) return actor.token;

  const tokens: any[] = actor.getActiveTokens ? actor.getActiveTokens(false, true) : [];
  const combatTokenId = game.combat?.combatants.find((c: any) => c.actor === actor)?.tokenId;
  const inCombat = tokens.find((token) => token.id === combatTokenId);
  const selected = tokens.find((token) => token.object?.controlled);
  return selected ?? inCombat ?? tokens[0] ?? null;
}

function getTokenBounds(token: any, movedDoc?: any, changes?: any): TokenBounds {
  const baseBounds: TokenBounds = {
    x: token.x ?? 0,
    y: token.y ?? 0,
    width: token.width ?? 1,
    height: token.height ?? 1,
  };
  const isMoved = movedDoc && token.id === movedDoc.id && changes;
  return isMoved ? resolveTokenBoundsWithChanges(baseBounds, changes) : baseBounds;
}

/**
 * Computes the shortest distance in feet between any occupied grid cells of two tokens,
 * preferring MidiQOL.computeDistance when exact token positions match.
 */
export function getDistanceInFeet(
  boundsA: TokenBounds,
  boundsB: TokenBounds,
  tokenA?: any,
  tokenB?: any
): number {
  if (!canvas?.grid) return Infinity;

  const midi = (globalThis as any).MidiQOL;
  const isBoundsExactA =
    tokenA &&
    tokenA.x === boundsA.x &&
    tokenA.y === boundsA.y &&
    (tokenA.width ?? 1) === boundsA.width &&
    (tokenA.height ?? 1) === boundsA.height;
  const isBoundsExactB =
    tokenB &&
    tokenB.x === boundsB.x &&
    tokenB.y === boundsB.y &&
    (tokenB.width ?? 1) === boundsB.width &&
    (tokenB.height ?? 1) === boundsB.height;

  if (isBoundsExactA && isBoundsExactB && typeof midi?.computeDistance === "function") {
    try {
      const d = midi.computeDistance(tokenA.object ?? tokenA, tokenB.object ?? tokenB, {
        wallsBlock: false,
        includeCover: false,
      });
      if (typeof d === "number" && d >= 0) return d;
    } catch {
      // Fall back to scene grid distance calculation
    }
  }

  const size = canvas.grid.size || DEFAULT_GRID_SIZE;
  const gridDistance = canvas.grid.distance || DEFAULT_FEET_PER_GRID;
  const centersA = calculateTokenGridCenters(boundsA, size);
  const centersB = calculateTokenGridCenters(boundsB, size);

  let minDistance = Infinity;

  for (const cA of centersA) {
    for (const cB of centersB) {
      let dist: number;
      if (canvas.grid.measurePath) {
        dist = canvas.grid.measurePath([cA, cB]).distance;
      } else if (canvas.grid.measureDistance) {
        dist = canvas.grid.measureDistance(cA, cB);
      } else {
        const dx = Math.abs(cA.x - cB.x) / size;
        const dy = Math.abs(cA.y - cB.y) / size;
        dist = Math.max(dx, dy) * gridDistance;
      }

      if (dist < minDistance) {
        minDistance = dist;
        if (minDistance <= gridDistance) return minDistance;
      }
    }
  }

  return minDistance;
}

function isConscious(actor: any): boolean {
  const hpValue = actor.system?.attributes?.hp?.value ?? 0;
  const statuses: Iterable<string> = actor.statuses ?? [];
  return isActorConsciousState(hpValue, statuses);
}

function areAllies(tokenA: any, tokenB: any): boolean {
  const sameDisposition = tokenA.disposition === tokenB.disposition;
  const bothPlayerOwned = tokenA.actor?.hasPlayerOwner && tokenB.actor?.hasPlayerOwner;
  return sameDisposition || Boolean(bothPlayerOwned);
}

/**
 * Checks whether a token is isolated (no conscious allies within 10 ft).
 */
export function isIsolated(token: any, movedDoc?: any, changes?: any): boolean {
  if (!canvas.scene?.tokens) return true;
  const tokenBounds = getTokenBounds(token, movedDoc, changes);

  return !canvas.scene.tokens.some((other: any) => {
    if (!other.actor || other.actor === token.actor) return false;
    if (!areAllies(token, other) || !isConscious(other.actor)) return false;

    const otherBounds = getTokenBounds(other, movedDoc, changes);
    const dist = getDistanceInFeet(tokenBounds, otherBounds, token, other);
    return dist <= ISOLATION_DISTANCE_FEET + DISTANCE_EPSILON_FEET;
  });
}

/**
 * Enables or disables the Solitude isolation effect for an actor based on nearby allies.
 */
export async function checkSolitude(actor: any, movedDoc?: any, changes?: any): Promise<void> {
  if (!actor?.isOwner || !getSolitudeItem(actor)) return;

  const token = getActorTokenDocument(actor, movedDoc);
  if (!token) return;

  const effect = await ensureIsolationEffect(actor);
  if (!effect) return;

  const shouldBeDisabled = !isIsolated(token, movedDoc, changes);
  if (effect.disabled !== shouldBeDisabled) {
    await effect.update({ disabled: shouldBeDisabled });
  }
}

async function checkAllSolitudeBearers(movedDoc?: any, changes?: any): Promise<void> {
  if (!canvas.scene?.tokens) return;
  const bearers = new Set(
    canvas.scene.tokens
      .map((token: any) => token.actor)
      .filter((actor: any) => actor && getSolitudeItem(actor))
  );
  for (const actor of bearers) {
    await checkSolitude(actor, movedDoc, changes);
  }
}

function extractActorFromRoll(arg0: any, arg1?: any): any {
  if (!arg0) return null;
  if (arg0.subject?.actor) return arg0.subject.actor;
  if (arg0.subject?.documentName === "Actor") return arg0.subject;
  if (arg0.actor) return arg0.actor;
  if (arg0.documentName === "Actor") return arg0;
  if (arg0.workflow?.actor) return arg0.workflow.actor;
  if (arg0.item?.actor) return arg0.item.actor;
  if (arg1?.subject?.actor) return arg1.subject.actor;
  if (arg1?.actor) return arg1.actor;
  if (arg1?.documentName === "Actor") return arg1;
  return null;
}

function syncSolitudeForRoll(config: any, dialog?: any, message?: any): void {
  const actor = extractActorFromRoll(config, dialog);
  if (!actor || !getSolitudeItem(actor)) return;

  const speakerTokenId = message?.data?.speaker?.token ?? dialog?.options?.speaker?.token;
  const token = getActorTokenDocument(actor, undefined, speakerTokenId);
  if (!token) return;

  const isolated = isIsolated(token);
  const shouldBeDisabled = !isolated;

  const effect = getIsolationEffect(actor);
  if (effect && effect.disabled !== shouldBeDisabled) {
    effect.disabled = shouldBeDisabled;
    if (typeof actor.prepareData === "function") {
      actor.prepareData();
    }
    effect.update({ disabled: shouldBeDisabled }).catch((err: any) => {
      console.error(`${MODULE_TITLE} | Error syncing Solitude effect:`, err);
    });
  } else if (!effect && isolated) {
    ensureIsolationEffect(actor).catch(console.error);
  }

  if (Array.isArray(config?.rolls)) {
    for (const roll of config.rolls) {
      if (!roll?.data) continue;
      if ("dexSaveBonus" in roll.data) {
        roll.data.dexSaveBonus = actor.system?.abilities?.dex?.bonuses?.save ?? 0;
      }
      if ("saveBonus" in roll.data) {
        roll.data.saveBonus = actor.system?.bonuses?.abilities?.save ?? 0;
      }
    }
  }
}

/**
 * Registers pre-roll, token movement, actor status, and combat end hooks for Solitude.
 */
export function registerSolitudeFeature(): void {
  console.log(`${MODULE_TITLE} | Registering Solitude feature`);

  Hooks.on("dnd5e.preRollAttack", (config: any, dialog: any, message: any) =>
    syncSolitudeForRoll(config, dialog, message)
  );
  Hooks.on("dnd5e.preRollSavingThrow", (config: any, dialog: any, message: any) =>
    syncSolitudeForRoll(config, dialog, message)
  );
  Hooks.on("dnd5e.preRollConcentration", (config: any, dialog: any, message: any) =>
    syncSolitudeForRoll(config, dialog, message)
  );
  Hooks.on("dnd5e.preRollD20Test", (config: any, dialog: any, message: any) =>
    syncSolitudeForRoll(config, dialog, message)
  );
  Hooks.on("midi-qol.preAttackRoll", (workflow: any) => {
    if (workflow?.actor) syncSolitudeForRoll({ subject: { actor: workflow.actor } });
  });

  Hooks.on("updateToken", (tokenDoc: any, changes: any) => {
    const boundsChanged =
      "x" in changes || "y" in changes || "width" in changes || "height" in changes;
    if (boundsChanged) checkAllSolitudeBearers(tokenDoc, changes);
  });

  Hooks.on("createToken", () => checkAllSolitudeBearers());
  Hooks.on("deleteToken", () => checkAllSolitudeBearers());

  Hooks.on("updateActor", (_actor: any, changes: any) => {
    const hpChanged = Boolean(changes.system?.attributes?.hp);
    const statusesChanged = "statuses" in changes;
    if (hpChanged || statusesChanged) checkAllSolitudeBearers();
  });

  Hooks.on("deleteCombat", async (combat: any) => {
    if (!game.users?.activeGM?.isSelf) return;

    for (const { actor } of combat.combatants) {
      const effect = actor && getSolitudeItem(actor) && getIsolationEffect(actor);
      if (effect && !effect.disabled) await effect.update({ disabled: true });
    }
  });
}
