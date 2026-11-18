/**
 * Canonical W3C DTCG Token Registry & Agentic Contracts for the Design System.
 * Pure module with zero global runtime dependencies (compatible with P-003 and P-011).
 */

export type TokenRole =
  | "surface-base"
  | "surface-card"
  | "surface-raised"
  | "surface-header"
  | "text-primary"
  | "text-secondary"
  | "text-muted"
  | "text-accent"
  | "control-icon"
  | "border-hairline"
  | "border-focal"
  | "semantic-accent";

export interface AgenticTokenDefinition {
  /** Token type per W3C Design Tokens Community Group (DTCG) specification. */
  $type: "color" | "border" | "fontFamily";
  /** Exact canonical value declared in the source CSS file. */
  $value: string;
  /** Semantic intent and usage guidance for coding agents. */
  $description: string;
  /** Corresponding CSS Custom Property name. */
  cssVar: string;
  /** Source-of-truth CSS file for 1:1 synchronization verification. */
  sourceFile: "styles/design-system/tokens.css" | "styles/design-system/sheets.css";
  /** Architectural role in the 60-30-10 rule and visual hierarchy. */
  role: TokenRole;
  /** Paired surface hex color used for WCAG 2.1 contrast calculation. */
  pairedSurface?: string;
  /** Minimum required contrast (4.5 AA normal text, 7.0 AAA, 3.0 SC 1.4.11 controls). */
  wcagMinContrast?: number;
  /** Maximum anti-halation ceiling to prevent eye strain during long sessions. */
  wcagMaxContrast?: number;
  /** Maximum allowed opacity (e.g., <= 0.16 for hairline borders under 60-30-10). */
  maxAlpha?: number;
}

export interface ComponentContract {
  id: string;
  job: string;
  selectors: string[];
  requiredRules: string[];
  forbiddenPatterns: string[];
  maxNestedContainers: number;
  description: string;
}

export interface TokenAuditResult {
  key: string;
  cssVar: string;
  $value: string;
  sourceFile: string;
  role: TokenRole;
  contrastRatio?: number;
  alpha?: number;
  passed: boolean;
  reason?: string;
}

export interface DesignSystemAuditReport {
  passed: boolean;
  totalTokens: number;
  checkedContrastCount: number;
  checkedAlphaCount: number;
  results: TokenAuditResult[];
  violations: string[];
}

export interface RgbColor {
  r: number;
  g: number;
  b: number;
  alpha: number;
}

function clampByte(n: number): number {
  return Math.max(0, Math.min(255, n));
}

function parseHexColor(hex: string): RgbColor | null {
  const clean = hex.trim().replace(/^#/, "");
  if (clean.length === 3) {
    const r = parseInt(clean[0] + clean[0], 16);
    const g = parseInt(clean[1] + clean[1], 16);
    const b = parseInt(clean[2] + clean[2], 16);
    return { r, g, b, alpha: 1 };
  }
  if (clean.length === 6) {
    const r = parseInt(clean.slice(0, 2), 16);
    const g = parseInt(clean.slice(2, 4), 16);
    const b = parseInt(clean.slice(4, 6), 16);
    return { r, g, b, alpha: 1 };
  }
  return null;
}

/**
 * Extracts the alpha channel from a CSS value (#hex, rgb(...), rgba(...), or border shorthand).
 */
export function extractAlphaFromCssValue(cssValue: string): number {
  const rgbaMatch = cssValue.match(
    /rgba\(\s*\d+\s*,\s*\d+\s*,\s*\d+\s*,\s*([0-9]*\.?[0-9]+)\s*\)/i
  );
  if (rgbaMatch) {
    return parseFloat(rgbaMatch[1]);
  }
  return 1;
}

/**
 * Converts #hex, rgb(...), or rgba(...) into RGB composited over `backdropHex` when translucent.
 */
export function parseColorToRgb(colorStr: string, backdropHex = "#141210"): RgbColor | null {
  const trimmed = colorStr.trim();

  if (trimmed.startsWith("#")) {
    return parseHexColor(trimmed);
  }

  const rgbaMatch = trimmed.match(
    /rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)(?:\s*,\s*([0-9]*\.?[0-9]+))?\s*\)/i
  );
  if (rgbaMatch) {
    const fgR = clampByte(parseInt(rgbaMatch[1], 10));
    const fgG = clampByte(parseInt(rgbaMatch[2], 10));
    const fgB = clampByte(parseInt(rgbaMatch[3], 10));
    const alpha =
      rgbaMatch[4] !== undefined ? Math.max(0, Math.min(1, parseFloat(rgbaMatch[4]))) : 1;

    if (alpha >= 1) {
      return { r: fgR, g: fgG, b: fgB, alpha: 1 };
    }

    const bg = parseHexColor(backdropHex) ?? { r: 20, g: 18, b: 16, alpha: 1 };
    const r = fgR * alpha + bg.r * (1 - alpha);
    const g = fgG * alpha + bg.g * (1 - alpha);
    const b = fgB * alpha + bg.b * (1 - alpha);
    return { r, g, b, alpha };
  }

  return null;
}

function linearizeChannel(channel255: number): number {
  const c = channel255 / 255;
  return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
}

/**
 * Computes official relative luminance per W3C WCAG 2.1.
 */
export function getRelativeLuminance(rgb: { r: number; g: number; b: number }): number {
  const R = linearizeChannel(rgb.r);
  const G = linearizeChannel(rgb.g);
  const B = linearizeChannel(rgb.b);
  return 0.2126 * R + 0.7152 * G + 0.0722 * B;
}

/**
 * Computes WCAG 2.1 contrast ratio between a foreground color and a solid background hex color, rounded to 2 decimals.
 */
export function getContrastRatio(foreground: string, backgroundHex: string): number {
  const fg = parseColorToRgb(foreground, backgroundHex);
  const bg = parseColorToRgb(backgroundHex, backgroundHex);
  if (!fg || !bg) {
    throw new Error(`Invalid color for WCAG calculation: fg="${foreground}", bg="${backgroundHex}"`);
  }
  const l1 = getRelativeLuminance(fg);
  const l2 = getRelativeLuminance(bg);
  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);
  const ratio = (lighter + 0.05) / (darker + 0.05);
  return Math.round(ratio * 100) / 100;
}

/**
 * Canonical W3C DTCG Design Token catalog for Endless Tower.
 */
export const AGENTIC_DESIGN_TOKENS: Record<string, AgenticTokenDefinition> = {
  // --- Global Brand, Chat & Banner Tokens (`tokens.css`) ---
  "global.text.ivory": {
    $type: "color",
    $value: "#fff8e6",
    $description:
      "Luminous ivory for epic banner titles and chat text over obsidian glass.",
    cssVar: "--et-ivory",
    sourceFile: "styles/design-system/tokens.css",
    role: "text-primary",
    pairedSurface: "#100d0b",
    wcagMinContrast: 7.0,
  },
  "global.text.ivoryDim": {
    $type: "color",
    $value: "rgba(255, 248, 230, 0.78)",
    $description: "Dimmed ivory for body copy and secondary quotes in messages.",
    cssVar: "--et-ivory-dim",
    sourceFile: "styles/design-system/tokens.css",
    role: "text-secondary",
    pairedSurface: "#100d0b",
    wcagMinContrast: 7.0,
  },
  "global.text.ivoryMuted": {
    $type: "color",
    $value: "rgba(255, 248, 230, 0.62)",
    $description:
      "Secondary ivory calibrated to meet W3C WCAG 2.1 AA on metadata and footers.",
    cssVar: "--et-ivory-muted",
    sourceFile: "styles/design-system/tokens.css",
    role: "text-muted",
    pairedSurface: "#100d0b",
    wcagMinContrast: 4.5,
  },
  "global.accent.gold": {
    $type: "color",
    $value: "#f3e2b0",
    $description:
      "Celestial gold for bold emphasis, subtitles, and hierarchy highlights in chat and modals.",
    cssVar: "--et-gold",
    sourceFile: "styles/design-system/tokens.css",
    role: "text-accent",
    pairedSurface: "#100d0b",
    wcagMinContrast: 4.5,
  },
  "global.accent.goldDeep": {
    $type: "color",
    $value: "#d9b865",
    $description: "Burnished gold for subtitles, highlight icons, and focal hairlines.",
    cssVar: "--et-gold-deep",
    sourceFile: "styles/design-system/tokens.css",
    role: "text-accent",
    pairedSurface: "#100d0b",
    wcagMinContrast: 4.5,
  },
  "global.accent.goldSatinTop": {
    $type: "color",
    $value: "#fbefc6",
    $description: "Top highlight of the satin gold gradient from the login screen.",
    cssVar: "--et-gold-satin-top",
    sourceFile: "styles/design-system/tokens.css",
    role: "text-accent",
    pairedSurface: "#100d0b",
    wcagMinContrast: 7.0,
  },
  "global.text.ink": {
    $type: "color",
    $value: "#3a2c10",
    $description:
      "Dark imperial ink for text over satin gold login buttons (WCAG AAA >= 7.0:1 over #d9b865).",
    cssVar: "--et-ink",
    sourceFile: "styles/design-system/tokens.css",
    role: "text-primary",
    pairedSurface: "#d9b865",
    wcagMinContrast: 7.0,
    wcagMaxContrast: 15.0,
  },
  "global.semantic.azure": {
    $type: "color",
    $value: "#7bb5e6",
    $description: "Arcane azure for private whispers and arcane notifications over dark glass.",
    cssVar: "--et-azure",
    sourceFile: "styles/design-system/tokens.css",
    role: "semantic-accent",
    pairedSurface: "#100d0b",
    wcagMinContrast: 4.5,
  },
  "global.semantic.emerald": {
    $type: "color",
    $value: "#5bc88e",
    $description: "Emerald green for critical success, healing, and favorable blessings.",
    cssVar: "--et-emerald",
    sourceFile: "styles/design-system/tokens.css",
    role: "semantic-accent",
    pairedSurface: "#100d0b",
    wcagMinContrast: 4.5,
  },
  "global.semantic.amber": {
    $type: "color",
    $value: "#e6a73a",
    $description: "Amber for concentration, initiative, and tactical warnings.",
    cssVar: "--et-amber",
    sourceFile: "styles/design-system/tokens.css",
    role: "semantic-accent",
    pairedSurface: "#100d0b",
    wcagMinContrast: 4.5,
  },

  // --- Endless Tower Sheet Tokens (`sheets.css`, 60-30-10 Warm Obsidian Rule) ---
  "sheet.surface.base": {
    $type: "color",
    $value: "#12100e",
    $description: "Base recessed surface for actor sheets (Warm Obsidian, avoids #000000).",
    cssVar: "--dnd5e-background-alt-1",
    sourceFile: "styles/design-system/sheets.css",
    role: "surface-base",
  },
  "sheet.surface.card": {
    $type: "color",
    $value: "#1d1a16",
    $description: "Elevated layer for Skills, Saving Throws, and content cards.",
    cssVar: "--dnd5e-background-card",
    sourceFile: "styles/design-system/sheets.css",
    role: "surface-card",
  },
  "sheet.surface.raised": {
    $type: "color",
    $value: "#26221d",
    $description: "Interactive raised layer for active and focus states.",
    cssVar: "--dnd5e-color-blue-gray-4",
    sourceFile: "styles/design-system/sheets.css",
    role: "surface-raised",
  },
  "sheet.surface.headerPrimary": {
    $type: "color",
    $value: "#4a1b22",
    $description: "Deep crimson for list headers (Actions, Inventory, Spells).",
    cssVar: "--dnd5e-card-header-1",
    sourceFile: "styles/design-system/sheets.css",
    role: "surface-header",
  },
  "sheet.text.primary": {
    $type: "color",
    $value: "#e6dfd3",
    $description:
      "Warm bone for primary values and item titles (WCAG AAA, anti-halation <= 15:1).",
    cssVar: "--color-text-primary",
    sourceFile: "styles/design-system/sheets.css",
    role: "text-primary",
    pairedSurface: "#1d1a16",
    wcagMinContrast: 7.0,
    wcagMaxContrast: 15.0,
  },
  "sheet.text.secondary": {
    $type: "color",
    $value: "#aca496",
    $description: "Medium warm gray for descriptions, subtypes, and passives (WCAG AAA / AA+).",
    cssVar: "--color-text-secondary",
    sourceFile: "styles/design-system/sheets.css",
    role: "text-secondary",
    pairedSurface: "#1d1a16",
    wcagMinContrast: 6.5,
    wcagMaxContrast: 15.0,
  },
  "sheet.text.tertiaryMuted": {
    $type: "color",
    $value: "#989083",
    $description: "Stone muted gray calibrated for labels and metadata with AA >= 4.5:1 contrast.",
    cssVar: "--color-text-tertiary",
    sourceFile: "styles/design-system/sheets.css",
    role: "text-muted",
    pairedSurface: "#1d1a16",
    wcagMinContrast: 4.5,
    wcagMaxContrast: 15.0,
  },
  "sheet.accent.agedGold": {
    $type: "color",
    $value: "#b89b63",
    $description:
      "Matte aged gold reserved for focal accents (10% of composition), headings, and proficiency.",
    cssVar: "--dnd5e-color-gold",
    sourceFile: "styles/design-system/sheets.css",
    role: "text-accent",
    pairedSurface: "#1d1a16",
    wcagMinContrast: 4.5,
    wcagMaxContrast: 15.0,
  },
  "sheet.control.itemControl": {
    $type: "color",
    $value: "rgba(230, 223, 211, 0.52)",
    $description: "Resting list item control icons (WCAG 2.1 SC 1.4.11 >= 3.0:1).",
    cssVar: "--item-control-color",
    sourceFile: "styles/design-system/sheets.css",
    role: "control-icon",
    pairedSurface: "#1d1a16",
    wcagMinContrast: 3.0,
  },
  "sheet.control.filterControl": {
    $type: "color",
    $value: "rgba(230, 223, 211, 0.52)",
    $description: "Search bar filter control icons on actor sheets (WCAG 2.1 SC 1.4.11 >= 3.0:1).",
    cssVar: "--filter-control-color",
    sourceFile: "styles/design-system/sheets.css",
    role: "control-icon",
    pairedSurface: "#1d1a16",
    wcagMinContrast: 3.0,
  },
  "sheet.border.dark": {
    $type: "border",
    $value: "1px solid rgba(230, 223, 211, 0.08)",
    $description: "Low-opacity structural hairline border (anti-wireframe <= 0.16).",
    cssVar: "--dnd5e-border-dark",
    sourceFile: "styles/design-system/sheets.css",
    role: "border-hairline",
    maxAlpha: 0.16,
  },
  "sheet.border.filigree": {
    $type: "color",
    $value: "rgba(230, 223, 211, 0.11)",
    $description:
      "Subtle contour on filigree-box blocks without loud gold borders (anti-wireframe <= 0.16).",
    cssVar: "--filigree-border-color",
    sourceFile: "styles/design-system/sheets.css",
    role: "border-hairline",
    maxAlpha: 0.16,
  },
  "sheet.border.pill": {
    $type: "border",
    $value: "1px solid rgba(230, 223, 211, 0.09)",
    $description: "Subtle contour for senses/proficiency pills (anti-wireframe <= 0.16).",
    cssVar: "--pill-border",
    sourceFile: "styles/design-system/sheets.css",
    role: "border-hairline",
    maxAlpha: 0.16,
  },
};

/**
 * Canonical Component Contracts ("one component per job").
 * Coding agents must consult these contracts before creating or modifying UI components.
 */
export const COMPONENT_CONTRACTS: Record<string, ComponentContract> = {
  "chat-feature-card": {
    id: "chat-feature-card",
    job: "Render custom feature/blessing content inside a .chat-message without creating a redundant nested box.",
    selectors: [".et-abracado-chat-card"],
    requiredRules: ["background: transparent", "border: none", "padding: 0.5rem 0.75rem"],
    forbiddenPatterns: ["box-shadow: 0 4px", "border: 1px solid"],
    maxNestedContainers: 1,
    description:
      "The .chat-message is already the primary chat container. Inner cards use a transparent background, hairline dividers, and at most 1 inner callout (.et-card-roll-result).",
  },
  "cinematic-banner": {
    id: "cinematic-banner",
    job: "Display fullscreen boss, judgment, or blessing announcements.",
    selectors: [".et-abracado-banner-box", ".et-boss-banner", ".et-banner"],
    requiredRules: ["width: 100vw", "white-space: nowrap", "backdrop-filter: blur"],
    forbiddenPatterns: ["border-left: 1px", "border-right: 1px"],
    maxNestedContainers: 1,
    description:
      "Always an edge-to-edge 100vw ribbon without side borders or centered dialog modals (P-005).",
  },
  "modal-window": {
    id: "modal-window",
    job: "Render Endless Tower owned dialogs and windows.",
    selectors: [".et-window", ".et-dialog"],
    requiredRules: ["background: var(--et-obsidian-95)", "backdrop-filter: var(--et-blur-md)"],
    forbiddenPatterns: ["^.window-app\\s*\\{", "^.sheet\\s*\\{"],
    maxNestedContainers: 2,
    description:
      "Strictly scoped to .et-window and .et-dialog; styling global windows or sheets is forbidden.",
  },
  "actor-sheet-theme": {
    id: "actor-sheet-theme",
    job: "Provide opt-in 'Endless Tower Sheet' (Character and NPC) visual variants layout-identical to D&D 5e.",
    selectors: [".dnd5e2.sheet.actor.et-sheet"],
    requiredRules: ["--dnd5e-background-card: #1d1a16", "--color-text-tertiary: #989083"],
    forbiddenPatterns: ["width:", "height:", "padding:", "margin:", "grid-template", "flex-direction:"],
    maxNestedContainers: 2,
    description:
      "Warm Obsidian 60-30-10 rule with tonal elevation, hairline borders <= 0.16, and WCAG 2.1 AA/AAA calibrated contrast.",
  },
  "context-menu": {
    id: "context-menu",
    job: "Harmonize only the colors of native #context-menu without altering geometry or module icons.",
    selectors: ["#context-menu"],
    requiredRules: ["background: var(--et-obsidian-95)"],
    forbiddenPatterns: ["padding:", "min-width:", "font-size:", "#context-menu\\s+li\\.context-item\\s+i"],
    maxNestedContainers: 1,
    description:
      "Preserves vanilla spacing, FontAwesome Brands icons, and colors injected by third-party modules (e.g., DAE).",
  },
};

/**
 * Runs deterministic mathematical verification of registered design tokens (WCAG 2.1, anti-halation, and 60-30-10).
 */
export function auditAgenticTokens(
  registry: Record<string, AgenticTokenDefinition> = AGENTIC_DESIGN_TOKENS
): DesignSystemAuditReport {
  const results: TokenAuditResult[] = [];
  const violations: string[] = [];
  let checkedContrastCount = 0;
  let checkedAlphaCount = 0;

  for (const [key, token] of Object.entries(registry)) {
    let contrastRatio: number | undefined;
    let alpha: number | undefined;
    let passed = true;
    const reasons: string[] = [];

    if (
      token.pairedSurface &&
      (token.wcagMinContrast !== undefined || token.wcagMaxContrast !== undefined)
    ) {
      checkedContrastCount += 1;
      contrastRatio = getContrastRatio(token.$value, token.pairedSurface);

      if (token.wcagMinContrast !== undefined && contrastRatio < token.wcagMinContrast) {
        passed = false;
        reasons.push(
          `contrast ${contrastRatio}:1 below WCAG minimum ${token.wcagMinContrast}:1 over ${token.pairedSurface}`
        );
      }

      if (token.wcagMaxContrast !== undefined && contrastRatio > token.wcagMaxContrast) {
        passed = false;
        reasons.push(
          `contrast ${contrastRatio}:1 exceeds anti-halation ceiling ${token.wcagMaxContrast}:1 over ${token.pairedSurface}`
        );
      }
    }

    if (token.maxAlpha !== undefined) {
      checkedAlphaCount += 1;
      alpha = extractAlphaFromCssValue(token.$value);
      if (alpha > token.maxAlpha) {
        passed = false;
        reasons.push(
          `alpha ${alpha} exceeds ceiling ${token.maxAlpha} (60-30-10 anti-wireframe violation)`
        );
      }
    }

    const reason = reasons.length > 0 ? reasons.join("; ") : undefined;
    if (!passed && reason) {
      violations.push(`${key} (${token.cssVar}): ${reason}`);
    }

    results.push({
      key,
      cssVar: token.cssVar,
      $value: token.$value,
      sourceFile: token.sourceFile,
      role: token.role,
      contrastRatio,
      alpha,
      passed,
      reason,
    });
  }

  return {
    passed: violations.length === 0,
    totalTokens: results.length,
    checkedContrastCount,
    checkedAlphaCount,
    results,
    violations,
  };
}
