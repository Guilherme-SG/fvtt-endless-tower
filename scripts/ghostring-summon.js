const [source] = canvas.tokens.controlled;

await warpgate.spawn('Whisper', {}, {}, {duplicates: 4});

const animationPath = "jb2a.magic_signs.rune.necromancy.intro.green";

new Sequence()
    .effect()
        .file(animationPath)
        .atLocation(source)
        .scaleToObject(2)
        .belowTokens()
        .scaleIn(2, 2500, {ease: "easeInOutCubic"})
        .scaleOut(0, 1500, {ease: "easeInCubic"})
    .play()