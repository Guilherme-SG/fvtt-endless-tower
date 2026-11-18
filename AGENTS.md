# AGENTS.md — Endless Tower (FoundryVTT Module)

## Overview

FoundryVTT module (v13, D&D 5e) with homebrew blessings, combat sounds, critical tables, and custom effects. Built with TypeScript, Vite, and Vitest.

## Reference Documentation

- `WORLD.md` — Full FoundryVTT world inventory (50+ installed modules, APIs, and cross-module integration URLs).
- `docs/DESIGN_SYSTEM.md` — Specification, W3C DTCG tokens, and component contracts for the Celestial Chronicle Design System.
- `docs/LANDING_PAGE.md` — Guide and settings reference for the in-game Landing Page scene (`src/features/landing-scene.ts`).
- `docs/CELESTIAL_CHRONICLE.md` — Guide and settings reference for the Celestial Chronicle system (Pause mode & Scene Transitions).
- `docs/FOUNDRY_REST_API.md` — PowerShell `curl.exe` quirks and request examples for the Foundry REST API module.

## Scripts & Public API

- `npm run dev` — Vite watch build (`vite build --watch`).
- `npm run build` — Production bundle (`vite build` -> `dist/endless-tower.js`).
- `npm test` — Run unit and architectural guardrail tests (`vitest run`).

Public module API at `game.modules.get('endless-tower').api`:
- `api.ui` — UI helpers (`showBanner(opts)`, `playSound(type, vol)`, `startParticles()`, `stopParticles()`).
- `api.banner` — `BannerService.getInstance()` (cinematic edge-to-edge ribbons with socket sync).
- `api.sound` — `DesignSystemSound.getInstance()` (UI audio dispatcher with volume control).
- `api.designSystem` — `DesignSystem.getInstance()` (master design system controller and `auditTokens()`).

## Runtime Dependencies

- `dfreds-convenient-effects` — required (`cemetery-bless.ts`, `sensorial-deturpation.ts`, `abracado-pelo-destino.ts` via `game.dfreds.effectInterface`).
- `sequencer` — VFX animations (`ragnarok-animations.ts`, `jump.ts`).
- `midi-qol` — attack/damage workflow triggers (`critical-encounter.ts`; prefer `midi-qol.AttackRollComplete` and workflow trackers for crit/fumble detection).
- `fvtt-youtube-player` — optional combat audio (`play-sounds.ts`).

## Global Conventions

- **Language**: All comments, UI text, and documentation in Brazilian Portuguese (except pre-game `/join` strings).
- **Decoupled Pure Logic (`@principle:P-003`)**: Rules, math, probabilities, and quote decks must live in pure functions free of Foundry globals (`game`, `canvas`, `Hooks`, `ui`); `src/features/*` act as adapters.
- **Multi-Scene Isolation**: Persist combat flags on the `Combat` document (`combat.setFlag`), resolve combat via `token.combatant?.combat` (never `game.combat`), and filter broadcasts by `game.user.viewedScene`.
- **Whisper Messages**: Ownership check uses `ownership[id] === 3` (OWNER level).
- **Media Assets (`@principle:P-009`)**: Convert static splash arts and backgrounds to `.webp` (`cwebp -q 90`).

## Commit Workflow (HITL)

Before committing, always:
1. **Stage** the files (`git add`)
2. **Show** the diff (`git diff --cached`)
3. **Propose** the commit message
4. **Ask** the user to confirm before running `git commit`

Never commit without user confirmation.

## Foundry VTT MCP Safety Policy (HITL for High-Risk Actions)

Even when operating in autonomous or Turbo mode, the assistant MUST follow Human-In-The-Loop (HITL) approval before executing any modifying, destructive, or high-risk Foundry operations:
- **Auto-approved (Read & Non-destructive)**:
  - Reading and queries (`get-character`, `get-character-entity`, `list-characters`, `get-current-scene`, `list-scenes`, `get-world-info`, `search-compendium`, `get-token-details`, etc.)
  - Posting chat dialogues, speech bubbles, or requesting player roll buttons (`create-chat-message`, `request-player-rolls`)
- **Strict Prior Approval Required (Stop and Ask the User First)**:
  - Deleting tokens, actors, items, journals, or scenes (e.g. `delete-tokens`, deletion actions in `manage-actors`)
  - Modifying existing actor sheets, abilities, HP, features, items, or ownership (e.g. `update-token`, `manage-actors` edit, `manage-effects`, `remove-actor-ownership`, `replace-journal-page`)
  - Bulk movements or scene modifications
Before executing any of these tools, the assistant MUST halt its turn, detail the intended target(s) and specific modifications, and await the user's explicit approval in chat.
