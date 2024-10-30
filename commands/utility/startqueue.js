const { ActionRowBuilder, ButtonBuilder, ButtonStyle, SlashCommandBuilder, ComponentType } = require('discord.js');
const { EmbedBuilder } = require('discord.js');

const igdb = require('igdb-api-node').default;
const { apiClientId, apiAuth } = require('../../config.json');

const { Users } = require('../../dbObjects.js');

const { APISearchGameID } = require('../../apiCallFunctions.js');



module.exports = {
    data: new SlashCommandBuilder()
        .setName('startqueue')
        .setDescription('join queue'),
    async execute(interaction) {

        const joinQueue = new ButtonBuilder()
            .setCustomId('joinQueue')
            .setEmoji('✅')
            .setLabel('Join')
            .setStyle(ButtonStyle.Success);

        const rerollQueue = new ButtonBuilder()
            .setCustomId('rerollQueue')
            .setEmoji('🔃')
            .setLabel('Reroll')
            .setStyle(ButtonStyle.Primary)

        const queueControlsRow = new ActionRowBuilder()
            .addComponents(joinQueue, rerollQueue);

        const response = await interaction.reply({
            content: `React to find similar game.`,
            components: [queueControlsRow]
        });

        const collector = await response.createMessageComponentCollector({ componentType: ComponentType.Button, time: 100_000 });

        const current_user_list = [];
        collector.on('collect', async i => {
            // if join, add current user id to queue for processing
            const userID = i.user.id;

            if (i.customId == 'joinQueue') {
                try {
                    if (!current_user_list.includes(userID)) {
                        current_user_list.push(userID);
                        console.log(current_user_list);
                        await i.update({
                            content: `${current_user_list.length} in queue`
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
                                for (const game in user.game_list) {
                                    games.push(user.game_list[game]);
                                }
                            } else {
                                return interaction.followUp({
                                    content: 'User not found, /adduser to create',
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

                    // find similar ids in each list
                    const gameCountMap = new Map();
                    // for everything in games, add 1 to map if it appears
                    games.forEach(game => { gameCountMap.set(game.gameID, (gameCountMap.get(game.gameID) || 0) + 1); });

                    // adds to result if count is > 1 and adds only once if already in array
                    result = games.filter((game, index, self) => {
                        return gameCountMap.get(game.gameID) > 1
                            && self.findIndex(g => g.gameID === game.gameID) === index;
                    });

                    chosenGame = result[0];
                }
                catch (error) {
                    console.log("empty games array");
                }
                const chosenGameData = APISearchGameID(chosenGame.gameID, 1);
                
                console.log(chosenGameAPICall.data);
                await i.update({ content: `${chosenGame.gameName}` })
            }
        });
    },
};
