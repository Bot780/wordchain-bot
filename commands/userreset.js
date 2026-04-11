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
    .setName('userreset')
    .setDescription('Reset user stats')
    .addUserOption(o => o.setName('user').setRequired(true)),

  async execute(interaction) {
    const isOwner = interaction.user.id === OWNER_ID;
    const isAdmin = interaction.member.permissions.has("Administrator");

    if (!isOwner && !isAdmin) {
      return interaction.reply({ content: "❌ Admin only", ephemeral: true });
    }

    const user = interaction.options.getUser('user');
    const data = loadData();
    const guildId = interaction.guild.id;

    if (data[guildId]?.[user.id]) {
      data[guildId][user.id] = { points: 0, wins: 0 };
    }

    saveData(data);

    interaction.reply(`🔄 Reset stats for <@${user.id}>`);
  }
};
