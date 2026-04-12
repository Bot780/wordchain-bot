const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { getConfig } = require('../configLoader');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('managerlist')
    .setDescription('View all manager roles'),

  async execute(interaction) {
    const config = getConfig(interaction.guild.id);

    const roles = config.managerRoles || [];

    // ❌ No managers
    if (roles.length === 0) {
      return interaction.reply({
        content: "❌ No manager roles set",
        flags: 64
      });
    }

    // ✅ Format roles
    const roleList = roles.map(r => `<@&${r}>`).join('\n');

    const embed = new EmbedBuilder()
      .setColor("Blue")
      .setTitle("🎮 Manager Roles")
      .setDescription(roleList);

    return interaction.reply({
      embeds: [embed]
    });
  }
};
