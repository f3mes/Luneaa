const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('unmute')
        .setDescription('Lève le mute (Timeout) d\'un membre.')
        .addUserOption(option => option.setName('cible').setDescription('Le membre à unmute').setRequired(true))
        .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers),

    async execute(interaction, client) {
        const target = interaction.options.getUser('cible');
        const member = await interaction.guild.members.fetch(target.id).catch(() => null);

        if (!member) return interaction.reply({ content: '❌ Membre introuvable.', ephemeral: true });
        if (!member.isCommunicationDisabled()) return interaction.reply({ content: '⚠️ Ce membre n\'est pas muté.', ephemeral: true });

        try {
            await member.timeout(null, `Unmute manuel par ${interaction.user.tag}`);
            
            const embed = new EmbedBuilder()
                .setColor('Green')
                .setTitle('🔊 Membre unmute')
                .setDescription(`<@${target.id}> peut à nouveau parler.`);

            await interaction.reply({ embeds: [embed] });
        } catch (error) {
            console.error(error);
            await interaction.reply({ content: '❌ Une erreur est survenue.', ephemeral: true });
        }
    },
};