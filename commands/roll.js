const { SlashCommandBuilder } = require('discord.js');
const { diceGame, roll } = require('../diceGame');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('roll')
    .setDescription('Roll the dice'),

  async execute(interaction) {
    if (!diceGame.active) {
      return interaction.reply({ content: "❌ No active dice game", flags: 64 });
    }

    const result = roll(interaction.user.id);

    if (result.error) {
      return interaction.reply({
        content: `⏳ Wait ${result.error}s`,
        flags: 64
      });
    }

    const msg = `🎲 <@${interaction.user.id}> rolled: **${result.value}**`;

    if (result.win) {
      diceGame.active = false;

      return interaction.reply({
        content:
          `${msg}\n\n🎉 **HIT THE NUMBER! YOU WIN!**\n🎯 Target was **${result.value}**`
      });
    }

    return interaction.reply({
      content: msg,
      allowedMentions: { users: [interaction.user.id] }
    });
  }
};
