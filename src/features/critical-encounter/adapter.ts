import { MODULE_ID, MODULE_TITLE } from "../../constants";
import criticalCss from "../../../styles/critical-encounter.css?inline";
import {
  CRITICAL_SOUND_VOLUME,
  DEFAULT_BANNER_DURATION_MS,
  DEFAULT_CRITICAL_SOUND,
  MAX_PROCESSED_WORKFLOWS,
  SOCKET_ACTION_BANNER,
  UI_TEXT,
} from "./config";
import {
  buildCriticalAnnouncementHtml,
  buildCriticalRollCardHtml,
  buildUpdatedMidiSaveSettings,
  normalizeTableSearchName,
  resolveCriticalFumbleTableName,
  resolveCriticalHitTableName,
  type CriticalItemDescriptor,
  type MidiRollSystem,
} from "./rules";

declare const Sequence: any;

function findRollTable(targetName: string): any {
  const normTarget = normalizeTableSearchName(targetName);
  const tables = (game.tables as any)?.contents ?? [];
  return tables.find((t: any) => {
    const norm = normalizeTableSearchName(t.name);
    return norm === normTarget || norm.includes(normTarget);
  });
}

function playCriticalSound(soundPath: string): void {
  if (!soundPath) return;

  if (typeof Sequence !== "undefined") {
    try {
      new Sequence().sound().file(soundPath).volume(CRITICAL_SOUND_VOLUME).play();
      return;
    } catch (err) {
      console.warn(`${MODULE_TITLE} | Sequencer sound playback failed, falling back:`, err);
    }
  }

  try {
    const audioHelper = (foundry as any)?.audio?.AudioHelper ?? (AudioHelper as any);
    if (audioHelper && typeof audioHelper.play === "function") {
      audioHelper.play({ src: soundPath, volume: CRITICAL_SOUND_VOLUME, loop: false }, false);
    }
  } catch (err) {
    console.warn(`${MODULE_TITLE} | Failed to play critical encounter sound:`, err);
  }
}

function extractItemDescriptor(item: any): CriticalItemDescriptor {
  const parts = item?.system?.damage?.parts ?? [];
  const damageTypes: string[] = parts
    .map((p: any) => String(p[1] || "").toLowerCase())
    .filter(Boolean);
  if (damageTypes.length === 0) {
    const baseType = String(item?.system?.damage?.base?.types?.[0] || "").toLowerCase();
    if (baseType) damageTypes.push(baseType);
  }

  return {
    itemType: item?.type,
    actionType: item?.system?.actionType,
    damageTypes,
    hasRangedProperty: Boolean(item?.system?.properties?.has?.("ran")),
    subType: item?.system?.type?.value,
    itemName: item?.name,
  };
}

/**
 * Manages the Tower Judgment (Critical Encounter) banner, tracker controls, and Midi-QoL roll triggers.
 */
export class CriticalEncounterManager {
  private static instance: CriticalEncounterManager | null = null;
  private overlayEl: HTMLElement | null = null;
  private titleEl: HTMLElement | null = null;
  private subtitleEl: HTMLElement | null = null;
  private hideTimer: number | null = null;
  private processedWorkflows = new Set<string>();

  private constructor() {}

  public static getInstance(): CriticalEncounterManager {
    if (!CriticalEncounterManager.instance) {
      CriticalEncounterManager.instance = new CriticalEncounterManager();
    }
    return CriticalEncounterManager.instance;
  }

  public init(): void {
    this.injectStyles();
    this.registerSettings();
    this.injectOverlayDOM();
    this.registerHooks();
    this.registerSocketListener();
    this.registerChatInteractionListener();
    console.log(`${MODULE_TITLE} | Critical Encounter system initialized.`);
  }

  private injectStyles(): void {
    const styleId = "et-critical-encounter-styles";
    if (document.getElementById(styleId)) return;

    const style = document.createElement("style");
    style.id = styleId;
    style.textContent = criticalCss;
    document.head.appendChild(style);
  }

  private registerSettings(): void {
    const settings = game.settings as any;
    if (!settings) return;

    settings.register(MODULE_ID, "criticalTitle", {
      name: UI_TEXT.settingTitleName,
      hint: UI_TEXT.settingTitleHint,
      scope: "world",
      config: true,
      type: String,
      default: UI_TEXT.defaultTitle,
    });

    settings.register(MODULE_ID, "criticalSubtitle", {
      name: UI_TEXT.settingSubtitleName,
      hint: UI_TEXT.settingSubtitleHint,
      scope: "world",
      config: true,
      type: String,
      default: UI_TEXT.defaultSubtitle,
    });

    settings.register(MODULE_ID, "criticalSound", {
      name: UI_TEXT.settingSoundName,
      hint: UI_TEXT.settingSoundHint,
      scope: "world",
      config: true,
      type: String,
      default: DEFAULT_CRITICAL_SOUND,
      filePicker: "audio",
    });

    settings.register(MODULE_ID, "criticalBannerDuration", {
      name: UI_TEXT.settingDurationName,
      hint: UI_TEXT.settingDurationHint,
      scope: "client",
      config: true,
      type: Number,
      default: DEFAULT_BANNER_DURATION_MS,
    });
  }

  private injectOverlayDOM(): void {
    if (document.getElementById("et-critical-overlay")) {
      this.overlayEl = document.getElementById("et-critical-overlay");
      this.titleEl = this.overlayEl?.querySelector(".et-critical-title") || null;
      this.subtitleEl = this.overlayEl?.querySelector(".et-critical-subtitle") || null;
      return;
    }

    const overlay = document.createElement("div");
    overlay.id = "et-critical-overlay";
    overlay.innerHTML = `
      <div class="et-critical-banner-box">
        <div class="et-critical-crest">
          <span class="et-rune-sparkle">✦</span>
          <i class="fas fa-skull"></i>
          <span class="et-rune-sparkle">✦</span>
        </div>
        <h1 class="et-critical-title">${UI_TEXT.defaultTitle}</h1>
        <div class="et-critical-divider"></div>
        <p class="et-critical-subtitle">${UI_TEXT.defaultSubtitle}</p>
      </div>
    `;

    document.body.appendChild(overlay);
    this.overlayEl = overlay;
    this.titleEl = overlay.querySelector(".et-critical-title");
    this.subtitleEl = overlay.querySelector(".et-critical-subtitle");
  }

  /**
   * Displays the cinematic encounter banner locally and plays the configured sound.
   */
  public showBanner(customTitle?: string, customSubtitle?: string, customSound?: string): void {
    if (!this.overlayEl) this.injectOverlayDOM();
    if (!this.overlayEl) return;

    const title =
      customTitle || (game.settings as any)?.get(MODULE_ID, "criticalTitle") || UI_TEXT.defaultTitle;
    const subtitle =
      customSubtitle ||
      (game.settings as any)?.get(MODULE_ID, "criticalSubtitle") ||
      UI_TEXT.defaultSubtitle;
    const sound =
      customSound ??
      (game.settings as any)?.get(MODULE_ID, "criticalSound") ??
      DEFAULT_CRITICAL_SOUND;
    const duration =
      (game.settings as any)?.get(MODULE_ID, "criticalBannerDuration") ||
      DEFAULT_BANNER_DURATION_MS;

    if (this.titleEl) this.titleEl.textContent = title;
    if (this.subtitleEl) this.subtitleEl.textContent = subtitle;

    playCriticalSound(sound);
    this.overlayEl.classList.add("et-active");

    if (this.hideTimer) {
      window.clearTimeout(this.hideTimer);
    }

    this.hideTimer = window.setTimeout(() => {
      this.overlayEl?.classList.remove("et-active");
      this.hideTimer = null;
    }, duration);
  }

  /**
   * Broadcasts the encounter banner via socket scoped to the combat's scene and participants.
   */
  public broadcastBanner(combat: any): void {
    const payload = {
      action: SOCKET_ACTION_BANNER,
      combatId: combat.id,
      sceneId: combat.scene?.id || (canvas as any)?.scene?.id,
      title: (game.settings as any)?.get(MODULE_ID, "criticalTitle"),
      subtitle: (game.settings as any)?.get(MODULE_ID, "criticalSubtitle"),
      sound: (game.settings as any)?.get(MODULE_ID, "criticalSound"),
    };

    this.showBanner(payload.title, payload.subtitle, payload.sound);
    (game.socket as any)?.emit(`module.${MODULE_ID}`, payload);
  }

  private registerSocketListener(): void {
    (game.socket as any)?.on(`module.${MODULE_ID}`, (data: any) => {
      if (data?.action !== SOCKET_ACTION_BANNER) return;

      const currentSceneId = (canvas as any)?.scene?.id;
      const combat = (game.combats as any)?.get(data.combatId);

      const isViewingScene = currentSceneId && currentSceneId === data.sceneId;
      const controlsParticipant = combat?.combatants?.some((c: any) => c.actor?.isOwner);

      if (game.user?.isGM || isViewingScene || controlsParticipant) {
        this.showBanner(data.title, data.subtitle, data.sound);
      }
    });
  }

  private registerHooks(): void {
    Hooks.on("renderCombatTracker", (app: any, html: any) => {
      this.handleCombatTrackerRender(app, html);
      this.syncCombatDock(app.viewed ?? game.combat);
    });

    Hooks.on("renderCombatDock", () => {
      this.syncCombatDock();
    });

    Hooks.on("renderApplication", (app: any) => {
      if (app?.constructor?.name === "CombatDock") {
        this.syncCombatDock();
      }
    });

    Hooks.on("updateCombat", (combat: any) => {
      this.syncCombatDock(combat);
      (ui as any)?.combat?.render?.();
    });

    Hooks.on("canvasReady", () => {
      this.syncCombatDock();
    });

    this.setupDockObserver();

    Hooks.on("midi-qol.AttackRollComplete", (workflow: any) => {
      this.handleAttackWorkflow(workflow);
    });

    Hooks.on("midi-qol.RollComplete", (workflow: any) => {
      this.handleAttackWorkflow(workflow);
    });

    Hooks.on("deleteCombat", (combat: any) => {
      if (combat?.id) {
        this.cleanupCombat(combat.id);
      }
    });
  }

  private setupDockObserver(): void {
    const observer = new MutationObserver(() => {
      if (document.querySelector(".combat-dock, #combat-dock")) {
        this.syncCombatDock();
      }
    });

    observer.observe(document.body, { childList: true, subtree: true });
  }

  /**
   * Returns the active Midi-QoL player save rolling system ("mtb" or "rer").
   */
  public getRollSystem(): MidiRollSystem {
    try {
      const config = (game.settings as any)?.get("midi-qol", "ConfigSettings");
      return config?.playerRollSaves === "rer" ? "rer" : "mtb";
    } catch {
      return "mtb";
    }
  }

  /**
   * Switches Midi-QoL save rolling between Monk's Token Bar ("mtb") and Ripper's Epic Rolls ("rer").
   */
  public async setRollSystem(targetMode: MidiRollSystem, notify = true): Promise<MidiRollSystem> {
    if (!game.user?.isGM) return this.getRollSystem();

    const midiModule = (game.modules as any)?.get("midi-qol");
    if (!midiModule?.active) {
      if (notify) {
        (ui as any)?.notifications?.warn(`${MODULE_TITLE} | ${UI_TEXT.midiMissingWarn}`);
      }
      return this.getRollSystem();
    }

    const currentConfig = (game.settings as any)?.get("midi-qol", "ConfigSettings") ?? {};
    const updated = buildUpdatedMidiSaveSettings(currentConfig, targetMode);
    await (game.settings as any).set("midi-qol", "ConfigSettings", updated);

    this.syncCombatDock();
    (ui as any)?.combat?.render?.();

    if (notify) {
      const label =
        targetMode === "rer" ? UI_TEXT.rollSystemRerLabel : UI_TEXT.rollSystemMtbLabel;
      (ui as any)?.notifications?.info(`${MODULE_TITLE} | ${UI_TEXT.rollSystemSwitched(label)}`);
    }

    return targetMode;
  }

  /**
   * Toggles between Monk's Token Bar and Ripper's Epic Rolls.
   */
  public async toggleRollSystem(): Promise<MidiRollSystem> {
    const next: MidiRollSystem = this.getRollSystem() === "rer" ? "mtb" : "rer";
    return await this.setRollSystem(next, true);
  }

  private upsertRollSystemButton(
    container: Element,
    buttonClass: string,
    baseClasses: string,
    tooltipAttr: string
  ): void {
    const rollMode = this.getRollSystem();
    const isRer = rollMode === "rer";
    const expectedClass = `${baseClasses} ${buttonClass}${isRer ? " active" : ""}`;
    const expectedTooltip = isRer ? UI_TEXT.rollSystemTooltipRer : UI_TEXT.rollSystemTooltipMtb;

    let btn = container.querySelector(`.${buttonClass}`) as HTMLButtonElement | null;
    if (!btn) {
      btn = document.createElement("button");
      btn.type = "button";
      btn.className = expectedClass;
      btn.setAttribute(tooltipAttr, expectedTooltip);
      if (tooltipAttr !== "data-tooltip") btn.setAttribute("data-tooltip", expectedTooltip);
      btn.addEventListener("click", async (ev) => {
        ev.preventDefault();
        ev.stopPropagation();
        await this.toggleRollSystem();
      });
      container.prepend(btn);
      return;
    }

    if (btn.className !== expectedClass) btn.className = expectedClass;
    if (btn.getAttribute(tooltipAttr) !== expectedTooltip) {
      btn.setAttribute(tooltipAttr, expectedTooltip);
    }
    if (btn.getAttribute("data-tooltip") !== expectedTooltip) {
      btn.setAttribute("data-tooltip", expectedTooltip);
    }
  }

  private handleCombatTrackerRender(app: any, html: any): void {
    const root: HTMLElement = html instanceof HTMLElement ? html : html?.[0];
    if (!root) return;

    const headerControls =
      root.querySelector("nav.encounters") ||
      root.querySelector(".encounter-controls") ||
      root.querySelector("header.combat-tracker-header") ||
      root.querySelector(".combat-tracker-header");

    if (game.user?.isGM && headerControls) {
      this.upsertRollSystemButton(
        headerControls,
        "et-roll-system-toggle-btn",
        "inline-control icon fa-solid fa-dice-d20",
        "title"
      );
    }

    const combat = app.viewed ?? (game.combats as any)?.viewed ?? game.combat;
    if (!combat) return;

    const isCritical = Boolean(combat.getFlag(MODULE_ID, "criticalEncounter"));
    const title = (game.settings as any)?.get(MODULE_ID, "criticalTitle") || UI_TEXT.defaultTitle;

    if (game.user?.isGM && headerControls) {
      const expectedClass = `inline-control icon fa-solid fa-skull et-critical-toggle-btn${isCritical ? " active" : ""}`;
      const expectedTitle = isCritical
        ? UI_TEXT.toggleTooltipActive(title)
        : UI_TEXT.toggleTooltipInactive(title);

      const existingBtn = headerControls.querySelector(
        ".et-critical-toggle-btn"
      ) as HTMLButtonElement | null;
      if (!existingBtn) {
        const toggleBtn = document.createElement("button");
        toggleBtn.type = "button";
        toggleBtn.className = expectedClass;
        toggleBtn.setAttribute("title", expectedTitle);

        toggleBtn.addEventListener("click", async (ev) => {
          ev.preventDefault();
          ev.stopPropagation();
          await this.toggleCriticalEncounter(combat);
        });

        headerControls.prepend(toggleBtn);
      } else {
        if (existingBtn.className !== expectedClass) existingBtn.className = expectedClass;
        if (existingBtn.getAttribute("title") !== expectedTitle) {
          existingBtn.setAttribute("title", expectedTitle);
        }
      }
    }

    const existingBadge = root.querySelector(".et-critical-encounter-badge");
    if (isCritical) {
      if (!existingBadge) {
        const badge = document.createElement("div");
        badge.className = "et-critical-encounter-badge";
        badge.innerHTML = `<i class="fas fa-skull-crossbones"></i> <span>${title}</span>`;

        const insertionPoint =
          root.querySelector(".combat-tracker-header") || root.querySelector("header") || root;
        insertionPoint.insertAdjacentElement("afterend", badge);
      }
    } else if (existingBadge) {
      existingBadge.remove();
    }
  }

  /**
   * Synchronizes visual indicators and toggle buttons inside the Combat Tracker Dock carousel.
   */
  public syncCombatDock(combatInstance?: any): void {
    const dockEl = document.querySelector("#combat-dock, .combat-dock") as HTMLElement;
    if (!dockEl) return;

    const combat = combatInstance ?? game.combat;
    if (!combat) return;

    const isCritical = Boolean(combat.getFlag(MODULE_ID, "criticalEncounter"));
    const title = (game.settings as any)?.get(MODULE_ID, "criticalTitle") || UI_TEXT.defaultTitle;

    const rightButtons = dockEl.querySelector(".buttons-container.right");
    if (rightButtons && game.user?.isGM) {
      this.upsertRollSystemButton(
        rightButtons,
        "et-dock-roll-system-btn",
        "icon ui-control fas fa-dice-d20",
        "data-tooltip"
      );

      const expectedClass = `icon ui-control fas fa-skull et-dock-toggle-btn${isCritical ? " active" : ""}`;
      const expectedTooltip = isCritical
        ? UI_TEXT.toggleTooltipActive(title)
        : UI_TEXT.toggleTooltipInactive(title);

      let dockBtn = rightButtons.querySelector(".et-dock-toggle-btn") as HTMLButtonElement | null;
      if (!dockBtn) {
        dockBtn = document.createElement("button");
        dockBtn.type = "button";
        dockBtn.className = expectedClass;
        dockBtn.setAttribute("data-tooltip", expectedTooltip);

        dockBtn.addEventListener("click", async (ev) => {
          ev.preventDefault();
          ev.stopPropagation();
          await this.toggleCriticalEncounter(combat);
        });

        rightButtons.prepend(dockBtn);
      } else {
        if (dockBtn.className !== expectedClass) dockBtn.className = expectedClass;
        if (dockBtn.getAttribute("data-tooltip") !== expectedTooltip) {
          dockBtn.setAttribute("data-tooltip", expectedTooltip);
        }
      }
    }

    let carouselBadge = dockEl.querySelector(".et-carousel-critical-badge") as HTMLElement;
    if (isCritical) {
      if (!carouselBadge) {
        carouselBadge = document.createElement("div");
        carouselBadge.className = "et-carousel-critical-badge";
        carouselBadge.innerHTML = `<i class="fas fa-skull-crossbones"></i> <span>${title}</span>`;
        dockEl.prepend(carouselBadge);
      }
    } else if (carouselBadge) {
      carouselBadge.remove();
    }
  }

  /**
   * Toggles Critical Encounter mode on the target combat and syncs Midi-QoL roll settings.
   */
  public async toggleCriticalEncounter(combat: any): Promise<boolean> {
    if (!combat || !game.user?.isGM) return false;

    const currentState = Boolean(combat.getFlag(MODULE_ID, "criticalEncounter"));
    const newState = !currentState;

    await combat.setFlag(MODULE_ID, "criticalEncounter", newState);
    await this.setRollSystem(newState ? "rer" : "mtb", false);

    const title = (game.settings as any)?.get(MODULE_ID, "criticalTitle") || UI_TEXT.defaultTitle;

    if (newState) {
      this.broadcastBanner(combat);

      const subtitle =
        (game.settings as any)?.get(MODULE_ID, "criticalSubtitle") || UI_TEXT.defaultSubtitle;
      await ChatMessage.create({
        content: buildCriticalAnnouncementHtml(title, subtitle),
        speaker: { alias: UI_TEXT.speakerAlias },
      });
    }

    this.syncCombatDock(combat);
    (ui as any)?.combat?.render?.();
    return newState;
  }

  private async handleAttackWorkflow(workflow: any): Promise<void> {
    if (!workflow || !workflow.attackRoll) return;

    const workflowId = workflow.id || `${workflow.actor?.id}-${workflow.item?.id}-${Date.now()}`;
    if (this.processedWorkflows.has(workflowId)) return;
    this.processedWorkflows.add(workflowId);

    if (this.processedWorkflows.size > MAX_PROCESSED_WORKFLOWS) {
      this.processedWorkflows.clear();
    }

    const token =
      workflow.token ||
      (canvas as any)?.tokens?.get(workflow.tokenId) ||
      (workflow.actor
        ? (canvas as any)?.tokens?.placeables?.find((t: any) => t.actor?.id === workflow.actor.id)
        : null);

    const combat = token?.combatant?.combat;
    if (!combat || !combat.getFlag(MODULE_ID, "criticalEncounter")) {
      return;
    }

    const isCriticalHit = Boolean(
      workflow.isCritical ||
        workflow.attackRoll?.isCritical ||
        workflow.attackRollModifierTracker?.isCritical ||
        workflow.attackRollModifierTracker?.critical?.isActive ||
        workflow.attackRoll?.dice?.[0]?.results?.find((r: any) => r.active !== false)?.result === 20
    );

    const isFumble = Boolean(
      workflow.isFumble ||
        workflow.attackRoll?.isFumble ||
        workflow.attackRollModifierTracker?.isFumble ||
        workflow.attackRollModifierTracker?.fumble?.isActive ||
        workflow.attackRoll?.dice?.[0]?.results?.find((r: any) => r.active !== false)?.result === 1
    );

    if (!isCriticalHit && !isFumble) return;

    const actor = workflow.actor || token?.actor;
    const item = workflow.item;
    const actorName = actor?.name || UI_TEXT.defaultActorName;
    const itemName = item?.name || UI_TEXT.defaultItemName;

    if (isCriticalHit) {
      await this.sendCriticalCard("hit", actor, item, actorName, itemName);
    } else if (isFumble) {
      await this.sendCriticalCard("fumble", actor, item, actorName, itemName);
    }
  }

  private async sendCriticalCard(
    kind: "hit" | "fumble",
    actor: any,
    item: any,
    actorName: string,
    itemName: string
  ): Promise<void> {
    const descriptor = extractItemDescriptor(item);
    const targetTableName =
      kind === "hit"
        ? resolveCriticalHitTableName(descriptor)
        : resolveCriticalFumbleTableName(descriptor);

    const rollTable = findRollTable(targetTableName);
    const tableNameToUse = rollTable ? rollTable.name : targetTableName;

    await ChatMessage.create({
      content: buildCriticalRollCardHtml(
        kind,
        actorName,
        itemName,
        tableNameToUse,
        actor?.id || ""
      ),
      speaker: ChatMessage.getSpeaker({ actor }),
    });
  }

  private registerChatInteractionListener(): void {
    document.addEventListener("click", async (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      const btn = target.closest<HTMLButtonElement>('[data-action="roll-critical-table"]');
      if (!btn) return;

      event.preventDefault();
      event.stopPropagation();

      const tableName = btn.dataset.tableName;
      const actorId = btn.dataset.actorId;

      if (!tableName) return;

      const actor = actorId ? (game.actors as any)?.get(actorId) : null;
      const isOwner = actor ? actor.isOwner : false;
      const isGM = Boolean(game.user?.isGM);

      if (!isGM && !isOwner) {
        (ui as any)?.notifications?.warn(UI_TEXT.permissionWarn);
        return;
      }

      const table = findRollTable(tableName);
      if (!table) {
        (ui as any)?.notifications?.error(UI_TEXT.tableNotFoundError(tableName));
        return;
      }

      btn.disabled = true;
      btn.classList.add("rolled");
      btn.innerHTML = `<i class="fas fa-check"></i> ${UI_TEXT.rolledButtonLabel}`;

      try {
        await table.draw();
      } catch (err) {
        console.error(`${MODULE_TITLE} | Error rolling table ${tableName}:`, err);
        (ui as any)?.notifications?.error(UI_TEXT.rollError(tableName));
        btn.disabled = false;
        btn.classList.remove("rolled");
      }
    });
  }

  private async cleanupCombat(combatId: string): Promise<void> {
    console.log(`${MODULE_TITLE} | Combat ${combatId} deleted; cleaning Critical Encounter state.`);
    if (!game.user?.isGM) return;

    const combats = (game.combats as any)?.contents ?? [];
    const hasRemainingCritical = combats.some(
      (c: any) => c.id !== combatId && Boolean(c.getFlag?.(MODULE_ID, "criticalEncounter"))
    );

    if (!hasRemainingCritical) {
      await this.setRollSystem("mtb", false);
    }
  }
}

/**
 * Registers the Critical Encounter feature during module initialization.
 */
export function registerCriticalEncounter(): void {
  CriticalEncounterManager.getInstance().init();
}
