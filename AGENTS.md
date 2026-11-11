# AGENTS.md — Endless Tower (FoundryVTT Module)

## What this is

FoundryVTT module (v13, D&D 5e) with homebrew blessings, combat sounds, critical tables, and custom effects. Built with TypeScript and Vite.

## World context

**WORLD.md** documents the full FoundryVTT world: all 50+ installed modules, their APIs, and cross-module integration patterns. Consult it before creating new features to know what's available. WORLD.md includes documentation URLs for key modules — fetch them with `webfetch` when you need API details.

## Key files

- `module.json` — Module manifest. Loads `dist/endless-tower.js`.
- `src/` — TypeScript source files (`src/main.ts`, `src/features/*`).
- `dist/endless-tower.js` — Compiled bundle loaded by FoundryVTT.
- `tables/` — Rollable tables (critical hits/fails, "mare de improbabilidade").
- `login/` — Custom Ragnarok-themed login screen (`login.css`, `login.js`) and layout patch script (`apply-login-patch.ps1`).
- `styles/landing.css` — Cinematic Clean UI styles for the in-game Landing Page scene.
- `styles/chronicle.css` — Styles for Celestial Chronicle (Pause mode & Scene Transitions).
- `styles/critical-encounter.css` — Styles for Julgamento da Torre (Souls-like boss banner, encounter badge, critical cards).
- `docs/LANDING_PAGE.md` — Guide and reference for the in-game Landing Page scene.
- `docs/CELESTIAL_CHRONICLE.md` — Guide and reference for the Celestial Chronicle system.
- `assets/fx/ragnarok-online-effects/` — VFX webm files registered via Sequencer.
- `items/` — Single bleeding condition item JSON.

## Build and script workflow

- `npm run dev` — Watch mode with Vite for development (`vite build --watch`).
- `npm run build` — Production build with Vite (`vite build`).

The module exposes its public API at `game.modules.get('endless-tower').api`.

## Runtime dependencies

- `dfreds-convenient-effects` — required. Used in `cemetery-bless.ts`, `sensorial-deturpation.ts`, `abracado-pelo-destino.ts` via `game.dfreds.effectInterface`.
- `sequencer` — used in `ragnarok-animations.ts` and `jump.ts`.
- `midi-qol` — used in `critical-encounter.ts` for distance and attack triggers.
- `fvtt-youtube-player` — optional, used in `play-sounds.ts`.

API quick reference for these modules is in WORLD.md (with documentation URLs).

## Conventions

- **Language**: All comments, UI text, and file names in Brazilian Portuguese.
- **IIFE pattern**: Most scripts wrap in `(() => { ... })()`.
- **Hooks**: Scripts register FoundryVTT hooks (`combatStart`, `deleteCombat`, `canvasReady`, `createToken`, `ready`, `dnd5e.rollInitiative`, `combatTurn`, `updateCombat`, `preUpdateActor`, `dnd5e.restCompleted`).
- **Whisper messages**: Ownership check uses `ownership[id] === 3` (OWNER level).

## Commit workflow (HITL)

Before committing, always:
1. **Stage** the files (`git add`)
2. **Show** the diff (`git diff --cached`)
3. **Propose** the commit message
4. **Ask** the user to confirm before running `git commit`

Never commit without user confirmation.

## Critical hit/fail tables (`tables/critical/`)

Each table is a FoundryVTT RollTable JSON (21 entries, ranges 1–20 + a crit/fail 21). All entry descriptions use a **consistent HTML format**:

```html
<h3 style="text-align:center;border-bottom:2px solid #5a0000;padding-bottom:5px">Title</h3>
<p style="font-style:italic;color:#d9d9d9;background-color:rgba(0, 0, 0, 0.4);padding:10px;border-left:4px solid #8b0000"><em>Flavor text</em></p>
<p>Mechanical text with Foundry notation</p>
<img src="existing_gif" />
```

**Rules when editing/adding entries:**
- Always use this HTML format — no `<b>`, `<br />`, or plain `<p>` for titles.
- `name` field in each entry should be **empty** — the title lives in the `<h3>`.
- Preserve any existing `<img>` tags (GIFs) at the end of descriptions.
- Use Foundry rollable notation: `[[/save con dc=15]]`, `[[/check ath dc=15]]`, `[[/save wis dc=15]]`.
- All DCs are **15** (or 10 for the Con save on crit fail tables).
- Reference conversions: `&amp;Reference[paralyzed]` → `paralisado`, `&amp;Reference[restrained]` → `preso`, `&amp;Reference[grappled]` → `agarrado`, `&amp;Reference[frightened]` → `amedrontado`, `&amp;Reference[incapacitated]` → `incapacitado`, `&amp;Reference[bonusaction]` → `ação bônus`, `&amp;Reference[reaction]` → `reação`.

**Table files:**
- `fvtt-RollTable-sucesso-perfurante-*.json` — Critical hits (piercing)
- `fvtt-RollTable-sucesso-impactante-*.json` — Critical hits (bludgeoning)
- `fvtt-RollTable-sucesso-cortante-*.json` — Critical hits (slashing)
- `fvtt-RollTable-sucesso-magico-*.json` — Magic crits (arcane spell attacks)
- `fvtt-RollTable-falha-magico-*.json` — Magic fails
- `fvtt-RollTable-falha-desarmada_arma-natural-*.json` — Natural weapon fails
- `fvtt-RollTable-falha-corpo-a-corpo-*.json` — Melee fails
- `fvtt-RollTable-falha-a-distancia-*.json` — Ranged fails

**Design intent**: Critical hits/fails should be game-changing but not annoying — memorable moments that turn the tide of combat. No hardcore/hardship-only consequences.

## Login screen & Pre-game architecture (Foundry v13)

The custom login screen (`login/login.css`, `login/login.js`) runs on the `/join` page before a user enters the world.

### Core Architecture & Lifecycle Constraints
- **Module execution scope**: Standard Foundry modules only load after world login (`game.ready`), not on `/join`. Pre-game assets are injected into Foundry's layout via `login/apply-login-patch.ps1` (`templates\views\layouts\setup.hbs`).
- **World sanitization**: Foundry runs `sanitize-html` (`ALLOWED_HTML_TAGS` in `constants.mjs`) on `world.description` on save/shutdown, stripping `<script>` and `<style>`. Never rely on `world.description` or direct edits to `world.json` to inject functional code.
- **Strict world scoping**: Any pre-game script/style in `setup.hbs` MUST be strictly scoped so other worlds and `/setup` remain 100% vanilla. Always check `if (document.title.trim() === "Endless Tower")` and scope all CSS to `html.et-world` / `body.join.et-world`.
- **Zero-FOUC (Flash of Unstyled Content)**: Deferred scripts run after DOM parse, which causes a brief flash of default Foundry UI. Always maintain the synchronous inline `<head>` gate script in `setup.hbs`:
  `<script>if(document.title.trim()==="Endless Tower")document.documentElement.classList.add("et-world","et-gate");</script>`

### UI/UX & Cross-Platform Conventions
- **Cross-platform `<select>` popups (Virtual Dropdown)**: Windows Chromium (FLC / Electron) renders `<select>` menus using Win32 native OS popups, which ignore `border-radius`, `box-shadow`, and `backdrop-filter`. To ensure identical modern frosted-glass styling across Firefox and Electron, keep the native `<select>` hidden in the DOM (`et-hidden-native`) and mirror it with a custom accessible dropdown (`.et-dropdown`, `role="listbox"`).
- **Windows 17px scrollbar gutter**: On Windows browsers, an implicit scrollbar reserves 17px, causing an unsightly black column on full-viewport layouts. Enforce `overflow: hidden !important` on `html.et-world` and `body.join.et-world`, disable `::-webkit-scrollbar`, and give background art a bleed margin (e.g., `width: 116%; height: 116%; top: -8%; left: -8%`).
- **Autoplay policy (Gate Splash)**: Browsers block unmuted audio autoplay. The `"Click to enter"` splash screen captures the initial user gesture, cleanly unlocking the `AudioContext` for BGM and click SFX.
- **Language consistency**: Keep all pre-game UI strings in English (`Click to enter`, `Select User`, `Password`, `Join Game Session`, `Return to Setup`) to match Foundry's default join strings.

### Visual & Asset Pipeline: Living Art over AI Video
- **Generative AI video limitation**: Image-to-video AI tools distort and melt anatomy when processing complex multi-character illustrations (e.g., pantheons of deities).
- **Living Art pattern**: Use high-resolution WebP (lossless/near-lossless, ~80% smaller than PNG) combined with:
  1. Slow Ken Burns camera drift (`animation: et-kenburns 24s ease-in-out infinite alternate`).
  2. Radial god-ray illumination pulses (`mix-blend-mode: screen`).
  3. Lightweight real-time HTML5 Canvas particle system (~50 floating golden motes/sparkles).
  This achieves razor-sharp 4K AAA splash art fidelity with zero distortion and negligible CPU/GPU footprint.

### In-Game Landing Scene ("Landing Page")
- **Scene automation**: `src/features/landing-scene.ts` automatically creates and configures the scene `"Landing Page"` (1672x941 px, Gridless, global light enabled, padding 0) on GM login.
- **Cinematic Clean UI**: `styles/landing.css` reduces opacity of HUD elements (`#hotbar`, `#players`, `#controls`, `#navigation`) to 12%-20% while viewing the landing scene (`body.et-landing-active`), smoothly restoring 100% opacity on hover.
- **Living Canvas & Reversibility**: Floating golden particle canvas and subtle board drift (`body.et-drift-active #board`) are controlled by client setting `landingEffects` (configured under Module Settings), with runtime toggle via `game.modules.get('endless-tower').api.toggleLandingEffects()`. Complete user guide in `docs/LANDING_PAGE.md`.

## Cinematic UI & Design System Pattern (Default for all UI/Banners)

All future in-game UI banners, overlays, boss announcements, and cinematic alerts MUST follow this design system pattern as default:

### 1. Edge-to-Edge Ribbon (Never Floating Dialog Boxes)
- **Full-width cinematic ribbon**: Never use small, floating, rounded pop-up cards (`border-radius: 14px`) in the center of the screen for epic announcements — they look like generic dialog boxes.
- **Edge-to-edge layout**: Always span horizontally across the screen (`width: 100vw; max-width: 100vw; padding: 2.2rem 2rem; border-radius: 0;`).
- **Horizontal fade gradient**:
  `background: linear-gradient(90deg, transparent 0%, rgba(12, 10, 8, 0.72) 12%, rgba(16, 12, 11, 0.9) 50%, rgba(12, 10, 8, 0.72) 88%, transparent 100%);`
- **Tapered borders**: Top and bottom borders only (`1px solid rgba(217, 184, 101, 0.4)`), zero left/right borders.
- **Glassmorphism**: `backdrop-filter: blur(12px); -webkit-backdrop-filter: blur(12px);` so map tokens remain visible through the dark glass.

### 2. Single-Line Cinematic Typography
- **No title wrapping**: Always enforce `white-space: nowrap;` on main cinematic titles. Never allow multi-line stacking (e.g. "JULGAMENTO DA" / "TORRE").
- **Font stack**: `font-family: var(--et-font-cinematic);` (`"Signika", "Modesto Condensed", "Palatino", "Georgia", serif`).
- **Color tokens**:
  - Main Title: `--et-ivory` (`#fff8e6`), `font-weight: 700`, `letter-spacing: 0.16em`, uppercase, with `text-shadow: 0 2px 10px rgba(0,0,0,0.9), 0 0 24px rgba(217,184,101,0.35)`.
  - Subtitle: `--et-gold` (`#f3e2b0`), italic, `letter-spacing: 0.08em`, opacity `0.92`.
  - Crest & Runes: Golden glow (`--et-gold`, `--et-gold-deep`) flanked by rune sparkles (`<span class="et-rune-sparkle">✦</span>`).
  - Divider: 1px tapered razor line fading to transparent at the ends:
    `background: linear-gradient(90deg, transparent, rgba(217,184,101,0.6), rgba(192,57,43,0.8), rgba(217,184,101,0.6), transparent);`

### 3. Screen Vignette & Non-Intrusive HUD
- **Periphery vignette**: Darken edges with `radial-gradient(ellipse 85% 75% at 50% 50%, rgba(0,0,0,0.15) 30%, rgba(55,8,8,0.45) 80%, rgba(15,2,2,0.85) 100%)`. Never blur or block the center canvas.
- **No redundant UI toasts**: Avoid generic Foundry toast notifications (`ui.notifications.info`) during cinematic banner sequences. Let the banner, audio, and persistent tracker badges carry the presentation without cluttering the HUD or Combat Carousel.

## Gotchas

- After any Foundry core software update, the setup layout (`setup.hbs`) is restored to vanilla by the installer; `login/apply-login-patch.ps1` must be re-run (as Administrator) with the Foundry server stopped.
- `sensorial-deturpation.ts` and `solitude.ts` provide programmatic APIs via `game.modules.get('endless-tower').api`.
- No `opencode.json` or CI config exists.

## Foundry REST API (rolling dice, etc.)

The REST API module is installed. Use curl.exe to call it.

**Quirk**: PowerShell's `curl` is an alias for `Invoke-WebRequest` — different syntax.
Always use `& "C:\Windows\System32\curl.exe"` to invoke the real curl.

**Quirk**: Don't pass JSON inline with `-d`. PowerShell mangles quotes.
Write JSON to a temp file first (without BOM), then use `-d "@file"`:

```powershell
$json = '{"formula":"1d20","flavor":"Test"}'
[System.IO.File]::WriteAllText("$env:TEMP\req.json", $json)
& "C:\Windows\System32\curl.exe" -s -X POST "https://foundryrestapi.com/roll" `
  -H "Content-Type: application/json" `
  -H "x-api-key: $env:FOUNDRY_API_KEY" `
  -d "@$env:TEMP\req.json"
```

API key is in `.env` as `FOUNDRY_API_KEY`. Docs at https://foundryrestapi.com/docs/api
