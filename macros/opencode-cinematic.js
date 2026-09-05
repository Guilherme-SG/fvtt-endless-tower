/**
 * Opencode Cinematic - Exibe texto com efeito cinematografico
 *
 * Cria barras pretas horizontais (letterbox), desfoca o fundo,
 * e exibe "Opencode Rules this World!" no centro da tela.
 * Remove tudo apos 5 segundos.
 *
 * Requisitos: Sequencer
 */
(async () => {
    const DURATION = 5000;
    const BAR_HEIGHT = 100;
    const TEXT = "Opencode Rules this World!";

    const [screenW, screenH] = canvas.screenDimensions;

    new Sequence()
        // Blur no fundo (tela inteira)
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
            .persist()
            .name("opencode-blur")
        // Barra superior
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
        // Barra inferior
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
        // Texto
        .scrollingText(
            { x: screenW / 2, y: screenH / 2 },
            TEXT,
            {
                fillStyle: "#FFFFFF",
                fontSize: 48,
                fontWeight: "bold",
                fontFamily: "Signika",
                stroke: "#000000",
                strokeThickness: 4,
            }
        )
        .play();

    // Auto-remove apos DURATION
    setTimeout(() => {
        Sequencer.EffectManager.endEffects({ name: "opencode-blur" });
        Sequencer.EffectManager.endEffects({ name: "opencode-bar-top" });
        Sequencer.EffectManager.endEffects({ name: "opencode-bar-bottom" });
    }, DURATION);
})();
