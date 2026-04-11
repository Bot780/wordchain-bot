const { SlashCommandBuilder } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('start')
    .setDescription('Start game'),

  async execute(i, game) {
    game.players = [];
    game.host = i.user.id;
    game.active = false;

    return await game.startLobby(i.channel, i);
  }
};
