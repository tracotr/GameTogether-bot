const { SlashCommandBuilder } = require('discord.js');
const { EmbedBuilder } = require('discord.js');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('user')
		.setDescription('Provides information about the user.'),
	async execute(interaction) {
		const user = new EmbedBuilder()
		user.setImage(interaction.user.avatarURL())
		user.setDescription(`This command was run by ${interaction.user.username}
			Joined ${interaction.guild.name} on ${interaction.member.joinedAt}
			Account was created ${interaction.user.createdAt}`)

		await interaction.reply({embeds: [user] })
	},
};