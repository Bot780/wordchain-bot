const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { diceGame, buildLobbyEmbed, buildJoinRow } = require('../diceManager');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('joindice')
    .setDescription('Join the active dice roll event lobby'),

  async execute(interaction) {
    if (!diceGame.lobby) {
      return interaction.reply({
        embeds: [
          new EmbedBuilder()
            .setColor('Red')
            .setTitle('❌ No Active Lobby')
            .setDescription('There is no dice event lobby open right now. Wait for an admin to start one!')
        ],
        flags: 64
      });
    }

    if (interaction.channelId !== diceGame.channelId) {
      return interaction.reply({
        embeds: [
          new EmbedBuilder()
            .setColor('Red')
            .setTitle('❌ Wrong Channel')
            .setDescription(`The dice event is running in <#${diceGame.channelId}>!`)
        ],
        flags: 64
      });
    }

    if (diceGame.players.includes(interaction.user.id)) {
      return interaction.reply({
        embeds: [
          new EmbedBuilder()
            .setColor('Yellow')
            .setTitle('⚠️ Already Joined')
            .setDescription('You have already joined this dice event!')
        ],
        flags: 64
      });
    }

    if (diceGame.players.length >= diceGame.playerLimit) {
      return interaction.reply({
        embeds: [
          new EmbedBuilder()
            .setColor('Red')
            .setTitle('❌ Lobby Full')
            .setDescription(`This lobby is full! (\`${diceGame.playerLimit}/${diceGame.playerLimit}\` players)`)
        ],
        flags: 64
      });
    }

    diceGame.players.push(interaction.user.id);

    // ✅ Update lobby UI safely
    try {
      if (diceGame.lobbyMessage) {
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

  // ===== BUTTON HANDLER =====
  async handleInteraction(interaction) {
    if (!interaction.isButton()) return false;
    if (interaction.customId !== 'joindice') return false;

    if (!diceGame.lobby) {
      return interaction.reply({
        embeds: [
          new EmbedBuilder()
            .setColor('Red')
            .setDescription('❌ Lobby is no longer open.')
        ],
        flags: 64
      });
    }

    if (diceGame.players.includes(interaction.user.id)) {
      return interaction.reply({
        embeds: [
          new EmbedBuilder()
            .setColor('Yellow')
            .setDescription('⚠️ You already joined!')
        ],
        flags: 64
      });
    }

    if (diceGame.players.length >= diceGame.playerLimit) {
      return interaction.reply({
        embeds: [
          new EmbedBuilder()
            .setColor('Red')
            .setDescription('❌ Lobby is full!')
        ],
        flags: 64
      });
    }

    diceGame.players.push(interaction.user.id);

    // ✅ Update lobby UI safely
    try {
      if (diceGame.lobbyMessage) {
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
