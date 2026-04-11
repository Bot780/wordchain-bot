const {
  SlashCommandBuilder,
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  StringSelectMenuBuilder,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle
} = require('discord.js');

const {
  getGlobalConfig,
  saveGlobalConfig,
  getServerConfig,
  saveServerConfig,
  resetServerConfig,
  getConfig
} = require('../configLoader');

const OWNER_ID = '1382280682319122442';

// ===== HELPERS =====
const isOwner = id => id === OWNER_ID;

// ===== MAIN EMBED =====
function buildEmbed(scope, config) {
  return new EmbedBuilder()
    .setTitle(`⚙️ Config (${scope})`)
    .setColor(scope === 'global' ? 'Gold' : 'Blurple')
    .setDescription(
      `⏱ Lobby: ${config.lobbytime}s\n` +
      `👥 Max: ${config.maxplayers}\n` +
      `👤 Min: ${config.minplayers}`
    );
}

// ===== PREVIEW =====
function previewEmbed(scope, config, key, value) {
  const c = { ...config };
  c[key] = value;

  return new EmbedBuilder()
    .setTitle(`👀 Preview (${scope})`)
    .setColor('Yellow')
    .setDescription(
      `⏱ Lobby: ${c.lobbytime}s\n` +
      `👥 Max: ${c.maxplayers}\n` +
      `👤 Min: ${c.minplayers}`
    );
}

// ===== UI =====
function mainRow(scope) {
  return new ActionRowBuilder().addComponents(
    new ButtonBuilder().setCustomId(`edit_${scope}_lobbytime`).setLabel('Lobby Time').setStyle(ButtonStyle.Primary),
    new ButtonBuilder().setCustomId(`edit_${scope}_maxplayers`).setLabel('Max Players').setStyle(ButtonStyle.Primary),
    new ButtonBuilder().setCustomId(`edit_${scope}_minplayers`).setLabel('Min Players').setStyle(ButtonStyle.Primary)
  );
}

function scopeRow() {
  return new ActionRowBuilder().addComponents(
    new ButtonBuilder().setCustomId('scope_global').setLabel('🌍 Global').setStyle(ButtonStyle.Secondary),
    new ButtonBuilder().setCustomId('scope_server').setLabel('🏠 Server').setStyle(ButtonStyle.Secondary)
  );
}

// ===== COMMAND =====
module.exports = {
  data: new SlashCommandBuilder()
    .setName('config')
    .setDescription('Open config panel'),

  async execute(i) {
    const scope = isOwner(i.user.id) ? 'global' : 'server';
    const config = scope === 'global' ? getGlobalConfig() : getConfig(i.guild.id);

    await i.reply({
      embeds: [buildEmbed(scope, config)],
      components: [scopeRow(), mainRow(scope)],
      flags: 64
    });
  },

  async handleInteraction(i) {
    if (!i.customId) return false;

    // ===== SWITCH SCOPE =====
    if (i.customId === 'scope_global') {
      if (!isOwner(i.user.id)) return i.reply({ content: "Owner only", flags: 64 });
      const config = getGlobalConfig();
      return i.update({ embeds: [buildEmbed('global', config)], components: [scopeRow(), mainRow('global')] });
    }

    if (i.customId === 'scope_server') {
      const config = getConfig(i.guild.id);
      return i.update({ embeds: [buildEmbed('server', config)], components: [scopeRow(), mainRow('server')] });
    }

    // ===== EDIT =====
    if (i.customId.startsWith('edit_')) {
      const [_, scope, field] = i.customId.split('_');

      const modal = new ModalBuilder()
        .setCustomId(`modal_${scope}_${field}`)
        .setTitle(`Edit ${field}`);

      const input = new TextInputBuilder()
        .setCustomId('value')
        .setLabel('Enter value')
        .setStyle(TextInputStyle.Short);

      modal.addComponents(new ActionRowBuilder().addComponents(input));

      return i.showModal(modal);
    }

    // ===== MODAL =====
    if (i.isModalSubmit()) {
      const [_, scope, field] = i.customId.split('_');

      let config =
        scope === 'global'
          ? getGlobalConfig()
          : (getServerConfig(i.guild.id) || getGlobalConfig());

      const value = parseInt(i.fields.getTextInputValue('value'));

      if (isNaN(value)) return i.reply({ content: "Invalid number", flags: 64 });

      // preview
      const preview = previewEmbed(scope, config, field, value);

      // save
      config[field] = value;

      if (scope === 'global') saveGlobalConfig(config);
      else saveServerConfig(i.guild.id, config);

      const updated = scope === 'global'
        ? getGlobalConfig()
        : getConfig(i.guild.id);

      return i.update({
        embeds: [preview, buildEmbed(scope, updated)],
        components: [scopeRow(), mainRow(scope)]
      });
    }

    return false;
  }
};
