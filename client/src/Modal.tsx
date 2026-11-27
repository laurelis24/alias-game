import { DoorOpen, Flag, Play, Trophy } from "lucide-react";
import type { Team } from "./App";
import { useState } from "react";

interface ModalProps {
    isHost: boolean;
    scores: Record<Team, number>;
    scorePerRound: number;
    currentTeam: Team;
    usedRoundWords: { word: string; guessed: boolean }[];
    handleLeaveGame: () => void;
    handleResumeGame: () => void;
    handleEndGame: () => void;
}

export default function Modal({
    isHost,
    scorePerRound,
    currentTeam,
    scores,
    usedRoundWords,
    handleResumeGame,
    handleLeaveGame,
    handleEndGame,
}: ModalProps) {
    const [isOpen, setIsOpen] = useState(false);

    return (
        <div className="absolute inset-0 z-30 bg-slate-900/75 backdrop-blur-xs flex items-center justify-center p-5 animate-card-pop">
            <div className="w-full bg-white rounded-3xl p-6 shadow-2xl text-center border-2 border-red-100">
                <div className="w-14 h-14 rounded-2xl bg-red-100 text-red-600 flex items-center justify-center mx-auto mb-3">
                    <Trophy className="w-8 h-8" />
                </div>

                <h2 className="alias-display-font text-3xl font-bold text-slate-900">Raunds noslēdzies!</h2>
                <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mt-1">
                    {currentTeam === "red" ? "RED komanda" : "BLUE komanda"} ieguva
                </p>

                {/* Raunda punktu izcēlums */}
                <div className="my-4 py-3 px-4 rounded-2xl bg-red-50 border border-red-100">
                    <span className="alias-display-font text-4xl font-bold text-red-600">
                        +{scorePerRound} {scorePerRound === 1 ? "punkts" : "punkti"}
                    </span>
                </div>

                {/* Kopējais rezultāts */}
                <div className="grid grid-cols-2 gap-3 mb-5">
                    <div className="p-3 rounded-2xl bg-red-50 border border-red-200">
                        <div className="text-xs font-extrabold text-red-600">RED KOPĀ</div>
                        <div className="alias-display-font text-2xl font-bold text-red-900">{scores.red}</div>
                    </div>
                    <div className="p-3 rounded-2xl bg-blue-50 border border-blue-200">
                        <div className="text-xs font-extrabold text-blue-600">BLUE KOPĀ</div>
                        <div className="alias-display-font text-2xl font-bold text-blue-900">{scores.blue}</div>
                    </div>
                </div>

                <div className="w-full rounded-xl">
                    <button
                        type="button"
                        disabled={usedRoundWords.length === 0}
                        onClick={() => setIsOpen(!isOpen)}
                        className="flex w-full items-center justify-between p-3 text-left hover:bg-gray-50"
                        aria-expanded={isOpen}
                    >
                        <div>
                            <span className="font-semibold text-gray-800">Vārdi</span>
                            <span className="ml-2 text-sm text-gray-500">({usedRoundWords.length})</span>
                        </div>

                        <span className="flex h-7 w-7 items-center justify-center rounded-full bg-gray-100 text-lg font-bold">
                            {isOpen ? "−" : "+"}
                        </span>
                    </button>

                    {isOpen && (
                        <div className="max-h-64 overflow-y-auto border border-red-300 border-y-0">
                            <ul className="divide-y divide-gray-100">
                                {usedRoundWords.map((list, index) => (
                                    <li
                                        key={`${list.word}-${index}`}
                                        className="flex items-center justify-between px-4 py-2.5 text-sm"
                                    >
                                        <span className={list.guessed ? "text-green-500" : "text-red-500"}>
                                            {list.word}
                                        </span>
                                        <span className="text-xs text-gray-400">#{index + 1}</span>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}
                </div>

                {/* Pogas: Turpināt un Beigt spēli (adminam) / Pamest spēli */}
                {isHost ? (
                    <div className="space-y-2.5">
                        <button
                            onClick={handleResumeGame}
                            className="btn-tactile w-full py-4 rounded-2xl bg-red-600 hover:bg-red-500 text-white font-extrabold text-base shadow-[0_5px_0_#991B1B] flex items-center justify-center gap-2 cursor-pointer"
                        >
                            <Play className="w-5 h-5 fill-current" />
                            Turpināt
                        </button>

                        <button
                            onClick={handleEndGame}
                            className="w-full py-2.5 rounded-xl bg-slate-100 hover:bg-red-50 text-slate-600 hover:text-red-600 font-extrabold text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                        >
                            <Flag className="w-3.5 h-3.5" />
                            Beigt spēli
                        </button>
                    </div>
                ) : (
                    <div className="space-y-3">
                        <div className="p-3.5 rounded-2xl bg-red-50 text-red-700 text-xs font-bold">
                            Gaida, kad istabas izveidotājs nospiedīs <span className="underline">Turpināt</span>...
                        </div>
                        <button
                            onClick={handleLeaveGame}
                            className="w-full py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-extrabold text-xs flex items-center justify-center gap-1.5 cursor-pointer"
                        >
                            <DoorOpen className="w-3.5 h-3.5" />
                            Pamest spēli
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}
