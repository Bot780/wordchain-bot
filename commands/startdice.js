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
        .setDescription('Target number (leave empty = random)')
    )
    .addIntegerOption(opt =>
      opt.setName('min')
        .setDescription('Minimum roll range (default: 1)')
        .setMinValue(1)
    )
    .addIntegerOption(opt =>
      opt.setName('max')
        .setDescription('Maximum roll range (default: 100)')
        .setMinValue(2)
    )
    .addStringOption(opt =>
      opt.setName('prize')
        .setDescription('Prize (e.g. "500 points", "Nitro")')
    )
    .addIntegerOption(opt =>
      opt.setName('playerlimit')
        .setDescription('Max players (default: 20)')
        .setMinValue(2)
        .setMaxValue(100)
    )
    .addIntegerOption(opt =>
      opt.setName('lobbytime')
        .setDescription('Lobby time in seconds (default: 60)')
        .setMinValue(10)
        .setMaxValue(300)
    ),

  async execute(interaction) {
    // ===== PERMISSION =====
    if (!hasPermission(interaction)) {
      return interaction.reply({
        embeds: [
          new EmbedBuilder()
            .setColor('Red')
            .setTitle('❌ No Permission')
            .setDescription('You need Admin or Manager role.')
        ],
        flags: 64
      });
    }

    // ===== GAME CHECK =====
    if (diceGame.active || diceGame.lobby) {
      return interaction.reply({
        embeds: [
          new EmbedBuilder()
            .setColor('Red')
            .setTitle('❌ Game Already Running')
        ],
        flags: 64
      });
    }

    // ===== OPTIONS =====
    const minRange = interaction.options.getInteger('min') || 1;
    const maxRange = interaction.options.getInteger('max') || 100;

    if (minRange >= maxRange) {
      return interaction.reply({
        embeds: [
          new EmbedBuilder()
            .setColor('Red')
            .setTitle('❌ Invalid Range')
        ],
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

    // ===== SEND LOBBY =====
    await interaction.reply({
      embeds: [buildLobbyEmbed()],
      components: [buildJoinRow()]
    });

    // ===== SAFE FETCH (FIXED) =====
    if (interaction.fetchReply) {
      diceGame.lobbyMessage = await interaction.fetchReply();
    } else {
      diceGame.lobbyMessage = null;
    }

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

      // SAFE EDIT
      if (diceGame.lobbyMessage?.edit) {
        try {
          await diceGame.lobbyMessage.edit({
            embeds: [buildLobbyEmbed()],
            components: [buildJoinRow()]
          });
        } catch {}
      }

      // ===== END LOBBY =====
      if (diceGame.timeLeft <= 0) {
        clearInterval(diceGame.lobbyInterval);

        if (diceGame.players.length < 2) {
          if (diceGame.lobbyMessage?.edit) {
            try {
              await diceGame.lobbyMessage.edit({
                embeds: [
                  new EmbedBuilder()
                    .setColor('Red')
                    .setTitle('❌ Not Enough Players')
                ],
                components: [buildJoinRow(true)]
              });
            } catch {}
          }

          resetDiceGame();
          return;
        }

        diceGame.lobby = false;
        diceGame.active = true;

        if (diceGame.lobbyMessage?.edit) {
          try {
            await diceGame.lobbyMessage.edit({
              embeds: [
                new EmbedBuilder()
                  .setColor('Green')
                  .setTitle('🎲 Game Started!')
              ],
              components: [buildJoinRow(true)]
            });
          } catch {}
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
