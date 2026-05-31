const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('ban')
        .setDescription('Bannit un membre (Temporaire ou Définitif).')
        .addUserOption(option => option.setName('cible').setDescription('Membre à bannir').setRequired(true))
        .addStringOption(option => option.setName('raison').setDescription('Raison du bannissement').setRequired(false))
        .addIntegerOption(option => option.setName('duree').setDescription('Durée en minutes (Laisser vide pour définitif)').setRequired(false))
        .setDefaultMemberPermissions(PermissionFlagsBits.BanMembers),

    async execute(interaction, client) {
        const target = interaction.options.getUser('cible');
        const reason = interaction.options.getString('raison') ?? 'Aucune raison fournie';
        const duration = interaction.options.getInteger('duree');

        const member = await interaction.guild.members.fetch(target.id).catch(() => null);
        if (member && !member.bannable) {
            return interaction.reply({ 
                content: '❌ Impossible de bannir ce membre. Mon rôle est inférieur au sien ou je manque de permissions.', 
                ephemeral: true 
            });
        }

        await interaction.guild.members.ban(target.id, { reason: reason });

        const embed = new EmbedBuilder()
            .setColor('Red')
            .setTitle('🔨 Membre Banni')
            .setDescription(`<@${target.id}> (${target.tag}) a été banni.\n**Raison:** ${reason}`);

        if (duration) {
            const expiresAt = new Date(Date.now() + duration * 60000);
            await client.prisma.activeSanction.create({
                data: {
                    userId: target.id,
                    guildId: interaction.guild.id,
                    type: 'BAN',
                    expiresAt: expiresAt
                }
            });
            embed.addFields({ name: 'Durée', value: `${duration} minute(s)` });
        } else {
            embed.addFields({ name: 'Durée', value: 'Définitif' });
        }

        await interaction.reply({ embeds: [embed] });
    },
};