const { ButtonBuilder } = require('discord.js');


function createButton(label, customId, style, disabled = false){
    return new ButtonBuilder()
        .setCustomId(customId)
        .setLabel(label)
        .setStyle(style)
        .setDisabled(disabled);
}

module.exports = {
    createButton
}