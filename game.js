const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const fs = require('fs');
const { getConfig } = require('./configLoader');

const dataFile = './data.json';

function loadData() {
  if (!fs.existsSync(dataFile)) return {};
  return JSON.parse(fs.readFileSync(dataFile));
}

function saveData(data) {
  fs.writeFileSync(dataFile, JSON.stringify(data, null, 2));
}

// ===== WORDS =====
let words = new Set();
function loadWords() {
  words = new Set(
    fs.readFileSync('./words.txt', 'utf-8')
      .split('\n')
      .map(w => w.trim())
      .filter(Boolean)
  );
}
loadWords();

// ===== COOLDOWN =====
const cooldowns = new Map();
function checkCooldown(userId) {
  const now = Date.now();
  const cd = cooldowns.get(userId);
  if (cd && now < cd) return Math.ceil((cd - cd) / 1000);
  cooldowns.set(userId, now + 2000);
  return 0;
}

// ===== GAME =====
const game = {
  active: false,
  starting: false,
  players: [],
  currentPlayerIndex: 0,
  lastLetter: "",
  usedWords: [],
  lobbyMessage: null,
  lobbyInterval: null,
  timer: null,
  timeLeft: 60,
  stats: {},
  minLength: 3,
  turnTime: 50000,
  turn: 1,
  lastAnnouncedLength: 0
};

// ===== DISABLED BUTTON =====
function getDisabledRow() {
  return new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId("join")
      .setLabel("Game Closed")
      .setStyle(ButtonStyle.Secondary)
      .setDisabled(true)
  );
}

// ===== LOBBY UPDATE =====
async function updateLobby(channel) {
  if (!game.lobbyMessage) return;
  const config = getConfig(channel.guild.id);

  await game.lobbyMessage.edit({
    embeds: [
      new EmbedBuilder()
        .setTitle("🎮 Word Chain Lobby")
        .setDescription(
          `Players (${game.players.length}/${config.maxplayers})\n` +
          (game.players.map(p => `• <@${p}>`).join("\n") || "None") +
          `\n\n⏳ ${game.timeLeft}s`
        )
        .setColor("Blue")
    ]
  });
}

// ===== DIFFICULTY =====
function updateDifficulty(channel) {
  const count = game.usedWords.length;
  const playerCount = game.players.length;

  let wordsPerLevel;

  if (playerCount <= 4) wordsPerLevel = 4;
  else if (playerCount <= 7) wordsPerLevel = 5;
  else wordsPerLevel = 6;

  const baseLength = 3;
  const level = Math.floor(count / wordsPerLevel);
  const newLength = baseLength + level;

  if (newLength > 15) return;

  let newTime;

  if (newLength === 3) newTime = 45000;
  else if (newLength === 4) newTime = 30000;
  else if (newLength === 5) newTime = 35000;
  else if (newLength === 6) newTime = 30000;
  else if (newLength === 7) newTime = 25000;
  else if (newLength === 8) newTime = 25000;
  else if (newLength >= 9 && newLength <= 11) newTime = 20000;
  else if (newLength >= 12 && newLength <= 14) newTime = 15000;
  else newTime = 10000;

  game.minLength = newLength;
  game.turnTime = newTime;

  if (game.lastAnnouncedLength !== newLength) {

    if (newLength > 3) {
      channel.send(`📈 Word length increased to **${newLength}** letters!`);
    }

    if (newLength === 7) channel.send("🔥 EXTREME MODE!");
    else if (newLength === 9) channel.send("💀 NIGHTMARE MODE!");
    else if (newLength === 10) channel.send("☠️ IMPOSSIBLE MODE!");
    else if (newLength === 12) channel.send("👑 GOD MODE!");

    game.lastAnnouncedLength = newLength;
  }
}

// ===== START GAME =====
async function startGame(channel) {
  if (game.active) return;

  game.active = true;
  clearInterval(game.lobbyInterval);

  game.usedWords = [];
  game.currentPlayerIndex = 0;
  game.turn = 1;
  game.minLength = 3;
  game.turnTime = 45000;
  game.lastAnnouncedLength = 0;

  const letters = "abcdefghijklmnopqrstuvwxyz";
  game.lastLetter = letters[Math.floor(Math.random() * letters.length)];

  game.players.forEach(p => {
    game.stats[p] = { points: 0, longestWord: "" };
  });

  nextTurn(channel);
}

// ===== TURN =====
async function nextTurn(channel) {
  if (!game.active) return;

  clearTimeout(game.timer);

  game.currentPlayerIndex %= game.players.length;
  updateDifficulty(channel);

  const player = game.players[game.currentPlayerIndex];

  game.timer = setTimeout(() => {
    if (!game.active) return; // 🔥 FIX
    eliminate(channel, player);
  }, game.turnTime);
}

// ===== ELIMINATE =====
function eliminate(channel, player) {
  if (!game.active) return; // 🔥 FIX

  clearTimeout(game.timer);

  const config = getConfig(channel.guild.id);
  const msg = config.eliminationMessage.replace("{player}", `<@${player}>`);

  channel.send(msg);

  game.players = game.players.filter(p => p !== player);

  if (game.players.length <= 1) {
    return endGame(channel);
  }

  nextTurn(channel);
}

// ===== END GAME =====
function endGame(channel) {
  clearTimeout(game.timer); // 🔥 FIX
  game.timer = null;

  const config = getConfig(channel.guild.id);

  const winner = game.players[0];

  channel.send({
    embeds: [
      new EmbedBuilder()
        .setTitle("🏆 Game Over")
        .setColor("Gold")
        .setDescription(`Winner: <@${winner}>`)
    ]
  });

  game.active = false;
}

// ===== LEAVE =====
function leaveGame(userId, channel) {
  if (!game.players.includes(userId)) return;

  game.players = game.players.filter(p => p !== userId);

  if (game.players.length <= 1 && game.active) {
    endGame(channel);
  }
}

// ===== EXPORT =====
game.startLobby = startLobby;
game.startGame = startGame;
game.handleMessage = handleMessage; // 🔥 IMPORTANT
game.handleButton = handleButton;
game.leaveGame = leaveGame;
game.reloadWords = loadWords;

module.exports = game;
