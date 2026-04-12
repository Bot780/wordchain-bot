const { SlashCommandBuilder, EmbedBuilder, PermissionsBitField } = require('discord.js');
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
    .setDescription('Add stats to user')

    .addUserOption(o =>
      o.setName('user')
       .setDescription('Select user')
       .setRequired(true)
    )

    // 🔥 UPDATED TYPES
    .addStringOption(o =>
      o.setName('type')
       .setDescription('What to add')
       .setRequired(true)
       .addChoices(
         { name: 'Points', value: 'points' },
         { name: 'Wins', value: 'gamesWon' } // ✅ FIXED
       )
    )

    .addIntegerOption(o =>
      o.setName('amount')
       .setDescription('Amount to add')
       .setRequired(true)
    ),

  async execute(interaction) {

    const isOwner = interaction.user.id === OWNER_ID;
    const isAdmin = interaction.member.permissions.has(
      PermissionsBitField.Flags.Administrator
    );

    if (!isOwner && !isAdmin) {
      return interaction.reply({
        content: "❌ Admin only",
        ephemeral: true
      });
    }

    const user = interaction.options.getUser('user');
    const type = interaction.options.getString('type');
    const amount = interaction.options.getInteger('amount');

    const data = loadData();
    const guildId = interaction.guild.id;

    if (!data[guildId]) data[guildId] = {};
    if (!data[guildId][user.id]) {
      data[guildId][user.id] = {
        points: 0,
        gamesWon: 0,
        gamesPlayed: 0
      };
    }

    // 🔥 APPLY
    if (!data[guildId][user.id][type]) {
      data[guildId][user.id][type] = 0;
    }

    data[guildId][user.id][type] += amount;

    saveData(data);

    const embed = new EmbedBuilder()
      .setTitle("✅ User Updated")
      .setColor("Green")
      .setDescription(
        `👤 User: <@${user.id}>\n` +
        `➕ Added: **${amount} ${type === "gamesWon" ? "wins" : type}**`
      );

    return interaction.reply({
      embeds: [embed],
      allowedMentions: { users: [user.id] }
    });
  }
};
