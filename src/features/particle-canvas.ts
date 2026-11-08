/**
 * Sistema reutilizável de partículas douradas (Golden Motes) para telas do Endless Tower.
 */

export interface ParticleController {
  stop: () => void;
  resize: () => void;
}

export function startParticleCanvas(
  canvasEl: HTMLCanvasElement,
  particleCount = 40
): ParticleController {
  const ctx = canvasEl.getContext("2d");
  if (!ctx) {
    return { stop: () => {}, resize: () => {} };
  }

  let animId: number | null = null;
  let w = (canvasEl.width = canvasEl.parentElement?.clientWidth || window.innerWidth);
  let h = (canvasEl.height = canvasEl.parentElement?.clientHeight || window.innerHeight);

  const resize = () => {
    w = canvasEl.width = canvasEl.parentElement?.clientWidth || window.innerWidth;
    h = canvasEl.height = canvasEl.parentElement?.clientHeight || window.innerHeight;
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
