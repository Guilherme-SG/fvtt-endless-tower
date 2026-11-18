/**
 * Registry Canônico de Tokens (W3C DTCG) & Contratos Agênticos do Design System.
 * Módulo puro sem dependências globais do Foundry VTT (compatível com P-003 e P-011).
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
  /** Tipo segundo especificação W3C Design Tokens Community Group (DTCG). */
  $type: "color" | "border" | "fontFamily";
  /** Valor canônico exato declarado no arquivo CSS de origem. */
  $value: string;
  /** Intenção de uso e regras semânticas para agentes de código. */
  $description: string;
  /** Nome da CSS Custom Property correspondente. */
  cssVar: string;
  /** Arquivo CSS fonte da verdade para verificação de sincronia 1:1. */
  sourceFile: "styles/design-system/tokens.css" | "styles/design-system/sheets.css";
  /** Papel arquitetural na regra 60-30-10 e hierarquia visual. */
  role: TokenRole;
  /** Cor de superfície pareada em hex para auditoria matemática de contraste WCAG 2.1. */
  pairedSurface?: string;
  /** Contraste mínimo exigido (4.5 AA texto normal, 7.0 AAA, 3.0 SC 1.4.11 controles). */
  wcagMinContrast?: number;
  /** Teto máximo anti-halaçao para evitar efeito modo alto-contraste em sessões longas. */
  wcagMaxContrast?: number;
  /** Opacidade máxima permitida (ex: <= 0.16 para bordas hairline na regra 60-30-10). */
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
 * Extrai o canal alpha de um valor CSS (#hex, rgb(...) ou rgba(...) ou border shorthand).
 */
export function extractAlphaFromCssValue(cssValue: string): number {
  const rgbaMatch = cssValue.match(/rgba\(\s*\d+\s*,\s*\d+\s*,\s*\d+\s*,\s*([0-9]*\.?[0-9]+)\s*\)/i);
  if (rgbaMatch) {
    return parseFloat(rgbaMatch[1]);
  }
  return 1;
}

/**
 * Converte #hex, rgb(...) ou rgba(...) em RGB compósito sobre `backdropHex` quando transparente.
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
    const alpha = rgbaMatch[4] !== undefined ? Math.max(0, Math.min(1, parseFloat(rgbaMatch[4]))) : 1;

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
 * Luminância relativa oficial segundo W3C WCAG 2.1.
 */
export function getRelativeLuminance(rgb: { r: number; g: number; b: number }): number {
  const R = linearizeChannel(rgb.r);
  const G = linearizeChannel(rgb.g);
  const B = linearizeChannel(rgb.b);
  return 0.2126 * R + 0.7152 * G + 0.0722 * B;
}

/**
 * Razão de contraste WCAG 2.1 entre cor de primeiro plano e superfície sólida de fundo, arredondada em 2 casas.
 */
export function getContrastRatio(foreground: string, backgroundHex: string): number {
  const fg = parseColorToRgb(foreground, backgroundHex);
  const bg = parseColorToRgb(backgroundHex, backgroundHex);
  if (!fg || !bg) {
    throw new Error(`Cor inválida para cálculo WCAG: fg="${foreground}", bg="${backgroundHex}"`);
  }
  const l1 = getRelativeLuminance(fg);
  const l2 = getRelativeLuminance(bg);
  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);
  const ratio = (lighter + 0.05) / (darker + 0.05);
  return Math.round(ratio * 100) / 100;
}

/**
 * Catálogo Canônico W3C DTCG de Design Tokens do Endless Tower.
 */
export const AGENTIC_DESIGN_TOKENS: Record<string, AgenticTokenDefinition> = {
  // --- Tokens Globais de Marca e Chat/Banners (`tokens.css`) ---
  "global.text.ivory": {
    $type: "color",
    $value: "#fff8e6",
    $description: "Marfim luminoso para títulos épicos em banners e conteúdo de chat sobre vidro obsidiana.",
    cssVar: "--et-ivory",
    sourceFile: "styles/design-system/tokens.css",
    role: "text-primary",
    pairedSurface: "#100d0b",
    wcagMinContrast: 7.0,
  },
  "global.text.ivoryDim": {
    $type: "color",
    $value: "rgba(255, 248, 230, 0.78)",
    $description: "Marfim atenuado para corpo de texto e citações secundárias em mensagens.",
    cssVar: "--et-ivory-dim",
    sourceFile: "styles/design-system/tokens.css",
    role: "text-secondary",
    pairedSurface: "#100d0b",
    wcagMinContrast: 7.0,
  },
  "global.text.ivoryMuted": {
    $type: "color",
    $value: "rgba(255, 248, 230, 0.62)",
    $description: "Marfim secundário calibrado para atender W3C WCAG 2.1 AA em metadados e rodapés.",
    cssVar: "--et-ivory-muted",
    sourceFile: "styles/design-system/tokens.css",
    role: "text-muted",
    pairedSurface: "#100d0b",
    wcagMinContrast: 4.5,
  },
  "global.accent.gold": {
    $type: "color",
    $value: "#f3e2b0",
    $description: "Ouro celestial para negritos, subtítulos e destaques de hierarquia em chat e modais.",
    cssVar: "--et-gold",
    sourceFile: "styles/design-system/tokens.css",
    role: "text-accent",
    pairedSurface: "#100d0b",
    wcagMinContrast: 4.5,
  },
  "global.accent.goldDeep": {
    $type: "color",
    $value: "#d9b865",
    $description: "Ouro queimado para subtítulos, ícones de destaque e filetes focais.",
    cssVar: "--et-gold-deep",
    sourceFile: "styles/design-system/tokens.css",
    role: "text-accent",
    pairedSurface: "#100d0b",
    wcagMinContrast: 4.5,
  },
  "global.semantic.azure": {
    $type: "color",
    $value: "#7bb5e6",
    $description: "Azul arcano para sussurros privados e notificações arcanas sobre vidro escuro.",
    cssVar: "--et-azure",
    sourceFile: "styles/design-system/tokens.css",
    role: "semantic-accent",
    pairedSurface: "#100d0b",
    wcagMinContrast: 4.5,
  },
  "global.semantic.emerald": {
    $type: "color",
    $value: "#5bc88e",
    $description: "Verde esmeralda para sucesso crítico, cura e bênçãos favoráveis.",
    cssVar: "--et-emerald",
    sourceFile: "styles/design-system/tokens.css",
    role: "semantic-accent",
    pairedSurface: "#100d0b",
    wcagMinContrast: 4.5,
  },
  "global.semantic.amber": {
    $type: "color",
    $value: "#e6a73a",
    $description: "Âmbar para concentração, iniciativa e avisos táticos.",
    cssVar: "--et-amber",
    sourceFile: "styles/design-system/tokens.css",
    role: "semantic-accent",
    pairedSurface: "#100d0b",
    wcagMinContrast: 4.5,
  },

  // --- Tokens das Fichas Endless Tower Sheet (`sheets.css`, Regra 60-30-10 Warm Obsidian) ---
  "sheet.surface.base": {
    $type: "color",
    $value: "#12100e",
    $description: "Superfície recuada base da ficha (Warm Obsidian, evita #000000).",
    cssVar: "--dnd5e-background-alt-1",
    sourceFile: "styles/design-system/sheets.css",
    role: "surface-base",
  },
  "sheet.surface.card": {
    $type: "color",
    $value: "#1d1a16",
    $description: "Camada elevada para cartões de Perícias, Salvaguardas e caixas de conteúdo.",
    cssVar: "--dnd5e-background-card",
    sourceFile: "styles/design-system/sheets.css",
    role: "surface-card",
  },
  "sheet.surface.raised": {
    $type: "color",
    $value: "#26221d",
    $description: "Camada interativa elevada para estado ativo e foco.",
    cssVar: "--dnd5e-color-blue-gray-4",
    sourceFile: "styles/design-system/sheets.css",
    role: "surface-raised",
  },
  "sheet.surface.headerPrimary": {
    $type: "color",
    $value: "#4a1b22",
    $description: "Carmesim profundo para cabeçalhos de listas (Ações, Inventário, Magias).",
    cssVar: "--dnd5e-card-header-1",
    sourceFile: "styles/design-system/sheets.css",
    role: "surface-header",
  },
  "sheet.text.primary": {
    $type: "color",
    $value: "#e6dfd3",
    $description: "Osso quente para valores principais e títulos de itens (WCAG AAA, anti-halaçao <= 15:1).",
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
    $description: "Cinza quente médio para descrições, subtipos e passivas (WCAG AAA / AA+).",
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
    $description: "Muted cinza-pedra calibrado para rótulos e metadados com contraste AA >= 4.5:1.",
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
    $description: "Ouro envelhecido fosco para acentos focais (10% da composição), títulos e proficiência.",
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
    $description: "Ícones e controles de lista em repouso (WCAG 2.1 SC 1.4.11 >= 3.0:1).",
    cssVar: "--item-control-color",
    sourceFile: "styles/design-system/sheets.css",
    role: "control-icon",
    pairedSurface: "#1d1a16",
    wcagMinContrast: 3.0,
  },
  "sheet.control.filterControl": {
    $type: "color",
    $value: "rgba(230, 223, 211, 0.52)",
    $description: "Controles de filtro na barra de busca das fichas (WCAG 2.1 SC 1.4.11 >= 3.0:1).",
    cssVar: "--filter-control-color",
    sourceFile: "styles/design-system/sheets.css",
    role: "control-icon",
    pairedSurface: "#1d1a16",
    wcagMinContrast: 3.0,
  },
  "sheet.border.dark": {
    $type: "border",
    $value: "1px solid rgba(230, 223, 211, 0.08)",
    $description: "Borda estrutural hairline de baixa opacidade (anti-wireframe <= 0.16).",
    cssVar: "--dnd5e-border-dark",
    sourceFile: "styles/design-system/sheets.css",
    role: "border-hairline",
    maxAlpha: 0.16,
  },
  "sheet.border.filigree": {
    $type: "color",
    $value: "rgba(230, 223, 211, 0.11)",
    $description: "Contorno sutil dos blocos filigree-box sem bordas douradas chamativas (anti-wireframe <= 0.16).",
    cssVar: "--filigree-border-color",
    sourceFile: "styles/design-system/sheets.css",
    role: "border-hairline",
    maxAlpha: 0.16,
  },
  "sheet.border.pill": {
    $type: "border",
    $value: "1px solid rgba(230, 223, 211, 0.09)",
    $description: "Contorno discreto de pílulas de sentidos/proficiências (anti-wireframe <= 0.16).",
    cssVar: "--pill-border",
    sourceFile: "styles/design-system/sheets.css",
    role: "border-hairline",
    maxAlpha: 0.16,
  },
};

/**
 * Contratos Canônicos de Componentes ("1 componente por função").
 * Agentes de código devem consultar estes contratos antes de criar ou alterar UI.
 */
export const COMPONENT_CONTRACTS: Record<string, ComponentContract> = {
  "chat-feature-card": {
    id: "chat-feature-card",
    job: "Renderizar conteúdo customizado de feature/bênção dentro de uma .chat-message sem criar card aninhado redundante.",
    selectors: [".et-abracado-chat-card"],
    requiredRules: ["background: transparent", "border: none", "padding: 0.5rem 0.75rem"],
    forbiddenPatterns: ["box-shadow: 0 4px", "border: 1px solid"],
    maxNestedContainers: 1,
    description:
      "A .chat-message já é o container principal no chat. Conteúdos internos usam fundo transparente, divisória hairline e no máximo 1 callout interno (.et-card-roll-result).",
  },
  "cinematic-banner": {
    id: "cinematic-banner",
    job: "Exibir anúncios épicos de chefe, julgamento ou bênção em tela cheia.",
    selectors: [".et-abracado-banner-box", ".et-boss-banner", ".et-banner"],
    requiredRules: ["width: 100vw", "white-space: nowrap", "backdrop-filter: blur"],
    forbiddenPatterns: ["border-left: 1px", "border-right: 1px"],
    maxNestedContainers: 1,
    description: "Sempre edge-to-edge ribbon 100vw sem bordas laterais ou modais centralizados (P-005).",
  },
  "modal-window": {
    id: "modal-window",
    job: "Renderizar janelas e diálogos proprietários da Torre.",
    selectors: [".et-window", ".et-dialog"],
    requiredRules: ["background: var(--et-obsidian-95)", "backdrop-filter: var(--et-blur-md)"],
    forbiddenPatterns: ["^.window-app\\s*\\{", "^.sheet\\s*\\{"],
    maxNestedContainers: 2,
    description: "Escopo estrito às classes .et-window e .et-dialog; proibido estilizar janelas ou fichas globais.",
  },
  "actor-sheet-theme": {
    id: "actor-sheet-theme",
    job: "Fornecer variantes visuais opt-in 'Endless Tower Sheet' (Character e NPC) idênticas em layout ao D&D 5e.",
    selectors: [".dnd5e2.sheet.actor.et-sheet"],
    requiredRules: ["--dnd5e-background-card: #1d1a16", "--color-text-tertiary: #989083"],
    forbiddenPatterns: ["width:", "height:", "padding:", "margin:", "grid-template", "flex-direction:"],
    maxNestedContainers: 2,
    description:
      "Regra 60-30-10 Warm Obsidian com elevação tonal, bordas hairline <= 0.16 e contraste calibrado por WCAG 2.1 AA/AAA.",
  },
  "context-menu": {
    id: "context-menu",
    job: "Harmonizar apenas as cores do #context-menu nativo sem afetar geometria ou ícones de módulos.",
    selectors: ["#context-menu"],
    requiredRules: ["background: var(--et-obsidian-95)"],
    forbiddenPatterns: ["padding:", "min-width:", "font-size:", "#context-menu\\s+li\\.context-item\\s+i"],
    maxNestedContainers: 1,
    description: "Preserva espaçamento vanilla, ícones FontAwesome Brands e cores injetadas por terceiros (ex: DAE).",
  },
};

/**
 * Executa a auditoria matemática determinística dos design tokens (WCAG 2.1, Anti-Halação e 60-30-10).
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

    if (token.pairedSurface && (token.wcagMinContrast !== undefined || token.wcagMaxContrast !== undefined)) {
      checkedContrastCount += 1;
      contrastRatio = getContrastRatio(token.$value, token.pairedSurface);

      if (token.wcagMinContrast !== undefined && contrastRatio < token.wcagMinContrast) {
        passed = false;
        reasons.push(
          `contraste ${contrastRatio}:1 abaixo do mínimo WCAG ${token.wcagMinContrast}:1 sobre ${token.pairedSurface}`
        );
      }

      if (token.wcagMaxContrast !== undefined && contrastRatio > token.wcagMaxContrast) {
        passed = false;
        reasons.push(
          `contraste ${contrastRatio}:1 excede teto anti-halaçao ${token.wcagMaxContrast}:1 sobre ${token.pairedSurface}`
        );
      }
    }

    if (token.maxAlpha !== undefined) {
      checkedAlphaCount += 1;
      alpha = extractAlphaFromCssValue(token.$value);
      if (alpha > token.maxAlpha) {
        passed = false;
        reasons.push(`opacidade ${alpha} acima do teto ${token.maxAlpha} (violação anti-wireframe 60-30-10)`);
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
