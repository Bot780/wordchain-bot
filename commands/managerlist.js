const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { getManagerRoles } = require('../diceManager');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('managerlist')
    .setDescription('View all manager roles for dice events'),

  async execute(interaction) {
    const roles = getManagerRoles(interaction.guildId);

    const roleList = roles.length > 0
      ? roles.map(r => `• <@&${r}>`).join('\n')
      : '*No manager roles set yet.*\nAdmins can use `/setmanager` to add one.';

    return interaction.reply({
      embeds: [
        new EmbedBuilder()
          .setColor('Blurple')
          .setTitle('👑 Dice Event Manager Roles')
          .setDescription(roleList)
          .setFooter({ text: `${roles.length} manager role${roles.length === 1 ? '' : 's'} configured` })
      ]
    });
  }
};
