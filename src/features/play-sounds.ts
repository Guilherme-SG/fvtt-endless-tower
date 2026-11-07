export function registerPlaySoundsHooks(): void {
  Hooks.on("updateCombat", (combat: any, updates: any) => {
    // Verifica se o round mudou para 1 (início do combate)
    if (updates.round === 1 && combat.previous?.round === 0) {
      if (typeof combat._playCombatSound === "function") {
        combat._playCombatSound("startEncounter");
      }
    }
  });

  Hooks.on("deleteCombat", async () => {
    // Garante que o popup só apareça para o Mestre (GM)
    if (!game.user?.isGM) return;

    const DialogV2 = (foundry as any)?.applications?.api?.DialogV2;
    if (DialogV2) {
      const confirmed = await DialogV2.confirm({
        window: { title: "Fim de Combate: Fanfarra" },
        content: "<p>O combate terminou! Deseja tocar a fanfarra de vitória?</p>",
        yes: {
          icon: '<i class="fas fa-music"></i>',
          label: "Sim, tocar!",
          callback: () => {
            (ui as any).notifications?.info("Tocando fanfarra...");
            (game as any).settings?.set?.(
              "fvtt-youtube-player",
              "currentVideo",
              "https://youtu.be/rgUksX6eM0Y"
            );
          },
        },
        no: {
          icon: '<i class="fas fa-times"></i>',
          label: "Agora não",
          callback: () => console.log("Fanfarra cancelada."),
        },
        defaultYes: true,
      });
      return;
    }

    // Fallback para Dialog legado
    new (Dialog as any)({
      title: "Fim de Combate: Fanfarra",
      content: "<p>O combate terminou! Deseja tocar a fanfarra de vitória?</p>",
      buttons: {
        sim: {
          icon: '<i class="fas fa-music"></i>',
          label: "Sim, tocar!",
          callback: () => {
            (ui as any).notifications?.info("Tocando fanfarra...");
            (game as any).settings?.set?.(
              "fvtt-youtube-player",
              "currentVideo",
              "https://youtu.be/rgUksX6eM0Y"
            );
          },
        },
        nao: {
          icon: '<i class="fas fa-times"></i>',
          label: "Agora não",
          callback: () => console.log("Fanfarra cancelada."),
        },
      },
      default: "sim",
    }).render(true);
  });
}
