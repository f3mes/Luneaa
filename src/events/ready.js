const { Events } = require('discord.js');

module.exports = {
    name: Events.ClientReady,
    once: true,
    async execute(client) {
        console.log(`✅ [Réseau] Bot connecté en tant que ${client.user.tag}`);
        
        const commandsArray = Array.from(client.commands.values()).map(c => c.data.toJSON());
        try {
            await client.application.commands.set(commandsArray);
            console.log(`✅ [API] ${commandsArray.length} Slash Commands synchronisées avec Discord.`);
        } catch (error) {
            console.error(`❌ [API] Erreur de synchronisation des commandes :`, error);
        }

        setInterval(async () => {
            const now = new Date();
            
            const expiredSanctions = await client.prisma.activeSanction.findMany({
                where: { expiresAt: { lte: now } }
            });

            for (const sanction of expiredSanctions) {
                try {
                    const guild = client.guilds.cache.get(sanction.guildId);
                    if (!guild) continue;

                    if (sanction.type === 'BAN') {
                        await guild.members.unban(sanction.userId, 'Temps de ban expiré automatiquement.');
                    } else if (sanction.type === 'MUTE') {
                        const member = await guild.members.fetch(sanction.userId).catch(() => null);
                        if (member) await member.timeout(null, 'Temps de mute expiré automatiquement.');
                    }

                    await client.prisma.activeSanction.delete({ where: { id: sanction.id } });
                    console.log(`[Sanctions] ${sanction.type} levé pour l'utilisateur ${sanction.userId}`);
                } catch (error) {
                    console.error(`[Erreur Sanction] ID ${sanction.id}:`, error);
                }
            }
        }, 60000);
    },
};