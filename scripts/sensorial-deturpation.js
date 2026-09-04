(() => {
    const OWNERSHIP_OWNER = 3

    async function deturpation(deturpations) {
        const dice = new Roll("1d4 - 1")
        const result = await dice.roll()
        game.dice3d.showForRoll(dice, undefined, true)

        deturpations[result.total]()
    }

    async function hasEffectApplied(uuid, effectName) {
        return await game.dfreds.effectInterface.hasEffectApplied(effectName, uuid);
    }

    async function applyEffect(uuid, effectName) {
        const hasEffect = await hasEffectApplied(uuid, effectName);

        if (!hasEffect) {
            game.dfreds.effectInterface.addEffect({ effectName, uuid });
        }
    }

    async function removeEffect(uuid, effectName) {
        const hasEffect = await hasEffectApplied(uuid, effectName);

        if (hasEffect) {
            game.dfreds.effectInterface.removeEffect({ effectName, uuid });
        }
    }

    async function toggleEffect(uuid, effectName) {
        game.dfreds.effectInterface.toggleEffect(effectName, { uuids: [uuid] });
    }

    function whisperToActor(uuid, message) {
        const ownerIds = getActorOwnersId(actor)
        ChatMessage.create({
            content: message,
            whisper: ownerIds,
            type: CONST.CHAT_MESSAGE_TYPES.WHISPER
        });
    }

    function getActorOwnersId(actor) {
        return Object.keys(actor.ownership)
            .filter(id => actor.ownership[id] === OWNERSHIP_OWNER)
    }

    const { uuid } = actor;

    deturpation([
        () => {
            applyEffect(uuid, "Imune a todo dano")
            removeEffect(uuid, "Resistência a todo dano")
            removeEffect(uuid, "Vulnerável a todo dano")
            whisperToActor(actor, "Sua sensibilidade a dor foi desativada, você desconhece a dor! Você se sente invulnerável a tudo.")
        },
        () => {
            removeEffect(uuid, "Imune a todo dano")
            applyEffect(uuid, "Resistência a todo dano")
            removeEffect(uuid, "Vulnerável a todo dano")
            whisperToActor(actor, "Sua sensibilidade a dor está deficiente! Você se sente resistente a tudo.")
        },
        () => {
            removeEffect(uuid, "Imune a todo dano")
            removeEffect(uuid, "Resistência a todo dano")
            applyEffect(uuid, "Vulnerável a todo dano")
            whisperToActor(actor, "Sua sensibilidade a dor está hipersensível! Você se sente vulnerável a tudo.")
        },
        () => {
            removeEffect(uuid, "Imune a todo dano")
            removeEffect(uuid, "Resistência a todo dano")
            removeEffect(uuid, "Vulnerável a todo dano")
            whisperToActor(actor, "Sua sensibilidade a dor parece normal.")
        }
    ])

    function addAttribute(options, attribute) {
        const excludedValues = ["midi-none", "healing", "temphp", "-midi-none", "-healing", "-temphp"]

        return options
            .filter(option => !option.value.startsWith("-") && !excludedValues.includes(option.value))
            .reduce(
                (acc, cur) => {
                    acc.push({
                        name: `$system.traits.${attribute}.value`,
                        mode: 0,
                        value: cur.value,
                        priority: 20
                    })
                    return acc
                },
                []
            )
    }

    function removeAttribute(options, attribute) {
        const excludedValues = ["midi-none", "healing", "temphp", "-midi-none", "-healing", "-temphp"]

        return options
            .filter(option => option.value.startsWith("-") && !excludedValues.includes(option.value))
            .reduce(
                (acc, cur) => {
                    acc.push({
                        name: `$system.traits.${attribute}.value`,
                        mode: 0,
                        value: cur.value,
                        priority: 20
                    })
                    return acc
                },
                []
            )
    }

    function changeToAllDamageImunity(options) {
        const changes = [
            ...addAttribute(options, "di"),
            ...removeAttribute(options, "dr"),
            ...removeAttribute(options, "dv")
        ]
        return JSON.stringify(changes)
    }

    function changeToAllDamageResistance(options) {
        const changes = [
            ...removeAttribute(options, "di"),
            ...addAttribute(options, "dr"),
            ...removeAttribute(options, "dv")
        ]
        return JSON.stringify(changes)
    }

    function changeToAllDamageVulnerability(options) {
        const changes = [
            ...removeAttribute(options, "di"),
            ...removeAttribute(options, "dr"),
            ...addAttribute(options, "dv")
        ]
        return JSON.stringify(changes)
    }
})()