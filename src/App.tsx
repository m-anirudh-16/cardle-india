import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { RotateCcw } from 'lucide-react';
import { CarViewport } from './components/CarViewport';
import { GuessControls } from './components/GuessControls';
import { GuessHistory } from './components/GuessHistory';
import { GameMode, Header } from './components/Header';
import { OfflineIndicator } from './components/OfflineIndicator';
import { RoundSummary } from './components/RoundSummary';
import { RulesModal } from './components/RulesModal';
import {
  CarEra,
  getDailyPuzzle,
  getPuzzleNumber,
  getTodayDateKey,
  PUZZLE_DECK,
  PuzzleCar,
} from './data/puzzleDeck';
import {
  CarGuessInput,
  createSkipGuess,
  EvaluatedGuess,
  evaluateGuess,
  isDuplicateGuess,
  loadDailyStateByDate,
  MAX_GUESSES,
  saveDailyState,
} from './utils/gameLogic';
import { playFeedbackTone } from './utils/sound';

type EraFilter = 'All' | CarEra;

function pickLocalFallbackCar(era: EraFilter, excludeId?: string): PuzzleCar {
  const pool = era === 'All' ? PUZZLE_DECK : PUZZLE_DECK.filter((car) => car.era === era);
  const candidates = pool.length > 1 && excludeId ? pool.filter((c) => c.id !== excludeId) : pool;
  return candidates[Math.floor(Math.random() * candidates.length)];
}

export default function App() {
  const dateKey = useMemo(() => getTodayDateKey(), []);
  const puzzleNumber = useMemo(() => getPuzzleNumber(dateKey), [dateKey]);
  const offlineDailyFallback = useMemo(() => getDailyPuzzle(dateKey), [dateKey]);

  const [mode, setMode] = useState<GameMode>('daily');
  const [rulesOpen, setRulesOpen] = useState(false);

  // Daily puzzle state (fetched from /api/puzzle across 310+ Indian models, with offline fallback)
  const [dailyCar, setDailyCar] = useState<PuzzleCar | null>(null);
  const [dailyLoading, setDailyLoading] = useState<boolean>(true);
  const [dailyGuesses, setDailyGuesses] = useState<EvaluatedGuess[]>(() => {
    const saved = loadDailyStateByDate(dateKey);
    return saved ? saved.guesses : [];
  });
  const [dailyStatus, setDailyStatus] = useState<'playing' | 'won' | 'lost'>(() => {
    const saved = loadDailyStateByDate(dateKey);
    return saved ? saved.status : 'playing';
  });

  // Practice garage state (fetched from /api/puzzle across 310+ models + random part zoom)
  const [eraFilter, setEraFilter] = useState<EraFilter>('All');
  const [practiceCar, setPracticeCar] = useState<PuzzleCar | null>(null);
  const [practiceLoading, setPracticeLoading] = useState<boolean>(false);
  const [practiceGuesses, setPracticeGuesses] = useState<EvaluatedGuess[]>([]);
  const [practiceStatus, setPracticeStatus] = useState<'playing' | 'won' | 'lost'>('playing');

  const recentPracticeModelsRef = useRef<string[]>([]);

  const fetchDailyCar = useCallback(async () => {
    setDailyLoading(true);
    try {
      const res = await fetch(`/api/puzzle?mode=daily&date=${encodeURIComponent(dateKey)}`);
      if (!res.ok) throw new Error('API unavailable');
      const data = (await res.json()) as PuzzleCar;
      setDailyCar(data);

      // Verify saved daily state matches today's car identity
      const saved = loadDailyStateByDate(dateKey);
      if (saved && saved.carId === `${data.make}::${data.model}`) {
        setDailyGuesses(saved.guesses);
        setDailyStatus(saved.status);
      } else {
        setDailyGuesses([]);
        setDailyStatus('playing');
      }
    } catch {
      setDailyCar(offlineDailyFallback);
      const saved = loadDailyStateByDate(dateKey);
      if (saved && saved.carId === `${offlineDailyFallback.make}::${offlineDailyFallback.model}`) {
        setDailyGuesses(saved.guesses);
        setDailyStatus(saved.status);
      }
    } finally {
      setDailyLoading(false);
    }
  }, [dateKey, offlineDailyFallback]);

  const fetchPracticeCar = useCallback(
    async (targetEra: EraFilter, currentCarId?: string) => {
      setPracticeLoading(true);
      setPracticeGuesses([]);
      setPracticeStatus('playing');
      try {
        const exclude = recentPracticeModelsRef.current.slice(-15).join(',');
        const res = await fetch(
          `/api/puzzle?mode=practice&era=${encodeURIComponent(targetEra)}&exclude=${encodeURIComponent(
            exclude
          )}`
        );
        if (!res.ok) throw new Error('API unavailable');
        const data = (await res.json()) as PuzzleCar;
        recentPracticeModelsRef.current.push(`${data.make}::${data.model}`);
        setPracticeCar(data);
      } catch {
        const fallback = pickLocalFallbackCar(targetEra, currentCarId);
        setPracticeCar(fallback);
      } finally {
        setPracticeLoading(false);
      }
    },
    []
  );

  // Load today's online puzzle on initial mount
  useEffect(() => {
    fetchDailyCar();
  }, [fetchDailyCar]);

  // Load first practice car when switching to Practice mode if none loaded yet
  useEffect(() => {
    if (mode === 'practice' && !practiceCar && !practiceLoading) {
      fetchPracticeCar(eraFilter);
    }
  }, [mode, practiceCar, practiceLoading, eraFilter, fetchPracticeCar]);

  useEffect(() => {
    if (!dailyCar) return;
    saveDailyState({
      dateKey,
      carId: `${dailyCar.make}::${dailyCar.model}`,
      guesses: dailyGuesses,
      status: dailyStatus,
    });
  }, [dateKey, dailyCar, dailyGuesses, dailyStatus]);

  const activeCar = mode === 'daily' ? dailyCar : practiceCar;
  const activeLoading = mode === 'daily' ? dailyLoading : practiceLoading;
  const activeGuesses = mode === 'daily' ? dailyGuesses : practiceGuesses;
  const activeStatus = mode === 'daily' ? dailyStatus : practiceStatus;

  const isFinished = activeStatus !== 'playing';
  const isWon = activeStatus === 'won';
  const attemptsRemaining = MAX_GUESSES - activeGuesses.length;

  const applyEvaluation = useCallback(
    (evaluated: EvaluatedGuess) => {
      if (isFinished || !activeCar) return;

      const nextGuesses = [...activeGuesses, evaluated];
      const wonNow = evaluated.isWin;
      const lostNow = !wonNow && nextGuesses.length >= MAX_GUESSES;
      const nextStatus: 'playing' | 'won' | 'lost' = wonNow
        ? 'won'
        : lostNow
          ? 'lost'
          : 'playing';

      if (wonNow) {
        playFeedbackTone('win', false);
      } else if (lostNow) {
        playFeedbackTone('lose', false);
      } else if (evaluated.makeCorrect || evaluated.yearCorrect) {
        playFeedbackTone('partial', false);
      } else {
        playFeedbackTone('guess', false);
      }

      if (mode === 'daily') {
        setDailyGuesses(nextGuesses);
        setDailyStatus(nextStatus);
      } else {
        setPracticeGuesses(nextGuesses);
        setPracticeStatus(nextStatus);
      }
    },
    [activeCar, activeGuesses, isFinished, mode]
  );

  const handleSubmitGuess = (input: CarGuessInput) => {
    if (!activeCar || isDuplicateGuess(input, activeGuesses)) return;
    const evaluated = evaluateGuess(input, activeCar);
    applyEvaluation(evaluated);
  };

  const handleSkip = () => {
    applyEvaluation(createSkipGuess());
  };

  const handleNextPracticeCar = (targetEra: EraFilter = eraFilter) => {
    fetchPracticeCar(targetEra, practiceCar?.id);
  };

  const handleEraChange = (nextEra: EraFilter) => {
    setEraFilter(nextEra);
    fetchPracticeCar(nextEra, practiceCar?.id);
  };

  const handleRetryImage = () => {
    if (mode === 'daily') {
      fetchDailyCar();
    } else {
      fetchPracticeCar(eraFilter, practiceCar?.id);
    }
  };

  const contextLabel =
    mode === 'daily'
      ? `Daily #${puzzleNumber}`
      : `Practice Garage · ${eraFilter === 'All' ? 'All 310+ Models' : eraFilter}`;

  return (
    <div className="min-h-dvh flex flex-col bg-[#F4F5F7] text-[#11161C]">
      <Header
        mode={mode}
        onModeChange={setMode}
        onOpenRules={() => setRulesOpen(true)}
      />

      <main className="flex-1 w-full max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-5 sm:py-8">
        {/* Practice Mode Era Toolbar */}
        {mode === 'practice' && (
          <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
            <div
              role="group"
              aria-label="Filter practice cars by era"
              className="inline-flex items-center gap-1 p-1 rounded-xl bg-slate-200/80"
            >
              {(['All', 'Classic', '2000s', 'Modern'] as EraFilter[]).map((era) => (
                <button
                  key={era}
                  type="button"
                  onClick={() => handleEraChange(era)}
                  className={`min-h-[36px] px-3 py-1.5 rounded-lg text-xs font-semibold transition-all whitespace-nowrap ${
                    eraFilter === era
                      ? 'bg-white text-[#11161C] shadow-xs'
                      : 'text-slate-600 hover:text-[#11161C]'
                  }`}
                >
                  {era === 'All' ? 'All Eras' : era}
                </button>
              ))}
            </div>

            <button
              type="button"
              disabled={practiceLoading}
              onClick={() => handleNextPracticeCar()}
              className="inline-flex items-center gap-1.5 min-h-[40px] px-3.5 py-2 rounded-xl border border-slate-300 bg-white text-xs font-semibold text-slate-700 hover:bg-slate-50 active:scale-[0.98] disabled:opacity-50 transition-all whitespace-nowrap"
            >
              <RotateCcw className="w-3.5 h-3.5" aria-hidden="true" />
              <span>New Random Car</span>
            </button>
          </div>
        )}

        {/* Primary 2-Column Game Arena */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-start">
          {/* Left Column: Zooming Car Viewport + Post-Round Reveal Summary */}
          <div className="lg:col-span-7 space-y-5">
            <CarViewport
              car={activeCar}
              loading={activeLoading}
              guessesCount={activeGuesses.length}
              isFinished={isFinished}
              isWon={isWon}
              onRetryImage={handleRetryImage}
              contextLabel={contextLabel}
            />

            {isFinished && activeCar && (
              <RoundSummary
                mode={mode}
                puzzleNumber={puzzleNumber}
                car={activeCar}
                guesses={activeGuesses}
                won={isWon}
                onNextPracticeCar={() => handleNextPracticeCar()}
                onSwitchToPractice={() => setMode('practice')}
              />
            )}
          </div>

          {/* Right Column: Make / Model / Year Controls + 5-Attempt Evaluation History */}
          <div className="lg:col-span-5 space-y-5">
            {!isFinished && (
              <GuessControls
                key={`${mode}-${activeCar?.id ?? 'loading'}`}
                disabled={isFinished || activeLoading || !activeCar}
                previousGuesses={activeGuesses}
                onSubmitGuess={handleSubmitGuess}
                onSkip={handleSkip}
                attemptsRemaining={attemptsRemaining}
              />
            )}

            <GuessHistory guesses={activeGuesses} />
          </div>
        </div>
      </main>

      <RulesModal open={rulesOpen} onClose={() => setRulesOpen(false)} />
      <OfflineIndicator />
    </div>
  );
}
