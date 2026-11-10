/**
 * Endless Tower: Abraçado Pelo Destino (Bênção de Calax)
 * - Rolagem 3D independente de 1d2 com Dice So Nice (1 = Ímpar/Neutro, 2 = Par/Sorte)
 * - Banner cinemático edge-to-edge alinhado ao Design System da Torre
 * - Canvas 2D de partículas: trevos esvoaçantes para Sorte, cinzas desvanecendo para Vazio
 * - Fila de execução sequencial (FIFO) para suporte a múltiplos personagens no mesmo combate
 * - Disparo imediato em rolagem ou re-rolagem de iniciativa
 * - Card público de alta resolução no chat
 * - Aplicação mecânica via DFreds com fallback para ActiveEffect nativo (+1 ataques e testes)
 */

import { MODULE_ID, MODULE_TITLE } from "../constants";
import { startAbracadoCanvas, AbracadoCanvasController } from "./abracado-canvas";
import abracadoCss from "../../styles/abracado-destino.css?inline";

const SOCKET_ACTION_ABRACADO = "ABRACADO_PELO_DESTINO_ANIMATION";
const BLESS_NAME_NORMALIZED = "abraçado pelo destino";
const BLESS_COMPENDIUM_UUID = "Compendium.world.endless-tower-items.Item.TB6Qd10CF3XdZ3O9";
const EFFECT_NAME = "Sorte de Calax";

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

/**
 * Toca efeito sonoro suportando Sequencer ou AudioHelper nativo.
 */
function playAbracadoSound(soundPath: string): void {
  if (!soundPath) return;

  const Sequence = (window as any).Sequence;
  if (typeof Sequence === "function") {
    try {
      new Sequence().sound().file(soundPath).volume(0.85).play();
      return;
    } catch (err) {
      console.warn(`${MODULE_TITLE} | Erro ao tocar som via Sequencer:`, err);
    }
  }

  const audioHelper = (foundry as any)?.audio?.AudioHelper ?? (window as any).AudioHelper;
  if (audioHelper && typeof audioHelper.play === "function") {
    audioHelper.play({ src: soundPath, volume: 0.85, loop: false }, false);
  }
}

/**
 * Verifica se um ator possui a bênção "Abraçado Pelo Destino".
 */
export function actorHasAbracadoBless(actor: any): boolean {
  if (!actor || !actor.items) return false;
  return actor.items.some((i: any) => {
    const itemName = (i.name || "").toLowerCase().trim();
    const sourceId = i.flags?.core?.sourceId;
    return (
      itemName === BLESS_NAME_NORMALIZED ||
      itemName === "abracado pelo destino" ||
      sourceId === BLESS_COMPENDIUM_UUID
    );
  });
}

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
    const settings = (game.settings as any);
    if (!settings) return;

    settings.register(MODULE_ID, "abracadoSoundLuck", {
      name: "Abraçado Pelo Destino: Som de Sorte",
      hint: "Efeito sonoro reproduzido quando a moeda cai em Par (Destino o abraça).",
      scope: "world",
      config: true,
      type: String,
      default: "sounds/combat/epic-start-horn.ogg",
      filePicker: "audio",
    });

    settings.register(MODULE_ID, "abracadoSoundEmpty", {
      name: "Abraçado Pelo Destino: Som de Vazio",
      hint: "Efeito sonoro reproduzido quando a moeda cai em Ímpar (O acaso é indiferente).",
      scope: "world",
      config: true,
      type: String,
      default: "",
      filePicker: "audio",
    });

    settings.register(MODULE_ID, "abracadoBannerDuration", {
      name: "Abraçado Pelo Destino: Duração do Banner (ms)",
      hint: "Tempo de exibição do banner e partículas na tela antes de desaparecer.",
      scope: "client",
      config: true,
      type: Number,
      default: 4000,
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
        <h1 class="et-abracado-title">O DESTINO ABRAÇA</h1>
        <div class="et-abracado-divider"></div>
        <p class="et-abracado-subtitle">O acaso sorriu para você.</p>
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
   * Exibe o banner cinemático e as partículas na tela local.
   */
  public showBanner(actorName: string, hasLuck: boolean, faceName: string = hasLuck ? "Cara" : "Coroa"): void {
    if (!this.overlayEl) this.injectOverlayDOM();
    if (!this.overlayEl || !this.canvasEl) return;

    const duration = (game.settings as any)?.get(MODULE_ID, "abracadoBannerDuration") || 4000;
    const soundPath = hasLuck
      ? (game.settings as any)?.get(MODULE_ID, "abracadoSoundLuck")
      : (game.settings as any)?.get(MODULE_ID, "abracadoSoundEmpty");

    // Limpa estado anterior se houver
    if (this.hideTimer) {
      window.clearTimeout(this.hideTimer);
      this.hideTimer = null;
    }
    this.canvasController?.stop();
    this.canvasController = null;

    // Atualiza classes do overlay
    this.overlayEl.classList.remove("luck", "empty");
    this.overlayEl.classList.add(hasLuck ? "luck" : "empty");

    // Configura textos e crista
    if (this.crestIconEl) {
      this.crestIconEl.textContent = hasLuck ? "🍀" : "✕";
    }

    if (this.titleEl) {
      this.titleEl.textContent = hasLuck
        ? `O DESTINO ABRAÇA: ${actorName.toUpperCase()}`
        : `O ACASO É INDIFERENTE: ${actorName.toUpperCase()}`;
    }

    if (this.subtitleEl) {
      this.subtitleEl.textContent = hasLuck
        ? `A moeda caiu em ${faceName}! O acaso sorriu para ${actorName}. +1 em ataques e testes!`
        : `A moeda caiu em ${faceName}. O destino permanece em silêncio para ${actorName}.`;
    }

    // Inicia partículas correspondentes no Canvas
    this.canvasController = startAbracadoCanvas(this.canvasEl, hasLuck ? "luck" : "empty");

    // Toca o áudio temático
    if (soundPath) {
      playAbracadoSound(soundPath);
    }

    // Revela overlay
    this.overlayEl.classList.add("et-active");

    this.hideTimer = window.setTimeout(() => {
      this.overlayEl?.classList.remove("et-active");
      this.canvasController?.stop();
      this.canvasController = null;
      this.hideTimer = null;
    }, duration);
  }

  /**
   * Dispara o banner para todos os clientes conectados.
   */
  public broadcastBanner(actorName: string, hasLuck: boolean, faceName: string, sceneId?: string): void {
    const payload: AbracadoSocketPayload = {
      action: SOCKET_ACTION_ABRACADO,
      sceneId,
      actorName,
      hasLuck,
      faceName,
    };

    // Exibe imediatamente para o cliente local
    this.showBanner(actorName, hasLuck, faceName);

    // Envia aos outros clientes via socket
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

  /**
   * Aplica ou remove o bônus de Sorte de Calax no ator.
   */
  private async applyMechanicalEffect(actor: any, hasLuck: boolean): Promise<void> {
    const dfreds = (game as any).dfreds;

    if (hasLuck) {
      // 1. Tenta DFreds Convenient Effects
      let dfredsSuccess = false;
      if (dfreds?.effectInterface) {
        try {
          await dfreds.effectInterface.addEffect({ effectName: EFFECT_NAME, uuid: actor.uuid });
          dfredsSuccess = true;
        } catch {
          dfredsSuccess = false;
        }
      }

      // 2. Se DFreds não existir ou falhar, fallback para ActiveEffect nativo
      if (!dfredsSuccess) {
        const existing = actor.effects?.find(
          (e: any) => e.name === EFFECT_NAME || e.label === EFFECT_NAME
        );
        if (!existing) {
          await actor.createEmbeddedDocuments("ActiveEffect", [
            {
              name: EFFECT_NAME,
              icon: "icons/sundries/gaming/dice-runed-brown.webp",
              changes: [
                { key: "system.bonuses.mwak.attack", mode: 2, value: "+1", priority: 20 },
                { key: "system.bonuses.rwak.attack", mode: 2, value: "+1", priority: 20 },
                { key: "system.bonuses.msak.attack", mode: 2, value: "+1", priority: 20 },
                { key: "system.bonuses.rsak.attack", mode: 2, value: "+1", priority: 20 },
                { key: "system.bonuses.abilities.check", mode: 2, value: "+1", priority: 20 },
              ],
              flags: {
                "endless-tower": { isAbracadoEffect: true },
              },
            },
          ]);
        }
      }
    } else {
      // Remoção do bônus
      if (dfreds?.effectInterface) {
        try {
          await dfreds.effectInterface.removeEffect({ effectName: EFFECT_NAME, uuid: actor.uuid });
        } catch {
          // Segue para limpeza nativa
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

  /**
   * Gera o card público estilizado no chat com lore de Calax.
   */
  private async createChatMessage(actor: any, hasLuck: boolean, faceName: string): Promise<void> {
    const outcomeBadge = hasLuck
      ? `<span class="et-card-badge luck">🪙 Moeda de Calax: ${faceName} • Sorte</span>`
      : `<span class="et-card-badge empty">🪙 Moeda de Calax: ${faceName} • Neutro</span>`;

    const outcomeTitle = hasLuck ? "O Destino Abraça" : "O Acaso é Indiferente";
    const outcomeIcon = hasLuck ? "🍀" : "✦";

    const bodyText = hasLuck
      ? `A moeda caiu em <b>${faceName}</b>! O destino sorri para <b>${actor.name}</b>. Você recebe um bônus de <b>+1</b> em todas as suas jogadas de ataque e testes de habilidade até o fim deste combate!`
      : `A moeda caiu em <b>${faceName}</b>. O acaso permanece em silêncio para <b>${actor.name}</b>. Nenhum bônus foi concedido desta vez.`;

    const chatContent = `
      <div class="et-abracado-chat-card ${hasLuck ? "luck" : "empty"}">
        <div class="et-card-header">
          <div class="et-card-title">
            <span>${outcomeIcon}</span>
            <span>Bênção de Calax: ${outcomeTitle}</span>
          </div>
          ${outcomeBadge}
        </div>
        <div class="et-card-lore">
          <em>"Calax não escolhe favoritos, ele apenas distribui as cartas. No início de cada conflito, a moeda é lançada ao vento..."</em>
        </div>
        <div class="et-card-roll-result">
          Resultado da Moeda: <b>${faceName}</b> ${hasLuck ? "🍀 (O Destino o abraça!)" : "✦ (O Acaso é indiferente)"}
        </div>
        <div class="et-card-body">
          ${bodyText}
        </div>
      </div>
    `;

    await ChatMessage.create({
      speaker: ChatMessage.getSpeaker({ actor }),
      content: chatContent,
      flavor: "Bênção de Calax: Abraçado pelo Destino",
    } as any);
  }

  /**
   * Adiciona um combatente à fila de processamento da bênção.
   */
  public enqueue(participant: QueuedParticipant): void {
    this.queue.push(participant);
    if (!this.isProcessingQueue) {
      this.processQueue();
    }
  }

  /**
   * Processa sequencialmente a fila (FIFO) garantindo que cada personagem
   * tenha sua rolagem 3D e banner exibidos sem conflito.
   */
  private async processQueue(): Promise<void> {
    if (this.queue.length === 0) {
      this.isProcessingQueue = false;
      return;
    }

    this.isProcessingQueue = true;
    const current = this.queue.shift()!;
    const { actor, sceneId } = current;

    try {
      // 1. Rola a moeda oficial 1dc no Dice So Nice (Cara / Coroa)
      const roll = new Roll("1dc");
      await roll.evaluate();

      const dice3d = (game as any).dice3d;
      if (dice3d) {
        // Exibe 3D da moeda e aguarda a conclusão da animação
        await dice3d.showForRoll(roll, game.user, true);
      } else {
        // Pequeno atraso dramático se Dice So Nice não estiver ativo
        await new Promise((resolve) => setTimeout(resolve, 600));
      }

      // No Coin do Foundry: 1 = Cara (Heads), 0 = Coroa (Tails)
      const coinTerm = roll.terms?.find(
        (t: any) => t.constructor?.name === "Coin" || t.denomination === "c"
      );
      const rawResult = coinTerm?.results?.[0]?.result ?? (roll.total === 1 ? 1 : 0);
      const isHeads = rawResult === 1;
      const hasLuck = isHeads; // Cara = Sorte, Coroa = Vazio/Neutro
      const faceName = isHeads ? "Cara" : "Coroa";

      // 2. Transmite e exibe banner cinemático e partículas
      this.broadcastBanner(actor.name, hasLuck, faceName, sceneId);

      // 3. Aplica ou remove efeito mecânico
      await this.applyMechanicalEffect(actor, hasLuck);

      // 4. Emite mensagem pública no chat
      await this.createChatMessage(actor, hasLuck, faceName);

      // 5. Aguarda a duração do banner antes de passar para o próximo combatente da fila
      const bannerDuration = (game.settings as any)?.get(MODULE_ID, "abracadoBannerDuration") || 4000;
      await new Promise((resolve) => setTimeout(resolve, bannerDuration + 400));
    } catch (err) {
      console.error(`${MODULE_TITLE} | Erro ao processar Abraçado Pelo Destino:`, err);
    } finally {
      // Próximo da fila
      this.processQueue();
    }
  }

  private registerHooks(): void {
    // Disparo imediato ao rolar ou re-rolar iniciativa
    Hooks.on("updateCombatant", async (combatant: any, changed: any) => {
      if (!game.users?.activeGM?.isSelf) return;
      if (!("initiative" in changed) || changed.initiative === null || changed.initiative === undefined) return;

      const actor = combatant.actor;
      if (!actor || !actorHasAbracadoBless(actor)) return;

      // Prevenção de disparos duplicados para a mesma iniciativa
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

    // Limpeza de efeitos ao encerrar o combate
    Hooks.on("deleteCombat", async (combat: any) => {
      if (!game.users?.activeGM?.isSelf) return;

      // Esvazia fila pendente do combate encerrado
      this.queue = [];

      for (const combatant of combat.combatants || []) {
        const actor = combatant.actor;
        if (!actor || !actorHasAbracadoBless(actor)) continue;

        // Limpa flag de iniciativa
        await combatant.unsetFlag(MODULE_ID, "abracadoLastInitiative").catch(() => {});

        // Remove o bônus mecânico
        await this.applyMechanicalEffect(actor, false);
      }
    });
  }
}

export function registerAbracadoPeloDestino(): void {
  console.log(`${MODULE_TITLE} | Registrando Abraçado Pelo Destino (Redesign UX/Cinemático)`);
  AbracadoDestinoManager.getInstance().init();
}
