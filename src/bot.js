require('dotenv').config();
const { Client, GatewayIntentBits, Collection } = require('discord.js');
const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');

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
app.use(cors());

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
            req.logout(() => {}); 
            return res.send(`
                <div style="background-color: #1e1f22; color: white; text-align: center; height: 100vh; padding-top: 100px; font-family: sans-serif; margin: -8px;">
                    <h1 style="color: #ed4245;">⛔ Accès Refusé</h1>
                    <p style="color: #b5bac1;">Ton compte <b>${req.user.username}</b> n'est pas autorisé par l'Architecte.</p>
                    <a href="/" style="color: #5865F2; text-decoration: none; padding-top: 20px; display: inline-block;">Retour à l'accueil</a>
                </div>
            `);
        }

        res.redirect('/dashboard');
    } catch (error) {
        console.error('[Web Error]', error);
        res.send("Une erreur serveur est survenue.");
    }
});

app.get('/dashboard', (req, res) => {
    if (!req.isAuthenticated()) return res.redirect('/'); 
    
    res.send(`
        <div style="background-color: #2b2d31; color: white; font-family: sans-serif; height: 100vh; padding: 50px; margin: -8px;">
            <h1 style="color: #57F287;">Connecté avec succès ! 🎉</h1>
            <h2>Bienvenue, boss : ${req.user.username}</h2>
            <p>L'authentification OAuth2 fonctionne parfaitement. Ton système Prisma t'a reconnu et a déverrouillé les portes.</p>
            <br>
            <a href="/logout" style="color: #ed4245; text-decoration: none; font-weight: bold;">Se déconnecter</a>
        </div>
    `);
});

app.get('/logout', (req, res) => {
    req.logout(() => { res.redirect('/'); });
});

const webPort = process.env.WEB_PORT || 25685;
app.listen(webPort, '0.0.0.0', () => {
    console.log(`🌐 [Web] Interface d'administration sécurisée en ligne sur le port ${webPort}`);
});

client.login(process.env.TOKEN);