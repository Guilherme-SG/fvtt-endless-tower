/**
 * Bênção Solitude: o efeito "Foco Solitário" fica ativo enquanto nenhum aliado consciente
 * estiver a menos de 2 quadrados de vão livre do portador.
 */

import { MODULE_ID, MODULE_TITLE } from "../constants";

const ISOLATION_EFFECT_NAME = "Foco Solitário";
const LEGACY_EFFECT_NAME = "Protocolo de Isolamento";
const ISOLATION_ICON = "icons/environment/wilderness/arch-stone.webp";
/** Quadrados vazios exigidos entre o portador e qualquer aliado consciente. */
const MIN_FREE_SQUARES = 2;
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
function getActorTokenDocument(actor: any, movedDoc?: any): any {
  if (movedDoc && (movedDoc.actorId === actor.id || movedDoc.actor === actor)) {
    return movedDoc;
  }
  if (actor.token) return actor.token;

  const tokens: any[] = actor.getActiveTokens(false, true);
  const combatTokenId = game.combat?.combatants.find((c: any) => c.actor === actor)?.tokenId;
  const inCombat = tokens.find((token) => token.id === combatTokenId);
  const selected = tokens.find((token) => token.object?.controlled);
  return inCombat ?? selected ?? tokens[0] ?? null;
}

/** Obtém as coordenadas efetivas de um token, aplicando o delta de 'changes' caso seja o token recém-movido. */
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

/** Quadrados vazios entre as bordas mais próximas de dois tokens (0 = adjacentes). */
export function getFreeSquaresBetween(
  posA: { x: number; y: number; width: number; height: number },
  posB: { x: number; y: number; width: number; height: number }
): number {
  const size = canvas.grid.size;
  const gapOnAxis = (startA: number, sizeA: number, startB: number, sizeB: number): number =>
    Math.max(startA - (startB + sizeB), startB - (startA + sizeA), 0);

  const gapX = gapOnAxis(posA.x, posA.width * size, posB.x, posB.width * size);
  const gapY = gapOnAxis(posA.y, posA.height * size, posB.y, posB.height * size);
  return Math.round(Math.max(gapX, gapY) / size);
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

/** O portador está isolado quando nenhum aliado consciente está a menos de MIN_FREE_SQUARES de vão. */
export function isIsolated(token: any, movedDoc?: any, changes?: any): boolean {
  const tokenPos = getTokenBounds(token, movedDoc, changes);

  return !canvas.scene.tokens.some((other: any) => {
    if (!other.actor || other.actor === token.actor) return false;
    if (!areAllies(token, other) || !isConscious(other.actor)) return false;

    const otherPos = getTokenBounds(other, movedDoc, changes);
    const gap = getFreeSquaresBetween(tokenPos, otherPos);
    return gap < MIN_FREE_SQUARES;
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
  const bearers = new Set(
    canvas.scene.tokens.map((token: any) => token.actor).filter((actor: any) => actor && getSolitudeItem(actor))
  );
  for (const actor of bearers) {
    await checkSolitude(actor, movedDoc, changes);
  }
}

/**
 * Registra os hooks do Foco Solitário:
 * - Sob demanda, antes de rolagens do portador (ataque, salvaguarda, concentração, teste de d20).
 * - Na movimentação de qualquer token, aplicando as novas coordenadas em tempo real.
 * - No fim do combate, desativando o efeito.
 */
export function registerSolitudeFeature(): void {
  console.log(`${MODULE_TITLE} | Registrando bênção Solitude (Foco Solitário)`);

  Hooks.on("dnd5e.preRollAttack", (item: any) => checkSolitude(item.actor));
  Hooks.on("dnd5e.preRollSavingThrow", (actor: any) => checkSolitude(actor));
  Hooks.on("dnd5e.preRollConcentration", (actor: any) => checkSolitude(actor));
  Hooks.on("dnd5e.preRollD20Test", (config: any) => checkSolitude(config?.subject));

  Hooks.on("updateToken", (tokenDoc: any, changes: any) => {
    const moved = "x" in changes || "y" in changes;
    if (moved) checkAllSolitudeBearers(tokenDoc, changes);
  });

  Hooks.on("deleteCombat", async (combat: any) => {
    if (!game.users?.activeGM?.isSelf) return;

    for (const { actor } of combat.combatants) {
      const effect = actor && getSolitudeItem(actor) && getIsolationEffect(actor);
      if (effect && !effect.disabled) await effect.update({ disabled: true });
    }
  });
}
