
const { Events, Collection } = require('discord.js');
const Groq = require('groq-sdk');


if (!process.env.GROQ_API_KEY) {
    console.error("[ARCHITECTURE_FATAL] GROQ_API_KEY est manquante ou vide dans le fichier .env.");

}

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

const globalCooldowns = new Collection();
const COOLDOWN_DURATION = 2000;

module.exports = {
    name: Events.MessageCreate,
    async execute(message, client) {
        if (message.author.bot || !message.guild) return;

        const isMentioned = message.mentions.has(client.user.id);
        const isReplied = message.type === 19 && message.mentions.repliedUser?.id === client.user.id;


        if (isMentioned || isReplied) {

            const now = Date.now();
            if (globalCooldowns.has('ia_global') && (now - globalCooldowns.get('ia_global')) < COOLDOWN_DURATION) {
                return; 
            }
            globalCooldowns.set('ia_global', now);

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
                1. IDENTITÉ HUMAINE : Tu es une vraie meuf de 18 ans. Ne dis JAMAIS que tu es une IA/bot.
                2. PAS DE MAJUSCULES EN DÉBUT NI DE POINT À LA FIN.
                3. VOCAB DISCORD : mdr, jsp, tkt, dinguerie, wesh, flemme, masterclass, smash, bg, dark sasuke, etc...
                4. FORMAT : Court et efficace. Piquante, familière et sèche.`;

                const chatCompletion = await groq.chat.completions.create({
                    messages: [
                        { role: "system", content: systemPrompt },
                        { role: "user", content: `HISTORIQUE :\n${conversationContext}\n\nMESSAGE DE ${message.author.username} :\n${userText}` }
                    ],
                    model: "llama-3.1-8b-instant",
                    temperature: 1.1,
                    max_tokens: 100
                });

                let reponseIA = chatCompletion.choices[0]?.message?.content.trim().toLowerCase();
                if (reponseIA.endsWith('.')) reponseIA = reponseIA.slice(0, -1);

                const safeResponse = reponseIA.length > 2000 ? reponseIA.substring(0, 1997) + "..." : reponseIA;
                await message.reply(safeResponse);

            } catch (error) {
                console.error("[IA Module Error]", error.message);
                await message.reply("Euhh tout doux loulou j'arrive pas à suivre la... 💀");
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
                await Promise.all([
                    message.react('✅'),
                    message.react('❌')
                ]);
                
                const thread = await message.startThread({
                    name: `Discussion - ${message.author.username}`,
                    autoArchiveDuration: 60
                });
                await thread.send('Discussion ouverte sur ce contenu.');
            } else {
                await message.delete().catch(() => {});
            }
        } catch (error) {
            console.error(`[Module Image Error]`, error);
        }
    },
};