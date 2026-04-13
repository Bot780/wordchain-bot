const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } = require('discord.js');
const { addManagerRole, getManagerRoles } = require('../diceManager');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('setmanager')
    .setDescription('Add a manager role that can control dice events (Admin only)')
    .addRoleOption(opt =>
      opt.setName('role')
        .setDescription('The role to grant manager permissions')
        .setRequired(true)
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

  async execute(interaction) {
    // ✅ Strict admin check (not hasPermission)
    if (!interaction.memberPermissions?.has(PermissionFlagsBits.Administrator)) {
      return interaction.reply({
        embeds: [
          new EmbedBuilder()
            .setColor('Red')
            .setTitle('❌ No Permission')
            .setDescription('Only **Admins** can add manager roles.')
        ],
        flags: 64
      });
    }

    const role = interaction.options.getRole('role');

    const current = getManagerRoles(interaction.guildId);

    // ✅ Prevent duplicate
    if (current.includes(role.id)) {
      return interaction.reply({
        embeds: [
          new EmbedBuilder()
            .setColor('Yellow')
            .setTitle('⚠️ Already Manager')
            .setDescription(`<@&${role.id}> is already a manager role.`)
        ],
        flags: 64
      });
    }

    addManagerRole(interaction.guildId, role.id);

    return interaction.reply({
      embeds: [
        new EmbedBuilder()
          .setColor('Green')
          .setTitle('✅ Manager Role Added')
          .setDescription(`<@&${role.id}> can now manage dice events!`)
      ]
    });
  }
};
