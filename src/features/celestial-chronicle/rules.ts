import { type Quote } from "../../types/chronicle";
import { UI_TEXT } from "./config";

/**
 * Parses a raw quote line in the format 'Quote text — Author' or 'Quote text - Author'.
 */
export function parseQuoteText(raw: string): Quote {
  const clean = raw.replace(/<[^>]*>/g, "").trim();
  const dashMatch = clean.match(/^(.*?)\s+[—–-]\s+(.*?)$/);
  if (dashMatch) {
    return {
      text: dashMatch[1].replace(/^["'“”«»]|["'“”«»]$/g, "").trim(),
      author: dashMatch[2].trim(),
    };
  }
  return {
    text: clean.replace(/^["'“”«»]|["'“”«»]$/g, "").trim(),
    author: UI_TEXT.unknownAuthor,
  };
}

/**
 * Shuffles an array in place using Fisher-Yates.
 */
export function shuffleDeck<T>(items: T[]): T[] {
  const arr = [...items];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

/**
 * Wraps a quote string in dedicated open/close serif spans to prevent Chromium faux-italic collapse.
 */
export function formatQuoteHTML(text: string): string {
  const cleaned = text.replace(/^["“«\s]+|["”»\s]+$/g, "").trim();
  const escaped = cleaned
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
  return `<span class="et-quote-mark et-open">“</span><span class="et-quote-body">${escaped}</span><span class="et-quote-mark et-close">”</span>`;
}

/**
 * Evaluates whether a secret gift message roll hits under the configured percentage threshold.
 */
export function shouldTriggerSecretGift(
  enabled: boolean,
  chancePercent: number,
  randomFraction: number = Math.random()
): { triggered: boolean; rollPercent: number } {
  const rollPercent = randomFraction * 100;
  return {
    triggered: Boolean(enabled) && rollPercent < chancePercent,
    rollPercent,
  };
}

/**
 * Computes remaining milliseconds before a transition overlay may reveal the scene.
 */
export function calculateRemainingTransitionMs(
  minDurationSeconds: number,
  elapsedMs: number
): number {
  const minDurationMs = Math.max(1, minDurationSeconds) * 1000;
  return Math.max(0, minDurationMs - elapsedMs);
}
