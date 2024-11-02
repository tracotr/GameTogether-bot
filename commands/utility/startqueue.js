const { ActionRowBuilder, ButtonBuilder, ButtonStyle, SlashCommandBuilder, ComponentType } = require('discord.js');
const { EmbedBuilder } = require('discord.js');

const { Users } = require('../../dbObjects.js');

const { APISearchGameID } = require('../../apiCallFunctions.js');
const { createGameEmbed } = require ('../../embedBuilder.js');


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

        const joinQueue = new ButtonBuilder()
            .setCustomId('joinQueue')
            .setEmoji('✅')
            .setLabel('Join')
            .setStyle(ButtonStyle.Success)
            .setDisabled(false);

        const rerollQueue = new ButtonBuilder()
            .setCustomId('rerollQueue')
            .setEmoji('🔃')
            .setLabel('Reroll')
            .setStyle(ButtonStyle.Primary)
            .setDisabled(false);

        const queueControlsRow = new ActionRowBuilder()
            .addComponents(joinQueue, rerollQueue);

        const response = await interaction.reply({
            embeds: [queueEmbed],
            components: [queueControlsRow]
        });

        const collector = await response.createMessageComponentCollector({ componentType: ComponentType.Button, time: 5_000 });

        const current_user_list = [];
        collector.on('collect', async i => {
            // if join, add current user id to queue for processing
            if (i.customId == 'joinQueue') {
                const userID = i.user.id;

                try {
                    if (!current_user_list.includes(userID)) {
                        current_user_list.push(userID);
                        
                        let userString = "";
                        current_user_list.forEach((user) => userString += `<@${user}> `)
                        queueEmbed.setFields({
                            name: "Queue",
                            value: userString,
                        })
                        await i.update({
                            embeds: [queueEmbed],
                        })
                    }
                    else {
                        await i.reply({
                            content: "You're already in queue!",
                            ephemeral: true
                        })
                    }
                } catch (e) {
                    console.log(e);
                }
            }

            // if refresh to find game
            if (i.customId == 'rerollQueue') {
                // list of every user in queues games
                const games = [];

                // loop through all, finding each game ist and adding to games
                for (const userID of current_user_list) {
                    await Users.findByPk(userID)
                        .then(user => {
                            if (user) {
                                games.push(...user.game_list);
                            } else {
                                return interaction.followUp({
                                    content: 'User not found, add a game to create',
                                    ephemeral: true
                                });
                            }
                        })
                        .catch(err => {
                            console.log('Error:', err);
                        })
                }

                let chosenGame;
                // catch error if array is empty before trying to reduce
                try {
                    let result = [];

                    if(current_user_list.length > 1){
                        // find similar ids in each list
                        const gameCountMap = new Map();
                        // for everything in games, add 1 to map if it appears
                        games.forEach(game => { gameCountMap.set(game.gameID, (gameCountMap.get(game.gameID) || 0) + 1); });

                        // adds to result if count is > 1 and adds only once if already in array
                        result = games.filter((game, index, self) => {
                            return gameCountMap.get(game.gameID)  > 1
                                && self.findIndex(g => g.gameID === game.gameID) === index;
                        });
                    } 
                    else{
                        result.push(...games)
                    } 

                    const randomResultIndex = Math.floor(Math.random() * result.length)
                    chosenGame = result[randomResultIndex];
                }
                catch (error) {
                    console.log("empty games array");
                }

                const chosenGameData = await APISearchGameID(chosenGame.gameID, 1);
                const chosenGameEmbed = await createGameEmbed(chosenGameData[0], -1);

                await i.update({ 
                    embeds: [queueEmbed, chosenGameEmbed],
                });
            }
        });

        collector.on('end', async i => {
            for(const property in queueControlsRow.components){
                queueControlsRow.components[property].setDisabled(true);
            }
            
            interaction.editReply({
                components: [queueControlsRow],
            });
        })
    },
};
