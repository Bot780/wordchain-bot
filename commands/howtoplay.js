const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('howtoplay')
    .setDescription('Learn how to play Word Chain'),

  async execute(interaction, game) {
    return interaction.reply({
      embeds: [
        new EmbedBuilder()
          .setTitle('📖 How to Play Word Chain')
          .setColor('Blurple')
          .setDescription('Word Chain is a multiplayer word game where each player must say a word that starts with the last letter of the previous word. Last player standing wins!')
          .addFields(
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
              name: '🎮 How to Play',
              value: [
                '> • The game picks a **random starting letter**',
                '> • When it\'s your turn, type a word starting with that letter',
                '> • The next player must start with the **last letter** of your word',
                '> • Example: **Apple** → **Elephant** → **Tiger** → **Rabbit** ...'
              ].join('\n')
            },
            {
              name: '✅ Valid Words',
              value: [
                '> • Must start with the **correct letter**',
                '> • Must meet the **minimum length** for the current stage',
                '> • Must be a **real word** (in the word list)',
                '> • Cannot be a word **already used** this game'
              ].join('\n')
            },
            {
              name: '📊 Difficulty Stages',
              value: [
                '> The game gets harder as more words are played!',
                '> ',
                '> 🟢 **Stage 1** (0–4 words) — 3+ letters, 50s per turn',
                '> 🟡 **Stage 2** (5–9 words) — 4+ letters, 40s per turn',
                '> 🔴 **Stage 3** (10–14 words) — 5+ letters, 30s per turn',
                '> 💀 **Stage 4** (15+ words) — 6+ letters, 20s per turn'
              ].join('\n')
            },
            {
              name: '💀 Elimination',
              value: [
                '> • Run out of time → **eliminated**',
                '> • Type an invalid word → get a warning (not eliminated)',
                '> • Last player remaining → **wins the game!**'
              ].join('\n')
            },
            {
              name: '📋 Commands',
              value: [
                '> `/start` — Start a new game lobby',
                '> `/forcestart` — Force start with current players (admin)',
                '> `/leave` — Leave the current game',
                '> `/stopgame` — Force stop a running game (admin)',
                '> `/profile` — View your stats',
                '> `/leaderboard` — View global rankings',
                '> `/checkword` — Check if a word is valid'
              ].join('\n')
            },
            {
              name: '💡 Tips',
              value: [
                '> • Words must meet the **minimum letter requirement** for the current stage — short words get rejected as difficulty rises!',
                '> • Save short words early — they won\'t be valid in later stages',
                '> • Words ending in **Q, X, Z** are hard to follow — use them strategically!',
                '> • Use `/checkword` before the game to test words you plan to use',
                '> • Keep an eye on the stage announcements — the rules get stricter fast'
              ].join('\n')
            }
          )
          .setFooter({ text: 'Good luck and have fun! 🎉' })
      ]
    });
  }
};

