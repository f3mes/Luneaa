const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('warns')
        .setDescription('Affiche la liste des avertissements d\'un membre.')
        .addUserOption(option => option.setName('cible').setDescription('Le membre à inspecter').setRequired(true))
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages),

    async execute(interaction, client) {
        const target = interaction.options.getUser('cible');

        try {
            const userWarns = await client.prisma.warn.findMany({
                where: {
                    userId: target.id,
                    guildId: interaction.guild.id
                }
            });
    
            if (userWarns.length === 0) {
                return interaction.reply({ content: `✅ <@${target.id}> n'a aucun avertissement.`, ephemeral: true });
            }
    
            const embed = new EmbedBuilder()
                .setColor('Blue')
                .setTitle(`Avertissements de ${target.tag}`)
                .setDescription(userWarns.map((w, index) => `**${index + 1}.** ${w.reason} *(ID: ${w.id})*`).join('\n'));
    
            await interaction.reply({ embeds: [embed] });
        } catch (error) {
            console.error('[Warns Error]', error);
            await interaction.reply({ content: '❌ Une erreur est survenue lors de la récupération des avertissements.', ephemeral: true });
        }
    },
};