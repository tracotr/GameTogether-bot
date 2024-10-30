const { Users } = require('../../dbObjects.js');
const { SlashCommandBuilder } = require('discord.js');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('adduser')
		.setDescription('add a user to db'),
	async execute(interaction) {
        const userID = interaction.user.id;
        
		await Users.create({user_id: userID, game_list: []});

        return interaction.reply({content: "added to db", ephemeral: true});
	},
};
