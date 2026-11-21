import type { FastifyInstance } from "fastify";
import db from "../database.js";

export default async function statsRoutes(app: FastifyInstance) {
  // Overall statistics
  app.get("/stats", async () => {
    return db
      .prepare(
        `
            SELECT
                COUNT(*) AS totalGames,

                SUM(CASE WHEN winning_team = 'blue'
                    THEN 1 ELSE 0 END) AS blueWins,

                SUM(CASE WHEN winning_team = 'red'
                    THEN 1 ELSE 0 END) AS redWins,

                SUM(CASE WHEN winning_team = 'draw'
                    THEN 1 ELSE 0 END) AS draws,

                COALESCE(SUM(blue_score), 0) AS blueTotalScore,
                COALESCE(SUM(red_score), 0) AS redTotalScore

            FROM games
        `,
      )
      .get();
  });

  // Player leaderboard
  app.get("/stats/players", async () => {
    return db
      .prepare(
        `
            SELECT
                u.player_id AS playerId,
                u.username AS nickname,
                COUNT(gp.id) AS gamesPlayed,

                SUM(CASE
                    WHEN g.winning_team = t.name
                    THEN 1 ELSE 0
                END) AS wins,

                SUM(CASE
                    WHEN g.winning_team != 'draw'
                    AND g.winning_team != t.name
                    THEN 1 ELSE 0
                END) AS losses

            FROM users u
            LEFT JOIN game_players gp ON gp.user_id = u.id
            LEFT JOIN games g ON g.id = gp.game_id
            LEFT JOIN teams t ON t.id = gp.team_id

            GROUP BY u.id
            ORDER BY wins DESC, gamesPlayed DESC
        `,
      )
      .all();
  });

  // Individual player statistics
  app.get<{ Params: { playerId: string } }>(
    "/stats/players/:playerId",
    async (request, reply) => {
      const player = db
        .prepare(
          `
                SELECT
                    u.player_id AS playerId,
                    u.username AS nickname,
                    COUNT(gp.id) AS gamesPlayed,

                    SUM(CASE
                        WHEN g.winning_team = t.name
                        THEN 1 ELSE 0
                    END) AS wins,

                    SUM(CASE
                        WHEN g.winning_team != 'draw'
                        AND g.winning_team != t.name
                        THEN 1 ELSE 0
                    END) AS losses

                FROM users u
                LEFT JOIN game_players gp ON gp.user_id = u.id
                LEFT JOIN games g ON g.id = gp.game_id
                LEFT JOIN teams t ON t.id = gp.team_id

                WHERE u.player_id = ?
                GROUP BY u.id
            `,
        )
        .get(request.params.playerId);

      if (!player) {
        return reply.status(404).send({
          message: "Player not found",
        });
      }

      return player;
    },
  );
}
