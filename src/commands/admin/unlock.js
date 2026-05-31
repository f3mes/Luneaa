const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('unlock')
        .setDescription('Déverrouille le salon actuel.')
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageChannels),

    async execute(interaction) {
        await interaction.channel.permissionOverwrites.edit(interaction.guild.roles.everyone, {
            SendMessages: true
        });

        const embed = new EmbedBuilder()
            .setColor('Green')
            .setDescription('🔓 Ce salon a été déverrouillé.');

        await interaction.reply({ embeds: [embed] });
    },
};