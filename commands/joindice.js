const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { diceGame, buildLobbyEmbed, buildJoinRow } = require('../diceManager');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('joindice')
    .setDescription('Join the active dice roll event lobby'),

  async execute(interaction) {
    if (!diceGame.lobby) {
      return interaction.reply({
        embeds: [new EmbedBuilder().setColor('Red').setTitle('❌ No Active Lobby')],
        flags: 64
      });
    }

    if (interaction.channelId !== diceGame.channelId) {
      return interaction.reply({
        embeds: [new EmbedBuilder().setColor('Red').setTitle('❌ Wrong Channel')],
        flags: 64
      });
    }

    if (diceGame.players.includes(interaction.user.id)) {
      return interaction.reply({
        embeds: [new EmbedBuilder().setColor('Yellow').setTitle('⚠️ Already Joined')],
        flags: 64
      });
    }

    if (diceGame.players.length >= diceGame.playerLimit) {
      return interaction.reply({
        embeds: [new EmbedBuilder().setColor('Red').setTitle('❌ Lobby Full')],
        flags: 64
      });
    }

    diceGame.players.push(interaction.user.id);

    // ✅ SAFE EDIT
    try {
      if (diceGame.lobbyMessage?.edit) {
        await diceGame.lobbyMessage.edit({
          embeds: [buildLobbyEmbed()],
          components: [buildJoinRow()]
        });
      }
    } catch {}

    return interaction.reply({
      embeds: [
        new EmbedBuilder()
          .setColor('Green')
          .setTitle('✅ Joined!')
          .setDescription(`<@${interaction.user.id}> joined the dice event!\n\n👥 Players: \`${diceGame.players.length}/${diceGame.playerLimit}\``)
      ],
      flags: 64
    });
  },

  async handleInteraction(interaction) {
    if (!interaction.isButton()) return false;
    if (interaction.customId !== 'joindice') return false;

    if (!diceGame.lobby) {
      return interaction.reply({
        embeds: [new EmbedBuilder().setColor('Red').setDescription('❌ Lobby closed')],
        flags: 64
      });
    }

    if (diceGame.players.includes(interaction.user.id)) {
      return interaction.reply({
        embeds: [new EmbedBuilder().setColor('Yellow').setDescription('⚠️ Already joined')],
        flags: 64
      });
    }

    if (diceGame.players.length >= diceGame.playerLimit) {
      return interaction.reply({
        embeds: [new EmbedBuilder().setColor('Red').setDescription('❌ Lobby full')],
        flags: 64
      });
    }

    diceGame.players.push(interaction.user.id);

    // ✅ SAFE EDIT
    try {
      if (diceGame.lobbyMessage?.edit) {
        await diceGame.lobbyMessage.edit({
          embeds: [buildLobbyEmbed()],
          components: [buildJoinRow()]
        });
      }
    } catch {}

    return interaction.reply({
      embeds: [
        new EmbedBuilder()
          .setColor('Green')
          .setTitle('✅ Joined!')
          .setDescription(`<@${interaction.user.id}> joined the dice event!\n\n👥 Players: \`${diceGame.players.length}/${diceGame.playerLimit}\``)
      ],
      flags: 64
    });
  }
};
