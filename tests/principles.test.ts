import { describe, it, expect } from "vitest";
import * as fs from "node:fs";
import * as path from "node:path";
import {
  AGENTIC_DESIGN_TOKENS,
  COMPONENT_CONTRACTS,
  auditAgenticTokens,
} from "../src/features/design-system/agentic-tokens";

describe("Endless Tower Constitution Principles", () => {
  /**
   * @principle:P-003
   * Decoupling between pure rule logic and Foundry runtime globals (`game`, `canvas`, `Hooks`, `ui`, `ChatMessage`),
   * enforcing Vertical Slices (`config.ts`, `rules.ts`, `adapter.ts`, `index.ts`) across all features.
   */
  it("@principle:P-003 enforces Vertical Slices and pure decoupled rules across all features", () => {
    const rootDir = path.resolve(__dirname, "..");
    const featuresDir = path.join(rootDir, "src/features");
    const entries = fs.readdirSync(featuresDir, { withFileTypes: true });

    // No loose .ts feature files directly under src/features/
    const looseFeatureFiles = entries
      .filter((e) => e.isFile() && e.name.endsWith(".ts"))
      .map((e) => e.name);
    expect(looseFeatureFiles).toEqual([]);

    const featureDirs = entries.filter((e) => e.isDirectory()).map((e) => e.name);
    expect(featureDirs.length).toBeGreaterThanOrEqual(15);

    for (const dirName of featureDirs) {
      const featurePath = path.join(featuresDir, dirName);
      for (const requiredFile of ["config.ts", "rules.ts", "adapter.ts", "index.ts"]) {
        expect(
          fs.existsSync(path.join(featurePath, requiredFile)),
          `Missing ${requiredFile} in src/features/${dirName}`
        ).toBe(true);
      }

      const configContent = fs.readFileSync(path.join(featurePath, "config.ts"), "utf-8");
      expect(configContent, `Missing UI_TEXT export in src/features/${dirName}/config.ts`).toMatch(
        /export\s+const\s+UI_TEXT\b/
      );

      const rulesContent = fs.readFileSync(path.join(featurePath, "rules.ts"), "utf-8");
      expect(
        rulesContent,
        `Foundry global reference found in src/features/${dirName}/rules.ts`
      ).not.toMatch(/\b(game|canvas|Hooks|ui|ChatMessage)\b/);
    }
  });

  /**
   * @principle:P-004
   * Three-tier visual reversibility (Settings, API toggle, and cleanup).
   */
  it("@principle:P-004 visual particle controller provides stop and cleanup listeners", () => {
    const particleModulePath = path.resolve(__dirname, "../src/features/landing-scene/rules.ts");
    const content = fs.readFileSync(particleModulePath, "utf-8");

    expect(content).toContain("cancelAnimationFrame");
    expect(content).toContain("removeEventListener");
  });

  /**
   * @principle:P-005
   * Cinematic Edge-to-Edge Ribbon layout for announcements.
   */
  it("@principle:P-005 cinematic announcements use edge-to-edge ribbon layout", () => {
    const cssPath = path.resolve(__dirname, "../styles/critical-encounter.css");
    const css = fs.readFileSync(cssPath, "utf-8");

    expect(css).toMatch(/width:\s*100vw/);
    expect(css).toMatch(/border-left:\s*none/);
    expect(css).toMatch(/border-right:\s*none/);
    expect(css).toMatch(/backdrop-filter:\s*blur/);
  });

  /**
   * @principle:P-006
   * Standardized HTML structure and balanced DCs for critical tables (DC 15 hits, DC 10 fumble saves).
   */
  it("@principle:P-006 critical tables follow standardized HTML format and balanced DCs", () => {
    const tablesDir = path.resolve(__dirname, "../tables/critical");
    const tableFiles = fs.readdirSync(tablesDir).filter((f) => f.endsWith(".json"));

    expect(tableFiles.length).toBeGreaterThan(0);

    for (const file of tableFiles) {
      const filePath = path.join(tablesDir, file);
      const data = JSON.parse(fs.readFileSync(filePath, "utf-8"));

      expect(data.results.length).toBe(20);

      for (const entry of data.results) {
        expect(entry.description).toMatch(/<h3/);
        expect(entry.description).toMatch(/style=/);

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
   * Agentic Design System governance: W3C DTCG <-> CSS sync, WCAG 2.1, anti-halation, 60-30-10, and anti-box-in-box.
   */
  it("@principle:P-011 Agentic Design System enforces DTCG sync, WCAG 2.1 contrast, 60-30-10 rule, and anti-nesting contracts", () => {
    const rootDir = path.resolve(__dirname, "..");
    const agenticTokensPath = path.join(rootDir, "src/features/design-system/agentic-tokens.ts");
    const agenticContent = fs.readFileSync(agenticTokensPath, "utf-8");

    expect(agenticContent).not.toMatch(/\b(game|canvas|Hooks|ui|ChatMessage)\b/);

    const report = auditAgenticTokens();
    expect(report.violations).toEqual([]);
    expect(report.passed).toBe(true);
    expect(report.checkedContrastCount).toBeGreaterThanOrEqual(10);
    expect(report.checkedAlphaCount).toBeGreaterThanOrEqual(3);

    const fileCache = new Map<string, string>();
    for (const [key, token] of Object.entries(AGENTIC_DESIGN_TOKENS)) {
      if (!fileCache.has(token.sourceFile)) {
        fileCache.set(token.sourceFile, fs.readFileSync(path.join(rootDir, token.sourceFile), "utf-8"));
      }
      const cssText = fileCache.get(token.sourceFile)!;
      const escapedVar = token.cssVar.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      const escapedVal = token.$value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&").replace(/\s+/g, "\\s+");
      const syncRegex = new RegExp(`${escapedVar}:\\s*${escapedVal}\\s*;`, "i");
      expect(cssText, `Token ${key} (${token.cssVar}) out of sync in ${token.sourceFile}`).toMatch(syncRegex);
    }

    const chatCardContract = COMPONENT_CONTRACTS["chat-feature-card"];
    expect(chatCardContract).toBeDefined();
    expect(chatCardContract.maxNestedContainers).toBe(1);

    const abracadoCss = fs.readFileSync(path.join(rootDir, "styles/abracado-destino.css"), "utf-8");
    for (const rule of chatCardContract.requiredRules) {
      expect(abracadoCss).toContain(rule);
    }
  });
});
