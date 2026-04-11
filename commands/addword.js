const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const fs = require('fs');

const OWNER_ID = "1382280682319122442";

module.exports = {
  data: new SlashCommandBuilder()
    .setName('addword')
    .setDescription('Add a word to dictionary')
    .setDefaultMemberPermissions(0)
    .addStringOption(option =>
      option.setName('word').setDescription('Word').setRequired(true)
    ),

  async execute(i, game) {

    if (i.user.id !== OWNER_ID) {
      return i.reply({ content: "❌ Owner only", flags: 64 });
    }

    let word = i.options.getString('word').toLowerCase().trim();

    if (!/^[a-z]+$/.test(word))
      return i.reply({ content: "❌ Only letters", flags: 64 });

    if (word.length < 3 || word.length > 15)
      return i.reply({ content: "❌ 3–15 letters only", flags: 64 });

    const file = fs.readFileSync('./words.txt', 'utf-8');
    const list = new Set(file.split('\n'));

    if (list.has(word))
      return i.reply({ content: "⚠️ Already exists", flags: 64 });

    fs.appendFileSync('./words.txt', `\n${word}`);

    if (game.reloadWords) game.reloadWords(); // 🔥 AUTO RELOAD

    const formatted =
      word.charAt(0).toUpperCase() + word.slice(1);

    return i.reply({
      embeds: [
        new EmbedBuilder()
          .setColor("Green")
          .setTitle("✅ Word Added")
          .setDescription(`**${formatted}** added`)
      ],
      flags: 64
    });
  }
};
