const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('lock')
        .setDescription('Verrouille le salon actuel.')
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageChannels),

    async execute(interaction) {
        await interaction.channel.permissionOverwrites.edit(interaction.guild.roles.everyone, {
            SendMessages: false
        });

        const embed = new EmbedBuilder()
            .setColor('Red')
            .setDescription('🔒 Ce salon a été verrouillé.');

        await interaction.reply({ embeds: [embed] });
    },
};