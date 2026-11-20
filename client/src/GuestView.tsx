import { BookOpen, Crown, Hourglass, ShieldAlert, Sparkles, UserPlus } from 'lucide-react';
import { socket } from "./socket";
import {type GameRoom } from './App';
import {useEffect, useEffectEvent, useState, type Dispatch, type SetStateAction } from 'react';
import { HourglassTimer } from './HourglassTimer';

interface ApiResult {
  success: boolean;
  message?: string;
  room?: GameRoom;
}

interface GuestView {
  nickname:string;
  playerId:string;
  error:string;
  roomCode:string;
   setRoom: Dispatch<SetStateAction<GameRoom | null>>;
   setRoomCode: Dispatch<SetStateAction<string>>;
   setError: Dispatch<SetStateAction<string>>;
   setNickname: Dispatch<SetStateAction<string>>;
}

export default function GuestView({nickname, playerId, error, roomCode, setRoom, setRoomCode, setError, setNickname}: GuestView) {
   
     const handleCreateGame = () => {
        if (!nickname.trim()) return setError("Vispirms ievadi savu iesauku.");
        socket.emit("game:create", {playerId, nickname}, (result: ApiResult) => {
          if (!result?.success || !result.room) return setError(result?.message || "Neizdevās izveidot istabu.");
          localStorage.setItem("aliasRoomCode", result.room.code);
          setRoom(result.room);
          setRoomCode(result.room.code);
          setError("");
        });
      };

    const handleJoinGame = () => {
        if (!nickname.trim()) return setError("Vispirms ievadi savu iesauku.");
        if (!roomCode.trim()) return setError("Ievadi istabas kodu.");

        socket.emit("game:join", {playerId, nickname, code: roomCode.trim() }, (result: ApiResult) => {
          if (!result?.success || !result.room) return setError(result?.message || "Neizdevās pievienoties.");
          localStorage.setItem("aliasRoomCode", result.room.code);
          setRoom(result.room);
          setError("");
        });
      };

     

  return (
    
          <div className="flex-1 flex flex-col justify-between bg-white text-slate-900 overflow-y-auto">
            {/* Sarkana augšējā galvene ar klasisku Alias dizainu */}
            <div className="bg-gradient-to-br from-red-600 via-red-600 to-rose-700 text-white pt-8 pb-12 px-6 rounded-b-[40px] shadow-lg relative overflow-hidden">
              {/* Dekoratīvi balti apļi fonā */}
              <div className="absolute -top-10 -right-10 w-36 h-36 rounded-full bg-white/10 pointer-events-none" />
              <div className="absolute -bottom-8 -left-8 w-28 h-28 rounded-full bg-white/10 pointer-events-none" />

              <div className="flex items-center justify-between mb-4 relative z-10">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/15 backdrop-blur-xs text-[11px] font-extrabold uppercase tracking-wider border border-white/25">
                  <Sparkles className="w-3.5 h-3.5 text-white" />
                  Multiplayer
                </span>

                {/* Poga uz spēles noteikumiem */}
                <button
                  type="button"
                  onClick={() => {
                    // setErrorMsg('');
                    // setScreen('rules');
                  }}
                  className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-white text-red-600 hover:bg-red-50 text-xs font-extrabold shadow-sm transition-transform active:scale-95 cursor-pointer"
                >
                  <BookOpen className="w-3.5 h-3.5" />
                  Noteikumi
                </button>
              </div>

              <div className="text-center relative z-10">
                <div className="inline-block bg-white text-red-600 px-6 py-2 rounded-2xl shadow-md mb-2 transform -rotate-2">
                  <h1 className="alias-display-font text-5xl font-bold tracking-tight">
                    ALIAS
                  </h1>
                </div>
                <p className="text-red-100 text-xs font-semibold mt-2 max-w-[260px] mx-auto leading-relaxed">
                  Skaidro vārdus, sacenties komandās un uzvari laika skrējienā!
                </p>
              </div>
            </div>

            {/* Galvenā baltā formas zona */}
            <div className="px-6 -mt-6 flex-1 flex flex-col justify-center">
              <div className="bg-white rounded-3xl p-5 shadow-[0_10px_35px_-5px_rgba(220,38,38,0.14)] border border-red-100">
                {error && (
                  <div className="mb-4 p-3 rounded-2xl bg-red-50 border border-red-200 text-red-600 text-xs font-bold flex items-center gap-2">
                    <ShieldAlert className="w-4 h-4 shrink-0" />
                    <span>{error}</span>
                  </div>
                )}

                {/* Iesaukas ievade */}
                <div className="mb-4">
                  <label className="block text-[11px] font-extrabold uppercase tracking-wider text-slate-500 mb-1.5">
                    1. Tava iesauka
                  </label>
                  <input
                    type="text"
                    maxLength={16}
                    placeholder="Ievadi savu vārdu..."
                    value={nickname}
                    onChange={(e) => setNickname(e.target.value)}
                    className="w-full px-4 py-3.5 rounded-2xl bg-slate-50 border-2 border-slate-200 focus:border-red-500 focus:bg-white focus:outline-none font-bold text-slate-900 text-base transition-colors"
                  />
                </div>

                {/* Poga: Izveidot spēli */}
                <button
                  onClick={handleCreateGame}
                  className="btn-tactile w-full py-4 rounded-2xl bg-red-600 hover:bg-red-500 text-white font-extrabold text-base shadow-[0_5px_0_#991B1B] flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Crown className="w-5 h-5 text-amber-200" />
                  Izveidot spēli
                </button>

                {/* Atdalītājs */}
                <div className="relative my-5 flex items-center justify-center">
                  <div className="border-t border-slate-200 w-full" />
                  <span className="bg-white px-3 text-[11px] font-extrabold text-slate-400 uppercase tracking-wider">
                    vai pievienojies
                  </span>
                  <div className="border-t border-slate-200 w-full" />
                </div>

                {/* Istabas kods + Pievienoties */}
                <form onSubmit={handleJoinGame} className="space-y-3">
                  <div>
                    <label className="block text-[11px] font-extrabold uppercase tracking-wider text-slate-500 mb-1.5">
                      Istabas kods
                    </label>
                    <input
                      type="text"
                      maxLength={6}
                      placeholder="Piem., LV842"
                      value={roomCode}
                      onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
                      className="w-full px-4 py-3 rounded-2xl bg-slate-50 border-2 border-slate-200 focus:border-red-500 focus:bg-white focus:outline-none font-extrabold text-center tracking-widest uppercase text-slate-900 text-base"
                    />
                  </div>
                  <button
                    type="submit"
                    className="btn-tactile w-full py-3.5 rounded-2xl bg-white hover:bg-red-50 text-red-600 border-2 border-red-600 font-extrabold text-sm shadow-[0_4px_0_#FCA5A5] flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <UserPlus className="w-4 h-4" />
                    Pievienoties spēlei
                  </button>
                </form>
              </div>
            </div>

            {/* Apakšējā poga noteikumiem un kājene */}
            <div className="px-6 py-4 text-center">
              <button
                type="button"
                onClick={() => {
                  //setErrorMsg('');
                  //setScreen('rules');
                }}
                className="text-xs font-extrabold text-red-600 hover:text-red-700 underline underline-offset-4 cursor-pointer"
              >
                Kā spēlēt? Skatīt spēles noteikumus
              </button>
            </div>
          </div>
        )
  
}
