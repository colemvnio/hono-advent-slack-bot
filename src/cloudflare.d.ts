declare global {
  interface CloudflareBindings {
    AOC_LEADERBOARD_ID: string;
    AOC_SESSION_TOKEN: string;
    SLACK_WEBHOOK_URL: string;
    AOC_KV: KVNamespace;
  }
}

export {};
