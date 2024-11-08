const igdb = require('igdb-api-node').default;
const { apiClientId, apiAuth } = require('../config.json');

async function APISearchGameName(name, limit){
    const response =  await igdb(apiClientId, apiAuth)
        .fields(['name', 'url', 'genres.name', 'cover.url', 'first_release_date'])
        .where('category = 0')
        .limit(limit)
        .search(name)
        .request('/games');
    
    return response.data;
}

async function APISearchGameID(id, limit){
    const response =  await igdb(apiClientId, apiAuth)
        .fields(['name', 'url', 'genres.name', 'cover.url', 'first_release_date'])
        .where(`id = ${id}`)
        .limit(limit)
        .request('/games');

    return response.data
}

module.exports = {
    APISearchGameName, APISearchGameID
}