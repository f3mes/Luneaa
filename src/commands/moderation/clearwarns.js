const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('clearwarns')
        .setDescription('Supprime tous les avertissements d\'un membre.')
        .addUserOption(option => option.setName('cible').setDescription('Le membre cible').setRequired(true))
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),
        
    async execute(interaction, client) {
        const target = interaction.options.getUser('cible');

        try {
            const result = await client.prisma.warn.deleteMany({
                where: {
                    userId: target.id,
                    guildId: interaction.guild.id
                }
            });
    
            await interaction.reply({ content: `🗑️ **${result.count}** avertissement(s) supprimé(s) pour <@${target.id}>.` });
        } catch (error) {
            console.error('[ClearWarns Error]', error);
            await interaction.reply({ content: '❌ Une erreur est survenue lors de la suppression des avertissements.', ephemeral: true });
        }
    },
};