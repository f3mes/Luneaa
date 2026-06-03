const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

const OWNERS = ['1132930851508846622', '1074743247768920176']; 

module.exports = {
    data: new SlashCommandBuilder()
        .setName('dashboard')
        .setDescription('DEV ONLY - Gère les accès au Dashboard Web.')
        .addSubcommand(sub => sub.setName('add')
            .setDescription('Donne l\'accès au dashboard à un utilisateur.')
            .addUserOption(opt => opt.setName('cible').setDescription('L\'utilisateur à autoriser').setRequired(true)))
        .addSubcommand(sub => sub.setName('remove')
            .setDescription('Retire l\'accès au dashboard à un utilisateur.')
            .addUserOption(opt => opt.setName('cible').setDescription('L\'utilisateur à révoquer').setRequired(true)))
        .addSubcommand(sub => sub.setName('list')
            .setDescription('Affiche la liste des personnes ayant accès au dashboard.')),

    async execute(interaction, client) {
        if (!OWNERS.includes(interaction.user.id)) {
            return interaction.reply({ content: '⛔ Accès refusé.', flags: 64 });
        }

        const subcommand = interaction.options.getSubcommand();

        if (subcommand === 'add') {
            const target = interaction.options.getUser('cible');

            try {
                const existing = await client.prisma.dashboardAccess.findUnique({ where: { userId: target.id } });
                if (existing) return interaction.reply({ content: `⚠️ ${target} a déjà accès au Dashboard.`, flags: 64 });
    
                await client.prisma.dashboardAccess.create({
                    data: {
                        userId: target.id,
                        addedBy: interaction.user.id
                    }
                });
    
                await interaction.reply({ content: `✅ **Accès accordé** : ${target} peut désormais se connecter au Dashboard Web.`, flags: 64 });
            } catch (error) {
                console.error('[Dashboard Add Error]', error);
                await interaction.reply({ content: `❌ Erreur lors de l'attribution de l'accès.`, flags: 64 });
            }
        }

        if (subcommand === 'remove') {
            const target = interaction.options.getUser('cible');

            if (OWNERS.includes(target.id)) {
                return interaction.reply({ content: `❌ Tu ne peux pas retirer l'accès d'un fondateur.`, flags: 64 });
            }

            try {
                await client.prisma.dashboardAccess.delete({ where: { userId: target.id } });
                await interaction.reply({ content: `🗑️ **Accès révoqué** : ${target} a été expulsé du Dashboard Web.`, flags: 64 });
            } catch (error) {
                await interaction.reply({ content: `⚠️ ${target} n'avait pas accès au Dashboard.`, flags: 64 });
            }
        }


        if (subcommand === 'list') {
            try {
                const allowedUsers = await client.prisma.dashboardAccess.findMany();
    
                if (allowedUsers.length === 0) {
                    return interaction.reply({ content: '📋 Aucun accès n\'a été distribué pour le moment.', flags: 64 });
                }
    
                const userList = allowedUsers.map((access, index) => {
                    return `**${index + 1}.** <@${access.userId}> *(Ajouté par <@${access.addedBy}>)*`;
                }).join('\n');
    
                const embed = new EmbedBuilder()
                    .setColor('Blue')
                    .setTitle('🔐 Liste des accès au Dashboard Web')
                    .setDescription(userList);
    
                await interaction.reply({ embeds: [embed], flags: 64 });
            } catch (error) {
                console.error('[Dashboard List Error]', error);
                await interaction.reply({ content: `❌ Erreur lors de la récupération des accès.`, flags: 64 });
            }
        }
    },
};