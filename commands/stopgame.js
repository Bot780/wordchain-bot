const {
  SlashCommandBuilder,
  EmbedBuilder,
  PermissionFlagsBits,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle
} = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('stopgame')
    .setDescription('Force stop the current running game (Admin only)')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

  async execute(interaction, game) {

    // ❌ No game running
    if (!game.active && !game.starting) {
      return interaction.reply({
        embeds: [
          new EmbedBuilder()
            .setColor('Red')
            .setDescription('❌ No game is currently running.')
        ],
        flags: 64
      });
    }

    // 🧹 Clear timers safely
    if (game.timer) clearTimeout(game.timer);
    if (game.lobbyInterval) clearInterval(game.lobbyInterval);

    // 🔘 Disable lobby button + update embed
    if (game.lobbyMessage) {
      try {
        const disabledRow = new ActionRowBuilder().addComponents(
          new ButtonBuilder()
            .setCustomId('join')
            .setLabel('Game Closed')
            .setStyle(ButtonStyle.Secondary)
            .setDisabled(true)
        );

        await game.lobbyMessage.edit({
          embeds: [
            new EmbedBuilder()
              .setTitle("🎮 Word Chain Lobby")
              .setDescription("🛑 Game was force stopped.\nLobby closed.")
              .setColor("Red")
          ],
          components: [disabledRow]
        });

      } catch (e) {}
    }

    // 🛑 Stop message (for players)
    await interaction.channel.send({
      embeds: [
        new EmbedBuilder()
          .setColor('Red')
          .setTitle('🛑 Game Stopped')
          .setDescription(`Game stopped by <@${interaction.user.id}>.`)
      ]
    });

    // 🔄 RESET GAME STATE
    game.active = false;
    game.starting = false;
    game.players = [];
    game.currentPlayerIndex = 0;
    game.lastLetter = "";
    game.usedWords = [];
    game.lobbyMessage = null;
    game.lobbyInterval = null;
    game.timer = null;
    game.timeLeft = 60;
    game.stats = {};
    game.minLength = 3;
    game.turnTime = 50000;
    game.turn = 1;

    // ✅ Reply to command
    return interaction.reply({
      content: "✅ Game successfully stopped.",
      flags: 64
    });
  }
};
