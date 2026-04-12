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

// ===== RECORD WORD =====
function recordWord(userId, guildId, word) {
  const data = loadData();

  if (!data[guildId]) data[guildId] = {};
  if (!data[guildId][userId]) data[guildId][userId] = getDefaultPlayer();

  const p = data[guildId][userId];

  p.totalWords++;
  p.totalLetters += word.length;
  p.lastPlayed = new Date().toISOString();

  // Longest word
  if (word.length > (p.longestWord || '').length) {
    p.longestWord = word;
  }

  // Favourite starting letter
  const letter = word[0].toLowerCase();
  if (!p.favouriteStartLetter) p.favouriteStartLetter = {};
  p.favouriteStartLetter[letter] = (p.favouriteStartLetter[letter] || 0) + 1;

  // Words used
  if (!p.wordsUsed) p.wordsUsed = {};
  p.wordsUsed[word] = (p.wordsUsed[word] || 0) + 1;

  // Streak
  p.currentStreak = (p.currentStreak || 0) + 1;
  if (p.currentStreak > (p.bestStreak || 0)) {
    p.bestStreak = p.currentStreak;
  }

  data[guildId][userId] = p;
  saveData(data);
}

// ===== RECORD GAME END =====
function recordGameEnd(userId, guildId, won, eliminated) {
  const data = loadData();

  if (!data[guildId]) data[guildId] = {};
  if (!data[guildId][userId]) data[guildId][userId] = getDefaultPlayer();

  const p = data[guildId][userId];

  p.gamesPlayed = (p.gamesPlayed || 0) + 1;
  p.lastPlayed = new Date().toISOString();

  if (won) {
    p.gamesWon = (p.gamesWon || 0) + 1;
  }

  if (eliminated) {
    p.eliminations = (p.eliminations || 0) + 1;
    p.currentStreak = 0;
  }

  data[guildId][userId] = p;
  saveData(data);
}

// ===== GET RANK =====
function getRank(userId, guildId) {
  const data = loadData();

  if (!data[guildId]) return 0;

  const sorted = Object.entries(data[guildId]).sort((a, b) => {
    return (b[1].gamesWon || 0) - (a[1].gamesWon || 0);
  });

  const index = sorted.findIndex(([id]) => id === userId);

  return index === -1 ? 0 : index + 1;
}

// ===== GET LEADERBOARD =====
function getLeaderboard(guildId, limit = 50) {
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
  recordWord,
  recordGameEnd,
  getRank,
  getLeaderboard
};

