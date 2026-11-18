import { describe, it, expect } from "vitest";
import * as fs from "node:fs";
import * as path from "node:path";
import {
  AGENTIC_DESIGN_TOKENS,
  COMPONENT_CONTRACTS,
  auditAgenticTokens,
} from "../src/features/design-system/agentic-tokens";

describe("Princípios da Constituição do Endless Tower", () => {
  /**
   * @principle:P-003
   * Desacoplamento entre lógica de regras e hooks do Foundry.
   * Lógicas puras de cálculo não devem depender de variáveis globais do Foundry (game, canvas, Hooks).
   */
  it("@principle:P-003 Desacoplamento de lógica pura garantido", () => {
    // Exemplo: particle-canvas é uma biblioteca pura desacoplada do Foundry
    const particleModulePath = path.resolve(__dirname, "../src/features/particle-canvas.ts");
    const content = fs.readFileSync(particleModulePath, "utf-8");

    // Verifica que não há referências globais do Foundry no motor puro de partículas
    expect(content).not.toMatch(/\b(game|canvas|Hooks|ui)\b/);
  });

  /**
   * @principle:P-004
   * Reversibilidade visual em três níveis (Settings, API toggle e cleanup).
   */
  it("@principle:P-004 Reversibilidade visual possui método de parada e cleanup", () => {
    const particleModulePath = path.resolve(__dirname, "../src/features/particle-canvas.ts");
    const content = fs.readFileSync(particleModulePath, "utf-8");

    // Deve possuir método de cancelamento/parada e remoção de listener
    expect(content).toContain("cancelAnimationFrame");
    expect(content).toContain("removeEventListener");
  });

  /**
   * @principle:P-005
   * Padrão cinemático Edge-to-Edge Ribbon para anúncios épicos.
   */
  it("@principle:P-005 Anúncios cinemáticos utilizam layout edge-to-edge ribbon", () => {
    const cssPath = path.resolve(__dirname, "../styles/critical-encounter.css");
    const css = fs.readFileSync(cssPath, "utf-8");

    // Verifica regras de ribbon 100vw e proibição de bordas laterais
    expect(css).toMatch(/width:\s*100vw/);
    expect(css).toMatch(/border-left:\s*none/);
    expect(css).toMatch(/border-right:\s*none/);
    expect(css).toMatch(/backdrop-filter:\s*blur/);
  });

  /**
   * @principle:P-006
   * Estrutura padronizada e equilíbrio de tabelas críticas (DC 15 para acertos, DC 10 para saves de falha).
   */
  it("@principle:P-006 Tabelas críticas possuem estrutura HTML padronizada e DCs balanceadas", () => {
    const tablesDir = path.resolve(__dirname, "../tables/critical");
    const tableFiles = fs.readdirSync(tablesDir).filter((f) => f.endsWith(".json"));

    expect(tableFiles.length).toBeGreaterThan(0);

    for (const file of tableFiles) {
      const filePath = path.join(tablesDir, file);
      const data = JSON.parse(fs.readFileSync(filePath, "utf-8"));

      // Cada tabela deve ter 20 entradas (faixa 1 a 20)
      expect(data.results.length).toBe(20);

      for (const entry of data.results) {
        // Formato HTML padronizado no chat
        expect(entry.description).toMatch(/<h3/);
        expect(entry.description).toMatch(/style=/);

        // Se contiver CD de teste, deve respeitar DC 15 ou DC 10 (con save)
        const dcMatches = [...entry.description.matchAll(/dc=(\d+)/gi)];
        for (const match of dcMatches) {
          const dc = parseInt(match[1], 10);
          expect([10, 15]).toContain(dc);
        }
      }
    }
  });

  /**
   * @principle:P-011
   * Governança Agêntica do Design System: sincronia W3C DTCG <-> CSS, WCAG 2.1, anti-halaçao, 60-30-10 e anti-box-in-box.
   */
  it("@principle:P-011 Agentic Design System garante sincronia DTCG, contrastes WCAG 2.1, regra 60-30-10 e contratos anti-nesting", () => {
    const rootDir = path.resolve(__dirname, "..");
    const agenticTokensPath = path.join(rootDir, "src/features/design-system/agentic-tokens.ts");
    const agenticContent = fs.readFileSync(agenticTokensPath, "utf-8");

    // Módulo puro compatível com P-003 (sem globais do Foundry)
    expect(agenticContent).not.toMatch(/\b(game|canvas|Hooks|ui)\b/);

    // Guardrails 1, 2 e 3: auditoria matemática determinística
    const report = auditAgenticTokens();
    expect(report.violations).toEqual([]);
    expect(report.passed).toBe(true);
    expect(report.checkedContrastCount).toBeGreaterThanOrEqual(10);
    expect(report.checkedAlphaCount).toBeGreaterThanOrEqual(3);

    // Guardrail de sincronia 1:1 entre registro W3C DTCG e arquivos CSS
    const fileCache = new Map<string, string>();
    for (const [key, token] of Object.entries(AGENTIC_DESIGN_TOKENS)) {
      if (!fileCache.has(token.sourceFile)) {
        fileCache.set(token.sourceFile, fs.readFileSync(path.join(rootDir, token.sourceFile), "utf-8"));
      }
      const cssText = fileCache.get(token.sourceFile)!;
      const escapedVar = token.cssVar.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      const escapedVal = token.$value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&").replace(/\s+/g, "\\s+");
      const syncRegex = new RegExp(`${escapedVar}:\\s*${escapedVal}\\s*;`, "i");
      expect(cssText, `Token ${key} (${token.cssVar}) dessincronizado em ${token.sourceFile}`).toMatch(syncRegex);
    }

    // Guardrail 4: contratos de componente ("1 componente por função") e anti-box-in-box no chat
    const chatCardContract = COMPONENT_CONTRACTS["chat-feature-card"];
    expect(chatCardContract).toBeDefined();
    expect(chatCardContract.maxNestedContainers).toBe(1);

    const abracadoCss = fs.readFileSync(path.join(rootDir, "styles/abracado-destino.css"), "utf-8");
    for (const rule of chatCardContract.requiredRules) {
      expect(abracadoCss).toContain(rule);
    }
  });
});
