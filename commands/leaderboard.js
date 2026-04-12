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
    const guildId = interaction.guild.id;

    // ✅ STRICT SERVER CHECK
    if (!data[guildId] || Object.keys(data[guildId]).length === 0) {
      return interaction.reply("❌ No data for this server yet.");
    }

    // ✅ ONLY THIS SERVER DATA
    const users = Object.entries(data[guildId]);

    // 🔥 SORT BY POINTS
    const sorted = users
      .sort((a, b) => b[1].points - a[1].points)
      .slice(0, 10);

    // 🎯 FORMAT
    const text = sorted.map(([id, stats], i) =>
      `**${i + 1}.** <@${id}> — ⭐ ${stats.points} pts | 🏆 ${stats.wins} wins`
    ).join("\n");

    const embed = new EmbedBuilder()
      .setTitle("🏆 Server Leaderboard")
      .setColor("Gold")
      .setDescription(text || "No players yet");

    return interaction.reply({ embeds: [embed] });
  }
};
