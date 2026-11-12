import { describe, it, expect } from "vitest";
import * as fs from "node:fs";
import * as path from "node:path";

describe("Endless Tower Design System (Celestial Chronicle)", () => {
  const rootDir = path.resolve(__dirname, "..");
  const read = (relPath: string) => fs.readFileSync(path.join(rootDir, relPath), "utf-8");

  describe("US-001 — Tokens & Tipografia Celestial", () => {
    /**
     * @spec:AC-001
     * Definição e integridade de variáveis CSS canônicas.
     */
    it("@spec:AC-001 possui tokens canônicos de cor, vidro e tipografia definidos", () => {
      const tokensCss = read("styles/design-system/tokens.css");

      expect(tokensCss).toMatch(/--et-obsidian/);
      expect(tokensCss).toMatch(/--et-gold/);
      expect(tokensCss).toMatch(/--et-ivory/);
      expect(tokensCss).toMatch(/--et-crimson/);
      expect(tokensCss).toMatch(/--et-font-cinematic/);
      expect(tokensCss).toMatch(/--et-gradient-glass-ribbon/);
      expect(tokensCss).toMatch(/--et-blur/);
    });

    /**
     * @spec:AC-002
     * Blindagem explícita de ícones FontAwesome contra substituição de fontes.
     */
    it("@spec:AC-002 blinda fontes de ícones FontAwesome com prioridade important", () => {
      const buttonsCss = read("styles/design-system/buttons.css");
      const hudCss = read("styles/design-system/hud.css");

      const hasFaShield = (css: string) =>
        /\[class\*=["']fa-["']\].*font-family:.*!important/s.test(css) ||
        /i\.fa.*font-family:.*!important/s.test(css);

      expect(hasFaShield(buttonsCss) || hasFaShield(hudCss)).toBe(true);
    });

    /**
     * @spec:AC-003
     * Isolamento tipográfico de aspas em citações sem colapso faux-italic.
     */
    it("@spec:AC-003 isola aspas de citações em Georgia serif normal para evitar colapso no Chromium", () => {
      const chronicleCss = read("styles/chronicle.css");

      expect(chronicleCss).toMatch(/\.et-quote-mark/);
      expect(chronicleCss).toMatch(/font-style:\s*normal\s*!important/);
      expect(chronicleCss).toMatch(/font-family:.*Georgia.*serif/);
    });
  });

  describe("US-002 — Escopo Estrito de Componentes e Não-Interferência", () => {
    /**
     * @spec:AC-004
     * Fichas de personagem D&D 5e e janelas nativas preservadas sem interferência global.
     */
    it("@spec:AC-004 não aplica estilos universais a .window-app ou .sheet", () => {
      const windowsCss = read("styles/design-system/windows.css");

      expect(windowsCss).not.toMatch(/^\.window-app\s*\{/m);
      expect(windowsCss).not.toMatch(/^\.sheet\s*\{/m);
      expect(windowsCss).toMatch(/\.et-window/);
      expect(windowsCss).toMatch(/\.et-dialog/);
    });

    /**
     * @spec:AC-005
     * Formulários e inputs com escopo estrito .et-input e .et-select.
     */
    it("@spec:AC-005 inputs e selects utilizam classes dedicadas sem afetar Configure Settings nativo", () => {
      const formsCss = read("styles/design-system/forms.css");

      expect(formsCss).toMatch(/\.et-input/);
      expect(formsCss).toMatch(/\.et-select/);
      expect(formsCss).not.toMatch(/^input\[type=["']text["']\]\s*\{/m);
      expect(formsCss).not.toMatch(/^select\s*\{/m);
    });

    /**
     * @spec:AC-006
     * Botões com escopo estrito .et-btn e compatibilidade com Token Action HUD e YouTube Player.
     */
    it("@spec:AC-006 botões usam .et-btn e protegem o Token Action HUD de sobreposição", () => {
      const buttonsCss = read("styles/design-system/buttons.css");
      const hudCss = read("styles/design-system/hud.css");

      expect(buttonsCss).toMatch(/\.et-btn/);
      expect(buttonsCss).not.toMatch(/^button\s*\{/m);
      expect(hudCss).toMatch(/#token-action-hud/);
    });
  });

  describe("US-003 — Chat e Cartões de Combate", () => {
    /**
     * @spec:AC-007
     * Legibilidade de texto marfim sobre cartões escuros Midi-QoL e D&D 5e.
     */
    it("@spec:AC-007 garante cartões de chat Midi-QoL com fundo escuro e texto legível marfim", () => {
      const chatCss = read("styles/design-system/chat.css");

      expect(chatCss).toMatch(/\.dnd5e\.chat-card/);
      expect(chatCss).toMatch(/\.card-content/);
      expect(chatCss).toMatch(/\.description/);
      expect(chatCss).toMatch(/var\(--et-ivory\)/);
      expect(chatCss).toMatch(/var\(--et-obsidian/);
    });

    /**
     * @spec:AC-008
     * Selo de comunicação sigilosa posicionado sem corromper o cabeçalho flexrow.
     */
    it("@spec:AC-008 posiciona selo de sussurro antes do cabeçalho flexrow sem quebrar layout", () => {
      const chatEnhancerTs = read("src/features/design-system/chat-enhancer.ts");

      expect(chatEnhancerTs).toMatch(/et-whisper-banner/);
      expect(chatEnhancerTs).not.toMatch(/header\.firstChild/);
    });

    /**
     * @spec:AC-009
     * Enriquecimento visual para acertos e falhas críticas.
     */
    it("@spec:AC-009 aplica classes visuais distintas para acerto crítico e falha crítica", () => {
      const chatEnhancerTs = read("src/features/design-system/chat-enhancer.ts");
      const chatCss = read("styles/design-system/chat.css");

      expect(chatEnhancerTs).toMatch(/et-chat-critical/);
      expect(chatEnhancerTs).toMatch(/et-chat-fumble/);
      expect(chatCss).toMatch(/\.et-chat-critical/);
      expect(chatCss).toMatch(/\.et-chat-fumble/);
    });
  });

  describe("US-004 — Banners Cinemáticos Souls-like (P-005)", () => {
    /**
     * @spec:AC-010
     * Formato Edge-to-Edge Ribbon de tela inteira sem bordas laterais.
     */
    it("@spec:AC-010 banner cinemático ocupa 100vw com backdrop blur e sem bordas laterais", () => {
      const bannersCss = read("styles/design-system/banners.css");

      expect(bannersCss).toMatch(/width:\s*100vw/);
      expect(bannersCss).toMatch(/border-left:\s*none/);
      expect(bannersCss).toMatch(/border-right:\s*none/);
      expect(bannersCss).toMatch(/backdrop-filter:\s*var\(--et-blur/);
    });

    /**
     * @spec:AC-011
     * Título cinemático em linha única sem quebra de texto.
     */
    it("@spec:AC-011 título do banner cinemático mantém white-space nowrap", () => {
      const bannersCss = read("styles/design-system/banners.css");

      expect(bannersCss).toMatch(/\.et-banner-title/);
      expect(bannersCss).toMatch(/white-space:\s*nowrap/);
    });

    /**
     * @spec:AC-012
     * Fila sequencial FIFO do BannerService sem sobreposição visual.
     */
    it("@spec:AC-012 BannerService possui fila FIFO de exibição para prevenir sobreposição", () => {
      const bannerServiceTs = read("src/features/design-system/banner-service.ts");

      expect(bannerServiceTs).toMatch(/queue/);
      expect(bannerServiceTs).toMatch(/shift\(\)/);
      expect(bannerServiceTs).toMatch(/isShowing/);
    });
  });

  describe("US-005 — Pausa Celestial e Transições de Cena", () => {
    /**
     * @spec:AC-013
     * Barra de pausa com largura intrínseca ajustada e citação centralizada.
     */
    it("@spec:AC-013 barra de pausa possui largura ajustada ao conteúdo e limite máximo equilibrado", () => {
      const chronicleCss = read("styles/chronicle.css");

      expect(chronicleCss).toMatch(/\.et-pause-bar/);
      expect(chronicleCss).toMatch(/width:\s*fit-content/);
      expect(chronicleCss).toMatch(/max-width:\s*min\(580px/);
    });

    /**
     * @spec:AC-014
     * Transição de cena em DOM overlay desacoplada do PixiJS.
     */
    it("@spec:AC-014 transições de cena utilizam contêiner fixo no body desacoplado do PixiJS #board", () => {
      const chronicleTs = read("src/features/celestial-chronicle.ts");

      expect(chronicleTs).toMatch(/document\.body\.appendChild/);
      expect(chronicleTs).not.toMatch(/canvas\.stage\.addChild/);
    });

    /**
     * @spec:AC-015
     * Reversibilidade P-004 em três níveis para efeitos visuais dinâmicos.
     */
    it("@spec:AC-015 efeitos dinâmicos suportam toggle e limpeza no canvasTearDown", () => {
      const chronicleTs = read("src/features/celestial-chronicle.ts");

      expect(chronicleTs).toMatch(/stopQuoteCycling/);
      expect(chronicleTs).toMatch(/remove\(\)/);
    });
  });

  describe("US-006 — Despachante de Áudio de Interface Desacoplado", () => {
    /**
     * @spec:AC-016
     * Remoção total de som de clique genérico de botão e listeners intrusivos.
     */
    it("@spec:AC-016 remove completamente som de clique genérico e listener global de clique", () => {
      const soundEffectsTs = read("src/features/design-system/sound-effects.ts");

      expect(soundEffectsTs).not.toMatch(/document\.addEventListener\(["']click["']/);
      expect(soundEffectsTs).not.toMatch(/playClick/);
    });

    /**
     * @spec:AC-017
     * Reprodução desacoplada de sons de rolagem de dados e stingers de banner.
     */
    it("@spec:AC-017 disponibiliza perfis sonoros desacoplados para rolagens e banners", () => {
      const soundEffectsTs = read("src/features/design-system/sound-effects.ts");

      expect(soundEffectsTs).toMatch(/diceRoll/);
      expect(soundEffectsTs).toMatch(/bannerEncounter/);
      expect(soundEffectsTs).toMatch(/criticalSuccess/);
      expect(soundEffectsTs).toMatch(/criticalFail/);
    });

    /**
     * @spec:AC-018
     * Controle de volume independente e suporte a mute nas configurações.
     */
    it("@spec:AC-018 cálculo de volume respeita limites entre 0 e 1 e silencia quando mutado", () => {
      const soundEffectsTs = read("src/features/design-system/sound-effects.ts");

      expect(soundEffectsTs).toMatch(/Math\.max\(0,\s*Math\.min\(1/);
      expect(soundEffectsTs).toMatch(/isEnabled\(\)/);
    });
  });
});
