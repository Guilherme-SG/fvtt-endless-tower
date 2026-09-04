(() => {
    console.warn("Endless Tower | Abraçado pelo Destino");

    Hooks.on("combatStart", async (combat) => {
        const participants = combat.combatants.filter(c => c.actor && c.actor.items.find(i => i.name === "Abraçado Pelo Destino"));

        for (let combatant of participants) {
            const actor = combatant.actor;
            const effectName = "Sorte de Calax";
            
            const initiativeValue = combatant.initiative || 0;
            
            let hasLuck = initiativeValue % 2 === 0;

            let messageContent = "";

            if (hasLuck) {
                messageContent = `<h3>💔 Coroa! (Par: ${initiativeValue})</h3><p>O destino abraça <b>${actor.name}</b>. Você recebe +1 em ataques e testes neste combate!</p>`;
                if (game.dfreds?.effectInterface) {
                    await game.dfreds.effectInterface.addEffect({ effectName, uuid: actor.uuid });
                }
            } else {
                messageContent = `<h3>🍀 Cara! (Ímpar: ${initiativeValue})</h3><p>O acaso é indiferente para <b>${actor.name}</b>. Nenhum bônus foi concedido desta vez.</p>`;
                if (game.dfreds?.effectInterface) {
                    await game.dfreds.effectInterface.removeEffect({ effectName, uuid: actor.uuid });
                }
            }

            const owners = Object.keys(actor.ownership).filter(id => actor.ownership[id] === 3 && id !== "default");
            const gmIds = game.users.filter(u => u.isGM).map(u => u.id);
            const recipients = [...new Set([...owners, ...gmIds])];

            ChatMessage.create({
                speaker: ChatMessage.getSpeaker({ actor }),
                content: messageContent,
                whisper: recipients,
                flavour: "Bênção de Calax: Abraçado pelo Destino"
            });
        }
    });

    Hooks.on("deleteCombat", async (combat) => {
        const participants = combat.combatants.filter(c => c.actor);
        for (let combatant of participants) {
            if (game.dfreds?.effectInterface) {
                await game.dfreds.effectInterface.removeEffect({ 
                    effectName: "Sorte de Calax", 
                    uuid: combatant.actor.uuid 
                });
            }
        }
    });
})();