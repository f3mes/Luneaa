const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('clearwarns')
        .setDescription('Supprime tous les avertissements d\'un membre.')
        .addUserOption(option => option.setName('cible').setDescription('Le membre cible').setRequired(true))
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),
        
    async execute(interaction, client) {
        const target = interaction.options.getUser('cible');

        const result = await client.prisma.warn.deleteMany({
            where: {
                userId: target.id,
                guildId: interaction.guild.id
            }
        });

        await interaction.reply({ content: `🗑️ **${result.count}** avertissement(s) supprimé(s) pour <@${target.id}>.` });
    },
};