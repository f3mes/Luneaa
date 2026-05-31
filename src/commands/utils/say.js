const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('say')
        .setDescription('Fait parler le bot.')
        .addStringOption(option => option.setName('texte').setDescription('Le texte à envoyer').setRequired(true))
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages),

    async execute(interaction, client) {
        const text = interaction.options.getString('texte');

        await interaction.channel.send(text);

        await interaction.reply({ content: '✅ Message envoyé.', ephemeral: true });
    },
};