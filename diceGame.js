const cooldowns = new Map();

const diceGame = {
  active: false,
  target: null,
  mode: null,
  chance: 0,
  rolls: {},
};

// ===== START GAME =====
function startGame(mode) {
  diceGame.active = true;
  diceGame.target = Math.floor(Math.random() * 100) + 1;
  diceGame.mode = mode;
  diceGame.rolls = {};

  if (mode === "easy") diceGame.chance = 0.05;
  else if (mode === "hard") diceGame.chance = 0.01;
  else diceGame.chance = 0;

  return diceGame.target;
}

// ===== ROLL =====
function roll(userId) {
  const now = Date.now();
  const cd = cooldowns.get(userId);

  if (cd && now < cd) {
    return { error: Math.ceil((cd - now) / 1000) };
  }

  cooldowns.set(userId, now + 3000);

  let value;

  if (Math.random() < diceGame.chance) {
    value = diceGame.target;
  } else {
    value = Math.floor(Math.random() * 100) + 1;
  }

  diceGame.rolls[userId] = value;

  const win = value === diceGame.target;

  return { value, win };
}

// ===== STOP GAME =====
function stopGame() {
  if (!diceGame.active) return null;

  let closestUser = null;
  let closestDiff = Infinity;

  for (const [id, val] of Object.entries(diceGame.rolls)) {
    const diff = Math.abs(val - diceGame.target);

    if (diff < closestDiff) {
      closestDiff = diff;
      closestUser = id;
    }
  }

  const result = {
    target: diceGame.target,
    closestUser,
    closestDiff,
    rolls: diceGame.rolls
  };

  diceGame.active = false;

  return result;
}

module.exports = {
  diceGame,
  startGame,
  roll,
  stopGame
};
