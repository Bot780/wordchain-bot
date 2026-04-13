const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } = require('discord.js');
const { setPrefix, getPrefix } = require('../diceManager');

const OWNER_ID = '1382280682319122442';

module.exports = {
  data: new SlashCommandBuilder()
    .setName('setprefix')
    .setDescription('Set a custom bot prefix for this server (Admin only)')
    .addStringOption(opt =>
      opt.setName('prefix')
        .setDescription('The new prefix (max 5 characters)')
        .setRequired(true)
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

  async execute(interaction) {
    // ✅ Admin OR Owner
    const isAdmin = interaction.memberPermissions?.has(PermissionFlagsBits.Administrator);
    const isOwner = interaction.user.id === OWNER_ID;

    if (!isAdmin && !isOwner) {
      return interaction.reply({
        embeds: [
          new EmbedBuilder()
            .setColor('Red')
            .setTitle('❌ No Permission')
            .setDescription('Only **Admins** can change the prefix.')
        ],
        flags: 64
      });
    }

    const newPrefix = interaction.options.getString('prefix')?.trim();

    // ✅ Safety checks
    if (!newPrefix || newPrefix.length === 0) {
      return interaction.reply({
        embeds: [
          new EmbedBuilder()
            .setColor('Red')
            .setTitle('❌ Invalid Prefix')
            .setDescription('Prefix cannot be empty.')
        ],
        flags: 64
      });
    }

    if (newPrefix.length > 5) {
      return interaction.reply({
        embeds: [
          new EmbedBuilder()
            .setColor('Red')
            .setTitle('❌ Prefix Too Long')
            .setDescription('Prefix must be **5 characters or less**.')
        ],
        flags: 64
      });
    }

    const oldPrefix = getPrefix(interaction.guildId) || '.';

    // ✅ No change check
    if (oldPrefix === newPrefix) {
      return interaction.reply({
        embeds: [
          new EmbedBuilder()
            .setColor('Yellow')
            .setTitle('⚠️ No Change')
            .setDescription(`The prefix is already set to **\`${newPrefix}\`**.`)
        ],
        flags: 64
      });
    }

    setPrefix(interaction.guildId, newPrefix);

    return interaction.reply({
      embeds: [
        new EmbedBuilder()
          .setColor('Green')
          .setTitle('✅ Prefix Updated')
          .addFields(
            { name: '📌 Old Prefix', value: `\`${oldPrefix}\``, inline: true },
            { name: '✨ New Prefix', value: `\`${newPrefix}\``, inline: true }
          )
          .setFooter({ text: 'Use /prefix to view the current prefix anytime' })
      ]
    });
  }
};
