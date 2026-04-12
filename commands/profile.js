const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const { getPlayer, getRank } = require('../stats');

// ===== HELPERS =====
function getFavouriteLetter(favouriteStartLetter) {
  if (!favouriteStartLetter || Object.keys(favouriteStartLetter).length === 0) return '—';
  return Object.entries(favouriteStartLetter)
    .sort((a, b) => b[1] - a[1])[0][0]
    .toUpperCase();
}

function getWinRate(gamesPlayed, gamesWon) {
  if (gamesPlayed === 0) return '0%';
  return `${Math.round((gamesWon / gamesPlayed) * 100)}%`;
}

function getAvgWordLength(totalLetters, totalWords) {
  if (totalWords === 0) return '—';
  return (totalLetters / totalWords).toFixed(1);
}

function getTimeSince(isoDate) {
  if (!isoDate) return 'Never';
  const diff = Date.now() - new Date(isoDate).getTime();
  const mins = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins}m ago`;
  if (hours < 24) return `${hours}h ago`;
  return `${days}d ago`;
}

function getRankMedal(rank) {
  if (rank === 1) return '🥇';
  if (rank === 2) return '🥈';
  if (rank === 3) return '🥉';
  if (rank <= 10) return '🏅';
  return `#${rank}`;
}

function getTitle(stats) {
  const { gamesWon, totalWords, longestWord, bestStreak } = stats;
  if (gamesWon >= 50) return '👑 Word Chain Legend';
  if (gamesWon >= 20) return '🔥 Word Chain Master';
  if (gamesWon >= 10) return '⚡ Word Chain Pro';
  if (gamesWon >= 5)  return '🎮 Word Chain Veteran';
  if (totalWords >= 50) return '📚 Word Collector';
  if (longestWord.length >= 10) return '🧠 Vocabulary Nerd';
  if (bestStreak >= 10) return '🔗 Chain Keeper';
  if (gamesWon >= 1)  return '🌱 Rising Player';
  return '🐣 Newcomer';
}

function buildWinRateBar(gamesPlayed, gamesWon) {
  if (gamesPlayed === 0) return '░░░░░░░░░░ 0%';
  const pct = gamesWon / gamesPlayed;
  const filled = Math.round(pct * 10);
  const bar = '█'.repeat(filled) + '░'.repeat(10 - filled);
  return `${bar} ${Math.round(pct * 100)}%`;
}

// ===== OVERVIEW EMBED =====
function buildOverviewEmbed(user, stats, rank) {
  const title = getTitle(stats);
  const medal = getRankMedal(rank);

  return new EmbedBuilder()
    .setTitle(`${title}`)
    .setAuthor({ name: `${user.displayName ?? user.username}'s Profile`, iconURL: user.displayAvatarURL() })
    .setColor('Blurple')
    .setThumbnail(user.displayAvatarURL({ size: 256 }))
    .addFields(
      {
        name: '📊 Overview',
        value: [
          `> 🏆 **Wins:** \`${stats.gamesWon}\``,
          `> 🎮 **Games Played:** \`${stats.gamesPlayed}\``,
          `> 📈 **Win Rate:** \`${getWinRate(stats.gamesPlayed, stats.gamesWon)}\``,
          `> ${medal} **Global Rank:** \`${rank > 0 ? (rank <= 10 ? `Top ${rank}` : `#${rank}`) : 'Unranked'}\``
        ].join('\n'),
        inline: false
      },
      {
        name: '🔡 Word Stats',
        value: [
          `> 📝 **Total Words:** \`${stats.totalWords}\``,
          `> 📏 **Longest Word:** \`${stats.longestWord || '—'}\` (${stats.longestWord.length || 0} letters)`,
          `> 📐 **Avg Word Length:** \`${getAvgWordLength(stats.totalLetters, stats.totalWords)}\``,
          `> ⭐ **Fav Start Letter:** \`${getFavouriteLetter(stats.favouriteStartLetter)}\``
        ].join('\n'),
        inline: false
      },
      {
        name: '🔗 Streaks',
        value: [
          `> ⚡ **Best Streak:** \`${stats.bestStreak}\` words`,
          `> 🔥 **Current Streak:** \`${stats.currentStreak}\` words`,
          `> 💀 **Times Eliminated:** \`${stats.eliminations}\``
        ].join('\n'),
        inline: false
      },
      {
        name: '🏅 Win Rate Bar',
        value: `\`${buildWinRateBar(stats.gamesPlayed, stats.gamesWon)}\``,
        inline: false
      }
    )
    .setFooter({ text: `Last played: ${getTimeSince(stats.lastPlayed)}` })
    .setTimestamp();
}

// ===== TOP WORDS EMBED =====
function buildWordsEmbed(user, stats) {
  const topWords = Object.entries(stats.wordsUsed || {})
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10);

  const wordList = topWords.length > 0
    ? topWords.map(([w, c], i) => `\`${i + 1}.\` **${w}** — used ${c}x`).join('\n')
    : '*No words recorded yet.*';

  const topLetters = Object.entries(stats.favouriteStartLetter || {})
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([l, c]) => `**${l.toUpperCase()}** (${c}x)`)
    .join('  ·  ') || '—';

  return new EmbedBuilder()
    .setTitle(`📖 ${user.displayName ?? user.username}'s Word History`)
    .setColor('Green')
    .setThumbnail(user.displayAvatarURL({ size: 256 }))
    .addFields(
      { name: '🔝 Most Used Words', value: wordList, inline: false },
      { name: '🔤 Top Starting Letters', value: topLetters, inline: false },
      { name: '📏 Longest Word Ever', value: stats.longestWord ? `**${stats.longestWord}** (${stats.longestWord.length} letters)` : '—', inline: false }
    )
    .setFooter({ text: `Total unique words: ${Object.keys(stats.wordsUsed || {}).length}` });
}

// ===== BUTTONS =====
function buildButtons(targetId, page) {
  return new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId(`profile_overview_${targetId}`)
      .setLabel('📊 Overview')
      .setStyle(page === 'overview' ? ButtonStyle.Primary : ButtonStyle.Secondary),
    new ButtonBuilder()
      .setCustomId(`profile_words_${targetId}`)
      .setLabel('📖 Words')
      .setStyle(page === 'words' ? ButtonStyle.Primary : ButtonStyle.Secondary)
  );
}

// ===== COMMAND =====
module.exports = {
  data: new SlashCommandBuilder()
    .setName('profile')
    .setDescription('View a player\'s word chain profile')
    .addUserOption(opt =>
      opt.setName('user')
        .setDescription('The player to view (leave empty for your own profile)')
        .setRequired(false)
    ),

  async execute(interaction, game) {
    const target = interaction.options.getUser('user') || interaction.user;

    // ✅ FIXED (guildId added)
    const stats = getPlayer(target.id, interaction.guild.id);
    const rank = getRank(target.id, interaction.guild.id);

    if (stats.gamesPlayed === 0 && target.id !== interaction.user.id) {
      return interaction.reply({
        embeds: [
          new EmbedBuilder()
            .setColor('Red')
            .setDescription(`❌ **${target.displayName ?? target.username}** hasn't played any games yet!`)
        ],
        flags: 64
      });
    }

    await interaction.reply({
      embeds: [buildOverviewEmbed(target, stats, rank)],
      components: [buildButtons(target.id, 'overview')]
    });
  },

  async handleInteraction(interaction) {
    if (!interaction.isButton()) return false;
    const id = interaction.customId;
    if (!id.startsWith('profile_')) return false;

    const parts = id.split('_');
    const page = parts[1];
    const targetId = parts[2];

    let targetUser;
    try {
      targetUser = await interaction.client.users.fetch(targetId);
    } catch {
      return interaction.reply({ content: '❌ Could not fetch user.', flags: 64 });
    }

    // ✅ FIXED (guildId added)
    const stats = getPlayer(targetId, interaction.guild.id);
    const rank = getRank(targetId, interaction.guild.id);

    if (page === 'overview') {
      return interaction.update({
        embeds: [buildOverviewEmbed(targetUser, stats, rank)],
        components: [buildButtons(targetId, 'overview')]
      });
    }

    if (page === 'words') {
      return interaction.update({
        embeds: [buildWordsEmbed(targetUser, stats)],
        components: [buildButtons(targetId, 'words')]
      });
    }

    return false;
  }
};
