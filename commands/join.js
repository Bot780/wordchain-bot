const { SlashCommandBuilder } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('join')
    .setDescription('Join game'),

  async execute(i, game) {

    if (!game.lobbyMessage || game.active) {
      return i.reply("❌ No active lobby");
    }

    if (game.players.includes(i.user.id)) {
      return i.reply("Already joined!");
    }

    game.players.push(i.user.id);

    if (game.lobbyMessage) {
      await game.lobbyMessage.edit({
        embeds: [game.createLobbyEmbed()]
      });
    }

    i.reply("✅ Joined!");
  }
};
