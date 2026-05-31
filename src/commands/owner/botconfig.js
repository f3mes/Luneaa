const { SlashCommandBuilder } = require('discord.js');

const OWNER_ID = '1132930851508846622';

module.exports = {
    data: new SlashCommandBuilder()
        .setName('botconfig')
        .setDescription('DEV ONLY - Gère l\'état et le profil du bot.')
        .addSubcommand(sub => sub.setName('stop').setDescription('Éteint le bot.'))
        .addSubcommand(sub => sub.setName('setname')
            .setDescription('Change le nom du bot.')
            .addStringOption(o => o.setName('nom').setDescription('Nouveau nom').setRequired(true)))
        .addSubcommand(sub => sub.setName('setavatar')
            .setDescription('Change la photo de profil du bot.')
            .addAttachmentOption(o => o.setName('image').setDescription('La nouvelle image').setRequired(true))),

    async execute(interaction, client) {
        if (interaction.user.id !== OWNER_ID) {
            return interaction.reply({ content: '⛔ Accès refusé.', ephemeral: true });
        }

        const subcommand = interaction.options.getSubcommand();

        if (subcommand === 'stop') {
            await interaction.reply({ content: '🛑 Arrêt en cours...', ephemeral: true });
            process.exit(0);
        }

        if (subcommand === 'setname') {
            const newName = interaction.options.getString('nom');
            try {
                await client.user.setUsername(newName);
                await interaction.reply({ content: `✅ Nom modifié en **${newName}**.`, ephemeral: true });
            } catch (error) {
                await interaction.reply({ content: `❌ Erreur : ${error.message}`, ephemeral: true });
            }
        }

        if (subcommand === 'setavatar') {
            const image = interaction.options.getAttachment('image');
            try {
                await client.user.setAvatar(image.url);
                await interaction.reply({ content: '✅ Avatar modifié avec succès !', ephemeral: true });
            } catch (error) {
                await interaction.reply({ content: `❌ Erreur : ${error.message}`, ephemeral: true });
            }
        }
    },
};