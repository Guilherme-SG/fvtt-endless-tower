import { CRITICAL_TABLE_NAMES, UI_TEXT } from "./config";

export type MidiRollSystem = "mtb" | "rer";

export interface CriticalItemDescriptor {
  itemType?: string;
  actionType?: string;
  damageTypes?: string[];
  hasRangedProperty?: boolean;
  subType?: string;
  itemName?: string;
}

/**
 * Generates an updated copy of Midi-QoL save rolling settings.
 * Always switches `playerRollSaves`; updates `rollNPCSaves` and `rollNPCLinkedSaves`
 * only when they are already configured to Monk's Token Bar (`mtb`) or Ripper's Epic Rolls (`rer`).
 */
export function buildUpdatedMidiSaveSettings(
  currentConfig: Record<string, any>,
  targetMode: MidiRollSystem
): Record<string, any> {
  const updated = { ...(currentConfig ?? {}) };
  updated.playerRollSaves = targetMode;

  if (updated.rollNPCSaves === "mtb" || updated.rollNPCSaves === "rer") {
    updated.rollNPCSaves = targetMode;
  }
  if (updated.rollNPCLinkedSaves === "mtb" || updated.rollNPCLinkedSaves === "rer") {
    updated.rollNPCLinkedSaves = targetMode;
  }

  return updated;
}

/**
 * Normalizes a table name by stripping accents and lowercasing for flexible matching.
 */
export function normalizeTableSearchName(text: string): string {
  return (text || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

/**
 * Determines which critical hit RollTable applies to an attack descriptor.
 */
export function resolveCriticalHitTableName(item: CriticalItemDescriptor): string {
  if (
    item.itemType === "spell" ||
    item.actionType === "msak" ||
    item.actionType === "rsak"
  ) {
    return CRITICAL_TABLE_NAMES.hitMagic;
  }

  const primaryType = (item.damageTypes?.[0] || "").toLowerCase();
  if (primaryType.includes("pierc") || primaryType.includes("perfur")) {
    return CRITICAL_TABLE_NAMES.hitPiercing;
  }
  if (primaryType.includes("bludg") || primaryType.includes("impact")) {
    return CRITICAL_TABLE_NAMES.hitBludgeoning;
  }
  if (primaryType.includes("slash") || primaryType.includes("cort")) {
    return CRITICAL_TABLE_NAMES.hitSlashing;
  }
  if (primaryType) {
    return CRITICAL_TABLE_NAMES.hitMagic;
  }

  return CRITICAL_TABLE_NAMES.hitSlashing;
}

/**
 * Determines which critical fumble RollTable applies to an attack descriptor.
 */
export function resolveCriticalFumbleTableName(item: CriticalItemDescriptor): string {
  if (
    item.itemType === "spell" ||
    item.actionType === "msak" ||
    item.actionType === "rsak"
  ) {
    return CRITICAL_TABLE_NAMES.fumbleMagic;
  }

  if (item.actionType === "rwak" || item.hasRangedProperty) {
    return CRITICAL_TABLE_NAMES.fumbleRanged;
  }

  const normalizedName = (item.itemName || "").toLowerCase();
  if (
    item.subType === "natural" ||
    normalizedName.includes("desarmad") ||
    normalizedName.includes("unarmed")
  ) {
    return CRITICAL_TABLE_NAMES.fumbleNatural;
  }

  return CRITICAL_TABLE_NAMES.fumbleMelee;
}

/**
 * Builds the announcement card HTML posted when Critical Encounter mode activates.
 */
export function buildCriticalAnnouncementHtml(title: string, subtitle: string): string {
  return `
          <div class="et-critical-chat-announcement">
            <div class="et-chat-header">
              <i class="fas fa-skull-crossbones"></i>
              <span>${title}</span>
            </div>
            <div class="et-chat-body">
              <p>${subtitle}</p>
              <p style="font-size:0.85rem;margin-top:6px;color:#a99885">
                ${UI_TEXT.announcementDescription}
              </p>
            </div>
          </div>
        `;
}

/**
 * Builds the interactive RollTable prompt card HTML for a critical hit or fumble.
 */
export function buildCriticalRollCardHtml(
  kind: "hit" | "fumble",
  actorName: string,
  itemName: string,
  tableNameToUse: string,
  actorId: string
): string {
  const isHit = kind === "hit";
  const cardClass = isHit ? "nat20" : "nat1";
  const titleIcon = isHit ? "fa-crosshairs" : "fa-skull";
  const mainTitle = isHit ? UI_TEXT.criticalHitTitle : UI_TEXT.criticalFumbleTitle;
  const narrative = isHit
    ? UI_TEXT.criticalHitNarrative(actorName, itemName)
    : UI_TEXT.criticalFumbleNarrative(actorName, itemName);
  const hintIcon = isHit ? "fa-bullseye" : "fa-exclamation-triangle";

  return `
        <div class="et-critical-roll-card ${cardClass}">
          <div class="et-roll-header">
            <div class="et-roll-badge">
              <i class="fas fa-skull-crossbones"></i> ${UI_TEXT.badgeTitle}
            </div>
            <div class="et-roll-main-title">
              <i class="fas ${titleIcon}"></i>
              <span>${mainTitle}</span>
            </div>
          </div>
          <div class="et-roll-body">
            <p class="et-roll-narrative">
              ${narrative}
            </p>
            <div class="et-roll-table-hint">
              <i class="fas ${hintIcon}"></i> ${UI_TEXT.tableLabel} <strong>${tableNameToUse}</strong>
            </div>
          </div>
          <div class="et-roll-footer">
            <button type="button" class="et-roll-table-btn" 
                    data-action="roll-critical-table" 
                    data-table-name="${tableNameToUse}" 
                    data-actor-id="${actorId}">
              <i class="fas fa-dice-d20"></i> ${UI_TEXT.rollButtonLabel}
            </button>
          </div>
        </div>
      `;
}
