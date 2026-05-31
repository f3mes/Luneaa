const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('warn')
        .setDescription('Avertit un membre du serveur')
        .addUserOption(option =>
            option.setName('membre')
                .setDescription('Le membre à avertir')
                .setRequired(true))
        .addStringOption(option =>
            option.setName('raison')
                .setDescription('La raison de l\'avertissement')
                .setRequired(false))
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages),
    
        async execute(interaction, client) {
            const member = interaction.options.getMember('membre');
            const reason = interaction.options.getString('raison') || 'Aucune raison fournie';

            await client.prisma.warn.create({
                data: {
                    guildId: interaction.guild.id,
                    userId: member.id,
                    reason: reason,
                },
            });
        
        const embed = new EmbedBuilder()
            .setColor('Yellow')
            .setTitle('Nouvel Avertissement')
            .setDescription('<@${target.id}> a été averti. \n**Raison:** ${reason}')
            .setFooter({ text: 'Sanction appliqué par ${interaction.user.tag}'});

        await interaction.reply({ embeds: [embed]});
    },
};