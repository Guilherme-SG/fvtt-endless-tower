import { MODULE_TITLE } from "../../constants";
import { BLESSING_FOLDER_NAME, INITIATIVE_BLESSING_NAME } from "./config";
import {
  filterActorBlessingNames,
  formatInitiativeWhisper,
  formatTurnWhisper,
  getOwnerUserIds,
} from "./rules";

function collectBlessingNames(): string[] {
  const names: string[] = [];
  const blessFolder = (game.folders as any)?.find(
    (folder: any) => folder.name === BLESSING_FOLDER_NAME
  );
  if (!blessFolder?.children) return names;

  blessFolder.children.forEach(({ entries: blessesItems }: any) => {
    blessesItems?.forEach((bless: any) => {
      if (bless.name) names.push(bless.name);
    });
  });

  return names;
}

/**
 * Registers initiative and combat turn whisper reminders for actors holding divine blessings.
 */
export function registerBlessRemember(): void {
  Hooks.once("ready", () => {
    console.warn(`${MODULE_TITLE} | Bless Remember initialized`);

    const blessNames = collectBlessingNames();

    Hooks.on("dnd5e.rollInitiative", (actor: any) => {
      const blessing = actor?.items?.find((i: any) => i.name === INITIATIVE_BLESSING_NAME);
      if (!blessing) return;

      const ownerIds = getOwnerUserIds(actor.ownership);
      const whisperMessage = formatInitiativeWhisper(
        actor.name,
        INITIATIVE_BLESSING_NAME,
        blessing.system?.description?.value || ""
      );

      ChatMessage.create({
        content: whisperMessage,
        whisper: ownerIds,
      } as any);
    });

    Hooks.on("combatTurn", (combat: any, updateData: any) => {
      const { turn } = updateData;
      if (turn === undefined || !combat.turns?.[turn]) return;

      const turnOwnerActor = combat.turns[turn].actor;
      if (!turnOwnerActor) return;

      const itemNames = (turnOwnerActor.items || []).map((i: any) => i.name).filter(Boolean);
      const actorBlessings = filterActorBlessingNames(itemNames, blessNames);
      if (actorBlessings.length === 0) return;

      const ownerIds = getOwnerUserIds(turnOwnerActor.ownership);
      const whisperMessage = formatTurnWhisper(turnOwnerActor.name, actorBlessings);

      ChatMessage.create({
        content: whisperMessage,
        whisper: ownerIds,
      } as any);
    });
  });
}
