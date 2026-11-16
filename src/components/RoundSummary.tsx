import React, { useEffect, useState } from 'react';
import { ArrowRight, BookOpen, Check, Loader2, Share2 } from 'lucide-react';
import { PuzzleCar } from '../data/puzzleDeck';
import { fetchCarSpotterNotes } from '../utils/carTrivia';
import { buildShareText, EvaluatedGuess, MAX_GUESSES } from '../utils/gameLogic';

interface RoundSummaryProps {
  mode: 'daily' | 'practice';
  puzzleNumber: number;
  car: PuzzleCar;
  guesses: EvaluatedGuess[];
  won: boolean;
  onNextPracticeCar: () => void;
  onSwitchToPractice: () => void;
}

export const RoundSummary: React.FC<RoundSummaryProps> = ({
  mode,
  puzzleNumber,
  car,
  guesses,
  won,
  onNextPracticeCar,
  onSwitchToPractice,
}) => {
  const [copied, setCopied] = useState(false);
  const [spotterNotes, setSpotterNotes] = useState<string | null>(null);
  const [notesLoading, setNotesLoading] = useState(false);
  const [notesError, setNotesError] = useState<string | null>(null);

  useEffect(() => {
    setSpotterNotes(null);
    setNotesLoading(false);
    setNotesError(null);
  }, [car.id]);

  const handleShare = async () => {
    const text = buildShareText(mode, puzzleNumber, guesses, won, car);
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2200);
    } catch {
      // Fallback ignored in restricted frames
    }
  };

  const handleLoadSpotterNotes = async () => {
    if (notesLoading || spotterNotes) return;
    setNotesLoading(true);
    setNotesError(null);
    try {
      const notes = await fetchCarSpotterNotes({
        make: car.make,
        model: car.model,
        year: car.year,
        generation: car.generation,
        bodyType: car.bodyType,
      });
      setSpotterNotes(notes);
    } catch (err) {
      setNotesError(
        err instanceof Error ? err.message : 'Unable to load Indian market spotter notes right now.'
      );
    } finally {
      setNotesLoading(false);
    }
  };

  return (
    <section
      aria-label="Round result"
      className="rounded-2xl bg-white border border-slate-200 p-5 space-y-4"
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p
            className={`text-xs font-bold ${
              won ? 'text-emerald-700' : 'text-red-700'
            }`}
          >
            {won
              ? `Solved in ${guesses.length} of ${MAX_GUESSES} ${
                  guesses.length === 1 ? 'try' : 'tries'
                }`
              : 'Out of guesses — Full car revealed'}
          </p>
          <h3 className="font-display text-xl font-extrabold text-[#11161C] mt-0.5">
            {car.year} {car.make} {car.model}
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            {car.generation} · {car.bodyType} · {car.era} Era
          </p>
        </div>

        <button
          type="button"
          onClick={handleShare}
          className="inline-flex items-center gap-2 min-h-[44px] px-4 py-2 rounded-xl border border-slate-300 bg-white text-sm font-semibold text-[#11161C] hover:bg-slate-50 active:scale-[0.98] transition-all shrink-0"
        >
          {copied ? (
            <>
              <Check className="w-4 h-4 text-emerald-700" aria-hidden="true" />
              <span>Copied Result</span>
            </>
          ) : (
            <>
              <Share2 className="w-4 h-4" aria-hidden="true" />
              <span>Share Result</span>
            </>
          )}
        </button>
      </div>

      <p className="text-sm text-slate-700 leading-relaxed">{car.funFact}</p>

      {spotterNotes && (
        <div className="rounded-xl bg-slate-50 border border-slate-200 p-3.5 text-sm text-slate-700 leading-relaxed">
          <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1">
            India Spotter Notes
          </p>
          <p>{spotterNotes}</p>
        </div>
      )}

      {notesError && (
        <p role="alert" className="text-xs text-red-700 bg-red-50 border border-red-200 rounded-xl px-3 py-2">
          {notesError}
        </p>
      )}

      <div className="pt-1 flex flex-wrap items-center gap-3">
        {mode === 'practice' ? (
          <button
            type="button"
            onClick={onNextPracticeCar}
            className="inline-flex items-center justify-center gap-2 min-h-[44px] px-5 py-2.5 rounded-xl bg-[#E04F22] text-white text-sm font-bold hover:bg-[#c8431a] active:scale-[0.98] transition-all"
          >
            <span>Next Indian Car</span>
            <ArrowRight className="w-4 h-4" aria-hidden="true" />
          </button>
        ) : (
          <button
            type="button"
            onClick={onSwitchToPractice}
            className="inline-flex items-center justify-center gap-2 min-h-[44px] px-5 py-2.5 rounded-xl bg-[#11161C] text-white text-sm font-bold hover:bg-slate-800 active:scale-[0.98] transition-all"
          >
            <span>Play Practice Garage</span>
            <ArrowRight className="w-4 h-4" aria-hidden="true" />
          </button>
        )}

        {!spotterNotes && (
          <button
            type="button"
            onClick={handleLoadSpotterNotes}
            disabled={notesLoading}
            className="inline-flex items-center justify-center gap-2 min-h-[44px] px-4 py-2.5 rounded-xl border border-slate-300 bg-white text-sm font-semibold text-[#11161C] hover:bg-slate-50 disabled:opacity-60 active:scale-[0.98] transition-all"
          >
            {notesLoading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />
                <span>Loading Notes…</span>
              </>
            ) : (
              <>
                <BookOpen className="w-4 h-4" aria-hidden="true" />
                <span>India Spotter Notes</span>
              </>
            )}
          </button>
        )}
      </div>
    </section>
  );
};
