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
 * Builds the chat card HTML announcing Temporal Synchrony activation.
 */
export function buildTemporalChatCardHtml(
  sourceName: string,
  targetName: string,
  remainingUses: number,
  maxUses: number,
  iconPath: string
): string {
  return `
    <div class="dnd5e chat-card" style="border: 1px solid rgba(217, 184, 101, 0.4); border-radius: 6px; padding: 10px; background: rgba(16, 12, 11, 0.85); color: #fff8e6;">
      <header class="card-header flexrow" style="display: flex; align-items: center; gap: 8px; border-bottom: 1px solid rgba(217, 184, 101, 0.3); padding-bottom: 6px; margin-bottom: 8px;">
        <img src="${iconPath}" title="${UI_TEXT.effectTitle}" width="36" height="36" style="border-radius: 4px; border: 1px solid #d9b865;" />
        <div>
          <h3 style="margin: 0; font-family: 'Signika', 'Modesto Condensed', serif; font-size: 1.15rem; color: #fff8e6; text-transform: uppercase; letter-spacing: 0.08em;">${UI_TEXT.effectTitle}</h3>
          <span style="font-size: 0.8rem; color: #f3e2b0; font-style: italic;">${UI_TEXT.blessingSubtitle}</span>
        </div>
      </header>
      <div class="card-content" style="font-size: 0.9rem; line-height: 1.4;">
        <p style="margin: 0 0 6px 0;">${UI_TEXT.chatCardHeadline(sourceName)}</p>
        <p style="margin: 0; color: #d9d9d9;">${UI_TEXT.chatCardBenefit(targetName)}</p>
      </div>
      <footer class="card-footer" style="margin-top: 8px; pt-2; border-top: 1px solid rgba(255, 255, 255, 0.1); font-size: 0.75rem; color: #a0a0a0; text-align: right;">
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
    <div style="font-family: 'Signika', 'Palatino', serif; line-height: 1.45;">
      <p style="font-size: 0.95rem; margin-bottom: 8px;">
        ${UI_TEXT.dialogIntro}
      </p>
      <div style="background: rgba(0, 0, 0, 0.25); border-left: 3px solid #d9b865; padding: 8px 10px; margin-bottom: 12px; font-size: 0.85rem; color: #e6e6e6;">
        <p style="margin: 0;">${UI_TEXT.dialogEffectSummary}</p>
        <p style="margin: 4px 0 0 0; color: #f3e2b0;">${UI_TEXT.dialogUsesAvailable(currentUses, maxUses)}</p>
      </div>
      <div style="margin-bottom: 12px;">
        <label for="temporal-target-select" style="font-weight: 600; display: block; margin-bottom: 4px;">${UI_TEXT.dialogTargetLabel}</label>
        <select id="temporal-target-select" style="width: 100%; height: 32px; border-radius: 4px; border: 1px solid #7a7a7a;">
          ${optionsHtml}
        </select>
      </div>
    </div>
  `;
}
