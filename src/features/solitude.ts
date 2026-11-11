/**
 * Bênção Solitude: o efeito "Foco Solitário" fica ativo enquanto nenhum aliado consciente
 * estiver a até 10 ft do portador (distância em pés medida entre os pontos mais próximos dos tokens).
 */

import { MODULE_ID, MODULE_TITLE } from "../constants";

const ISOLATION_EFFECT_NAME = "Foco Solitário";
const LEGACY_EFFECT_NAME = "Protocolo de Isolamento";
const ISOLATION_ICON = "icons/environment/wilderness/arch-stone.webp";
/** Distância máxima em pés para considerar que um aliado viola o isolamento (a até 10 ft). */
const ISOLATION_DISTANCE_FEET = 10;
const INCAPACITATED_STATUSES = ["dead", "unconscious"];

/**
 * Retorna o item da bênção Solitude no ator (busca flexível que aceita "Solitude").
 */
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
 * Garante que o efeito ativo "Foco Solitário" existe no ator com as modificações corretas,
 * migrando automaticamente caso encontre o nome legado "Protocolo de Isolamento".
 */
export async function ensureIsolationEffect(actor: any): Promise<any> {
  if (!actor) return null;

  const effect = getIsolationEffect(actor);
  if (effect) return effect;

  // 2. Procura efeito legado "Protocolo de Isolamento" e migra o nome
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
      // Caso a atualização falhe, prossegue para criação limpa
    }
  }

  // 3. Cria novo efeito ativo com as mudanças padronizadas
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
    description: `
      <p><strong>Foco Solitário (Bênção Solitude)</strong></p>
      <p>Concedido enquanto não houver nenhum aliado consciente a até 10 ft de você:</p>
      <ul>
        <li>+1 em salvaguardas de Constituição para manter a concentração em magias.</li>
        <li>+1 em jogadas de ataque à distância e salvaguardas de Destreza.</li>
        <li>+2 em Sabedoria passiva (Percepção).</li>
      </ul>
    `,
    changes: [
      {
        key: "system.attributes.concentration.bonuses.save",
        mode: 2,
        value: "1",
        priority: 20,
      },
      {
        key: "system.bonuses.rwak.attack",
        mode: 2,
        value: "1",
        priority: 20,
      },
      {
        key: "system.bonuses.rsak.attack",
        mode: 2,
        value: "1",
        priority: 20,
      },
      {
        key: "system.abilities.dex.bonuses.save",
        mode: 2,
        value: "1",
        priority: 20,
      },
      {
        key: "system.skills.prc.bonuses.passive",
        mode: 2,
        value: "2",
        priority: 20,
      },
    ],
  };

  try {
    const created = await actor.createEmbeddedDocuments("ActiveEffect", [effectData]);
    return created[0] ?? null;
  } catch (err) {
    console.error(`${MODULE_TITLE} | Erro ao criar efeito ${ISOLATION_EFFECT_NAME} em ${actor.name}:`, err);
    return null;
  }
}

/**
 * Retorna o token que representa o ator na cena atual. O efeito pertence ao ator, então
 * apenas um token pode decidir seu estado. Se o token movido pertencer a este ator, ele tem prioridade total.
 */
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

/** Obtém as coordenadas efetivas de um token, aplicando o delta de 'changes' caso seja o token recém-movido ou redimensionado. */
function getTokenBounds(
  token: any,
  movedDoc?: any,
  changes?: any
): { x: number; y: number; width: number; height: number } {
  const isMoved = movedDoc && token.id === movedDoc.id && changes;
  return {
    x: isMoved && "x" in changes ? changes.x : (token.x ?? 0),
    y: isMoved && "y" in changes ? changes.y : (token.y ?? 0),
    width: isMoved && "width" in changes ? changes.width : (token.width ?? 1),
    height: isMoved && "height" in changes ? changes.height : (token.height ?? 1),
  };
}

/**
 * Retorna as coordenadas de centro de cada célula da grade ocupada pelo token.
 */
function getTokenGridCenters(bounds: { x: number; y: number; width: number; height: number }): Array<{ x: number; y: number }> {
  const size = canvas.grid?.size || 100;
  const centers: Array<{ x: number; y: number }> = [];

  const cols = Math.max(1, Math.floor(bounds.width || 1));
  const rows = Math.max(1, Math.floor(bounds.height || 1));

  if (bounds.width < 1 || bounds.height < 1) {
    centers.push({
      x: bounds.x + (bounds.width * size) / 2,
      y: bounds.y + (bounds.height * size) / 2,
    });
    return centers;
  }

  for (let x = 0; x < cols; x++) {
    for (let y = 0; y < rows; y++) {
      centers.push({
        x: bounds.x + (x + 0.5) * size,
        y: bounds.y + (y + 0.5) * size,
      });
    }
  }

  return centers;
}

/**
 * Calcula a menor distância em pés entre quaisquer espaços/cantos ocupados por dois tokens.
 * Respeita a regra diagonal do sistema/cena e utiliza MidiQOL.computeDistance quando disponível.
 */
export function getDistanceInFeet(
  boundsA: { x: number; y: number; width: number; height: number },
  boundsB: { x: number; y: number; width: number; height: number },
  tokenA?: any,
  tokenB?: any
): number {
  if (!canvas?.grid) return Infinity;

  // Se ambos os tokens forem reais e suas coordenadas coincidirem com os bounds,
  // e o MidiQOL estiver disponível, usa o cálculo do MidiQOL diretamente
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
      // Fallback para cálculo nativo da grade
    }
  }

  const centersA = getTokenGridCenters(boundsA);
  const centersB = getTokenGridCenters(boundsB);
  const size = canvas.grid.size || 100;
  const gridDistance = canvas.grid.distance || 5;

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
  const hasHitPoints = (actor.system?.attributes?.hp?.value ?? 0) > 0;
  const isIncapacitated = INCAPACITATED_STATUSES.some((status) => actor.statuses?.has(status));
  return hasHitPoints && !isIncapacitated;
}

/** Aliado = mesma disposição do portador, ou ambos pertencentes a jogadores. */
function areAllies(tokenA: any, tokenB: any): boolean {
  const sameDisposition = tokenA.disposition === tokenB.disposition;
  const bothPlayerOwned = tokenA.actor?.hasPlayerOwner && tokenB.actor?.hasPlayerOwner;
  return sameDisposition || Boolean(bothPlayerOwned);
}

/** O portador está isolado quando nenhum aliado consciente está a até ISOLATION_DISTANCE_FEET (10 ft). */
export function isIsolated(token: any, movedDoc?: any, changes?: any): boolean {
  if (!canvas.scene?.tokens) return true;
  const tokenBounds = getTokenBounds(token, movedDoc, changes);

  return !canvas.scene.tokens.some((other: any) => {
    if (!other.actor || other.actor === token.actor) return false;
    if (!areAllies(token, other) || !isConscious(other.actor)) return false;

    const otherBounds = getTokenBounds(other, movedDoc, changes);
    const dist = getDistanceInFeet(tokenBounds, otherBounds, token, other);
    return dist <= ISOLATION_DISTANCE_FEET + 0.1;
  });
}

/** Liga ou desliga o efeito conforme o isolamento atual do portador de Solitude. */
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
    canvas.scene.tokens.map((token: any) => token.actor).filter((actor: any) => actor && getSolitudeItem(actor))
  );
  for (const actor of bearers) {
    await checkSolitude(actor, movedDoc, changes);
  }
}

/**
 * Extrai o ator de qualquer configuração ou chamada de hook de rolagem (dnd5e 5.x, 3.x, ou Midi-QOL).
 */
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

/**
 * Sincroniza o estado de isolamento do ator imediatamente antes de uma rolagem (ataque, save, concentração).
 * Atualiza o efeito e os bônus síncronamente em memória antes da montagem dos termos da rolagem,
 * e persiste a alteração no banco de dados em segundo plano.
 */
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
    // 1. Atualiza imediatamente em memória para que o getAttackData e formulas leiam o novo valor
    effect.disabled = shouldBeDisabled;
    if (typeof actor.prepareData === "function") {
      actor.prepareData();
    }
    // 2. Dispara a persistência no banco de dados em segundo plano
    effect.update({ disabled: shouldBeDisabled }).catch((err: any) => {
      console.error(`${MODULE_TITLE} | Erro ao sincronizar Foco Solitário:`, err);
    });
  } else if (!effect && isolated) {
    ensureIsolationEffect(actor).catch(console.error);
  }

  // 3. Atualiza dados de rolagens já pré-construídas (como salvaguardas/concentração)
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
 * Registra os hooks do Foco Solitário:
 * - Sob demanda, sincroniza antes de qualquer rolagem (ataque, salvaguarda, concentração, teste de d20).
 * - Na movimentação ou redimensionamento de qualquer token, aplicando as novas coordenadas/tamanho em tempo real.
 * - Na criação ou exclusão de tokens na cena.
 * - Na alteração de HP/condições de atores (ex: aliados caindo inconscientes).
 * - No fim do combate, desativando o efeito.
 */
export function registerSolitudeFeature(): void {
  console.log(`${MODULE_TITLE} | Registrando bênção Solitude (Foco Solitário)`);

  // Hooks de pré-rolagem no dnd5e 5.x / 3.x / Midi-QOL
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

  // Movimentação ou redimensionamento de tokens
  Hooks.on("updateToken", (tokenDoc: any, changes: any) => {
    const boundsChanged = "x" in changes || "y" in changes || "width" in changes || "height" in changes;
    if (boundsChanged) checkAllSolitudeBearers(tokenDoc, changes);
  });

  // Criação ou remoção de tokens
  Hooks.on("createToken", () => checkAllSolitudeBearers());
  Hooks.on("deleteToken", () => checkAllSolitudeBearers());

  // Mudança de status / HP (ex: aliado caindo inconsciente ou morrendo)
  Hooks.on("updateActor", (actor: any, changes: any) => {
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
