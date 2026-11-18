import { describe, it, expect } from "vitest";
import * as fs from "node:fs";
import * as path from "node:path";
import { ChatEnhancer, isAttackRollCriticalOrFumble } from "../src/features/design-system/chat-enhancer";
import { buildUpdatedMidiSaveSettings } from "../src/features/critical-encounter";
import {
  createEndlessTowerSheetClasses,
  ENDLESS_TOWER_SHEET_CLASS,
  ENDLESS_TOWER_SHEET_LABEL,
} from "../src/features/design-system/celestial-sheets";
import {
  AGENTIC_DESIGN_TOKENS,
  COMPONENT_CONTRACTS,
  auditAgenticTokens,
  getContrastRatio,
} from "../src/features/design-system/agentic-tokens";

describe("Endless Tower Design System (Celestial Chronicle)", () => {
  const rootDir = path.resolve(__dirname, "..");
  const read = (relPath: string) => fs.readFileSync(path.join(rootDir, relPath), "utf-8");

  describe("US-001 — Tokens & Tipografia Celestial", () => {
    /**
     * @spec:AC-001
     * Definição e integridade de variáveis CSS canônicas e catálogo W3C DTCG.
     */
    it("@spec:AC-001 possui tokens canônicos de cor, vidro e tipografia definidos e aprovados pelo validador DTCG", () => {
      const tokensCss = read("styles/design-system/tokens.css");
      const designSystemTs = read("src/features/design-system/design-system.ts");

      expect(tokensCss).toMatch(/--et-obsidian/);
      expect(tokensCss).toMatch(/--et-gold/);
      expect(tokensCss).toMatch(/--et-ivory/);
      expect(tokensCss).toMatch(/--et-crimson/);
      expect(tokensCss).toMatch(/--et-font-cinematic/);
      expect(tokensCss).toMatch(/--et-gradient-glass-ribbon/);
      expect(tokensCss).toMatch(/--et-blur/);

      expect(Object.keys(AGENTIC_DESIGN_TOKENS).length).toBeGreaterThanOrEqual(15);
      expect(Object.keys(COMPONENT_CONTRACTS)).toEqual(
        expect.arrayContaining([
          "chat-feature-card",
          "cinematic-banner",
          "modal-window",
          "actor-sheet-theme",
          "context-menu",
        ])
      );
      expect(auditAgenticTokens().passed).toBe(true);
      expect(designSystemTs).toMatch(/auditTokens\(/);
    });

    /**
     * @spec:AC-002
     * Blindagem explícita de ícones FontAwesome contra substituição de fontes (incluindo Brands).
     */
    it("@spec:AC-002 blinda fontes de ícones FontAwesome com prioridade important", () => {
      const buttonsCss = read("styles/design-system/buttons.css");
      const hudCss = read("styles/design-system/hud.css");

      const hasFaShield = (css: string) =>
        /\[class\*=["']fa-["']\].*font-family:.*!important/s.test(css) ||
        /i\.fa.*font-family:.*!important/s.test(css);

      expect(hasFaShield(buttonsCss) || hasFaShield(hudCss)).toBe(true);
      expect(buttonsCss).toMatch(/Font Awesome 6 Brands/);
      expect(buttonsCss).toMatch(/:not\(\.fa-brands\)/);
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

    /**
     * @spec:AC-019
     * Sincronia do DNA da Tela de Login, HUD Foundry v13, chat limpo, Midi-QoL e cantoneiras focais.
     */
    it("@spec:AC-019 sincroniza DNA da tela de login, HUD v13, chat/Midi-QoL sem textura e cantoneiras focais", () => {
      const tokensCss = read("styles/design-system/tokens.css");
      const hudCss = read("styles/design-system/hud.css");
      const landingCss = read("styles/landing.css");
      const sheetsCss = read("styles/design-system/sheets.css");
      const chatCss = read("styles/design-system/chat.css");
      const buttonsCss = read("styles/design-system/buttons.css");

      expect(tokensCss).toMatch(/--et-ink:\s*#3a2c10/);
      expect(tokensCss).toMatch(/--et-gold-satin-top:\s*#fbefc6/);
      expect(tokensCss).toMatch(/--et-gradient-login-btn:/);
      expect(tokensCss).toMatch(/--et-glass-dropdown:/);
      expect(tokensCss).toMatch(/--et-filigree-corner-tl:/);

      expect(getContrastRatio("#3a2c10", "#d9b865")).toBeGreaterThanOrEqual(7.0);

      // HUD Foundry v13 (.ui-control, #scene-controls, #scene-navigation, #sidebar-tabs, #sidebar-content)
      expect(hudCss).toMatch(/#scene-controls/);
      expect(hudCss).toMatch(/#scene-navigation/);
      expect(hudCss).toMatch(/#sidebar-tabs\s+\.ui-control/);
      expect(hudCss).toMatch(/#sidebar-content/);
      expect(hudCss).toMatch(/\.sidebar-tab/);
      expect(hudCss).toMatch(/\.combat-sidebar/);
      expect(hudCss).toMatch(/\.playlists-sidebar/);
      expect(hudCss).toMatch(/\.settings-sidebar/);
      expect(hudCss).toMatch(/--control-bg-color:/);
      expect(landingCss).toMatch(/#scene-controls/);
      expect(landingCss).toMatch(/#scene-navigation/);

      // Chat sem textura cinza manchada, sem caixa dupla, Midi-QoL escuro, Pinned Tabs e Dice Tray
      expect(chatCss).toMatch(/\.chat-message:not\(\.cm-msg\)::before[\s\S]*?display:\s*none\s*!important/);
      expect(chatCss).toMatch(/\.midi-results\s+\.target\.failure/);
      expect(chatCss).toMatch(/\.dice-tray\s+button\.dice-tray__roll/);
      expect(chatCss).toMatch(/\.pinnedchatlog/);

      // Fichas com cantoneiras restritas a blocos principais com título e cantos inferiores
      expect(sheetsCss).toMatch(/filigree-box:has\(>\s*h3\)/);
      expect(sheetsCss).toMatch(/--et-filigree-corner-bl/);
      expect(sheetsCss).toMatch(/pointer-events:\s*none/);

      expect(buttonsCss).toMatch(/var\(--et-gradient-login-btn\)/);
      expect(buttonsCss).toMatch(/var\(--et-ink\)/);

      expect(auditAgenticTokens().passed).toBe(true);
    });
  });

  describe("US-002 — Escopo Estrito de Componentes e Não-Interferência", () => {
    /**
     * @spec:AC-004
     * Fichas de personagem D&D 5e e janelas nativas preservadas sem interferência global,
     * #context-menu apenas em cores e fichas opt-in "Endless Tower Sheet" (.et-sheet).
     */
    it("@spec:AC-004 não aplica estilos universais a .window-app ou .sheet, preserva espaçamento/ícones no #context-menu e registra Endless Tower Sheet (.et-sheet)", () => {
      const windowsCss = read("styles/design-system/windows.css");
      const sheetsCss = read("styles/design-system/sheets.css");
      const bundleCss = read("styles/design-system.css");
      const celestialSheetsTs = read("src/features/design-system/celestial-sheets.ts");

      expect(windowsCss).not.toMatch(/^\.window-app\s*\{/m);
      expect(windowsCss).not.toMatch(/^\.sheet\s*\{/m);
      expect(windowsCss).toMatch(/\.et-window/);
      expect(windowsCss).toMatch(/\.et-dialog/);

      // #context-menu altera somente cores (sem padding, font-size, gap ou cor forçada em ícones de terceiros)
      const contextMenuBlock = windowsCss.slice(
        windowsCss.indexOf("#context-menu {"),
        windowsCss.indexOf("/* --- Global Tooltips"),
      );
      expect(contextMenuBlock).toMatch(/background:\s*var\(--et-obsidian-95\)/);
      expect(contextMenuBlock).not.toMatch(/padding:/);
      expect(contextMenuBlock).not.toMatch(/min-width:/);
      expect(contextMenuBlock).not.toMatch(/font-size:/);
      expect(contextMenuBlock).not.toMatch(/#context-menu\s+li\.context-item\s+i/);

      // Sheets opt-in isoladas em .et-sheet sem afetar .sheet genérico nem alterar layout + contrastes WCAG 2.1 AA
      expect(bundleCss).toMatch(/@import\s+["']\.\/design-system\/sheets\.css["']/);
      expect(sheetsCss).toMatch(/\.dnd5e2\.sheet\.actor\.et-sheet/);
      expect(sheetsCss).not.toMatch(/(?:^|\s)(?:width|height|padding|margin|grid-template|flex-direction):/m);
      expect(sheetsCss).toMatch(/--color-text-tertiary:\s*#989083/);
      expect(sheetsCss).toMatch(/--item-control-color:\s*rgba\(230,\s*223,\s*211,\s*0\.52\)/);
      expect(sheetsCss).toMatch(/--filter-control-color:\s*rgba\(230,\s*223,\s*211,\s*0\.52\)/);

      // Subclasses puras para Character e NPC sem makeDefault: true
      class DummyChar {
        static base = "char";
      }
      class DummyNPC {
        static base = "npc";
      }
      const created = createEndlessTowerSheetClasses({
        CharacterActorSheet: DummyChar,
        NPCActorSheet: DummyNPC,
      });
      expect(created).not.toBeNull();
      expect(Object.getPrototypeOf(created!.CharacterSheetClass)).toBe(DummyChar);
      expect(Object.getPrototypeOf(created!.NPCSheetClass)).toBe(DummyNPC);
      expect(created!.CharacterSheetClass.DEFAULT_OPTIONS.classes).toContain(ENDLESS_TOWER_SHEET_CLASS);
      expect(created!.NPCSheetClass.DEFAULT_OPTIONS.classes).toContain(ENDLESS_TOWER_SHEET_CLASS);
      expect(ENDLESS_TOWER_SHEET_LABEL).toBe("Endless Tower Sheet");
      expect(celestialSheetsTs).toMatch(/makeDefault:\s*false/);
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
     * Botões com escopo estrito .et-btn e compatibilidade com Token Action HUD, YouTube Player e simraki-character-monitor.
     */
    it("@spec:AC-006 botões usam .et-btn e protegem módulos de terceiros (.cm-msg e Token Action HUD)", () => {
      const buttonsCss = read("styles/design-system/buttons.css");
      const hudCss = read("styles/design-system/hud.css");
      const chatCss = read("styles/design-system/chat.css");

      expect(buttonsCss).toMatch(/\.et-btn/);
      expect(buttonsCss).not.toMatch(/^button\s*\{/m);
      expect(hudCss).toMatch(/#token-action-hud/);
      expect(chatCss).toMatch(/\.chat-message:not\(\.cm-msg\)/);
    });
  });

  describe("US-003 — Chat e Cartões de Combate", () => {
    /**
     * @spec:AC-007
     * Legibilidade de texto marfim, negrito dourado, links/ícones, sem truncamento, overflow e preservação de .cm-msg.
     */
    it("@spec:AC-007 garante contraste marfim/dourado, links compactos, contenção de overflow e isolamento de simraki-character-monitor", () => {
      const chatCss = read("styles/design-system/chat.css");
      const windowsCss = read("styles/design-system/windows.css");
      const cardsCss = read("styles/design-system/cards.css");
      const abracadoCss = read("styles/abracado-destino.css");
      const abracadoTs =
        read("src/features/abracado-pelo-destino/rules.ts") +
        read("src/features/abracado-pelo-destino/adapter.ts");
      const chatEnhancerTs = read("src/features/design-system/chat-enhancer.ts");

      // Preservação integral de simraki-character-monitor (.cm-msg):
      // 1) Nenhum seletor .chat-message em chat.css pode omitir :not(.cm-msg)
      const unguardedChatLines = chatCss
        .split("\n")
        .filter((line) => line.includes(".chat-message") && !line.includes(":not(.cm-msg)"));
      expect(unguardedChatLines).toEqual([]);
      expect(chatEnhancerTs).toMatch(/simraki-character-monitor/);
      expect(chatEnhancerTs).toMatch(/cm-msg/);

      // 2) ChatEnhancer retorna antecipadamente sem injetar banner de sussurro em mensagens do simraki-character-monitor
      const addedClasses: string[] = [];
      let insertedBeforeCalled = false;
      const fakeEl = {
        classList: {
          add: (cls: string) => addedClasses.push(cls),
          contains: () => false,
        },
        querySelector: () => null,
        insertBefore: () => {
          insertedBeforeCalled = true;
        },
      } as unknown as HTMLElement;

      (ChatEnhancer.getInstance() as any).enhanceChatMessage(
        {
          flags: { "simraki-character-monitor": { cls: "cm-item-plus" } },
          whisper: ["gmId"],
        },
        fakeEl
      );
      expect(addedClasses).toEqual(["cm-msg"]);
      expect(insertedBeforeCalled).toBe(false);

      expect(chatCss).toMatch(/\.dnd5e\.chat-card/);
      expect(chatCss).toMatch(/\.card-content/);
      expect(chatCss).toMatch(/\.description/);
      expect(chatCss).toMatch(/var\(--et-ivory\)/);
      expect(chatCss).toMatch(/var\(--et-obsidian/);

      // Hierarquia de negrito dourado, links/ícones compactos e filtro do d20 SVG em chat e tooltips
      expect(chatCss).toMatch(/\.card-content strong/);
      expect(chatCss).toMatch(/color:\s*var\(--et-gold\)\s*!important/);
      expect(chatCss).toMatch(/--icon-fill:\s*var\(--et-gold-bright\)\s*!important/);
      expect(chatCss).toMatch(/--dnd5e-roll-icon-filter:/);
      expect(chatCss).toMatch(/\.roll-link-group/);
      expect(chatCss).toMatch(/\.reference-link/);
      expect(chatCss).toMatch(/font-size:\s*0\.9em\s*!important/);
      expect(chatCss).toMatch(/padding:\s*0px\s*3px\s*!important/);
      expect(chatCss).toMatch(/\.roll\.discarded/);
      expect(chatCss).toMatch(/\.message-metadata/);

      expect(windowsCss).toMatch(/\.locked-tooltip/);
      expect(windowsCss).toMatch(/\.dnd5e2-tooltip/);
      expect(windowsCss).toMatch(/--icon-fill:\s*var\(--et-gold-bright\)\s*!important/);
      expect(windowsCss).toMatch(/--dnd5e-roll-icon-filter:/);

      // Header compacto estilo vanilla e remoção do truncamento em cabeçalhos de chat
      expect(chatCss).toMatch(/box-sizing:\s*border-box\s*!important/);
      expect(chatCss).toMatch(/overflow-wrap:\s*anywhere\s*!important/);
      expect(chatCss).toMatch(/\.message-sender \.subtitle[\s\S]*?font-size:\s*0\.68rem\s*!important/);
      expect(cardsCss).toMatch(/\.chat-message \.et-card-title[\s\S]*?white-space:\s*normal/);
      expect(abracadoCss).toMatch(/\.et-abracado-chat-card\s*\{[\s\S]*?background:\s*transparent/);
      expect(abracadoCss).toMatch(/\.et-abracado-chat-card\s*\{[\s\S]*?border:\s*none/);
      expect(abracadoCss).toMatch(/\.et-abracado-chat-card \.et-card-title[\s\S]*?white-space:\s*normal\s*!important/);
      expect(abracadoTs).not.toMatch(/outcomeBadge/);

      // Garante que a cor do jogador não polui o nome do remetente (sem fundo colorido sem contraste)
      expect(chatCss).toMatch(/\.message-sender.*background:\s*transparent\s*!important/s);
      expect(chatEnhancerTs).toMatch(/sender\.style\.removeProperty\(["']background-color["']\)/);

      // Estilização Celestial Chronicle para cards do Monk's Token Bar
      expect(chatCss).toMatch(/\.monks-tokenbar\.chat-card \.card-header h3/);
      expect(chatCss).toMatch(/\.monks-tokenbar\.chat-card \.sheet \.items-list \.items-header/);
      expect(chatCss).toMatch(/\.monks-tokenbar\.chat-card \.card-footer button\.footer-button/);

      // Alternância Monk's Token Bar (mtb) <-> Ripper's Epic Rolls (rer) no Midi-QoL
      const criticalEncounterTs = read("src/features/critical-encounter/adapter.ts");
      const mainTs = read("src/main.ts");
      expect(criticalEncounterTs).toMatch(/toggleRollSystem/);
      expect(criticalEncounterTs).toMatch(/et-roll-system-toggle-btn/);
      expect(criticalEncounterTs).toMatch(/et-dock-roll-system-btn/);
      expect(mainTs).toMatch(/setRollSystem/);
      expect(mainTs).toMatch(/toggleRollSystem/);

      // 1) Alterna Jogadores de mtb -> rer preservando NPCs em "auto"
      expect(
        buildUpdatedMidiSaveSettings(
          { playerRollSaves: "mtb", rollNPCSaves: "auto", rollNPCLinkedSaves: "auto", other: 123 },
          "rer"
        )
      ).toEqual({
        playerRollSaves: "rer",
        rollNPCSaves: "auto",
        rollNPCLinkedSaves: "auto",
        other: 123,
      });

      // 2) Quando NPCs também usam mtb/rer, alternam junto com os jogadores
      expect(
        buildUpdatedMidiSaveSettings(
          { playerRollSaves: "mtb", rollNPCSaves: "mtb", rollNPCLinkedSaves: "mtb" },
          "rer"
        )
      ).toEqual({
        playerRollSaves: "rer",
        rollNPCSaves: "rer",
        rollNPCLinkedSaves: "rer",
      });

      expect(
        buildUpdatedMidiSaveSettings(
          { playerRollSaves: "rer", rollNPCSaves: "rer", rollNPCLinkedSaves: "auto" },
          "mtb"
        )
      ).toEqual({
        playerRollSaves: "mtb",
        rollNPCSaves: "mtb",
        rollNPCLinkedSaves: "auto",
      });
    });

    /**
     * @spec:AC-008
     * Selo de visibilidade não-pública com ícones nativos sem corromper o cabeçalho flexrow.
     */
    it("@spec:AC-008 posiciona selo de visibilidade com ícones nativos sem runa antes do cabeçalho flexrow", () => {
      const chatEnhancerTs = read("src/features/design-system/chat-enhancer.ts");

      expect(chatEnhancerTs).toMatch(/et-whisper-banner/);
      expect(chatEnhancerTs).toMatch(/fa-eye-slash/);
      expect(chatEnhancerTs).toMatch(/fa-user-secret/);
      expect(chatEnhancerTs).toMatch(/fa-user/);
      expect(chatEnhancerTs).not.toMatch(/ᛟ/);
      expect(chatEnhancerTs).not.toMatch(/header\.firstChild/);
    });

    /**
     * @spec:AC-009
     * Crítico/falha restrito a rolagens de ataque d20 e alinhamento lado a lado no Midi-QoL.
     */
    it("@spec:AC-009 restringe crítico e falha a rolagens de ataque e preserva alinhamento das colunas", () => {
      const chatEnhancerTs = read("src/features/design-system/chat-enhancer.ts");
      const chatCss = read("styles/design-system/chat.css");

      expect(chatEnhancerTs).toMatch(/et-chat-critical/);
      expect(chatEnhancerTs).toMatch(/et-chat-fumble/);
      expect(chatEnhancerTs).toMatch(/et-attack-critical/);
      expect(chatEnhancerTs).toMatch(/et-attack-fumble/);
      expect(chatCss).toMatch(/\.et-chat-critical/);
      expect(chatCss).toMatch(/\.et-chat-fumble/);
      expect(chatCss).toMatch(/\.midi-qol-damage-roll \.dice-total/);
      expect(chatCss).toMatch(/align-items:\s*stretch\s*!important/);
      expect(chatCss).toMatch(/margin-top:\s*auto\s*!important/);
      expect(chatCss).toMatch(/flex:\s*3\s+1\s+0\s*!important/);
      expect(chatCss).toMatch(/flex:\s*1\s+1\s+0\s*!important/);

      // 1. Dado de dano 1d6 tirando 1 NUNCA deve ser considerado falha crítica
      expect(
        isAttackRollCriticalOrFumble({
          rolls: [{ options: { type: "damage" }, terms: [{ faces: 6, results: [{ result: 1, active: true }] }] }],
        })
      ).toEqual({ isCritical: false, isFumble: false });

      expect(
        isAttackRollCriticalOrFumble({
          rolls: [{ terms: [{ faces: 6, results: [{ result: 1, active: true }] }] }],
        })
      ).toEqual({ isCritical: false, isFumble: false });

      // 2. Teste de resistência / perícia com 20 ou 1 NUNCA dispara crítico/falha de ataque
      expect(
        isAttackRollCriticalOrFumble({
          flags: { dnd5e: { roll: { type: "save" } } },
          rolls: [{ terms: [{ faces: 20, results: [{ result: 20, active: true }] }] }],
        })
      ).toEqual({ isCritical: false, isFumble: false });

      // 3. Rolagem de ataque d20 com 20 -> Sucesso Crítico; com 1 -> Falha Crítica
      expect(
        isAttackRollCriticalOrFumble({
          flags: { dnd5e: { roll: { type: "attack" } } },
          rolls: [{ terms: [{ faces: 20, results: [{ result: 20, active: true }] }] }],
        })
      ).toEqual({ isCritical: true, isFumble: false });

      expect(
        isAttackRollCriticalOrFumble({
          rolls: [{ terms: [{ faces: 20, results: [{ result: 1, active: true }] }] }],
        })
      ).toEqual({ isCritical: false, isFumble: true });

      // 4. Vantagem onde dado descartado tirou 1 e dado ativo tirou 18 -> NÃO é falha crítica
      expect(
        isAttackRollCriticalOrFumble({
          rolls: [
            {
              terms: [
                {
                  faces: 20,
                  results: [
                    { result: 1, active: false, discarded: true },
                    { result: 18, active: true },
                  ],
                },
              ],
            },
          ],
        })
      ).toEqual({ isCritical: false, isFumble: false });

      // 5. Card Midi-QoL combinado (ataque 1d20 = 16 e dano 1d6 = 1) -> NÃO é falha crítica
      const fakeMidiEl = {
        querySelector: (sel: string) =>
          sel === ".midi-qol-attack-roll"
            ? { querySelector: () => ({ classList: { contains: () => false } }) }
            : null,
      } as unknown as HTMLElement;

      expect(
        isAttackRollCriticalOrFumble(
          {
            rolls: [
              { terms: [{ faces: 20, results: [{ result: 16, active: true }] }] },
              { terms: [{ faces: 6, results: [{ result: 1, active: true }] }] },
            ],
          },
          fakeMidiEl
        )
      ).toEqual({ isCritical: false, isFumble: false });
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
      const chronicleTs = read("src/features/celestial-chronicle/adapter.ts");

      expect(chronicleTs).toMatch(/document\.body\.appendChild/);
      expect(chronicleTs).not.toMatch(/canvas\.stage\.addChild/);
    });

    /**
     * @spec:AC-015
     * Reversibilidade P-004 em três níveis para efeitos visuais dinâmicos.
     */
    it("@spec:AC-015 efeitos dinâmicos suportam toggle e limpeza no canvasTearDown", () => {
      const chronicleTs = read("src/features/celestial-chronicle/adapter.ts");

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
