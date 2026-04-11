const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const fs = require('fs');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('checkword')
    .setDescription('Check if word exists')
    .addStringOption(option =>
      option.setName('word').setDescription('Word').setRequired(true)
    ),

  async execute(i) {

    let word = i.options.getString('word').toLowerCase().trim();

    const file = fs.readFileSync('./words.txt', 'utf-8');
    const words = new Set(file.split('\n'));

    const formatted =
      word.charAt(0).toUpperCase() + word.slice(1);

    if (words.has(word)) {
      return i.reply({
        embeds: [
          new EmbedBuilder()
            .setColor("Green")
            .setTitle("✅ Word Found")
            .setDescription(`**${formatted}** exists in dictionary`)
        ]
      });
    } else {
      return i.reply({
        embeds: [
          new EmbedBuilder()
            .setColor("Red")
            .setTitle("❌ Not Found")
            .setDescription(`**${formatted}** is not in dictionary`)
        ]
      });
    }
  }
};
