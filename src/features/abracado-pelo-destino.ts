import { MODULE_TITLE } from "../constants";

export function registerAbracadoPeloDestino(): void {
  console.warn(`${MODULE_TITLE} | Abraçado pelo Destino`);

  Hooks.on("combatStart", async (combat: any) => {
    if (!game.users?.activeGM?.isSelf) return;

    const participants = combat.combatants.filter(
      (c: any) =>
        c.actor &&
        c.actor.items.find((i: any) => i.name === "Abraçado Pelo Destino")
    );

    for (const combatant of participants) {
      const actor = combatant.actor;
      const effectName = "Sorte de Calax";
      const initiativeValue = combatant.initiative || 0;
      const hasLuck = initiativeValue % 2 === 0;

      let messageContent = "";
      const dfreds = (game as any).dfreds;

      if (hasLuck) {
        messageContent = `<h3>💔 Coroa! (Par: ${initiativeValue})</h3><p>O destino abraça <b>${actor.name}</b>. Você recebe +1 em ataques e testes neste combate!</p>`;
        if (dfreds?.effectInterface) {
          await dfreds.effectInterface.addEffect({ effectName, uuid: actor.uuid });
        }
      } else {
        messageContent = `<h3>🍀 Cara! (Ímpar: ${initiativeValue})</h3><p>O acaso é indiferente para <b>${actor.name}</b>. Nenhum bônus foi concedido desta vez.</p>`;
        if (dfreds?.effectInterface) {
          await dfreds.effectInterface.removeEffect({ effectName, uuid: actor.uuid });
        }
      }

      const owners = Object.keys(actor.ownership || {}).filter(
        (id) => actor.ownership[id] === 3 && id !== "default"
      );
      const gmIds = (game.users as any)?.filter((u: any) => u.isGM).map((u: any) => u.id) || [];
      const recipients = [...new Set([...owners, ...gmIds])];

      await ChatMessage.create({
        speaker: ChatMessage.getSpeaker({ actor }),
        content: messageContent,
        whisper: recipients,
        flavor: "Bênção de Calax: Abraçado pelo Destino",
      } as any);
    }
  });

  Hooks.on("deleteCombat", async (combat: any) => {
    if (!game.users?.activeGM?.isSelf) return;

    const dfreds = (game as any).dfreds;
    if (!dfreds?.effectInterface) return;

    const participants = combat.combatants.filter((c: any) => c.actor);
    for (const combatant of participants) {
      await dfreds.effectInterface.removeEffect({
        effectName: "Sorte de Calax",
        uuid: combatant.actor.uuid,
      });
    }
  });
}
