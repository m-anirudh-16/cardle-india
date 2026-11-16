import React, { useEffect, useState } from 'react';
import { Car, Loader2 } from 'lucide-react';
import { PuzzleCar } from '../data/puzzleDeck';
import { getZoomTransform, MAX_GUESSES, ZOOM_SCALES } from '../utils/gameLogic';

interface CarViewportProps {
  car: PuzzleCar | null;
  loading: boolean;
  guessesCount: number;
  isFinished: boolean;
  isWon: boolean;
  onRetryImage?: () => void;
  contextLabel: string;
}

export const CarViewport: React.FC<CarViewportProps> = ({
  car,
  loading,
  guessesCount,
  isFinished,
  isWon,
  onRetryImage,
  contextLabel,
}) => {
  const [imgError, setImgError] = useState(false);

  useEffect(() => {
    setImgError(false);
  }, [car?.id, car?.image]);

  const { scale, translateX, translateY } = car
    ? getZoomTransform(guessesCount, isFinished, car.focalX, car.focalY)
    : { scale: ZOOM_SCALES[0], translateX: 0, translateY: 0 };

  const activeStage = Math.min(guessesCount + 1, MAX_GUESSES);

  return (
    <section aria-label="Car photo clue" className="w-full">
      {/* Unboxed metadata strip above viewport */}
      <div className="flex items-center justify-between gap-4 mb-2.5">
        <div className="flex items-center gap-2 text-xs sm:text-sm text-slate-600 font-medium min-w-0">
          <span className="text-[#11161C] font-semibold truncate">{contextLabel}</span>
          <span aria-hidden="true" className="text-slate-300">
            ·
          </span>
          <span className="font-mono tabular-nums text-slate-600 whitespace-nowrap shrink-0">
            {loading ? 'Loading...' : isFinished ? '1.0× Full Car' : `${scale.toFixed(1)}× Zoom`}
          </span>
        </div>
      </div>

      {/* 16:9 Zoomable Image Frame */}
      <div className="relative w-full aspect-video rounded-2xl overflow-hidden bg-slate-900 border border-slate-200 shadow-sm select-none">
        {loading || !car ? (
          <div className="w-full h-full flex flex-col items-center justify-center bg-slate-900 text-slate-300 gap-3">
            <Loader2 className="w-7 h-7 animate-spin text-[#E04F22]" aria-hidden="true" />
            <p className="text-xs sm:text-sm font-medium text-slate-300">
              Finding an Indian car &amp; zooming in...
            </p>
          </div>
        ) : !imgError ? (
          <img
            key={car.id}
            src={car.image}
            alt={
              isFinished
                ? `${car.year} ${car.make} ${car.model}`
                : 'Extreme macro detail of an Indian market car'
            }
            referrerPolicy="no-referrer"
            draggable={false}
            onError={() => {
              setImgError(true);
              onRetryImage?.();
            }}
            style={{
              transformOrigin: '50% 50%',
              transform: `scale(${scale}) translate(${translateX}%, ${translateY}%)`,
            }}
            className="w-full h-full object-cover will-change-transform transition-transform duration-500 ease-[cubic-bezier(0.16,1,0.3,1)]"
          />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-slate-800 to-slate-950 text-slate-300 p-6 text-center">
            <Car className="w-12 h-12 mb-3 text-slate-500" />
            <p className="text-sm font-medium">Vehicle image unavailable</p>
          </div>
        )}

        {/* Subtle viewfinder corner reticles while zoomed in */}
        {!loading && car && !isFinished && !imgError && (
          <div className="pointer-events-none absolute inset-4 transition-opacity duration-300">
            <div className="absolute top-0 left-0 w-5 h-5 border-t-2 border-l-2 border-white/60 rounded-tl-xs" />
            <div className="absolute top-0 right-0 w-5 h-5 border-t-2 border-r-2 border-white/60 rounded-tr-xs" />
            <div className="absolute bottom-0 left-0 w-5 h-5 border-b-2 border-l-2 border-white/60 rounded-bl-xs" />
            <div className="absolute bottom-0 right-0 w-5 h-5 border-b-2 border-r-2 border-white/60 rounded-br-xs" />
          </div>
        )}

        {/* Reveal caption scrim only after round ends */}
        {!loading && car && isFinished && (
          <div className="pointer-events-none absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/85 via-black/45 to-transparent px-4 sm:px-5 pt-10 pb-3.5 flex items-end justify-between gap-4">
            <div className="min-w-0">
              <p className="text-xs font-medium text-white/80">
                {car.generation} · {car.bodyType}
              </p>
              <h2 className="font-display text-lg sm:text-xl font-bold text-white truncate">
                {car.year} {car.make} {car.model}
              </h2>
            </div>
            <span
              className={`font-mono tabular-nums text-xs font-semibold px-2.5 py-1 rounded-md shrink-0 ${
                isWon ? 'bg-emerald-600 text-white' : 'bg-slate-800/90 text-slate-200'
              }`}
            >
              {isWon ? `Solved ${guessesCount}/${MAX_GUESSES}` : 'Revealed'}
            </span>
          </div>
        )}
      </div>

      {/* 5-step zoom progress bar */}
      <div className="mt-3 flex items-center gap-2" aria-label="Zoom stages">
        {Array.from({ length: MAX_GUESSES }, (_, idx) => {
          const stepNum = idx + 1;
          const isUsed = idx < guessesCount;
          const isCurrent = !isFinished && stepNum === activeStage;
          const isWinningStep = isWon && idx === guessesCount - 1;

          let barColor = 'bg-slate-200';
          if (isWinningStep) {
            barColor = 'bg-emerald-600';
          } else if (isUsed) {
            barColor = 'bg-slate-400';
          } else if (isCurrent) {
            barColor = 'bg-[#E04F22]';
          }

          return (
            <div key={stepNum} className="flex-1 flex flex-col gap-1">
              <div className={`h-1.5 rounded-full transition-colors duration-200 ${barColor}`} />
              <span className="font-mono tabular-nums text-[11px] text-slate-500 text-center">
                {stepNum}
              </span>
            </div>
          );
        })}
      </div>
    </section>
  );
};
