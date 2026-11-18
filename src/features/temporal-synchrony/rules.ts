import {
  DEFAULT_PROFICIENCY_BONUS,
  REACTION_DEBOUNCE_MS,
  UI_TEXT,
} from "./config";

export interface TemporalUsesSummary {
  current: number;
  max: number;
}

export interface TemporalTargetOption {
  id: string;
  name: string;
  distance: number;
}

/**
 * Computes current and maximum Temporal Synchrony uses from item data or module flags.
 */
export function calculateTemporalSynchronyUses(
  proficiencyBonus: number | undefined,
  itemUses?: { value?: number | null; max?: number | null } | null,
  flagUses?: number | null
): TemporalUsesSummary {
  const max = Number(proficiencyBonus) || DEFAULT_PROFICIENCY_BONUS;

  if (itemUses?.max) {
    const val = itemUses.value;
    return {
      current: val !== null && val !== undefined ? Number(val) : max,
      max: Number(itemUses.max) || max,
    };
  }

  const current = flagUses !== undefined && flagUses !== null ? Number(flagUses) : max;
  return { current, max };
}

/**
 * Checks whether a trigger occurred within the debounce interval to avoid duplicate prompts.
 */
export function shouldDebounceTrigger(
  lastTimestamp: number,
  currentTimestamp: number,
  windowMs: number = REACTION_DEBOUNCE_MS
): boolean {
  return currentTimestamp - lastTimestamp < windowMs;
}

/**
 * Builds the ActiveEffect description HTML for Temporal Synchrony.
 */
export function buildTemporalEffectDescription(sourceName?: string): string {
  return UI_TEXT.effectDescription(sourceName || UI_TEXT.defaultSourceName);
}

/**
 * Builds the chat card HTML announcing Temporal Synchrony activation (Anti-Box-in-Box, P-011).
 */
export function buildTemporalChatCardHtml(
  sourceName: string,
  targetName: string,
  remainingUses: number,
  maxUses: number,
  iconPath: string
): string {
  return `
    <div class="et-temporal-chat-card">
      <header class="et-card-header">
        <div class="et-card-header-left">
          <img class="et-card-icon" src="${iconPath}" title="${UI_TEXT.effectTitle}" />
          <div>
            <h3 class="et-card-title">${UI_TEXT.effectTitle}</h3>
            <span class="et-card-subtitle">${UI_TEXT.blessingSubtitle}</span>
          </div>
        </div>
      </header>
      <div class="et-card-body">
        <p>${UI_TEXT.chatCardHeadline(sourceName)}</p>
        <p>${UI_TEXT.chatCardBenefit(targetName)}</p>
      </div>
      <footer class="et-card-footer">
        ${UI_TEXT.chatCardFooter(remainingUses, maxUses)}
      </footer>
    </div>
  `;
}

/**
 * Builds the interactive target selection dialog HTML for Temporal Synchrony.
 */
export function buildTemporalDialogHtml(
  targets: TemporalTargetOption[],
  currentUses: number,
  maxUses: number
): string {
  const optionsHtml = targets
    .map((t) => `<option value="${t.id}">${t.name} (${t.distance} ft)</option>`)
    .join("");

  return `
    <div class="et-dialog-body">
      <p>${UI_TEXT.dialogIntro}</p>
      <div class="et-dialog-callout">
        <p>${UI_TEXT.dialogEffectSummary}</p>
        <p>${UI_TEXT.dialogUsesAvailable(currentUses, maxUses)}</p>
      </div>
      <div class="et-dialog-form-group">
        <label class="et-label" for="temporal-target-select">${UI_TEXT.dialogTargetLabel}</label>
        <select id="temporal-target-select" class="et-select">
          ${optionsHtml}
        </select>
      </div>
    </div>
  `;
}
