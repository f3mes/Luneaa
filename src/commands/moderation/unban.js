const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('unban')
        .setDescription('Débannit un utilisateur du serveur.')
        .addStringOption(option => option.setName('id').setDescription('L\'ID Discord de l\'utilisateur à débannir').setRequired(true))
        .setDefaultMemberPermissions(PermissionFlagsBits.BanMembers),

    async execute(interaction, client) {
        const userId = interaction.options.getString('id');

        try {
            await interaction.guild.members.unban(userId, `Débanni par ${interaction.user.tag}`);

            await client.prisma.activeSanction.deleteMany({
                where: { userId: userId, guildId: interaction.guild.id, type: 'BAN' }
            });

            const embed = new EmbedBuilder()
                .setColor('Green')
                .setTitle('✅ Utilisateur Débanni')
                .setDescription(`L'utilisateur avec l'ID \`${userId}\` a été débanni du serveur.`);

            await interaction.reply({ embeds: [embed] });
        } catch (error) {
            console.error('[Unban Error]', error);
            await interaction.reply({ content: '❌ Impossible de débannir. L\'ID est invalide ou cet utilisateur n\'est pas banni.', ephemeral: true });
        }
    },
};