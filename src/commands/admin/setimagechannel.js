const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('setimagechannel')
        .setDescription('Définit le salon exclusif aux images/médias.')
        .addChannelOption(option => option.setName('salon').setDescription('Le salon cible').setRequired(true))
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageChannels),

    async execute(interaction, client) {
        const channel = interaction.options.getChannel('salon');

        try {
            await client.prisma.guildSettings.upsert({
                where: { guildId: interaction.guild.id },
                update: { imageChannelId: channel.id },
                create: { guildId: interaction.guild.id, imageChannelId: channel.id }
            });
    
            await interaction.reply({ content: `✅ Salon image configuré sur <#${channel.id}>.`, ephemeral: true });
        } catch (error) {
            console.error('[SetImageChannel Error]', error);
            await interaction.reply({ content: '❌ Erreur de base de données lors de la sauvegarde.', ephemeral: true });
        }
    },
};