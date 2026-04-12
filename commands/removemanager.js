const { SlashCommandBuilder, PermissionsBitField, EmbedBuilder } = require('discord.js');
const fs = require('fs');

const configFile = './config.json';

// ===== LOAD =====
function loadConfig() {
  if (!fs.existsSync(configFile)) return {};
  return JSON.parse(fs.readFileSync(configFile));
}

// ===== SAVE =====
function saveConfig(data) {
  fs.writeFileSync(configFile, JSON.stringify(data, null, 2));
}

module.exports = {
  data: new SlashCommandBuilder()
    .setName('removemanager')
    .setDescription('Remove a manager role')
    .addRoleOption(opt =>
      opt.setName('role')
        .setDescription('Role to remove')
        .setRequired(true)
    ),

  async execute(interaction) {
    // 🔒 ADMIN ONLY
    const isAdmin = interaction.member.permissions.has(
      PermissionsBitField.Flags.Administrator
    );

    if (!isAdmin) {
      return interaction.reply({
        content: "❌ Admin only",
        flags: 64
      });
    }

    const role = interaction.options.getRole('role');

    const config = loadConfig();
    const guildId = interaction.guild.id;

    if (!config[guildId] || !config[guildId].managerRoles) {
      return interaction.reply({
        content: "❌ No manager roles set",
        flags: 64
      });
    }

    const roles = config[guildId].managerRoles;

    // ❌ not in list
    if (!roles.includes(role.id)) {
      return interaction.reply({
        content: "❌ This role is not a manager",
        flags: 64
      });
    }

    // ✅ remove role
    config[guildId].managerRoles = roles.filter(r => r !== role.id);

    saveConfig(config);

    const embed = new EmbedBuilder()
      .setColor("Red")
      .setTitle("➖ Manager Removed")
      .setDescription(`🚫 ${role} is no longer a manager`);

    return interaction.reply({ embeds: [embed] });
  }
};
