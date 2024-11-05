const { ActionRowBuilder, StringSelectMenuBuilder, StringSelectMenuOptionBuilder, SlashCommandBuilder } = require('discord.js');
const { Users } = require('../../dbObjects.js');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('profile')
		.setDescription('your profile'),
	async execute(interaction) {
		const userID = interaction.user.id;


        const data = await Users.findOrCreate({
            where: {user_id: userID},
            defaults: {
                user_id: userID,
                game_list: [],
            }
        })

        const userData = data[0].dataValues.game_list;

        const gameMenu = new StringSelectMenuBuilder()
            .setCustomId('gameMenu')
            .setPlaceholder('Choose game to ');
        
        for(game of userData){
            console.log(game.gameName);
            gameMenu.addOptions(
                new StringSelectMenuOptionBuilder()
                    .setLabel(`${game.gameName}`)
                    .setValue(`${game.gameID}`)
            )
        }
        const profileRow = new ActionRowBuilder()
			.addComponents(gameMenu);
        
        await interaction.reply({
            content: `See games`,
            components: [profileRow],
        });
	},
};
