const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { diceGame, hasPermission, buildJoinRow, resetDiceGame } = require('../diceManager');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('stopdice')
    .setDescription('Stop the current dice event (Admin/Manager only)'),

  async execute(interaction, game) {
    if (!hasPermission(interaction)) {
      return interaction.reply({
        embeds: [
          new EmbedBuilder()
            .setColor('Red')
            .setTitle('❌ No Permission')
            .setDescription('You need to be an **Admin** or **Game Manager** to stop the dice event.')
        ],
        flags: 64
      });
    }

    if (!diceGame.active && !diceGame.lobby) {
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

    const target = diceGame.target;
    const totalRolls = diceGame.rolls.length;

    // Find closest roll — best (closest) roll per user, then find overall closest
    let closestRoll = null;
    if (diceGame.rolls.length > 0) {
      const bestPerUser = {};
      for (const r of diceGame.rolls) {
        const dist = Math.abs(r.rolled - target);
        if (!bestPerUser[r.userId] || dist < Math.abs(bestPerUser[r.userId].rolled - target)) {
          bestPerUser[r.userId] = r;
        }
      }
      closestRoll = Object.values(bestPerUser).reduce((best, r) =>
        Math.abs(r.rolled - target) < Math.abs(best.rolled - target) ? r : best
      );
    }

    // Disable lobby message if still in lobby
    if (diceGame.lobby && diceGame.lobbyMessage) {
      try {
        await diceGame.lobbyMessage.edit({
          embeds: [
            new EmbedBuilder()
              .setColor('Red')
              .setTitle('🛑 Dice Event Cancelled')
              .setDescription('This lobby was closed by an admin.')
          ],
          components: [buildJoinRow(true)]
        });
      } catch {}
    }

    resetDiceGame();

    return interaction.reply({
      embeds: [
        new EmbedBuilder()
          .setColor('Red')
          .setTitle('🛑 Dice Event Stopped')
          .setDescription(`The dice event was stopped by <@${interaction.user.id}>.`)
          .addFields(
            { name: '🎯 Target Was', value: `\`${target}\``, inline: true },
            { name: '🎲 Total Rolls', value: `\`${totalRolls}\``, inline: true },
            {
              name: '🏆 Closest Roll',
              value: closestRoll
                ? `<@${closestRoll.userId}> rolled \`${closestRoll.rolled}\` (${Math.abs(closestRoll.rolled - target)} away)`
                : '*No rolls were made*',
              inline: false
            }
          )
      ]
    });
  }
};

