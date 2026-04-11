require('dotenv').config();
const { Client, GatewayIntentBits, REST, Routes } = require('discord.js');
const fs = require('fs');

const TOKEN = process.env.TOKEN;
const CLIENT_ID = "1492188016649961653";

const express = require("express");
const app = express();

app.get("/", (req, res) => res.send("Bot is alive"));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log("🌐 Web server running"));

process.on("uncaughtException", (err) => {
  console.error("Crash:", err);
  process.exit(1);
});

process.on("unhandledRejection", (err) => {
  console.error("Promise Error:", err);
  process.exit(1);
});

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent
  ]
});

// ===== COMMAND HANDLER =====
client.commands = new Map();

const commandFiles = fs.readdirSync('./commands').filter(f => f.endsWith('.js'));
let commandsData = [];

for (const file of commandFiles) {
  const cmd = require(`./commands/${file}`);
  client.commands.set(cmd.data.name, cmd);
  commandsData.push(cmd.data.toJSON());
}

// ===== REGISTER COMMANDS =====
const rest = new REST({ version: '10' }).setToken(TOKEN);

(async () => {
  try {
    await rest.put(
      Routes.applicationCommands(CLIENT_ID),
      { body: commandsData }
    );
    console.log("✅ Commands registered");
  } catch (err) {
    console.error(err);
  }
})();

// ===== LOAD GAME =====
const game = require('./game');

// ===== INTERACTIONS =====
client.on('interactionCreate', async interaction => {

  // ===== CONFIG PANEL HANDLER (🔥 IMPORTANT)
  const configCmd = client.commands.get('config');
  if (
    (interaction.isButton() ||
     interaction.isStringSelectMenu() ||
     interaction.isModalSubmit()) &&
    configCmd?.handleInteraction
  ) {
    const handled = await configCmd.handleInteraction(interaction);
    if (handled !== false) return;
  }

  // ===== GAME BUTTON =====
  if (interaction.isButton()) {
    return game.handleButton(interaction);
  }

  // ===== SLASH COMMAND =====
  if (interaction.isChatInputCommand()) {
    const cmd = client.commands.get(interaction.commandName);
    if (!cmd) return;

    try {
      await cmd.execute(interaction, game);
    } catch (err) {
      console.error(err);

      if (interaction.replied || interaction.deferred) {
        interaction.followUp({ content: "❌ Error", flags: 64 });
      } else {
        interaction.reply({ content: "❌ Error", flags: 64 });
      }
    }
  }
});

// ===== GAME MESSAGES =====
client.on("messageCreate", msg => {
  if (msg.author.bot) return;
  game.handleMessage(msg);
});

// ===== LOGIN (FIXED 💀)
client.login(TOKEN);
