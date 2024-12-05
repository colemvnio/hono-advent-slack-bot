import { Hono } from 'hono'
import { Leaderboard } from './leaderboard.interface'

const app = new Hono<{ Bindings: CloudflareBindings }>()

app.get('/health', (c) => {
  return c.text('OK')
})

app.get('leaderboard/summary', async (c) => {
  try {
    const leaderboard = await getLeaderboardById(c.env.AOC_LEADERBOARD_ID, c.env.AOC_SESSION_TOKEN);
    const header = formatLeaderboard(leaderboard);
    return c.text(header);
  } catch (e) {
    console.error(e);
    return c.text((e as Error).message);
  }
})

async function getLeaderboardById(leaderboardId: string, sessionToken: string): Promise<Leaderboard> {
  const currentYear = new Date().getFullYear();
  const url = `https://adventofcode.com/${currentYear}/leaderboard/private/view/${leaderboardId}.json`;

  const response = await fetch(url, {
    headers: {
      Cookie: `session=${sessionToken}`,
      'User-Agent': 'Slack Advent Bot (https://github.com/colemvnio/hono-advent-slack-bot)',
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch leaderboard: ${response.statusText}`);
  }
  return response.json();
}

function formatLeaderboard(leaderboard: Leaderboard): string {
  const currentDate = new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
  const header = `*Daily Leaderboard Summary - ${currentDate}*\n`;
  const sortedMembers = Object.values(leaderboard.members)
    .sort((a, b) => b.local_score - a.local_score);

  const maxScore = sortedMembers[0].local_score;
  const nameMaxLength = Math.max(...Object.values(leaderboard.members).map(member => member.name.length)) + 1;

  return sortedMembers.reduce((acc, member, index) => {
    const position = index + 1;
    const progress = Math.round((member.local_score / maxScore) * 10);
    const bar = '█'.repeat(progress) + '░'.repeat(10 - progress);

    // Top 3 leaders get themed emojis
    const emoji = index < 3 ? ['🎅', '🎄', '🎁'][index] : '🧝';
    const paddedName = member.name.length > nameMaxLength ? 
      `${member.name.slice(0, nameMaxLength - 3)}...` : 
      member.name.padEnd(nameMaxLength);

    return acc + `${position.toString().padStart(2)}. ${emoji} ${paddedName} ${bar} ${member.local_score} (${member.stars})\n`;
  }, header);
}

export default app