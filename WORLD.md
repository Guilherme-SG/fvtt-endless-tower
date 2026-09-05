# WORLD.md — Endless Tower (FoundryVTT World Context)

## World Overview

| Property | Value |
|----------|-------|
| **FoundryVTT** | v13.351 |
| **System** | D&D 5e v5.2.5 |
| **Actors** | 64 |
| **Items** | 23 |
| **Scenes** | 7 |
| **Macros** | 28 |
| **Tables** | 35 |

---

## Module Reference

### Animation & VFX

| Module | Version | Purpose |
|--------|---------|---------|
| **Sequencer** | 4.2.3 | Pipeline for effects, sounds, macros. Core VFX tool. API: `new Sequence()` |
| **Automated Animations** | 6.8.0 | Auto-plays JB2A animations on attacks/spells. Configure via game settings. |
| **D&D5e Animations** | 3.3.0 | Pre-configured animations for D&D 5e spells/attacks. Works with Automated Animations. |
| **JB2A - Animated Spell Effects** | — | Jules & Ben's Animated Assets. Free/paid VFX library. Referenced by Sequencer. |
| **Jack Kerouac's Animated Spell Effects: Cartoon** | 0.4.6 | Cartoon-style spell VFX. Alternative to JB2A. |
| **Jinker's Animated Art Pack** | 0.94 | Additional animated art assets. |
| **Eskie Effects Free** | 1.8.0 | Free effect assets for Sequencer. |
| **BLFX Assets & Animation Editor Free** | 2.4.8 | Effect assets and animation editor. |
| **Gambit's FXMaster** | 7.4.2 | Weather, filters, overlays on canvas. API: `FXMaster.enable()` |

### Sound & Audio

| Module | Version | Purpose |
|--------|---------|---------|
| **SoundFx Library** | 13.0.1 | Sound effect management and playback. |
| **PSFX - Peri's Sound Effects** | 0.11.0 | Sound effects library with auto-trigger on animations. |
| **Youtube Player Widget** | 3.1.3 | Play YouTube videos in Foundry. Used in `play-sounds-hooks.js`. |

### Combat Automation

| Module | Version | Purpose |
|--------|---------|---------|
| **Midi-QoL** | 13.0.54 | Full combat automation: advantage, damage, effects. Core module. |
| **Times Up** | 13.1.9 | Auto-removes effects when duration expires. Pairs with DFreds. |
| **DAE (Dynamic Effects Using Active Effects)** | 13.0.24 | Advanced active effect manipulation. Required for complex effects. |
| **AutoCover - Automatic Cover Calculator** | 3.03 | Calculates cover automatically based on token positions. |
| **Simbul's Cover Calculator** | 2.1.1 | Alternative cover calculator. |
| **Easy Target** | 4.0 | Target selection improvements. |
| **Active Auras** | 0.12.7 | Propagates effects in aura radius (e.g., Bless, Spirit Guardians). |
| **Active Token Effects** | 1.1.1 | Apply effects to tokens viaauras or conditions. |
| **Automated Conditions 5e** | 13.5250.12 | Auto-applies D&D 5e conditions based on rules. |

### Effects & Conditions

| Module | Version | Purpose |
|--------|---------|---------|
| **DFreds Convenient Effects** | 8.2.4 | Toggleable active effects sidebar. Core dependency. API: `game.modules.get("dfreds-convenient-effects").api` |
| **Token Magic FX** | 0.7.6.3 | Visual filters on tokens (blur, glow, etc.). Works with DAE. |
| **Visage** | 4.6.0 | Token appearance manipulation (size, tint, overlay). |
| **Token Aura Ring** | 2.9.1 | Visual aura rings around tokens. |
| **Epic Rolls 5e** | 5.1.3 | Enhanced roll visualizations. |

### Macro & Scripting

| Module | Version | Purpose |
|--------|---------|---------|
| **Item Macro** | 3.0.1 | Execute macro when item is used. |
| **Effect Macro** | 13.0.3 | Execute macro when effect is applied/removed. |
| **Advanced Macro** | 2.3.0 | Enhanced macro editor with folders and variables. |
| **Eskie Macro Pack** | 1.2.0 | Pre-built macro templates. |

### Token & Scene Management

| Module | Version | Purpose |
|--------|---------|---------|
| **Foundry Summons** | 2.5.2 | Summoning system for creatures. Alternative to warpgate. |
| **Tagger** | 1.5.4 | Tag tokens/objects for querying. API: `Tagger.getByTags()` |
| **Monk's Active Tile Triggers** | 13.06 | Tile-based triggers and automation. |
| **Baileywiki Mass Edit** | 2.7.13 | Batch edit actors, items, scenes. |
| **Recycle Bin** | 3.1.1 | Recover deleted documents. |
| **Quick Doors** | 3.0.0 | Quickly place doors on walls. |

### UI & Quality of Life

| Module | Version | Purpose |
|--------|---------|---------|
| **DF Quality of Life** | 2.0.2 | Various UI improvements (token names, loot, etc.). |
| **DF Architect** | 5.0.0 | Scene building tools (walls, lights, doors). |
| **DF Droppables** | 5.4.0 | Drag items onto tokens to add them. |
| **Dice So Nice!** | 5.2.5 | 3D dice roll animations. |
| **Celebrate** | 1.6.3 | Celebration effects (confetti, sounds) on events. |
| **Hourglass** | 2.0.0 | Timer/stopwatch widget. |
| **Bossbar** | 4.0.0 | Boss health bar display. |
| **Stealthy** | 13.0.1 | Stealth automation for hiding. |
| **Anarchist Overlay** | 1.0.3 | Custom overlay effects. |

### Compendium & Packs

| Module | Version | Purpose |
|--------|---------|---------|
| **Simbul's Athenaeum** | 1.1.0 | Additional compendium packs. |
| **Transient Compendium Actor Library** | 1.2.0 | Temporary actor library from compendiums. |
| **Boss Loot Monster Tools** | 0.0.6 | Generate loot from monsters. |

### Other

| Module | Version | Purpose |
|--------|---------|---------|
| **Calendaria** | 0.11.9 | In-game calendar system. |
| **Carousel Combat Tracker** | 4.1.8 | Visual combat tracker carousel. |
| **Moss's Lancer Additions** | 0.2.3 | Additional Lancer RPG support (if used). |
| **Foundry REST API** | 3.2.3 | External API access (used by MCP tools). |
| **Torch** | 3.1.0 | Dynamic lighting torch effects. |

---

## Cross-Module Integration

### Common Patterns

1. **Effect Lifecycle**: DFreds (apply) → DAE (modify) → Times Up (expire)
2. **Combat Animation**: Midi-QoL (trigger) → Automated Animations (play) → Sequencer (render)
3. **Sound Design**: Sequencer (pipeline) → PSFX/SoundFx (library) → Youtube Player (music)
4. **Token Summoning**: Warpgate (spawn) → Sequencer (animation) → Tagger (label)

### Module Conflicts to Avoid

- **AutoCover** vs **Simbul's Cover Calculator** — both calculate cover, may conflict
- **Active Auras** vs **Active Token Effects** — overlapping aura functionality (use one)
- **Multiple animation modules** — configure Automated Animations to avoid double-playing

---

## Documentation

Fetch these URLs with `webfetch` when you need API details for a specific module.

| Module | Docs |
|--------|------|
| **Sequencer** | https://fantasycomputer.works/FoundryVTT-Sequencer/#/ |
| **DFreds Convenient Effects** | https://www.dfreds-modules.com/free-modules/convenient-effects |
| **Warpgate** | https://github.com/trioderegion/warpgate/wiki |
| **Midi-QoL** | https://gitlab.com/tposney/midi-qol |
| **DAE** | https://gitlab.com/tposney/dae |
| **Tagger** | https://github.com/fantasycalendar/FoundryVTT-Tagger |
| **Item Macro** | https://github.com/Foundry-Workshop/Item-Macro |
| **Token Magic FX** | https://github.com/Feu-Secret/Tokenmagic |
| **Active Auras** | https://github.com/kandashi/Active-Auras |
| **FXMaster** | https://foundryvtt.com/packages/fxmaster |
| **Foundry Summons** | https://foundryvtt.com/packages/summoning |
