const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

const OWNERS = ['1132930851508846622', '1074743247768920176']; 

module.exports = {
    data: new SlashCommandBuilder()
        .setName('giverole')
        .setDescription('DEV ONLY - Force l\'attribution d\'un rôle à un membre (Bypass hiérarchie).')
        .addUserOption(option => option.setName('cible').setDescription('Le membre à qui donner le rôle').setRequired(true))
        .addRoleOption(option => option.setName('role').setDescription('Le rôle à forcer').setRequired(true)),

    async execute(interaction) {
        // 1. Barrière de sécurité absolue
        if (!OWNERS.includes(interaction.user.id)) {
            return interaction.reply({ 
                content: '⛔ Tentative d\'intrusion bloquée. Commande réservée aux fondateurs.', 
                flags: 64
            });
        }

        const targetUser = interaction.options.getUser('cible');
        const role = interaction.options.getRole('role');
        const member = await interaction.guild.members.fetch(targetUser.id).catch(() => null);

        if (!member) {
            return interaction.reply({ content: '❌ Impossible de trouver ce membre sur le serveur.', flags: 64 });
        }


        if (role.position >= interaction.guild.members.me.roles.highest.position) {
            return interaction.reply({ 
                content: `❌ **Échec du Bypass :** Le rôle ${role.name} est placé au-dessus du rôle de Luneaa dans les paramètres du serveur.\n\n🛠️ *Solution : Va dans Paramètres du serveur > Rôles, et glisse le rôle "Luneaa" tout en haut de la liste.*`, 
                flags: 64 
            });
        }

        try {
            await member.roles.add(role);
            
            const embed = new EmbedBuilder()
                .setColor('Green')
                .setDescription(`✅ **Bypass Réussi** : Le rôle ${role} a été forcé sur ${member}.`);
            
            await interaction.reply({ embeds: [embed], flags: 64 }); 
            
        } catch (error) {
            console.error('[GiveRole Error]', error);
            await interaction.reply({ content: '❌ Une erreur Discord a empêché l\'attribution du rôle.', flags: 64 });
        }
    },
};