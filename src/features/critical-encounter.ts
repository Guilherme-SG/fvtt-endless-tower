import { MODULE_ID, MODULE_TITLE } from "../constants";
import criticalCss from "../../styles/critical-encounter.css?inline";

declare const Sequence: any;

const SOCKET_ACTION_BANNER = "CRITICAL_ENCOUNTER_BANNER";

/**
 * Remove acentuação e caracteres especiais para comparação flexível de nomes de tabelas.
 */
function normalizeName(text: string): string {
  return (text || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

/**
 * Localiza uma RollTable no mundo por correspondência flexível.
 */
function findRollTable(targetName: string): any {
  const normTarget = normalizeName(targetName);
  const tables = (game.tables as any)?.contents ?? [];
  return tables.find((t: any) => {
    const norm = normalizeName(t.name);
    return norm === normTarget || norm.includes(normTarget);
  });
}

/**
 * Toca áudio com fallback suave caso Sequencer não esteja ativo.
 */
function playCriticalSound(soundPath: string): void {
  if (!soundPath) return;

  if (typeof Sequence !== "undefined") {
    try {
      new Sequence().sound().file(soundPath).volume(0.85).play();
      return;
    } catch (err) {
      console.warn(`${MODULE_TITLE} | Erro ao tocar som via Sequencer, tentando fallback nativo:`, err);
    }
  }

  // Fallback nativo do Foundry VTT
  try {
    const audioHelper = (foundry as any)?.audio?.AudioHelper ?? (AudioHelper as any);
    if (audioHelper && typeof audioHelper.play === "function") {
      audioHelper.play({ src: soundPath, volume: 0.85, loop: false }, false);
    }
  } catch (err) {
    console.warn(`${MODULE_TITLE} | Falha ao reproduzir áudio de encontro crítico:`, err);
  }
}

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
    console.log(`${MODULE_TITLE} | Julgamento da Torre (Encontros Críticos) inicializado.`);
  }

  /**
   * Injeta os estilos CSS diretamente no <head> para renderização instantânea.
   */
  private injectStyles(): void {
    const styleId = "et-critical-encounter-styles";
    if (document.getElementById(styleId)) return;

    const style = document.createElement("style");
    style.id = styleId;
    style.textContent = criticalCss;
    document.head.appendChild(style);
  }

  /**
   * Registra as configurações do módulo no Foundry.
   */
  private registerSettings(): void {
    const settings = (game.settings as any);
    if (!settings) return;

    settings.register(MODULE_ID, "criticalTitle", {
      name: "Julgamento da Torre: Título do Banner",
      hint: "Título exibido em destaque no banner cinemático ao ativar o encontro crítico.",
      scope: "world",
      config: true,
      type: String,
      default: "JULGAMENTO DA TORRE",
    });

    settings.register(MODULE_ID, "criticalSubtitle", {
      name: "Julgamento da Torre: Subtítulo do Banner",
      hint: "Subtítulo explicativo com o aviso sobre as tabelas de crítico e falha.",
      scope: "world",
      config: true,
      type: String,
      default: "Nenhum golpe será perdoado. Tabelas de Crítico & Falha ativas.",
    });

    settings.register(MODULE_ID, "criticalSound", {
      name: "Julgamento da Torre: Som de Impacto",
      hint: "Caminho do arquivo de som para o anúncio cinemático (compatível com Sequencer e Foundry).",
      scope: "world",
      config: true,
      type: String,
      default: "sounds/combat/epic-start-horn.ogg",
      filePicker: "audio",
    });

    settings.register(MODULE_ID, "criticalBannerDuration", {
      name: "Julgamento da Torre: Duração do Banner (ms)",
      hint: "Tempo de exibição do banner na tela em milissegundos antes de desaparecer.",
      scope: "client",
      config: true,
      type: Number,
      default: 3800,
    });
  }

  /**
   * Cria o elemento do banner cinemático no DOM se ainda não existir.
   */
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
        <h1 class="et-critical-title">JULGAMENTO DA TORRE</h1>
        <div class="et-critical-divider"></div>
        <p class="et-critical-subtitle">Nenhum golpe será perdoado. Tabelas de Crítico & Falha ativas.</p>
      </div>
    `;

    document.body.appendChild(overlay);
    this.overlayEl = overlay;
    this.titleEl = overlay.querySelector(".et-critical-title");
    this.subtitleEl = overlay.querySelector(".et-critical-subtitle");
  }

  /**
   * Exibe o banner cinemático na tela local e toca o áudio.
   */
  public showBanner(customTitle?: string, customSubtitle?: string, customSound?: string): void {
    if (!this.overlayEl) this.injectOverlayDOM();
    if (!this.overlayEl) return;

    const title = customTitle || (game.settings as any)?.get(MODULE_ID, "criticalTitle") || "JULGAMENTO DA TORRE";
    const subtitle = customSubtitle || (game.settings as any)?.get(MODULE_ID, "criticalSubtitle") || "Nenhum golpe será perdoado. Tabelas de Crítico & Falha ativas.";
    const sound = customSound ?? (game.settings as any)?.get(MODULE_ID, "criticalSound") ?? "sounds/combat/epic-start-horn.ogg";
    const duration = (game.settings as any)?.get(MODULE_ID, "criticalBannerDuration") || 3800;

    if (this.titleEl) this.titleEl.textContent = title;
    if (this.subtitleEl) this.subtitleEl.textContent = subtitle;

    // Toca o som
    playCriticalSound(sound);

    // Ativa overlay
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
   * Dispara o banner via socket com escopo estrito por cena e participantes.
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

    // Exibe imediatamente para o próprio cliente que disparou
    this.showBanner(payload.title, payload.subtitle, payload.sound);

    // Emite para outros clientes conectados
    (game.socket as any)?.emit(`module.${MODULE_ID}`, payload);
  }

  /**
   * Escuta mensagens de socket vindas de outros clientes.
   */
  private registerSocketListener(): void {
    (game.socket as any)?.on(`module.${MODULE_ID}`, (data: any) => {
      if (data?.action !== SOCKET_ACTION_BANNER) return;

      const currentSceneId = (canvas as any)?.scene?.id;
      const combat = (game.combats as any)?.get(data.combatId);

      // Verificação de isolamento: só exibe se o jogador estiver vendo a mesma cena ou pertencer ao combate
      const isViewingScene = currentSceneId && currentSceneId === data.sceneId;
      const controlsParticipant = combat?.combatants?.some((c: any) => c.actor?.isOwner);

      if (game.user?.isGM || isViewingScene || controlsParticipant) {
        this.showBanner(data.title, data.subtitle, data.sound);
      }
    });
  }

  /**
   * Registra os hooks de interface (Combat Tracker, Carousel Dock e Ataques).
   */
  private registerHooks(): void {
    // 1. Injeta botão e badge no Combat Tracker padrão
    Hooks.on("renderCombatTracker", (app: any, html: any) => {
      this.handleCombatTrackerRender(app, html);
      this.syncCombatDock(app.viewed ?? game.combat);
    });

    // 2. Compatibilidade com Carousel Combat Tracker (combat-tracker-dock)
    Hooks.on("renderCombatDock", (_app: any, _html: any) => {
      this.syncCombatDock();
    });

    Hooks.on("renderApplication", (app: any) => {
      if (app?.constructor?.name === "CombatDock") {
        this.syncCombatDock();
      }
    });

    // 3. Atualização de combate (sincroniza badges e botões em tempo real)
    Hooks.on("updateCombat", (combat: any) => {
      this.syncCombatDock(combat);
      (ui as any)?.combat?.render?.();
    });

    Hooks.on("canvasReady", () => {
      this.syncCombatDock();
    });

    // 4. Observador DOM para garantir que o CombatDock receba o botão/badge sempre que for montado
    this.setupDockObserver();

    // 5. Monitoramento de Ataques via Midi-QoL (captura imediata no ataque, independente de acerto ou dano)
    Hooks.on("midi-qol.AttackRollComplete", (workflow: any) => {
      this.handleAttackWorkflow(workflow);
    });

    Hooks.on("midi-qol.RollComplete", (workflow: any) => {
      this.handleAttackWorkflow(workflow);
    });

    // 6. Limpeza de combate ao deletar
    Hooks.on("deleteCombat", (combat: any) => {
      if (combat?.id) {
        this.cleanupCombat(combat.id);
      }
    });
  }

  /**
   * Observa adições ao DOM do #combat-dock para injeção confiável.
   */
  private setupDockObserver(): void {
    const observer = new MutationObserver(() => {
      if (document.querySelector(".combat-dock, #combat-dock")) {
        this.syncCombatDock();
      }
    });

    observer.observe(document.body, { childList: true, subtree: true });
  }

  /**
   * Injeta o botão e badge de status no Combat Tracker padrão.
   */
  private handleCombatTrackerRender(app: any, html: any): void {
    const root: HTMLElement = html instanceof HTMLElement ? html : html?.[0];
    if (!root) return;

    const combat = app.viewed ?? (game.combats as any)?.viewed ?? game.combat;
    if (!combat) return;

    const isCritical = Boolean(combat.getFlag(MODULE_ID, "criticalEncounter"));
    const title = (game.settings as any)?.get(MODULE_ID, "criticalTitle") || "JULGAMENTO DA TORRE";

    // Insere o botão de alternância no cabeçalho se o usuário for GM
    if (game.user?.isGM) {
      const headerControls =
        root.querySelector("nav.encounters") ||
        root.querySelector(".encounter-controls") ||
        root.querySelector("header.combat-tracker-header") ||
        root.querySelector(".combat-tracker-header");

      if (headerControls && !headerControls.querySelector(".et-critical-toggle-btn")) {
        const toggleBtn = document.createElement("button");
        toggleBtn.type = "button";
        toggleBtn.className = `inline-control icon fa-solid fa-skull et-critical-toggle-btn ${isCritical ? "active" : ""}`;
        toggleBtn.setAttribute(
          "title",
          isCritical
            ? `${title}: ATIVO (Clique para desativar)`
            : `Ativar ${title} (Encontro Crítico)`
        );

        toggleBtn.addEventListener("click", async (ev) => {
          ev.preventDefault();
          ev.stopPropagation();
          await this.toggleCriticalEncounter(combat);
        });

        // Adiciona ao início dos controles de encontro
        headerControls.prepend(toggleBtn);
      } else if (headerControls) {
        // Atualiza estado se já existia
        const existingBtn = headerControls.querySelector(".et-critical-toggle-btn");
        if (existingBtn) {
          existingBtn.className = `inline-control icon fa-solid fa-skull et-critical-toggle-btn ${isCritical ? "active" : ""}`;
          existingBtn.setAttribute(
            "title",
            isCritical
              ? `${title}: ATIVO (Clique para desativar)`
              : `Ativar ${title} (Encontro Crítico)`
          );
        }
      }
    }

    // Insere o Badge sutil se o modo estiver ativo
    const existingBadge = root.querySelector(".et-critical-encounter-badge");
    if (isCritical) {
      if (!existingBadge) {
        const badge = document.createElement("div");
        badge.className = "et-critical-encounter-badge";
        badge.innerHTML = `<i class="fas fa-skull-crossbones"></i> <span>${title}</span>`;

        const insertionPoint = root.querySelector(".combat-tracker-header") || root.querySelector("header") || root;
        insertionPoint.insertAdjacentElement("afterend", badge);
      }
    } else if (existingBadge) {
      existingBadge.remove();
    }
  }

  /**
   * Sincroniza indicador visual e botão de gatilho no Carousel Combat Tracker (combat-tracker-dock).
   */
  public syncCombatDock(combatInstance?: any): void {
    const dockEl = document.querySelector("#combat-dock, .combat-dock") as HTMLElement;
    if (!dockEl) return;

    const combat = combatInstance ?? game.combat;
    if (!combat) return;

    const isCritical = Boolean(combat.getFlag(MODULE_ID, "criticalEncounter"));
    const title = (game.settings as any)?.get(MODULE_ID, "criticalTitle") || "JULGAMENTO DA TORRE";

    // 1. Injeta/atualiza botão nos botões da direita do carousel (apenas GM)
    const rightButtons = dockEl.querySelector(".buttons-container.right");
    if (rightButtons && game.user?.isGM) {
      let dockBtn = rightButtons.querySelector(".et-dock-toggle-btn") as HTMLButtonElement;
      if (!dockBtn) {
        dockBtn = document.createElement("button");
        dockBtn.type = "button";
        dockBtn.className = `icon ui-control fas fa-skull et-dock-toggle-btn ${isCritical ? "active" : ""}`;
        dockBtn.setAttribute(
          "data-tooltip",
          isCritical ? `${title}: ATIVO (Clique para desativar)` : `Ativar ${title} (Encontro Crítico)`
        );

        dockBtn.addEventListener("click", async (ev) => {
          ev.preventDefault();
          ev.stopPropagation();
          await this.toggleCriticalEncounter(combat);
        });

        // Adiciona ao topo dos botões da direita
        rightButtons.prepend(dockBtn);
      } else {
        dockBtn.className = `icon ui-control fas fa-skull et-dock-toggle-btn ${isCritical ? "active" : ""}`;
        dockBtn.setAttribute(
          "data-tooltip",
          isCritical ? `${title}: ATIVO (Clique para desativar)` : `Ativar ${title} (Encontro Crítico)`
        );
      }
    }

    // 2. Injeta/remove o Badge proeminente no topo do Carousel
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
   * Alterna o estado do modo Julgamento da Torre no combate atual.
   */
  public async toggleCriticalEncounter(combat: any): Promise<boolean> {
    if (!combat || !game.user?.isGM) return false;

    const currentState = Boolean(combat.getFlag(MODULE_ID, "criticalEncounter"));
    const newState = !currentState;

    await combat.setFlag(MODULE_ID, "criticalEncounter", newState);

    const title = (game.settings as any)?.get(MODULE_ID, "criticalTitle") || "JULGAMENTO DA TORRE";

    if (newState) {
      // Dispara banner cinemático e som
      this.broadcastBanner(combat);

      // Envia card dramático no chat
      const subtitle = (game.settings as any)?.get(MODULE_ID, "criticalSubtitle") || "Nenhum golpe será perdoado. Tabelas de Crítico & Falha ativas.";
      await ChatMessage.create({
        content: `
          <div class="et-critical-chat-announcement">
            <div class="et-chat-header">
              <i class="fas fa-skull-crossbones"></i>
              <span>${title}</span>
            </div>
            <div class="et-chat-body">
              <p>${subtitle}</p>
              <p style="font-size:0.85rem;margin-top:6px;color:#a99885">
                Todos os Acertos e Falhas Críticas consultarão as Tabelas Decisivas até o encerramento deste confronto.
              </p>
            </div>
          </div>
        `,
        speaker: { alias: "Endless Tower" },
      });
    }

    // Força re-renderização imediata de ambos os trackers
    this.syncCombatDock(combat);
    (ui as any)?.combat?.render?.();
    return newState;
  }

  /**
   * Trata a rolagem de ataque realizada no combate.
   */
  private async handleAttackWorkflow(workflow: any): Promise<void> {
    if (!workflow || !workflow.attackRoll) return;

    // Evita duplicidade de processamento no mesmo workflow
    const workflowId = workflow.id || `${workflow.actor?.id}-${workflow.item?.id}-${Date.now()}`;
    if (this.processedWorkflows.has(workflowId)) return;
    this.processedWorkflows.add(workflowId);

    // Limpa cache antigo se crescer muito
    if (this.processedWorkflows.size > 200) {
      this.processedWorkflows.clear();
    }

    // Localiza o token e verifica o combate específico ao qual ele pertence
    const token =
      workflow.token ||
      (canvas as any)?.tokens?.get(workflow.tokenId) ||
      (workflow.actor ? (canvas as any)?.tokens?.placeables?.find((t: any) => t.actor?.id === workflow.actor.id) : null);

    const combatant = token?.combatant;
    const combat = combatant?.combat;

    // Se o combate não existir ou não estiver com o flag de Julgamento da Torre ativo, ignora completamente
    if (!combat || !combat.getFlag(MODULE_ID, "criticalEncounter")) {
      return;
    }

    // Avalia acerto crítico e falha crítica (fumble)
    // Suporta propriedades nativas do Midi-QoL (fumbleThreshold, tracker, workflow.isFumble) e do D&D 5e
    const isCriticalHit = Boolean(
      workflow.isCritical ||
      workflow.attackRoll?.isCritical ||
      workflow.attackRollModifierTracker?.isCritical ||
      workflow.attackRollModifierTracker?.critical?.isActive ||
      (workflow.attackRoll?.dice?.[0]?.results?.find((r: any) => r.active !== false)?.result === 20)
    );

    const isFumble = Boolean(
      workflow.isFumble ||
      workflow.attackRoll?.isFumble ||
      workflow.attackRollModifierTracker?.isFumble ||
      workflow.attackRollModifierTracker?.fumble?.isActive ||
      (workflow.attackRoll?.dice?.[0]?.results?.find((r: any) => r.active !== false)?.result === 1)
    );

    if (!isCriticalHit && !isFumble) return;

    const actor = workflow.actor || token?.actor;
    const item = workflow.item;
    const actorName = actor?.name || "Personagem";
    const itemName = item?.name || "Ataque";

    if (isCriticalHit) {
      await this.sendCriticalHitCard(actor, item, actorName, itemName);
    } else if (isFumble) {
      await this.sendCriticalFumbleCard(actor, item, actorName, itemName);
    }
  }

  /**
   * Determina a tabela correta e envia o card interativo de Sucesso Crítico.
   */
  private async sendCriticalHitCard(actor: any, item: any, actorName: string, itemName: string): Promise<void> {
    const actionType = item?.system?.actionType;
    const itemType = item?.type;

    let targetTableName = "Sucesso Cortante";

    if (itemType === "spell" || actionType === "msak" || actionType === "rsak") {
      targetTableName = "Sucesso Mágico";
    } else {
      // Analisa o tipo de dano do item
      const parts = item?.system?.damage?.parts ?? [];
      const damageTypes: string[] = parts.map((p: any) => String(p[1] || "").toLowerCase()).filter(Boolean);
      const primaryType = damageTypes[0] || String(item?.system?.damage?.base?.types?.[0] || "").toLowerCase();

      if (primaryType.includes("pierc") || primaryType.includes("perfur")) {
        targetTableName = "Sucesso Perfurante";
      } else if (primaryType.includes("bludg") || primaryType.includes("impact")) {
        targetTableName = "Sucesso Impactante";
      } else if (primaryType.includes("slash") || primaryType.includes("cort")) {
        targetTableName = "Sucesso Cortante";
      } else if (primaryType) {
        targetTableName = "Sucesso Mágico";
      }
    }

    const rollTable = findRollTable(targetTableName);
    const tableNameToUse = rollTable ? rollTable.name : targetTableName;

    await ChatMessage.create({
      content: `
        <div class="et-critical-roll-card nat20">
          <div class="et-roll-header">
            <div class="et-roll-badge">
              <i class="fas fa-skull-crossbones"></i> Julgamento da Torre
            </div>
            <div class="et-roll-main-title">
              <i class="fas fa-crosshairs"></i>
              <span>ACERTO CRÍTICO</span>
            </div>
          </div>
          <div class="et-roll-body">
            <p class="et-roll-narrative">
              <strong>${actorName}</strong> desferiu um golpe decisivo com <em>${itemName}</em>!
            </p>
            <div class="et-roll-table-hint">
              <i class="fas fa-bullseye"></i> Tabela: <strong>${tableNameToUse}</strong>
            </div>
          </div>
          <div class="et-roll-footer">
            <button type="button" class="et-roll-table-btn" 
                    data-action="roll-critical-table" 
                    data-table-name="${tableNameToUse}" 
                    data-actor-id="${actor?.id || ""}">
              <i class="fas fa-dice-d20"></i> Rolar
            </button>
          </div>
        </div>
      `,
      speaker: ChatMessage.getSpeaker({ actor }),
    });
  }

  /**
   * Determina a tabela correta e envia o card interativo de Falha Crítica.
   */
  private async sendCriticalFumbleCard(actor: any, item: any, actorName: string, itemName: string): Promise<void> {
    const actionType = item?.system?.actionType;
    const itemType = item?.type;

    let targetTableName = "Falha Corpo-a-Corpo";

    if (itemType === "spell" || actionType === "msak" || actionType === "rsak") {
      targetTableName = "Falha Mágica";
    } else if (actionType === "rwak" || item?.system?.properties?.has?.("ran")) {
      targetTableName = "Falha a Distância";
    } else if (
      item?.system?.type?.value === "natural" ||
      item?.name?.toLowerCase().includes("desarmad") ||
      item?.name?.toLowerCase().includes("unarmed")
    ) {
      targetTableName = "Falha Desarmada/Arma Natural";
    } else {
      targetTableName = "Falha Corpo-a-Corpo";
    }

    const rollTable = findRollTable(targetTableName);
    const tableNameToUse = rollTable ? rollTable.name : targetTableName;

    await ChatMessage.create({
      content: `
        <div class="et-critical-roll-card nat1">
          <div class="et-roll-header">
            <div class="et-roll-badge">
              <i class="fas fa-skull-crossbones"></i> Julgamento da Torre
            </div>
            <div class="et-roll-main-title">
              <i class="fas fa-skull"></i>
              <span>FALHA CRÍTICA</span>
            </div>
          </div>
          <div class="et-roll-body">
            <p class="et-roll-narrative">
              <strong>${actorName}</strong> cometeu um erro desastroso com <em>${itemName}</em>!
            </p>
            <div class="et-roll-table-hint">
              <i class="fas fa-exclamation-triangle"></i> Tabela: <strong>${tableNameToUse}</strong>
            </div>
          </div>
          <div class="et-roll-footer">
            <button type="button" class="et-roll-table-btn" 
                    data-action="roll-critical-table" 
                    data-table-name="${tableNameToUse}" 
                    data-actor-id="${actor?.id || ""}">
              <i class="fas fa-dice-d20"></i> Rolar
            </button>
          </div>
        </div>
      `,
      speaker: ChatMessage.getSpeaker({ actor }),
    });
  }

  /**
   * Escuta cliques nos botões de rolagem de tabela dentro dos cards de chat.
   */
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

      // Verificação de permissão: Mestre ou dono do ator
      const actor = actorId ? (game.actors as any)?.get(actorId) : null;
      const isOwner = actor ? actor.isOwner : false;
      const isGM = Boolean(game.user?.isGM);

      if (!isGM && !isOwner) {
        (ui as any)?.notifications?.warn("Apenas o Mestre ou o jogador dono deste personagem pode rolar a tabela.");
        return;
      }

      // Busca a RollTable correspondente
      const table = findRollTable(tableName);
      if (!table) {
        (ui as any)?.notifications?.error(`Tabela rollable "${tableName}" não encontrada no mundo! Verifique a pasta de tabelas.`);
        return;
      }

      // Desativa o botão para evitar cliques múltiplos
      btn.disabled = true;
      btn.classList.add("rolled");
      btn.innerHTML = `<i class="fas fa-check"></i> Rolado`;

      // Executa a rolagem oficial da tabela no chat
      try {
        await table.draw();
      } catch (err) {
        console.error(`${MODULE_TITLE} | Erro ao rolar tabela ${tableName}:`, err);
        (ui as any)?.notifications?.error(`Erro ao rolar ${tableName}.`);
        btn.disabled = false;
        btn.classList.remove("rolled");
      }
    });
  }

  /**
   * Limpa recursos quando um combate é deletado.
   */
  private cleanupCombat(combatId: string): void {
    console.log(`${MODULE_TITLE} | Combate ${combatId} finalizado. Estado de Julgamento da Torre limpo.`);
  }
}

export function registerCriticalEncounter(): void {
  CriticalEncounterManager.getInstance().init();
}
