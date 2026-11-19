---
trigger: glob
globs: data/tables/**/*.json
---
# Critical hit/fail tables (`data/tables/critical/`)

Each table is a FoundryVTT RollTable JSON (20 entries, ranges 1–20). All entry descriptions use the semantic **Celestial Chronicle Design System** HTML format (`is-hit` for `sucesso-*` tables, `is-fumble` for `falha-*` tables):

```html
<div class="et-critical-table-card is-hit"><p class="et-card-lore">Optional flavor text</p><div class="et-card-mechanic"><p>Mechanical text with Foundry notation</p></div><div class="et-card-media"><img src="existing_gif" /></div></div>
```

**Rules when editing/adding entries:**
- Always use this semantic HTML structure without any inline `style=` attributes or hardcoded hex colors.
- `name` field in each entry MUST contain the title — never duplicate it with `<h3>` or `<header>` inside `description`.
- `<p class="et-card-lore">` is optional — omit it when an entry only has mechanical text (no separate flavor text).
- Mechanical rules (including `<p>`, `<ul>`, `<table>`, inline rolls) live inside `<div class="et-card-mechanic">...</div>`.
- Preserve any existing `<img>` tags (GIFs, including `src` and optional `alt`) inside `<div class="et-card-media">...</div>` at the end of descriptions (omit `.et-card-media` when an entry has no GIF).
- Use Foundry rollable notation: `[[/save con dc=15]]`, `[[/check ath dc=15]]`, `[[/save wis dc=15]]`.
- All DCs are **15** (or **10** for Constitution recovery saves on crit fail tables).
- Reference conversions: `&amp;Reference[paralyzed]` → `paralisado`, `&amp;Reference[restrained]` → `preso`, `&amp;Reference[grappled]` → `agarrado`, `&amp;Reference[frightened]` → `amedrontado`, `&amp;Reference[incapacitated]` → `incapacitado`, `&amp;Reference[bonusaction]` → `ação bônus`, `&amp;Reference[reaction]` → `reação`.

**Table files:**
- `fvtt-RollTable-sucesso-perfurante-*.json` — Critical hits (piercing)
- `fvtt-RollTable-sucesso-impactante-*.json` — Critical hits (bludgeoning)
- `fvtt-RollTable-sucesso-cortante-*.json` — Critical hits (slashing)
- `fvtt-RollTable-sucesso-magico-*.json` — Magic crits (arcane spell attacks)
- `fvtt-RollTable-falha-magica-*.json` — Magic fails
- `fvtt-RollTable-falha-desarmada_arma-natural-*.json` — Natural weapon fails
- `fvtt-RollTable-falha-corpo-a-corpo-*.json` — Melee fails
- `fvtt-RollTable-falha-a-distancia-*.json` — Ranged fails

**Design intent**: Critical hits/fails should be game-changing but not annoying — memorable moments that turn the tide of combat. No hardcore/hardship-only consequences.
