import { KVNamespace } from '@cloudflare/workers-types';
import { Leaderboard } from './leaderboard.interface';
import { NotificationService } from './notification.service';
import { messages as arrMotivation } from './data/motivation-messages.json';

export class LeaderboardService {
  constructor(
    private readonly leaderboardId: string,
    private readonly sessionToken: string,
    private readonly kv: KVNamespace,
    private readonly notificationService: NotificationService
  ) {
    //
  }

  async checkDailySummary(): Promise<void> {
    const leaderboard = await this.getLeaderboard();
    const formattedLeaderboard = await this.formatLeaderboard(leaderboard);

    await this.notificationService.pushToSlack(formattedLeaderboard);
  }

  async checkForNewCompletions(): Promise<void> {
    const leaderboard = await this.getLeaderboard();
    const completions = await this.getCompletions(leaderboard);

    if (completions.length > 0) {
      const formattedCompletions = this.formatChallenge(leaderboard, completions);
      await this.notificationService.pushToSlack(formattedCompletions);
    }

    leaderboard.lastSync = new Date();
    await this.kv.put('previous_state', JSON.stringify(leaderboard));
  }

  private async getCompletions(
    leaderboard: Leaderboard
  ): Promise<{ name: string; completedChallenges: number; first: boolean }[]> {
    let previousState: Leaderboard = (await this.kv.get('previous_state', 'json')) || {
      members: {},
      event: '',
      owner_id: 0,
      day1_ts: 0,
      lastSync: new Date(),
    };

    if (!previousState) previousState = leaderboard;

    const newCompletions = [];
    for (const [memberId, member] of Object.entries(leaderboard.members)) {
      const pastStateMember = previousState.members?.[memberId];

      if (!pastStateMember || member.stars > pastStateMember.stars) {
        const completedChallenges = pastStateMember
          ? member.stars - pastStateMember.stars
          : member.stars;
        newCompletions.push({
          name: member.name,
          completedChallenges,
          first: !pastStateMember || (member.stars > 0 && pastStateMember.stars === 0),
        });
      }
    }

    return newCompletions;
  }

  private async getLeaderboard(): Promise<Leaderboard> {
    const currentYear = new Date().getFullYear();
    const url = `https://adventofcode.com/${currentYear}/leaderboard/private/view/${this.leaderboardId}.json`;

    const response = await fetch(url, {
      headers: {
        Cookie: `session=${this.sessionToken}`,
        'User-Agent': 'github.com/patrickcash/aoc-slack-bot',
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch leaderboard: ${response.statusText}`);
    }

    return response.json();
  }

  // region FORMATTING
  private formatLeaderboard(leaderboard: Leaderboard): string {
    let header = `*Daily Leaderboard Summary - ${this.getDateString()}*\n\n`;
    header = this.addMotivation(header);

    const sortedMembers = Object.values(leaderboard.members).sort(
      (a, b) => b.local_score - a.local_score
    );
    header += sortedMembers.reduce((acc, member, index) => {
      const position = index + 1;
      const emoji = index < 3 ? ['🎅', '🎄', '🎁'][index] : '🧝';
      const name = index < 3 ? `*${member.name}*` : member.name;
      return (
        acc +
        `${position.toString().padStart(2)}. ${emoji} ${name} ${member.local_score} (${
          member.stars
        })\n`
      );
    }, '');

    const today = new Date();
    const dayOfMonth = today.getDate();
    const remainingDays = Math.max(25 - dayOfMonth, 0);

    header += `\n${remainingDays} Day${remainingDays !== 1 ? 's' : ''} left\n`;

    const closure = "Sent from Santa's sleigh! 🎅";
    header += `\n_${closure}_`;
    return header;
  }

  private formatChallenge(
    leaderboard: Leaderboard,
    newCompletions: {
      name: string;
      completedChallenges: number;
      first: boolean;
    }[]
  ): string {
    let header = `*New Advent of Code Completions (Last 15 Minutes) - ${this.getTimeString()}*\n\n`;
    header = this.addMotivation(header);

    const sortedMembers = newCompletions.sort((a, b) => {
      if (a.first !== b.first) {
        return a.first ? -1 : 1;
      }
      return b.completedChallenges - a.completedChallenges;
    });

    header += sortedMembers.reduce((acc, member, index) => {
      const position = index + 1;
      const emoji = this.randomEmoji();
      const name = member.name;
      const completed = member.completedChallenges;

      return (
        acc +
        (member.first
          ? `${position
              .toString()
              .padStart(
                2
              )}. ${emoji} *${name}* joined and started their Advent of Code journey! 🎄🎉\n`
          : `${position
              .toString()
              .padStart(2)}. ${emoji} ${name} just completed ${completed} challenge${
              completed > 1 ? 's' : ''
            }!\n`)
      );
    }, '');

    const randomMember = this.getRandomMember(
      leaderboard,
      newCompletions.map((member) => member.name)
    );
    const challenge = randomMember
      ? `Will ${randomMember} be the next to complete a challenge? 🤔`
      : "Who's next? 🎄";

    header += `\n_${challenge}_`;

    const closure = "Sent from Santa's sleigh! 🎅";
    header += `\n\n_${closure}_`;
    return header;
  }
  // endregion

  // region UTILS
  private getDateString(): string {
    return new Date().toLocaleString('en-US', {
      timeZone: 'America/Montreal',
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  }

  private getTimeString(): string {
    return new Date().toLocaleString('en-US', {
      timeZone: 'America/Montreal',
      hour: 'numeric',
      minute: 'numeric',
      hour12: true,
    });
  }

  private getRandomMember(leaderboard: Leaderboard, excludedMembers: string[]): string | null {
    const members = Object.values(leaderboard.members).filter(
      (member) => !excludedMembers.includes(member.name)
    );
    if (members.length === 0) return null;

    return members[Math.floor(Math.random() * members.length)].name;
  }

  private addMotivation(header: string): string {
    return header + `${arrMotivation[Math.floor(Math.random() * arrMotivation.length)]}\n`;
  }

  private randomEmoji(): string {
    const emojis = ['🎅', '🎄', '🎁', '🧝', '⛄', '🦌', '🔔', '🕯️', '🍪', '🥛', '🎶'];
    return emojis[Math.floor(Math.random() * emojis.length)];
  }
  // endregion
}
