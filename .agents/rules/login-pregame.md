---
trigger: glob
globs: login/**
---
# Login screen & Pre-game architecture (Foundry v13)

The custom login screen (`login/login.css`, `login/login.js`) runs on the `/join` page before a user enters the world.

## Core Architecture & Lifecycle Constraints
- **Module execution scope**: Standard Foundry modules only load after world login (`game.ready`), not on `/join`. Pre-game assets are injected into Foundry's layout via `login/apply-login-patch.ps1` (`templates\views\layouts\setup.hbs`).
- **Foundry update gotcha**: After any Foundry core software update, `setup.hbs` is restored to vanilla by the installer; `login/apply-login-patch.ps1` must be re-run (as Administrator) with the Foundry server stopped.
- **World sanitization**: Foundry runs `sanitize-html` (`ALLOWED_HTML_TAGS` in `constants.mjs`) on `world.description` on save/shutdown, stripping `<script>` and `<style>`. Never rely on `world.description` or direct edits to `world.json` to inject functional code.
- **Strict world scoping**: Any pre-game script/style in `setup.hbs` MUST be strictly scoped so other worlds and `/setup` remain 100% vanilla. Always check `if (document.title.trim() === "Endless Tower")` and scope all CSS to `html.et-world` / `body.join.et-world`.
- **Zero-FOUC (Flash of Unstyled Content)**: Deferred scripts run after DOM parse, which causes a brief flash of default Foundry UI. Always maintain the synchronous inline `<head>` gate script in `setup.hbs`:
  `<script>if(document.title.trim()==="Endless Tower")document.documentElement.classList.add("et-world","et-gate");</script>`

## UI/UX & Cross-Platform Conventions
- **Cross-platform `<select>` popups (Virtual Dropdown)**: Windows Chromium (FLC / Electron) renders `<select>` menus using Win32 native OS popups, which ignore `border-radius`, `box-shadow`, and `backdrop-filter`. To ensure identical modern frosted-glass styling across Firefox and Electron, keep the native `<select>` hidden in the DOM (`et-hidden-native`) and mirror it with a custom accessible dropdown (`.et-dropdown`, `role="listbox"`).
- **Windows 17px scrollbar gutter**: On Windows browsers, an implicit scrollbar reserves 17px, causing an unsightly black column on full-viewport layouts. Enforce `overflow: hidden !important` on `html.et-world` and `body.join.et-world`, disable `::-webkit-scrollbar`, and give background art a bleed margin (e.g., `width: 116%; height: 116%; top: -8%; left: -8%`).
- **Autoplay policy (Gate Splash)**: Browsers block unmuted audio autoplay. The `"Click to enter"` splash screen captures the initial user gesture, cleanly unlocking the `AudioContext` for BGM and click SFX.
- **Language consistency**: Keep all pre-game UI strings in English (`Click to enter`, `Select User`, `Password`, `Join Game Session`, `Return to Setup`) to match Foundry's default join strings.

## Visual & Asset Pipeline: Living Art over AI Video
- **Generative AI video limitation**: Image-to-video AI tools distort and melt anatomy when processing complex multi-character illustrations (e.g., pantheons of deities).
- **Living Art pattern**: Use high-resolution WebP (lossless/near-lossless, ~80% smaller than PNG) combined with:
  1. Slow Ken Burns camera drift (`animation: et-kenburns 24s ease-in-out infinite alternate`).
  2. Radial god-ray illumination pulses (`mix-blend-mode: screen`).
  3. Lightweight real-time HTML5 Canvas particle system (~50 floating golden motes/sparkles).
  This achieves razor-sharp 4K AAA splash art fidelity with zero distortion and negligible CPU/GPU footprint.
