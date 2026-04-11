const { SlashCommandBuilder } = require('discord.js');
const fs = require('fs');

const OWNER_ID = "1382280682319122442";
const dataFile = './data.json';

function loadData() {
  if (!fs.existsSync(dataFile)) return {};
  return JSON.parse(fs.readFileSync(dataFile));
}

function saveData(data) {
  fs.writeFileSync(dataFile, JSON.stringify(data, null, 2));
}

module.exports = {
  data: new SlashCommandBuilder()
    .setName('useradd')
    .setDescription('Add points or wins')

    // ✅ FIXED OPTIONS
    .addUserOption(o =>
      o.setName('user')
       .setDescription('Select user') // 🔥 REQUIRED
       .setRequired(true)
    )

    .addIntegerOption(o =>
      o.setName('points')
       .setDescription('Points to add') // 🔥 REQUIRED
       .setRequired(false)
    )

    .addIntegerOption(o =>
      o.setName('wins')
       .setDescription('Wins to add') // 🔥 REQUIRED
       .setRequired(false)
    ),

  async execute(interaction) {
    const isOwner = interaction.user.id === OWNER_ID;
    const isServerOwner = interaction.guild.ownerId === interaction.user.id;

    if (!isOwner && !isServerOwner) {
      return interaction.reply({
        content: "❌ Server owner only",
        ephemeral: true
      });
    }

    const user = interaction.options.getUser('user');
    const addPoints = interaction.options.getInteger('points') || 0;
    const addWins = interaction.options.getInteger('wins') || 0;

    const data = loadData();
    const guildId = interaction.guild.id;

    if (!data[guildId]) data[guildId] = {};
    if (!data[guildId][user.id]) {
      data[guildId][user.id] = { points: 0, wins: 0 };
    }

    data[guildId][user.id].points += addPoints;
    data[guildId][user.id].wins += addWins;

    saveData(data);

    interaction.reply(
      `✅ Updated <@${user.id}> → +${addPoints} pts, +${addWins} wins`
    );
  }
};
