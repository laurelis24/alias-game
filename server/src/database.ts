import Database from "better-sqlite3";

const db = new Database("alias_game.db");

db.pragma("journal_mode = WAL");
db.pragma("foreign_keys = ON");

db.exec(`
    CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    player_id TEXT NOT NULL UNIQUE,
    username TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

    CREATE TABLE IF NOT EXISTS teams (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL UNIQUE
    );

    CREATE TABLE IF NOT EXISTS games (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        room_code TEXT,
        played_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        blue_score INTEGER NOT NULL DEFAULT 0,
        red_score INTEGER NOT NULL DEFAULT 0,
        winning_team TEXT
    );

    CREATE TABLE IF NOT EXISTS game_players (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        game_id INTEGER NOT NULL,
        user_id INTEGER NOT NULL,
        team_id INTEGER NOT NULL,

        FOREIGN KEY (game_id) REFERENCES games(id),
        FOREIGN KEY (user_id) REFERENCES users(id),
        FOREIGN KEY (team_id) REFERENCES teams(id),

        UNIQUE(game_id, user_id)
    );
`);

db.prepare(
  `
    INSERT OR IGNORE INTO teams (name)
    VALUES (?), (?)
`,
).run("blue", "red");

export default db;
