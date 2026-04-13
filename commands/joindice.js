const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { diceGame, buildLobbyEmbed, buildJoinRow } = require('../diceManager');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('joindice')
    .setDescription('Join the active dice roll event lobby'),

  // ===== SLASH COMMAND =====
  async execute(interaction) {

    // 🔥 FIX: prevent interaction timeout
    await interaction.deferReply({ flags: 64 });

    if (!diceGame.lobby) {
      return interaction.editReply({
        embeds: [
          new EmbedBuilder()
            .setColor('Red')
            .setTitle('❌ No Active Lobby')
            .setDescription('There is no dice event lobby open right now.')
        ]
      });
    }

    if (interaction.channelId !== diceGame.channelId) {
      return interaction.editReply({
        embeds: [
          new EmbedBuilder()
            .setColor('Red')
            .setTitle('❌ Wrong Channel')
            .setDescription(`Game is in <#${diceGame.channelId}>`)
        ]
      });
    }

    if (diceGame.players.includes(interaction.user.id)) {
      return interaction.editReply({
        embeds: [
          new EmbedBuilder()
            .setColor('Yellow')
            .setTitle('⚠️ Already Joined')
            .setDescription('You already joined!')
        ]
      });
    }

    if (diceGame.players.length >= diceGame.playerLimit) {
      return interaction.editReply({
        embeds: [
          new EmbedBuilder()
            .setColor('Red')
            .setTitle('❌ Lobby Full')
            .setDescription('Lobby is full!')
        ]
      });
    }

    // ===== ADD PLAYER =====
    diceGame.players.push(interaction.user.id);

    // ===== UPDATE LOBBY =====
    try {
      if (diceGame.lobbyMessage?.edit) {
        await diceGame.lobbyMessage.edit({
          embeds: [buildLobbyEmbed()],
          components: [buildJoinRow()]
        });
      }
    } catch {}

    return interaction.editReply({
      embeds: [
        new EmbedBuilder()
          .setColor('Green')
          .setTitle('✅ Joined!')
          .setDescription(`You joined the dice event!\n\n👥 ${diceGame.players.length}/${diceGame.playerLimit}`)
      ]
    });
  },

  // ===== BUTTON HANDLER =====
  async handleInteraction(interaction) {
    if (!interaction.isButton()) return false;
    if (interaction.customId !== 'joindice') return false;

    // 🔥 FIX: prevent timeout
    await interaction.deferReply({ flags: 64 });

    if (!diceGame.lobby) {
      return interaction.editReply({
        embeds: [
          new EmbedBuilder()
            .setColor('Red')
            .setDescription('❌ Lobby closed.')
        ]
      });
    }

    if (diceGame.players.includes(interaction.user.id)) {
      return interaction.editReply({
        embeds: [
          new EmbedBuilder()
            .setColor('Yellow')
            .setDescription('⚠️ Already joined!')
        ]
      });
    }

    if (diceGame.players.length >= diceGame.playerLimit) {
      return interaction.editReply({
        embeds: [
          new EmbedBuilder()
            .setColor('Red')
            .setDescription('❌ Lobby full!')
        ]
      });
    }

    // ===== ADD PLAYER =====
    diceGame.players.push(interaction.user.id);

    // ===== UPDATE LOBBY =====
    try {
      if (diceGame.lobbyMessage?.edit) {
        await diceGame.lobbyMessage.edit({
          embeds: [buildLobbyEmbed()],
          components: [buildJoinRow()]
        });
      }
    } catch {}

    return interaction.editReply({
      embeds: [
        new EmbedBuilder()
          .setColor('Green')
          .setTitle('✅ Joined!')
          .setDescription(`👥 ${diceGame.players.length}/${diceGame.playerLimit}`)
      ]
    });
  }
};
