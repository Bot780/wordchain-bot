const { SlashCommandBuilder } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('leave')
    .setDescription('Leave game'),

  async execute(i, game) {
    game.leaveGame(i.user.id, i.channel);
    i.reply("Left game");
  }
};
