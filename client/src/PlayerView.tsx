import { useContext, type Dispatch, type SetStateAction } from "react";
import { socket } from "./socket";
import { GameValuesContext, type GameRoom, type Team } from "./App";
import { Check, Crown, DoorOpen, Eye, Flag, Play, SkipForward, Trophy, Users } from "lucide-react";
import { HourglassTimer } from "./HourglassTimer";
import Modal from "./Modal";

interface ApiResult {
    success: boolean;
    message?: string;
    room?: GameRoom;
}
interface GuestView {
    setRoom: Dispatch<SetStateAction<GameRoom | null>>;
    setWord: Dispatch<SetStateAction<string>>;
    setError: Dispatch<SetStateAction<string>>;
}

export default function PlayerView({ setRoom, setWord, setError }: GuestView) {
    const gameValues = useContext(GameValuesContext);

    if (!gameValues) {
        throw new Error("GameValuesProvider is missing");
    }

    const { player, error, room, timeLeft, word } = gameValues;

    const handleLeaveGame = () => {
        if (!confirm("Vai tiešām vēlaties pamest spēli!?")) {
            return;
        }

        localStorage.removeItem("aliasRoomCode");
        setRoom(null);
        setWord("");
        setError("");
    };

    const handleEndGame = () => {
        if (!confirm("Vai tiešām vēlaties beigt spēli!?")) {
            return;
        }
        request("game:end");

        localStorage.removeItem("aliasRoomCode");
        setRoom(null);
        setWord("");
        setError("");
    };

    const request = (event: string, payload?: unknown) => {
        setError("");

        socket.emit(event, ...(payload !== undefined ? [payload] : []), (result: ApiResult) => {
            //console.log("SERVER RESPONSE:", result);

            if (result?.success === false) {
                setError(result.message || "Kaut kas neizdevās!");
            }

            if (result?.room) {
                setRoom(result.room);
            }
        });
    };

    const handleSelectTeam = (team: Team) => {
        request("team:choose", team);
    };
    const handleStartGame = () => {
        request("game:start");
    };

    const handleResumeGame = () => {
        request("game:resume");
    };

    const handleSkip = () => {
        request("game:skip");
    };

    const handleGuessed = () => {
        request("game:correct");
    };

    const redPlayers = room.players.filter((p) => p.team === "red");
    const bluePlayers = room.players.filter((p) => p.team === "blue");

    return (
        <>
            {room.status === "waiting" && (
                <div className="flex-1 flex flex-col bg-white overflow-hidden">
                    {/* Augšējā josla + Istabas Nr. un Komanda */}
                    <header className="bg-white px-4 pt-4 pb-3 border-b border-red-100 shadow-xs">
                        <div className="flex items-center justify-between gap-2">
                            {/* Poga Pamest spēli */}
                            <button
                                onClick={handleLeaveGame}
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-red-50 text-slate-700 hover:text-red-600 text-xs font-extrabold transition-colors cursor-pointer"
                            >
                                <DoorOpen className="w-3.5 h-3.5" />
                                Pamest spēli
                            </button>

                            {/* Kompakts info bloks ar Istabas Nr. un Komandu */}
                            <div className="flex items-center gap-1.5">
                                {/* <button
                    onClick={handleCopyRoomCode}
                    className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-red-600 text-white text-xs font-extrabold tracking-wider cursor-pointer active:scale-95 transition-transform"
                  >
                    <span>#{room.roomCode}</span>
                    {copiedCode ? (
                      <CheckCircle2 className="w-3.5 h-3.5 text-white" />
                    ) : (
                      <Copy className="w-3.5 h-3.5 text-red-200" />
                    )}
                  </button> */}
                                <span>#{room.code}</span>

                                <div
                                    className={`px-2.5 py-1.5 rounded-xl text-xs font-extrabold uppercase text-white ${
                                        player.team === "red"
                                            ? "bg-red-500"
                                            : player.team === "blue"
                                              ? "bg-blue-600"
                                              : "bg-slate-400"
                                    }`}
                                >
                                    {player.team === "red" ? "Red" : player?.team === "blue" ? "Blue" : "—"}
                                </div>
                            </div>
                        </div>

                        {/* Galvenais statusa paziņojums uz ekrāna */}
                        <div className="mt-3 text-center">
                            <h2 className="alias-display-font text-2xl font-bold text-slate-900">
                                Izvēlies savu komandu
                            </h2>
                            <p className="text-xs text-slate-500 mt-0.5 font-medium">
                                Spēlētājs: <strong className="text-slate-900">{player.nickname}</strong>{" "}
                                {player.isHost && <span className="text-red-600 font-bold">(Istabas admins)</span>}
                            </p>
                        </div>
                    </header>

                    {/* Komandu izvēles kartītes */}
                    <div className="flex-1 p-4 overflow-y-auto space-y-4 bg-slate-50/70">
                        {error && (
                            <div className="p-3 rounded-2xl bg-red-50 border border-red-200 text-red-700 text-xs font-bold text-center">
                                {error}
                            </div>
                        )}

                        <div className="grid grid-cols-2 gap-3">
                            {/* RED KOMANDA */}
                            <div
                                onClick={() => handleSelectTeam("red")}
                                className={`rounded-3xl p-3.5 border-2 transition-all cursor-pointer flex flex-col ${
                                    player.team === "red"
                                        ? "bg-red-50 border-red-600 shadow-md shadow-red-500/15"
                                        : "bg-white border-slate-200 hover:border-red-300"
                                }`}
                            >
                                <div className="flex items-center justify-between mb-2">
                                    <span className="px-2.5 py-1 rounded-lg bg-red-600 text-white text-xs font-extrabold uppercase tracking-wider">
                                        RED
                                    </span>
                                    <span className="text-xs font-bold text-slate-400 flex items-center gap-1">
                                        <Users className="w-3.5 h-3.5" /> {redPlayers.length}
                                    </span>
                                </div>

                                <div className="space-y-1.5 flex-1 min-h-[130px]">
                                    {redPlayers.map((p) => (
                                        <div
                                            key={p.id}
                                            className={`px-2.5 py-2 rounded-xl text-xs font-bold flex items-center justify-between ${
                                                p.id === player.id
                                                    ? "bg-red-600 text-white shadow-xs"
                                                    : "bg-red-100/70 text-red-950"
                                            }`}
                                        >
                                            <span className="truncate">{p.nickname}</span>
                                            {p.isHost && (
                                                <Crown className={`w-3.5 h-3.5 shrink-0 ${"text-amber-500"}`} />
                                            )}
                                        </div>
                                    ))}
                                </div>

                                <button
                                    type="button"
                                    className={`mt-3 w-full py-2 rounded-xl text-xs font-extrabold transition-colors ${
                                        player.team === "red" ? "bg-red-600 text-white" : "bg-red-100 text-red-700"
                                    }`}
                                >
                                    {player.team === "red" ? "✓ Izvēlēta" : "Pievienoties Red"}
                                </button>
                            </div>

                            {/* BLUE KOMANDA */}
                            <div
                                onClick={() => handleSelectTeam("blue")}
                                className={`rounded-3xl p-3.5 border-2 transition-all cursor-pointer flex flex-col ${
                                    player.team === "blue"
                                        ? "bg-blue-50 border-blue-600 shadow-md shadow-blue-500/15"
                                        : "bg-white border-slate-200 hover:border-blue-300"
                                }`}
                            >
                                <div className="flex items-center justify-between mb-2">
                                    <span className="px-2.5 py-1 rounded-lg bg-blue-600 text-white text-xs font-extrabold uppercase tracking-wider">
                                        BLUE
                                    </span>
                                    <span className="text-xs font-bold text-slate-400 flex items-center gap-1">
                                        <Users className="w-3.5 h-3.5" /> {bluePlayers.length}
                                    </span>
                                </div>

                                <div className="space-y-1.5 flex-1 min-h-[130px]">
                                    {bluePlayers.map((p) => (
                                        <div
                                            key={p.id}
                                            className={`px-2.5 py-2 rounded-xl text-xs font-bold flex items-center justify-between ${
                                                p.id === player.id
                                                    ? "bg-blue-600 text-white shadow-xs"
                                                    : "bg-blue-100/70 text-blue-950"
                                            }`}
                                        >
                                            <span className="truncate">{p.nickname}</span>
                                            {p.isHost && (
                                                <Crown className={`w-3.5 h-3.5 shrink-0 ${"text-amber-500"}`} />
                                            )}
                                        </div>
                                    ))}
                                </div>

                                <button
                                    type="button"
                                    className={`mt-3 w-full py-2 rounded-xl text-xs font-extrabold transition-colors ${
                                        player.team === "blue" ? "bg-blue-600 text-white" : "bg-blue-100 text-blue-700"
                                    }`}
                                >
                                    {player.team === "blue" ? "✓ Izvēlēta" : "Pievienoties Blue"}
                                </button>
                            </div>
                        </div>

                        {/* Vizualizācija par izvēlēto komandu uz ekrāna */}
                        <div
                            className={`p-3 rounded-2xl text-center font-bold text-xs border ${
                                player.team === "red"
                                    ? "bg-red-50 border-red-200 text-red-700"
                                    : "bg-blue-50 border-blue-200 text-blue-700"
                            }`}
                        >
                            Tu spēlē{" "}
                            <span className="uppercase font-extrabold underline">
                                {player.team === "red" ? "Red (Sarkanajā)" : "Blue (Zilajā)"}
                            </span>{" "}
                            komandā • Istaba <span className="font-extrabold">#{room.code}</span>
                        </div>
                    </div>

                    {/* Apakšējā zona: Poga Sākt spēli (tikai istabas izveidotājam) */}
                    <div className="p-4 bg-white border-t border-slate-200 space-y-2">
                        {player.isHost ? (
                            <button
                                onClick={handleStartGame}
                                className="btn-tactile w-full py-4 rounded-2xl bg-red-600 hover:bg-red-500 text-white font-extrabold text-base shadow-[0_5px_0_#991B1B] flex items-center justify-center gap-2 cursor-pointer"
                            >
                                <Play className="w-5 h-5 fill-current" />
                                Sākt spēli
                            </button>
                        ) : (
                            <div className="w-full py-3.5 px-4 rounded-2xl bg-red-50 border border-red-100 text-red-700 font-bold text-xs text-center flex items-center justify-center gap-2">
                                <span className="w-2 h-2 rounded-full bg-red-600 animate-ping" />
                                Gaida, kad istabas izveidotājs palaidīs spēli...
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* ============================================================
                 AKTĪVĀ SPĒLE (Taimeris, Punkti, Vārds, Pogas)
           ============================================================ */}

            {room.status === "playing" && (
                <div className="flex-1 flex flex-col bg-slate-50 relative overflow-hidden">
                    {/* AUGŠPUSE: Pamest spēli / Beigt spēli + Komandas info un punkti */}
                    <header className="bg-white px-4 pt-3.5 pb-3 border-b border-red-100 shadow-xs">
                        {/* Rinda 1: Vadības pogas (Pamest spēli visiem, Beigt spēli adminam) */}
                        <div className="flex items-center justify-between gap-2 mb-2.5">
                            <button
                                onClick={handleLeaveGame}
                                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-[11px] font-extrabold transition-colors cursor-pointer"
                            >
                                <DoorOpen className="w-3.5 h-3.5" />
                                Pamest spēli
                            </button>

                            <span className="text-[11px] font-extrabold text-slate-500">
                                #{room.code} {/*• {room.roundNumber}. raunds */}
                            </span>

                            {player.isHost ? (
                                <button
                                    onClick={handleEndGame}
                                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-red-100 hover:bg-red-200 text-red-700 text-[11px] font-extrabold transition-colors cursor-pointer"
                                >
                                    <Flag className="w-3 h-3" />
                                    Beigt spēli
                                </button>
                            ) : (
                                <div className="w-16" />
                            )}
                        </div>

                        {/* Rinda 2: Spēlētāja komandas josla */}
                        <div className="flex items-center justify-center gap-1.5 text-xs font-extrabold mb-2.5 py-1 px-3 rounded-xl bg-slate-50 border border-slate-100">
                            <span
                                className={`w-2.5 h-2.5 rounded-full ${
                                    player.team === "red" ? "bg-red-600" : "bg-blue-600"
                                }`}
                            />
                            <span className="text-slate-700 uppercase">
                                Tava komanda: {player.team === "red" ? "RED" : "BLUE"}
                            </span>
                        </div>

                        {/* Rinda 3: Kopējie punkti abām komandām */}
                        <div className="grid grid-cols-2 gap-2.5">
                            <div
                                className={`flex items-center justify-between px-3.5 py-2 rounded-2xl border-2 transition-all ${
                                    room.currentTeam === "red"
                                        ? "bg-red-600 text-white border-red-700 shadow-md shadow-red-600/20"
                                        : "bg-red-50 text-red-900 border-red-100"
                                }`}
                            >
                                <span className="text-xs font-extrabold uppercase tracking-wider">RED</span>
                                <span className="alias-display-font text-2xl font-bold leading-none">
                                    {room.scores.red}
                                </span>
                            </div>

                            <div
                                className={`flex items-center justify-between px-3.5 py-2 rounded-2xl border-2 transition-all ${
                                    room.currentTeam === "blue"
                                        ? "bg-blue-600 text-white border-blue-700 shadow-md shadow-blue-600/20"
                                        : "bg-blue-50 text-blue-900 border-blue-100"
                                }`}
                            >
                                <span className="text-xs font-extrabold uppercase tracking-wider">BLUE</span>
                                <span className="alias-display-font text-2xl font-bold leading-none">
                                    {room.scores.blue}
                                </span>
                            </div>
                        </div>
                    </header>

                    {/* VIDUS: Smilšu pulkstenis, laika atskaite, raunda punkti un vārda kartīte */}
                    <main className="flex-1 flex flex-col items-center justify-between p-4">
                        {/* Smilšu pulkstenis + Laika atskaite */}
                        <HourglassTimer
                            timeLeft={timeLeft}
                            totalTime={room.totalMsPerRound}
                            isRunning={room.status === "playing"}
                        />

                        {/* Pa vidu: Cik punkti sakrāti šajā raundā */}
                        <div className="inline-flex items-center gap-2 px-4 py-1 rounded-full bg-white border border-red-100 shadow-xs">
                            <span className="text-xs font-bold text-slate-500 uppercase tracking-wide">
                                Šajā raundā:
                            </span>
                            <span className="alias-display-font text-lg font-bold text-red-600">
                                {room.scorePerRound}
                            </span>
                        </div>

                        {/* Vārda kartīte (atkarībā no tā, vai ir kārta minēt/skaidrot) */}
                        {player.isMyTurn ? (
                            <div
                                //key={cardAnimKey}
                                className="animate-card-pop w-full my-auto py-9 px-5 rounded-3xl bg-white border-2 border-red-100 border-b-8 border-b-red-600 shadow-xl flex flex-col items-center justify-center text-center relative"
                            >
                                <span
                                    className={`absolute top-3.5 px-3 py-0.5 rounded-full text-[11px] font-extrabold uppercase tracking-widest ${
                                        room.currentTeam === "red"
                                            ? "bg-red-100 text-red-600"
                                            : "bg-blue-100 text-blue-600"
                                    }`}
                                >
                                    Izskaidro vārdu!
                                </span>

                                <h3 className="alias-display-font text-3xl sm:text-4xl font-bold text-slate-900 tracking-wide mt-3 break-words max-w-full">
                                    {word}
                                </h3>
                            </div>
                        ) : (
                            /* Skats pārējiem spēlētājiem, kamēr cita komanda/spēlētājs min */
                            <div className="w-full my-auto py-9 px-6 rounded-3xl bg-white border-2 border-red-100 text-slate-900 shadow-lg flex flex-col items-center justify-center text-center">
                                <Eye className="w-10 h-10 text-red-600 mb-3 animate-bounce" />
                                <h3 className="alias-display-font text-2xl font-bold">
                                    Min{" "}
                                    <span className={room.currentTeam === "red" ? "text-red-600" : "text-blue-600"}>
                                        {room.currentTeam === "red" ? "RED" : "BLUE"}
                                    </span>{" "}
                                    komanda!
                                </h3>
                                <p className="text-xs text-slate-500 mt-2 leading-relaxed">
                                    Klausies uzmanīgi un seko līdzi laikam. Vārds redzams tikai aktīvajam skaidrotājam.
                                </p>
                            </div>
                        )}

                        {/* APAKŠPUSE: 2 lielas pogas - Izlaist vai Uzminēts +1 */}
                        {player.isMyTurn ? (
                            <div className="w-full grid grid-cols-2 gap-3 pt-2">
                                <button
                                    onClick={handleSkip}
                                    //disabled={}
                                    className="btn-tactile py-4 px-3 rounded-2xl bg-white hover:bg-red-50 text-red-600 border-2 border-red-600 font-extrabold text-base shadow-[0_5px_0_#FCA5A5] flex flex-col items-center justify-center gap-1 cursor-pointer disabled:opacity-50"
                                >
                                    <SkipForward className="w-6 h-6" />
                                    <span>Izlaist</span>
                                </button>

                                <button
                                    onClick={handleGuessed}
                                    //disabled={room.isPaused}
                                    className="btn-tactile py-4 px-3 rounded-2xl bg-red-600 hover:bg-red-500 text-white font-extrabold text-base shadow-[0_5px_0_#991B1B] flex flex-col items-center justify-center gap-1 cursor-pointer disabled:opacity-50"
                                >
                                    <Check className="w-6 h-6 stroke-3" />
                                    <span>Uzminēts +1</span>
                                </button>
                            </div>
                        ) : (
                            <div className="w-full py-4 text-center text-xs font-bold text-slate-400">
                                Gatavojies nākamajam gājienam!
                            </div>
                        )}
                    </main>
                </div>
            )}

            {/* ============================================================
               SKATS: PAUSE MODAL (Kad raunds beidzas)
               ============================================================ */}
            {room.status === "paused" && (
                <Modal
                    isHost={player.isHost}
                    scores={room.scores}
                    scorePerRound={room.scorePerRound}
                    currentTeam={room.currentTeam}
                    usedRoundWords={room.usedRoundWords}
                    handleLeaveGame={handleLeaveGame}
                    handleResumeGame={handleResumeGame}
                    handleEndGame={handleEndGame}
                ></Modal>
            )}

            {room.status === "finished" && (
                <div className="flex-1 flex flex-col justify-between p-6 bg-gradient-to-b from-red-600 to-rose-700 text-white text-center">
                    <div className="pt-8">
                        <div className="w-16 h-16 rounded-3xl bg-white text-red-600 flex items-center justify-center mx-auto mb-4 shadow-lg">
                            <Trophy className="w-9 h-9" />
                        </div>
                        <h2 className="alias-display-font text-4xl font-bold">Spēle pabeigta!</h2>
                        <p className="text-red-100 text-xs font-semibold mt-1">Istaba #{room.code} • Gala rezultāts</p>
                    </div>

                    <div className="bg-white text-slate-900 rounded-3xl p-6 shadow-xl space-y-4">
                        <div className="text-sm font-extrabold uppercase tracking-wider text-red-600">
                            {room.scores.red > room.scores.blue
                                ? "🏆 Uzvar RED komanda!"
                                : room.scores.blue > room.scores.red
                                  ? "🏆 Uzvar BLUE komanda!"
                                  : "🤝 Neizšķirts!"}
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                            <div className="p-4 rounded-2xl bg-red-50 border-2 border-red-200">
                                <div className="text-xs font-extrabold text-red-600">RED</div>
                                <div className="alias-display-font text-4xl font-bold text-red-900 mt-1">
                                    {room.scores.red}
                                </div>
                            </div>
                            <div className="p-4 rounded-2xl bg-blue-50 border-2 border-blue-200">
                                <div className="text-xs font-extrabold text-blue-600">BLUE</div>
                                <div className="alias-display-font text-4xl font-bold text-blue-900 mt-1">
                                    {room.scores.blue}
                                </div>
                            </div>
                        </div>
                    </div>

                    <button
                        onClick={() => window.location.reload()}
                        className="btn-tactile w-full py-4 rounded-2xl bg-white text-red-600 font-extrabold text-base shadow-[0_5px_0_#991B1B] cursor-pointer"
                    >
                        Atgriezties sākumā
                    </button>
                </div>
            )}
        </>
    );
}
