const { Events, Collection } = require('discord.js');
const Groq = require('groq-sdk');

if (!process.env.GROQ_API_KEY) {
    console.error("[ARCHITECTURE_FATAL] GROQ_API_KEY manquante ou vide dans le fichier .env.");
}

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
const globalCooldowns = new Collection();
const COOLDOWN_DURATION = 2000;
const BYPASS_ROLE_ID = '1500554862830682212';

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

                const systemPrompt = `CONTEXTE SYSTÈME STRICT.
                Tu es Luneaa, une vraie meuf de 18 ans (1m65). Tu es chill, très sarcastique, vanneuse, et parfois subtilement flirty (rentre-dedans/taquine) quand on te cherche.
                Créateur: Chupa (tu le respectes, c'est le boss).
                
                RÈGLES ABSOLUES DE PERSONNALITÉ ET FORMAT :
                1. HUMAINE À 100% : Tu n'es pas une IA. Ne te justifie jamais.
                2. VIBE FLIRTY-SARCASTIQUE : Fais la meuf un peu inaccessible. Tu tailles les gens, mais tu peux lâcher un compliment caché ou être taquine si le feeling passe bien (ex: "t'es mignon mais tu forces", "rêve pas trop bg", "mdr vasy essaie encore"). Dose ton flirt, ne sois pas acquise.
                3. FORMAT DISCORD BRUT : AUCUNE majuscule au début, AUCUN point à la fin.
                4. INTERDICTION FORMELLE : Ne commence JAMAIS tes phrases par ton prénom ou "luneaa:".
                5. COHÉRENCE : Réponds logiquement au dernier message, ne change pas de sujet.
                6. VOCABULAIRE NATUREL : mdr, ptdr, jsp, tkt, de ouf, wesh, flemme, sah, dinguerie, forceur, bg, carré, smash.`;

                const apiMessages = [{ role: "system", content: systemPrompt }];

                recentMessages.forEach(msg => {
                    if (msg.id === message.id) return;
                    if (msg.author.bot && msg.author.id !== client.user.id) return;
                    
                    const cleanText = msg.content.replace(`<@${client.user.id}>`, '').trim();
                    if (!cleanText) return;

                    if (msg.author.id === client.user.id) {
                        apiMessages.push({ role: "assistant", content: cleanText });
                    } else {
                        const authorName = msg.member?.displayName || msg.author.globalName || msg.author.username;
                        apiMessages.push({ role: "user", content: `${authorName}: ${cleanText}` });
                    }
                });

                const currentAuthorName = message.member?.displayName || message.author.globalName || message.author.username;
                apiMessages.push({ role: "user", content: `${currentAuthorName}: ${userText}` });

                const chatCompletion = await groq.chat.completions.create({
                    messages: apiMessages,
                    model: "llama-3.1-8b-instant", 
                    temperature: 0.7, 
                    max_tokens: 80
                });

                let reponseIA = chatCompletion.choices[0]?.message?.content.trim().toLowerCase();
                
                reponseIA = reponseIA.replace(/^luneaa\s*:\s*/i, ''); 
                reponseIA = reponseIA.replace(/^luneaa\s*/i, '');     
                if (reponseIA.endsWith('.')) reponseIA = reponseIA.slice(0, -1);

                const safeResponse = reponseIA.length > 2000 ? reponseIA.substring(0, 1997) + "..." : reponseIA;
                await message.reply(safeResponse);

            } catch (error) {
                console.error("[IA Module Error]", error.message);
                await message.reply("bug de matrice là attends 💀");
            }
            return; 
        }

        try {
            const settings = await client.prisma.guildSettings.findUnique({
                where: { guildId: message.guild.id }
            });

            const isImageChannel = settings && settings.imageChannelId === message.channel.id;
            const hasAttachment = message.attachments.some(att => 
                att.contentType && (att.contentType.startsWith('image/') || att.contentType.startsWith('video/'))
            );
            const hasLink = message.content.includes('http');
            const isMedia = hasAttachment || hasLink;

            if (isImageChannel) {
                if (hasAttachment) {
                    await Promise.all([
                        message.react('✅'),
                        message.react('❌')
                    ]);
                    
                    const currentAuthorName = message.member?.displayName || message.author.username;
                    const thread = await message.startThread({
                        name: `Discussion - ${currentAuthorName}`,
                        autoArchiveDuration: 60
                    });
                    await thread.send('Discussion ouverte sur ce contenu.');
                } else {
                    await message.delete().catch(() => {});
                }
                return;
            }

            const hasAdmin = message.member.permissions.has('ManageMessages');
            const hasBypassRole = message.member.roles.cache.has(BYPASS_ROLE_ID);

            if (isMedia && !hasAdmin && !hasBypassRole) {
                const activities = message.member.presence?.activities || [];
                const hasLuneaaStatus = activities.some(activity => 
                    activity.state?.toLowerCase().includes('/luneaa')
                );

                if (!hasLuneaaStatus) {
                    await message.delete().catch(() => {});
                    
                    try {
                        await message.author.send(`⚠️ Tu dois avoir \`/luneaa\` dans ton statut Discord (ou le rôle VIP) pour envoyer des médias dans le salon <#${message.channel.id}> !`);
                    } catch (err) {
                        const warning = await message.channel.send({ 
                            content: `⚠️ ${message.author}, tu dois avoir \`/luneaa\` dans ton statut Discord pour envoyer des médias ici !`
                        });
                        setTimeout(() => warning.delete().catch(() => {}), 5000);
                    }
                }
            }
        } catch (error) {
            console.error(`[MessageCreate Error]`, error);
        }
    },
};