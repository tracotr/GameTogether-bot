const { ActionRowBuilder, ButtonBuilder, ButtonStyle, SlashCommandBuilder, ComponentType } = require('discord.js');

const { Users } = require('../../dbObjects.js');


const { chunk } = require('lodash');

const { APISearchGameName } = require ('../../apiCallFunctions.js');
const { createGameEmbed } = require ('../../embedBuilder.js');


module.exports = {
	data: new SlashCommandBuilder()
		.setName('searchgames')
		.setDescription('Search for games on IGDB')
		.addStringOption(option =>
			option
				.setName('gamename')
				.setDescription('game to search')
				.setRequired(true)),
	async execute(interaction) {
		const gameName = interaction.options.getString('gamename');
		const defaultLimit = 50;

		// TODO: Add check if nsfw
		// name, url, genres.name, cover.url, first_release_date, category
		const mainResponse = await APISearchGameName(gameName, defaultLimit);

		if(mainResponse.length == 0){
			return interaction.reply({
				content: `No games found!`,
				ephemeral: true,
			});
		}
		const embeds = [];

		for (const property in mainResponse) {
			newEmbed = await createGameEmbed(mainResponse[property], property)
			embeds.push(newEmbed);
		}

		// split all of the embeds into chunks of 5
		const splitEmbeds = chunk(embeds, 5);
		const splitGames = chunk(mainResponse, 5);

		const embedPagesLength = splitEmbeds.length - 1;
		let currentPage = 0;

		// constructing buttons and row embeds
		const pageNumber = new ButtonBuilder()
			.setCustomId('pageNumber')
			.setLabel(`${currentPage + 1}/${embedPagesLength + 1}`)
			.setStyle(ButtonStyle.Secondary)
			.setDisabled(true)

		const pageLeft = new ButtonBuilder()
			.setCustomId('pageLeft')
			.setLabel('<')
			.setStyle(ButtonStyle.Primary)

		const pageRight = new ButtonBuilder()
			.setCustomId('pageRight')
			.setLabel('>')
			.setStyle(ButtonStyle.Primary)

		const pageRow = new ActionRowBuilder()
			.addComponents(pageLeft, pageNumber, pageRight);

		// buttons to select game
		const selectRow = new ActionRowBuilder();
		for (let i = 1; i <= 5; i++) {
			const selectGameButton = new ButtonBuilder()
				.setCustomId(`selectGameButton${i}`)
				.setLabel(`${i}`)
				.setStyle('Secondary')
			selectRow.addComponents(selectGameButton);
		}

		refreshButtons(selectRow);

		const response = await interaction.reply({
			embeds: splitEmbeds[currentPage],
			components: [selectRow, pageRow],
			ephemeral: true
		});

		const collectorFilter = i => i.user.id === interaction.user.id;

		const collector = await response.createMessageComponentCollector({ componentType: ComponentType.Button, filter: collectorFilter, time: 480_000 });

		collector.on('collect', async i => {
			if (i.customId.startsWith('selectGameButton')) {
				const index = i.customId.substr(i.customId.length - 1);
				const gameID = splitGames[currentPage][index - 1].id;
				const gameName = splitGames[currentPage][index - 1].name;
				const userID = interaction.user.id;

				addGame(userID, gameID, gameName);
			}


			if (i.customId == 'pageRight') {
				currentPage++;
			}
			if (i.customId == 'pageLeft') {
				currentPage--;
			}

			if (currentPage < 0) currentPage = embedPagesLength;
			if (currentPage > embedPagesLength) currentPage = 0;

			pageNumber.setLabel((currentPage + 1) + "/" + (embedPagesLength + 1));

			refreshButtons();

			await i.update({
				embeds: splitEmbeds[currentPage],
				components: [selectRow, pageRow],
				ephemeral: true
			});
		});

		collector.on('end', collected => interaction.deleteReply());


		function refreshButtons() {
			for (let i = 0; i < 5; i++) {
				selectRow.components[i].setDisabled(false);
			}
			for (let i = splitEmbeds[currentPage].length; i < 5; i++) {
				selectRow.components[i].setDisabled(true);
			}
		}

		async function addGame(userID, gameID, gameName) {
			await Users.findOrCreate({
				where: {user_id: userID},
				defaults: {
					user_id: userID,
					game_list: [],
				}
			}).then(user => {
				if(user){
					let gameList = user[0].dataValues.game_list;
					
					// end early if already in list
					if (gameList.some(f => f.gameID == gameID)) {
						interaction.followUp({ content: `${gameName} already in games.`, ephemeral: true })
						return;
					}
	
					let newGame = {
						gameID: gameID,
						gameName: gameName
					};
	
					gameList.push(newGame);
	
					Users.update({ game_list: gameList }, { where: { user_id: userID } });
					
					interaction.followUp({ content: `${gameName} added to games.`, ephemeral: true })
					return;
				}
			})
		}
	},
};
