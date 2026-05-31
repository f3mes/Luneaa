const { SlashCommandBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('ping')
        .setDescription('Affiche la latence du bot.'),

    async execute(interaction, client) {
        const sent = await interaction.reply({ content: 'Calcul en cours...', fetchReply: true });
        const latency = sent.createdTimestamp - interaction.createdTimestamp;
        
        await interaction.editReply(`🏓 Pong ! \nLatence du Bot : **${latency}ms**\nLatence de l'API (Discord) : **${client.ws.ping}ms**`);
    },
};