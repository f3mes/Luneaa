const { Events, Collection } = require('discord.js');
const { GoogleGenerativeAI } = require('@google/generative-ai');

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

const aiCooldowns = new Collection();
const GLOBAL_COOLDOWN_MS = 3000; 

module.exports = {
    name: Events.MessageCreate,
    async execute(message, client) {
        if (message.author.bot || !message.guild) return;

        const isMentioned = message.mentions.has(client.user.id);
        const isReplied = message.type === 19 && message.mentions.repliedUser?.id === client.user.id;

        if (isMentioned || isReplied) {
            const now = Date.now();
            if (aiCooldowns.has('global_api')) {
                const expirationTime = aiCooldowns.get('global_api') + GLOBAL_COOLDOWN_MS;
                if (now < expirationTime) {
                    return; 
                }
            }
            aiCooldowns.set('global_api', now);

            await message.channel.sendTyping();

            try {
                const userText = message.content.replace(`<@${client.user.id}>`, '').trim();

                let recentMessages = message.channel.messages.cache.last(8);
                if (!recentMessages || recentMessages.length < 2) {
                     const fetched = await message.channel.messages.fetch({ limit: 8 });
                     recentMessages = Array.from(fetched.values()).reverse();
                }

                const conversationContext = recentMessages.map(msg => {
                    if (msg.id === message.id) return null;
                    if (msg.author.bot && msg.author.id !== client.user.id) return null;
                    const authorName = msg.author.id === client.user.id ? 'Luneaa' : msg.author.username;
                    const cleanText = msg.content.replace(`<@${client.user.id}>`, '').trim();
                    return cleanText ? `${authorName}: ${cleanText}` : null;
                }).filter(Boolean).join('\n');

                const systemPrompt = `CONTEXTE SYSTÈME STRICT.
                Tu es Luneaa, fille de 18 ans, 1m65, membre chill, sarcastique et vanneuse. 
                Créateur: Chupa.
                RÈGLES:
                1. IDENTITÉ HUMAINE : Fille de 18 ans. Jamais dire que tu es une IA/bot.
                2. PAS DE MAJUSCULES EN DÉBUT NI DE POINT À LA FIN.
                3. VOCAB DISCORD : mdr, jsp, tkt, dinguerie, wesh, flemme, masterclass, smash, bg, dark sasuke, doxeur, six seven etc...
                4. FORMAT : Court . Piquante et sèche.`;

                const promptFinal = `HISTORIQUE :\n${conversationContext}\n\nMESSAGE DE ${message.author.username} :\n${userText}`;

                const model = genAI.getGenerativeModel({ 
                    model: "gemini-2.5-flash", 
                    systemInstruction: systemPrompt,
                    generationConfig: { temperature: 1.2 }
                });

                const result = await model.generateContent(promptFinal);
                let reponseIA = result.response.text().trim().toLowerCase();
                if (reponseIA.endsWith('.')) reponseIA = reponseIA.slice(0, -1);

                const safeResponse = reponseIA.length > 2000 ? reponseIA.substring(0, 1997) + "..." : reponseIA;
                await message.reply(safeResponse);


            } catch (error) {
                console.error("[IA Gemini Error]", error.message);
   
                if (error.status === 429) {
                    await message.reply("wesh vous me spammez trop là j'ai le crâne qui sature 💀 attendez 1 min");
                } else {
                    await message.reply("bug de matrice là attends 💀");
                }
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
                await message.delete().catch(() => {});
            }
        } catch (error) {
            console.error(`[MessageCreate] Erreur DB :`, error);
        }
    },
};