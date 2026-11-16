import { PuzzleCar } from '../data/puzzleDeck';

export const MAX_GUESSES = 5;
export const YEAR_TOLERANCE = 2;

export interface CarGuessInput {
  make: string;
  model: string;
  year: number;
}

export interface EvaluatedGuess {
  type: 'guess' | 'skip';
  make: string;
  model: string;
  year: number;
  makeCorrect: boolean;
  modelCorrect: boolean;
  yearCorrect: boolean;
  yearExact: boolean;
  yearDirection: 'exact' | 'close' | 'higher' | 'lower';
  isWin: boolean;
}

const MODEL_ALIAS_GROUPS: string[][] = [
  ['Maruti Suzuki::Brezza', 'Maruti Suzuki::Vitara Brezza'],
  ['Maruti Suzuki::Dzire', 'Maruti Suzuki::Swift Dzire'],
  ['Hyundai::i20', 'Hyundai::Elite i20'],
  ['Hyundai::Santro', 'Hyundai::Santro Xing'],
  ['Citroen::Aircross', 'Citroen::C3 Aircross'],
  ['Ford::Classic', 'Ford::Fiesta'],
];

function canonicalModelKey(make: string, model: string): string {
  const raw = `${make}::${model}`;
  for (const group of MODEL_ALIAS_GROUPS) {
    if (group.includes(raw)) return group[0];
  }
  return raw;
}

export function isDuplicateGuess(
  input: CarGuessInput,
  previousGuesses: EvaluatedGuess[]
): boolean {
  const inputModelKey = canonicalModelKey(input.make, input.model);
  return previousGuesses.some(
    (g) =>
      g.type === 'guess' &&
      g.make === input.make &&
      canonicalModelKey(g.make, g.model) === inputModelKey &&
      g.year === input.year
  );
}

export function evaluateGuess(input: CarGuessInput, target: PuzzleCar): EvaluatedGuess {
  const makeCorrect = input.make === target.make;
  const modelCorrect =
    makeCorrect &&
    canonicalModelKey(input.make, input.model) === canonicalModelKey(target.make, target.model);
  const diff = input.year - target.year;
  const yearExact = diff === 0;
  const yearCorrect = Math.abs(diff) <= YEAR_TOLERANCE;

  let yearDirection: EvaluatedGuess['yearDirection'] = 'exact';
  if (yearExact) {
    yearDirection = 'exact';
  } else if (yearCorrect) {
    yearDirection = 'close';
  } else if (diff < 0) {
    // Guessed year is older than target => target is newer/higher
    yearDirection = 'higher';
  } else {
    // Guessed year is newer than target => target is older/lower
    yearDirection = 'lower';
  }

  return {
    type: 'guess',
    make: input.make,
    model: input.model,
    year: input.year,
    makeCorrect,
    modelCorrect,
    yearCorrect,
    yearExact,
    yearDirection,
    isWin: makeCorrect && modelCorrect && yearCorrect,
  };
}

export function createSkipGuess(): EvaluatedGuess {
  return {
    type: 'skip',
    make: 'Skipped',
    model: 'Zoomed out',
    year: 0,
    makeCorrect: false,
    modelCorrect: false,
    yearCorrect: false,
    yearExact: false,
    yearDirection: 'exact',
    isWin: false,
  };
}

/**
 * Zoom scales from balanced car-part crop on Guess 1 (0 wrong) to full car reveal (1.0x).
 */
export const ZOOM_SCALES = [5.0, 3.6, 2.6, 1.85, 1.3, 1.0] as const;

export function getZoomTransform(
  guessesCount: number,
  isFinished: boolean,
  focalX: number,
  focalY: number
): { scale: number; translateX: number; translateY: number } {
  if (isFinished) {
    return { scale: 1, translateX: 0, translateY: 0 };
  }

  const stageIndex = Math.min(guessesCount, ZOOM_SCALES.length - 1);
  const scale = ZOOM_SCALES[stageIndex];

  if (scale <= 1) {
    return { scale: 1, translateX: 0, translateY: 0 };
  }

  // Desired translation to center (focalX, focalY) in viewport with transform-origin: 50% 50%
  const rawTx = 50 - focalX;
  const rawTy = 50 - focalY;

  // Clamp translation so scaled image boundaries never pull inside the [0%, 100%] frame
  const maxOffset = 50 - 50 / scale;
  const translateX = Math.max(-maxOffset, Math.min(maxOffset, rawTx));
  const translateY = Math.max(-maxOffset, Math.min(maxOffset, rawTy));

  return { scale, translateX, translateY };
}

export interface PlayerStats {
  played: number;
  wins: number;
  currentStreak: number;
  maxStreak: number;
  lastCompletedDate: string | null;
  distribution: [number, number, number, number, number];
}

export interface DailySaveState {
  dateKey: string;
  carId: string;
  guesses: EvaluatedGuess[];
  status: 'playing' | 'won' | 'lost';
}

const STATS_KEY = 'cardle_india_stats_v1';
const DAILY_KEY = 'cardle_india_daily_v1';

export const DEFAULT_STATS: PlayerStats = {
  played: 0,
  wins: 0,
  currentStreak: 0,
  maxStreak: 0,
  lastCompletedDate: null,
  distribution: [0, 0, 0, 0, 0],
};

export function loadStats(): PlayerStats {
  try {
    const raw = localStorage.getItem(STATS_KEY);
    if (!raw) return DEFAULT_STATS;
    const parsed = JSON.parse(raw) as Partial<PlayerStats>;
    return {
      played: parsed.played ?? 0,
      wins: parsed.wins ?? 0,
      currentStreak: parsed.currentStreak ?? 0,
      maxStreak: parsed.maxStreak ?? 0,
      lastCompletedDate: parsed.lastCompletedDate ?? null,
      distribution:
        Array.isArray(parsed.distribution) && parsed.distribution.length === 5
          ? (parsed.distribution as [number, number, number, number, number])
          : [0, 0, 0, 0, 0],
    };
  } catch {
    return DEFAULT_STATS;
  }
}

export function saveStats(stats: PlayerStats): void {
  try {
    localStorage.setItem(STATS_KEY, JSON.stringify(stats));
  } catch {
    // Ignore storage quota errors
  }
}

export function loadDailyState(dateKey: string, carId: string): DailySaveState | null {
  try {
    const raw = localStorage.getItem(DAILY_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as DailySaveState;
    if (parsed.dateKey === dateKey && parsed.carId === carId) {
      return parsed;
    }
    return null;
  } catch {
    return null;
  }
}

export function loadDailyStateByDate(dateKey: string): DailySaveState | null {
  try {
    const raw = localStorage.getItem(DAILY_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as DailySaveState;
    if (parsed.dateKey === dateKey) {
      return parsed;
    }
    return null;
  } catch {
    return null;
  }
}

export function saveDailyState(state: DailySaveState): void {
  try {
    localStorage.setItem(DAILY_KEY, JSON.stringify(state));
  } catch {
    // Ignore storage quota errors
  }
}

function getPreviousDateKey(dateKey: string): string {
  const [y, m, d] = dateKey.split('-').map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d - 1));
  return dt.toISOString().slice(0, 10);
}

export function recordDailyCompletion(
  prevStats: PlayerStats,
  dateKey: string,
  won: boolean,
  guessCount: number
): PlayerStats {
  if (prevStats.lastCompletedDate === dateKey) {
    return prevStats;
  }

  const isConsecutive = prevStats.lastCompletedDate === getPreviousDateKey(dateKey);
  const nextStreak = won ? (isConsecutive ? prevStats.currentStreak + 1 : 1) : 0;
  const nextDist = [...prevStats.distribution] as [number, number, number, number, number];
  if (won && guessCount >= 1 && guessCount <= MAX_GUESSES) {
    nextDist[guessCount - 1] += 1;
  }

  const updated: PlayerStats = {
    played: prevStats.played + 1,
    wins: prevStats.wins + (won ? 1 : 0),
    currentStreak: nextStreak,
    maxStreak: Math.max(prevStats.maxStreak, nextStreak),
    lastCompletedDate: dateKey,
    distribution: nextDist,
  };
  saveStats(updated);
  return updated;
}

export function buildShareText(
  mode: 'daily' | 'practice',
  puzzleNumber: number,
  guesses: EvaluatedGuess[],
  won: boolean,
  car: PuzzleCar
): string {
  const header =
    mode === 'daily'
      ? `Cardle India #${puzzleNumber} — ${won ? guesses.length : 'X'}/${MAX_GUESSES}`
      : `Cardle India (Practice) — ${won ? guesses.length : 'X'}/${MAX_GUESSES}`;

  const rows = guesses.map((g) => {
    if (g.type === 'skip') return '⏭️⬜⬜';
    const makeEmoji = g.makeCorrect ? '🟩' : '🟥';
    const modelEmoji = g.modelCorrect ? '🟩' : '🟥';
    const yearEmoji = g.yearCorrect ? '🟩' : '🟨';
    return `${makeEmoji}${modelEmoji}${yearEmoji}`;
  });

  return `${header}\n${rows.join('\n')}\n(${car.year} ${car.make} ${car.model})`;
}
