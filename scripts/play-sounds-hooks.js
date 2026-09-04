Hooks.on("updateCombat", (combat, updates, context) => {
    // Verifica se o round mudou para 1 (início do combate)
    // E se essa mudança veio de um estado anterior (não iniciado)
    if (updates.round === 1 && combat.previous.round === 0) {
        
        // Executa o som configurado no cliente atual
        // Isso vai respeitar o "narrador" escolhido por cada jogador
        combat._playCombatSound("startEncounter");
    }
});

Hooks.on("deleteCombat", (combat) => {
    // Garante que o popup só apareça para o Mestre (GM)
    if (!game.user.isGM) return;

    // Cria a caixa de diálogo
    new Dialog({
        title: "Fim de Combate: Fanfarra",
        content: "<p>O combate terminou! Deseja tocar a fanfarra de vitória?</p>",
        buttons: {
            sim: {
                icon: '<i class="fas fa-music"></i>',
                label: "Sim, tocar!",
                callback: () => {
                    ui.notifications.info("Tocando fanfarra...");
                    game.settings.set("fvtt-youtube-player", "currentVideo", "https://youtu.be/rgUksX6eM0Y");
                }
            },
            nao: {
                icon: '<i class="fas fa-times"></i>',
                label: "Agora não",
                callback: () => console.log("Fanfarra cancelada.")
            }
        },
        default: "sim"
    }).render(true);
});