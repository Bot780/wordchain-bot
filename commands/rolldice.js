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
        embeds: [new EmbedBuilder().setColor('Red').setTitle('❌ No Active Game')],
        flags: 64
      });
    }

    if (interaction.channelId !== diceGame.channelId) {
      return interaction.reply({
        embeds: [new EmbedBuilder().setColor('Red').setTitle('❌ Wrong Channel')],
        flags: 64
      });
    }

    if (!diceGame.players.includes(interaction.user.id)) {
      return interaction.reply({
        embeds: [new EmbedBuilder().setColor('Red').setTitle('❌ Not a Participant')],
        flags: 64
      });
    }

    // ===== 🔥 FIXED COOLDOWN =====
    const cd = checkRollCooldown(interaction.user.id);
    if (cd > 0) {

      const msg = await interaction.reply({
        embeds: [
          new EmbedBuilder()
            .setColor('Yellow')
            .setTitle('⏳ Cooldown')
            .setDescription(`Wait **${cd}s** before rolling again!`)
        ]
      });

      // auto delete after remaining cooldown
      setTimeout(() => {
        msg.delete().catch(() => {});
      }, cd * 1000);

      return;
    }

    // ===== ROLL =====
    const { minRange, maxRange, target } = diceGame;
    const rolled = Math.floor(Math.random() * (maxRange - minRange + 1)) + minRange;
    const hit = rolled === target;

    diceGame.rolls.push({
      userId: interaction.user.id,
      rolled,
      hit
    });

    if (hit) {
      const prizePoints = parseInt(diceGame.prize) || 0;

      if (prizePoints > 0) {
        const player = getPlayer(interaction.user.id, interaction.guildId);

        updatePlayer(interaction.user.id, interaction.guildId, {
          points: (player.points || 0) + prizePoints
        });
      }

      const totalRolls = diceGame.rolls.length;
      const prize = diceGame.prize;

      resetDiceGame();

      return interaction.reply({
        embeds: [
          new EmbedBuilder()
            .setTitle('🎉 Winner!')
            .setColor('Gold')
            .setDescription(`<@${interaction.user.id}> hit the target!`)
            .addFields(
              { name: '🎲 Roll', value: `\`${rolled}\``, inline: true },
              { name: '🎯 Target', value: `\`${target}\``, inline: true },
              { name: '🏆 Prize', value: `${prize}`, inline: true },
              { name: '👥 Total Rolls', value: `\`${totalRolls}\``, inline: true }
            )
        ]
      });
    }

    return interaction.reply({
      embeds: [
        new EmbedBuilder()
          .setColor('Red')
          .setTitle('🎲 Miss!')
          .addFields(
            { name: '👤 Player', value: `<@${interaction.user.id}>`, inline: true },
            { name: '🎲 Rolled', value: `\`${rolled}\``, inline: true },
            { name: '🎯 Target', value: `**${target}**`, inline: true },
            { name: '🎲 Range', value: `\`${minRange}–${maxRange}\``, inline: true }
          )
      ]
    });
  }
};
