const { Events, EmbedBuilder } = require('discord.js');

module.exports = {
    name: Events.InteractionCreate,
    async execute(interaction, client) {
        if (!interaction.isChatInputCommand()) return;

        const command = client.commands.get(interaction.commandName);

        if (!command) {
            console.error(`[Alerte Routeur] Commande inconnue : ${interaction.commandName}`);
            return;
        }


        const optionsProvided = interaction.options.data.map(opt => `${opt.name}:${opt.value}`).join(', ') || 'Aucune option';
        console.log(`[CMD] /${interaction.commandName} | Par: ${interaction.user.tag} | Serveur: ${interaction.guild?.name || 'DM'} | Args: [${optionsProvided}]`);
        
        if (interaction.guild) {
            client.prisma.guildSettings.findUnique({
                where: { guildId: interaction.guild.id }
            }).then(async (settings) => {
                if (settings && settings.logChannelId) {
                    const logChannel = interaction.guild.channels.cache.get(settings.logChannelId);
                    if (logChannel) {
                        const logEmbed = new EmbedBuilder()
                            .setColor('DarkButNotBlack')
                            .setTitle(`🔧 Exécution de commande : /${interaction.commandName}`)
                            .addFields(
                                { name: 'Utilisateur', value: `${interaction.user} (\`${interaction.user.id}\`)`, inline: true },
                                { name: 'Salon d\'exécution', value: `${interaction.channel}`, inline: true },
                                { name: 'Paramètres fournis', value: `\`${optionsProvided}\`` }
                            )
                            .setTimestamp()
                            .setFooter({ text: 'Système d\'Audit Interne' });

                        await logChannel.send({ embeds: [logEmbed] }).catch(() => {}); 
                    }
                }
            }).catch(err => console.error('[Erreur DB Logs]', err));
        }

        try {
            await command.execute(interaction, client);
        } catch (error) {
            console.error(`[Erreur Critique] Échec de /${interaction.commandName} :`, error);
            
            const errorEmbed = new EmbedBuilder()
                .setColor('Red')
                .setDescription('❌ Une erreur interne est survenue lors de l\'exécution.');
            
            if (interaction.replied || interaction.deferred) {
                await interaction.followUp({ embeds: [errorEmbed], ephemeral: true });
            } else {
                await interaction.reply({ embeds: [errorEmbed], ephemeral: true });
            }
        }
    },
};