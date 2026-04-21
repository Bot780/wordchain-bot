module.exports = function createGame() {

const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const fs = require('fs');
const { getConfig } = require('./configLoader');
const { recordWord, recordGameEnd } = require('./stats');

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
  if (cd && now < cd) return Math.ceil((cd - now) / 1000);
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

// ===== START LOBBY =====
async function startLobby(channel, interaction) {
  const config = getConfig(channel.guild.id);

  game.timeLeft = config.lobbytime;
  game.players = [];
  game.active = false;
  game.starting = false;

  const row = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId("join")
      .setLabel("Join Game")
      .setStyle(ButtonStyle.Success)
  );

  await interaction.deferReply();
  await interaction.editReply({
    embeds: [
      new EmbedBuilder()
        .setTitle("🎮 Word Chain Lobby")
        .setDescription(`Players (0/${config.maxplayers})\nNone\n\n⏳ ${game.timeLeft}s`)
        .setColor("Blue")
    ],
    components: [row]
  });

  game.lobbyMessage = await interaction.fetchReply();

  game.lobbyInterval = setInterval(async () => {
    if (game.active || game.starting) return;

    game.timeLeft--;

    if (game.timeLeft === 30) channel.send("⚠️ 30 seconds left!");
    if (game.timeLeft === 15) channel.send("⚠️ 15 seconds left!");

    await game.updateLobbyUI(channel);

    if (game.timeLeft <= 0) {
      clearInterval(game.lobbyInterval);

      if (game.players.length < config.minplayers) {
        await game.lobbyMessage.edit({
          embeds: [
            new EmbedBuilder()
              .setTitle("🎮 Word Chain Lobby")
              .setDescription("❌ Not enough players.\nLobby closed.")
              .setColor("Red")
          ],
          components: [getDisabledRow()]
        });

        channel.send({
          embeds: [
            new EmbedBuilder()
              .setColor("Red")
              .setTitle("❌ Game Terminated")
              .setDescription("Not enough players to start the game.")
          ]
        });

        return;
      }

      startGame(channel);
    }
  }, 1000);
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

  game.stats = {}; // 🔥 IMPORTANT RESET

game.players.forEach(p => {
  game.stats[p] = { points: 0, longestWord: "" };
});

  if (game.lobbyMessage) {
    await game.lobbyMessage.edit({
      embeds: [
        new EmbedBuilder()
          .setTitle("🎮 Word Chain Lobby")
          .setDescription("🚀 Game Started!\nLobby closed.")
          .setColor("Green")
      ],
      components: [getDisabledRow()]
    });
  }

  const order = game.players.map((p, i) => `**${i + 1}.** <@${p}>`).join("\n");

  await channel.send({
    embeds: [
      new EmbedBuilder()
        .setTitle("📋 Turn Order")
        .setDescription(order)
        .setColor("Blue")
    ]
  });

  await channel.send({
    embeds: [
      new EmbedBuilder()
        .setTitle("🚀 Game Started")
        .setDescription(`🔤 Starting Letter: **${game.lastLetter.toUpperCase()}**`)
        .setColor("Green")
    ]
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
  const nextIndex = (game.currentPlayerIndex + 1) % game.players.length;
  const nextPlayer = game.players[nextIndex];

  await channel.send({
    content: `🔔 <@${player}>`,
    allowedMentions: { users: [player] },
    embeds: [
      new EmbedBuilder()
        .setTitle(`🎮 Turn #${game.turn}`)
        .setDescription(
          `🎯 Turn: <@${player}>\n` +
          `⏭️ Next: <@${nextPlayer}>\n\n` +
          `🔤 Letter: **${game.lastLetter.toUpperCase()}**\n` +
          `📏 Min: **${game.minLength}**\n` +
          `⏳ Time: **${game.turnTime / 1000}s**`
        )
        .setColor("Yellow")
    ]
  });

  game.timer = setTimeout(() => {
    if (!game.active) return;
    eliminate(channel, player);
  }, game.turnTime);
}

// ===== ELIMINATE =====
function eliminate(channel, player) {
  if (!game.active) return;

  clearTimeout(game.timer);

  const config = getConfig(channel.guild.id);
  const msg = config.eliminationMessage.replace("{player}", `<@${player}>`);

  channel.send(msg);

  // ===== STATS: record elimination =====
  recordGameEnd(player, channel.guild.id, false, true);

  game.players = game.players.filter(p => p !== player);

  if (game.players.length <= 1) {
    return endGame(channel);
  }

  nextTurn(channel);
}

// ===== END GAME =====
function endGame(channel) {
  clearTimeout(game.timer);
  game.timer = null;

  const config = getConfig(channel.guild.id);
  const data = loadData();
  const guildId = channel.guild.id;

  if (!data[guildId]) data[guildId] = {};

  const winner = game.players[0];

  if (!data[guildId][winner]) {
    data[guildId][winner] = { points: 0, wins: 0 };
  }

  data[guildId][winner].wins += 1;

  for (let p in game.stats) {
    if (!data[guildId][p]) {
      data[guildId][p] = { points: 0, wins: 0 };
    }
    data[guildId][p].points += game.stats[p].points;
  }

  saveData(data);

  // ===== STATS: record winner =====
  recordGameEnd(winner, guildId, true, false);

  let longest = { word: "", user: null };

for (let p in game.stats) {
  const lw = game.stats[p]?.longestWord || "";
  if (lw.length > longest.word.length) {
    longest.word = lw;
    longest.user = p;
  }
}

  const winnerText = config.winnerMessage.replace("{player}", `<@${winner}>`);

  channel.send({
    embeds: [
      new EmbedBuilder()
        .setTitle("🏆 Game Over")
        .setColor("Gold")
        .setDescription(
          `${winnerText}\n\n` +
          `🧠 Longest Word:\n<@${longest.user}> → **${longest.word || "None"}**\n\n` +
          `🔢 Total Words Played: **${game.usedWords.length}**`
        )
    ]
  });

  game.active = false;
game.stats = {};
game.usedWords = [];
game.lastLetter = "";
}

// ===== MESSAGE =====
async function handleMessage(msg) {
  if (!game.active) return;

  const player = game.players[game.currentPlayerIndex];
  if (msg.author.id !== player) return;

  const cd = checkCooldown(msg.author.id);
  if (cd > 0) return msg.reply(`⏳ Wait ${cd}s`);

  const config = getConfig(msg.guild.id);

  let word = msg.content.trim();
  if (!config.caseSensitive) word = word.toLowerCase();

  if (word.length < game.minLength)
    return msg.reply(`❌ Min ${game.minLength} letters`);

  if (!word.startsWith(game.lastLetter))
    return msg.reply(`❌ Must start with **${game.lastLetter.toUpperCase()}**`);

  if (game.usedWords.includes(word))
    return msg.reply("❌ Used word");

  if (!words.has(word))
    return msg.reply("❌ Not a valid word");

  clearTimeout(game.timer);

  const formatted = word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();

  msg.channel.send(`✅ **${formatted}** accepted! Next: **${word.slice(-1).toUpperCase()}**`);

  game.usedWords.push(word);
  game.lastLetter = word.slice(-1);

  game.stats[player].points++;
  if (word.length > game.stats[player].longestWord.length)
    game.stats[player].longestWord = word;

  // ===== STATS: record word =====
  recordWord(player, msg.guild.id, word);

  game.turn++;
  game.currentPlayerIndex++;

  nextTurn(msg.channel);
}

// ===== BUTTON =====
async function handleButton(i) {
  if (i.customId !== "join") return;

  const config = getConfig(i.guild.id);

  if (!game.lobbyMessage || game.active)
    return i.reply({ content: "❌ Lobby closed!", flags: 64 });

  if (game.players.includes(i.user.id))
    return i.reply({ content: "Already joined!", flags: 64 });

  if (game.players.length >= config.maxplayers)
    return i.reply({ content: "❌ Lobby full", flags: 64 });

  game.players.push(i.user.id);

  await i.deferUpdate();
  await updateLobby(i.channel);

  i.channel.send(`✅ <@${i.user.id}> joined`);
}

// ===== LEAVE =====
function leaveGame(userId, channel) {
  if (!game.players.includes(userId)) return;

  game.players = game.players.filter(p => p !== userId);

  updateLobby(channel);
  channel.send(`👋 <@${userId}> left`);

  if (game.players.length <= 1 && game.active) {
    endGame(channel);
  }
}

// ===== SHARED LOBBY UPDATE =====
game.updateLobbyUI = async function(channel) {
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
};

// ===== EXPORT =====
game.startLobby = startLobby;
game.startGame = startGame;
game.handleMessage = handleMessage;
game.handleButton = handleButton;
game.leaveGame = leaveGame;
game.reloadWords = loadWords;

return game;
};
