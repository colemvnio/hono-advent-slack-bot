import { Leaderboard } from './leaderboard.interface';

export class LeaderboardService {
  constructor(
    private readonly leaderboardId: string,
    private readonly sessionToken: string
  ) {}

  async getAndFormatLeaderboard(): Promise<string> {
    const leaderboard = await this.getLeaderboardById();
    return this.formatLeaderboard(leaderboard);
  }

  private async getLeaderboardById(): Promise<Leaderboard> {
    const currentYear = new Date().getFullYear();
    const url = `https://adventofcode.com/${currentYear}/leaderboard/private/view/${this.leaderboardId}.json`;
    
    const response = await fetch(url, {
      headers: {
        Cookie: `session=${this.sessionToken}`,
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch leaderboard: ${response.statusText}`);
    }

    return response.json();
  }

  private formatLeaderboard(leaderboard: Leaderboard): string {
    const members = Object.values(leaderboard.members)
      .filter((member) => member.stars > 0)
      .sort((a, b) => b.local_score - a.local_score);

    if (members.length === 0) {
      return "No participants found with stars.";
    }

    const formattedMembers = members.map((member, index) => {
      const name = member.name || `Anonymous User #${member.id}`;
      return `${index + 1}. ${name} - ${member.stars}⭐ (Score: ${member.local_score})`;
    });

    const currentYear = new Date().getFullYear();
    const header = `🎄 *Advent of Code ${currentYear} Leaderboard Update* 🎄\n`;
    return header + formattedMembers.join('\n');
  }
}
