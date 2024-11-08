const { ActionRowBuilder, SlashCommandBuilder, ComponentType, ButtonStyle } = require('discord.js');

const { Users } = require('../../dbObjects.js');


const { chunk } = require('lodash');

const { APISearchGameName } = require ('../../utils/apiCallFunctions.js');
const { createButton } = require ('../../utils/buttonBuilder.js');
const { createGameEmbed } = require ('../../utils/embedBuilder.js');


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
		let mainResponse;

		try{
			mainResponse = await APISearchGameName(gameName, defaultLimit);

			if(mainResponse.length == 0){
				return interaction.reply({
					content: `No games found!`,
					ephemeral: true,
				});
			}
		} catch(e){
			console.error('Error fetching game data:', error);
			return interaction.reply({ content: 'There was an error retrieving game data. Please try again later.', ephemeral: true });
		}

		const embeds = [];

		for (const property in mainResponse) {
			const newEmbed = await createGameEmbed(mainResponse[property], property)
			embeds.push(newEmbed);
		}

		// split all of the embeds into chunks of 5
		const splitEmbeds = chunk(embeds, 5);
		const splitGames = chunk(mainResponse, 5);

		const embedPagesLength = splitEmbeds.length - 1;
		let currentPage = 0;

		// constructing buttons and row embeds
		const pageNumber = createButton(`${currentPage + 1}/${embedPagesLength + 1}`, 'pageNumber', ButtonStyle.Secondary, true);

		const pageLeft = createButton('<', 'pageLeft', ButtonStyle.Primary);

		const pageRight = createButton('>', 'pageRight', ButtonStyle.Primary);

		const pageRow = new ActionRowBuilder()
			.addComponents(pageLeft, pageNumber, pageRight);

		// buttons to select game
		const selectRow = createButtonsRow();

		updateButtonStates(selectRow);

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
				currentPage = (currentPage + 1) % (embedPagesLength + 1);
			}
			if (i.customId == 'pageLeft') {
				currentPage = (currentPage - 1 + (embedPagesLength + 1)) % (embedPagesLength + 1);
			}


			pageNumber.setLabel((currentPage + 1) + "/" + (embedPagesLength + 1));

			updateButtonStates();

			await i.update({
				embeds: splitEmbeds[currentPage],
				components: [selectRow, pageRow],
				ephemeral: true
			});
		});

		collector.on('end', collected => interaction.deleteReply());


		function createButtonsRow(){
			const row = new ActionRowBuilder();

			for (let i = 1; i <= 5; i++) {
				const selectGameButton = createButton(`${i}`, `selectGameButton${i}`, 'Secondary');
				row.addComponents(selectGameButton);
			}

			return row;
		}

		function updateButtonStates() {
			for (let i = 0; i < 5; i++) {
				selectRow.components[i].setDisabled(false);
			}
			for (let i = splitEmbeds[currentPage].length; i < 5; i++) {
				selectRow.components[i].setDisabled(true);
			}
		}

		async function addGame(_userID, _gameID, _gameName) {
			const user = await Users.findOrCreate({
				where: {user_id: _userID},
				defaults: {
					user_id: _userID,
					game_list: [],
				}
			});

			if(user){
				let gameList = user[0].dataValues.game_list;
				
				// end early if already in list
				if (gameList.some(f => f.gameID == _gameID)) {
					interaction.followUp({ content: `${_gameName} already in games.`, ephemeral: true })
					return;
				}

				gameList.push({gameID: _gameID, gameName: _gameName});

				await Users.update({ game_list: gameList }, { where: { user_id: _userID } });
				
				await interaction.followUp({ content: `${_gameName} added to games.`, ephemeral: true })
			}
		}
	},
};
