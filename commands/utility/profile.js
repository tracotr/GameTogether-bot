const { ActionRowBuilder, StringSelectMenuBuilder, SlashCommandBuilder, ComponentType, EmbedBuilder, ButtonStyle } = require('discord.js');
const { Users } = require('../../dbObjects.js');

const { APISearchGameID } = require ('../../utils/apiCallFunctions.js');
const { createButton } = require ('../../utils/buttonBuilder.js');
const { createGameEmbed } = require ('../../utils/embedBuilder.js');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('profile')
		.setDescription('your profile, look at your games or remove them'),

	async execute(interaction) {
		const userID = interaction.user.id;

        await Users.findOrCreate({
            where: {user_id: userID},
            defaults: {
                user_id: userID,
                game_list: [],
            }
        });
        const user = await Users.findByPk(userID);

        const userData = user.dataValues.game_list || [];

        
        let profileEmbed = updateProfileEmbed(interaction.user, userData);

        let profileRow = new ActionRowBuilder();
        updateSelectMenu(userData);


        const deleteGameButton = createButton('Delete from games', 'deleteGame', ButtonStyle.Danger);

        const deleteRow = new ActionRowBuilder()
            .addComponents( deleteGameButton );
        

        const response = await interaction.reply({
            embeds: [profileEmbed],
        });


        if(userData.length > 0){
            await response.edit({
                components: [profileRow],
            })
        }

        const collectorTime = 1_800_00; // 30 minutes
        const collectorFilter = i => i.user.id === interaction.user.id;

        const menuCollector = await response.createMessageComponentCollector({ componentType: ComponentType.StringSelect, filter: collectorFilter, time: collectorTime });
        const gameCollector = await response.createMessageComponentCollector({ componentType: ComponentType.Button, filter: collectorFilter, time: collectorTime});


        let gameID;

        // looking for select menu collections, and changing displayed game to selected menu option
        menuCollector.on('collect', async i => {
            gameID = i.values[0];

            if(gameID != undefined){
                let chosenGameData;
                let chosenGameEmbed;

                try{
                    chosenGameData = await APISearchGameID(gameID, 1);
                    chosenGameEmbed = await createGameEmbed(chosenGameData[0], -1);
                } catch(e){
                    console.error('Error fetching game data:', error);
                    await i.reply({ content: 'There was an error retrieving game data. Please try again later.', ephemeral: true });
                }

                await i.update({
                    embeds: [profileEmbed, chosenGameEmbed],
                    components: [deleteRow, profileRow],
                })
            }


        });

        // looking for delete button presses, deletes current game displayed
        gameCollector.on('collect', async i =>{
            if (i.customId == 'deleteGame') {
                // looks for gameID being deleted and removes it
                for(let game in userData){
                    if(userData[game].gameID == gameID){
                        userData.splice(game, 1);
                    }
                }

                await Users.update({ game_list: userData }, { where: { user_id: userID } });

                updateSelectMenu(userData);
                profileEmbed = updateProfileEmbed(interaction.user, userData);
                
                //  if there are more games to show, show them, else do not
                if(userData.length > 0){
                    await i.update({
                        embeds: [profileEmbed],
                        components: [profileRow],
                    })
                } 
                else{
                    await i.update({
                        embeds: [profileEmbed],
                        components: [],
                    })
                }
            }
        });

        // deletes message whenever collectors end
        menuCollector.on('end', () => {
            gameCollector.stop();
        });

        gameCollector.on('end', collected => {
            menuCollector.stop();

            try{
                interaction.deleteReply()
            } catch(e){
                console.log("Interaction could not be deleted" , e);
            }
        });

        function updateSelectMenu(userData){
            let _gameMenu = new StringSelectMenuBuilder()
                .setCustomId('gameMenu')
                .setPlaceholder('Choose game to view');

            if(userData.length > 0){
                _gameMenu.addOptions(
                    userData.map(game => ({
                        label: `${game.gameName}`,
                        value: `${game.gameID}`,
                    }))
                );
            }
            profileRow.setComponents([]);
            profileRow.addComponents(_gameMenu);
        }

        // returns a profile embed for user
        function updateProfileEmbed(user, userData){
            return new EmbedBuilder()
                .setColor(0x703c78)
                .setTitle(`${user.username}`)
                .setThumbnail(user.avatarURL())
                .addFields({
                    name: `Game Amount: ${userData.length}`,
                    value: '\u200b',
                    inline: true,
                });
        }
	},
};
