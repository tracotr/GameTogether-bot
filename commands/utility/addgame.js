const { Users } = require('../../dbObjects.js');
const { SlashCommandBuilder } = require('discord.js');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('addgame')
		.setDescription('add a game to your list')
        .addStringOption(option =>
			option
                .setName('gameid')
				.setDescription('game to add')
				.setRequired(true)),

	async execute(interaction) {
        const userID = interaction.user.id;
        const gameID = interaction.options.getString('gameid');

        await Users.findByPk(userID)
            .then(user => {
                if(user){
                    let gameList = user.game_list;

                    let newGameList = [];
                    for(var i in gameList) {
                        newGameList.push(gameList[i]);
                    }

                    newGameList.push(parseInt(gameID));

                    Users.update({game_list: Array.from(new Set(newGameList))}, {where: {user_id: userID}});

                    interaction.reply(`updated list for ${userID}`);
                    return user.save();
                } else{
                    return interaction.reply('User not found');
                }
            })
            .catch(err => {
                console.log('Error:', err);
            });
	},
};
