require('dotenv').config();
const { Client, GatewayIntentBits, Collection } = require('discord.js');
const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');
const express = require('express');
const cors = require('cors');

const prisma = new PrismaClient();

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildMembers
    ]
});

client.commands = new Collection();
client.prisma = prisma; 


const commandsPath = path.join(__dirname, 'commands');
if (fs.existsSync(commandsPath)) {
    const commandFolders = fs.readdirSync(commandsPath);
    for (const folder of commandFolders) {
        const folderPath = path.join(commandsPath, folder);
        if (!fs.lstatSync(folderPath).isDirectory()) continue;
        const commandFiles = fs.readdirSync(folderPath).filter(file => file.endsWith('.js'));
        for (const file of commandFiles) {
            const command = require(path.join(folderPath, file));
            if ('data' in command && 'execute' in command) {
                client.commands.set(command.data.name, command);
            }
        }
    }
}

const eventsPath = path.join(__dirname, 'events');
if (fs.existsSync(eventsPath)) {
    const eventFiles = fs.readdirSync(eventsPath).filter(file => file.endsWith('.js'));
    for (const file of eventFiles) {
        const filePath = path.join(eventsPath, file);
        const event = require(filePath);
        if (event.once) {
            client.once(event.name, (...args) => event.execute(...args, client));
        } else {
            client.on(event.name, (...args) => event.execute(...args, client));
        }
    }
}

const app = express();
app.use(cors());

app.get('/', (req, res) => {
    res.send(`
        <div style="background-color: #2b2d31; color: white; font-family: sans-serif; padding: 50px; text-align: center; height: 100vh; margin: -8px;">
            <h1 style="color: #5865F2;">Dashboard Luneaa 🚀</h1>
            <p>Le serveur Web fonctionne parfaitement en parallèle de l'IA.</p>
            <p style="color: gray;">Prochaine étape : Déployer le site Vue.js ici !</p>
        </div>
    `);
});


const webPort = process.env.WEB_PORT || 25685;
app.listen(webPort, '0.0.0.0', () => {
    console.log(`🌐 [Web] Interface d'administration en ligne sur le port ${webPort}`);
});

client.login(process.env.TOKEN);