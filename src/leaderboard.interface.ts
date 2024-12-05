export interface Leaderboard {
    members: {
        [id: string]: {
            name: string;
            local_score: number;
            id: number;
            global_score: number;
            completion_day_level: {
                [day: string]: {
                    [part: string]: {
                        get_star_ts: number;
                        star_index: number;
                    };
                };
            };
            last_star_ts: number;
            stars: number;
        };
    };
    event: string;
    owner_id: number;
    day1_ts: number;
}