const fs = require('fs');

const dataFile = './data.json';

function loadData() {
  if (!fs.existsSync(dataFile)) return {};
  return JSON.parse(fs.readFileSync(dataFile));
}

function saveData(data) {
  fs.writeFileSync(dataFile, JSON.stringify(data, null, 2));
}

// ===== DEFAULT PLAYER =====
function getDefaultPlayer() {
  return {
    gamesPlayed: 0,
    gamesWon: 0,
    totalWords: 0,
    totalLetters: 0,
    longestWord: "",
    bestStreak: 0,
    currentStreak: 0,
    eliminations: 0,
    favouriteStartLetter: {},
    wordsUsed: {},
    lastPlayed: null
  };
}

// ===== GET PLAYER =====
function getPlayer(userId, guildId) {
  const data = loadData();

  if (!data[guildId]) data[guildId] = {};

  if (!data[guildId][userId]) {
    data[guildId][userId] = getDefaultPlayer();
    saveData(data);
  }

  return data[guildId][userId];
}

// ===== UPDATE PLAYER =====
function updatePlayer(userId, guildId, newData) {
  const data = loadData();

  if (!data[guildId]) data[guildId] = {};
  if (!data[guildId][userId]) {
    data[guildId][userId] = getDefaultPlayer();
  }

  data[guildId][userId] = {
    ...data[guildId][userId],
    ...newData
  };

  saveData(data);
}

// ===== GET RANK =====
function getRank(userId, guildId) {
  const data = loadData();

  if (!data[guildId]) return 0;

  const users = Object.entries(data[guildId]);

  const sorted = users.sort((a, b) => {
    return (b[1].gamesWon || 0) - (a[1].gamesWon || 0);
  });

  const index = sorted.findIndex(([id]) => id === userId);

  return index === -1 ? 0 : index + 1;
}

// ===== GET LEADERBOARD =====
function getLeaderboard(limit = 50, guildId) {
  const data = loadData();

  if (!data[guildId]) return [];

  const users = Object.entries(data[guildId]).map(([userId, stats]) => ({
    userId,
    ...getDefaultPlayer(),
    ...stats
  }));

  return users.slice(0, limit);
}

module.exports = {
  getPlayer,
  updatePlayer,
  getRank,
  getLeaderboard
};
