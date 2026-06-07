const { Events, EmbedBuilder } = require('discord.js');

module.exports = {
    name: Events.GuildMemberAdd,
    async execute(member, client) {
        if (member.user.bot) return;

        try {
            const settings = await client.prisma.guildSettings.findUnique({
                where: { guildId: member.guild.id },
                select: { welcomeChannelId: true } 
            });

            if (!settings || !settings.welcomeChannelId) return;

            const welcomeChannel = member.guild.channels.cache.get(settings.welcomeChannelId);
            if (!welcomeChannel) return;

            const welcomeEmbed = new EmbedBuilder()
                .setColor('#95b7e8')
                .setThumbnail(member.user.displayAvatarURL({ dynamic: true, size: 256 }))
                .setDescription([
                    "✧˚ · . 𝐔𝐧𝐞 𝐧𝐨𝐮𝐯𝐞𝐥𝐥𝐞 𝐚𝐩𝐩𝐚𝐫𝐢𝐭𝐢𝐨𝐧 ! . · ˚✧",
                    "",
                    `𝐒𝐨𝐮𝐡𝐚𝐢𝐭𝐞𝐳 𝐮𝐧𝐞 𝐢𝐦𝐦𝐞𝐧𝐬𝐞 𝐛𝐢𝐞𝐧𝐯𝐞𝐧𝐮𝐞 𝐚 <@${member.id}> ! (¯ ³¯)♡`,
                    "",
                    "𝐈𝐧𝐬𝐭𝐚𝐥𝐥𝐞-𝐭𝐨𝐢 𝐜𝐨𝐧𝐟𝐨𝐫𝐭𝐚𝐛𝐥𝐞𝐦𝐞𝐧𝐭 𝐞𝐭 𝐩𝐫𝐨𝐟𝐢𝐭𝐞 𝐝𝐞 𝐥'𝐚𝐦𝐛𝐢𝐚𝐧𝐜𝐞 ⋆｡˚",
                    "𝐅𝐚𝐢𝐭𝐞𝐬 𝐝𝐮 𝐛𝐫𝐮𝐢𝐭 𝐩𝐨𝐮𝐫 𝐥'𝐚𝐜𝐜𝐮𝐞𝐢𝐥𝐥𝐢𝐫 𝐜𝐨𝐦𝐦𝐞 𝐢𝐥 𝐬𝐞 𝐝𝐨𝐢𝐭 !! 🎉"
                ].join('\n'));

            await welcomeChannel.send({ 
                content: `Ho ! <@${member.id}> vient d'atterrir parmi nous !`, 
                embeds: [welcomeEmbed] 
            });

        } catch (error) {
            console.error(`[GuildMemberAdd Error] Serveur: ${member.guild.id} | Erreur:`, error.message);
        }
    },
};