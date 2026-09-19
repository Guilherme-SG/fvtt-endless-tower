/**
 * Opencode Cinematic - Exibe texto com efeito cinematografico
 *
 * Cria barras pretas horizontais (letterbox), desfoca o fundo,
 * e exibe "Opencode Rules this World!" com gradiente e animacao onda.
 * Remove tudo apos 5 segundos.
 *
 * Requisitos: Sequencer
 */
(async () => {
    const DURATION = 5000;
    const BAR_HEIGHT = 100;
    const TEXT = "Opencode Rules this World!";

    const [screenW, screenH] = canvas.screenDimensions;

    // --- Sequencer: blur + barras ---
    new Sequence()
        .effect()
            .shape("rectangle", {
                width: screenW,
                height: screenH,
                fillColor: "#000000",
                fillAlpha: 0,
            })
            .filter("Blur", { blur: 12 })
            .screenSpace()
            .screenSpaceAboveUI()
            .screenSpacePosition({ x: 0, y: 0 })
            .persist()
            .name("opencode-blur")
        .effect()
            .shape("rectangle", {
                width: screenW,
                height: BAR_HEIGHT,
                fillColor: "#000000",
                fillAlpha: 1,
            })
            .screenSpace()
            .screenSpaceAboveUI()
            .screenSpacePosition({ x: 0, y: 0 })
            .persist()
            .name("opencode-bar-top")
        .effect()
            .shape("rectangle", {
                width: screenW,
                height: BAR_HEIGHT,
                fillColor: "#000000",
                fillAlpha: 1,
            })
            .screenSpace()
            .screenSpaceAboveUI()
            .screenSpacePosition({ x: 0, y: screenH - BAR_HEIGHT })
            .persist()
            .name("opencode-bar-bottom")
        .play();

    // --- Texto com gradiente e animacao onda ---
    const style = new PIXI.TextStyle({
        fontFamily: "Signika",
        fontSize: 48,
        fontWeight: "bold",
        fill: ["#FFD700", "#FF6B6B", "#FF1493"],
        fillGradientType: PIXI.TEXT_GRADIENT.LINEAR_HORIZONTAL,
        stroke: "#000000",
        strokeThickness: 6,
        dropShadow: true,
        dropShadowColor: "#000000",
        dropShadowBlur: 4,
        dropShadowDistance: 2,
    });

    const text = new PIXI.Text(TEXT, style);
    text.anchor.set(0.5);
    text.x = screenW / 2;
    text.y = screenH / 2;

    canvas.interface.addChild(text);

    // Animacao onda
    let startTime = Date.now();
    let animId = null;

    function animate() {
        const elapsed = Date.now() - startTime;
        const progress = elapsed / DURATION;

        if (progress >= 1) {
            canvas.interface.removeChild(text);
            text.destroy();
            return;
        }

        // Onda sinusoidal
        text.y = screenH / 2 + Math.sin(elapsed / 300) * 10;

        // Fade in/out
        if (progress < 0.1) {
            text.alpha = progress / 0.1;
        } else if (progress > 0.9) {
            text.alpha = (1 - progress) / 0.1;
        } else {
            text.alpha = 1;
        }

        animId = requestAnimationFrame(animate);
    }

    animId = requestAnimationFrame(animate);

    // Cleanup
    setTimeout(() => {
        Sequencer.EffectManager.endEffects({ name: "opencode-blur" });
        Sequencer.EffectManager.endEffects({ name: "opencode-bar-top" });
        Sequencer.EffectManager.endEffects({ name: "opencode-bar-bottom" });
        if (animId) cancelAnimationFrame(animId);
        if (text.parent) {
            canvas.interface.removeChild(text);
            text.destroy();
        }
    }, DURATION);
})();
