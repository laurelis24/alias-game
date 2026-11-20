interface HourglassTimerProps {
  timeLeft: number;
  totalTime: number;
  isRunning: boolean;
}

export const HourglassTimer = ({ timeLeft, totalTime, isRunning }: HourglassTimerProps) => {
  const progress = Math.max(0, Math.min(1, timeLeft / totalTime)) * 1000;
  const isUrgent = timeLeft <= 10 && timeLeft > 0;
  
  return (
    <div className="flex flex-col items-center justify-center my-1">
      {/* Statisks, stabils SVG smilšu pulkstenis ar plūstošām smiltīm */}
      <div className="relative w-14 h-16 flex items-center justify-center">
        <svg viewBox="0 0 64 80" className="w-full h-full drop-shadow-sm">
          {/* Augšējais un apakšējais koka/metāla rāmis */}
          <rect x="8" y="4" width="48" height="6" rx="3" fill="#991B1B" />
          <rect x="8" y="70" width="48" height="6" rx="3" fill="#991B1B" />

          {/* Stikla kontūra */}
          <path
            d="M14 10 C14 28, 30 35, 30 40 C30 45, 14 52, 14 70 L50 70 C50 52, 34 45, 34 40 C34 35, 50 28, 50 10 Z"
            fill="#FFFFFF"
            stroke="#CBD5E1"
            strokeWidth="2.5"
          />

          {/* Augšējās smiltis (samazinās atbilstoši laikam) */}
          <clipPath id="topSandClip">
            <rect
              x="14"
              y={10 + (1 - progress) * 28}
              width="36"
              height={progress * 28}
            />
          </clipPath>
          <path
            d="M16 12 C16 27, 30 34, 32 39 C34 34, 48 27, 48 12 Z"
            fill={isUrgent ? '#DC2626' : '#F59E0B'}
            clipPath="url(#topSandClip)"
            className="transition-all duration-700 ease-linear"
          />

          {/* Krītošā smilšu strūkliņa */}
          {isRunning && timeLeft > 0 && (
            <line
              x1="32"
              y1="39"
              x2="32"
              y2="68"
              stroke={isUrgent ? '#DC2626' : '#F59E0B'}
              strokeWidth="2.5"
              strokeDasharray="3 2"
              className="animate-sand-stream"
            />
          )}

          {/* Apakšējās smiltis (uzkrājas) */}
          <clipPath id="bottomSandClip">
            <rect
              x="14"
              y={42 + progress * 26}
              width="36"
              height={(1 - progress) * 26 + 2}
            />
          </clipPath>
          <path
            d="M16 68 C16 53, 30 46, 32 41 C34 46, 48 53, 48 68 Z"
            fill={isUrgent ? '#DC2626' : '#F59E0B'}
            clipPath="url(#bottomSandClip)"
            className="transition-all duration-700 ease-linear"
          />
        </svg>
      </div>

      {/* Laika atskaite zem smilšu pulksteņa */}
      <div
        className={`mt-1 px-4 py-0.5 rounded-full font-extrabold text-xl tracking-wider tabular-nums shadow-xs transition-colors ${
          isUrgent
            ? 'bg-red-600 text-white animate-pulse'
            : 'bg-red-50 text-red-700 border border-red-200'
        }`}
      >
        00:{timeLeft.toString().padStart(2, '0')}
      </div>
    </div>
  );
};