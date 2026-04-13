require('dotenv').config();
const { Client, GatewayIntentBits, REST, Routes } = require('discord.js');
const fs = require('fs');

const TOKEN = process.env.TOKEN;
const CLIENT_ID = "1492188016649961653";

// ===== WEB SERVER =====
const express = require("express");
const app = express();

app.get("/", (req, res) => res.send("Bot is alive"));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log("🌐 Web server running"));

// ===== ERROR HANDLING =====
process.on("uncaughtException", (err) => {
  console.error("Crash:", err);
});

process.on("unhandledRejection", (err) => {
  console.error("Promise Error:", err);
});

// ===== CLIENT =====
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
const commandsData = [];

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

  // ===== CONFIG =====
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

  // ===== PROFILE =====
  if (interaction.isButton()) {
    const profile = client.commands.get('profile');
    if (profile?.handleInteraction) {
      const handled = await profile.handleInteraction(interaction);
      if (handled !== false) return;
    }
  }

  // ===== LEADERBOARD =====
  if (interaction.isButton() || interaction.isStringSelectMenu()) {
    const leaderboard = client.commands.get('leaderboard');
    if (leaderboard?.handleInteraction) {
      const handled = await leaderboard.handleInteraction(interaction);
      if (handled !== false) return;
    }
  }

  // ===== HOWTOPLAY =====
  if (interaction.isButton()) {
    const howto = client.commands.get('howtoplay');
    if (howto?.handleInteraction) {
      const handled = await howto.handleInteraction(interaction);
      if (handled !== false) return;
    }
  }

  // ===== JOIN DICE BUTTON =====
  if (interaction.isButton()) {
    const joinDice = client.commands.get('joindice');
    if (joinDice?.handleInteraction) {
      const handled = await joinDice.handleInteraction(interaction);
      if (handled !== false) return;
    }
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
      let replied = false;

      const safeInteraction = {
        ...interaction,

        reply: async (data) => {
          if (!replied) {
            replied = true;
            return interaction.reply(data);
          } else {
            return interaction.followUp(data);
          }
        },

        editReply: async (data) => {
          if (interaction.deferred) {
            return interaction.editReply(data);
          } else {
            return interaction.reply(data);
          }
        },

        deferReply: async () => {
          if (!interaction.deferred && !interaction.replied) {
            return interaction.deferReply();
          }
        }
      };

      await cmd.execute(safeInteraction, game);

    } catch (err) {
      console.error(err);

      if (!interaction.replied && !interaction.deferred) {
        interaction.reply("❌ Error");
      } else {
        interaction.followUp("❌ Error");
      }
    }
  }
});

// ===== HYBRID PREFIX SYSTEM =====
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

  const send = (data) => {
    if (typeof data === "string") {
      return msg.channel.send({ content: data });
    }
    return msg.channel.send(data);
  };

  const fakeInteraction = {
    user: msg.author,
    guildId: msg.guild.id,
    channelId: msg.channel.id,
    member: msg.member,
    memberPermissions: msg.member.permissions,

    replied: false,

    reply: async (data) => {
      fakeInteraction.replied = true;
      return send(data);
    },

    followUp: async (data) => send(data),

    deferReply: async () => {},

    editReply: async (data) => send(data),

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
    if (!fakeInteraction.replied) {
      send("❌ Error running command");
    }
  }
});

// ===== LOGIN =====
client.login(TOKEN);
