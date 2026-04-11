const fs = require('fs');

const GLOBAL_CONFIG_PATH = './config.global.json';
const SERVER_CONFIG_DIR = './configs';

// ===== DEFAULT CONFIG =====
const DEFAULT_CONFIG = {
  lobbytime: 60,
  maxplayers: 10,
  minplayers: 2,
  stages: [
    { minWords: 0, maxWords: 4, minLength: 3, turnTime: 50 },
    { minWords: 5, maxWords: 9, minLength: 4, turnTime: 40 },
    { minWords: 10, maxWords: 14, minLength: 5, turnTime: 30 },
    { minWords: 15, maxWords: -1, minLength: 6, turnTime: 20 }
  ],
  messages: {
    stage2: '⚠️ Difficulty increased!',
    stage3: '🔥 Hard mode!',
    stage4: '💀 Insane mode!'
  },
  eliminationMessage: '💀 {player} eliminated (timeout)',
  winnerMessage: '👑 Winner: {player}',
  allowSamePlayerRepeat: false,
  caseSensitive: false
};

// ===== INIT =====
if (!fs.existsSync(SERVER_CONFIG_DIR)) fs.mkdirSync(SERVER_CONFIG_DIR);

// ===== GLOBAL =====
function getGlobalConfig() {
  if (!fs.existsSync(GLOBAL_CONFIG_PATH)) {
    fs.writeFileSync(GLOBAL_CONFIG_PATH, JSON.stringify(DEFAULT_CONFIG, null, 2));
  }
  return JSON.parse(fs.readFileSync(GLOBAL_CONFIG_PATH, 'utf-8'));
}

function saveGlobalConfig(config) {
  fs.writeFileSync(GLOBAL_CONFIG_PATH, JSON.stringify(config, null, 2));
}

// ===== SERVER =====
function getServerConfig(guildId) {
  const path = `${SERVER_CONFIG_DIR}/${guildId}.json`;
  if (!fs.existsSync(path)) return null;
  return JSON.parse(fs.readFileSync(path, 'utf-8'));
}

function saveServerConfig(guildId, config) {
  const path = `${SERVER_CONFIG_DIR}/${guildId}.json`;
  fs.writeFileSync(path, JSON.stringify(config, null, 2));
}

function resetServerConfig(guildId) {
  const path = `${SERVER_CONFIG_DIR}/${guildId}.json`;
  if (fs.existsSync(path)) fs.unlinkSync(path);
}

// ===== MERGE =====
function getConfig(guildId) {
  const global = getGlobalConfig();
  const server = getServerConfig(guildId);

  if (!server) return global;

  return {
    ...global,
    ...server,
    stages: server.stages || global.stages,
    messages: { ...global.messages, ...(server.messages || {}) }
  };
}

module.exports = {
  DEFAULT_CONFIG,
  getGlobalConfig,
  saveGlobalConfig,
  getServerConfig,
  saveServerConfig,
  resetServerConfig,
  getConfig
};
