const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { diceGame, hasPermission, buildJoinRow, resetDiceGame } = require('../diceManager');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('stopdice')
    .setDescription('Stop the current dice event (Admin/Manager only)'),

  async execute(interaction) {

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

    // ===== FIND CLOSEST =====
    let closestRoll = null;

    if (diceGame.rolls.length > 0) {
      const bestPerUser = {};

      for (const r of diceGame.rolls) {
        const dist = Math.abs(r.rolled - target);

        if (
          !bestPerUser[r.userId] ||
          dist < Math.abs(bestPerUser[r.userId].rolled - target)
        ) {
          bestPerUser[r.userId] = r;
        }
      }

      closestRoll = Object.values(bestPerUser).reduce((best, r) =>
        Math.abs(r.rolled - target) < Math.abs(best.rolled - target) ? r : best
      );
    }

    // ===== DISABLE LOBBY MESSAGE =====
    if (diceGame.lobby && diceGame.lobbyMessage) {
      try {
        if (diceGame.lobbyMessage.edit) {
          await diceGame.lobbyMessage.edit({
            embeds: [
              new EmbedBuilder()
                .setColor('Red')
                .setTitle('🛑 Dice Event Cancelled')
                .setDescription('This lobby was closed by an admin.')
            ],
            components: [buildJoinRow(true)]
          });
        }
      } catch {}
    }

    // ===== RESET GAME =====
    resetDiceGame();

    // ===== FINAL RESPONSE =====
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
