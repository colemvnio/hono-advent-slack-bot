import { Leaderboard } from './leaderboard.interface'

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
  const arrMotivation = [
    'Happy Coding! 🎅',
    'May your code be bug-free! 🎄',
    'Debugging is just like unwrapping presents! 🎁',
    'Keep calm and code on! ⌨️',
    'You\'re making great progress! 🚀',
    'Every line of code is a step forward! 👣',
    'Embrace the challenge, you\'ve got this! 💪',
    'Your dedication is inspiring! ✨',
    'Code like nobody\'s watching! 👀',
    'You\'re a coding superstar! 🌟'
  ];

  let header = `*Daily Leaderboard Summary - ${currentDate}*\n\n`;
  const randomSentence = arrMotivation[Math.floor(Math.random() * arrMotivation.length)];
  header += `> _${randomSentence}_\n\n`;
  const sortedMembers = Object.values(leaderboard.members)
    .sort((a, b) => b.local_score - a.local_score);

  header += sortedMembers.reduce((acc, member, index) => {
    const position = index + 1;
    const emoji = index < 3 ? ['🎅', '🎄', '🎁'][index] : '🧝';
    const name = index < 3 ? `*${member.name}*` : member.name;
    return acc + `${position.toString().padStart(2)}. ${emoji} ${name} ${member.local_score} (${member.stars})\n`;
  }, '');

  const closure = "Sent from Santa's sleigh! 🎅";
  header += `\n\n_${closure}_`;

  return header;
}

async function pushToSlack(message: string, webhookUrl: string): Promise<void> {
  const response = await fetch(webhookUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ text: message }),
  });

  if (!response.ok) {
    throw new Error(`Failed to push to Slack: ${response.statusText}`);
  }
}

export default {
  async scheduled(event: ScheduledEvent, env: CloudflareBindings, ctx: ExecutionContext) {
    console.log("Executing scheduled event for leaderboard summary...");

    try {
      const leaderboard = await getLeaderboardById(env.AOC_LEADERBOARD_ID, env.AOC_SESSION_TOKEN);
      const header = formatLeaderboard(leaderboard);
      await pushToSlack(header, env.SLACK_WEBHOOK_URL);

      console.log('Scheduled leaderboard summary posted successfully');
    } catch (error) {
      console.error('Error during scheduled event:', (error as Error).message);
    }
  }
}