const { SlashCommandBuilder, PermissionsBitField } = require('discord.js');
const { diceGame, startGame } = require('../diceGame');
const { getConfig } = require('../configLoader');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('startdice')
    .setDescription('Start dice game')
    .addStringOption(opt =>
      opt.setName('mode')
        .setDescription('Game mode')
        .setRequired(true)
        .addChoices(
          { name: 'Easy', value: 'easy' },
          { name: 'Hard', value: 'hard' },
          { name: 'Random', value: 'random' }
        )
    ),

  async execute(interaction) {
    const config = getConfig(interaction.guild.id);

    const isAdmin = interaction.member.permissions.has(
      PermissionsBitField.Flags.Administrator
    );

    const isManager = config.managerRoles?.some(roleId =>
      interaction.member.roles.cache.has(roleId)
    );

    if (!isAdmin && !isManager) {
      return interaction.reply({
        content: "❌ Admin or Manager only",
        flags: 64
      });
    }

    if (diceGame.active) {
      return interaction.reply({
        content: "❌ Dice game already running",
        flags: 64
      });
    }

    const mode = interaction.options.getString('mode');

    startGame(mode);

    return interaction.reply({
      content:
        `🎲 **Dice Game Started!**\n\n` +
        `🎯 Target Number: ???\n` +
        `🎮 Mode: **${mode.toUpperCase()}**\n\n` +
        `Use /roll to play!`
    });
  }
};
