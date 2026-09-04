function isIsolatedFromAllFriends(tokenToCheck, desiredTilesDistance = 1) {
    const { FRIENDLY } = CONST.TOKEN_DISPOSITIONS

    return canvas.tokens.placeables
        .filter(token => token.document.disposition === FRIENDLY && token.id !== tokenToCheck.id)
        .map(token => axisDistanceBetweenTokens(tokenToCheck, token) )
        .every(token => token.x >= desiredTilesDistance || token.y >= desiredTilesDistance)
}

function axisDistanceBetweenTokens(token1, token2) {
    return { x: Math.abs(token1.x - token2.x) / canvas.grid.size, y: Math.abs(token1.y - token2.y) / canvas.grid.size }
}

function isConcentrating(actor) {
    const { uuid } = actor;
    console.log(uuid)
    return game.dfreds.effectInterface.hasEffectApplied("Concentrating", uuid)
}

const desiredTilesDistance = 5
return isIsolatedFromAllFriends(token, desiredTilesDistance) && isConcentrating(actor)