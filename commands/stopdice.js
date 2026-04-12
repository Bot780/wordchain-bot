const { SlashCommandBuilder, PermissionsBitField } = require('discord.js');
const { diceGame, stopGame } = require('../diceGame');
const { getConfig } = require('../configLoader');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('stopdice')
    .setDescription('Stop dice game'),

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

    if (!diceGame.active) {
      return interaction.reply({
        content: "❌ No active dice game",
        flags: 64
      });
    }

    const result = stopGame();

    if (!result.closestUser) {
      return interaction.reply("🛑 Game ended. No one rolled.");
    }

    return interaction.reply({
      content:
        `🛑 **Dice Game Ended!**\n\n` +
        `🎯 Target: **${result.target}**\n` +
        `🥇 Closest Player: <@${result.closestUser}> (${result.rolls[result.closestUser]})`
    });
  }
};
