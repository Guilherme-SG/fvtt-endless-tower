import {
  hasPreparingClasses,
  getCasterMultiplier,
  calculateMaxPreparedSpells,
  ClassSpellcastingInfo,
} from "../rules/spellcasting";

export function registerPrepareSpellsReminder(): void {
  Hooks.on("dnd5e.restCompleted", async (actor: any, result: any) => {
    const classNames = Object.keys(actor.classes || {});
    if (result?.longRest && hasPreparingClasses(classNames) && actor.hasPlayerOwner) {
      const spellcastingInfos: ClassSpellcastingInfo[] = [];

      for (const className of classNames) {
        if (getCasterMultiplier(className) > 0) {
          const castingAbility = actor.classes[className]?.system.spellcasting?.ability;
          const modifier = actor.system?.abilities?.[castingAbility]?.mod || 0;
          const level = actor.classes[className]?.system.levels || 0;
          spellcastingInfos.push({
            name: className,
            level,
            abilityModifier: modifier,
          });
        }
      }

      const numPrepared = (actor.items || []).filter(
        (i: any) =>
          i.type === "spell" &&
          i.system?.preparation?.prepared &&
          i.system?.preparation?.mode === "prepared"
      ).length;

      const numMaxPrepared = calculateMaxPreparedSpells(spellcastingInfos);

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
