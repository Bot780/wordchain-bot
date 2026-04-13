const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { diceGame, buildLobbyEmbed, buildJoinRow, resetDiceGame } = require('../diceManager');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('leavedice')
    .setDescription('Leave the dice event lobby or game'),

  async execute(interaction) {
    if (!diceGame.lobby && !diceGame.active) {
      return interaction.reply({
        embeds: [
          new EmbedBuilder()
            .setColor('Red')
            .setTitle('❌ No Active Game')
            .setDescription('There is no dice event running right now.')
        ],
        flags: 64
      });
    }

    if (!diceGame.players.includes(interaction.user.id)) {
      return interaction.reply({
        embeds: [
          new EmbedBuilder()
            .setColor('Yellow')
            .setTitle('⚠️ Not Joined')
            .setDescription('You are not part of this dice event.')
        ],
        flags: 64
      });
    }

    // ✅ Remove player
    diceGame.players = diceGame.players.filter(p => p !== interaction.user.id);

    // ✅ Update lobby safely
    if (diceGame.lobby && diceGame.lobbyMessage) {
      try {
        await diceGame.lobbyMessage.edit({
          embeds: [buildLobbyEmbed()],
          components: [buildJoinRow()]
        });
      } catch {}
    }

    // ✅ If game active and <2 players → end
    if (diceGame.active && diceGame.players.length < 2) {
      const lastPlayer = diceGame.players[0] || null;
      const prize = diceGame.prize;
      const target = diceGame.target;

      resetDiceGame();

      return interaction.reply({
        embeds: [
          new EmbedBuilder()
            .setColor('Gold')
            .setTitle('🏆 Game Over — Last Player Standing!')
            .setDescription(
              `<@${interaction.user.id}> left the game.\n\n` +
              `${lastPlayer
                ? `<@${lastPlayer}> wins by default! 🎉\n🏆 Prize: \`${prize} points\``
                : 'No winner — everyone left.'}\n\n` +
              `🎯 Target was: \`${target}\``
            )
        ]
      });
    }

    return interaction.reply({
      embeds: [
        new EmbedBuilder()
          .setColor('Orange')
          .setTitle('👋 Left the Dice Event')
          .setDescription(
            `<@${interaction.user.id}> left the dice event.\n\n` +
            `👥 Players remaining: \`${diceGame.players.length}\``
          )
      ]
    });
  }
};
