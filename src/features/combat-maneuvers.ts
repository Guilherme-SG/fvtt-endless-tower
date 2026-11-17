/**
 * Endless Tower — Automação de Manobras de Combate (Agarrar, Empurrar, Desarmar)
 * Suporte a D&D 5e v5.2.5+ no Foundry VTT v13 com integração ao Epic Rolls 5e,
 * DFreds Convenient Effects, Sequencer e regras de D&D 5e (PHB e DMG p. 271).
 */

import { MODULE_ID, MODULE_TITLE } from "../constants";
import {
  type ManeuverType,
  type CreatureSize,
  type Point2D,
  validateManeuverPrerequisites,
  determineContestWinner,
  getDisarmModifiers,
  calculatePushVector,
} from "../rules/maneuvers";
import { measureMinDistanceChebyshev, type TokenBounds } from "../rules/combat";

declare const Sequencer: any;
declare const Sequence: any;

export const MANEUVER_ITEM_FLAG = "isCombatManeuver";
export const SETTING_MANEUVER_EFFECTS = "enableManeuverEffects";

export const SOCKET_ACTION_DEFENSE_PROMPT = "COMBAT_MANEUVER_DEFENSE_PROMPT";
export const SOCKET_ACTION_DEFENSE_RESPONSE = "COMBAT_MANEUVER_DEFENSE_RESPONSE";
const DEFENSE_TIMEOUT_MS = 30000;

export interface ManeuverDefinition {
  type: ManeuverType;
  name: string;
  img: string;
  description: string;
}

export const MANEUVER_DEFINITIONS: Record<ManeuverType, ManeuverDefinition> = {
  grapple: {
    type: "grapple",
    name: "Manobra: Agarrar",
    img: "icons/skills/melee/unarmed-punch-fist-white.webp",
    description:
      "<p><strong>Manobra de Combate: Agarrar</strong> (D&D 5e PHB p. 195).</p><p>Substitui um ataque corpo a corpo. Você tenta agarrar uma criatura a até 5 pés com uma mão livre. O alvo não pode ser mais do que uma categoria de tamanho maior que você.</p><p><strong>Disputa:</strong> Seu teste de Força (Atletismo) contra o teste de Força (Atletismo) ou Destreza (Acrobacia) do alvo.</p><p><strong>Sucesso:</strong> O alvo ganha a condição <em>Agarrado (Grappled)</em>.</p>",
  },
  shove: {
    type: "shove",
    name: "Manobra: Empurrar",
    img: "icons/skills/melee/unarmed-punch-fist-blue.webp",
    description:
      "<p><strong>Manobra de Combate: Empurrar</strong> (D&D 5e PHB p. 195).</p><p>Substitui um ataque corpo a corpo. Você tenta derrubar ou afastar uma criatura a até 5 pés. O alvo não pode ser mais do que uma categoria de tamanho maior que você.</p><p><strong>Disputa:</strong> Seu teste de Força (Atletismo) contra o teste de Força (Atletismo) ou Destreza (Acrobacia) do alvo.</p><p><strong>Sucesso:</strong> Você escolhe derrubar o alvo no chão (<em>Caído / Prone</em>) ou empurrá-lo 5 pés para longe.</p>",
  },
  disarm: {
    type: "disarm",
    name: "Manobra: Desarmar",
    img: "icons/skills/melee/shield-damaged-broken-orange.webp",
    description:
      "<p><strong>Manobra de Combate: Desarmar</strong> (D&D 5e DMG p. 271 — Regra Opcional).</p><p>Substitui um ataque corpo a corpo. Você tenta forçar o alvo a soltar um item ou arma empunhada.</p><p><strong>Disputa:</strong> Seu teste de Força (Atletismo) contra o teste de Força (Atletismo) ou Destreza (Acrobacia) do alvo.</p><p><strong>Modificadores:</strong> Desvantagem se o defensor empunhar o item com as duas mãos ou for maior que você; Vantagem se você for maior que o defensor.</p><p><strong>Sucesso:</strong> O alvo larga o item empunhado no chão.</p>",
  },
};

/**
 * Interface dos dados transmitidos no socket.
 */
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

// Armazena resolvers ativos aguardando resposta do defensor
const pendingDefenseResolvers = new Map<string, (chosenSkill: "ath" | "acr") => void>();

/**
 * Verifica se um item é uma manobra de combate do módulo.
 */
export function isManeuverItem(item: any): boolean {
  if (!item) return false;
  const flag = item.getFlag?.(MODULE_ID, MANEUVER_ITEM_FLAG);
  if (flag) return true;
  const name = item.name?.trim?.() ?? "";
  return (
    item.type === "feat" &&
    (name === "Manobra: Agarrar" ||
      name === "Manobra: Empurrar" ||
      name === "Manobra: Desarmar" ||
      name === "Maneuver: Grapple" ||
      name === "Maneuver: Shove" ||
      name === "Maneuver: Disarm")
  );
}

/**
 * Obtém o tipo da manobra a partir do item.
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
 * Garante que os 3 itens de manobras de combate estejam presentes na ficha do ator.
 * AC-001: Itens criados e sincronizados em todos os atores sem duplicação.
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
          console.warn(`${MODULE_TITLE} | Erro ao atualizar ícone da manobra ${def.name}:`, e);
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
      console.log(`${MODULE_TITLE} | Criando ${itemsToCreate.length} manobras no ator: ${actor.name}`);
      await actor.createEmbeddedDocuments("Item", itemsToCreate);
    } catch (err) {
      console.error(`${MODULE_TITLE} | Erro ao criar itens de manobras em ${actor.name}:`, err);
    }
  }
}

/**
 * Sincroniza as manobras em todos os atores do mundo e tokens da cena ativa.
 */
export async function syncManeuversOnAllActors(): Promise<void> {
  if (!(game.user as any)?.isGM) return;

  console.log(`${MODULE_TITLE} | [Manobras] Sincronizando manobras em todos os atores...`);
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

/**
 * Localiza o token associado a um ator na cena ativa.
 */
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

/**
 * Extrai os limites da grade de um token para cálculos matemáticos puros.
 */
function getTokenBounds(token: any): TokenBounds {
  const doc = token.document ?? token;
  const gridSize = (canvas as any)?.grid?.size || 100;
  return {
    x: doc.x,
    y: doc.y,
    width: doc.width ?? 1,
    height: doc.height ?? 1,
  };
}

/**
 * Normaliza o valor de tamanho de criatura para o enum CreatureSize.
 */
function normalizeCreatureSize(size: string | undefined): CreatureSize {
  const s = (size || "med").toLowerCase();
  switch (s) {
    case "tiny":
    case "miudo":
    case "miúdo":
      return "tiny";
    case "sm":
    case "small":
    case "pequeno":
      return "small";
    case "lg":
    case "large":
    case "grande":
      return "large";
    case "huge":
    case "enorme":
      return "huge";
    case "grg":
    case "gargantuan":
    case "imenso":
      return "gargantuan";
    case "med":
    case "medium":
    case "medio":
    case "médio":
    default:
      return "medium";
  }
}

/**
 * Abre o diálogo de seleção de visibilidade para o atacante.
 * AC-004: Pré-configurado com o modo atualmente ativo no chat.
 */
async function promptVisibilityDialog(maneuverName: string, targetName: string): Promise<string | null> {
  const currentRollMode =
    (game.settings as any)?.get?.("core", "rollMode") ||
    (ui as any)?.chat?.rollMode ||
    "publicroll";

  return new Promise((resolve) => {
    const content = `
      <form class="et-maneuver-visibility-form" style="padding: 6px 0;">
        <p style="margin-bottom: 10px;">Executar <strong>${maneuverName}</strong> contra <strong>${targetName}</strong>.</p>
        <div class="form-group" style="margin-bottom: 12px;">
          <label style="display:block;margin-bottom:4px;font-weight:bold;">Modo de Visibilidade da Disputa:</label>
          <select name="rollMode" style="width:100%;height:32px;">
            <option value="publicroll" ${currentRollMode === "publicroll" ? "selected" : ""}>Rolagem Pública</option>
            <option value="gmroll" ${currentRollMode === "gmroll" ? "selected" : ""}>Rolagem para o Mestre (GM Roll)</option>
            <option value="blindroll" ${currentRollMode === "blindroll" ? "selected" : ""}>Rolagem às Cegas (Blind Roll)</option>
            <option value="selfroll" ${currentRollMode === "selfroll" ? "selected" : ""}>Apenas para Você (Self Roll)</option>
          </select>
        </div>
      </form>
    `;

    new (Dialog as any)({
      title: `${maneuverName} — Configuração de Rolagem`,
      content,
      buttons: {
        confirm: {
          icon: '<i class="fas fa-dice-d20"></i>',
          label: "Iniciar Disputa",
          callback: (html: any) => {
            const form = html.find("select[name='rollMode']");
            resolve(form.val() || currentRollMode);
          },
        },
        cancel: {
          icon: '<i class="fas fa-times"></i>',
          label: "Cancelar",
          callback: () => resolve(null),
        },
      },
      default: "confirm",
      close: () => resolve(null),
    }).render(true);
  });
}

/**
 * Exibe a janela de escolha da perícia de defesa para o jogador dono do alvo.
 * AC-005: Atletismo vs Acrobacia com bônus e timeout de 30s com fallback automático.
 */
async function showDefenseSelectionDialog(
  maneuverName: string,
  attackerName: string,
  targetActor: any
): Promise<"ath" | "acr"> {
  const athMod = targetActor.system?.skills?.ath?.total ?? targetActor.system?.skills?.ath?.mod ?? 0;
  const acrMod = targetActor.system?.skills?.acr?.total ?? targetActor.system?.skills?.acr?.mod ?? 0;

  const athSign = athMod >= 0 ? `+${athMod}` : `${athMod}`;
  const acrSign = acrMod >= 0 ? `+${acrMod}` : `${acrMod}`;

  const defaultSkill: "ath" | "acr" = acrMod > athMod ? "acr" : "ath";

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

    const content = `
      <div style="text-align:center;padding:8px 0;">
        <p style="font-size:1.1em;margin-bottom:8px;">
          <strong>${attackerName}</strong> está tentando usar <strong>${maneuverName}</strong> contra você!
        </p>
        <p style="color:#777;margin-bottom:12px;">Escolha como você deseja resistir à manobra:</p>
        <div id="et-defense-timer" style="font-size:0.9em;color:#e67e22;font-weight:bold;margin-bottom:8px;">
          Tempo restante: <span id="et-seconds">${secondsLeft}</span>s (fallback: ${defaultSkill === "acr" ? "Acrobacia" : "Atletismo"})
        </div>
      </div>
    `;

    const dialog = new (Dialog as any)({
      title: `Defesa — ${maneuverName}`,
      content,
      buttons: {
        athletics: {
          icon: '<i class="fas fa-fist-raised"></i>',
          label: `Atletismo (Força) [${athSign}]`,
          callback: () => safeResolve("ath"),
        },
        acrobatics: {
          icon: '<i class="fas fa-running"></i>',
          label: `Acrobacia (Destreza) [${acrSign}]`,
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

/**
 * Solicita a escolha de defesa ao proprietário do alvo (localmente ou via socket).
 */
async function requestDefenseSkill(
  maneuverId: string,
  maneuverType: ManeuverType,
  attackerName: string,
  targetToken: any
): Promise<"ath" | "acr"> {
  const targetActor = targetToken.actor;
  const isOwnerLocal = targetActor?.isOwner;

  // Se o usuário local já é o dono do alvo (ou se não há socket), abre direto
  if (isOwnerLocal) {
    const def = MANEUVER_DEFINITIONS[maneuverType];
    return await showDefenseSelectionDialog(def.name, attackerName, targetActor);
  }

  // Encontra usuário ativo dono do alvo
  const activeUsers = (game.users as any)?.filter((u: any) => u.active) || [];
  const targetOwner = activeUsers.find((u: any) => targetActor.testUserPermission(u, "OWNER") && !u.isGM) ||
    activeUsers.find((u: any) => u.isGM);

  const athMod = targetActor.system?.skills?.ath?.total ?? targetActor.system?.skills?.ath?.mod ?? 0;
  const acrMod = targetActor.system?.skills?.acr?.total ?? targetActor.system?.skills?.acr?.mod ?? 0;
  const defaultSkill: "ath" | "acr" = acrMod > athMod ? "acr" : "ath";

  if (!targetOwner) {
    return defaultSkill;
  }

  return new Promise((resolve) => {
    // Timeout local de segurança
    const timeoutHandle = setTimeout(() => {
      pendingDefenseResolvers.delete(maneuverId);
      resolve(defaultSkill);
    }, DEFENSE_TIMEOUT_MS + 2000);

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

/**
 * Executa os efeitos audiovisuais da manobra via Sequencer (se ativado).
 * AC-010: Reversibilidade em configurações.
 */
async function playManeuverEffects(
  maneuverType: ManeuverType,
  attackerToken: any,
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
        .file("modules/animated-spell-effects-cartoon/spell-effects/cartoon/air/air_puff_CIRCLE_01.webm")
        .atLocation(targetToken)
        .scaleToObject(1.5)
        .duration(800);
    } else if (maneuverType === "shove") {
      sequence
        .effect()
        .file("modules/animated-spell-effects-cartoon/spell-effects/cartoon/air/air_explosion_800x800.webm")
        .atLocation(targetToken)
        .scaleToObject(1.8)
        .duration(600);
      sequence.canvasPan().shake({
        duration: 300,
        strength: 5,
        rotation: false,
      });
    } else if (maneuverType === "disarm") {
      sequence
        .sound()
        .file("modules/dnd5e-animations/assets/sounds/Weapons/Melee_Bludgeoning/bludgeoning-swing-impact-blunt-1.mp3")
        .volume(0.8);
    }

    await sequence.play();
  } catch (err) {
    console.warn(`${MODULE_TITLE} | Erro ao tocar Sequencer da manobra:`, err);
  }
}

/**
 * Executa a escolha de efeito do Empurrar (Derrubar vs Empurrar 5ft).
 * AC-008: Escolha de efeito com detecção de colisão contra paredes.
 */
async function executeShoveOutcome(
  attackerToken: any,
  targetToken: any,
  attackerName: string,
  targetName: string
): Promise<void> {
  return new Promise((resolve) => {
    new (Dialog as any)({
      title: "Manobra: Empurrar — Escolha o Efeito",
      content: `
        <div style="padding: 8px 0;">
          <p>Você venceu a disputa contra <strong>${targetName}</strong>!</p>
          <p>Escolha o resultado da manobra:</p>
        </div>
      `,
      buttons: {
        prone: {
          icon: '<i class="fas fa-bed"></i>',
          label: "Derrubar Caído (Prone)",
          callback: async () => {
            await applyConditionToActor(targetToken.actor, "prone", "Prone");
            await ChatMessage.create({
              speaker: ChatMessage.getSpeaker({ token: attackerToken }),
              content: `<div class="et-maneuver-card">
                <h3>🛡️ Empurrar Bem-Sucedido!</h3>
                <p><strong>${attackerName}</strong> derrubou <strong>${targetName}</strong> no chão (condição <em>Caído / Prone</em> aplicada)!</p>
              </div>`,
            });
            resolve();
          },
        },
        push: {
          icon: '<i class="fas fa-arrow-right"></i>',
          label: "Empurrar 5 Pés",
          callback: async () => {
            const gridSize = (canvas as any)?.grid?.size || 100;
            const feetPerGrid = (canvas as any)?.grid?.distance || 5;

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

            // Verifica colisão com paredes usando Ray
            let hasCollision = false;
            try {
              if (typeof (Ray as any) !== "undefined" && (canvas as any)?.walls?.checkCollision) {
                const ray = new (Ray as any)(targetCenter, destCenter);
                hasCollision = (canvas as any).walls.checkCollision(ray, { type: "move", mode: "any" });
              }
            } catch (err) {
              console.warn(`${MODULE_TITLE} | Erro ao verificar colisão de paredes:`, err);
            }

            if (hasCollision) {
              (ui as any).notifications?.warn(
                `${targetName} colidiu com um obstáculo e não pôde ser empurrado completamente.`
              );
              await ChatMessage.create({
                speaker: ChatMessage.getSpeaker({ token: attackerToken }),
                content: `<div class="et-maneuver-card">
                  <h3>🛡️ Empurrar — Obstáculo Encontrado!</h3>
                  <p><strong>${attackerName}</strong> empurrou <strong>${targetName}</strong>, mas o alvo colidiu contra uma parede/obstáculo!</p>
                </div>`,
              });
            } else {
              const targetDocX = destCenter.x - (targetToken.document.width * gridSize) / 2;
              const targetDocY = destCenter.y - (targetToken.document.height * gridSize) / 2;

              try {
                await targetToken.document.update({ x: targetDocX, y: targetDocY });
              } catch (moveErr) {
                console.error(`${MODULE_TITLE} | Erro ao deslocar token:`, moveErr);
              }

              await ChatMessage.create({
                speaker: ChatMessage.getSpeaker({ token: attackerToken }),
                content: `<div class="et-maneuver-card">
                  <h3>🛡️ Empurrar Bem-Sucedido!</h3>
                  <p><strong>${attackerName}</strong> empurrou <strong>${targetName}</strong> 5 pés para longe!</p>
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
 * Aplica uma condição a um ator via DFreds Convenient Effects ou status effect nativo do Foundry.
 */
async function applyConditionToActor(actor: any, coreStatusId: string, dfredsName: string): Promise<void> {
  const dfreds = (game as any)?.dfreds?.effectInterface;
  if (dfreds) {
    try {
      const hasEffect = await dfreds.hasEffect({ effectName: dfredsName, uuid: actor.uuid });
      if (!hasEffect) {
        await dfreds.addEffect({ effectName: dfredsName, uuid: actor.uuid });
        return;
      }
    } catch (err) {
      console.warn(`${MODULE_TITLE} | DFreds falhou ao aplicar ${dfredsName}, usando fallback nativo:`, err);
    }
  }

  // Fallback para status effect nativo
  try {
    if (actor.toggleStatusEffect) {
      await actor.toggleStatusEffect(coreStatusId, { active: true });
    }
  } catch (err) {
    console.error(`${MODULE_TITLE} | Erro ao aplicar status ${coreStatusId}:`, err);
  }
}

/**
 * Executa o fluxo completo da manobra de combate quando um item é ativado.
 */
export async function executeManeuverWorkflow(item: any, actor: any): Promise<boolean> {
  const maneuverType = getManeuverTypeFromItem(item);
  if (!maneuverType) return true;

  const maneuverDef = MANEUVER_DEFINITIONS[maneuverType];
  console.log(`${MODULE_TITLE} | [Manobras] Iniciando fluxo de ${maneuverDef.name} para ${actor.name}`);

  // 1. Validação de Alvo
  const targets = Array.from((game.user as any)?.targets || []);
  if (targets.length !== 1) {
    (ui as any).notifications?.warn(
      `Selecione exatamente 1 alvo no canvas para realizar ${maneuverDef.name}.`
    );
    return false;
  }

  const targetToken: any = targets[0];
  const targetActor: any = targetToken.actor;

  if (!targetActor) {
    (ui as any).notifications?.warn("O alvo selecionado não possui uma ficha de ator válida.");
    return false;
  }

  const attackerToken = resolveActorToken(actor);
  if (!attackerToken) {
    (ui as any).notifications?.warn("Não foi possível encontrar o token do atacante na cena.");
    return false;
  }

  // 2. Validação de Regras de Alcance e Tamanho (D&D 5e)
  const gridSize = (canvas as any)?.grid?.size || 100;
  const feetPerGrid = (canvas as any)?.grid?.distance || 5;

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

  // 3. Seletor de Visibilidade do Atacante (AC-004)
  const selectedRollMode = await promptVisibilityDialog(maneuverDef.name, targetToken.name);
  if (!selectedRollMode) {
    console.log(`${MODULE_TITLE} | [Manobras] Usuário cancelou a manobra.`);
    return false;
  }

  // 4. Solicitação da Perícia do Defensor (AC-005)
  const maneuverId = foundry.utils.randomID();
  const chosenSkill = await requestDefenseSkill(
    maneuverId,
    maneuverType,
    actor.name,
    targetToken
  );

  console.log(`${MODULE_TITLE} | [Manobras] Defensor escolheu ${chosenSkill === "acr" ? "Acrobacia" : "Atletismo"}`);

  // 5. Execução da Disputa via Epic Rolls 5e (ou Fallback nativo) (AC-006)
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
      console.warn(`${MODULE_TITLE} | Epic Rolls falhou, executando fallback nativo:`, epicErr);
      const attRoll = await actor.rollSkill({ skill: "ath" }, { configure: false }, { rollMode: selectedRollMode });
      const defRoll = await targetActor.rollSkill({ skill: chosenSkill }, { configure: false }, { rollMode: selectedRollMode });
      attackerTotal = attRoll.total;
      defenderTotal = defRoll.total;
    }
  } else {
    // Fallback nativo D&D 5e
    const attRoll = await actor.rollSkill({ skill: "ath" }, { configure: false }, { rollMode: selectedRollMode });
    const defRoll = await targetActor.rollSkill({ skill: chosenSkill }, { configure: false }, { rollMode: selectedRollMode });
    attackerTotal = attRoll.total;
    defenderTotal = defRoll.total;
  }

  // 6. Resolução do Vencedor (Empate favorece o defensor)
  const winner = determineContestWinner(attackerTotal, defenderTotal);
  console.log(`${MODULE_TITLE} | [Manobras] Resultado: Atacante ${attackerTotal} vs Defensor ${defenderTotal} => Vencedor: ${winner}`);

  if (winner === "defender") {
    await ChatMessage.create({
      speaker: ChatMessage.getSpeaker({ token: targetToken }),
      content: `<div class="et-maneuver-card">
        <h3>🛡️ Manobra Resistida!</h3>
        <p><strong>${targetToken.name}</strong> resistiu com sucesso à tentativa de <strong>${maneuverDef.name}</strong> de <strong>${actor.name}</strong>!</p>
        <p><em>(Resultado: Defesa ${defenderTotal} vs Ataque ${attackerTotal} — empate mantém o status quo).</em></p>
      </div>`,
    });
    return false;
  }

  // 7. Sucesso do Atacante: Aplicação dos Efeitos Específicos
  await playManeuverEffects(maneuverType, attackerToken, targetToken);

  if (maneuverType === "grapple") {
    // AC-007: Condição Agarrado aplicada
    await applyConditionToActor(targetActor, "grappled", "Grappled");
    await ChatMessage.create({
      speaker: ChatMessage.getSpeaker({ token: attackerToken }),
      content: `<div class="et-maneuver-card">
        <h3>✊ Agarrar Bem-Sucedido!</h3>
        <p><strong>${actor.name}</strong> agarrou <strong>${targetToken.name}</strong> com sucesso!</p>
        <p>O alvo está com a condição <strong>Agarrado (Grappled)</strong> (deslocamento reduzido a 0).</p>
      </div>`,
    });
  } else if (maneuverType === "shove") {
    // AC-008: Escolha entre Caído ou Empurrão 5ft
    await executeShoveOutcome(attackerToken, targetToken, actor.name, targetToken.name);
  } else if (maneuverType === "disarm") {
    // AC-009: Notificação de Desarmar SEM alteração destrutiva de inventário (HITL)
    const equippedWeapon = targetActor.items?.find((i: any) => i.type === "weapon" && i.system?.equipped);
    const weaponName = equippedWeapon?.name ?? "sua arma";

    await ChatMessage.create({
      speaker: ChatMessage.getSpeaker({ token: attackerToken }),
      content: `
        <div class="et-maneuver-card" style="border-left: 4px solid #f39c12; padding: 8px 12px; background: rgba(0,0,0,0.3);">
          <h3 style="margin-top:0; color:#f1c40f;">🗡️ Desarme Bem-Sucedido!</h3>
          <p><strong>${actor.name}</strong> conseguiu desarmar <strong>${targetToken.name}</strong>!</p>
          <p style="color:#e67e22; font-weight:bold; font-size:1.05em;">A arma empunhada (${weaponName}) caiu no chão aos pés do alvo!</p>
          <p style="font-size:0.85em; color:#bbb; margin-bottom:0;">
            <em>(Salvaguarda HITL: Por segurança, a arma não foi excluída da ficha; o Mestre e os jogadores devem considerar o alvo desarmado).</em>
          </p>
        </div>
      `,
    });
  }

  return false;
}

/**
 * Alterna a configuração de efeitos audiovisuais de manobras.
 * P-004: Reversibilidade em configurações.
 */
export function toggleManeuverEffects(): boolean {
  const current = (game.settings as any)?.get(MODULE_ID, SETTING_MANEUVER_EFFECTS) ?? true;
  const next = !current;
  (game.settings as any)?.set(MODULE_ID, SETTING_MANEUVER_EFFECTS, next);
  console.log(`${MODULE_TITLE} | Efeitos audiovisuais de manobras: ${next ? "ATIVADOS" : "DESATIVADOS"}`);
  return next;
}

/**
 * Registra listeners de socket para coordenar a escolha do defensor entre clientes.
 */
function registerSocketListeners(): void {
  (game.socket as any)?.on(`module.${MODULE_ID}`, async (data: ManeuverSocketPayload) => {
    if (!data || !data.action) return;

    if (data.action === SOCKET_ACTION_DEFENSE_PROMPT) {
      // Verifica se este cliente é o dono do token alvo
      const targetActor: any = data.targetActorUuid ? fromUuidSync(data.targetActorUuid) : null;
      if (!targetActor || !targetActor.isOwner) return;

      // Se for o GM e houver jogadores donos ativos do personagem, deixe o jogador responder
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
        data.attackerName || "Atacante",
        targetActor
      );

      // Responde de volta via socket
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
 * Registra a funcionalidade de manobras de combate no ciclo de vida do Foundry VTT.
 * Chamado durante o hook 'init'.
 */
export function registerCombatManeuvers(): void {
  console.log(`${MODULE_TITLE} | Registrando automação de Manobras de Combate`);

  // Registra setting de efeitos audiovisuais
  (game.settings as any).register(MODULE_ID, SETTING_MANEUVER_EFFECTS, {
    name: "Efeitos Audiovisuais de Manobras",
    hint: "Ativa animações visuais do Sequencer e efeitos sonoros ao concluir manobras de combate com sucesso.",
    scope: "client",
    config: true,
    type: Boolean,
    default: true,
  });

  registerSocketListeners();

  // Sincroniza itens no 'ready'
  Hooks.once("ready", async () => {
    await syncManeuversOnAllActors();
  });

  // Em mudanças de cena ou novos placeables
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

  // Garante que a ficha ao renderizar possua os itens
  (Hooks as any).on("renderApplication", async (app: any) => {
    const actor = app.document?.documentName === "Actor" ? app.document : (app.actor ?? null);
    if (actor && actor.isOwner) {
      await ensureManeuverItemsOnActor(actor);
    }
  });

  const sheetHooks = [
    "renderActorSheet",
    "dnd5e.renderActorSheet",
    "renderActorSheet5e2",
    "renderNPCSheet2",
    "renderCharacterSheet2",
    "renderActorSheetV2",
  ];

  for (const hookName of sheetHooks) {
    (Hooks as any).on(hookName, async (app: any, _html: any, data: any) => {
      const actor = app.document ?? app.actor ?? data?.actor ?? data?.document ?? null;
      if (actor && actor.isOwner) {
        await ensureManeuverItemsOnActor(actor);
      }
    });
  }

  // Intercepta uso de item em D&D 5e (v3 & v4/v5 sheets)
  (Hooks as any).on("dnd5e.preUseItem", (item: any) => {
    if (isManeuverItem(item)) {
      console.log(`${MODULE_TITLE} | [Manobras] Interceptado dnd5e.preUseItem`);
      executeManeuverWorkflow(item, item.actor);
      return false;
    }
  });

  (Hooks as any).on("dnd5e.preUseActivity", (activity: any) => {
    if (isManeuverItem(activity?.item)) {
      console.log(`${MODULE_TITLE} | [Manobras] Interceptado dnd5e.preUseActivity`);
      executeManeuverWorkflow(activity.item, activity.item.actor);
      return false;
    }
  });

  (Hooks as any).on("midi-qol.preItemRoll", (workflow: any) => {
    if (isManeuverItem(workflow?.item)) {
      console.log(`${MODULE_TITLE} | [Manobras] Interceptado midi-qol.preItemRoll`);
      executeManeuverWorkflow(workflow.item, workflow.item.actor);
      return false;
    }
  });
}
