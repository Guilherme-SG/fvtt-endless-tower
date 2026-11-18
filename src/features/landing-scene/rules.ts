import { LANDING_CONFIG, LANDING_SCENE_NAME, LEGACY_LANDING_SCENE_NAME } from "./config";

/**
 * Controller returned by the reusable golden particle renderer.
 */
export interface ParticleController {
  stop: () => void;
  resize: () => void;
}

/**
 * Starts the reusable golden motes particle animation on an HTML5 2D element.
 */
export function startParticleCanvas(
  element: HTMLCanvasElement,
  particleCount = 40
): ParticleController {
  const ctx = element.getContext("2d");
  if (!ctx) {
    return { stop: () => {}, resize: () => {} };
  }

  let animId: number | null = null;
  let w = (element.width = element.parentElement?.clientWidth || window.innerWidth);
  let h = (element.height = element.parentElement?.clientHeight || window.innerHeight);

  const resize = () => {
    w = element.width = element.parentElement?.clientWidth || window.innerWidth;
    h = element.height = element.parentElement?.clientHeight || window.innerHeight;
  };

  window.addEventListener("resize", resize);

  const particles = Array.from({ length: particleCount }, () => ({
    x: Math.random() * w,
    y: Math.random() * h,
    r: 1.2 + Math.random() * 2.2,
    baseAlpha: 0.25 + Math.random() * 0.55,
    alpha: 0,
    vy: 0.25 + Math.random() * 0.45,
    sway: Math.random() * Math.PI * 2,
    swaySpeed: 0.015 + Math.random() * 0.02,
    swayAmp: 0.35 + Math.random() * 0.55,
  }));

  const render = () => {
    ctx.clearRect(0, 0, w, h);

    for (let i = 0; i < particles.length; i++) {
      const p = particles[i];
      p.y -= p.vy;
      p.sway += p.swaySpeed;
      p.x += Math.sin(p.sway) * p.swayAmp;

      const lifeRatio = p.y / h;
      p.alpha = Math.sin(Math.max(0, Math.min(1, lifeRatio)) * Math.PI) * p.baseAlpha;

      if (p.y < -15) {
        p.y = h + 15;
        p.x = Math.random() * w;
      }

      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(255, 238, 175, ${p.alpha})`;
      ctx.shadowBlur = 6;
      ctx.shadowColor = "rgba(255, 215, 120, 0.75)";
      ctx.fill();
    }
    animId = requestAnimationFrame(render);
  };

  render();

  return {
    stop: () => {
      if (animId) cancelAnimationFrame(animId);
      window.removeEventListener("resize", resize);
    },
    resize,
  };
}

/**
 * Checks whether a scene matches the Endless Tower Landing Page criteria.
 */
export function isLandingSceneMatch(sceneName?: string | null, isFlagged?: boolean): boolean {
  return (
    Boolean(isFlagged) ||
    sceneName === LANDING_SCENE_NAME ||
    sceneName === LEGACY_LANDING_SCENE_NAME
  );
}

/**
 * Computes the centered pan coordinates and zoom scale to fit the landing artwork inside the viewport.
 */
export function calculateBoardFitPan(
  sceneWidth: number = LANDING_CONFIG.defaultWidth,
  sceneHeight: number = LANDING_CONFIG.defaultHeight,
  viewportWidth: number = 1920,
  viewportHeight: number = 1080,
  paddingFactor: number = LANDING_CONFIG.paddingFactor,
  minScale: number = LANDING_CONFIG.minScale
): { x: number; y: number; scale: number } {
  const scale = Math.min(
    (viewportWidth / sceneWidth) * paddingFactor,
    (viewportHeight / sceneHeight) * paddingFactor
  );
  return {
    x: sceneWidth / 2,
    y: sceneHeight / 2,
    scale: Math.max(minScale, scale),
  };
}
