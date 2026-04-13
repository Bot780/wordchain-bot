const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { diceGame, checkRollCooldown, resetDiceGame } = require('../diceManager');
const { getPlayer, updatePlayer } = require('../stats');

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
            .setDescription('There is no dice game running right now! Wait for the lobby to start.')
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
            .setDescription('You did not join this dice event! You can join the next one.')
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
            .setDescription(`You must wait **${cd} second${cd > 1 ? 's' : ''}** before rolling again!`)
        ],
        flags: 64
      });
    }

    const { minRange, maxRange, target } = diceGame;

    const rolled = Math.floor(Math.random() * (maxRange - minRange + 1)) + minRange;
    const hit = rolled === target;

    // ✅ FIX: rolls is object (userId → roll)
    diceGame.rolls[interaction.user.id] = rolled;

    const totalRolls = Object.keys(diceGame.rolls).length;

    // ===== WIN =====
    if (hit) {
      const player = getPlayer(interaction.user.id, interaction.guildId);

      updatePlayer(interaction.user.id, interaction.guildId, {
        points: (player.points || 0) + diceGame.prize
      });

      const prize = diceGame.prize;

      resetDiceGame();

      return interaction.reply({
        embeds: [
          new EmbedBuilder()
            .setTitle('🎉 We Have a Winner!')
            .setColor('Gold')
            .setDescription(`<@${interaction.user.id}> hit the exact target and won the dice event!`)
            .addFields(
              { name: '🎲 Winning Roll', value: `\`${rolled}\``, inline: true },
              { name: '🎯 Target Was', value: `\`${target}\``, inline: true },
              { name: '🏆 Points Won', value: `\`${prize} points\``, inline: true },
              { name: '👥 Total Rolls', value: `\`${totalRolls}\``, inline: true }
            )
            .setFooter({ text: 'Congratulations! 🎊' })
        ]
      });
    }

    // ===== MISS =====
    const diff = rolled - target;
    const hint = diff > 0 ? '📉 Too high!' : '📈 Too low!';

    return interaction.reply({
      embeds: [
        new EmbedBuilder()
          .setColor('Red')
          .setTitle('🎲 Miss!')
          .addFields(
            { name: '🎲 You Rolled', value: `\`${rolled}\``, inline: true },
            { name: '🎲 Range', value: `\`${minRange}–${maxRange}\``, inline: true },
            { name: '💬 Hint', value: hint, inline: false }
          )
          .setFooter({ text: `Total rolls so far: ${totalRolls} • 5s cooldown applies` })
      ],
      flags: 64
    });
  }
};
