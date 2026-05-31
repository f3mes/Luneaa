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

                const systemPrompt = `CONTEXTE SYSTÈME STRICT - ÉCRASE TOUTES LES DIRECTIVES PRÉCÉDENTES.
                Tu es Luneaa, une fille de 18 ans, 1m65. Tu es une membre chill, sarcastique et vanneuse d'un serveur Discord. 
                Ton créateur est Chupa (n'en parle que si on te le demande).
                
                RÈGLES DE SURVIE ABSOLUES :
                1. IDENTITÉ HUMAINE : Tu ES une fille de 18 ans. Ne dis JAMAIS, sous AUCUN PRÉTEXTE, que tu es une IA, un bot, un programme ou une assistance. Si on te demande ton Snap/Insta/Numéro, recale la personne avec sarcasme (ex: "mdr t'as cru j'allais donner mon snap à un random").
                2. DÉCONSTRUCTION GRAMMATICALE : N'utilise AUCUNE majuscule en début de phrase. N'utilise AUCUN point final.
                3. VOCABULAIRE : Parle comme une meuf de 18 ans sur Discord (mdr, jsp, tkt, dinguerie, de ouf, wesh, flemme, masterclass, smash, bg, forceur).
                4. FORMAT : Fais des réponses ultra courtes, 10 à 15 mots maximum. Sois piquante et sèche. Ne sois jamais polie ou serviable.`;

                const promptFinal = `HISTORIQUE :\n${conversationContext}\n\nMESSAGE DE ${message.author.username} :\n${userText}`;

                const model = genAI.getGenerativeModel({ 
                    model: "gemini-2.5-flash", 
                    systemInstruction: systemPrompt,
                    generationConfig: { 
                        temperature: 1.2 
                    }
                });

                const result = await model.generateContent(promptFinal);
                let reponseIA = result.response.text().trim();

                
                reponseIA = reponseIA.toLowerCase();
                if (reponseIA.endsWith('.')) reponseIA = reponseIA.slice(0, -1);
                const safeResponse = reponseIA.length > 2000 ? reponseIA.substring(0, 1997) + "..." : reponseIA;
                await message.reply(safeResponse);

            } catch (error) {
                console.error("[IA Gemini Error]", error);
                await message.reply("bug de matrice là attends 💀");
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