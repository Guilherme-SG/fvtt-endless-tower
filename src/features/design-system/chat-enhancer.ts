import { MODULE_ID, MODULE_TITLE } from "../../constants";

export interface AttackRollOutcome {
  isCritical: boolean;
  isFumble: boolean;
}

const NON_ATTACK_ROLL_TYPES = new Set([
  "damage",
  "healing",
  "save",
  "skill",
  "tool",
  "ability",
  "initiative",
  "death",
  "hitDie",
]);

function inspectD20RollTerms(roll: any): AttackRollOutcome {
  let isCritical = false;
  let isFumble = false;

  if (!roll || roll.options?.type === "damage") {
    return { isCritical, isFumble };
  }

  for (const term of roll.terms || []) {
    if (term?.faces !== 20 || !Array.isArray(term.results)) continue;

    for (const res of term.results) {
      if (res.active === false || res.discarded || res.rerolled) continue;
      if (res.critical || res.result === 20) isCritical = true;
      if (res.fumble || res.result === 1) isFumble = true;
    }
  }

  return { isCritical, isFumble };
}

/**
 * Avalia se uma mensagem de chat possui acerto ou falha crítica exclusivamente em rolagem de ATAQUE.
 * Nunca dispara para dados de dano (ex: 1d6 com resultado 1), testes de resistência, perícias ou dados descartados.
 */
export function isAttackRollCriticalOrFumble(message: any, el?: HTMLElement | null): AttackRollOutcome {
  const midiAttackEl = el?.querySelector?.(".midi-qol-attack-roll") as HTMLElement | null;
  const midiFlags = message?.flags?.["midi-qol"];

  // 1. Caso Card Midi-QoL com seção explícita de ataque
  if (midiAttackEl) {
    const attackTotalEl = midiAttackEl.querySelector(".dice-total");
    let isCritical =
      attackTotalEl?.classList?.contains("critical") ||
      attackTotalEl?.classList?.contains("high") ||
      midiFlags?.isCritical === true;
    let isFumble =
      attackTotalEl?.classList?.contains("fumble") ||
      attackTotalEl?.classList?.contains("low") ||
      midiFlags?.isFumble === true;

    if (!isCritical && !isFumble && Array.isArray(message?.rolls) && message.rolls.length > 0) {
      const firstRollOutcome = inspectD20RollTerms(message.rolls[0]);
      isCritical = firstRollOutcome.isCritical;
      isFumble = firstRollOutcome.isFumble;
    }

    return { isCritical: Boolean(isCritical), isFumble: Boolean(isFumble) };
  }

  // 2. Caso Card exclusivo de dano do Midi-QoL (sem ataque)
  if (el?.querySelector?.(".midi-qol-damage-roll")) {
    return { isCritical: false, isFumble: false };
  }

  // 3. Verifica tipo de rolagem do D&D 5e (bloqueia dano, cura, saves, skills, iniciativa, etc.)
  const rollType = message?.flags?.dnd5e?.roll?.type ?? message?.flags?.dnd5e?.activity?.type;
  if (typeof rollType === "string" && rollType !== "attack") {
    if (NON_ATTACK_ROLL_TYPES.has(rollType) || rollType.length > 0) {
      return { isCritical: false, isFumble: false };
    }
  }

  // 4. Inspeciona apenas rolagens de d20 não marcadas como dano
  let isCritical = Boolean(midiFlags?.isCritical === true);
  let isFumble = Boolean(midiFlags?.isFumble === true);

  if (!isCritical && !isFumble) {
    for (const roll of message?.rolls || []) {
      const outcome = inspectD20RollTerms(roll);
      if (outcome.isCritical) isCritical = true;
      if (outcome.isFumble) isFumble = true;
    }
  }

  return { isCritical, isFumble };
}

export class ChatEnhancer {
  private static instance: ChatEnhancer | null = null;

  private constructor() {}

  public static getInstance(): ChatEnhancer {
    if (!ChatEnhancer.instance) {
      ChatEnhancer.instance = new ChatEnhancer();
    }
    return ChatEnhancer.instance;
  }

  public init(): void {
    this.registerHooks();
    console.log(`${MODULE_TITLE} | Chat Enhancer do Design System inicializado.`);
  }

  private registerHooks(): void {
    Hooks.on("renderChatMessage", (message: any, html: any) => {
      this.enhanceChatMessage(message, html);
    });
  }

  /**
   * Aplica melhorias visuais e runas ao elemento HTML de cada mensagem de chat renderizada.
   */
  private enhanceChatMessage(message: any, html: any): void {
    const el: HTMLElement =
      typeof HTMLElement !== "undefined" && html instanceof HTMLElement ? html : html?.[0] ?? html;
    if (!el) return;

    // Preserva integralmente os cards do módulo simraki-character-monitor
    if (
      message?.flags?.["simraki-character-monitor"] ||
      el.classList?.contains("cm-msg") ||
      el.querySelector?.(".cm-line, .cm-spoiler")
    ) {
      el.classList?.add("cm-msg");
      return;
    }

    // 0. Remove estilos inline de cor de jogador aplicados ao remetente (evita fundo/texto sem contraste)
    const sender = el.querySelector(".message-sender") as HTMLElement | null;
    if (sender) {
      sender.style.removeProperty("background-color");
      sender.style.removeProperty("background");
      sender.style.removeProperty("color");
      sender.style.removeProperty("text-shadow");
    }

    // 1. Detecção de Rolagem Crítica / Falha (restrita exclusivamente à rolagem de ataque)
    const { isCritical, isFumble } = isAttackRollCriticalOrFumble(message, el);

    const midiAttackEl = el.querySelector(".midi-qol-attack-roll") as HTMLElement | null;
    const attackTotalEl = (midiAttackEl
      ? midiAttackEl.querySelector(".dice-total")
      : el.querySelector(".dice-total")) as HTMLElement | null;

    if (isCritical || isFumble) {
      el.classList.add(isCritical ? "et-chat-critical" : "et-chat-fumble");
      attackTotalEl?.classList.add(isCritical ? "et-attack-critical" : "et-attack-fumble");

      const badgeSelector = isCritical ? ".et-crit-badge-inserted" : ".et-fumble-badge-inserted";
      if (!el.querySelector(badgeSelector)) {
        const badge = document.createElement("div");
        badge.className = isCritical
          ? "et-badge et-badge-gold et-crit-badge-inserted"
          : "et-badge et-badge-crimson et-fumble-badge-inserted";
        badge.style.cssText =
          "margin: 8px auto 4px auto; display: flex; justify-content: center; width: fit-content; max-width: 100%; flex-basis: 100%;";
        badge.innerHTML = isCritical
          ? `<span class="et-rune-sparkle">✦</span> SUCESSO CRÍTICO <span class="et-rune-sparkle">✦</span>`
          : `<span class="et-rune-sparkle">✧</span> FALHA CRÍTICA <span class="et-rune-sparkle">✧</span>`;

        const rowParent = midiAttackEl?.parentElement;
        const isRowContainer =
          Boolean(rowParent) &&
          (Boolean(rowParent?.querySelector(".midi-qol-damage-roll")) ||
            rowParent?.classList?.contains("midi-qol-flex-container") ||
            rowParent?.classList?.contains("midi-qol-box"));

        if (isRowContainer && rowParent?.parentElement) {
          rowParent.parentElement.insertBefore(badge, rowParent.nextSibling);
        } else if (attackTotalEl?.parentElement) {
          attackTotalEl.parentElement.insertBefore(badge, attackTotalEl.nextSibling);
        }
      }
    }

    // 2. Detecção e Estilização de Mensagem Não-Pública (Banner no topo sem quebrar o flexrow do header)
    if ((message.whisper && message.whisper.length > 0) || message.blind) {
      el.classList.add("et-chat-whisper");
      if (!el.querySelector(".et-whisper-banner")) {
        const authorId = message.author?.id ?? message.user?.id ?? message.user;
        const isBlind = Boolean(message.blind);
        const isSelf = !isBlind && message.whisper?.length === 1 && message.whisper[0] === authorId;
        const visibilityIcon = isBlind ? "fa-eye-slash" : isSelf ? "fa-user" : "fa-user-secret";

        const whisperSeal = document.createElement("div");
        whisperSeal.className = "et-whisper-banner";
        whisperSeal.innerHTML = `<i class="fas ${visibilityIcon}"></i> Comunicação Sigilosa`;
        el.insertBefore(whisperSeal, el.firstChild);
      }
    }
  }
}
