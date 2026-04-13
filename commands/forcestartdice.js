const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { diceGame, hasPermission, buildJoinRow } = require('../diceManager');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('forcestartdice')
    .setDescription('Force start the dice event immediately (Admin/Manager only)'),

  async execute(interaction) {
    if (!hasPermission(interaction)) {
      return interaction.reply({
        embeds: [
          new EmbedBuilder()
            .setColor('Red')
            .setTitle('❌ No Permission')
            .setDescription('You need to be an **Admin** or **Game Manager** to force start.')
        ],
        flags: 64
      });
    }

    if (!diceGame.lobby) {
      return interaction.reply({
        embeds: [
          new EmbedBuilder()
            .setColor('Red')
            .setTitle('❌ No Lobby Open')
            .setDescription('There is no dice lobby open right now. Use `/startdice` first.')
        ],
        flags: 64
      });
    }

    if (diceGame.players.length < 2) {
      return interaction.reply({
        embeds: [
          new EmbedBuilder()
            .setColor('Red')
            .setTitle('❌ Not Enough Players')
            .setDescription(`Need at least **2 players** to start. Currently: \`${diceGame.players.length}\``)
        ],
        flags: 64
      });
    }

    // ✅ stop lobby timer safely
    if (diceGame.lobbyInterval) {
      clearInterval(diceGame.lobbyInterval);
    }

    diceGame.lobby = false;
    diceGame.active = true;

    // ✅ update lobby message safely
    try {
      if (diceGame.lobbyMessage) {
        await diceGame.lobbyMessage.edit({
          embeds: [
            new EmbedBuilder()
              .setColor('Green')
              .setTitle('🎲 Lobby Closed — Game is Live!')
              .setDescription('Force started by an admin. Good luck!')
          ],
          components: [buildJoinRow(true)]
        });
      }
    } catch {}

    await interaction.reply({
      embeds: [
        new EmbedBuilder()
          .setTitle('🎲 Dice Event — Game On!')
          .setColor('Orange')
          .setDescription('Use `/rolldice` to roll! Hit the exact target to win!')
          .addFields(
            { name: '🎯 Target', value: `\`${diceGame.target}\``, inline: true },
            { name: '🎲 Range', value: `\`${diceGame.minRange}–${diceGame.maxRange}\``, inline: true },
            { name: '🏆 Prize', value: `${diceGame.prize}`, inline: true },
            { name: '👥 Players', value: `\`${diceGame.players.length}\` players`, inline: true }
          )
          .setFooter({ text: '⏱ 5s cooldown between rolls' })
      ]
    });
  }
};
