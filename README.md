# 🎄 Advent of Code Slack Bot
Happy Coding! 🎅
## ✨ Features

- 📊 Daily leaderboard updates: Deployed
- 🔔 Automatic notifications for completed challenges: In progress

## 🚀 Getting Started

### Prerequisites

- Cloudflare Workers account
- Slack workspace with bot permissions
- Advent of Code account and session token
- Private leaderboard ID

### Environment Variables

```plaintext
AOC_LEADERBOARD_ID=your_leaderboard_id
AOC_SESSION_TOKEN=your_session_token
SLACK_WEBHOOK_URL=your_slack_webhook_placeholder
```

(!) For local development, you can create a `.dev.vars` file with the above variables.

### Installation

1. Clone the repository
2. Install dependencies with `npm install`
3. Deploy to Cloudflare Workers with `wrangler deploy`

## 🛠️ Tech Stack

- TypeScript
- Cloudflare Workers
- Hono Framework
- Slack API

## 📝 Usage

Once deployed, the bot will automatically:
- Fetch leaderboard updates
- Post daily summaries to your Slack channel
- Track participant progress
- Celebrate completions

---

Made with ❤️ by [Patrick](https://bento.me/patrick-c)
