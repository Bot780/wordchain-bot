const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const fs = require('fs');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('leaderboard')
    .setDescription('Show server leaderboard'),

  async execute(interaction) {

    const file = './data.json';

    if (!fs.existsSync(file)) {
      return interaction.reply("❌ No data yet.");
    }

    const data = JSON.parse(fs.readFileSync(file));
    const guild = data[interaction.guild.id];

    if (!guild) {
      return interaction.reply("❌ No data for this server.");
    }

    const sorted = Object.entries(guild)
      .sort((a, b) => b[1].points - a[1].points)
      .slice(0, 10);

    const text = sorted.map(([id, stats], i) => {
      return `**${i + 1}.** <@${id}> — ${stats.points} pts | ${stats.wins} wins`;
    }).join("\n");

    return interaction.reply({
      embeds: [
        new EmbedBuilder()
          .setTitle("🏆 Server Leaderboard")
          .setColor("Gold")
          .setDescription(text || "No players yet")
      ]
    });
  }
};
