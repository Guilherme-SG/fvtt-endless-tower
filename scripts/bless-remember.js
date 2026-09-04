Hooks.on("ready", function () {
    console.warn("Endless Tower | Bless Remember")

    const blessNames = getBlessNames()
    
    registerRemindOnRollInitiativeBless()
    registerRemindAllBlesses()
   

    


    function registerRemindOnRollInitiativeBless() {
        Hooks.on("dnd5e.rollInitiative", (actor) => {
            const blessOnRollIniciativeName = 'Rápido E Devagar'

            const blessOnRollIniciative = getBless(actor, blessOnRollIniciativeName)

            if (!blessOnRollIniciative) return

            let ownerIds = getActorOwnersId(actor)

            const whisperMessage = `${actor.name}, você tem a benção ${blessOnRollIniciativeName}!\n
        ${blessOnRollIniciative.system.description.value}`;
            ChatMessage.create({
                content: whisperMessage,
                whisper: ownerIds,
                type: CONST.CHAT_MESSAGE_TYPES.WHISPER
            });
        })
    }

    function registerRemindAllBlesses() {
        Hooks.on("combatTurn", (combat, updateData) => {
            const { turn } = updateData
            const { actor: turnOwnerActor } = combat.turns[turn];

            let actorBless = getAllBlessesByActor(turnOwnerActor)
            if (actorBless.length === 0) return

            let ownerIds = getActorOwnersId(turnOwnerActor)

            const whisperMessage = `<b>${turnOwnerActor.name}</b>, você tem as bençãos <b>${actorBless.join(", ")}</b>, lembre-se de usar!`;
            ChatMessage.create({
                content: whisperMessage,
                whisper: ownerIds,
                type: CONST.CHAT_MESSAGE_TYPES.WHISPER
            });
        })
    }

    function getActorOwnersId(turnOwnerActor) {
        const OWNERSHIP_OWNER = 3 
        return Object.keys(turnOwnerActor.ownership)
            .filter(id => turnOwnerActor.ownership[id] === OWNERSHIP_OWNER)
    }

    function getBless(actor, blessName) {
        return actor.items.find(i => i.name === blessName);
    }

    function getAllBlessesByActor(actor) {
        return actor
            .items
            .filter(i => blessNames.includes(i.name))
            .map(i => i.name);
    }

    function getBlessNames() {
        const blessNames = []
        const { children: godFolders } = game.folders.find(folder => folder.name === "Bençãos Divinas");
        godFolders.forEach(
            ({ entries: blessesItems }) => blessesItems.forEach(bless => {
                blessNames.push(bless.name)
            })
        )

        return blessNames
    }
});