export async function runSensorialDeturpation(actor: any): Promise<void> {
  if (!actor) {
    (ui as any).notifications?.warn("Selecione um token ou ator para executar a Deturpação Sensorial.");
    return;
  }

  const OWNERSHIP_OWNER = 3;
  const dfreds = (game as any).dfreds;

  async function hasEffectApplied(uuid: string, effectName: string) {
    return await dfreds?.effectInterface?.hasEffectApplied(effectName, uuid);
  }

  async function applyEffect(uuid: string, effectName: string) {
    const has = await hasEffectApplied(uuid, effectName);
    if (!has && dfreds?.effectInterface) {
      await dfreds.effectInterface.addEffect({ effectName, uuid });
    }
  }

  async function removeEffect(uuid: string, effectName: string) {
    const has = await hasEffectApplied(uuid, effectName);
    if (has && dfreds?.effectInterface) {
      await dfreds.effectInterface.removeEffect({ effectName, uuid });
    }
  }

  function getActorOwnersId(targetActor: any): string[] {
    return Object.keys(targetActor.ownership || {}).filter(
      (id) => targetActor.ownership[id] === OWNERSHIP_OWNER
    );
  }

  function whisperToActor(targetActor: any, message: string) {
    const ownerIds = getActorOwnersId(targetActor);
    ChatMessage.create({
      content: message,
      whisper: ownerIds,
    } as any);
  }

  async function deturpation(callbacks: Array<() => Promise<void> | void>) {
    const dice = new (Roll as any)("1d4 - 1");
    const result = await dice.roll();
    if ((game as any).dice3d) {
      (game as any).dice3d.showForRoll(dice, undefined, true);
    }
    await callbacks[result.total]?.();
  }

  const { uuid } = actor;

  await deturpation([
    async () => {
      await applyEffect(uuid, "Imune a todo dano");
      await removeEffect(uuid, "Resistência a todo dano");
      await removeEffect(uuid, "Vulnerável a todo dano");
      whisperToActor(
        actor,
        "Sua sensibilidade a dor foi desativada, você desconhece a dor! Você se sente invulnerável a tudo."
      );
    },
    async () => {
      await removeEffect(uuid, "Imune a todo dano");
      await applyEffect(uuid, "Resistência a todo dano");
      await removeEffect(uuid, "Vulnerável a todo dano");
      whisperToActor(
        actor,
        "Sua sensibilidade a dor está deficiente! Você se sente resistente a tudo."
      );
    },
    async () => {
      await removeEffect(uuid, "Imune a todo dano");
      await removeEffect(uuid, "Resistência a todo dano");
      await applyEffect(uuid, "Vulnerável a todo dano");
      whisperToActor(
        actor,
        "Sua sensibilidade a dor está hipersensível! Você se sente vulnerável a tudo."
      );
    },
    async () => {
      await removeEffect(uuid, "Imune a todo dano");
      await removeEffect(uuid, "Resistência a todo dano");
      await removeEffect(uuid, "Vulnerável a todo dano");
      whisperToActor(actor, "Sua sensibilidade a dor parece normal.");
    },
  ]);
}
