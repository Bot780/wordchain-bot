const {
  SlashCommandBuilder,
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  StringSelectMenuBuilder
} = require('discord.js');
const { getLeaderboard } = require('../stats');

const PAGE_SIZE = 5;
const MEDALS = ['🥇', '🥈', '🥉'];

const CATEGORIES = {
  wins: {
    label: '🏆 Most Wins',
    description: 'Ranked by total wins',
    color: 'Gold',
    key: 'gamesWon',
    format: (p) => `🏆 \`${p.gamesWon}\` wins`
  },
  words: {
    label: '📝 Most Words',
    description: 'Ranked by total words played',
    color: 'Green',
    key: 'totalWords',
    format: (p) => `📝 \`${p.totalWords}\` words`
  },
  winrate: {
    label: '📈 Best Win Rate',
    description: 'Ranked by win rate (min 3 games)',
    color: 'Blurple',
    key: '_winrate',
    format: (p) => {
      const rate = p.gamesPlayed > 0 ? Math.round((p.gamesWon / p.gamesPlayed) * 100) : 0;
      return `📈 \`${rate}%\` (${p.gamesPlayed} games)`;
    }
  },
  longest: {
    label: '📏 Longest Word',
    description: 'Ranked by longest word ever used',
    color: 'Purple',
    key: '_longestLen',
    format: (p) => `📏 \`${p.longestWord || '—'}\` (${p.longestWord?.length || 0} letters)`
  },
  streak: {
    label: '🔗 Best Streak',
    description: 'Ranked by best word streak',
    color: 'Orange',
    key: 'bestStreak',
    format: (p) => `🔗 \`${p.bestStreak}\` words`
  },
  avglen: {
    label: '📐 Avg Word Length',
    description: 'Ranked by average word length',
    color: 'Teal',
    key: '_avgLen',
    format: (p) => {
      const avg = p.totalWords > 0 ? (p.totalLetters / p.totalWords).toFixed(1) : '0.0';
      return `📐 \`${avg}\` letters avg`;
    }
  }
};

// ===== FIXED: guildId passed in =====
function getSorted(category, guildId) {
  let players = getLeaderboard(guildId, 100);

  if (category === 'winrate') {
    players = players.filter(p => p.gamesPlayed >= 3);
    players.sort((a, b) => (b.gamesWon / b.gamesPlayed) - (a.gamesWon / a.gamesPlayed));
  } else if (category === 'longest') {
    players.sort((a, b) => (b.longestWord?.length || 0) - (a.longestWord?.length || 0));
  } else if (category === 'avglen') {
    players = players.filter(p => p.totalWords > 0);
    players.sort((a, b) => {
      const aAvg = a.totalLetters / a.totalWords;
      const bAvg = b.totalLetters / b.totalWords;
      return bAvg - aAvg;
    });
  } else {
    const key = CATEGORIES[category].key;
    players.sort((a, b) => b[key] - a[key]);
  }

  return players;
}

// ===== FIXED: guildId passed in =====
async function buildLeaderboardEmbed(client, category, page, guild) {
  const cat = CATEGORIES[category];
  const players = getSorted(category, guild.id);
  const totalPages = Math.max(1, Math.ceil(players.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages - 1);
  const slice = players.slice(safePage * PAGE_SIZE, safePage * PAGE_SIZE + PAGE_SIZE);

  if (slice.length === 0) {
    return {
      embed: new EmbedBuilder()
        .setTitle(`${cat.label} Leaderboard`)
        .setColor(cat.color)
        .setDescription('*No players found for this category yet.*')
        .setFooter({ text: cat.description }),
      totalPages: 1,
      page: 0
    };
  }

  const lines = await Promise.all(
    slice.map(async (p, i) => {
      const globalRank = safePage * PAGE_SIZE + i;
      const medal = MEDALS[globalRank] ?? `\`#${globalRank + 1}\``;

      let name = `<@${p.userId}>`;
      try {
        const member = guild.members.cache.get(p.userId);
        if (member) {
          name = `**${member.displayName}**`;
        } else {
          const user = await client.users.fetch(p.userId);
          name = `**${user.username}**`;
        }
      } catch {}

      return `${medal} ${name}\n${' '.repeat(4)}${cat.format(p)}`;
    })
  );

  return {
    embed: new EmbedBuilder()
      .setTitle(`${cat.label} Leaderboard`)
      .setColor(cat.color)
      .setDescription(lines.join('\n\n'))
      .setFooter({ text: `${cat.description}  •  Page ${safePage + 1}/${totalPages}  •  ${players.length} players` })
      .setTimestamp(),
    totalPages,
    page: safePage
  };
}

function buildCategoryMenu(currentCategory) {
  return new ActionRowBuilder().addComponents(
    new StringSelectMenuBuilder()
      .setCustomId('lb_category')
      .setPlaceholder('Select a category...')
      .addOptions(
        Object.entries(CATEGORIES).map(([value, cat]) => ({
          label: cat.label,
          description: cat.description,
          value,
          default: value === currentCategory
        }))
      )
  );
}

function buildPageButtons(category, page, totalPages) {
  return new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId(`lb_page_${category}_0`)
      .setLabel('⏮')
      .setStyle(ButtonStyle.Secondary)
      .setDisabled(page === 0),
    new ButtonBuilder()
      .setCustomId(`lb_page_${category}_${page - 1}`)
      .setLabel('◀ Prev')
      .setStyle(ButtonStyle.Primary)
      .setDisabled(page === 0),
    new ButtonBuilder()
      .setCustomId(`lb_page_${category}_${page + 1}`)
      .setLabel('Next ▶')
      .setStyle(ButtonStyle.Primary)
      .setDisabled(page >= totalPages - 1),
    new ButtonBuilder()
      .setCustomId(`lb_page_${category}_${totalPages - 1}`)
      .setLabel('⏭')
      .setStyle(ButtonStyle.Secondary)
      .setDisabled(page >= totalPages - 1)
  );
}

async function sendLeaderboard(interaction, category, page, update = false) {
  const { embed, totalPages, page: safePage } = await buildLeaderboardEmbed(
    interaction.client,
    category,
    page,
    interaction.guild
  );

  const payload = {
    embeds: [embed],
    components: [
      buildCategoryMenu(category),
      buildPageButtons(category, safePage, totalPages)
    ]
  };

  if (update) await interaction.update(payload);
  else await interaction.reply(payload);
}

module.exports = {
  data: new SlashCommandBuilder()
    .setName('leaderboard')
    .setDescription('View the word chain leaderboard')
    .addStringOption(opt =>
      opt.setName('category')
        .setDescription('Which leaderboard to view')
        .setRequired(false)
        .addChoices(
          { name: '🏆 Most Wins', value: 'wins' },
          { name: '📝 Most Words', value: 'words' },
          { name: '📈 Best Win Rate', value: 'winrate' },
          { name: '📏 Longest Word', value: 'longest' },
          { name: '🔗 Best Streak', value: 'streak' },
          { name: '📐 Avg Word Length', value: 'avglen' }
        )
    ),

  async execute(interaction, game) {
    const category = interaction.options.getString('category') || 'wins';
    await sendLeaderboard(interaction, category, 0, false);
  },

  async handleInteraction(interaction) {
    if (interaction.isStringSelectMenu() && interaction.customId === 'lb_category') {
      return sendLeaderboard(interaction, interaction.values[0], 0, true);
    }

    if (interaction.isButton() && interaction.customId.startsWith('lb_page_')) {
      const parts = interaction.customId.split('_');
      const page = parseInt(parts[parts.length - 1]);
      const category = parts.slice(2, parts.length - 1).join('_');
      return sendLeaderboard(interaction, category, page, true);
    }

    return false;
  }
};

