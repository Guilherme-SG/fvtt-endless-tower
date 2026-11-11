import { MODULE_ID, MODULE_TITLE } from "../../constants";

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
    const el: HTMLElement = html instanceof HTMLElement ? html : html[0] ?? html;
    if (!el) return;

    // 1. Detecção de Rolagem Crítica / Falha
    const rolls = message.rolls || [];
    let isCritical = false;
    let isFumble = false;

    for (const roll of rolls) {
      for (const term of roll.terms || []) {
        if (term.results && Array.isArray(term.results)) {
          for (const res of term.results) {
            if (res.result === 20 || res.critical) isCritical = true;
            if (res.result === 1 || res.fumble) isFumble = true;
          }
        }
      }
    }

    if (isCritical) {
      el.classList.add("et-chat-critical");
      if (!el.querySelector(".et-crit-badge-inserted")) {
        const badge = document.createElement("div");
        badge.className = "et-badge et-badge-gold et-crit-badge-inserted";
        badge.style.cssText = "margin: 6px auto; display: flex; justify-content: center; width: fit-content;";
        badge.innerHTML = `<span class="et-rune-sparkle">✦</span> SUCESSO CRÍTICO <span class="et-rune-sparkle">✦</span>`;
        const diceTotal = el.querySelector(".dice-total");
        if (diceTotal && diceTotal.parentElement) {
          diceTotal.parentElement.insertBefore(badge, diceTotal.nextSibling);
        }
      }
    } else if (isFumble) {
      el.classList.add("et-chat-fumble");
      if (!el.querySelector(".et-fumble-badge-inserted")) {
        const badge = document.createElement("div");
        badge.className = "et-badge et-badge-crimson et-fumble-badge-inserted";
        badge.style.cssText = "margin: 6px auto; display: flex; justify-content: center; width: fit-content;";
        badge.innerHTML = `<span class="et-rune-sparkle">✧</span> FALHA CRÍTICA <span class="et-rune-sparkle">✧</span>`;
        const diceTotal = el.querySelector(".dice-total");
        if (diceTotal && diceTotal.parentElement) {
          diceTotal.parentElement.insertBefore(badge, diceTotal.nextSibling);
        }
      }
    }

    // 2. Detecção e Estilização de Sussurro Privado (Banner no topo da mensagem, sem quebrar o flexrow do header)
    if (message.whisper && message.whisper.length > 0) {
      el.classList.add("et-chat-whisper");
      if (!el.querySelector(".et-whisper-banner")) {
        const whisperSeal = document.createElement("div");
        whisperSeal.className = "et-whisper-banner";
        whisperSeal.innerHTML = `<i class="fas fa-eye-slash"></i> ᛟ Comunicação Sigilosa`;
        el.insertBefore(whisperSeal, el.firstChild);
      }
    }
  }
}
