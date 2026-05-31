const { Events, EmbedBuilder } = require('discord.js');

module.exports = {
    name: Events.InteractionCreate,
    async execute(interaction, client){
        if (!interaction.isChatInputCommand()) return;

        const command = client.commands.get(interaction.commandName);

        if (!command) {
            console.error(`[Alerte Routeur] Commande inconnue : ${interaction.commandName}`);
            return;
        }

        try {
            await command.execute(interaction, client);
        } catch (error) {
            console.error(`[Erreur] Echec de la commande ${interaction.commandName} :`, error);

            const errorEmbed = new EmbedBuilder()
                .setColor('Red')
                .setDescription('Une erreur interne est survenue lors de l\'exécution de cette commande. Le problème à été loggué.');

            if (interaction.replied || interaction.deferred) {
                await interaction.followUp({ embeds: [errorEmbed], ephemeral: true});
            } else {
                await interaction.reply({ embeds: [errorEmbed], ephemeral: true});
            }
        }
    },
};