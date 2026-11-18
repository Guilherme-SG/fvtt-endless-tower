import { MODULE_TITLE } from "../../constants";
import { UI_TEXT } from "./config";
import { isAttackRollCriticalOrFumble, type AttackRollOutcome } from "./rules";

export { isAttackRollCriticalOrFumble, type AttackRollOutcome };

/**
 * Enhances Foundry chat messages with critical attack badges, private whisper seals,
 * and contrast fixes while preserving third-party modules like simraki-character-monitor.
 */
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
    console.log(`${MODULE_TITLE} | Design System ChatEnhancer initialized.`);
  }

  private registerHooks(): void {
    Hooks.on("renderChatMessage", (message: any, html: any) => {
      this.enhanceChatMessage(message, html);
    });
  }

  /**
   * Applies visual enhancements and rune badges to each rendered chat message element.
   */
  private enhanceChatMessage(message: any, html: any): void {
    const el: HTMLElement =
      typeof HTMLElement !== "undefined" && html instanceof HTMLElement ? html : html?.[0] ?? html;
    if (!el) return;

    // Preserve simraki-character-monitor cards untouched
    if (
      message?.flags?.["simraki-character-monitor"] ||
      el.classList?.contains("cm-msg") ||
      el.querySelector?.(".cm-line, .cm-spoiler")
    ) {
      el.classList?.add("cm-msg");
      return;
    }

    // Remove inline player color overrides on sender name to prevent low-contrast backgrounds
    const sender = el.querySelector(".message-sender") as HTMLElement | null;
    if (sender) {
      sender.style.removeProperty("background-color");
      sender.style.removeProperty("background");
      sender.style.removeProperty("color");
      sender.style.removeProperty("text-shadow");
    }

    // Detect critical hit or fumble strictly on attack rolls
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
          ? `<span class="et-rune-sparkle">✦</span> ${UI_TEXT.chatCriticalBadge} <span class="et-rune-sparkle">✦</span>`
          : `<span class="et-rune-sparkle">✧</span> ${UI_TEXT.chatFumbleBadge} <span class="et-rune-sparkle">✧</span>`;

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

    // Insert non-public visibility seal before header without breaking flexrow
    if ((message.whisper && message.whisper.length > 0) || message.blind) {
      el.classList.add("et-chat-whisper");
      if (!el.querySelector(".et-whisper-banner")) {
        const authorId = message.author?.id ?? message.user?.id ?? message.user;
        const isBlind = Boolean(message.blind);
        const isSelf = !isBlind && message.whisper?.length === 1 && message.whisper[0] === authorId;
        const visibilityIcon = isBlind ? "fa-eye-slash" : isSelf ? "fa-user" : "fa-user-secret";

        const whisperSeal = document.createElement("div");
        whisperSeal.className = "et-whisper-banner";
        whisperSeal.innerHTML = `<i class="fas ${visibilityIcon}"></i> ${UI_TEXT.chatWhisperBadge}`;
        el.insertBefore(whisperSeal, el.firstChild);
      }
    }
  }
}
