import { MODULE_TITLE } from "../constants";

export function registerBlessRemember(): void {
  Hooks.once("ready", () => {
    console.warn(`${MODULE_TITLE} | Bless Remember`);

    function getBlessNames(): string[] {
      const names: string[] = [];
      const blessFolder = (game.folders as any)?.find(
        (folder: any) => folder.name === "Bençãos Divinas"
      );
      if (!blessFolder?.children) return names;

      blessFolder.children.forEach(({ entries: blessesItems }: any) => {
        blessesItems?.forEach((bless: any) => {
          if (bless.name) names.push(bless.name);
        });
      });

      return names;
    }

    const blessNames = getBlessNames();

    function getActorOwnersId(actor: any): string[] {
      const OWNERSHIP_OWNER = 3;
      return Object.keys(actor.ownership || {}).filter(
        (id) => actor.ownership[id] === OWNERSHIP_OWNER
      );
    }

    function getBless(actor: any, blessName: string) {
      return actor.items.find((i: any) => i.name === blessName);
    }

    function getAllBlessesByActor(actor: any): string[] {
      return actor.items
        .filter((i: any) => blessNames.includes(i.name))
        .map((i: any) => i.name);
    }

    // Lembrete ao rolar iniciativa
    Hooks.on("dnd5e.rollInitiative", (actor: any) => {
      const blessOnRollIniciativeName = "Rápido E Devagar";
      const blessOnRollIniciative = getBless(actor, blessOnRollIniciativeName);
      if (!blessOnRollIniciative) return;

      const ownerIds = getActorOwnersId(actor);
      const whisperMessage = `${actor.name}, você tem a benção ${blessOnRollIniciativeName}!\n
${blessOnRollIniciative.system?.description?.value || ""}`;

      ChatMessage.create({
        content: whisperMessage,
        whisper: ownerIds,
      } as any);
    });

    // Lembrete no turno de combate
    Hooks.on("combatTurn", (combat: any, updateData: any) => {
      const { turn } = updateData;
      if (turn === undefined || !combat.turns?.[turn]) return;

      const turnOwnerActor = combat.turns[turn].actor;
      if (!turnOwnerActor) return;

      const actorBless = getAllBlessesByActor(turnOwnerActor);
      if (actorBless.length === 0) return;

      const ownerIds = getActorOwnersId(turnOwnerActor);
      const whisperMessage = `<b>${turnOwnerActor.name}</b>, você tem as bençãos <b>${actorBless.join(
        ", "
      )}</b>, lembre-se de usar!`;

      ChatMessage.create({
        content: whisperMessage,
        whisper: ownerIds,
      } as any);
    });
  });
}
