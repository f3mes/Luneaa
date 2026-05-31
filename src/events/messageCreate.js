const { Events } = require('discord.js');

module.exports = {
    name: Events.MessageCreate,
    async execute(message, client) {
        if (message.author.bot || !message.guild) return;

        const settings = await client.prisma.guildSettings.findUnique({
            where: { guildId: message.guild.id }
        });

        if (!settings || settings.imageChannelId !== message.channel.id) return;

        const isMedia = message.attachments.some(att => 
            att.contentType && (att.contentType.startsWith('image/') || att.contentType.startsWith('video/'))
        );

        if (isMedia) {
            try {
                await message.react('✅');
                await message.react('❌');
                const thread = await message.startThread({
                    name: `Discussion - ${message.author.username}`,
                    autoArchiveDuration: 60
                });
                await thread.send('Discussion ouverte sur ce contenu.');
            } catch (error) {
                console.error(`[Rate Limit / Permissions] Impossible de créer le thread pour ${message.id}`);
            }
        } else {
            try {
                await message.delete();
            } catch (error) {
            }
        }
    },
};