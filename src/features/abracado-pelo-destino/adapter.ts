import { MODULE_ID, MODULE_TITLE } from "../../constants";
import abracadoCss from "../../../styles/abracado-destino.css?inline";
import {
  ABRACADO_EFFECT_CHANGES,
  DEFAULT_BANNER_DURATION_MS,
  DEFAULT_LUCK_SOUND,
  EFFECT_ICON,
  EFFECT_NAME,
  FALLBACK_ROLL_DELAY_MS,
  QUEUE_STEP_DELAY_MS,
  SOCKET_ACTION_ABRACADO,
  SOUND_VOLUME,
  UI_TEXT,
} from "./config";
import {
  buildAbracadoChatCardHtml,
  evaluateCoinResult,
  isAbracadoBlessItem,
  startAbracadoCanvas,
  type AbracadoCanvasController,
} from "./rules";

interface AbracadoSocketPayload {
  action: string;
  combatId?: string;
  sceneId?: string;
  actorName: string;
  hasLuck: boolean;
  faceName: string;
}

interface QueuedParticipant {
  combatant: any;
  actor: any;
  initiativeValue: number;
  sceneId?: string;
}

function playAbracadoSound(soundPath: string): void {
  if (!soundPath) return;

  const Sequence = (window as any).Sequence;
  if (typeof Sequence === "function") {
    try {
      new Sequence().sound().file(soundPath).volume(SOUND_VOLUME).play();
      return;
    } catch (err) {
      console.warn(`${MODULE_TITLE} | Failed to play sound via Sequencer:`, err);
    }
  }

  const audioHelper = (foundry as any)?.audio?.AudioHelper ?? (window as any).AudioHelper;
  if (audioHelper && typeof audioHelper.play === "function") {
    audioHelper.play({ src: soundPath, volume: SOUND_VOLUME, loop: false }, false);
  }
}

/**
 * Checks whether an actor holds the Abraçado Pelo Destino blessing item.
 */
export function actorHasAbracadoBless(actor: any): boolean {
  if (!actor || !actor.items) return false;
  return actor.items.some((i: any) =>
    isAbracadoBlessItem(i.name, i.flags?.core?.sourceId)
  );
}

/**
 * Coordinates 3D coin flips, cinematic banners, particles, and Calax's Luck effects.
 */
export class AbracadoDestinoManager {
  private static instance: AbracadoDestinoManager;

  private overlayEl: HTMLElement | null = null;
  private canvasEl: HTMLCanvasElement | null = null;
  private crestIconEl: HTMLElement | null = null;
  private titleEl: HTMLElement | null = null;
  private subtitleEl: HTMLElement | null = null;

  private hideTimer: number | null = null;
  private canvasController: AbracadoCanvasController | null = null;

  private queue: QueuedParticipant[] = [];
  private isProcessingQueue = false;

  public static getInstance(): AbracadoDestinoManager {
    if (!AbracadoDestinoManager.instance) {
      AbracadoDestinoManager.instance = new AbracadoDestinoManager();
    }
    return AbracadoDestinoManager.instance;
  }

  public init(): void {
    this.injectStyles();
    this.registerSettings();
    this.registerSocketListener();
    this.registerHooks();
  }

  private injectStyles(): void {
    if (document.getElementById("et-abracado-styles")) return;
    const style = document.createElement("style");
    style.id = "et-abracado-styles";
    style.textContent = abracadoCss;
    document.head.appendChild(style);
  }

  private registerSettings(): void {
    const settings = game.settings as any;
    if (!settings) return;

    settings.register(MODULE_ID, "abracadoSoundLuck", {
      name: UI_TEXT.settingLuckSoundName,
      hint: UI_TEXT.settingLuckSoundHint,
      scope: "world",
      config: true,
      type: String,
      default: DEFAULT_LUCK_SOUND,
      filePicker: "audio",
    });

    settings.register(MODULE_ID, "abracadoSoundEmpty", {
      name: UI_TEXT.settingEmptySoundName,
      hint: UI_TEXT.settingEmptySoundHint,
      scope: "world",
      config: true,
      type: String,
      default: "",
      filePicker: "audio",
    });

    settings.register(MODULE_ID, "abracadoBannerDuration", {
      name: UI_TEXT.settingDurationName,
      hint: UI_TEXT.settingDurationHint,
      scope: "client",
      config: true,
      type: Number,
      default: DEFAULT_BANNER_DURATION_MS,
    });
  }

  private injectOverlayDOM(): void {
    if (document.getElementById("et-abracado-overlay")) {
      this.overlayEl = document.getElementById("et-abracado-overlay");
      this.canvasEl = document.getElementById("et-abracado-canvas") as HTMLCanvasElement;
      this.crestIconEl = this.overlayEl?.querySelector(".et-crest-icon") || null;
      this.titleEl = this.overlayEl?.querySelector(".et-abracado-title") || null;
      this.subtitleEl = this.overlayEl?.querySelector(".et-abracado-subtitle") || null;
      return;
    }

    const overlay = document.createElement("div");
    overlay.id = "et-abracado-overlay";
    overlay.innerHTML = `
      <canvas id="et-abracado-canvas"></canvas>
      <div class="et-abracado-banner-box">
        <div class="et-abracado-crest">
          <span class="et-rune-sparkle">✦</span>
          <span class="et-crest-icon">🍀</span>
          <span class="et-rune-sparkle">✦</span>
        </div>
        <h1 class="et-abracado-title">${UI_TEXT.defaultTitle}</h1>
        <div class="et-abracado-divider"></div>
        <p class="et-abracado-subtitle">${UI_TEXT.defaultSubtitle}</p>
      </div>
    `;

    document.body.appendChild(overlay);
    this.overlayEl = overlay;
    this.canvasEl = overlay.querySelector("#et-abracado-canvas") as HTMLCanvasElement;
    this.crestIconEl = overlay.querySelector(".et-crest-icon");
    this.titleEl = overlay.querySelector(".et-abracado-title");
    this.subtitleEl = overlay.querySelector(".et-abracado-subtitle");
  }

  /**
   * Displays the cinematic banner and particle canvas on the local screen.
   */
  public showBanner(
    actorName: string,
    hasLuck: boolean,
    faceName: string = hasLuck ? UI_TEXT.faceHeads : UI_TEXT.faceTails
  ): void {
    if (!this.overlayEl) this.injectOverlayDOM();
    if (!this.overlayEl || !this.canvasEl) return;

    const duration =
      (game.settings as any)?.get(MODULE_ID, "abracadoBannerDuration") ||
      DEFAULT_BANNER_DURATION_MS;
    const soundPath = hasLuck
      ? (game.settings as any)?.get(MODULE_ID, "abracadoSoundLuck")
      : (game.settings as any)?.get(MODULE_ID, "abracadoSoundEmpty");

    if (this.hideTimer) {
      window.clearTimeout(this.hideTimer);
      this.hideTimer = null;
    }
    this.canvasController?.stop();
    this.canvasController = null;

    this.overlayEl.classList.remove("luck", "empty");
    this.overlayEl.classList.add(hasLuck ? "luck" : "empty");

    if (this.crestIconEl) {
      this.crestIconEl.textContent = hasLuck ? "🍀" : "✕";
    }

    if (this.titleEl) {
      this.titleEl.textContent = hasLuck
        ? UI_TEXT.bannerTitleLuck(actorName)
        : UI_TEXT.bannerTitleEmpty(actorName);
    }

    if (this.subtitleEl) {
      this.subtitleEl.textContent = hasLuck
        ? UI_TEXT.bannerSubtitleLuck(faceName, actorName)
        : UI_TEXT.bannerSubtitleEmpty(faceName, actorName);
    }

    this.canvasController = startAbracadoCanvas(this.canvasEl, hasLuck ? "luck" : "empty");

    if (soundPath) {
      playAbracadoSound(soundPath);
    }

    this.overlayEl.classList.add("et-active");

    this.hideTimer = window.setTimeout(() => {
      this.overlayEl?.classList.remove("et-active");
      this.canvasController?.stop();
      this.canvasController = null;
      this.hideTimer = null;
    }, duration);
  }

  /**
   * Broadcasts the banner to all connected clients via socket.
   */
  public broadcastBanner(
    actorName: string,
    hasLuck: boolean,
    faceName: string,
    sceneId?: string
  ): void {
    const payload: AbracadoSocketPayload = {
      action: SOCKET_ACTION_ABRACADO,
      sceneId,
      actorName,
      hasLuck,
      faceName,
    };

    this.showBanner(actorName, hasLuck, faceName);
    (game.socket as any)?.emit(`module.${MODULE_ID}`, payload);
  }

  private registerSocketListener(): void {
    (game.socket as any)?.on(`module.${MODULE_ID}`, (data: AbracadoSocketPayload) => {
      if (data?.action !== SOCKET_ACTION_ABRACADO) return;

      const currentSceneId = (canvas as any)?.scene?.id;
      const isViewingScene = currentSceneId && currentSceneId === data.sceneId;

      if (game.user?.isGM || isViewingScene || !data.sceneId) {
        this.showBanner(data.actorName, data.hasLuck, data.faceName);
      }
    });
  }

  private async applyMechanicalEffect(actor: any, hasLuck: boolean): Promise<void> {
    const dfreds = (game as any).dfreds;

    if (hasLuck) {
      let dfredsSuccess = false;
      if (dfreds?.effectInterface) {
        try {
          await dfreds.effectInterface.addEffect({ effectName: EFFECT_NAME, uuid: actor.uuid });
          dfredsSuccess = true;
        } catch {
          dfredsSuccess = false;
        }
      }

      if (!dfredsSuccess) {
        const existing = actor.effects?.find(
          (e: any) => e.name === EFFECT_NAME || e.label === EFFECT_NAME
        );
        if (!existing) {
          await actor.createEmbeddedDocuments("ActiveEffect", [
            {
              name: EFFECT_NAME,
              icon: EFFECT_ICON,
              changes: ABRACADO_EFFECT_CHANGES.map((c) => ({ ...c })),
              flags: {
                [MODULE_ID]: { isAbracadoEffect: true },
              },
            },
          ]);
        }
      }
    } else {
      if (dfreds?.effectInterface) {
        try {
          await dfreds.effectInterface.removeEffect({ effectName: EFFECT_NAME, uuid: actor.uuid });
        } catch {
          // Continue to native ActiveEffect cleanup
        }
      }

      const toDelete = actor.effects
        ?.filter(
          (e: any) =>
            e.name === EFFECT_NAME ||
            e.label === EFFECT_NAME ||
            e.flags?.[MODULE_ID]?.isAbracadoEffect
        )
        .map((e: any) => e.id);

      if (toDelete && toDelete.length > 0) {
        await actor.deleteEmbeddedDocuments("ActiveEffect", toDelete);
      }
    }
  }

  private async createChatMessage(actor: any, hasLuck: boolean, faceName: string): Promise<void> {
    const chatContent = buildAbracadoChatCardHtml(actor.name, hasLuck, faceName);

    await ChatMessage.create({
      speaker: ChatMessage.getSpeaker({ actor }),
      content: chatContent,
      flavor: UI_TEXT.chatFlavor,
    } as any);
  }

  /**
   * Enqueues a combatant to process their fate coin roll sequentially.
   */
  public enqueue(participant: QueuedParticipant): void {
    this.queue.push(participant);
    if (!this.isProcessingQueue) {
      this.processQueue();
    }
  }

  private async processQueue(): Promise<void> {
    if (this.queue.length === 0) {
      this.isProcessingQueue = false;
      return;
    }

    this.isProcessingQueue = true;
    const current = this.queue.shift()!;
    const { actor, sceneId } = current;

    try {
      const roll = new Roll("1dc");
      await roll.evaluate();

      const dice3d = (game as any).dice3d;
      if (dice3d) {
        await dice3d.showForRoll(roll, game.user, true);
      } else {
        await new Promise((resolve) => setTimeout(resolve, FALLBACK_ROLL_DELAY_MS));
      }

      const coinTerm = roll.terms?.find(
        (t: any) => t.constructor?.name === "Coin" || t.denomination === "c"
      );
      const rawResult = coinTerm?.results?.[0]?.result ?? (roll.total === 1 ? 1 : 0);
      const { hasLuck, faceName } = evaluateCoinResult(Number(rawResult));

      this.broadcastBanner(actor.name, hasLuck, faceName, sceneId);
      await this.applyMechanicalEffect(actor, hasLuck);
      await this.createChatMessage(actor, hasLuck, faceName);

      const bannerDuration =
        (game.settings as any)?.get(MODULE_ID, "abracadoBannerDuration") ||
        DEFAULT_BANNER_DURATION_MS;
      await new Promise((resolve) => setTimeout(resolve, bannerDuration + QUEUE_STEP_DELAY_MS));
    } catch (err) {
      console.error(`${MODULE_TITLE} | Error processing Abraçado Pelo Destino:`, err);
    } finally {
      this.processQueue();
    }
  }

  private registerHooks(): void {
    Hooks.on("updateCombatant", async (combatant: any, changed: any) => {
      if (!game.users?.activeGM?.isSelf) return;
      if (
        !("initiative" in changed) ||
        changed.initiative === null ||
        changed.initiative === undefined
      ) {
        return;
      }

      const actor = combatant.actor;
      if (!actor || !actorHasAbracadoBless(actor)) return;

      const lastInitiative = combatant.getFlag(MODULE_ID, "abracadoLastInitiative");
      if (lastInitiative === changed.initiative) return;

      await combatant.setFlag(MODULE_ID, "abracadoLastInitiative", changed.initiative);

      const sceneId = combatant.combat?.scene?.id || (canvas as any)?.scene?.id;

      this.enqueue({
        combatant,
        actor,
        initiativeValue: changed.initiative,
        sceneId,
      });
    });

    Hooks.on("deleteCombat", async (combat: any) => {
      if (!game.users?.activeGM?.isSelf) return;

      this.queue = [];

      for (const combatant of combat.combatants || []) {
        const actor = combatant.actor;
        if (!actor || !actorHasAbracadoBless(actor)) continue;

        await combatant.unsetFlag(MODULE_ID, "abracadoLastInitiative").catch(() => {});
        await this.applyMechanicalEffect(actor, false);
      }
    });
  }
}

/**
 * Registers the Abraçado Pelo Destino feature during module initialization.
 */
export function registerAbracadoPeloDestino(): void {
  console.log(`${MODULE_TITLE} | Registering Abraçado Pelo Destino feature`);
  AbracadoDestinoManager.getInstance().init();
}
