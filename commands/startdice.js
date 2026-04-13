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
    .setDescription('Start a dice roll event (Admin/Manager only)')
    .addIntegerOption(opt =>
      opt.setName('target')
        .setDescription('Target number (optional)')
        .setRequired(false)
    )
    .addIntegerOption(opt =>
      opt.setName('min')
        .setDescription('Minimum roll')
        .setRequired(false)
        .setMinValue(1)
    )
    .addIntegerOption(opt =>
      opt.setName('max')
        .setDescription('Maximum roll')
        .setRequired(false)
        .setMinValue(2)
    )
    .addStringOption(opt =>
      opt.setName('prize')
        .setDescription('Prize (e.g. 500 points / Nitro)')
        .setRequired(false)
    )
    .addIntegerOption(opt =>
      opt.setName('playerlimit')
        .setDescription('Max players')
        .setRequired(false)
        .setMinValue(2)
        .setMaxValue(100)
    )
    .addIntegerOption(opt =>
      opt.setName('lobbytime')
        .setDescription('Lobby time (seconds)')
        .setRequired(false)
        .setMinValue(10)
        .setMaxValue(300)
    ),

  async execute(interaction) {

    if (!hasPermission(interaction)) {
      return interaction.reply({ content: "❌ No permission", flags: 64 });
    }

    if (diceGame.active || diceGame.lobby) {
      return interaction.reply({ content: "❌ Game already running", flags: 64 });
    }

    // ===== OPTIONS =====
    const minRange = interaction.options.getInteger('min') || 1;
    const maxRange = interaction.options.getInteger('max') || 100;

    if (minRange >= maxRange) {
      return interaction.reply({ content: "❌ Invalid range", flags: 64 });
    }

    const rawTarget = interaction.options.getInteger('target');
    const target = rawTarget
      ? Math.min(Math.max(rawTarget, minRange), maxRange)
      : Math.floor(Math.random() * (maxRange - minRange + 1)) + minRange;

    // ===== SET GAME =====
    diceGame.lobby = true;
    diceGame.active = false;
    diceGame.target = target;
    diceGame.minRange = minRange;
    diceGame.maxRange = maxRange;
    diceGame.prize = interaction.options.getString('prize') || '50 points';
    diceGame.playerLimit = interaction.options.getInteger('playerlimit') || 20;
    diceGame.lobbyTime = interaction.options.getInteger('lobbytime') || 60;
    diceGame.timeLeft = diceGame.lobbyTime;
    diceGame.channelId = interaction.channelId;
    diceGame.guildId = interaction.guildId;
    diceGame.players = [];
    diceGame.rolls = [];
    diceGame.cooldowns = new Map();

    // ===== SEND LOBBY =====
    const msg = await interaction.reply({
      embeds: [buildLobbyEmbed()],
      components: [buildJoinRow()]
    });

    diceGame.lobbyMessage = msg;

    // ===== TIMER =====
    diceGame.lobbyInterval = setInterval(async () => {
      if (!diceGame.lobby) return;

      diceGame.timeLeft--;

      const channel =
        interaction.channel ||
        interaction.client?.channels?.cache?.get(interaction.channelId);

      if (diceGame.timeLeft === 30 && channel) {
        channel.send("⚠️ **30 seconds left!**");
      }

      if (diceGame.timeLeft === 10 && channel) {
        channel.send("⚠️ **10 seconds left!**");
      }

      // ===== UPDATE LOBBY =====
      try {
        if (diceGame.lobbyMessage?.edit) {
          await diceGame.lobbyMessage.edit({
            embeds: [buildLobbyEmbed()],
            components: [buildJoinRow()]
          });
        }
      } catch {}

      // ===== END LOBBY =====
      if (diceGame.timeLeft <= 0) {
        clearInterval(diceGame.lobbyInterval);

        if (diceGame.players.length < 2) {
          resetDiceGame();
          return;
        }

        diceGame.lobby = false;
        diceGame.active = true;

        if (channel) {
          channel.send({
            embeds: [
              new EmbedBuilder()
                .setTitle('🎲 Dice Event — Game On!')
                .setColor('Orange')
                .setDescription('Use `/rolldice` to roll!')
                .addFields(
                  { name: '🎯 Target', value: `**${diceGame.target}**`, inline: true },
                  { name: '🎲 Range', value: `\`${minRange}–${maxRange}\``, inline: true },
                  { name: '🏆 Prize', value: `**${diceGame.prize}**`, inline: true },
                  { name: '👥 Players', value: `\`${diceGame.players.length}\``, inline: true }
                )
            ]
          });
        }
      }

    }, 1000);
  }
};
