require('dotenv').config();
const { Client, GatewayIntentBits, REST, Routes } = require('discord.js');
const fs = require('fs');

const TOKEN = process.env.TOKEN;
const CLIENT_ID = "1492188016649961653";

// ===== WEB =====
const express = require("express");
const app = express();
app.get("/", (req, res) => res.send("Bot is alive"));
app.listen(process.env.PORT || 3000);

// ===== CLIENT =====
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent
  ]
});

// ===== COMMANDS =====
client.commands = new Map();
const commandFiles = fs.readdirSync('./commands').filter(f => f.endsWith('.js'));
const commandsData = [];

for (const file of commandFiles) {
  const cmd = require(`./commands/${file}`);
  client.commands.set(cmd.data.name, cmd);
  commandsData.push(cmd.data.toJSON());
}

// ===== REGISTER =====
const rest = new REST({ version: '10' }).setToken(TOKEN);
(async () => {
  await rest.put(Routes.applicationCommands(CLIENT_ID), { body: commandsData });
  console.log("✅ Commands registered");
})();

// ===== GAME =====
const game = require('./game');

// ===== INTERACTIONS =====
client.on('interactionCreate', async interaction => {
  if (!interaction.isChatInputCommand() && !interaction.isButton()) return;

  const cmd = client.commands.get(interaction.commandName);

  // BUTTON (joindice)
  // ===== BUTTON HANDLER =====
if (interaction.isButton()) {

  // 🎲 Dice join
  if (interaction.customId === 'join_dice') {
    const joinDice = client.commands.get('joindice');
    if (joinDice?.handleInteraction) {
      return joinDice.handleInteraction(interaction);
    }
  }

  // 🔤 WordChain join (🔥 THIS IS YOUR FIX)
  if (interaction.customId === 'join') {
    const joinCmd = client.commands.get('join');
    if (!joinCmd) return;

    try {
      await joinCmd.execute(interaction, game); // ✅ PASS GAME
    } catch (err) {
      console.error(err);
    }

    return;
  }
}
// ===== PREFIX SYSTEM =====
client.on("messageCreate", async msg => {
  if (msg.author.bot || !msg.guild) return;

  const { getPrefix } = require('./diceManager');
  const prefix = getPrefix(msg.guild.id);

  if (!msg.content.startsWith(prefix)) {
    return game.handleMessage(msg);
  }

  const args = msg.content.slice(prefix.length).trim().split(/ +/);
  const cmdName = args.shift().toLowerCase();
  const command = client.commands.get(cmdName);
  if (!command) return;

  const fakeInteraction = {
    user: msg.author,
    guildId: msg.guild.id,
    channelId: msg.channel.id,
    channel: msg.channel,
    client: client,
    member: msg.member,
    memberPermissions: msg.member.permissions,

    reply: async (data) => msg.channel.send(data),
    followUp: async (data) => msg.channel.send(data),

    options: {
      getString: () => args.join(' '),
      getInteger: () => {
        const val = parseInt(args[0]);
        return isNaN(val) ? null : val;
      },
      getRole: () => null
    }
  };

  try {
    await command.execute(fakeInteraction);
  } catch (err) {
    console.error(err);
    msg.channel.send("❌ Error running command");
  }
});

// ===== LOGIN =====
client.login(TOKEN);
