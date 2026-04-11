const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const fs = require('fs');

const OWNER_ID = "1382280682319122442";

module.exports = {
  data: new SlashCommandBuilder()
    .setName('removeword')
    .setDescription('Remove a word')
    .setDefaultMemberPermissions(0)
    .addStringOption(option =>
      option.setName('word').setDescription('Word').setRequired(true)
    ),

  async execute(i, game) {

    if (i.user.id !== OWNER_ID) {
      return i.reply({ content: "❌ Owner only", flags: 64 });
    }

    let word = i.options.getString('word').toLowerCase().trim();

    let file = fs.readFileSync('./words.txt', 'utf-8');
    let words = file.split('\n').map(w => w.trim());

    if (!words.includes(word)) {
      return i.reply({
        embeds: [
          new EmbedBuilder()
            .setColor("Red")
            .setDescription("❌ Word not found")
        ],
        flags: 64
      });
    }

    // remove word
    words = words.filter(w => w !== word);
    fs.writeFileSync('./words.txt', words.join('\n'));

    if (game.reloadWords) game.reloadWords(); // 🔥 AUTO RELOAD

    const formatted =
      word.charAt(0).toUpperCase() + word.slice(1);

    return i.reply({
      embeds: [
        new EmbedBuilder()
          .setColor("Orange")
          .setTitle("🗑️ Word Removed")
          .setDescription(`**${formatted}** removed`)
      ],
      flags: 64
    });
  }
};
