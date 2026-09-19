# AGENTS.md — Endless Tower (FoundryVTT Module)

## What this is

FoundryVTT module (v13, D&D 5e) with homebrew blessings, combat sounds, critical tables, and custom effects. No build system, no tests, no linting — scripts are vanilla ES modules loaded directly by FoundryVTT.

## World context

**WORLD.md** documents the full FoundryVTT world: all 50+ installed modules, their APIs, and cross-module integration patterns. Consult it before creating new features to know what's available. WORLD.md includes documentation URLs for key modules — fetch them with `webfetch` when you need API details.

## Key files

- `module.json` — Module manifest. All scripts in `esmodules` are auto-loaded.
- `scripts/*.js` — ES modules loaded by FoundryVTT.
- `tables/` — Rollable tables (critical hits/fails, "mare de improbabilidade").
- `fx/ragnarok-online-effects/` — VFX webm/gif files registered via Sequencer.
- `items/` — Single bleeding condition item JSON.

## Script loading

Only scripts listed in `module.json` `esmodules` are auto-loaded by FoundryVTT:
- `abracado-pelo-destino-bless.js`, `bless-remember.js`, `cemetery-bless.js`, `play-sounds-hooks.js`, `ragnarok-animations.js`, `sensorial-deturpation.js`, `prepare-spells-reminder.js`, `whisper-sound.js`

Scripts **not** in esmodules are manual/inline:
- `ghostring-summon.js` — macro script (uses warpgate)
- `solitude-bless.js` — inline check (no Hooks registration)

## Runtime dependencies

- `dfreds-convenient-effects` — required. Used in `cemetery-bless.js`, `sensorial-deturpation.js`, `abracado-pelo-destino-bless.js`, `solitude-bless.js` via `game.dfreds.effectInterface`.
- `sequencer` — used in `ragnarok-animations.js` and `whisper-sound.js`.
- `warpgate` — used in `ghostring-summon.js`.
- `midi-qol` — read in `whisper-sound.js` for concentration damage detection.
- `fvtt-youtube-player` — optional, used in `play-sounds-hooks.js`.

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
- `fvtt-RollTable-sucesso-magico-*.json` — Magic crits (empty, skip for now)
- `fvtt-RollTable-falha-magico-*.json` — Magic fails (already formatted)
- `fvtt-RollTable-falha-desarmada_arma-natural-*.json` — Natural weapon fails
- `fvtt-RollTable-falha-corpo-a-corpo-*.json` — Melee fails
- `fvtt-RollTable-falha-a-distancia-*.json` — Ranged fails

**Design intent**: Critical hits/fails should be game-changing but not annoying — memorable moments that turn the tide of combat. No hardcore/hardship-only consequences.

## Gotchas

- `whisper-sound.js` references audio at `endless-tower/audios/minecraft-ghast-sounds/` — these files are not in the repo. They may be managed separately or need to be added.
- `sensorial-deturpation.js` and `solitude-bless.js` reference `actor` and `token` globals (meant to be executed as inline macros with those in scope).
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
