const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const {
  diceGame,
  hasPermission,
  buildLobbyEmbed,
  buildJoinRow,
  resetDiceGame
} = require('../diceManager');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('startdice')
    .setDescription('Start dice event'),

  async execute(interaction) {

    if (!hasPermission(interaction)) {
      return interaction.reply({ content: "❌ No permission", flags: 64 });
    }

    if (diceGame.active || diceGame.lobby) {
      return interaction.reply({ content: "❌ Game already running", flags: 64 });
    }

    // ===== SET GAME =====
    diceGame.lobby = true;
    diceGame.active = false;
    diceGame.target = Math.floor(Math.random() * 100) + 1;
    diceGame.minRange = 1;
    diceGame.maxRange = 100;
    diceGame.prize = "50 points";
    diceGame.playerLimit = 20;
    diceGame.lobbyTime = 60;
    diceGame.timeLeft = 60;
    diceGame.channelId = interaction.channelId;
    diceGame.guildId = interaction.guildId;
    diceGame.players = [];

    // ===== SEND MESSAGE =====
    const sent = await interaction.reply({
      embeds: [buildLobbyEmbed()],
      components: [buildJoinRow()]
    });

    diceGame.lobbyMessage = sent;

    // ===== TIMER =====
    diceGame.lobbyInterval = setInterval(async () => {
      if (!diceGame.lobby) return;

      diceGame.timeLeft--;

      const channel = interaction.channel || interaction.client.channels.cache.get(interaction.channelId);

      if (diceGame.timeLeft === 30 && channel) {
        channel.send("⚠️ 30 seconds left!");
      }

      if (diceGame.timeLeft === 10 && channel) {
        channel.send("⚠️ 10 seconds left!");
      }

      try {
        if (diceGame.lobbyMessage?.edit) {
          await diceGame.lobbyMessage.edit({
            embeds: [buildLobbyEmbed()],
            components: [buildJoinRow()]
          });
        }
      } catch {}

      if (diceGame.timeLeft <= 0) {
        clearInterval(diceGame.lobbyInterval);

        if (diceGame.players.length < 2) {
          resetDiceGame();
          return;
        }

        diceGame.lobby = false;
        diceGame.active = true;

        if (channel) {
          channel.send("🎲 Game started!");
        }
      }

    }, 1000);
  }
};
