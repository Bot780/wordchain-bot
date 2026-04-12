const { SlashCommandBuilder } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('join')
    .setDescription('Join game'),

  async execute(i, game) {

    if (!game.lobbyMessage || game.active) {
      return i.reply({ content: "❌ No active lobby", ephemeral: true });
    }

    if (game.players.includes(i.user.id)) {
      return i.reply({ content: "Already joined!", ephemeral: true });
    }

    game.players.push(i.user.id);

    // 🔥 SAME SYSTEM AS BUTTON
    await game.updateLobbyUI(i.channel);

    return i.reply({
      content: `✅ <@${i.user.id}> joined`,
      allowedMentions: { users: [i.user.id] }
    });
  }
};
