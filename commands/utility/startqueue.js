const { ActionRowBuilder, ButtonBuilder, ButtonStyle, SlashCommandBuilder, ComponentType, EmbedBuilder } = require('discord.js');

const { Users } = require('../../dbObjects.js');

const { APISearchGameID } = require ('../../utils/apiCallFunctions.js');
const { createGameEmbed } = require ('../../utils/embedBuilder.js');
const { createButton } = require ('../../utils/buttonBuilder.js');


module.exports = {
    data: new SlashCommandBuilder()
        .setName('startqueue')
        .setDescription('join queue'),

    async execute(interaction) {
        const queueEmbed = new EmbedBuilder()
            .setColor(0x703c78)
            .setTitle("Game Queue")
            .addFields(
                {
                    name: "Queue",
                    value: '\u200b',
                    inline: false
                });

        const joinQueue = createButton('Join', 'joinQueue', ButtonStyle.Success) 
            .setEmoji('1177022754684424295');


         const leaveQueue = createButton('Leave', 'leaveQueue', ButtonStyle.Danger)
            .setEmoji('1115561769289650216');


        const rerollQueue = createButton('Reroll', 'rerollQueue', ButtonStyle.Primary, true)
            .setEmoji('932616415704391720');


        const queueControlsRow = new ActionRowBuilder()
            .addComponents(joinQueue, leaveQueue, rerollQueue);


        const response = await interaction.reply({
            embeds: [queueEmbed],
            components: [queueControlsRow]
        });

        const collector = await response.createMessageComponentCollector({ componentType: ComponentType.Button, time: 600_000 });

        const current_user_list = [];
        const newEmbeds = [];
        newEmbeds[0] = queueEmbed;

        collector.on('collect', async i => {
            const userID = i.user.id;

            // if join, add current user id to queue for processing
            if (i.customId == 'joinQueue') {
                if (!current_user_list.includes(userID)) {
                    const user = await Users.findByPk(userID)
                    if (user) {
                        current_user_list.push(userID);
                    } else {
                        return i.reply({
                            content: `Profile not found, add a game to create`,
                            ephemeral: true
                        });
                    }

                    UpdateQueue();
                }
                else {
                    return i.reply({
                        content: "You're already in queue!",
                        ephemeral: true
                    })
                }
            }

            if (i.customId == 'leaveQueue'){
                const index = current_user_list.findIndex((user) => user == userID);
                if(index > -1){
                    current_user_list.splice(index, 1);
                    UpdateQueue();
                    
                } else{
                    return i.reply({
                        content: "You're not in queue!",
                        ephemeral: true
                    })
                }
            }


            // if refresh to find game
            if (i.customId == 'rerollQueue') {
                // list of every user in queues games
                const games = [];

                // loop through all, finding each game ist and adding to games
                for (const userID of current_user_list) {
                    const user = await Users.findByPk(userID)
                    if (user) {
                        games.push(...user.game_list);
                    } else {
                        return interaction.followUp({
                            content: `${i.user.username} not found, add a game to create`,
                            ephemeral: true
                        });
                    }
                }

                let chosenGame;
                // catch error if array is empty before trying to reduce
                try {
                    let result = [];

                    // if list has more than 1 person
                    if (current_user_list.length > 1) {
                        // find similar ids in each list
                        const gameCountMap = new Map();
                        // for everything in games, add 1 to map if it appears
                        games.forEach(game => { gameCountMap.set(game.gameID, (gameCountMap.get(game.gameID) || 0) + 1); });

                        // adds to result if count is > 1 and adds only once if already in array
                        result = games.filter((game, index, self) => {
                            return gameCountMap.get(game.gameID) > 1
                                && self.findIndex(g => g.gameID === game.gameID) === index;
                        });
                    } else {
                        result.push(...games)
                    }

                    const randomResultIndex = Math.floor(Math.random() * result.length)
                    chosenGame = result[randomResultIndex];
                }
                catch (error) {
                    console.log("empty games array");
                }

                // if no game found, put no game found embed
                if(chosenGame != undefined){
                    const chosenGameData = await APISearchGameID(chosenGame.gameID, 1);
                    const chosenGameEmbed = await createGameEmbed(chosenGameData[0], -1);
                    newEmbeds[1] = chosenGameEmbed;
                } else{
                    const noChosenGameEmbed = await new EmbedBuilder()
                        .setColor(0x703c78)
                        .setTitle("No game found?")
                        .setDescription("Add more games :smile:")
                        newEmbeds[1] = noChosenGameEmbed;
                }

                
            }

            // cant reroll if no one in queue!
            if (current_user_list.length > 0) {
                rerollQueue.setDisabled(false);
            } else {
                rerollQueue.setDisabled(true);
            }

            await i.update({
                embeds: newEmbeds,
                components: [queueControlsRow],
            })
        });

        collector.on('end', async i => {
            for (const property in queueControlsRow.components) {
                queueControlsRow.components[property].setDisabled(true);
            }

            interaction.editReply({
                components: [queueControlsRow],
            });
        })

        // updates queue embed
        function UpdateQueue(){
            let _userString = "";

            if(current_user_list.length > 0){
                current_user_list.forEach((user) => _userString += `<@${user}> `);
            } else{
                _userString = '\u200b';
            }

            queueEmbed.setFields({
                name: "Queue",
                value: _userString,
            });

            newEmbeds[0] = queueEmbed;
        }
    },
};
