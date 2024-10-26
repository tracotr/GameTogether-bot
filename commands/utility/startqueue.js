const { Users } = require('../../dbObjects.js');
const { SlashCommandBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('startqueue')
        .setDescription('join queue'),
    async execute(interaction) {

        const message = await interaction.reply({
            content: 'react',
            fetchReply: true
        });

        const join_emoji = '✅'
        const refresh_emoji = '🔄'

        // react to message FIRST!!!!!!
        await message.react(join_emoji);
        await message.react(refresh_emoji);
  
        // checks if the reaction is the correct types
        const filter = (reaction, user) => {
            join_emoji.includes(reaction.emoji.name) || refresh_emoji.includes(reaction.emoji.name);
        };

        const collector = message.createReactionCollector(filter);

        let current_user_list = [];
        
        collector.on('collect', async (reaction, user) => {
            // collect user game list
            // compare games together
            // print out game

            // if join, add current user id to queue for processing
            if(reaction.emoji.name == join_emoji){
                current_user_list.push(user.id);
                console.log(current_user_list);
            }

            // if refresh to find game
            if(reaction.emoji.name == refresh_emoji){
                // list of every user in queues games
                const games = [];

                // loop through all, finding each game ist and adding to games
                for(const userID of current_user_list){
                    await Users.findByPk(userID)
                    .then(user => {
                        if(user){
                            games.push([...user.game_list]);
                        } else{
                            return interaction.reply('User not found');
                        }
                    })
                    .catch(err => {
                        console.log('Error:', err);
                    })
                }

                let result = [];
                // catch error if array is empty before trying to reduce
                try{
                    // find similar ids in each list
                    result = await games.reduce((p,c) => p.filter(e => c.includes(e)));
                }
                catch(error){
                    console.log("empty games array");
                }

                console.log(result);
            }
        });
    },
};
