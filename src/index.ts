import { Hono } from 'hono'

const app = new Hono<{ Bindings: CloudflareBindings }>()

app.get('/health', (c) => {
  return c.text('OK')
})

app.get('leaderboard/summary', async (c) => {
  try {
    const leaderboard = await getLeaderboardById(c.env.AOC_LEADERBOARD_ID, c.env.AOC_SESSION_TOKEN);
    return c.json({});
  } catch (e) {
    console.error(e);
    return c.json({ error: (e as Error).message }, 500);
  }
})

async function getLeaderboardById(leaderboardId: string, sessionToken: string) {
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

export default app