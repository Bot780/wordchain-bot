const { SlashCommandBuilder, PermissionsBitField, EmbedBuilder } = require('discord.js');
const fs = require('fs');

const configFile = './config.json';

function loadConfig() {
  if (!fs.existsSync(configFile)) return {};
  return JSON.parse(fs.readFileSync(configFile));
}

function saveConfig(data) {
  fs.writeFileSync(configFile, JSON.stringify(data, null, 2));
}

module.exports = {
  data: new SlashCommandBuilder()
    .setName('setmanager')
    .setDescription('Add a manager role')
    .addRoleOption(opt =>
      opt.setName('role')
        .setDescription('Manager role')
        .setRequired(true)
    ),

  async execute(interaction) {
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

    if (!config[guildId]) {
      config[guildId] = { managerRoles: [] };
    }

    if (!config[guildId].managerRoles) {
      config[guildId].managerRoles = [];
    }

    // ❌ prevent duplicate
    if (config[guildId].managerRoles.includes(role.id)) {
      return interaction.reply({
        content: "⚠️ Role already a manager",
        flags: 64
      });
    }

    config[guildId].managerRoles.push(role.id);

    saveConfig(config);

    const embed = new EmbedBuilder()
      .setColor("Green")
      .setTitle("✅ Manager Added")
      .setDescription(`🎮 ${role} is now a manager`);

    return interaction.reply({ embeds: [embed] });
  }
};
