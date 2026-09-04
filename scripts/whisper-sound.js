;(function() {
    console.warn("Endless Tower | Satanas Sound Effects")
    const basePath = "endless-tower/audios/minecraft-ghast-sounds"
    const ghastSounds = {
        die: `${basePath}/ghast-morte.mp3`,
        attackFire: `${basePath}/disparo-Fogo.mp3`,
        attackScream: `${basePath}/disparo-ghast.mp3`,
        pain: [
            `${basePath}/ghast-dor-1.mp3`,
            `${basePath}/ghast-dor-2.mp3`,
            `${basePath}/ghast-dor-3.mp3`,
            `${basePath}/ghast-dor-4.mp3`,
        ]
    }

    Hooks.on("preUpdateActor", (actor, update, options, userId) => {
        console.log("actor", actor)
        console.log("update", update)
        if (actor.name !== "Whisper") return;
        
        if (update.system?.attributes?.hp?.value === 0) {
            console.log("Whisper died")
            playSound(ghastSounds.die)
            return
        }

        if (update?.flags?.["midi-qol"]?.["concentration-damage"] > 0) {
            console.log("Whisper took damage")
            playSound(ghastSounds.pain[Math.floor(Math.random() * ghastSounds.pain.length)])
        }
    });

    function playSound(soundPath) {
        new Sequence()
            .sound()
                .file(soundPath)
                .volume(0.7)
            .play()
    }
})();