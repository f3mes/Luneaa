require('dotenv').config();
const { Client, GatewayIntentBits, Collection } = require('discord.js');
const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');
const http = require('http');
const { Server } = require('socket.io');

const express = require('express');
const cors = require('cors');
const session = require('express-session');
const passport = require('passport');
const DiscordStrategy = require('passport-discord').Strategy;

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
app.use(cors({
    origin: 'http://localhost:5173', 
    credentials: true 
}));

app.use(session({
    secret: process.env.SESSION_SECRET || 'fallback_secret',
    resave: false,
    saveUninitialized: false,
    cookie: { secure: false } 
}));

app.use(passport.initialize());
app.use(passport.session());

passport.serializeUser((user, done) => done(null, user));
passport.deserializeUser((obj, done) => done(null, obj));

passport.use(new DiscordStrategy({
    clientID: process.env.DISCORD_CLIENT_ID,
    clientSecret: process.env.DISCORD_CLIENT_SECRET,
    callbackURL: `${process.env.DASHBOARD_URL}/auth/discord/callback`,
    scope: ['identify'] 
}, (accessToken, refreshToken, profile, done) => {
    return done(null, profile);
}));

app.get('/', (req, res) => {
    if (req.isAuthenticated()) return res.redirect('/dashboard'); 
    
    res.send(`
        <div style="background-color: #1e1f22; color: white; font-family: sans-serif; text-align: center; height: 100vh; padding-top: 100px; margin: -8px;">
            <h1 style="font-size: 60px; margin-bottom: 10px;">🌑</h1>
            <h1>Dashboard Luneaa</h1>
            <p style="color: #b5bac1; margin-bottom: 30px;">Administration sécurisée du bot.</p>
            <a href="/auth/discord" style="background-color: #5865F2; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; font-weight: bold; font-size: 16px;">🔐 Se connecter avec Discord</a>
        </div>
    `);
});

app.get('/auth/discord', passport.authenticate('discord'));

app.get('/auth/discord/callback', passport.authenticate('discord', { failureRedirect: '/' }), async (req, res) => {
    try {
        const userId = req.user.id;
        const owners = ['1132930851508846622', '1074743247768920176'];
        
        const hasAccess = await prisma.dashboardAccess.findUnique({ where: { userId: userId } });

        if (!hasAccess && !owners.includes(userId)) {
            const pseudo = req.user.username;
            
            req.logout(() => {}); 
            return res.send(`
                <div style="background-color: #1e1f22; color: white; text-align: center; height: 100vh; padding-top: 100px; font-family: sans-serif; margin: -8px;">
                    <h1 style="color: #ed4245;">⛔ Accès Refusé</h1>
                    <p style="color: #b5bac1;">Ton compte <b>${pseudo}</b> n'est pas autorisé par l'Architecte.</p>
                    <a href="/" style="color: #5865F2; text-decoration: none; padding-top: 20px; display: inline-block;">Retour à l'accueil</a>
                </div>
            `);
        }

        res.redirect('/');
    } catch (error) {
        console.error('[Web Error]', error);
        res.send("Une erreur serveur est survenue.");
    }
});

app.get('/api/user', (req, res) => {
    if (!req.isAuthenticated()) return res.status(401).json({ error: "Non connecté" });
    
    res.json({
        id: req.user.id,
        username: req.user.username,
        avatar: `https://cdn.discordapp.com/avatars/${req.user.id}/${req.user.avatar}.png`
    });
});

let statsCache = null;
let lastStatsFetch = 0;

app.get('/api/stats', async (req, res) => {
    if (!req.isAuthenticated()) return res.status(401).json({ error: "Non autorisé" });

    const now = Date.now();
    if (statsCache && (now - lastStatsFetch < 60000)) {
        return res.json(statsCache);
    }

    try {
        const guildsPromise = client.shard.fetchClientValues('guilds.cache.size');
        const membersPromise = client.shard.broadcastEval(c => c.guilds.cache.reduce((acc, guild) => acc + guild.memberCount, 0));
        
        const [guilds, members] = await Promise.all([guildsPromise, membersPromise]);

        const totalGuilds = guilds.reduce((acc, guildCount) => acc + guildCount, 0);
        const totalMembers = members.reduce((acc, memberCount) => acc + memberCount, 0);
        const ping = client.ws.ping; 

        statsCache = {
            servers: totalGuilds,
            users: totalMembers,
            latency: ping
        };
        lastStatsFetch = now;

        res.json(statsCache);
    } catch (error) {
        console.error('[API Stats Error]', error);
        res.status(500).json({ error: "Erreur d'agrégation des Shards" });
    }
});
app.post('/api/settings/:guildId', async (req, res) => {
    if (!req.isAuthenticated()) return res.status(401).json({ error: "Non autorisé" });
    const settings = await prisma.guildSettings.upsert({
        where: { guildId: req.params.guildId },
        update: req.body,
        create: { guildId: req.params.guildId, ...req.body }
    });
    res.json(settings);
});

app.get('/api/analytics', async (req, res) => {
    if (!req.isAuthenticated()) return res.status(401).json({ error: "Non autorisé" });

    const stats = {
        labels: ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'],
        commands: [120, 190, 300, 500, 200, 300, 450],
        logs: [
            { id: 1, action: 'Ban', user: 'Chupa', time: '10:20' },
            { id: 2, action: 'Kick', user: 'BotTest', time: '09:45' }
        ]
    };
    res.json(stats);
});

app.get('/logout', (req, res) => {
    req.logout(() => { res.redirect('/'); });
});

const webPort = process.env.WEB_PORT || 25685;
const server = http.createServer(app); 
const io = new Server(server, {
    cors: {
        origin: "http://localhost:5173",
        methods: ["GET", "POST"],
        credentials: true
    }
});


const originalLog = console.log;
const originalError = console.error;

console.log = function(...args) {
    originalLog.apply(console, args); 
    io.emit('terminal-log', { type: 'log', message: args.join(' ') });
};

console.error = function(...args) {
    originalError.apply(console, args);
    io.emit('terminal-log', { type: 'error', message: args.join(' ') });
};


io.on('connection', (socket) => {
    socket.emit('terminal-log', { type: 'log', message: '🟢 Connexion au tunnel WebSocket établie avec succès.' });


    socket.on('restart-bot', () => {
        console.log("🔴 [SYSTEM] Ordre de redémarrage reçu depuis le Dashboard ! Extinction...");
        setTimeout(() => {
            process.exit(0); 
        }, 1500);
    });
});


server.listen(webPort, '0.0.0.0', () => {
    console.log(`🌐 [Web] Interface et Tunnel WebSocket ouverts sur le port ${webPort}`);
});


client.login(process.env.TOKEN);