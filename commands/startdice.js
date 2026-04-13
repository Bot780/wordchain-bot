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
    .setDescription('Start a dice roll event')
    .addIntegerOption(opt =>
      opt.setName('target').setDescription('Target number'))
    .addIntegerOption(opt =>
      opt.setName('min').setDescription('Min range').setMinValue(1))
    .addIntegerOption(opt =>
      opt.setName('max').setDescription('Max range').setMinValue(2))
    .addStringOption(opt =>
      opt.setName('prize').setDescription('Prize'))
    .addIntegerOption(opt =>
      opt.setName('playerlimit').setDescription('Max players').setMinValue(2).setMaxValue(100))
    .addIntegerOption(opt =>
      opt.setName('lobbytime').setDescription('Lobby time').setMinValue(10).setMaxValue(300)),

  async execute(interaction) {

    // ===== PERMISSION =====
    if (!hasPermission(interaction)) {
      return interaction.reply({
        embeds: [new EmbedBuilder().setColor('Red').setTitle('❌ No Permission')],
        flags: 64
      });
    }

    // ===== GAME RUNNING =====
    if (diceGame.active || diceGame.lobby) {
      return interaction.reply({
        embeds: [new EmbedBuilder().setColor('Red').setTitle('❌ Game Already Running')],
        flags: 64
      });
    }

    // ===== OPTIONS =====
    const minRange = interaction.options.getInteger('min') || 1;
    const maxRange = interaction.options.getInteger('max') || 100;

    if (minRange >= maxRange) {
      return interaction.reply({
        embeds: [new EmbedBuilder().setColor('Red').setTitle('❌ Invalid Range')],
        flags: 64
      });
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

    // ===== FIXED MESSAGE SYSTEM 🔥 =====
    let sentMessage;

    if (interaction.fetchReply) {
      // SLASH
      await interaction.reply({
        embeds: [buildLobbyEmbed()],
        components: [buildJoinRow()]
      });

      sentMessage = await interaction.fetchReply();
    } else {
      // PREFIX
      sentMessage = await interaction.reply({
        embeds: [buildLobbyEmbed()],
        components: [buildJoinRow()]
      });
    }

    diceGame.lobbyMessage = sentMessage;

    // ===== TIMER =====
    diceGame.lobbyInterval = setInterval(async () => {
      if (!diceGame.lobby) return;

      diceGame.timeLeft--;

      if (diceGame.timeLeft === 30) {
        interaction.channel.send("⚠️ 30 seconds left!");
      }

      if (diceGame.timeLeft === 10) {
        interaction.channel.send("⚠️ 10 seconds left!");
      }

      // ✅ LIVE UPDATE FIXED
      try {
        if (diceGame.lobbyMessage?.edit) {
          await diceGame.lobbyMessage.edit({
            embeds: [buildLobbyEmbed()],
            components: [buildJoinRow()]
          });
        }
      } catch {}

      // ===== END =====
      if (diceGame.timeLeft <= 0) {
        clearInterval(diceGame.lobbyInterval);

        if (diceGame.players.length < 2) {
          if (diceGame.lobbyMessage?.edit) {
            await diceGame.lobbyMessage.edit({
              embeds: [new EmbedBuilder().setColor('Red').setTitle('❌ Not Enough Players')],
              components: [buildJoinRow(true)]
            });
          }

          resetDiceGame();
          return;
        }

        diceGame.lobby = false;
        diceGame.active = true;

        if (diceGame.lobbyMessage?.edit) {
          await diceGame.lobbyMessage.edit({
            embeds: [new EmbedBuilder().setColor('Green').setTitle('🎲 Game Started!')],
            components: [buildJoinRow(true)]
          });
        }

        interaction.channel.send({
          embeds: [
            new EmbedBuilder()
              .setTitle('🎲 Dice Game Live!')
              .setColor('Orange')
              .addFields(
                { name: '🎯 Target', value: `**${diceGame.target}**`, inline: true },
                { name: '🎲 Range', value: `\`${minRange}-${maxRange}\``, inline: true },
                { name: '🏆 Prize', value: `${diceGame.prize}`, inline: true }
              )
          ]
        });
      }

    }, 1000);
  }
};
