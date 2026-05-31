const { Events } = require('discord.js');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

module.exports = {
    name: Events.MessageCreate,
    async execute(message, client) {
        if (message.author.bot || !message.guild) return;

        const isMentioned = message.mentions.has(client.user.id);
        const isReplied = message.type === 19 && message.mentions.repliedUser?.id === client.user.id;

        if (isMentioned || isReplied) {
            await message.channel.sendTyping();

            try {
                const userText = message.content.replace(`<@${client.user.id}>`, '').trim();

                if (userText.length === 0) {
                    return message.reply("Quoi ? Tu ping pour rien frère ?");
                }

                const systemPrompt = `Tu es Luneaa, un bot Discord taquin, sarcastique et vanneur, mais sympa au fond. 
                Ton créateur est Chupa (mais tu ne le dis que si on te pose explicitement la question, sinon tu n'en parles jamais).
                Tu parles comme un jeune de 14-23 ans habitué aux serveurs Discord français. 
                Tu peux utiliser des expressions de jeunes naturelles (ex: dinguerie, masterclass, smash, six seven, frère, carré, fou furieux, etc.) mais reste naturel, ne force pas trop pour ne pas être cringe. 
                RÈGLE ABSOLUE : Tes réponses doivent être TRÈS COURTES (1 à 2 phrases maximum) et percutantes.`;

                const model = genAI.getGenerativeModel({ 
                    model: "gemini-2.5-flash", 
                    systemInstruction: systemPrompt 
                });

                const result = await model.generateContent(userText);
                const reponseIA = result.response.text();

                const safeResponse = reponseIA.length > 2000 ? reponseIA.substring(0, 1997) + "..." : reponseIA;

                await message.reply(safeResponse);

            } catch (error) {
                console.error("[IA Gemini Error]", error);
                await message.reply("J'ai le crâne qui chauffe là, API en PLS... 💀");
            }

            return; 
        }

        try {
            const settings = await client.prisma.guildSettings.findUnique({
                where: { guildId: message.guild.id }
            });

            if (!settings || settings.imageChannelId !== message.channel.id) return;

            const isMedia = message.attachments.some(att => 
                att.contentType && (att.contentType.startsWith('image/') || att.contentType.startsWith('video/'))
            );

            if (isMedia) {
                await message.react('✅');
                await message.react('❌');
                
                const thread = await message.startThread({
                    name: `Discussion - ${message.author.username}`,
                    autoArchiveDuration: 60
                });
                await thread.send('Discussion ouverte sur ce contenu.');
            } else {
                try {
                    await message.delete();
                } catch (error) {
                }
            }
        } catch (error) {
            console.error(`[MessageCreate] Erreur DB ou Permissions :`, error);
        }
    },
};