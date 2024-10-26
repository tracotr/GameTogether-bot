const { ActionRowBuilder, ButtonBuilder, ButtonStyle, SlashCommandBuilder } = require('discord.js');
const { EmbedBuilder } = require('discord.js');

const igdb = require('igdb-api-node').default;
const { chunk } = require ('lodash');

const { apiClientId, apiAuth } = require('../../config.json');



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

		const mainResponse = await igdb(apiClientId, apiAuth)
            .fields(['name', 'url', 'genres.name', 'cover.url', 'first_release_date', 'category'])
			.where('category = 0')
			.limit(5)
			.search(gameName)
            .request('/games');

		const embeds = [];

		for(const property in mainResponse.data){
			const embed = new EmbedBuilder();

			embed.setColor(0x703c78)

			// handle game name title
			embed.setTitle(mainResponse.data[property].name);
			
			// handle link to IGDB page
			embed.setURL(mainResponse.data[property].url);

			// handle setting genres
			let gameGenres = "";
			for(const genre in mainResponse.data[property].genres){
				gameGenres += mainResponse.data[property].genres[genre].name + ", ";
			}

			// remove last comma, i could def find a better way to do this
			gameGenres = gameGenres.slice(0, -2);
			
			// if theres any genres added, add to embed
			if(gameGenres.length > 0){
				gameGenres = "*" + gameGenres + "*";
				embed.addFields(
					{
					name: "Genres:",
					value: gameGenres,
					inline: false
					},
				);
			}

			// handle adding cover
			if(mainResponse.data[property].hasOwnProperty("cover")){
				embed.setThumbnail("https:" + mainResponse.data[property].cover.url );
			} else{
				embed.setThumbnail("https://images.igdb.com/igdb/image/upload/t_cover_big/nocover.webp");
			}
			
			// handle adding release date
			if(mainResponse.data[property].hasOwnProperty("first_release_date")){
				const date = new Date(mainResponse.data[property].first_release_date * 1000);
				const gameDate = date.getFullYear() + "-" + date.getMonth() + "-" + date.getDay();
				embed.setFooter({
					text: gameDate, 
				});
			}

			embeds.push(embed);
			
		}

		// split all of the embeds into chunks of 5
		const splitEmbeds = chunk(embeds, 5);

		const pageLeft = new ButtonBuilder()
			.setCustomId('test')
			.setLabel('test')
			.setStyle(ButtonStyle.Primary)

		const row = new ActionRowBuilder()
			.addComponents(test);

		await interaction.reply({
			embeds: splitEmbeds[0],
			components: [row]
		});
	},
};
