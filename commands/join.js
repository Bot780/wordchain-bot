const { SlashCommandBuilder } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('join')
    .setDescription('Join game'),

  async execute(i, game) {

    // ❌ No lobby
    if (!game.lobbyMessage) {
      return i.reply({
        content: "❌ No active lobby",
        ephemeral: true
      });
    }

    // ❌ Game already started
    if (game.active) {
      return i.reply({
        content: "❌ Game already started",
        ephemeral: true
      });
    }

    // ❌ Already joined
    if (game.players.includes(i.user.id)) {
      return i.reply({
        content: "Already joined!",
        ephemeral: true
      });
    }

    // ✅ Add player
    game.players.push(i.user.id);

    // ✅ Update lobby
    await game.updateLobbyUI(i.channel);

    // ✅ Reply (clean)
    return i.reply({
      content: `✅ <@${i.user.id}> joined`,
      allowedMentions: { users: [i.user.id] }
    });
  }
};
