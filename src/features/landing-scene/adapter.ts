import { MODULE_ID, MODULE_TITLE } from "../../constants";
import {
  LANDING_CONFIG,
  LANDING_IMAGE_SRC,
  LANDING_SCENE_NAME,
  SETTING_LANDING_EFFECTS,
  UI_TEXT,
} from "./config";
import {
  calculateBoardFitPan,
  isLandingSceneMatch,
  startParticleCanvas,
  type ParticleController,
} from "./rules";

let particleController: ParticleController | null = null;
let particleCanvasEl: HTMLCanvasElement | null = null;

/**
 * Creates or retrieves the Endless Tower Landing Page scene.
 */
export async function createLandingScene(activate = false): Promise<any> {
  const scenes = (game as any).scenes;
  let scene = scenes.find((s: any) =>
    isLandingSceneMatch(s.name, Boolean(s.getFlag(MODULE_ID, "isLandingScene")))
  );

  if (!scene) {
    console.log(`${MODULE_TITLE} | Creating Landing Page scene: ${LANDING_SCENE_NAME}`);
    scene = await (Scene as any).create({
      name: LANDING_SCENE_NAME,
      background: {
        src: LANDING_IMAGE_SRC,
      },
      width: LANDING_CONFIG.defaultWidth,
      height: LANDING_CONFIG.defaultHeight,
      padding: 0,
      backgroundColor: LANDING_CONFIG.backgroundColor,
      grid: {
        type: (CONST as any).GRID_TYPES?.GRIDLESS ?? 0,
      },
      tokenVision: false,
      fog: {
        exploration: false,
      },
      environment: {
        darknessLevel: 0,
        globalLight: {
          enabled: true,
        },
      },
      flags: {
        [MODULE_ID]: {
          isLandingScene: true,
        },
      },
    });

    (ui as any).notifications?.info(UI_TEXT.sceneCreatedNotification(LANDING_SCENE_NAME));
  }

  if (activate && scene) {
    await scene.activate();
  }

  return scene;
}

function startParticles(): void {
  if (document.getElementById(LANDING_CONFIG.particleCanvasId)) return;

  const canvasEl = document.createElement("canvas");
  canvasEl.id = LANDING_CONFIG.particleCanvasId;
  document.body.appendChild(canvasEl);
  particleCanvasEl = canvasEl;

  particleController = startParticleCanvas(canvasEl, LANDING_CONFIG.particleCount);
}

function stopParticles(): void {
  if (particleController) {
    particleController.stop();
    particleController = null;
  }
  if (particleCanvasEl) {
    particleCanvasEl.remove();
    particleCanvasEl = null;
  }
}

function syncLandingEffects(scene: any): void {
  const isLanding = isLandingSceneMatch(
    scene?.name,
    Boolean(scene?.getFlag(MODULE_ID, "isLandingScene"))
  );

  const effectsEnabled =
    (game as any).settings?.get?.(MODULE_ID, SETTING_LANDING_EFFECTS) ?? true;

  document.body.classList.toggle("et-landing-active", isLanding);
  document.body.classList.toggle("et-drift-active", isLanding && effectsEnabled);

  if (isLanding && effectsEnabled) {
    startParticles();
  } else {
    stopParticles();
  }
}

/**
 * Toggles Landing Page visual effects on or off (for runtime testing and reversibility).
 */
export async function toggleLandingEffects(enable?: boolean): Promise<boolean> {
  const settings = (game as any).settings;
  const current = settings.get(MODULE_ID, SETTING_LANDING_EFFECTS);
  const next = enable !== undefined ? enable : !current;
  await settings.set(MODULE_ID, SETTING_LANDING_EFFECTS, next);
  syncLandingEffects((canvas as any)?.scene);
  return next;
}

/**
 * Registers settings and lifecycle hooks for the Landing Page scene.
 */
export function registerLandingSceneFeature(): void {
  (game as any).settings?.register?.(MODULE_ID, SETTING_LANDING_EFFECTS, {
    name: UI_TEXT.settingName,
    hint: UI_TEXT.settingHint,
    scope: "client",
    config: true,
    type: Boolean,
    default: true,
    onChange: () => {
      syncLandingEffects((canvas as any)?.scene);
    },
  });

  Hooks.once("ready", async () => {
    if ((game as any).user?.isGM) {
      const scenes = (game as any).scenes;
      const exists = scenes.some((s: any) =>
        isLandingSceneMatch(s.name, Boolean(s.getFlag(MODULE_ID, "isLandingScene")))
      );
      if (!exists) {
        await createLandingScene(false);
      }
    }
  });

  Hooks.on("canvasReady", (activeCanvas: any) => {
    const scene = activeCanvas?.scene;
    syncLandingEffects(scene);

    const isLanding = isLandingSceneMatch(
      scene?.name,
      Boolean(scene?.getFlag(MODULE_ID, "isLandingScene"))
    );

    if (isLanding && activeCanvas) {
      const w = scene.width ?? LANDING_CONFIG.defaultWidth;
      const h = scene.height ?? LANDING_CONFIG.defaultHeight;
      const panTarget = calculateBoardFitPan(w, h, window.innerWidth, window.innerHeight);
      activeCanvas.pan(panTarget);
    }
  });

  Hooks.on("canvasTearDown", () => {
    stopParticles();
    document.body.classList.remove("et-landing-active", "et-drift-active");
  });
}
