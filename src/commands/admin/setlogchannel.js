const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('setlogchannel')
        .setDescription('Définit le salon où les logs des commandes seront envoyés.')
        .addChannelOption(option => option.setName('salon').setDescription('Le salon de logs').setRequired(true))
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild),

    async execute(interaction, client) {
        const channel = interaction.options.getChannel('salon');

        try {
            // Mise à jour de la base de données
            await client.prisma.guildSettings.upsert({
                where: { guildId: interaction.guild.id },
                update: { logChannelId: channel.id },
                create: { guildId: interaction.guild.id, logChannelId: channel.id }
            });
    
            await interaction.reply({ content: `✅ Salon de logs configuré avec succès sur <#${channel.id}>.`, ephemeral: true });
        } catch (error) {
            console.error('[SetLogChannel Error]', error);
            await interaction.reply({ content: '❌ Erreur de base de données lors de la sauvegarde.', ephemeral: true });
        }
    },
};