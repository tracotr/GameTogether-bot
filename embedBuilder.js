const { ActionRowBuilder, ButtonBuilder, ButtonStyle, SlashCommandBuilder, ComponentType } = require('discord.js');
const { EmbedBuilder } = require('discord.js');

function createGameEmbed(gameData, index) {
    const embed = new EmbedBuilder();
    embed.setColor(0x703c78)

    // handle game name title
    embed.setTitle(`${(index % 5) + 1}: ${gameData.name}`);

    // handle link to IGDB page
    embed.setURL(`${gameData.url}`);

    // handle setting genres
    let gameGenres = "";
    for (const genre in gameData.genres) {
        gameGenres += `${gameData.genres[genre].name}, `;
    }

    // remove last comma, i could def find a better way to do this
    gameGenres = gameGenres.slice(0, -2);

    // if theres any genres added, add to embed
    if (gameGenres.length > 0) {
        gameGenres = `*${gameGenres}*`;
        embed.addFields(
            {
                name: "Genres:",
                value: gameGenres,
                inline: false
            },
        );
    }

    // handle adding cover
    if (gameData.hasOwnProperty("cover")) {
        embed.setThumbnail("https:" + gameData.cover.url);
    } else {
        embed.setThumbnail("https://images.igdb.com/igdb/image/upload/t_cover_big/nocover.webp");
    }

    // handle adding release date
    if (gameData.hasOwnProperty("first_release_date")) {
        const date = new Date(gameData.first_release_date * 1000);
        const gameDate = `${date.getFullYear()}-${date.getMonth()}-${date.getDay()}`;
        embed.setFooter({
            text: gameDate,
        });
    }

    return embed;
}


module.exports = {
    createGameEmbed
}