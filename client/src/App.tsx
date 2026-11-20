import { createContext, useEffect, useState, type Dispatch, type SetStateAction } from "react";
import { socket } from "./socket";
import "./style.css";
import Modal from "./Modal";
//import Hourglass from "./Hourglass";

import { useContext } from "react";
import GuestView from "./GuestView";
import PlayerView from "./PlayerView";

const CUSTOM_STYLES = `
  @import url('https://fonts.googleapis.com/css2?family=Fredoka:wght@500;600;700&family=Plus+Jakarta+Sans:wght@500;600;700;800&display=swap');

  .alias-app-font {
    font-family: 'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, sans-serif;
  }

  .alias-display-font {
    font-family: 'Fredoka', cursive, sans-serif;
  }

  /* Smilšu pulksteņa smilšu plūsmas animācija (bez apgriešanās) */
  @keyframes sandStream {
    0%, 100% { opacity: 0.95; stroke-dashoffset: 0; }
    50% { opacity: 0.55; stroke-dashoffset: 5; }
  }

  .animate-sand-stream {
    animation: sandStream 0.55s linear infinite;
  }

  /* Vārda kartītes uzniršanas animācija */
  @keyframes cardPop {
    0% {
      opacity: 0;
      transform: scale(0.92) translateY(12px);
    }
    100% {
      opacity: 1;
      transform: scale(1) translateY(0);
    }
  }

  .animate-card-pop {
    animation: cardPop 0.28s cubic-bezier(0.22, 1, 0.36, 1) forwards;
  }

  /* Taktīlo pogu nospiešanas efekts */
  .btn-tactile {
    transition: transform 0.12s cubic-bezier(0.34, 1.56, 0.64, 1), box-shadow 0.12s ease, background-color 0.15s ease;
  }
  .btn-tactile:active:not(:disabled) {
    transform: translateY(3px) scale(0.98);
  }
`;

export type Team = "red" | "blue";
type Status = "waiting" | "playing" | "paused" | "finished";

interface Player {
    id: string;
    nickname: string;
    isHost: boolean;
    team: Team | null;
    isMyTurn: boolean;
}

export interface GameRoom {
    code: string;
    players: Player[];
    status: Status;
    scores: Record<Team, number>;
    scorePerRound: number;
    currentTeam: Team;
    activePlayerId: string | null;
    roundEndsAt: number | null;
    serverTime: number;
    timerTime: number;
    totalMsPerRound: number;
}

interface ApiResult {
    success: boolean;
    message?: string;
    room?: GameRoom;
}

interface GameValuesContextType {
    player: Player;
    error: string;
    room: GameRoom;
    timeLeft: number;
    word: string;
}

export const GameValuesContext = createContext<GameValuesContextType | null>(null);

function getPlayerId() {
    let id = localStorage.getItem("aliasPlayerId");

    if (!id) {
        id = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
        localStorage.setItem("aliasPlayerId", id);
    }

    return id;
}

export default function App() {
    const [nickname, setNickname] = useState("");
    const [roomCode, setRoomCode] = useState("");
    const [room, setRoom] = useState<GameRoom | null>(null);
    const [word, setWord] = useState("");
    const [error, setError] = useState("");
    const [timeLeft, setTimeLeft] = useState(60);
    const [serverOffset, setServerOffset] = useState(0);

    const playerId = getPlayerId();
    const me = room?.players.find((p) => p.id === playerId);
    const isHost = Boolean(me?.isHost);
    const isMyTurn = room?.activePlayerId === playerId;

    useEffect(() => {
        const onUpdated = (updated: GameRoom) => {
            setRoom(updated);
            setServerOffset(updated.serverTime - Date.now());
            if (updated.activePlayerId !== getPlayerId()) setWord("");
        };
        const onWord = (newWord: string) => setWord(newWord);
        const onConnect = () => {
            const savedCode = localStorage.getItem("aliasRoomCode");
            const savedPlayer = localStorage.getItem("aliasPlayerId");
            if (savedCode && savedPlayer) {
                socket.emit("game:reconnect", { code: savedCode, playerId: savedPlayer }, (result: ApiResult) => {
                    if (result?.success && result.room) setRoom(result.room);
                });
            }
        };

        socket.on("game:updated", onUpdated);
        socket.on("turn:word", onWord);
        socket.on("connect", onConnect);
        socket.connect();

        return () => {
            socket.off("game:updated", onUpdated);
            socket.off("turn:word", onWord);
            socket.off("connect", onConnect);
            socket.disconnect();
        };
    }, []);

    useEffect(() => {
        if (room?.status === "paused") return;
        if (room?.status !== "playing" || !room.roundEndsAt) {
            setTimeLeft(60);
            return;
        }
        const update = () => {
            const serverNow = Date.now() + serverOffset;
            setTimeLeft(Math.max(0, Math.ceil((room.roundEndsAt! - serverNow) / 1000)));
        };
        update();
        const timer = window.setInterval(update, 1000);
        return () => window.clearInterval(timer);
    }, [room?.roundEndsAt, room?.status, serverOffset]);

    // const createGame = () => {
    //   if (!nickname.trim()) return setError("Vispirms ievadi savu iesauku.");
    //   socket.emit("game:create", { playerId, nickname }, (result: ApiResult) => {
    //     if (!result?.success || !result.room) return setError(result?.message || "Neizdevās izveidot istabu.");
    //     localStorage.setItem("aliasRoomCode", result.room.code);
    //     setRoom(result.room);
    //     setRoomCode(result.room.code);
    //     setError("");
    //   });
    // };

    // const joinGame = () => {
    //   if (!nickname.trim()) return setError("Vispirms ievadi savu iesauku.");
    //   if (!roomCode.trim()) return setError("Ievadi istabas kodu.");
    //   socket.emit("game:join", { playerId, nickname, code: roomCode.trim() }, (result: ApiResult) => {
    //     if (!result?.success || !result.room) return setError(result?.message || "Neizdevās pievienoties.");
    //     localStorage.setItem("aliasRoomCode", result.room.code);
    //     setRoom(result.room);
    //     setError("");
    //   });
    // };

    if (!room) {
        return (
            <GuestView
                nickname={nickname}
                error={error}
                roomCode={roomCode}
                playerId={playerId}
                setRoom={setRoom}
                setNickname={setNickname}
                setRoomCode={setRoomCode}
                setError={setError}
            />
        );
    }

    const gameValues: GameValuesContextType = {
        player: { nickname: nickname, id: playerId, isHost: isHost, team: me?.team || null, isMyTurn: isMyTurn },
        room: room,
        timeLeft: timeLeft,
        error,
        word: word,
    };

    return (
        <GameValuesContext value={gameValues}>
            <div className="min-h-screen bg-slate-200/80 flex flex-col items-center justify-center p-0 sm:p-4 alias-app-font select-none">
                {/* <style>{CUSTOM_STYLES}</style> */}

                {/* <div className="relative w-full sm:max-w-[420px] h-screen sm:h-[812px] bg-white sm:rounded-[36px] sm:border-[8px] sm:border-slate-900 shadow-2xl overflow-hidden flex flex-col"> */}

                <PlayerView setRoom={setRoom} setWord={setWord} setError={setError} />
                {/* </div> */}
            </div>
        </GameValuesContext>
    );

    // if (!room) {
    //   return (
    //     <main className="app-shell">
    //       <section className="game-card">
    //         <h1>ALIAS</h1>
    //         <p className="subtitle">Izskaidro vārdu. Palīdzi savai komandai uzvarēt!</p>
    //         <label htmlFor="nickname">Tava iesauka</label>
    //         <input id="nickname" value={nickname} onChange={e => setNickname(e.target.value)} placeholder="Ievadi iesauku" maxLength={20} />
    //         <button onClick={createGame}>Izveidot spēli</button>
    //         <div className="separator">vai pievienojies spēlei</div>
    //         <label htmlFor="room-code">Istabas kods</label>
    //         <input id="room-code" value={roomCode} onChange={e => setRoomCode(e.target.value)} placeholder="Piemēram, 123" maxLength={3} />
    //         <button className="secondary" onClick={joinGame}>Pievienoties</button>
    //         {error && <p className="error">{error}</p>}
    //       </section>
    //     </main>
    //   );
    // }

    //const redPlayers = room.players.filter(p => p.team === "red");
    //const bluePlayers = room.players.filter(p => p.team === "blue");

    // return (
    //   <div className="min-h-screen bg-slate-200/80 flex flex-col items-center justify-center p-0 sm:p-4 alias-app-font select-none">

    //     <div className="relative w-full sm:max-w-[420px] h-screen sm:h-[812px] bg-white sm:rounded-[36px] sm:border-[8px] sm:border-slate-900 shadow-2xl overflow-hidden flex flex-col">

    //     </div>
    //   </div>
    // )
}
