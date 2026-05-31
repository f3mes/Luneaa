const { SlashCommandBuilder, PermissionFlagsBits, AttachmentBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('backupserver')
        .setDescription('Génère une sauvegarde JSON de la structure du serveur.')
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

    async execute(interaction) {
        await interaction.deferReply({ ephemeral: true }); 

        const guild = interaction.guild;
        const data = {
            guild_name: guild.name,
            roles: guild.roles.cache.filter(r => r.name !== '@everyone').map(r => ({
                name: r.name,
                color: r.color,
                permissions: r.permissions.bitfield.toString()
            })),
            categories: guild.channels.cache.filter(c => c.type === 4).map(c => ({ name: c.name })),
            channels: guild.channels.cache.filter(c => c.type === 0 || c.type === 2).map(c => ({
                name: c.name,
                type: c.type === 0 ? 'text' : 'voice',
                category: c.parent ? c.parent.name : null
            }))
        };

        const buffer = Buffer.from(JSON.stringify(data, null, 4), 'utf-8');
        const attachment = new AttachmentBuilder(buffer, { name: `backup_${guild.id}.json` });

        await interaction.editReply({ 
            content: '✅ Sauvegarde de l\'infrastructure générée avec succès.', 
            files: [attachment] 
        });
    },
};