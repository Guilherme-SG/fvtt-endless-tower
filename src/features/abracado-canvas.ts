/**
 * Motor de partículas em Canvas 2D para a bênção "Abraçado Pelo Destino".
 * - Modo Sorte ("luck"): Trevos verdes de 4 folhas esvoaçando com vento horizontal e faíscas esmeralda/douradas.
 * - Modo Vazio ("empty"): Poeira e cinzas acinzentadas caindo lentamente e desvanecendo no nada.
 */

export interface AbracadoCanvasController {
  stop: () => void;
  resize: () => void;
}

interface CloverParticle {
  x: number;
  y: number;
  size: number;
  rotation: number;
  rotSpeed: number;
  vx: number;
  vy: number;
  sway: number;
  swaySpeed: number;
  swayAmp: number;
  alpha: number;
  baseAlpha: number;
}

interface SparkleParticle {
  x: number;
  y: number;
  r: number;
  vx: number;
  vy: number;
  alpha: number;
  color: string;
}

interface DustParticle {
  x: number;
  y: number;
  r: number;
  vx: number;
  vy: number;
  alpha: number;
  baseAlpha: number;
  sway: number;
  swaySpeed: number;
}

/**
 * Desenha um trevo estilizado de 4 folhas centralizado no ponto (0, 0).
 */
function drawClover(ctx: CanvasRenderingContext2D, size: number): void {
  const leafDist = size * 0.38;
  const leafRadius = size * 0.42;

  // 4 folhas dispostas a cada 90 graus
  for (let i = 0; i < 4; i++) {
    const angle = (i * Math.PI) / 2;
    const lx = Math.cos(angle) * leafDist;
    const ly = Math.sin(angle) * leafDist;

    ctx.beginPath();
    ctx.arc(lx, ly, leafRadius, 0, Math.PI * 2);
    ctx.fill();
  }

  // Centro suave do trevo
  ctx.beginPath();
  ctx.arc(0, 0, size * 0.22, 0, Math.PI * 2);
  ctx.fill();

  // Haste sutil curvada
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.quadraticCurveTo(size * 0.25, size * 0.6, size * 0.35, size * 0.95);
  ctx.lineWidth = Math.max(1, size * 0.12);
  ctx.stroke();
}

/**
 * Inicia a animação de partículas em um canvas para Abraçado Pelo Destino.
 */
export function startAbracadoCanvas(
  canvasEl: HTMLCanvasElement,
  mode: "luck" | "empty"
): AbracadoCanvasController {
  const ctx = canvasEl.getContext("2d");
  if (!ctx) {
    return { stop: () => {}, resize: () => {} };
  }

  let animId: number | null = null;
  let w = (canvasEl.width = window.innerWidth);
  let h = (canvasEl.height = window.innerHeight);

  const resize = () => {
    w = canvasEl.width = window.innerWidth;
    h = canvasEl.height = window.innerHeight;
  };

  window.addEventListener("resize", resize);

  if (mode === "luck") {
    // ---- MODO SORTE: Trevos e Faíscas Mágicas ----
    const cloverCount = 38;
    const clovers: CloverParticle[] = Array.from({ length: cloverCount }, () => ({
      x: -30 + Math.random() * (w + 60),
      y: Math.random() * h,
      size: 10 + Math.random() * 14,
      rotation: Math.random() * Math.PI * 2,
      rotSpeed: (Math.random() - 0.5) * 0.04,
      vx: 1.8 + Math.random() * 2.8, // Vento para a direita
      vy: (Math.random() - 0.4) * 0.8,
      sway: Math.random() * Math.PI * 2,
      swaySpeed: 0.02 + Math.random() * 0.025,
      swayAmp: 0.8 + Math.random() * 1.2,
      alpha: 0,
      baseAlpha: 0.65 + Math.random() * 0.35,
    }));

    const sparkleCount = 45;
    const sparkles: SparkleParticle[] = Array.from({ length: sparkleCount }, () => ({
      x: Math.random() * w,
      y: Math.random() * h,
      r: 1 + Math.random() * 2.4,
      vx: 0.8 + Math.random() * 1.6,
      vy: (Math.random() - 0.5) * 0.7,
      alpha: 0.2 + Math.random() * 0.7,
      color: Math.random() > 0.4 ? "rgba(46, 204, 113, " : "rgba(241, 196, 15, ",
    }));

    const render = () => {
      ctx.clearRect(0, 0, w, h);

      // Renderiza faíscas brilhantes de fundo
      for (let i = 0; i < sparkles.length; i++) {
        const s = sparkles[i];
        s.x += s.vx;
        s.y += s.vy;
        if (s.x > w + 10) s.x = -10;
        if (s.y < 0) s.y = h;
        if (s.y > h) s.y = 0;

        ctx.beginPath();
        ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
        ctx.fillStyle = `${s.color}${s.alpha})`;
        ctx.shadowBlur = 6;
        ctx.shadowColor = s.color.includes("46") ? "rgba(46, 204, 113, 0.8)" : "rgba(255, 215, 0, 0.8)";
        ctx.fill();
      }

      // Renderiza trevos de 4 folhas
      for (let i = 0; i < clovers.length; i++) {
        const c = clovers[i];
        c.x += c.vx;
        c.sway += c.swaySpeed;
        c.y += c.vy + Math.sin(c.sway) * c.swayAmp;
        c.rotation += c.rotSpeed;

        // Fade in / fade out nas bordas horizontais
        const screenMargin = w * 0.1;
        let edgeFade = 1;
        if (c.x < screenMargin) {
          edgeFade = Math.max(0, c.x / screenMargin);
        } else if (c.x > w - screenMargin) {
          edgeFade = Math.max(0, (w - c.x) / screenMargin);
        }
        c.alpha = c.baseAlpha * edgeFade;

        if (c.x > w + 40) {
          c.x = -35;
          c.y = Math.random() * h;
        }

        ctx.save();
        ctx.translate(c.x, c.y);
        ctx.rotate(c.rotation);

        ctx.fillStyle = `rgba(39, 174, 96, ${c.alpha})`;
        ctx.strokeStyle = `rgba(29, 131, 72, ${c.alpha * 0.9})`;
        ctx.shadowBlur = 10;
        ctx.shadowColor = `rgba(46, 204, 113, ${c.alpha * 0.75})`;

        drawClover(ctx, c.size);
        ctx.restore();
      }

      animId = requestAnimationFrame(render);
    };

    render();
  } else {
    // ---- MODO VAZIO: Névoa fria e cinzas lentas desvanecendo ----
    const dustCount = 28;
    const dusts: DustParticle[] = Array.from({ length: dustCount }, () => ({
      x: Math.random() * w,
      y: Math.random() * h,
      r: 1.2 + Math.random() * 2.8,
      vx: (Math.random() - 0.5) * 0.2,
      vy: 0.25 + Math.random() * 0.45, // Caindo lentamente
      alpha: 0,
      baseAlpha: 0.25 + Math.random() * 0.35,
      sway: Math.random() * Math.PI * 2,
      swaySpeed: 0.01 + Math.random() * 0.015,
    }));

    const render = () => {
      ctx.clearRect(0, 0, w, h);

      for (let i = 0; i < dusts.length; i++) {
        const d = dusts[i];
        d.y += d.vy;
        d.sway += d.swaySpeed;
        d.x += Math.sin(d.sway) * 0.3;

        // Desvanecimento suave conforme cai
        const lifeRatio = d.y / h;
        d.alpha = Math.sin(Math.max(0, Math.min(1, lifeRatio)) * Math.PI) * d.baseAlpha;

        if (d.y > h + 15) {
          d.y = -10;
          d.x = Math.random() * w;
        }

        ctx.beginPath();
        ctx.arc(d.x, d.y, d.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(180, 185, 190, ${d.alpha})`;
        ctx.shadowBlur = 4;
        ctx.shadowColor = "rgba(140, 145, 150, 0.4)";
        ctx.fill();
      }

      animId = requestAnimationFrame(render);
    };

    render();
  }

  return {
    stop: () => {
      if (animId) cancelAnimationFrame(animId);
      window.removeEventListener("resize", resize);
    },
    resize,
  };
}
