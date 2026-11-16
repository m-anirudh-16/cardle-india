import React from 'react';
import { ArrowDown, ArrowUp, Check, SkipForward, X } from 'lucide-react';
import { EvaluatedGuess, MAX_GUESSES } from '../utils/gameLogic';

interface GuessHistoryProps {
  guesses: EvaluatedGuess[];
}

export const GuessHistory: React.FC<GuessHistoryProps> = ({ guesses }) => {
  return (
    <section aria-label="Guess history" className="rounded-2xl bg-white border border-slate-200 p-4 sm:p-5">
      <div className="grid grid-cols-12 gap-2 pb-2.5 border-b border-slate-100 text-xs font-semibold text-slate-500">
        <div className="col-span-4">Make</div>
        <div className="col-span-5">Model</div>
        <div className="col-span-3 text-right">Year</div>
      </div>

      <div className="divide-y divide-slate-100">
        {Array.from({ length: MAX_GUESSES }, (_, idx) => {
          const guess = guesses[idx];

          if (!guess) {
            return (
              <div
                key={`empty-${idx}`}
                className="grid grid-cols-12 gap-2 py-3 items-center text-xs text-slate-400"
              >
                <div className="col-span-12 font-mono tabular-nums">
                  Attempt {idx + 1} of {MAX_GUESSES}
                </div>
              </div>
            );
          }

          if (guess.type === 'skip') {
            return (
              <div
                key={`skip-${idx}`}
                className="grid grid-cols-12 gap-2 py-2.5 items-center text-xs text-slate-500"
              >
                <div className="col-span-12 flex items-center gap-2 font-medium">
                  <SkipForward className="w-3.5 h-3.5 text-slate-400 shrink-0" aria-hidden="true" />
                  <span>Skipped — zoomed out</span>
                </div>
              </div>
            );
          }

          return (
            <div key={`guess-${idx}`} className="grid grid-cols-12 gap-2 py-2.5 items-center">
              {/* Make */}
              <div className="col-span-4 min-w-0">
                <div
                  className={`inline-flex items-center gap-1.5 max-w-full rounded-lg px-2 py-1 text-xs font-semibold border ${
                    guess.makeCorrect
                      ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                      : 'bg-red-50 text-red-800 border-red-200'
                  }`}
                >
                  {guess.makeCorrect ? (
                    <Check className="w-3.5 h-3.5 shrink-0" aria-label="Correct" />
                  ) : (
                    <X className="w-3.5 h-3.5 shrink-0" aria-label="Incorrect" />
                  )}
                  <span className="truncate">{guess.make}</span>
                </div>
              </div>

              {/* Model */}
              <div className="col-span-5 min-w-0">
                <div
                  className={`inline-flex items-center gap-1.5 max-w-full rounded-lg px-2 py-1 text-xs font-semibold border ${
                    guess.modelCorrect
                      ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                      : 'bg-red-50 text-red-800 border-red-200'
                  }`}
                >
                  {guess.modelCorrect ? (
                    <Check className="w-3.5 h-3.5 shrink-0" aria-label="Correct" />
                  ) : (
                    <X className="w-3.5 h-3.5 shrink-0" aria-label="Incorrect" />
                  )}
                  <span className="truncate">{guess.model}</span>
                </div>
              </div>

              {/* Year with ±2 acceptance & directional guidance */}
              <div className="col-span-3 flex justify-end">
                <div
                  className={`inline-flex items-center gap-1 rounded-lg px-2 py-1 font-mono tabular-nums text-xs font-semibold border ${
                    guess.yearCorrect
                      ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                      : 'bg-amber-50 text-amber-800 border-amber-200'
                  }`}
                  title={
                    guess.yearExact
                      ? 'Exact year'
                      : guess.yearCorrect
                        ? 'Accepted (within ±2 years)'
                        : guess.yearDirection === 'higher'
                          ? 'Target car is newer'
                          : 'Target car is older'
                  }
                >
                  <span>{guess.year}</span>
                  {guess.yearExact && <Check className="w-3.5 h-3.5 shrink-0" aria-label="Exact year" />}
                  {!guess.yearExact && guess.yearCorrect && (
                    <span className="text-[10px] font-sans font-bold">±2</span>
                  )}
                  {guess.yearDirection === 'higher' && (
                    <ArrowUp className="w-3.5 h-3.5 shrink-0" aria-label="Newer year" />
                  )}
                  {guess.yearDirection === 'lower' && (
                    <ArrowDown className="w-3.5 h-3.5 shrink-0" aria-label="Older year" />
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
};
