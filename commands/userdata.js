const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const fs = require('fs');

const dataFile = './data.json';

function loadData() {
  if (!fs.existsSync(dataFile)) return {};
  return JSON.parse(fs.readFileSync(dataFile));
}

module.exports = {
  data: new SlashCommandBuilder()
    .setName('userdata')
    .setDescription('View user stats')
    .addUserOption(option =>
      option.setName('user')
        .setDescription('Select user')
        .setRequired(false)
    ),

  async execute(interaction) {
    const target = interaction.options.getUser('user') || interaction.user;

    const data = loadData();
    const guildId = interaction.guild.id;

    const userData = data[guildId]?.[target.id] || { points: 0, wins: 0 };

    const embed = new EmbedBuilder()
      .setTitle(`📊 ${target.username}'s Stats`)
      .setThumbnail(target.displayAvatarURL({ dynamic: true }))
      .addFields(
        { name: '🏆 Wins', value: `${userData.wins}`, inline: true },
        { name: '⭐ Points', value: `${userData.points}`, inline: true }
      )
      .setColor('Gold')
      .setFooter({ text: 'WordChain Stats' });

    await interaction.reply({ embeds: [embed] });
  }
};
