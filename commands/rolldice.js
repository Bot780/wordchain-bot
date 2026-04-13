const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { diceGame, checkRollCooldown, resetDiceGame } = require('../diceManager');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('rolldice')
    .setDescription('Roll the dice in the active dice event!'),

  async execute(interaction) {
    if (!diceGame.active) {
      return interaction.reply({
        embeds: [
          new EmbedBuilder()
            .setColor('Red')
            .setTitle('❌ No Active Game')
            .setDescription('There is no dice game running right now!')
        ],
        flags: 64
      });
    }

    if (interaction.channelId !== diceGame.channelId) {
      return interaction.reply({
        embeds: [
          new EmbedBuilder()
            .setColor('Red')
            .setTitle('❌ Wrong Channel')
            .setDescription(`The dice event is running in <#${diceGame.channelId}>!`)
        ],
        flags: 64
      });
    }

    if (!diceGame.players.includes(interaction.user.id)) {
      return interaction.reply({
        embeds: [
          new EmbedBuilder()
            .setColor('Red')
            .setTitle('❌ Not a Participant')
            .setDescription('You did not join this dice event!')
        ],
        flags: 64
      });
    }

    const cd = checkRollCooldown(interaction.user.id);
    if (cd > 0) {
      return interaction.reply({
        embeds: [
          new EmbedBuilder()
            .setColor('Yellow')
            .setTitle('⏳ Cooldown')
            .setDescription(`Wait **${cd}s** before rolling again!`)
        ],
        flags: 64
      });
    }

    const { minRange, maxRange, target } = diceGame;

    const rolled = Math.floor(Math.random() * (maxRange - minRange + 1)) + minRange;
    const hit = rolled === target;

    diceGame.rolls[interaction.user.id] = rolled;

    const totalRolls = Object.keys(diceGame.rolls).length;

    // ===== WIN =====
    if (hit) {
      const prize = diceGame.prize;

      resetDiceGame();

      return interaction.reply({
        embeds: [
          new EmbedBuilder()
            .setTitle('🎉 We Have a Winner!')
            .setColor('Gold')
            .setDescription(`<@${interaction.user.id}> hit the exact target and won!`)
            .addFields(
              { name: '🎲 Roll', value: `\`${rolled}\``, inline: true },
              { name: '🎯 Target', value: `\`${target}\``, inline: true },
              { name: '🏆 Prize', value: `${prize}`, inline: true },
              { name: '👥 Total Rolls', value: `\`${totalRolls}\``, inline: true }
            )
        ]
      });
    }

    // ===== MISS =====
    return interaction.reply({
      embeds: [
        new EmbedBuilder()
          .setColor('Red')
          .setTitle('🎲 Miss!')
          .addFields(
            { name: '👤 Player', value: `<@${interaction.user.id}>`, inline: true },
            { name: '🎲 Rolled', value: `\`${rolled}\``, inline: true },
            { name: '💡 Hint', value: rolled > target ? '📉 Too high!' : '📈 Too low!', inline: false }
          )
          .setFooter({ text: `Total rolls: ${totalRolls}` })
      ]
    });
  }
};
