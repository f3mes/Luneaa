const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('help')
        .setDescription('Affiche la liste de toutes les commandes disponibles.'),

    async execute(interaction, client) {
        const commands = client.commands;
        let commandList = '';

        commands.forEach(cmd => {
            commandList += `**/${cmd.data.name}** : ${cmd.data.description}\n`;
        });

        const embed = new EmbedBuilder()
            .setColor('Purple')
            .setTitle('📚 Liste des commandes de Luneaa')
            .setDescription(commandList)
            .setFooter({ text: 'Astuce : Tape / pour voir les options détaillées de chaque commande !' });

        await interaction.reply({ embeds: [embed], ephemeral: true }); 
    },
};