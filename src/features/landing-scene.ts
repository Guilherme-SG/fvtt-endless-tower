import { MODULE_ID, MODULE_TITLE } from "../constants";
import { ParticleController, startParticleCanvas } from "./particle-canvas";

const LANDING_SCENE_NAME = "Landing Page";
const LANDING_IMAGE_SRC = "endless-tower/landscape/endless-tower-login-screen.webp";
const SETTING_LANDING_EFFECTS = "landingEffects";

let particleController: ParticleController | null = null;
let particleCanvasEl: HTMLCanvasElement | null = null;

/**
 * Cria ou garante a existência da cena de Landing Page do Endless Tower.
 */
export async function createLandingScene(activate = false): Promise<any> {
  const scenes = (game as any).scenes;
  let scene = scenes.find(
    (s: any) =>
      s.getFlag(MODULE_ID, "isLandingScene") ||
      s.name === LANDING_SCENE_NAME ||
      s.name === "Panteão dos Deuses"
  );

  if (!scene) {
    console.log(`${MODULE_TITLE} | Criando cena de Landing Page: ${LANDING_SCENE_NAME}`);
    scene = await (Scene as any).create({
      name: LANDING_SCENE_NAME,
      background: {
        src: LANDING_IMAGE_SRC,
      },
      width: 1672,
      height: 941,
      padding: 0,
      backgroundColor: "#000000",
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

    (ui as any).notifications?.info(
      `Endless Tower | Cena "${LANDING_SCENE_NAME}" criada com sucesso!`
    );
  }

  if (activate && scene) {
    await scene.activate();
  }

  return scene;
}

/**
 * Inicia o sistema de partículas douradas flutuantes no canvas.
 */
function startParticles(): void {
  if (document.getElementById("et-landing-particles")) return;

  const canvasEl = document.createElement("canvas");
  canvasEl.id = "et-landing-particles";
  document.body.appendChild(canvasEl);
  particleCanvasEl = canvasEl;

  particleController = startParticleCanvas(canvasEl, 45);
}

/**
 * Para e remove o sistema de partículas.
 */
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

/**
 * Sincroniza o estado visual da Landing Page de acordo com a cena ativa e a opção configurada.
 */
function syncLandingEffects(scene: any): void {
  const isLanding =
    Boolean(scene?.getFlag(MODULE_ID, "isLandingScene")) ||
    scene?.name === LANDING_SCENE_NAME ||
    scene?.name === "Panteão dos Deuses";

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
 * Alterna rapidamente os efeitos visuais da Landing Page (para testes e reversão).
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
 * Registra a configuração e os hooks da Landing Scene (Clean UI, Câmera e Partículas).
 */
export function registerLandingSceneFeature(): void {
  // Registra opção nas Configurações de Módulo do Foundry
  (game as any).settings?.register?.(MODULE_ID, SETTING_LANDING_EFFECTS, {
    name: "Efeitos Visuais na Landing Page",
    hint: "Ativa câmera viva suave e partículas douradas flutuantes na cena Landing Page.",
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
      const exists = scenes.some(
        (s: any) =>
          s.getFlag(MODULE_ID, "isLandingScene") ||
          s.name === LANDING_SCENE_NAME ||
          s.name === "Panteão dos Deuses"
      );
      if (!exists) {
        await createLandingScene(false);
      }
    }
  });

  Hooks.on("canvasReady", (canvas: any) => {
    const scene = canvas?.scene;
    syncLandingEffects(scene);

    const isLanding =
      Boolean(scene?.getFlag(MODULE_ID, "isLandingScene")) ||
      scene?.name === LANDING_SCENE_NAME ||
      scene?.name === "Panteão dos Deuses";

    if (isLanding && canvas) {
      const w = scene.width ?? 1672;
      const h = scene.height ?? 941;
      const paddingFactor = 0.96;
      const scale = Math.min(
        (window.innerWidth / w) * paddingFactor,
        (window.innerHeight / h) * paddingFactor
      );
      canvas.pan({ x: w / 2, y: h / 2, scale: Math.max(0.1, scale) });
    }
  });

  Hooks.on("canvasTearDown", () => {
    stopParticles();
    document.body.classList.remove("et-landing-active", "et-drift-active");
  });
}
