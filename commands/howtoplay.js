const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');

// ===== PAGES =====
const PAGES = [
  {
    title: '📖 How to Play Word Chain — Overview',
    color: 'Blurple',
    description: 'Word Chain is a multiplayer word game where each player must say a word that starts with the last letter of the previous word. Last player standing wins!',
    fields: [
      {
        name: '🚀 Starting a Game',
        value: [
          '> 1️⃣ Use `/start` to open a lobby',
          '> 2️⃣ Players click **Join Game** button to enter',
          '> 3️⃣ Lobby closes after 60s — game starts automatically',
          '> 4️⃣ Need at least **2 players** to start'
        ].join('\n')
      },
      {
        name: '🎮 How Turns Work',
        value: [
          '> • The game picks a **random starting letter**',
          '> • When it\'s your turn, type a word starting with that letter',
          '> • The next player must start with the **last letter** of your word',
          '> • Example: **Apple** → **Elephant** → **Tiger** → **Rabbit** ...'
        ].join('\n')
      }
    ]
  },
  {
    title: '✅ Valid Words',
    color: 'Green',
    description: 'Not every word is accepted! Here\'s what makes a word valid:',
    fields: [
      {
        name: '✅ A word is valid if...',
        value: [
          '> • It starts with the **correct letter**',
          '> • It meets the **minimum length** for the current stage',
          '> • It\'s a **real word** (in the word list)',
          '> • It hasn\'t been **used already** this game'
        ].join('\n')
      },
      {
        name: '❌ A word is rejected if...',
        value: [
          '> • It starts with the **wrong letter**',
          '> • It\'s **too short** for the current stage',
          '> • It\'s **not in the word list**',
          '> • It was **already played** this game',
          '> ⚠️ Invalid words give a warning — you are **not** eliminated for them'
        ].join('\n')
      }
    ]
  },
  {
    title: '📊 Difficulty Stages',
    color: 'Orange',
    description: 'The game gets harder as more words are played! Minimum word length increases and turn time decreases each stage.',
    fields: [
      {
        name: '🟢 Stage 1 — Easy',
        value: '> **0–4 words played**\n> • Minimum **3 letters** per word\n> • **50 seconds** per turn'
      },
      {
        name: '🟡 Stage 2 — Medium',
        value: '> **5–9 words played**\n> • Minimum **4 letters** per word\n> • **40 seconds** per turn\n> ⚠️ Announced in chat!'
      },
      {
        name: '🔴 Stage 3 — Hard',
        value: '> **10–14 words played**\n> • Minimum **5 letters** per word\n> • **30 seconds** per turn\n> 🔥 Announced in chat!'
      },
      {
        name: '💀 Stage 4 — Insane',
        value: '> **15+ words played**\n> • Minimum **6 letters** per word\n> • **20 seconds** per turn\n> 💀 Announced in chat!'
      }
    ]
  },
  {
    title: '💀 Elimination & Winning',
    color: 'Red',
    description: 'Players are eliminated one by one until only one remains!',
    fields: [
      {
        name: '💀 How you get eliminated',
        value: [
          '> • You **run out of time** on your turn',
          '> • You **leave** the game with `/leave`'
        ].join('\n')
      },
      {
        name: '🏆 How to win',
        value: [
          '> • Be the **last player standing**',
          '> • Outlast all other players through skill and vocab!'
        ].join('\n')
      },
      {
        name: '📈 Scoring',
        value: [
          '> • Every valid word earns you **1 point**',
          '> • Your **longest word** and **best streak** are tracked',
          '> • Stats are saved to your `/profile` permanently'
        ].join('\n')
      }
    ]
  },
  {
    title: '📋 Commands',
    color: 'Blurple',
    description: 'Here are all the commands available to players:',
    fields: [
      {
        name: '🎮 Game Commands',
        value: [
          '> `/start` — Open a new game lobby',
          '> `/forcestart` — Force start with current players *(admin)*',
          '> `/leave` — Leave the current game',
          '> `/stopgame` — Force stop a running game *(admin)*'
        ].join('\n')
      },
      {
        name: '📊 Info Commands',
        value: [
          '> `/howtoplay` — Show this guide',
          '> `/profile [@user]` — View your or someone\'s stats',
          '> `/leaderboard` — View global rankings',
          '> `/checkword <word>` — Check if a word is in the word list'
        ].join('\n')
      }
    ]
  },
  {
    title: '💡 Tips & Tricks',
    color: 'Yellow',
    description: 'Want to win more? Here are some pro tips:',
    fields: [
      {
        name: '🧠 Strategy',
        value: [
          '> • Words ending in **Q, X, Z** are hard to follow — use them to pressure opponents!',
          '> • **Save nothing** — the stage timer punishes hesitation',
          '> • Think **2 words ahead** — what will the next player be forced to start with?'
        ].join('\n')
      },
      {
        name: '⚡ Survival',
        value: [
          '> • Short words get **rejected in later stages** — practice longer words early',
          '> • Use `/checkword` before games to test words you plan to use',
          '> • When stuck, try common suffixes: **-tion, -ing, -ness, -ment**'
        ].join('\n')
      },
      {
        name: '📈 For Your Stats',
        value: [
          '> • Longer words boost your **avg word length** on your profile',
          '> • Stay alive as long as possible to build your **streak**',
          '> • Win consistently to climb the **leaderboard**'
        ].join('\n')
      }
    ]
  }
];

// ===== BUILD EMBED =====
function buildEmbed(page) {
  const data = PAGES[page];
  return new EmbedBuilder()
    .setTitle(data.title)
    .setColor(data.color)
    .setDescription(data.description)
    .addFields(data.fields)
    .setFooter({ text: `Page ${page + 1} of ${PAGES.length}` });
}

// ===== BUILD BUTTONS =====
function buildButtons(page) {
  return new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId(`htp_first`)
      .setLabel('⏮')
      .setStyle(ButtonStyle.Secondary)
      .setDisabled(page === 0),

    new ButtonBuilder()
      .setCustomId(`htp_prev_${page}`)
      .setLabel('◀ Prev')
      .setStyle(ButtonStyle.Primary)
      .setDisabled(page === 0),

    new ButtonBuilder()
      .setCustomId(`htp_home`)
      .setLabel('🏠')
      .setStyle(ButtonStyle.Success),

    new ButtonBuilder()
      .setCustomId(`htp_next_${page}`)
      .setLabel('Next ▶')
      .setStyle(ButtonStyle.Primary)
      .setDisabled(page === PAGES.length - 1),

    new ButtonBuilder()
      .setCustomId(`htp_last`)
      .setLabel('⏭')
      .setStyle(ButtonStyle.Secondary)
      .setDisabled(page === PAGES.length - 1)
  );
}

// ===== COMMAND =====
module.exports = {
  data: new SlashCommandBuilder()
    .setName('howtoplay')
    .setDescription('Learn how to play Word Chain'),

  async execute(interaction, game) {
    await interaction.reply({
      embeds: [buildEmbed(0)],
      components: [buildButtons(0)]
    });
  },

  // ===== BUTTON HANDLER =====
async handleInteraction(interaction) {
  if (!interaction.isButton()) return false;

  const id = interaction.customId;

  let page;

  if (id === 'htp_first') page = 0;
  else if (id === 'htp_home') page = 0;
  else if (id === 'htp_last') page = PAGES.length - 1;
  else if (id.startsWith('htp_prev_')) page = parseInt(id.split('_')[2]) - 1;
  else if (id.startsWith('htp_next_')) page = parseInt(id.split('_')[2]) + 1;
  else return false;

  if (page < 0) page = 0;
  if (page >= PAGES.length) page = PAGES.length - 1;

  await interaction.update({
    embeds: [buildEmbed(page)],
    components: [buildButtons(page)]
  });

  return true;
}
};
