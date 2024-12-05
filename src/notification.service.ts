export class NotificationService {
  constructor(private readonly webhookUrl: string) {}

  async pushToSlack(message: string): Promise<void> {
    const response = await fetch(this.webhookUrl, {
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
}
