import { createContext, useEffect, useState } from "react";
import { socket } from "./socket";
import "./style.css";

import GuestView from "./GuestView";
import PlayerView from "./PlayerView";

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
                <PlayerView setRoom={setRoom} setWord={setWord} setError={setError} />
            </div>
        </GameValuesContext>
    );
}
