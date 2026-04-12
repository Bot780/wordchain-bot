const { SlashCommandBuilder, PermissionsBitField, EmbedBuilder } = require('discord.js');
const { diceGame, startGame } = require('../diceGame');
const { getConfig } = require('../configLoader');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('startdice')
    .setDescription('Start dice game')
    .addStringOption(opt =>
      opt.setName('mode')
        .setDescription('Game mode')
        .setRequired(true)
        .addChoices(
          { name: 'Easy', value: 'easy' },
          { name: 'Hard', value: 'hard' },
          { name: 'Random', value: 'random' }
        )
    )
    .addIntegerOption(opt =>
      opt.setName('number')
        .setDescription('Target number (1-100)')
        .setRequired(false)
    ),

  async execute(interaction) {
    const config = getConfig(interaction.guild.id);

    const isAdmin = interaction.member.permissions.has(
      PermissionsBitField.Flags.Administrator
    );

    const isManager = config.managerRoles?.some(roleId =>
      interaction.member.roles.cache.has(roleId)
    );

    if (!isAdmin && !isManager) {
      return interaction.reply({
        content: "❌ Admin or Manager only",
        flags: 64
      });
    }

    if (diceGame.active) {
      return interaction.reply({
        content: "❌ Dice game already running",
        flags: 64
      });
    }

    const mode = interaction.options.getString('mode');
    const customNumber = interaction.options.getInteger('number');

    // 🎯 validate number
    if (customNumber !== null) {
      if (customNumber < 1 || customNumber > 100) {
        return interaction.reply({
          content: "❌ Number must be between 1 and 100",
          flags: 64
        });
      }
    }

    // 🔥 start game
    startGame(mode);

    if (customNumber !== null) {
      diceGame.target = customNumber;
    }

    // 🎨 MODE COLOR
    let color = "Blue";
    if (mode === "easy") color = "Green";
    if (mode === "hard") color = "Red";
    if (mode === "random") color = "Purple";

    // 🧾 EMBED
    const embed = new EmbedBuilder()
      .setTitle("🎲 Dice Game Started!")
      .setColor(color)
      .addFields(
        {
          name: "🎯 Target Number",
          value: customNumber !== null ? `**${customNumber}**` : "???",
          inline: true
        },
        {
          name: "🎮 Mode",
          value: `**${mode.toUpperCase()}**`,
          inline: true
        },
        {
          name: "📌 Instructions",
          value: "Use `/roll` to try your luck!",
          inline: false
        }
      )
      .setFooter({ text: "First to hit the number wins 🏆" });

    return interaction.reply({
      embeds: [embed]
    });
  }
};
