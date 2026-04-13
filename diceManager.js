const fs = require('fs');
const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');

// ===== OWNER =====
const OWNER_ID = '1382280682319122442';

// ===== MANAGER ROLES =====
const MANAGER_PATH = './managerRoles.json';

function loadManagers() {
  if (!fs.existsSync(MANAGER_PATH)) fs.writeFileSync(MANAGER_PATH, JSON.stringify({}, null, 2));
  return JSON.parse(fs.readFileSync(MANAGER_PATH, 'utf-8'));
}

function saveManagers(data) {
  fs.writeFileSync(MANAGER_PATH, JSON.stringify(data, null, 2));
}

function getManagerRoles(guildId) {
  const data = loadManagers();
  return data[guildId] || [];
}

function addManagerRole(guildId, roleId) {
  const data = loadManagers();
  if (!data[guildId]) data[guildId] = [];
  if (!data[guildId].includes(roleId)) data[guildId].push(roleId);
  saveManagers(data);
}

function removeManagerRole(guildId, roleId) {
  const data = loadManagers();
  if (!data[guildId]) return;
  data[guildId] = data[guildId].filter(r => r !== roleId);
  saveManagers(data);
}

// ===== PREFIX =====
const PREFIX_PATH = './prefixes.json';

function loadPrefixes() {
  if (!fs.existsSync(PREFIX_PATH)) fs.writeFileSync(PREFIX_PATH, JSON.stringify({}, null, 2));
  return JSON.parse(fs.readFileSync(PREFIX_PATH, 'utf-8'));
}

function savePrefixes(data) {
  fs.writeFileSync(PREFIX_PATH, JSON.stringify(data, null, 2));
}

function getPrefix(guildId) {
  const data = loadPrefixes();
  return data[guildId] || '.';
}

function setPrefix(guildId, prefix) {
  const data = loadPrefixes();
  data[guildId] = prefix;
  savePrefixes(data);
}

// ===== PERMISSION CHECK =====
function hasPermission(interaction) {
  if (interaction.user.id === OWNER_ID) return true;
  if (interaction.memberPermissions?.has(8n)) return true; // Administrator
  const managerRoles = getManagerRoles(interaction.guildId);
  return interaction.member?.roles?.cache?.some(r => managerRoles.includes(r.id));
}

// ===== DICE GAME STATE =====
const diceGame = {
  active: false,
  lobby: false,
  players: [],
  mode: null,
  actualMode: null,
  target: null,
  minRange: 1,
  maxRange: 100,
  prize: 50,
  playerLimit: 20,
  lobbyTime: 60,
  timeLeft: 60,
  channelId: null,
  guildId: null,
  lobbyMessage: null,
  lobbyInterval: null,
  cooldowns: new Map(),
  rolls: []
};

// ===== COOLDOWN CHECK =====
function checkRollCooldown(userId) {
  const now = Date.now();
  const cd = diceGame.cooldowns.get(userId);
  if (cd && now < cd) return Math.ceil((cd - now) / 1000);
  diceGame.cooldowns.set(userId, now + 5000);
  return 0;
}

// ===== LOBBY EMBED =====
function buildLobbyEmbed() {
  return new EmbedBuilder()
    .setTitle('🎲 Dice Roll Event — Lobby')
    .setColor('Orange')
    .setDescription(`Click **Join Game** to enter!\nGame starts when timer runs out or lobby fills up.`)
    .addFields(
      { name: '👥 Players', value: diceGame.players.length > 0 ? diceGame.players.map(p => `• <@${p}>`).join('\n') : '*None yet*', inline: false },
      { name: '👥 Player Count', value: `\`${diceGame.players.length}/${diceGame.playerLimit}\``, inline: true },
      { name: '⏳ Time Left', value: `\`${diceGame.timeLeft}s\``, inline: true },
      { name: '🎯 Target', value: `**${diceGame.target}**`, inline: true },
      { name: '🎲 Range', value: `\`${diceGame.minRange}–${diceGame.maxRange}\``, inline: true },
      { name: '🏆 Prize', value: `**${diceGame.prize}**`, inline: true }
    )
    .setFooter({ text: `Min 2 players required to start` });
}

// ===== JOIN BUTTON ROW =====
function buildJoinRow(disabled = false) {
  return new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId('joindice')
      .setLabel(disabled ? 'Game Closed' : 'Join Game 🎲')
      .setStyle(disabled ? ButtonStyle.Secondary : ButtonStyle.Success)
      .setDisabled(disabled)
  );
}

// ===== RESET GAME =====
function resetDiceGame() {
  clearInterval(diceGame.lobbyInterval);
  clearTimeout(diceGame.timer);
  diceGame.active = false;
  diceGame.lobby = false;
  diceGame.players = [];
  diceGame.mode = null;
  diceGame.actualMode = null;
  diceGame.target = null;
  diceGame.minRange = 1;
  diceGame.maxRange = 100;
  diceGame.prize = 50;
  diceGame.playerLimit = 20;
  diceGame.lobbyTime = 60;
  diceGame.timeLeft = 60;
  diceGame.channelId = null;
  diceGame.guildId = null;
  diceGame.lobbyMessage = null;
  diceGame.lobbyInterval = null;
  diceGame.cooldowns = new Map();
  diceGame.rolls = [];
}

module.exports = {
  OWNER_ID,
  diceGame,
  hasPermission,
  checkRollCooldown,
  buildLobbyEmbed,
  buildJoinRow,
  resetDiceGame,
  getManagerRoles,
  addManagerRole,
  removeManagerRole,
  getPrefix,
  setPrefix,
  loadManagers
};
