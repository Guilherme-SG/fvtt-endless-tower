import { MODULE_ID, MODULE_TITLE } from "../constants";
import { ChronicleState, Quote } from "../types/chronicle";
import { QuoteManager } from "./quote-manager";
import { ParticleController, startParticleCanvas } from "./particle-canvas";
import chronicleCss from "../../styles/chronicle.css?inline";

export class CelestialChronicle {
  private static instance: CelestialChronicle | null = null;

  private state: ChronicleState = "IDLE";
  private quoteManager: QuoteManager;
  private particleController: ParticleController | null = null;

  // DOM Elements
  private pauseOverlayEl: HTMLElement | null = null;
  private pauseTextEl: HTMLElement | null = null;
  private pauseAuthorEl: HTMLElement | null = null;

  private transitionScreenEl: HTMLElement | null = null;
  private transitionBgEl: HTMLImageElement | null = null;
  private transitionTextEl: HTMLElement | null = null;
  private transitionAuthorEl: HTMLElement | null = null;
  private transitionParticlesEl: HTMLCanvasElement | null = null;

  // Timers & Lifecycle
  private isWorldReady = false;
  private cycleTimer: number | null = null;
  private transitionStartTime = 0;
  private transitionTimeout: number | null = null;
  private isCanvasReady = false;
  private isTransitionRevealing = false;

  private constructor() {
    this.quoteManager = QuoteManager.getInstance();
  }

  public static getInstance(): CelestialChronicle {
    if (!CelestialChronicle.instance) {
      CelestialChronicle.instance = new CelestialChronicle();
    }
    return CelestialChronicle.instance;
  }

  /**
   * Registra configurações e constrói o sistema.
   */
  public init(): void {
    this.injectStyles();
    this.registerSettings();
    this.quoteManager.init();
    this.injectDOM();
    this.registerHooks();
    this.suppressNativePause();
    console.log(`${MODULE_TITLE} | Celestial Chronicle inicializado com sucesso.`);
  }

  /**
   * Injeta o CSS diretamente no <head> para garantir renderização imediata sem depender do reinício do servidor Foundry.
   */
  private injectStyles(): void {
    if (document.getElementById("et-chronicle-styles")) return;
    const styleEl = document.createElement("style");
    styleEl.id = "et-chronicle-styles";
    styleEl.textContent = chronicleCss;
    document.head.appendChild(styleEl);
  }

  /**
   * Oculta de forma permanente o #pause nativo do Foundry para evitar duplicidade com pause-icon ou tidbits.
   */
  public suppressNativePause(): void {
    const pauseEl = document.getElementById("pause");
    if (pauseEl) {
      pauseEl.style.setProperty("display", "none", "important");
    }
  }

  /**
   * Registra as configurações do módulo no Foundry.
   */
  private registerSettings(): void {
    const s = (game as any).settings;

    s.register(MODULE_ID, "chronicleEnableTransitions", {
      name: "Ativar Transições de Cena Cinemáticas",
      hint: "Exibe a tela com arte splash, partículas celestiais e citações ao trocar de cena.",
      scope: "client",
      config: true,
      type: Boolean,
      default: true,
    });

    s.register(MODULE_ID, "chronicleEnablePause", {
      name: "Ativar Modo de Pausa Celestial (Lower-Third)",
      hint: "Substitui o ícone padrão de pausa pelo banner inferior translúcido com runa e citação.",
      scope: "client",
      config: true,
      type: Boolean,
      default: true,
    });

    s.register(MODULE_ID, "chronicleMinDuration", {
      name: "Duração Mínima da Transição (Segundos)",
      hint: "Tempo mínimo que a tela de carregamento permanece visível para permitir leitura (clique na tela para avançar imediatamente).",
      scope: "client",
      config: true,
      type: Number,
      range: {
        min: 1,
        max: 8,
        step: 0.5,
      },
      default: 3,
    });

    s.register(MODULE_ID, "chronicleCycleInterval", {
      name: "Intervalo de Rotação de Citações na Pausa (Segundos)",
      hint: "Tempo entre trocas automáticas de frases durante pausas longas.",
      scope: "client",
      config: true,
      type: Number,
      range: {
        min: 15,
        max: 180,
        step: 5,
      },
      default: 45,
    });

    s.register(MODULE_ID, "chronicleRollTableId", {
      name: "RollTable Personalizada de Citações",
      hint: "Selecione uma RollTable do mundo para usar suas entradas como citações do baralho.",
      scope: "world",
      config: true,
      type: String,
      choices: () => {
        const choices: Record<string, string> = { none: "— Nenhuma (Usar quotes.json padrão) —" };
        const tables = (game as any).tables;
        if (tables) {
          for (const t of tables) {
            choices[t.id] = t.name;
          }
        }
        return choices;
      },
      default: "none",
      onChange: () => {
        this.quoteManager.refreshDeck();
      },
    });

    s.register(MODULE_ID, "chronicleSplashFolder", {
      name: "Pasta de Imagens de Splash (Opcional)",
      hint: "Caminho da pasta com ilustrações para transição (ex: 'modules/endless-tower/assets/screen-transition-splash-art').",
      scope: "world",
      config: true,
      type: String,
      default: "modules/endless-tower/assets/screen-transition-splash-art",
    });

    // Configurações do Easter Egg: Mensagem Secreta com Presente do Mestre
    s.register(MODULE_ID, "chronicleGiftEnabled", {
      name: "Presente do Mestre: Ativar Mensagem Secreta Rara",
      hint: "Ativa o sorteio de uma mensagem secreta com recompensa para o primeiro jogador que encontrá-la.",
      scope: "world",
      config: true,
      type: Boolean,
      default: true,
    });

    s.register(MODULE_ID, "chronicleGiftChance", {
      name: "Presente do Mestre: Probabilidade de Aparição (%)",
      hint: "Porcentagem de chance de exibir a mensagem secreta a cada transição ou rotação (ex: 0.5% = 1 em 200).",
      scope: "world",
      config: true,
      type: Number,
      range: {
        min: 0.1,
        max: 10.0,
        step: 0.1,
      },
      default: 0.5,
    });

    s.register(MODULE_ID, "chronicleGiftMessage", {
      name: "Presente do Mestre: Texto da Mensagem Secreta",
      hint: "Mensagem ou código secreto que o jogador deve enviar ao Mestre. Altere o texto após a recompensa ser resgatada.",
      scope: "world",
      config: true,
      type: String,
      default:
        "Parabéns, esta é uma mensagem super rara! Envie secretamente ao mestre a mensagem a seguir (uso único) e ganhe um presente misterioso: Na minha ilha não entram crianças!",
    });

    s.register(MODULE_ID, "chronicleGiftAuthor", {
      name: "Presente do Mestre: Assinatura da Mensagem",
      hint: "Título ou autor exibido na autoria da mensagem secreta.",
      scope: "world",
      config: true,
      type: String,
      default: "Presente do Mestre",
    });
  }

  /**
   * Constrói e injeta a estrutura DOM unificada no documento.
   */
  private injectDOM(): void {
    if (document.getElementById("et-pause-overlay")) return;

    // 1. Overlay de Pausa (Lower-Third)
    const pauseOverlay = document.createElement("div");
    pauseOverlay.id = "et-pause-overlay";
    pauseOverlay.innerHTML = `
      <div class="et-pause-vignette"></div>
      <div class="et-pause-bar">
        <div class="et-pause-glyph" title="Jogo Pausado">
          <span class="et-rune-sparkle">✧</span>
          <span class="et-rune-bars">||</span>
          <span class="et-rune-sparkle">✧</span>
        </div>
        <div class="et-pause-content">
          <p class="et-quote-text"></p>
          <span class="et-quote-author"></span>
        </div>
      </div>
    `;
    document.body.appendChild(pauseOverlay);

    this.pauseOverlayEl = pauseOverlay;
    this.pauseTextEl = pauseOverlay.querySelector(".et-quote-text");
    this.pauseAuthorEl = pauseOverlay.querySelector(".et-quote-author");

    // 2. Tela de Transição de Cena (Full Splash + Revelation)
    const transitionScreen = document.createElement("div");
    transitionScreen.id = "et-transition-screen";
    transitionScreen.innerHTML = `
      <img class="et-transition-bg" src="" alt="Transição Celestial" />
      <div class="et-transition-overlay"></div>
      <div class="et-transition-rays"></div>
      <canvas id="et-transition-particles"></canvas>
      <div class="et-transition-card">
        <p class="et-quote-text"></p>
        <span class="et-quote-author"></span>
      </div>
      <div class="et-transition-hint">Clique para continuar</div>
    `;
    document.body.appendChild(transitionScreen);

    this.transitionScreenEl = transitionScreen;
    this.transitionBgEl = transitionScreen.querySelector(".et-transition-bg");
    this.transitionTextEl = transitionScreen.querySelector(".et-transition-card .et-quote-text");
    this.transitionAuthorEl = transitionScreen.querySelector(".et-transition-card .et-quote-author");
    this.transitionParticlesEl = transitionScreen.querySelector("#et-transition-particles");

    // Clique na tela permite dispensar antecipadamente se o canvas já estiver pronto
    transitionScreen.addEventListener("click", () => {
      this.handleEarlyDismiss();
    });
  }

  /**
   * Registra os hooks do Foundry para ciclo de vida de pausa e transição de cenas.
   */
  private registerHooks(): void {
    // Força supressão do #pause nativo quando o Foundry tenta renderizá-lo
    Hooks.on("renderGamePause", (_app: any, html: any) => {
      this.suppressNativePause();
      const root = html instanceof HTMLElement ? html : html?.[0];
      if (root) {
        root.style.setProperty("display", "none", "important");
      }
      this.syncPause("renderGamePause");
    });

    // Pausa do jogo (Spacebar / botão / socket)
    Hooks.on("pauseGame", () => {
      this.syncPause("pauseGame");
    });

    // Ao inicializar o mundo (ready)
    Hooks.once("ready", () => {
      this.isWorldReady = true;
      this.ensureDOM();
      this.suppressNativePause();
      this.syncPause("ready");
    });

    // Início de carregamento de cena (apenas transições após o mundo estar carregado)
    Hooks.on("canvasInit", () => {
      this.handleCanvasInit();
    });

    // Fim de carregamento de cena
    Hooks.on("canvasReady", () => {
      this.handleCanvasReady();
    });

    // Extensão da configuração de cena para imagem de splash personalizada
    Hooks.on("renderSceneConfig", (app: any, html: any) => {
      this.injectSceneConfigField(app, html);
    });
  }

  /**
   * Garante a presença dos elementos no DOM caso tenham sido removidos pelo ciclo do Foundry.
   */
  private ensureDOM(): void {
    if (!document.getElementById("et-pause-overlay") || !this.pauseOverlayEl?.isConnected) {
      this.pauseOverlayEl = null;
      this.transitionScreenEl?.remove();
      document.getElementById("et-pause-overlay")?.remove();
      this.injectDOM();
    }
  }

  /**
   * Sincroniza o overlay de pausa com o estado real de `game.paused`.
   * A tela de transição fica acima (z-index maior), então não há sobreposição visual.
   */
  private syncPause(origin = "manual"): void {
    try {
      const paused = Boolean((game as any).paused);
      const enabled = (game as any).settings?.get(MODULE_ID, "chronicleEnablePause") !== false;
      console.log(`${MODULE_TITLE} | syncPause(${origin}) paused=${paused} enabled=${enabled}`);

      if (paused && enabled) {
        if (!this.pauseOverlayEl?.classList.contains("et-active")) {
          this.state = "PAUSED";
          this.showPauseOverlay();
        }
      } else {
        this.state = "IDLE";
        this.hidePauseOverlay();
      }
    } catch (err) {
      console.error(`${MODULE_TITLE} | Erro em syncPause:`, err);
    }
  }

  /**
   * Retorna informações de diagnóstico (use no console: api.chronicle.debug()).
   */
  public debug(): Record<string, unknown> {
    const overlay = document.getElementById("et-pause-overlay");
    const info = {
      paused: (game as any).paused,
      state: this.state,
      worldReady: this.isWorldReady,
      overlayInDom: !!overlay,
      overlayClasses: overlay?.className,
      overlayDisplay: overlay ? getComputedStyle(overlay).display : null,
      overlayOpacity: overlay ? getComputedStyle(overlay).opacity : null,
      overlayZ: overlay ? getComputedStyle(overlay).zIndex : null,
      transitionClasses: this.transitionScreenEl?.className,
      settingEnablePause: (game as any).settings?.get(MODULE_ID, "chronicleEnablePause"),
    };
    console.table(info);
    return info;
  }

  /**
   * Formata a citação com aspas duplas balanceadas em elemento dedicado com glifos clássicos.
   * Evita a distorção da faux-italic do Chromium que funde as aspas de fechamento da Signika.
   */
  private formatQuoteHTML(text: string): string {
    const cleaned = text.replace(/^["“«\s]+|["”»\s]+$/g, "").trim();
    const escaped = cleaned
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;");
    return `<span class="et-quote-mark et-open">“</span><span class="et-quote-body">${escaped}</span><span class="et-quote-mark et-close">”</span>`;
  }

  /**
   * Exibe o banner inferior de pausa com a citação ativa.
   */
  private showPauseOverlay(quote?: Quote): void {
    this.ensureDOM();
    if (!this.pauseOverlayEl) return;

    const currentQuote = quote || this.quoteManager.getNextQuote();

    // Define o texto diretamente e remove qualquer classe residual de fade
    if (this.pauseTextEl && this.pauseAuthorEl) {
      this.pauseTextEl.innerHTML = this.formatQuoteHTML(currentQuote.text);
      this.pauseAuthorEl.textContent = `— ${currentQuote.author.toUpperCase()}`;
    }

    const contentEl = this.pauseOverlayEl.querySelector(".et-pause-content");
    contentEl?.classList.remove("et-fade");

    this.pauseOverlayEl.classList.add("et-active");
    this.startQuoteCycling();
  }

  /**
   * Oculta o banner de pausa e desliga o temporizador de rotação.
   */
  private hidePauseOverlay(): void {
    if (!this.pauseOverlayEl) return;
    this.pauseOverlayEl.classList.remove("et-active");
    this.stopQuoteCycling();
  }

  /**
   * Atualiza o texto da citação no banner de pausa com animação suave de fade.
   */
  private updatePauseQuote(quote: Quote): void {
    if (!this.pauseTextEl || !this.pauseAuthorEl) return;

    const contentEl = this.pauseOverlayEl?.querySelector(".et-pause-content");
    if (contentEl) {
      contentEl.classList.add("et-fade");
      setTimeout(() => {
        if (this.pauseTextEl && this.pauseAuthorEl) {
          this.pauseTextEl.innerHTML = this.formatQuoteHTML(quote.text);
          this.pauseAuthorEl.textContent = `— ${quote.author.toUpperCase()}`;
        }
        contentEl.classList.remove("et-fade");
      }, 350);
    } else {
      this.pauseTextEl.innerHTML = this.formatQuoteHTML(quote.text);
      this.pauseAuthorEl.textContent = `— ${quote.author.toUpperCase()}`;
    }
  }

  /**
   * Inicia o ciclo de rotação de citações durante pausas longas.
   */
  private startQuoteCycling(): void {
    this.stopQuoteCycling();

    const intervalSeconds =
      (game as any).settings?.get(MODULE_ID, "chronicleCycleInterval") || 45;
    const intervalMs = Math.max(15, intervalSeconds) * 1000;

    this.cycleTimer = window.setInterval(() => {
      if (this.state === "PAUSED") {
        const nextQuote = this.quoteManager.getNextQuote();
        this.updatePauseQuote(nextQuote);
      }
    }, intervalMs);
  }

  /**
   * Interrompe o temporizador de rotação.
   */
  private stopQuoteCycling(): void {
    if (this.cycleTimer !== null) {
      clearInterval(this.cycleTimer);
      this.cycleTimer = null;
    }
  }

  /**
   * Acionado quando o canvas começa a carregar uma nova cena.
   */
  private async handleCanvasInit(): Promise<void> {
    if (!this.isWorldReady) return;

    const enableTransitions = (game as any).settings?.get(MODULE_ID, "chronicleEnableTransitions");
    if (!enableTransitions) return;

    const isGamePaused = !!(game as any).paused;
    this.state = isGamePaused ? "TRANSITIONING_PAUSED" : "TRANSITIONING";

    // Garante que o banner de pausa permaneça oculto durante a transição para evitar conflito visual
    if (this.pauseOverlayEl) {
      this.pauseOverlayEl.classList.remove("et-active");
    }

    this.isCanvasReady = false;
    this.isTransitionRevealing = false;
    this.transitionStartTime = Date.now();

    // Determina a imagem de splash da cena atual/destino
    const splashSrc = await this.resolveSplashImage();
    if (this.transitionBgEl && splashSrc) {
      this.transitionBgEl.src = splashSrc;
    }

    // Obtém a próxima citação do baralho para esta transição
    const quote = this.quoteManager.getNextQuote();
    if (this.transitionTextEl && this.transitionAuthorEl) {
      this.transitionTextEl.innerHTML = this.formatQuoteHTML(quote.text);
      this.transitionAuthorEl.textContent = `— ${quote.author.toUpperCase()}`;
    }

    // Exibe a tela de transição
    if (this.transitionScreenEl) {
      this.transitionScreenEl.classList.remove("et-gate-reveal");
      this.transitionScreenEl.classList.add("et-active");
    }

    // Inicia partículas celestiais
    if (this.transitionParticlesEl) {
      this.particleController?.stop();
      this.particleController = startParticleCanvas(this.transitionParticlesEl, 40);
    }
  }

  /**
   * Acionado quando a nova cena termina de renderizar no canvas.
   */
  private handleCanvasReady(): void {
    if (!this.isWorldReady) return;

    this.isCanvasReady = true;

    if (this.state !== "TRANSITIONING" && this.state !== "TRANSITIONING_PAUSED") {
      return;
    }

    const minDurationSeconds =
      (game as any).settings?.get(MODULE_ID, "chronicleMinDuration") || 3;
    const minDurationMs = Math.max(1, minDurationSeconds) * 1000;
    const elapsed = Date.now() - this.transitionStartTime;
    const remaining = Math.max(0, minDurationMs - elapsed);

    if (this.transitionTimeout !== null) {
      clearTimeout(this.transitionTimeout);
    }

    this.transitionTimeout = window.setTimeout(() => {
      this.triggerGateRevelation();
    }, remaining);
  }

  /**
   * Permite que o jogador ou mestre dispense a tela clicando nela, caso a cena já tenha carregado.
   */
  private handleEarlyDismiss(): void {
    if (this.isCanvasReady && !this.isTransitionRevealing) {
      if (this.transitionTimeout !== null) {
        clearTimeout(this.transitionTimeout);
        this.transitionTimeout = null;
      }
      this.triggerGateRevelation();
    }
  }

  /**
   * Executa o efeito de revelação 'Celestial Gate' e faz o handoff para o estado seguinte.
   */
  private triggerGateRevelation(): void {
    if (this.isTransitionRevealing || !this.transitionScreenEl) return;
    this.isTransitionRevealing = true;

    // Dispara a animação radial da revelação
    this.transitionScreenEl.classList.add("et-gate-reveal");

    // Aguarda término da animação para transicionar o estado
    setTimeout(() => {
      this.particleController?.stop();
      this.particleController = null;

      if (this.transitionScreenEl) {
        this.transitionScreenEl.classList.remove("et-active", "et-gate-reveal");
      }

      const isGamePaused = !!(game as any).paused;
      this.state = isGamePaused ? "PAUSED" : "IDLE";
      this.isTransitionRevealing = false;

      // Se o jogo estiver pausado, revela a barra de pausa; caso contrário, nada permanece na tela
      this.pauseOverlayEl?.classList.remove("et-active");
      this.syncPause("transition-end");
    }, 850);
  }

  /**
   * Resolve a imagem de splash adequada para a cena ativa.
   */
  private async resolveSplashImage(): Promise<string> {
    const scenes = (game as any).scenes;
    const activeScene = scenes?.active || scenes?.current;

    // 1. Imagem personalizada configurada na cena
    if (activeScene) {
      const customSceneSplash = activeScene.getFlag(MODULE_ID, "splashImage");
      if (customSceneSplash && typeof customSceneSplash === "string" && customSceneSplash.trim()) {
        return customSceneSplash.trim();
      }
    }

    // 2. Imagens da pasta de splash configurada ou padrão
    const defaultLandscape = "endless-tower/landscape/endless-tower-login-screen.webp";
    try {
      const folder = (game as any).settings?.get(MODULE_ID, "chronicleSplashFolder");
      if (folder && (game as any).user?.isGM) {
        // Tenta buscar arquivos do diretório se disponível
        const fp = new (foundry.applications.apps.FilePicker as any).implementation({
          current: folder,
        });
        const browseResult = await (
          foundry.applications.apps.FilePicker as any
        ).implementation.browse(fp.activeSource, fp.target);
        if (browseResult && browseResult.files && browseResult.files.length > 0) {
          const validImages = browseResult.files.filter((f: string) =>
            /\.(webp|jpg|jpeg|png)$/i.test(f)
          );
          if (validImages.length > 0) {
            const randomIndex = Math.floor(Math.random() * validImages.length);
            return validImages[randomIndex];
          }
        }
      }
    } catch {
      // Ignora erro de browse e recorre à imagem padrão
    }

    return defaultLandscape;
  }

  /**
   * Injeta o campo de seleção de imagem de splash nas configurações da Cena.
   */
  private injectSceneConfigField(app: any, html: any): void {
    const rootEl = html instanceof HTMLElement ? html : html[0];
    if (!rootEl) return;

    const scene = app.document;
    const currentVal = scene?.getFlag(MODULE_ID, "splashImage") || "";

    const formGroup = document.createElement("div");
    formGroup.className = "form-group";
    formGroup.innerHTML = `
      <label>Endless Tower: Imagem de Transição (Splash Art)</label>
      <div class="form-fields">
        <button type="button" class="file-picker" data-type="imagevideo" data-target="flags.${MODULE_ID}.splashImage" title="Procurar Arquivo">
          <i class="fas fa-file-import fa-fw"></i>
        </button>
        <input class="image" type="text" name="flags.${MODULE_ID}.splashImage" placeholder="Ex: endless-tower/landscape/minha-cena.webp" value="${currentVal}">
      </div>
      <p class="notes">Imagem exibida durante a tela de transição celestial ao entrar nesta cena. Se vazia, usa a arte padrão da Torre.</p>
    `;

    // Localiza a aba de Background ou insere na primeira aba
    const targetTab =
      rootEl.querySelector('.tab[data-tab="basic"]') ||
      rootEl.querySelector('.tab[data-tab="background"]') ||
      rootEl.querySelector(".tab.active") ||
      rootEl.querySelector("form");

    if (targetTab) {
      targetTab.appendChild(formGroup);

      // Conecta o FilePicker padrão do Foundry ao botão
      const btn = formGroup.querySelector("button.file-picker");
      const input = formGroup.querySelector('input[name="flags.' + MODULE_ID + '.splashImage"]');
      if (btn && input) {
        btn.addEventListener("click", () => {
          const fp = new (FilePicker as any)({
            type: "imagevideo",
            current: (input as HTMLInputElement).value || "",
            callback: (path: string) => {
              (input as HTMLInputElement).value = path;
            },
          });
          fp.render(true);
        });
      }
    }
  }

  /**
   * Força uma transição manual ou teste de citação para a API pública.
   */
  public triggerManualQuoteCycle(): void {
    const next = this.quoteManager.getNextQuote();
    if (this.state === "PAUSED") {
      this.updatePauseQuote(next);
    }
  }

  /**
   * Alterna a pausa do jogo (acessível via API pública ou macros).
   */
  public togglePause(): void {
    if ((game as any).user?.isGM) {
      (game as any).togglePause(!(game as any).paused, { broadcast: true });
    }
  }
}

export function registerCelestialChronicleFeature(): void {
  CelestialChronicle.getInstance().init();
}
