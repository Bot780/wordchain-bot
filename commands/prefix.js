const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { getPrefix } = require('../diceManager');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('prefix')
    .setDescription('Show the current bot prefix for this server'),

  async execute(interaction) {
    const prefix = getPrefix(interaction.guildId) || '.';

    return interaction.reply({
      embeds: [
        new EmbedBuilder()
          .setColor('Blurple')
          .setTitle('🔤 Current Prefix')
          .setDescription(`The current prefix for this server is: **\`${prefix}\`**`)
          .addFields(
            {
              name: '📝 Example',
              value: `\`${prefix}help\`, \`${prefix}roll\``,
              inline: false
            }
          )
          .setFooter({ text: 'Admins can change this with /setprefix' })
      ],
      flags: 64
    });
  }
};
