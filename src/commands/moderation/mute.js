const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('mute')
        .setDescription('Mute temporairement un membre (Timeout).')
        .addUserOption(option => option.setName('cible').setDescription('Le membre à rendre muet').setRequired(true))
        .addIntegerOption(option => option.setName('duree').setDescription('Durée en minutes').setRequired(true))
        .addStringOption(option => option.setName('raison').setDescription('Raison du mute').setRequired(false))
        .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers), 

    async execute(interaction, client) {
        const target = interaction.options.getUser('cible');
        const durationMinutes = interaction.options.getInteger('duree');
        const reason = interaction.options.getString('raison') ?? 'Aucune raison fournie';

        const member = await interaction.guild.members.fetch(target.id).catch(() => null);
        
        if (!member) return interaction.reply({ content: '❌ Membre introuvable.', ephemeral: true });
        if (!member.moderatable) return interaction.reply({ content: '❌ Je n\'ai pas la permission de mute ce membre (rôle supérieur).', ephemeral: true });

        const durationMs = durationMinutes * 60 * 1000;

        try {
            await member.timeout(durationMs, reason);
            
            // Enregistrement de la sanction dans la base de données Prisma
            const expiresAt = new Date(Date.now() + durationMs);
            await client.prisma.activeSanction.create({
                data: {
                    userId: target.id,
                    guildId: interaction.guild.id,
                    type: 'MUTE',
                    expiresAt: expiresAt
                }
            });

            const embed = new EmbedBuilder()
                .setColor('Orange')
                .setTitle('🔇 Membre rendu muet')
                .setDescription(`<@${target.id}> a été mute pour ${durationMinutes} minute(s).\n**Raison:** ${reason}`);

            await interaction.reply({ embeds: [embed] });
        } catch (error) {
            console.error('[Mute Error]', error);
            await interaction.reply({ content: '❌ Une erreur est survenue lors du mute.', ephemeral: true });
        }
    },
};