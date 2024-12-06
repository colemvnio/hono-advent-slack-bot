import { LeaderboardService } from './leaderboard.service';
import { NotificationService } from './notification.service';
import { KVNamespace } from '@cloudflare/workers-types';

export interface Env {
  AOC_SESSION_TOKEN: string;
  AOC_LEADERBOARD_ID: string;
  SLACK_WEBHOOK_URL: string;
  LEADERBOARD_STATE: KVNamespace;
}

export default {
  async scheduled(event: ScheduledEvent, env: Env, _ctx: ExecutionContext) {
    console.log(`Executing scheduled event for cron: ${event.cron}`);

    try {
      // Enforce to only execute during December if infra not paused
      if (new Date().getMonth() !== 11) {
        console.log('Skipping execution outside of December');
        return;
      }

      const notificationService = new NotificationService(env.SLACK_WEBHOOK_URL);

      const leaderboardService = new LeaderboardService(
        env.AOC_LEADERBOARD_ID,
        env.AOC_SESSION_TOKEN,
        env.LEADERBOARD_STATE,
        notificationService
      );

      switch (event.cron) {
        case "0 12 * * *":
          await leaderboardService.checkDailySummary();
          break;

        case "*/15 * * * *":
          await leaderboardService.checkForNewCompletions();
          break;

        default:
          console.log(`Unknown cron expression: ${event.cron}`);
      }
    } catch (error) {
      console.error('Error during scheduled event:', (error as Error).message);
    }
  }
}
