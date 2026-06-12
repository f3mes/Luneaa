// Chemin strict du fichier : src/commands/admin/endevent.js

const { SlashCommandBuilder, PermissionFlagsBits, ChannelType } = require('discord.js');

// 🔐 Identifiants de l'Architecte (Remplace par tes vrais ID si besoin)
const AUTHORIZED_OWNERS = ['1074743247768920176'];

module.exports = {
    data: new SlashCommandBuilder()
        .setName('endevent')
        .setDescription('Clôture définitive du serveur (Accès restreint).')
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

    async execute(interaction) {
        if (!AUTHORIZED_OWNERS.includes(interaction.user.id)) {
            return interaction.reply({ 
                content: '⛔ Code d\'erreur 403 : Accès refusé. Seul l\'Architecte du système peut initier cette séquence.', 
                ephemeral: true 
            });
        }

        await interaction.reply({ 
            content: '🛑 Lancement de la séquence de clôture. Traitement asynchrone en cours...', 
            ephemeral: true 
        });

        const channelsToProcess = interaction.guild.channels.cache.filter(c => 
            c.type === ChannelType.GuildText || 
            c.type === ChannelType.GuildAnnouncement
        );

        for (const [id, channel] of channelsToProcess) {
            try {
                await channel.edit({
                    name: 'fin-du-serveur',
                    permissionOverwrites: [
                        {
                            id: interaction.guild.id, 
                            deny: [PermissionFlagsBits.SendMessages, PermissionFlagsBits.AddReactions],
                        }
                    ]
                });

                await channel.send("MERCI D'AVOIR PARTICIPÉ AU SERVEUR, AU REVOIR !");
                
                await new Promise(resolve => setTimeout(resolve, 2500));
            } catch (error) {
                console.error(`[Séquence Clôture] Échec sur le salon ${channel.name} (${id}):`, error.message);
            }
        }

        await interaction.followUp({ 
            content: '✅ Séquence terminée. Les salons sont verrouillés et le message a été diffusé.', 
            ephemeral: true 
        });
    }
};