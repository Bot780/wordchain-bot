const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('forcestart')
    .setDescription('Force start the game'),

  async execute(interaction, game) {

    await interaction.deferReply({ flags: 64 });

    if (!game) {
      return interaction.editReply("❌ Game not loaded");
    }

    if (game.active || game.starting) {
      return interaction.editReply("❌ Game already running");
    }

    if (!game.players || game.players.length < 1) {
      return interaction.editReply("❌ No players joined");
    }

    // 🔥 stop lobby timer
    clearInterval(game.lobbyInterval);

    // 🔥 create disabled button (NO BUG NOW)
    const disabledRow = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId("join")
        .setLabel("Game Closed")
        .setStyle(ButtonStyle.Secondary)
        .setDisabled(true)
    );

    // 🔥 update lobby embed
    if (game.lobbyMessage) {
      await game.lobbyMessage.edit({
        embeds: [
          new EmbedBuilder()
            .setTitle("🎮 Word Chain Lobby")
            .setDescription("🚀 Game Started (Force)\nLobby closed.")
            .setColor("Green")
        ],
        components: [disabledRow]
      });
    }

    // 🔥 start game properly
    game.starting = false;
    game.active = false; // reset safety
    await game.startGame(interaction.channel);

    return interaction.editReply("✅ Force started!");
  }
};
