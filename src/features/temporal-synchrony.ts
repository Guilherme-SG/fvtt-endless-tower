/**
 * Sincronia Temporal — Bênção "No Lugar Certo, Na Hora Certa"
 *
 * Quando o portador realiza uma reação válida pelas regras do jogo (Opportunity Attack, Shield, etc.),
 * um popup interativo pergunta ao dono do personagem se deseja canalizar a Sincronia Temporal
 * para conceder Vantagem no próximo ataque ou teste de habilidade de uma criatura a até 30 ft.
 */

import { MODULE_ID, MODULE_TITLE } from "../constants";
import { getDistanceInFeet } from "./solitude";

declare const Sequence: any;

const BLESSING_ITEM_NAME = "No Lugar Certo, Na Hora Certa";
const BLESSING_COMPENDIUM_ID = "2HJTHlWHvEvSHNrk";
const EFFECT_NAME = "Sincronia Temporal (Vantagem)";
const EFFECT_ICON = "icons/magic/time/clock-stopwatch-hourglass-blue.webp";
const MAX_RANGE_FEET = 30;

const SOCKET_ACTION_PROMPT = "TEMPORAL_SYNCHRONY_PROMPT";
const SOCKET_ACTION_APPLY = "TEMPORAL_SYNCHRONY_APPLY";

// Debounce para evitar múltiplos popups na mesma reação (ex: hooks concorrentes de Midi-QOL e dnd5e)
const lastPromptTimestamps = new Map<string, number>();

/**
 * Localiza o item da bênção no ator.
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
 * Retorna o número máximo e atual de usos de Sincronia Temporal para o ator.
 */
export function getTemporalSynchronyUses(actor: any, item?: any): { current: number; max: number } {
  const blessItem = item ?? getTemporalSynchronyItem(actor);
  const max = Number(actor.system?.attributes?.prof) || 2;

  if (!blessItem) return { current: 0, max };

  // Se o item tiver 'uses' estruturado no dnd5e
  if (blessItem.system?.uses?.max) {
    const val = blessItem.system.uses.value;
    return {
      current: val !== null && val !== undefined ? Number(val) : max,
      max: Number(blessItem.system.uses.max) || max,
    };
  }

  // Fallback para controle via flags do módulo
  const flagUses = blessItem.getFlag?.(MODULE_ID, "temporalUses");
  const current = flagUses !== undefined && flagUses !== null ? Number(flagUses) : max;
  return { current, max };
}

/**
 * Deduz 1 uso da bênção.
 */
export async function consumeTemporalSynchronyUse(actor: any, item?: any): Promise<number> {
  const blessItem = item ?? getTemporalSynchronyItem(actor);
  if (!blessItem) return 0;

  const { current, max } = getTemporalSynchronyUses(actor, blessItem);
  const newCurrent = Math.max(0, current - 1);

  if (blessItem.system?.uses?.max) {
    await blessItem.update({ "system.uses.value": newCurrent });
  } else {
    await blessItem.setFlag(MODULE_ID, "temporalUses", newCurrent);
  }

  return newCurrent;
}

/**
 * Recupera todos os usos (chamado no Long Rest).
 */
export async function recoverTemporalSynchronyUses(actor: any): Promise<void> {
  const blessItem = getTemporalSynchronyItem(actor);
  if (!blessItem) return;

  const max = Number(actor.system?.attributes?.prof) || 2;
  if (blessItem.system?.uses?.max) {
    await blessItem.update({ "system.uses.value": max });
  } else {
    await blessItem.setFlag(MODULE_ID, "temporalUses", max);
  }
}

/**
 * Retorna todas as criaturas válidas e visíveis a até 30 ft do portador.
 */
export function getValidTargetsInRange(sourceToken: any): Array<{ token: any; name: string; distance: number }> {
  if (!canvas.scene?.tokens || !sourceToken) return [];

  const sourceBounds = {
    x: sourceToken.x,
    y: sourceToken.y,
    width: sourceToken.document?.width ?? sourceToken.width ?? 1,
    height: sourceToken.document?.height ?? sourceToken.height ?? 1,
  };

  const results: Array<{ token: any; name: string; distance: number }> = [];

  for (const other of canvas.scene.tokens) {
    // Não pode ser o próprio portador
    if (other.id === sourceToken.id || other.actorId === sourceToken.actorId) continue;
    if (!other.actor) continue;

    // Criatura deve estar viva/consciente
    const hp = other.actor.system?.attributes?.hp?.value ?? 0;
    if (hp <= 0) continue;

    const otherBounds = {
      x: other.x,
      y: other.y,
      width: other.width ?? 1,
      height: other.height ?? 1,
    };

    const dist = getDistanceInFeet(sourceBounds, otherBounds, sourceToken, other);
    if (dist <= MAX_RANGE_FEET + 0.1) {
      results.push({
        token: other,
        name: other.name,
        distance: Math.round(dist),
      });
    }
  }

  // Ordena pelas criaturas mais próximas
  return results.sort((a, b) => a.distance - b.distance);
}

/**
 * Aplica o efeito ativo de Vantagem no alvo.
 */
export async function applyTemporalAdvantageEffect(targetActor: any, sourceActor: any): Promise<void> {
  if (!targetActor) return;

  // Remove qualquer efeito anterior de Sincronia Temporal para renovar
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
    changes: [
      {
        key: "flags.midi-qol.advantage.attack.all",
        mode: 5, // OVERRIDE
        value: "1",
        priority: 20,
      },
      {
        key: "flags.midi-qol.advantage.ability.all",
        mode: 5,
        value: "1",
        priority: 20,
      },
    ],
    flags: {
      [MODULE_ID]: {
        isTemporalSynchrony: true,
        sourceActorUuid: sourceActor?.uuid,
        targetCombatantId: game.combat?.combatants.find((c: any) => c.actor === targetActor)?.id,
      },
      dae: {
        specialDuration: ["1Attack:all", "1Check:all", "turnEnd"],
      },
    },
    description: `
      <p><strong>Sincronia Temporal</strong></p>
      <p>Concedido por <em>${sourceActor?.name ?? "um aliado"}</em> em resposta a uma reação temporal.</p>
      <p>Vantagem na próxima jogada de ataque ou teste de habilidade até o fim do seu próximo turno.</p>
    `,
  };

  await targetActor.createEmbeddedDocuments("ActiveEffect", [effectData]);
}

/**
 * Dispara animação visual e áudio entre o portador e o alvo.
 */
function playTemporalVFX(sourceToken: any, targetToken: any): void {
  if (typeof Sequence === "undefined") return;

  try {
    new Sequence()
      .effect()
      .file("jb2a.energy_strands.complete.blue")
      .atLocation(sourceToken)
      .stretchTo(targetToken)
      .playbackRate(1.2)
      .effect()
      .file("jb2a.magic_signs.circle.02.divination.intro.blue")
      .atLocation(targetToken)
      .scaleToObject(1.4)
      .duration(2000)
      .fadeOut(500)
      .play();
  } catch {
    // Sequencer falhou suavemente
  }
}

/**
 * Publica um chat card elegante notificando a mesa.
 */
async function postTemporalChatCard(sourceActor: any, targetName: string, remainingUses: number, maxUses: number): Promise<void> {
  const content = `
    <div class="dnd5e chat-card" style="border: 1px solid rgba(217, 184, 101, 0.4); border-radius: 6px; padding: 10px; background: rgba(16, 12, 11, 0.85); color: #fff8e6;">
      <header class="card-header flexrow" style="display: flex; align-items: center; gap: 8px; border-bottom: 1px solid rgba(217, 184, 101, 0.3); padding-bottom: 6px; margin-bottom: 8px;">
        <img src="${EFFECT_ICON}" title="Sincronia Temporal" width="36" height="36" style="border-radius: 4px; border: 1px solid #d9b865;" />
        <div>
          <h3 style="margin: 0; font-family: 'Signika', 'Modesto Condensed', serif; font-size: 1.15rem; color: #fff8e6; text-transform: uppercase; letter-spacing: 0.08em;">Sincronia Temporal</h3>
          <span style="font-size: 0.8rem; color: #f3e2b0; font-style: italic;">No Lugar Certo, Na Hora Certa</span>
        </div>
      </header>
      <div class="card-content" style="font-size: 0.9rem; line-height: 1.4;">
        <p style="margin: 0 0 6px 0;"><strong>${sourceActor.name}</strong> entrelaçou a causalidade em resposta à sua reação!</p>
        <p style="margin: 0; color: #d9d9d9;">✨ <strong>${targetName}</strong> recebe <strong>Vantagem</strong> na sua próxima jogada de ataque ou teste de habilidade (até o final do próximo turno).</p>
      </div>
      <footer class="card-footer" style="margin-top: 8px; pt-2; border-top: 1px solid rgba(255, 255, 255, 0.1); font-size: 0.75rem; color: #a0a0a0; text-align: right;">
        Usos restantes: <strong>${remainingUses} / ${maxUses}</strong>
      </footer>
    </div>
  `;

  await ChatMessage.create({
    speaker: ChatMessage.getSpeaker({ actor: sourceActor }),
    content,
    flags: { [MODULE_ID]: { isTemporalSyncCard: true } },
  });
}

/**
 * Exibe o diálogo interativo de confirmação e seleção de alvo para o dono do personagem.
 */
export async function promptTemporalSynchrony(actor: any): Promise<void> {
  if (!actor) return;

  const blessItem = getTemporalSynchronyItem(actor);
  if (!blessItem) return;

  const { current, max } = getTemporalSynchronyUses(actor, blessItem);
  if (current <= 0) return; // Sem usos disponíveis

  const tokenDoc = actor.token ?? actor.getActiveTokens(false, true)[0];
  if (!tokenDoc) return;

  const validTargets = getValidTargetsInRange(tokenDoc);
  if (validTargets.length === 0) {
    ui.notifications?.info(`Sincronia Temporal: Nenhuma criatura consciente encontrada em até ${MAX_RANGE_FEET} ft de ${actor.name}.`);
    return;
  }

  // Opções para o select
  const optionsHtml = validTargets
    .map(
      (t) =>
        `<option value="${t.token.id}">${t.name} (${t.distance} ft)</option>`
    )
    .join("");

  const content = `
    <div style="font-family: 'Signika', 'Palatino', serif; line-height: 1.45;">
      <p style="font-size: 0.95rem; margin-bottom: 8px;">
        Você acabou de realizar uma <strong>Reação</strong>. Deseja canalizar a <strong>Sincronia Temporal</strong> para abençoar uma criatura visível?
      </p>
      <div style="background: rgba(0, 0, 0, 0.25); border-left: 3px solid #d9b865; padding: 8px 10px; margin-bottom: 12px; font-size: 0.85rem; color: #e6e6e6;">
        <p style="margin: 0;"><strong>Efeito:</strong> Concede <strong>Vantagem</strong> na próxima jogada de ataque ou teste de habilidade do alvo até o final do próximo turno dele.</p>
        <p style="margin: 4px 0 0 0; color: #f3e2b0;"><strong>Usos disponíveis:</strong> ${current} / ${max} (recupera em Descanso Longo)</p>
      </div>
      <div style="margin-bottom: 12px;">
        <label for="temporal-target-select" style="font-weight: 600; display: block; margin-bottom: 4px;">Escolha o Alvo (até 30 ft):</label>
        <select id="temporal-target-select" style="width: 100%; height: 32px; border-radius: 4px; border: 1px solid #7a7a7a;">
          ${optionsHtml}
        </select>
      </div>
    </div>
  `;

  new Dialog(
    {
      title: "Sincronia Temporal — No Lugar Certo, Na Hora Certa",
      content,
      buttons: {
        confirm: {
          icon: '<i class="fas fa-hourglass-start"></i>',
          label: "Conceder Vantagem",
          callback: async (html: any) => {
            const selectedTokenId = html.find("#temporal-target-select").val();
            const targetToken = canvas.scene.tokens.get(selectedTokenId);
            if (!targetToken?.actor) return;

            // Se o usuário atual for GM, aplica direto; senão, envia socket ao GM para contornar permissões
            if (game.user?.isGM) {
              await executeApplyEffect(actor.uuid, targetToken.actor.uuid, tokenDoc.id, targetToken.id);
            } else {
              // Deduz uso localmente se for dono
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
          label: "Não Usar",
        },
      },
      default: "confirm",
    },
    { width: 440 }
  ).render(true);
}

/**
 * Executa a aplicação do efeito no ator (geralmente executado pelo GM via socket ou localmente).
 */
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

  // Consome o uso se ainda não tiver sido consumido
  let remainingUses = remaining;
  let maxUses = max;
  if (remainingUses === undefined || maxUses === undefined) {
    const uses = getTemporalSynchronyUses(sourceActor);
    maxUses = uses.max;
    remainingUses = await consumeTemporalSynchronyUse(sourceActor);
  }

  // Aplica o efeito ativo no alvo
  await applyTemporalAdvantageEffect(targetActor, sourceActor);

  // Animação e chat
  const sourceToken = canvas.scene?.tokens.get(sourceTokenId)?.object ?? canvas.scene?.tokens.get(sourceTokenId);
  const targetToken = canvas.scene?.tokens.get(targetTokenId)?.object ?? canvas.scene?.tokens.get(targetTokenId);
  if (sourceToken && targetToken) {
    playTemporalVFX(sourceToken, targetToken);
  }

  await postTemporalChatCard(sourceActor, targetActor.name, remainingUses, maxUses);
}

/**
 * Dispara o fluxo de prompt para o dono correto do personagem.
 */
function handleReactionTrigger(actor: any): void {
  if (!actor) return;

  const item = getTemporalSynchronyItem(actor);
  if (!item) return;

  const { current } = getTemporalSynchronyUses(actor, item);
  if (current <= 0) return;

  // Debounce por ator (evita disparos duplos em menos de 2s)
  const now = Date.now();
  const lastTime = lastPromptTimestamps.get(actor.id) || 0;
  if (now - lastTime < 2000) return;
  lastPromptTimestamps.set(actor.id, now);

  // Localiza o usuário dono ativo do ator
  const activeOwners = (game.users as any)?.filter(
    (u: any) => u.active && !u.isGM && actor.testUserPermission(u, "OWNER")
  );
  const targetUser = activeOwners?.[0] ?? (game.users as any)?.activeGM ?? game.user;

  // Se o usuário atual for o destinatário do prompt, renderiza na hora
  if (game.user?.id === targetUser?.id) {
    promptTemporalSynchrony(actor);
  } else {
    // Envia socket para a máquina do jogador dono
    (game.socket as any)?.emit(`module.${MODULE_ID}`, {
      action: SOCKET_ACTION_PROMPT,
      actorUuid: actor.uuid,
      targetUserId: targetUser.id,
    });
  }
}

/**
 * Registra os ouvintes de socket para comunicação entre clientes (jogador e GM).
 */
function registerSocketListeners(): void {
  (game.socket as any)?.on(`module.${MODULE_ID}`, async (data: any) => {
    if (!data) return;

    // 1. Recebimento de requisição para abrir o popup na tela do dono
    if (data.action === SOCKET_ACTION_PROMPT && data.targetUserId === game.user?.id) {
      const actor = await fromUuid(data.actorUuid);
      if (actor) promptTemporalSynchrony(actor);
      return;
    }

    // 2. Recebimento de requisição para o GM aplicar o efeito com permissão plena
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
 * Registra os hooks para detectar reações executadas no sistema.
 */
export function registerTemporalSynchronyFeature(): void {
  console.log(`${MODULE_TITLE} | Registrando característica Sincronia Temporal (No Lugar Certo, Na Hora Certa)`);

  registerSocketListeners();

  // 1. Detecção via Midi-QOL (Opportunity Attacks e reações automáticas)
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

  // 2. Detecção nativa do dnd5e 5.x (ativação de qualquer activity do tipo reação)
  Hooks.on("dnd5e.postUseActivity", (activity: any) => {
    if (!activity?.actor) return;
    const isReaction = activity.activation?.type?.includes("reaction");
    if (isReaction) {
      handleReactionTrigger(activity.actor);
    }
  });

  // 3. Consumo da Vantagem no ataque do alvo (para garantir que só aplique no primeiro teste/ataque)
  Hooks.on("dnd5e.preRollAttack", (config: any) => {
    const actor = config?.subject?.actor ?? config?.actor;
    if (!actor) return;

    const effect = actor.effects.find((e: any) => e.name === EFFECT_NAME && !e.disabled);
    if (!effect) return;

    // Injeta vantagem na rolagem
    if (Array.isArray(config.rolls) && config.rolls[0]) {
      config.rolls[0].options = { ...(config.rolls[0].options ?? {}), advantage: true };
    }

    // Deleta o efeito após a rolagem para consumir
    effect.delete().catch(console.error);
  });

  // 4. Consumo da Vantagem em testes de habilidade ou salvaguardas
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

  // 5. Expiração no fim do turno do alvo se ainda não consumido
  Hooks.on("updateCombat", async (combat: any) => {
    if (!game.user?.isGM) return;

    const currentCombatant = combat?.combatant;
    if (!currentCombatant?.actor) return;

    // Procura se o combatente que está agindo tem o efeito e seu turno anterior acabou
    for (const combatant of combat.combatants) {
      const actor = combatant.actor;
      if (!actor) continue;

      const effect = actor.effects.find((e: any) => e.name === EFFECT_NAME);
      if (!effect) continue;

      // Se o turno do combatente dono do efeito acabou de passar
      const flagCombatantId = effect.getFlag(MODULE_ID, "targetCombatantId");
      if (flagCombatantId && flagCombatantId === combat.previous?.combatantId) {
        await effect.delete();
      }
    }
  });

  // 6. Recuperação de usos em Descanso Longo
  Hooks.on("dnd5e.restCompleted", async (actor: any, restData: any) => {
    if (restData?.longRest) {
      await recoverTemporalSynchronyUses(actor);
    }
  });
}
