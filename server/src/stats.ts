import db from "./database.js";
import type { GameRoom, Player } from "./index.js";

const saveGameStats = db.transaction((room: GameRoom): number => {
  const teams = db
    .prepare(
      `
        SELECT id, name FROM teams
    `,
    )
    .all() as { id: number; name: string }[];

  const teamIds = Object.fromEntries(
    teams.map((team) => [team.name, team.id]),
  ) as Record<string, number>;

  const blueTeamId = teamIds.blue;
  const redTeamId = teamIds.red;

  if (!blueTeamId || !redTeamId) {
    throw new Error("Teams not initialized");
  }

  const blueScore = room.scores.blue;
  const redScore = room.scores.red;

  const winningTeam =
    blueScore > redScore ? "blue" : redScore > blueScore ? "red" : "draw";

  const game = db
    .prepare(
      `
        INSERT INTO games (
            room_code,
            blue_score,
            red_score,
            winning_team
        )
        VALUES (?, ?, ?, ?)
    `,
    )
    .run(room.code, blueScore, redScore, winningTeam);

  const gameId = Number(game.lastInsertRowid);

  const insertUser = db.prepare(`
        INSERT INTO users (player_id, username)
        VALUES (?, ?)
        ON CONFLICT(player_id)
        DO UPDATE SET username = excluded.username
    `);

  const getUser = db.prepare(`
        SELECT id FROM users WHERE player_id = ?
    `);

  const insertPlayer = db.prepare(`
        INSERT INTO game_players (
            game_id,
            user_id,
            team_id
        )
        VALUES (?, ?, ?)
    `);

  for (const player of room.players) {
    if (!player.team) continue;

    const teamId = teamIds[player.team];

    if (!teamId) {
      throw new Error(`Invalid team: ${player.team}`);
    }

    insertUser.run(player.id, player.nickname);

    const user = getUser.get(player.id) as { id: number };

    insertPlayer.run(gameId, user.id, teamId);
  }

  return gameId;
});

export default saveGameStats;
