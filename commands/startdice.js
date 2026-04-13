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
        .setDescription('Target number players must roll (leave empty = random)')
        .setRequired(false)
    )
    .addIntegerOption(opt =>
      opt.setName('min')
        .setDescription('Minimum roll range (default: 1)')
        .setRequired(false)
        .setMinValue(1)
    )
    .addIntegerOption(opt =>
      opt.setName('max')
        .setDescription('Maximum roll range (default: 100)')
        .setRequired(false)
        .setMinValue(2)
    )
    .addIntegerOption(opt =>
      opt.setName('prize')
        .setDescription('Points awarded to winner (default: 50)')
        .setRequired(false)
        .setMinValue(1)
        .setMaxValue(100000)
    )
    .addIntegerOption(opt =>
      opt.setName('playerlimit')
        .setDescription('Max players allowed (default: 20)')
        .setRequired(false)
        .setMinValue(2)
        .setMaxValue(100)
    )
    .addIntegerOption(opt =>
      opt.setName('lobbytime')
        .setDescription('Lobby open duration in seconds (default: 60)')
        .setRequired(false)
        .setMinValue(10)
        .setMaxValue(300)
    ),

  async execute(interaction) {
    if (!hasPermission(interaction)) {
      return interaction.reply({
        embeds: [
          new EmbedBuilder()
            .setColor('Red')
            .setTitle('❌ No Permission')
            .setDescription('You need to be an **Admin** or **Game Manager** to start a dice event.')
        ],
        flags: 64
      });
    }

    if (diceGame.active || diceGame.lobby) {
      return interaction.reply({
        embeds: [
          new EmbedBuilder()
            .setColor('Red')
            .setTitle('❌ Game Already Running')
            .setDescription('A dice game is already active! Use `/stopdice` to stop it first.')
        ],
        flags: 64
      });
    }

    // ✅ Prevent interval stacking
    if (diceGame.lobbyInterval) clearInterval(diceGame.lobbyInterval);

    const minRange = interaction.options.getInteger('min') ?? 1;
    const maxRange = interaction.options.getInteger('max') ?? 100;

    if (minRange >= maxRange) {
      return interaction.reply({
        embeds: [
          new EmbedBuilder()
            .setColor('Red')
            .setTitle('❌ Invalid Range')
            .setDescription('Minimum range must be less than maximum range.')
        ],
        flags: 64
      });
    }

    const rawTarget = interaction.options.getInteger('target');

    let target;
    if (rawTarget !== null) {
      if (rawTarget < minRange || rawTarget > maxRange) {
        return interaction.reply({
          content: `❌ Target must be between ${minRange} and ${maxRange}`,
          flags: 64
        });
      }
      target = rawTarget;
    } else {
      target = Math.floor(Math.random() * (maxRange - minRange + 1)) + minRange;
    }

    // ✅ INIT GAME
    diceGame.lobby = true;
    diceGame.active = false;
    diceGame.mode = null;
    diceGame.actualMode = null;
    diceGame.target = target;
    diceGame.minRange = minRange;
    diceGame.maxRange = maxRange;
    diceGame.prize = interaction.options.getInteger('prize') ?? 50;
    diceGame.playerLimit = interaction.options.getInteger('playerlimit') ?? 20;
    diceGame.lobbyTime = interaction.options.getInteger('lobbytime') ?? 60;
    diceGame.timeLeft = diceGame.lobbyTime;
    diceGame.channelId = interaction.channelId;
    diceGame.guildId = interaction.guildId;
    diceGame.players = [];
    diceGame.rolls = {}; // ✅ FIXED
    diceGame.cooldowns = new Map();

    await interaction.reply({
      embeds: [buildLobbyEmbed()],
      components: [buildJoinRow()]
    });

    diceGame.lobbyMessage = await interaction.fetchReply();

    diceGame.lobbyInterval = setInterval(async () => {
      if (!diceGame.lobby) return;

      diceGame.timeLeft--;

      if (diceGame.timeLeft === 30) {
        interaction.channel.send({
          embeds: [new EmbedBuilder().setColor('Yellow').setDescription('⚠️ **30 seconds** left to join the dice event!')]
        });
      }

      if (diceGame.timeLeft === 10) {
        interaction.channel.send({
          embeds: [new EmbedBuilder().setColor('Orange').setDescription('⚠️ **10 seconds** left to join the dice event!')]
        });
      }

      try {
        await diceGame.lobbyMessage.edit({
          embeds: [buildLobbyEmbed()],
          components: [buildJoinRow()]
        });
      } catch {}

      if (diceGame.timeLeft <= 0) {
        clearInterval(diceGame.lobbyInterval);

        if (diceGame.players.length < 2) {
          try {
            await diceGame.lobbyMessage.edit({
              embeds: [
                new EmbedBuilder()
                  .setColor('Red')
                  .setTitle('❌ Dice Event Cancelled')
                  .setDescription('Not enough players joined. Minimum **2 players** required.')
              ],
              components: [buildJoinRow(true)]
            });
          } catch {}

          resetDiceGame();
          return;
        }

        diceGame.lobby = false;
        diceGame.active = true;

        try {
          await diceGame.lobbyMessage.edit({
            embeds: [
              new EmbedBuilder()
                .setColor('Green')
                .setTitle('🎲 Lobby Closed — Game is Live!')
                .setDescription('Lobby is now closed. Good luck to all players!')
            ],
            components: [buildJoinRow(true)]
          });
        } catch {}

        const playerList = diceGame.players.length
          ? diceGame.players.map(p => `<@${p}>`).join(', ')
          : 'None';

        interaction.channel.send({
          embeds: [
            new EmbedBuilder()
              .setTitle('🎲 Dice Event — Game On!')
              .setColor('Orange')
              .setDescription('Use `/rolldice` to roll! First to hit the **exact target** wins!')
              .addFields(
                { name: '🎯 Target', value: `**${target}**`, inline: true },
                { name: '🎲 Range', value: `\`${minRange}–${maxRange}\``, inline: true },
                { name: '🏆 Prize', value: `\`${diceGame.prize} points\``, inline: true },
                { name: '👥 Players', value: playerList, inline: false }
              )
              .setFooter({ text: '⏱ 5 second cooldown between rolls!' })
          ]
        });
      }
    }, 1000);
  }
};
