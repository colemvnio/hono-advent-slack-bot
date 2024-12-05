import { LeaderboardService } from './leaderboard.service';
import { NotificationService } from './notification.service';

async function pushToSlack(message: string, webhookUrl: string): Promise<void> {
  const response = await fetch(webhookUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ text: message }),
  });

  if (!response.ok) {
    throw new Error(`Failed to post to Slack: ${response.statusText}`);
  }
}

export default {
  async scheduled(event: ScheduledEvent, env: CloudflareBindings, ctx: ExecutionContext) {
    console.log(`Executing scheduled event for cron: ${event.cron}`);

    try {
      const notificationService = new NotificationService(env.SLACK_WEBHOOK_URL);

      
      switch (event.cron) {
        case "0 12 * * *":
          const leaderboardService = new LeaderboardService(
            env.AOC_LEADERBOARD_ID,
            env.AOC_SESSION_TOKEN
          );
          const formattedLeaderboard = await leaderboardService.getAndFormatLeaderboard();
          await notificationService.pushToSlack(formattedLeaderboard);

          break;

        case "*/15 * * * *": // Every 15 minutes
          //
          break;

        default:
          console.log(`Unknown cron expression: ${event.cron}`);
      }
    } catch (error) {
      console.error('Error during scheduled event:', (error as Error).message);
    }
  }
}