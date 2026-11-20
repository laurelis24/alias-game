import Fastify from "fastify";
import cors from "@fastify/cors";
import { Server } from "socket.io";
import { createServer } from "node:http";
import wordsDatabase from "../words.json" with { type: "json" };

const totalMsPerRound = 3000;

type Team = "red" | "blue";
type Status = "waiting" | "playing" | "paused" | "finished";

interface Player {
  id: string; // persistent browser ID
  socketId: string | null; // current connection ID
  nickname: string;
  isHost: boolean;
  team: Team | null;
}

interface GameRoom {
  code: string;
  players: Player[];
  status: Status;
  scores: Record<Team, number>;
  scorePerRound: number;
  currentTeam: Team;
  activePlayerId: string | null;
  roundEndsAt: number | null;
  pausedTimeLeft: number | null;
  currentWord: string;
  turnCounts: Record<Team, number>;
  availableWords: string[];
  totalMsPerRound: number;
}

type PublicRoom = Omit<
  GameRoom,
  "currentWord" | "pausedTimeLeft" | "players"
> & {
  players: Omit<Player, "socketId">[];
  serverTime: number;
};

interface ApiResponse {
  success: boolean;
  message: string;
}

const app = Fastify({ logger: true });
await app.register(cors, { origin: true });
const httpServer = createServer(app.server);
const io = new Server(httpServer, { cors: { origin: "*" } });

const rooms = new Map<string, GameRoom>();
const WORDS: string[] = [...new Set(Object.values(wordsDatabase).flat())];

function makeCode(): string {
  let code = "";
  do {
    code = Math.floor(100 + Math.random() * 900).toString();
  } while (rooms.has(code));
  return code;
}

function publicRoom(room: GameRoom): PublicRoom {
  const { currentWord: _word, pausedTimeLeft: _paused, ...rest } = room;
  return {
    ...rest,
    players: room.players.map(({ socketId: _socket, ...player }) => player),
    serverTime: Date.now(),
  };
}

function updateRoom(room: GameRoom) {
  io.to(room.code).emit("game:updated", publicRoom(room));
}

function playerBySocket(room: GameRoom, socketId: string) {
  return room.players.find((p) => p.socketId === socketId);
}

function sendWord(room: GameRoom) {
  if (!room.activePlayerId) return;
  const player = room.players.find((p) => p.id === room.activePlayerId);
  if (player?.socketId)
    io.to(player.socketId).emit("turn:word", room.currentWord);
}

function newWord(room: GameRoom): boolean {
  if (room.availableWords.length === 0) {
    return false;
  }

  const randomIdx = Math.floor(Math.random() * room.availableWords.length);

  room.currentWord = room.availableWords.splice(randomIdx, 1)[0];

  return true;
}

function teamPlayers(room: GameRoom, team: Team) {
  return room.players.filter((p) => p.team === team);
}

function selectNextExplainer(room: GameRoom, team: Team) {
  const players = teamPlayers(room, team);
  if (!players.length) {
    room.activePlayerId = null;
    return;
  }
  const count = room.turnCounts[team] % players.length;
  room.activePlayerId = players[count].id;
  room.turnCounts[team] += 1;
}

function startRound(room: GameRoom, team: Team) {
  room.currentTeam = team;
  selectNextExplainer(room, team);
  room.status = "playing";
  room.roundEndsAt = Date.now() + totalMsPerRound;
  room.pausedTimeLeft = null;
  newWord(room);
  updateRoom(room);
  sendWord(room);
}

function nextRound(room: GameRoom) {
  if (room.status !== "playing") return;
  startRound(room, room.currentTeam === "red" ? "blue" : "red");
}

function findRoomByPlayerId(playerId: string) {
  return [...rooms.values()].find((room) =>
    room.players.some((p) => p.id === playerId),
  );
}

function leaveRoom(socketId: string) {
  for (const room of rooms.values()) {
    const index = room.players.findIndex((p) => p.socketId === socketId);
    if (index === -1) continue;
    const [leaving] = room.players.splice(index, 1);
    if (!room.players.length) {
      rooms.delete(room.code);
      return;
    }
    if (leaving.isHost) room.players[0].isHost = true;
    if (room.activePlayerId === leaving.id && room.status === "playing") {
      selectNextExplainer(room, room.currentTeam);
      newWord(room);
      sendWord(room);
    }
    updateRoom(room);

    return;
  }
}

app.get("/", async () => {
  return { ok: true };
});

io.on("connection", (socket) => {
  socket.on(
    "game:create",
    ({ playerId, nickname }: { playerId: string; nickname: string }, reply) => {
      if (!playerId || !nickname?.trim())
        return reply?.({ success: false, message: "Ievadi iesauku." });
      const code = makeCode();
      const room: GameRoom = {
        code,
        players: [
          {
            id: playerId,
            socketId: socket.id,
            nickname: nickname.trim(),
            isHost: true,
            team: null,
          },
        ],
        status: "waiting",
        scores: { red: 0, blue: 0 },
        scorePerRound: 0,
        currentTeam: "red",
        activePlayerId: null,
        roundEndsAt: null,
        pausedTimeLeft: null,
        currentWord: "",
        turnCounts: { red: 0, blue: 0 },
        availableWords: [...WORDS],
        totalMsPerRound: totalMsPerRound,
      };
      rooms.set(code, room);
      socket.data.playerId = playerId;
      socket.join(code);
      reply?.({ success: true, room: publicRoom(room) });
      updateRoom(room);
    },
  );

  socket.on(
    "game:join",
    (
      {
        playerId,
        nickname,
        code,
      }: { playerId: string; nickname: string; code: string },
      reply,
    ) => {
      const room = rooms.get(String(code || "").trim());
      if (!playerId || !nickname?.trim())
        return reply?.({ success: false, message: "Ievadi iesauku." });
      if (!room)
        return reply?.({ success: false, message: "Istaba nav atrasta." });
      if (room.status !== "waiting")
        return reply?.({ success: false, message: "Spēle jau ir sākusies." });
      if (room.players.some((p) => p.id === playerId))
        return reply?.({ success: false, message: "Tu jau esi šajā istabā." });
      room.players.push({
        id: playerId,
        socketId: socket.id,
        nickname: nickname.trim(),
        isHost: false,
        team: null,
      });
      socket.data.playerId = playerId;
      socket.join(room.code);
      reply?.({ success: true, room: publicRoom(room) });
      updateRoom(room);
    },
  );

  socket.on(
    "game:reconnect",
    ({ playerId, code }: { playerId: string; code: string }, reply) => {
      const room = rooms.get(code);
      const player = room?.players.find((p) => p.id === playerId);
      if (!room || !player)
        return reply?.({
          success: false,
          message: "Spēles istaba vairs nepastāv.",
        });
      player.socketId = socket.id;
      socket.data.playerId = playerId;
      socket.join(code);
      reply?.({ success: true, room: publicRoom(room) });
      updateRoom(room);
      if (room.activePlayerId === playerId) sendWord(room);
    },
  );

  socket.on("team:choose", (team: Team, reply) => {
    const room = [...rooms.values()].find((r) => playerBySocket(r, socket.id));
    const player = room && playerBySocket(room, socket.id);
    if (
      !room ||
      !player ||
      room.status !== "waiting" ||
      !["red", "blue"].includes(team)
    )
      return reply?.({
        success: false,
        message: "Komandu pašlaik nevar mainīt.",
      });
    player.team = team;
    updateRoom(room);
    reply?.({ success: true });
  });

  socket.on("game:start", (reply) => {
    const room = [...rooms.values()].find((r) => playerBySocket(r, socket.id));

    const player = room && playerBySocket(room, socket.id);

    if (!room || !player?.isHost)
      return reply?.({
        success: false,
        message: "Tikai vadītājs var sākt spēli.",
      });
    if (!teamPlayers(room, "red").length || !teamPlayers(room, "blue").length) {
      return reply?.({
        success: false,
        message: "Katrā komandā jābūt vismaz vienam spēlētājam.",
      });
    }

    // if (room.players.length < 4) {
    //   return reply?.({success:false, message:"Lai uzsāktu spēli ir jāsagaida vismaz 4 spēlētāji."})
    // }
    // if (teamPlayers(room, "red").length !== teamPlayers(room, "blue").length){
    //   return reply?.({success:false, message:"Katrā komandā jābūt vienādam spēlētāju skaitam."})
    // }

    room.scores = { red: 0, blue: 0 };
    room.turnCounts = { red: 0, blue: 0 };
    startRound(room, "red");
    reply?.({ success: true });
  });

  socket.on("game:correct", (reply) => {
    const room = [...rooms.values()].find((r) => playerBySocket(r, socket.id));
    if (
      !room ||
      room.status !== "playing" ||
      room.activePlayerId !== socket.data.playerId
    )
      return reply?.({
        success: false,
        message: "Šobrīd tu neesi skaidrotājs.",
      });

    room.scorePerRound += 1;

    newWord(room);
    updateRoom(room);
    sendWord(room);
    reply?.({ success: true });
  });

  socket.on("game:skip", (reply) => {
    const room = [...rooms.values()].find((r) => playerBySocket(r, socket.id));
    if (
      !room ||
      room.status !== "playing" ||
      room.activePlayerId !== socket.data.playerId
    )
      return reply?.({
        success: false,
        message: "Šobrīd tu neesi skaidrotājs.",
      });

    room.scorePerRound -= 1;

    updateRoom(room);
    newWord(room);
    sendWord(room);
    reply?.({ success: true });
  });

  socket.on("game:pause", (reply) => {
    const room = [...rooms.values()].find((r) => playerBySocket(r, socket.id));
    const player = room && playerBySocket(room, socket.id);
    if (!room || !player?.isHost || room.status !== "playing")
      return reply?.({
        success: false,
        message: "Pauzi var uzlikt spēles vadītājs.",
      });
    room.pausedTimeLeft = Math.max(0, room.roundEndsAt! - Date.now());
    room.roundEndsAt = null;
    room.status = "paused";
    updateRoom(room);
    reply?.({ success: true });
  });

  socket.on("game:resume", (reply) => {
    const room = [...rooms.values()].find((r) => playerBySocket(r, socket.id));
    const player = room && playerBySocket(room, socket.id);
    if (!room || !player?.isHost || room.status !== "paused")
      return reply?.({ success: false, message: "Spēli nevar atsākt." });

    console.log(room.players);

    room.scorePerRound = 0;
    room.roundEndsAt = Date.now() + totalMsPerRound;
    room.pausedTimeLeft = null;
    room.status = "playing";
    //updateRoom(room);
    nextRound(room);
    sendWord(room);
    reply?.({ success: true });
  });

  socket.on("game:end", (reply) => {
    const room = [...rooms.values()].find((r) => playerBySocket(r, socket.id));
    const player = room && playerBySocket(room, socket.id);
    if (!room || !player?.isHost)
      return reply?.({
        success: false,
        message: "Tikai vadītājs var beigt spēli.",
      });
    room.status = "finished";
    room.roundEndsAt = null;

    rooms.delete(room.code);
    updateRoom(room);
    reply?.({ success: true });
  });

  socket.on("game:leave", (reply) => {
    leaveRoom(socket.id);
  });

  socket.on("disconnect", () => {
    const playerId = socket.data.playerId as string | undefined;
    if (!playerId) return;
    const room = findRoomByPlayerId(playerId);
    const player = room?.players.find((p) => p.id === playerId);
    if (player && player.socketId === socket.id) {
      player.socketId = null;
      updateRoom(room!);
    }
  });
});

setInterval(() => {
  for (const room of rooms.values()) {
    if (
      room.status === "playing" &&
      room.roundEndsAt &&
      Date.now() >= room.roundEndsAt
    ) {
      if (room.scorePerRound > 0) {
        room.scores[room.currentTeam] += room.scorePerRound;
      }

      room.status = "paused";

      updateRoom(room);
    }
  }
}, 500);

const PORT = Number(process.env.PORT || 3001);

httpServer.listen(PORT, "0.0.0.0", () => {
  app.log.info(`Alias server listening on ${PORT}`);
});
