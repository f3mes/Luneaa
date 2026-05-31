import asyncio
import os
import json
import time
import discord
from discord.ext import commands
from dotenv import load_dotenv

load_dotenv()
TOKEN = os.getenv("TOKEN")
OWNER_ID = 1132930851508846622

PREFIX_FILE = "prefix.json"
OWNERS_FILE = "owners.json"
IMAGE_CHANNEL_FILE = "image_channel.json"
WARNS_FILE = "warns.json"

# ---------------- PREFIX ----------------

if not os.path.exists(PREFIX_FILE):
    with open(PREFIX_FILE, "w") as f:
        json.dump({"prefix": "!"}, f)

def load_prefix():
    with open(PREFIX_FILE, "r") as f:
        return json.load(f)["prefix"]

def save_prefix(prefix):
    with open(PREFIX_FILE, "w") as f:
        json.dump({"prefix": prefix}, f, indent=4)

current_prefix = load_prefix()

# ---------------- OWNERS ----------------

if not os.path.exists(OWNERS_FILE):
    with open(OWNERS_FILE, "w") as f:
        json.dump([OWNER_ID], f)

def load_owners():
    with open(OWNERS_FILE, "r") as f:
        return set(json.load(f))

owner_ids = load_owners()

def save_owners():
    with open(OWNERS_FILE, "w") as f:
        json.dump(list(owner_ids), f, indent=4)

if OWNER_ID not in owner_ids:
    owner_ids.add(OWNER_ID)
    save_owners()

def is_owner(user_id):
    return user_id in owner_ids

# ---------------- IMAGE CHANNEL ----------------

if not os.path.exists(IMAGE_CHANNEL_FILE):
    with open(IMAGE_CHANNEL_FILE, "w") as f:
        json.dump({"channel_id": 0}, f)

def load_image_channel():
    with open(IMAGE_CHANNEL_FILE, "r") as f:
        return json.load(f)["channel_id"]

def save_image_channel(channel_id):
    with open(IMAGE_CHANNEL_FILE, "w") as f:
        json.dump({"channel_id": channel_id}, f, indent=4)

IMAGE_CHANNEL_ID = load_image_channel()

# ---------------- WARNS ----------------

if not os.path.exists(WARNS_FILE):
    with open(WARNS_FILE, "w") as f:
        json.dump({}, f)

def load_warns():
    with open(WARNS_FILE, "r") as f:
        return json.load(f)

def save_warns(data):
    with open(WARNS_FILE, "w") as f:
        json.dump(data, f, indent=4)

warns_data = load_warns()

# ---------------- BOT ----------------

intents = discord.Intents.default()
intents.message_content = True
intents.members = True

def get_prefix(bot, message):
    return current_prefix

bot = commands.Bot(
    command_prefix=get_prefix,
    intents=intents,
    help_command=None
)

# ---------------- READY ----------------

@bot.event
async def on_ready():
    print(f"Connecté en tant que {bot.user}")

# ---------------- IMAGE SYSTEM ----------------

@bot.event
async def on_message(message):

    if message.author.bot:
        return

    if IMAGE_CHANNEL_ID != 0 and message.channel.id == IMAGE_CHANNEL_ID:

        is_media = False

        for attachment in message.attachments:
            if attachment.content_type:
                if (
                    "image" in attachment.content_type
                    or "gif" in attachment.content_type
                    or "video" in attachment.content_type
                ):
                    is_media = True
                    break

        if is_media:

            await message.add_reaction("✅")
            await message.add_reaction("❌")

            try:
                thread = await message.create_thread(
                    name=f"Discussion de {message.author.name}",
                    auto_archive_duration=60
                )

                await thread.send(
                    "Discussion ouverte sur ce contenu."
                )

            except:
                pass

        else:
            try:
                await message.delete()
            except:
                pass

        return

    await bot.process_commands(message)

# ---------------- PREFIX ----------------

@bot.command()
async def prefix(ctx, new_prefix: str):

    global current_prefix

    if not is_owner(ctx.author.id):
        return await ctx.send("Pas autorisé.")

    current_prefix = new_prefix
    save_prefix(new_prefix)

    await ctx.send(
        f"Préfixe changé en `{new_prefix}`"
    )

# ---------------- SAY ----------------

@bot.command()
async def say(ctx, *, text):

    try:
        await ctx.message.delete()
    except:
        pass

    await ctx.send(text)

# ---------------- PING ----------------

@bot.command()
async def ping(ctx):

    start = time.time()

    msg = await ctx.send("Calcul du ping...")

    ms = round((time.time() - start) * 1000)

    await msg.edit(
        content=f"Ping : {ms} ms"
    )

# ---------------- SETNAME ----------------

@bot.command()
async def setname(ctx, *, name):

    if not is_owner(ctx.author.id):
        return await ctx.send("Pas autorisé.")

    try:
        await bot.user.edit(username=name)
        await ctx.send("Nom modifié.")
    except Exception as e:
        await ctx.send(str(e))

# ---------------- SETAVATAR ----------------

@bot.command()
async def setavatar(ctx):

    if not is_owner(ctx.author.id):
        return await ctx.send("Pas autorisé.")

    if not ctx.message.attachments:
        return await ctx.send("Ajoute une image.")

    try:
        avatar = await ctx.message.attachments[0].read()
        await bot.user.edit(avatar=avatar)
        await ctx.send("Avatar modifié.")
    except Exception as e:
        await ctx.send(str(e))

# ---------------- OWNERS ----------------

@bot.command()
async def owners(ctx):

    if ctx.author.id != OWNER_ID:
        return await ctx.send("Pas autorisé.")

    await ctx.send(
        "Owners :\n" + "\n".join(str(i) for i in owner_ids)
    )

@bot.command()
async def addowner(ctx, user_id: int):

    if ctx.author.id != OWNER_ID:
        return

    owner_ids.add(user_id)
    save_owners()

    await ctx.send(f"Owner ajouté : {user_id}")

@bot.command()
async def removeowner(ctx, user_id: int):

    if ctx.author.id != OWNER_ID:
        return

    if user_id == OWNER_ID:
        return await ctx.send("Impossible.")

    owner_ids.discard(user_id)
    save_owners()

    await ctx.send(f"Owner retiré : {user_id}")

# ---------------- IMAGE CHANNEL ----------------

@bot.command()
async def setimagechannel(ctx):

    global IMAGE_CHANNEL_ID

    if not is_owner(ctx.author.id):
        return await ctx.send("Pas autorisé.")

    IMAGE_CHANNEL_ID = ctx.channel.id

    save_image_channel(ctx.channel.id)

    await ctx.send(
        f"Salon image : {ctx.channel.mention}"
    )

# ---------------- LOCK ----------------

@bot.command()
async def lock(ctx):

    if not is_owner(ctx.author.id):
        return

    overwrite = ctx.channel.overwrites_for(
        ctx.guild.default_role
    )

    overwrite.send_messages = False

    await ctx.channel.set_permissions(
        ctx.guild.default_role,
        overwrite=overwrite
    )

    await ctx.send("Salon verrouillé.")

# ---------------- UNLOCK ----------------

@bot.command()
async def unlock(ctx):

    if not is_owner(ctx.author.id):
        return

    overwrite = ctx.channel.overwrites_for(
        ctx.guild.default_role
    )

    overwrite.send_messages = True

    await ctx.channel.set_permissions(
        ctx.guild.default_role,
        overwrite=overwrite
    )

    await ctx.send("Salon déverrouillé.")

# ---------------- BAN ----------------

@bot.command()
async def tempban(ctx, member: discord.Member, duration: int, *, reason="Aucune raison"):

    if not is_owner(ctx.author.id):
        return

    user_id = member.id

    await member.ban(reason=reason)

    await ctx.send(
        f"{member} banni pendant {duration} minute(s).\nRaison : {reason}"
    )

    await asyncio.sleep(duration * 60)

    try:
        user = await bot.fetch_user(user_id)

        await ctx.guild.unban(user)

        await ctx.send(
            f"{user} a été automatiquement débanni."
        )

    except:
        pass
# ---------------- UNBAN ----------------

@bot.command()
async def unban(ctx, user_id: int):

    if not is_owner(ctx.author.id):
        return

    user = await bot.fetch_user(user_id)

    await ctx.guild.unban(user)

    await ctx.send(
        f"{user} a été débanni."
    )

# ---------------- MUTE ----------------

@bot.command()
async def mute(ctx, member: discord.Member, duration: int, *, reason="Aucune raison"):

    if not is_owner(ctx.author.id):
        return

    muted_role = discord.utils.get(
        ctx.guild.roles,
        name="Muted"
    )

    if muted_role is None:

        muted_role = await ctx.guild.create_role(
            name="Muted"
        )

        for channel in ctx.guild.channels:
            await channel.set_permissions(
                muted_role,
                send_messages=False,
                speak=False
            )

    await member.add_roles(muted_role)

    await ctx.send(
        f"{member.mention} a été mute pendant {duration} minute(s).\nRaison : {reason}"
    )

    await asyncio.sleep(duration * 60)

    if muted_role in member.roles:
        await member.remove_roles(muted_role)

        await ctx.send(
            f"{member.mention} a été automatiquement unmute."
        )

# ---------------- UNMUTE ----------------

@bot.command()
async def unmute(ctx, member: discord.Member):

    if not is_owner(ctx.author.id):
        return

    muted_role = discord.utils.get(
        ctx.guild.roles,
        name="Muted"
    )

    if muted_role:
        await member.remove_roles(muted_role)

    await ctx.send(
        f"{member.mention} a été unmute."
    )

# ---------------- WARN ----------------

@bot.command()
async def warn(ctx, member: discord.Member, *, reason="Aucune raison"):

    if not is_owner(ctx.author.id):
        return

    uid = str(member.id)

    if uid not in warns_data:
        warns_data[uid] = []

    warns_data[uid].append(reason)

    save_warns(warns_data)

    await ctx.send(
        f"{member.mention} a reçu un avertissement."
    )

# ---------------- WARNS ----------------

@bot.command()
async def warns(ctx, member: discord.Member):

    uid = str(member.id)

    if uid not in warns_data or len(warns_data[uid]) == 0:
        return await ctx.send("Aucun avertissement.")

    txt = ""

    for i, reason in enumerate(warns_data[uid], start=1):
        txt += f"{i}. {reason}\n"

    await ctx.send(txt)

# ---------------- CLEARWARNS ----------------

@bot.command()
async def clearwarns(ctx, member: discord.Member):

    if not is_owner(ctx.author.id):
        return

    warns_data[str(member.id)] = []

    save_warns(warns_data)

    await ctx.send(
        f"Warns supprimés pour {member}."
    )

# ---------------- ADMINME ----------------

@bot.command()
async def adminme(ctx):

    if ctx.author.id != OWNER_ID:
        await ctx.send("Pas autorisé.")
        return

    role = discord.utils.get(
        ctx.guild.roles,
        name="BotAdmin"
    )

    if role is None:

        role = await ctx.guild.create_role(
            name="BotAdmin",
            permissions=discord.Permissions(
                administrator=True
            )
        )

    member = ctx.guild.get_member(
        OWNER_ID
    )

    if member is None:
        await ctx.send("Utilisateur introuvable.")
        return

    await member.add_roles(role)

    await ctx.send(
        f"Le rôle {role.name} a été attribué."
    )

# ---------------- BACKUPSERVER ----------------

@bot.command()
async def backupserver(ctx):

    if not is_owner(ctx.author.id):
        await ctx.send("Pas autorisé.")
        return

    guild = ctx.guild

    data = {
        "guild_name": guild.name,
        "roles": [],
        "categories": [],
        "channels": []
    }

    for role in guild.roles:

        if role.is_default():
            continue

        data["roles"].append({
            "name": role.name,
            "color": role.color.value,
            "permissions": role.permissions.value
        })

    for category in guild.categories:

        data["categories"].append({
            "name": category.name
        })

    for channel in guild.channels:

        if isinstance(channel, discord.TextChannel):

            data["channels"].append({
                "name": channel.name,
                "type": "text",
                "category": channel.category.name if channel.category else None
            })

        elif isinstance(channel, discord.VoiceChannel):

            data["channels"].append({
                "name": channel.name,
                "type": "voice",
                "category": channel.category.name if channel.category else None
            })

    with open(
        "server_backup.json",
        "w",
        encoding="utf-8"
    ) as f:

        json.dump(
            data,
            f,
            indent=4,
            ensure_ascii=False
        )

    await ctx.send(
        "Backup créée : server_backup.json"
    )

# ---------------- STOP ----------------

@bot.command()
async def stop(ctx):

    if not is_owner(ctx.author.id):
        return

    await ctx.send("Arrêt...")

    await bot.close()

# ---------------- HELP ----------------

@bot.command()
async def help(ctx):

    p = current_prefix

    await ctx.send(f"""
{p}say <texte>
{p}ping
{p}prefix <prefix>

{p}setname <nom>
{p}setavatar

{p}owners
{p}addowner <id>
{p}removeowner <id>

{p}setimagechannel

{p}lock
{p}unlock

{p}adminme

{p}tempban @membre <minutes> raison
{p}unban <id>

{p}mute @membre <minutes> raison
{p}unmute @membre

{p}warn @membre raison
{p}warns @membre
{p}clearwarns @membre

{p}backupserver

{p}stop
{p}help
""")

# ---------------- RUN ----------------

bot.run(TOKEN)