require('dotenv').config();
const { ShardingManager } = require('discord.js');
const path = require('path');

const manager = new ShardingManager(path.join(__dirname, 'src', 'bot.js'), {
    token: process.env.TOKEN,
    totalShards: 'auto',
});

manager.on('shardCreate', shard => {
    console.log(`[Architecture] 🚀 Lancement du Shard #${shard.id}`);
});


manager.spawn({ timeout: 120000 }).catch(err => {
    console.error('[Erreur Critique] Le gestionnaire de Shards a échoué :', err);
});