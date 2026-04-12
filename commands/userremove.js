const { SlashCommandBuilder, PermissionsBitField } = require('discord.js');
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
    .setName('userremove')
    .setDescription('Remove points or wins from user')

    .addUserOption(o =>
      o.setName('user')
       .setDescription('Select user')
       .setRequired(true)
