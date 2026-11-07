const fullCasters = ["cleric", "druid", "wizard"];
const halfCasters = ["artificer", "paladin", "ranger"];
const prepCasters = [
  "artificer",
  "cleric",
  "druid",
  "paladin",
  "ranger",
  "wizard",
  "witch",
];

function isFullCaster(className: string): boolean {
  return fullCasters.some((c) => className.includes(c));
}

function isHalfCaster(className: string): boolean {
  return halfCasters.some((c) => className.includes(c));
}

function preparesSpells(actor: any): boolean {
  const classes = Object.keys(actor.classes || {});
  return prepCasters.some((c) => classes.includes(c));
}

export function registerPrepareSpellsReminder(): void {
  Hooks.on("dnd5e.restCompleted", async (actor: any, result: any) => {
    if (result?.longRest && preparesSpells(actor) && actor.hasPlayerOwner) {
      function getCastingAbility(className: string) {
        return actor.classes[className]?.system.spellcasting?.ability;
      }

      function getClassLvl(className: string) {
        return actor.classes[className]?.system.levels || 0;
      }

      function getCasterMod(className: string) {
        if (isFullCaster(className)) return 1;
        if (isHalfCaster(className)) return 0.5;
        return 0;
      }

      function getPreparedSpells(targetActor: any) {
        return targetActor.items.filter(
          (i: any) =>
            i.type === "spell" &&
            i.system?.preparation?.prepared &&
            i.system?.preparation?.mode === "prepared"
        );
      }

      function getMaxPrepared(targetActor: any) {
        const classes = Object.keys(targetActor.classes || {}).filter((c) =>
          prepCasters.includes(c)
        );
        let maxPrepNum = 0;

        for (const instance of classes) {
          const castingAbility = getCastingAbility(instance);
          const modifier = targetActor.system?.abilities?.[castingAbility]?.mod || 0;
          const classLvl = getClassLvl(instance);
          const casterMod = getCasterMod(instance);

          maxPrepNum += modifier + Math.floor(casterMod * classLvl);
        }
        return maxPrepNum;
      }

      const numPrepared = getPreparedSpells(actor).length;
      const numMaxPrepared = getMaxPrepared(actor);

      const content = `
      <form>
        <div class='prep-spells-dialog'>Parece que você completou um descanso longo. Agora você pode preparar as novas magias para o dia.</div>
        <br>
        <div style='text-align: center; font-weight: bold; opacity: 0.5'>Magias Preparadas: ${numPrepared}/${numMaxPrepared}</div>
      </form>`;

      new (Dialog as any)({
        title: "Descanso Longo Concluído",
        content,
        buttons: {
          yes: {
            label: "Ok",
          },
        },
      }).render(true);
    }
  });
}
