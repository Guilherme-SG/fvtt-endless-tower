---
trigger: glob
globs: tables/**/*.json
---
# Critical hit/fail tables (`tables/critical/`)

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
