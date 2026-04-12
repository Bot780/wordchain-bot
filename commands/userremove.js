const { SlashCommandBuilder, PermissionsBitField 
} = require('discord.js');
const fs = require('fs');

const OWNER_ID = "1382280682319122442";
const dataFile = './data.json';

function loadData() {
  if (!fs.existsSync(dataFile)) return {};
  return JSON.parse(fs.readFileSync(dataFile));
}

function saveData(data) {
  fs.writeFileSync(dataFile, 
JSON.stringify(data, null, 2));
}

module.exports = {
  data: new SlashCommandBuilder()
    .setName('userremove')
    .setDescription('Remove points or wins from user')

    .addUserOption(o =>
      o.setName('user')
       .setDescription('Select user')
       .setRequired(true)
    )

    .addIntegerOption(o =>
      o.setName('points')
       .setDescription('Points to remove')
       .setRequired(false)
    )

    .addIntegerOption(o =>
      o.setName('wins')
       .setDescription('Wins to remove')
       .setRequired(false)
    ),

  async execute(interaction) {

    const isOwner = interaction.user.id === 
OWNER_ID;
    const isAdmin = 
interaction.member.permissions.has(
      PermissionsBitField.Flags.Administrator
    );

    if (!isOwner && !isAdmin) {
      return interaction.reply({
        content: "❌ Admin only",
        ephemeral: true
      });
    }

    const user = 
interaction.options.getUser('user');
    const removePoints = 
interaction.options.getInteger('points') || 0;
    const removeWins = 
interaction.options.getInteger('wins') || 0;

    if (removePoints === 0 && removeWins === 0) 
{
      return interaction.reply({
        content: "❌ Provide points or wins to 
remove",
        ephemeral: true
      });
    }

    const data = loadData();
    const guildId = interaction.guild.id;

    if (!data[guildId]) data[guildId] = {};
    if (!data[guildId][user.id]) {
      data[guildId][user.id] = { points: 0, 
wins: 0 };
    }

    // 🔥 SUBTRACT (NO NEGATIVE)
    data[guildId][user.id].points = Math.max(
      0,
      data[guildId][user.id].points - 
removePoints
    );

    data[guildId][user.id].wins = Math.max(
      0,
      data[guildId][user.id].wins - removeWins
    );

    saveData(data);

    return interaction.reply({
      content: `➖ Updated <@${user.id}> → 
-${removePoints} pts, -${removeWins} wins`,
      allowedMentions: { users: [user.id] }
    });
  }
};
