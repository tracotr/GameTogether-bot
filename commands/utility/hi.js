const { SlashCommandBuilder } = require('discord.js');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('hi')
		.setDescription('Says hi.'),
	async execute(interaction) {
		await interaction.reply(`Hi ${interaction.user.username}! ` + ":smile:");
	},
};
