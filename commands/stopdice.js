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
    const players = [...diceGame.players];

    // ✅ FIX: rolls is now object
    const rollsArray = Object.entries(diceGame.rolls).map(([userId, rolled]) => ({
      userId,
      rolled
    }));

    const totalRolls = rollsArray.length;

    // ✅ Find closest roll
    let closestRoll = null;
    if (rollsArray.length > 0) {
      closestRoll = rollsArray.reduce((closest, r) => {
        return Math.abs(r.rolled - target) < Math.abs(closest.rolled - target)
          ? r
          : closest;
      });
    }

    // ✅ Disable lobby message if still in lobby
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
            { name: '👥 Total Rolls', value: `\`${totalRolls}\``, inline: true },
            {
              name: '🎲 Closest Roll',
              value: closestRoll
                ? `<@${closestRoll.userId}> rolled \`${closestRoll.rolled}\` (${Math.abs(closestRoll.rolled - target)} away)`
                : '*No rolls were made*',
              inline: false
            },
            {
              name: '👥 Players',
              value: players.length > 0
                ? players.map(p => `<@${p}>`).join(', ')
                : '*None*',
              inline: false
            }
          )
      ]
    });
  }
};
