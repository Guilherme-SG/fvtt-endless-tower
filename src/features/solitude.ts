import { MODULE_ID, MODULE_TITLE } from "../constants";

const SOLITUDE_ITEM_NAME = "Solitude";
const ISOLATION_EFFECT_NAME = "Protocolo de Isolamento";
const ISOLATION_ICON = "icons/environment/wilderness/arch-stone.webp";
const ISOLATION_DISTANCE_FT = 10;

declare const MidiQOL: any;

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

/**
 * Garante que o efeito ativo "Protocolo de Isolamento" existe no ator com as modificações corretas.
 */
export async function ensureIsolationEffect(actor: any): Promise<any> {
  if (!actor) return null;

  let effect = actor.effects.find((e: any) => e.name === ISOLATION_EFFECT_NAME);
  if (effect) return effect;

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
      <p><strong>Protocolo de Isolamento (Foco Total)</strong></p>
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
 * Mede a distância entre dois tokens em pés (ft).
 * Prioriza a medição precisa borda-a-borda do Midi-QOL se ativo; caso contrário, usa a malha do Foundry.
 */
function measureDistanceFt(token1: any, token2: any): number {
  if (typeof MidiQOL !== "undefined" && typeof MidiQOL.computeDistance === "function") {
    try {
      return MidiQOL.computeDistance(token1, token2);
    } catch {
      // Fallback para medição de grid nativa
    }
  }

  const grid = (canvas as any)?.grid;
  if (!grid) return 999;

  const center1 = token1.center || { x: token1.x, y: token1.y };
  const center2 = token2.center || { x: token2.x, y: token2.y };

  if (typeof grid.measurePath === "function") {
    const measured = grid.measurePath([center1, center2]);
    return measured.distance ?? 999;
  }

  if (typeof grid.measureDistance === "function") {
    return grid.measureDistance(center1, center2);
  }

  const dx = (center1.x - center2.x) / (grid.size || 100);
  const dy = (center1.y - center2.y) / (grid.size || 100);
  const gridDistance = grid.distance || 5;
  return Math.hypot(dx, dy) * gridDistance;
}

/**
 * Localiza o token associado ao ator na cena ativa.
 */
function resolveActorToken(actor: any, explicitToken?: any): any {
  if (explicitToken?.actor?.id === actor.id) return explicitToken;
  if (actor.isToken && actor.token?.object) return actor.token.object;

  const controlled = (canvas as any).tokens?.controlled || [];
  const selected = controlled.find((t: any) => t.actor?.id === actor.id);
  if (selected) return selected;

  const activeTokens = actor.getActiveTokens?.() || [];
  if (activeTokens.length > 0 && activeTokens[0]) {
    return activeTokens[0].object ?? activeTokens[0];
  }

  return (canvas as any).tokens?.placeables?.find((t: any) => t.actor?.id === actor.id) || null;
}

/**
 * Avalia aliados conscientes a até 10 ft do token.
 */
function getNearbyConsciousAllies(token: any, maxDistanceFt = ISOLATION_DISTANCE_FT): any[] {
  if (!token || !canvas?.tokens?.placeables) return [];

  const FRIENDLY = (CONST as any).TOKEN_DISPOSITIONS?.FRIENDLY ?? 1;

  return (canvas as any).tokens.placeables.filter((t: any) => {
    // Ignora o próprio token
    if (t.id === token.id || t.actor?.id === token.actor?.id) return false;

    // Apenas aliados com disposição FRIENDLY
    if (t.document.disposition !== FRIENDLY) return false;

    const actor = t.actor;
    if (!actor) return false;

    // Verifica se está consciente (HP > 0 e sem status inconsciente ou morto)
    const hp = actor.system?.attributes?.hp?.value ?? 0;
    if (hp <= 0) return false;

    const statuses = actor.statuses;
    if (statuses && (statuses.has("dead") || statuses.has("unconscious"))) {
      return false;
    }

    const hasDeadOrUnconsciousEffect = actor.effects?.some(
      (e: any) =>
        !e.disabled &&
        ["Dead", "Unconscious", "Morto", "Inconsciente"].includes(e.name)
    );
    if (hasDeadOrUnconsciousEffect) return false;

    // Distância até o token
    const dist = measureDistanceFt(token, t);
    return dist <= maxDistanceFt;
  });
}

/**
 * Executa a checagem do Protocolo de Isolamento para um ator/token:
 * - Se não houver aliados conscientes a até 10 ft: ativa o efeito.
 * - Se houver aliados a até 10 ft: desativa o efeito.
 */
export async function checkSolitude(
  actor: any,
  explicitToken?: any,
  options: { silent?: boolean } = {}
): Promise<boolean> {
  if (!actor) return false;

  const solitudeItem = getSolitudeItem(actor);
  if (!solitudeItem) return false;

  const token = resolveActorToken(actor, explicitToken);
  if (!token) {
    console.warn(`${MODULE_TITLE} | Token para ${actor.name} não encontrado para verificar Solitude.`);
    return false;
  }

  const effect = await ensureIsolationEffect(actor);
  if (!effect) return false;

  const nearbyAllies = getNearbyConsciousAllies(token, ISOLATION_DISTANCE_FT);
  const isIsolated = nearbyAllies.length === 0;

  if (isIsolated) {
    // Se está isolado e o efeito está desligado, ATIVA
    if (effect.disabled) {
      await effect.update({ disabled: false });

      if (!options.silent) {
        const tokenImg = token.document?.texture?.src || effect.img || ISOLATION_ICON;
        await ChatMessage.create({
          speaker: ChatMessage.getSpeaker({ token, actor }),
          content: `
            <div class="dnd5e chat-card et-solitude-card">
              <header class="card-header flexrow">
                <img src="${tokenImg}" title="${ISOLATION_EFFECT_NAME}" width="36" height="36" style="border:none;border-radius:4px;margin-right:8px;"/>
                <h3 style="margin:0;line-height:36px;font-family:var(--et-font-cinematic, serif);font-weight:bold;color:#f3e2b0;">
                  Protocolo de Isolamento
                </h3>
              </header>
              <div class="card-content" style="padding:8px 4px;font-size:0.92rem;line-height:1.45;">
                Nenhum aliado a até 10 ft de <strong>${actor.name}</strong>! Entrou em estado de foco total recebendo:
                <ul style="margin:6px 0 0 16px;padding:0;">
                  <li><b>+1</b> em salvaguardas de Con para manter concentração</li>
                  <li><b>+1</b> em ataques à distância e salvaguardas de Dex</li>
                  <li><b>+2</b> em Sabedoria passiva (Percepção)</li>
                </ul>
              </div>
            </div>
          `,
        } as any);
      }
    }
  } else {
    // Se há aliados próximos e o efeito está ligado, DESATIVA
    if (!effect.disabled) {
      await effect.update({ disabled: true });

      if (!options.silent) {
        const allyNames = nearbyAllies.map((a: any) => a.name).join(", ");
        await ChatMessage.create({
          speaker: ChatMessage.getSpeaker({ token, actor }),
          content: `
            <div class="dnd5e chat-card et-solitude-card">
              <header class="card-header flexrow">
                <img src="${effect.img || ISOLATION_ICON}" title="${ISOLATION_EFFECT_NAME}" width="36" height="36" style="border:none;border-radius:4px;margin-right:8px;"/>
                <h3 style="margin:0;line-height:36px;font-family:var(--et-font-cinematic, serif);font-weight:bold;color:#a99885;">
                  Protocolo de Isolamento: Suspenso
                </h3>
              </header>
              <div class="card-content" style="padding:8px 4px;font-size:0.92rem;line-height:1.45;">
                Aliado(s) detectado(s) a menos de 10 ft de <strong>${actor.name}</strong> (<em>${allyNames}</em>). O foco de isolamento foi suspenso.
              </div>
            </div>
          `,
        } as any);
      }
    }
  }

  return isIsolated;
}

/**
 * Registra os hooks para acionar o Protocolo de Isolamento da bênção Solitude:
 * - No início do turno de cada combatente (updateCombat).
 * - Ao término do combate (deleteCombat) desativa o efeito para não vazar fora do confronto.
 */
export function registerSolitudeFeature(): void {
  console.log(`${MODULE_TITLE} | Registrando bênção Solitude (Protocolo de Isolamento)`);

  let lastProcessedKey = "";

  Hooks.on("updateCombat", async (combat: any, updates: any) => {
    // Apenas o GM ativo gerencia a automação para evitar execuções duplicadas
    if (!game.users?.activeGM?.isSelf) return;

    if (updates.turn === undefined && updates.round === undefined) return;

    const round = combat.round ?? 0;
    const turn = combat.turn ?? 0;
    if (round === 0) return;

    const currentKey = `${combat.id}-${round}-${turn}`;
    if (lastProcessedKey === currentKey) return;
    lastProcessedKey = currentKey;

    const combatant = combat.combatant;
    const actor = combatant?.actor;
    if (!actor) return;

    if (getSolitudeItem(actor)) {
      const token = combatant.token?.object || (canvas as any)?.tokens?.get(combatant.tokenId);
      await checkSolitude(actor, token);
    }
  });

  Hooks.on("deleteCombat", async (combat: any) => {
    if (!game.users?.activeGM?.isSelf) return;

    for (const combatant of combat.combatants || []) {
      const actor = combatant.actor;
      if (actor && getSolitudeItem(actor)) {
        const effect = actor.effects.find(
          (e: any) => e.name === ISOLATION_EFFECT_NAME && !e.disabled
        );
        if (effect) {
          await effect.update({ disabled: true });
        }
      }
    }
  });
}
