import React, { useEffect, useMemo, useRef, useState } from 'react';
import { ChevronDown, Minus, Plus, Search, SkipForward, X } from 'lucide-react';
import {
  ALL_INDIAN_MAKES,
  ALL_INDIAN_YEARS,
  getModelsByMake,
  INDIAN_CARS_CATALOG,
} from '../data/indianCarsCatalog';
import { CarGuessInput, EvaluatedGuess, isDuplicateGuess, YEAR_TOLERANCE } from '../utils/gameLogic';

interface GuessControlsProps {
  disabled: boolean;
  previousGuesses: EvaluatedGuess[];
  onSubmitGuess: (guess: CarGuessInput) => void;
  onSkip: () => void;
  attemptsRemaining: number;
}

export const GuessControls: React.FC<GuessControlsProps> = ({
  disabled,
  previousGuesses,
  onSubmitGuess,
  onSkip,
  attemptsRemaining,
}) => {
  const [make, setMake] = useState('');
  const [makeQuery, setMakeQuery] = useState('');
  const [makeOpen, setMakeOpen] = useState(false);

  const [model, setModel] = useState('');
  const [modelQuery, setModelQuery] = useState('');
  const [modelOpen, setModelOpen] = useState(false);

  const [year, setYear] = useState<number>(2018);
  const [yearOpen, setYearOpen] = useState(false);
  const [yearQuery, setYearQuery] = useState('');

  const [validationError, setValidationError] = useState<string | null>(null);

  const makeContainerRef = useRef<HTMLDivElement>(null);
  const modelContainerRef = useRef<HTMLDivElement>(null);
  const yearContainerRef = useRef<HTMLDivElement>(null);

  const isDuplicate = useMemo(() => {
    if (!make || !model) return false;
    return isDuplicateGuess({ make, model, year }, previousGuesses);
  }, [make, model, year, previousGuesses]);

  useEffect(() => {
    const handleOutside = (e: PointerEvent) => {
      const target = e.target as Node;
      if (makeContainerRef.current && !makeContainerRef.current.contains(target)) {
        setMakeOpen(false);
      }
      if (modelContainerRef.current && !modelContainerRef.current.contains(target)) {
        setModelOpen(false);
      }
      if (yearContainerRef.current && !yearContainerRef.current.contains(target)) {
        setYearOpen(false);
      }
    };
    document.addEventListener('pointerdown', handleOutside);
    return () => document.removeEventListener('pointerdown', handleOutside);
  }, []);

  const filteredMakes = useMemo(() => {
    const q = makeQuery.trim().toLowerCase();
    if (!q) return ALL_INDIAN_MAKES;
    return ALL_INDIAN_MAKES.filter((m) => m.toLowerCase().includes(q));
  }, [makeQuery]);

  const filteredModels = useMemo(() => {
    const pool = make ? getModelsByMake(make) : INDIAN_CARS_CATALOG;
    const q = modelQuery.trim().toLowerCase();
    if (!q) return pool;
    return pool.filter(
      (entry) =>
        entry.model.toLowerCase().includes(q) || entry.make.toLowerCase().includes(q)
    );
  }, [make, modelQuery]);

  const filteredYears = useMemo(() => {
    const q = yearQuery.trim();
    if (!q) return ALL_INDIAN_YEARS;
    return ALL_INDIAN_YEARS.filter((y) => String(y).includes(q));
  }, [yearQuery]);

  const handleSelectMake = (selectedMake: string) => {
    setMake(selectedMake);
    setMakeQuery('');
    setMakeOpen(false);
    setValidationError(null);
    // Clear model if it doesn't belong to the newly chosen make
    const validForMake = getModelsByMake(selectedMake).some((c) => c.model === model);
    if (!validForMake) {
      setModel('');
      setModelQuery('');
    }
  };

  const handleSelectModel = (entryMake: string, entryModel: string) => {
    setMake(entryMake);
    setModel(entryModel);
    setMakeQuery('');
    setModelQuery('');
    setModelOpen(false);
    setValidationError(null);
  };

  const handleSelectYear = (selectedYear: number) => {
    setYear(selectedYear);
    setYearQuery('');
    setYearOpen(false);
    setValidationError(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (disabled) return;

    if (!make) {
      setValidationError('Select a Make.');
      return;
    }
    if (!model) {
      setValidationError('Select a Model.');
      return;
    }
    if (isDuplicate) {
      setValidationError(
        `You already guessed ${year} ${make} ${model}. Change the make, model, or year.`
      );
      return;
    }

    setValidationError(null);
    onSubmitGuess({ make, model, year });
  };

  const adjustYear = (delta: number) => {
    setYear((prev) => Math.max(1954, Math.min(2026, prev + delta)));
    setValidationError(null);
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-2xl bg-white border border-slate-200 p-4 sm:p-5 space-y-4"
    >
      <div className="flex items-center justify-between gap-3">
        <h2 className="font-display text-base font-bold text-[#11161C]">
          Identify the Vehicle
        </h2>
        <span className="font-mono tabular-nums text-xs text-slate-500">
          {attemptsRemaining} {attemptsRemaining === 1 ? 'try' : 'tries'} left
        </span>
      </div>

      {/* Make Combobox */}
      <div ref={makeContainerRef} className="relative">
        <label
          htmlFor="make-search-input"
          className="block text-xs font-semibold text-slate-700 mb-1.5"
        >
          Make
        </label>
        <div className="relative flex items-center">
          <Search
            className="w-4 h-4 text-slate-400 absolute left-3 pointer-events-none"
            aria-hidden="true"
          />
          <input
            id="make-search-input"
            type="text"
            disabled={disabled}
            value={makeOpen ? makeQuery : make}
            placeholder={make ? make : 'Search makes (e.g. Maruti Suzuki, Tata)...'}
            onFocus={() => {
              setMakeOpen(true);
              setModelOpen(false);
              setYearOpen(false);
            }}
            onChange={(e) => {
              setMakeQuery(e.target.value);
              setMakeOpen(true);
            }}
            onKeyDown={(e) => {
              if (e.key === 'Escape') setMakeOpen(false);
            }}
            className="w-full min-h-[44px] pl-9 pr-16 rounded-xl border border-slate-300 bg-white text-sm text-[#11161C] placeholder:text-slate-400 focus:outline-none focus:border-[#E04F22] focus:ring-2 focus:ring-[#E04F22]/15 disabled:bg-slate-100 disabled:text-slate-400 transition"
          />
          {make && !disabled && (
            <button
              type="button"
              aria-label="Clear make"
              onClick={() => {
                setMake('');
                setModel('');
                setMakeQuery('');
                setModelQuery('');
              }}
              className="absolute right-8 min-h-[36px] min-w-[32px] flex items-center justify-center text-slate-400 hover:text-slate-700"
            >
              <X className="w-4 h-4" />
            </button>
          )}
          <button
            type="button"
            disabled={disabled}
            aria-label="Toggle make list"
            onClick={() => {
              setMakeOpen((v) => !v);
              setModelOpen(false);
              setYearOpen(false);
            }}
            className="absolute right-1 min-h-[38px] min-w-[32px] flex items-center justify-center text-slate-500 hover:text-slate-800"
          >
            <ChevronDown className="w-4 h-4" />
          </button>
        </div>

        {makeOpen && !disabled && (
          <ul
            role="listbox"
            aria-label="Available makes"
            className="absolute z-30 mt-1.5 w-full max-h-56 overflow-y-auto rounded-xl bg-white border border-slate-200 shadow-lg py-1"
          >
            {filteredMakes.length === 0 ? (
              <li className="px-3.5 py-2.5 text-sm text-slate-500">No matching make found</li>
            ) : (
              filteredMakes.map((m) => (
                <li key={m}>
                  <button
                    type="button"
                    onClick={() => handleSelectMake(m)}
                    className={`w-full text-left px-3.5 min-h-[44px] flex items-center justify-between text-sm transition-colors ${
                      make === m
                        ? 'bg-orange-50 text-[#E04F22] font-semibold'
                        : 'text-slate-800 hover:bg-slate-50'
                    }`}
                  >
                    <span>{m}</span>
                    <span className="font-mono text-xs text-slate-400">
                      {getModelsByMake(m).length} models
                    </span>
                  </button>
                </li>
              ))
            )}
          </ul>
        )}
      </div>

      {/* Model Combobox */}
      <div ref={modelContainerRef} className="relative">
        <label
          htmlFor="model-search-input"
          className="block text-xs font-semibold text-slate-700 mb-1.5"
        >
          Model
        </label>
        <div className="relative flex items-center">
          <Search
            className="w-4 h-4 text-slate-400 absolute left-3 pointer-events-none"
            aria-hidden="true"
          />
          <input
            id="model-search-input"
            type="text"
            disabled={disabled}
            value={modelOpen ? modelQuery : model}
            placeholder={
              make ? `Search ${make} models...` : 'Search models (e.g. Swift, Safari)...'
            }
            onFocus={() => {
              setModelOpen(true);
              setMakeOpen(false);
              setYearOpen(false);
            }}
            onChange={(e) => {
              setModelQuery(e.target.value);
              setModelOpen(true);
            }}
            onKeyDown={(e) => {
              if (e.key === 'Escape') setModelOpen(false);
            }}
            className="w-full min-h-[44px] pl-9 pr-16 rounded-xl border border-slate-300 bg-white text-sm text-[#11161C] placeholder:text-slate-400 focus:outline-none focus:border-[#E04F22] focus:ring-2 focus:ring-[#E04F22]/15 disabled:bg-slate-100 disabled:text-slate-400 transition"
          />
          {model && !disabled && (
            <button
              type="button"
              aria-label="Clear model"
              onClick={() => {
                setModel('');
                setModelQuery('');
              }}
              className="absolute right-8 min-h-[36px] min-w-[32px] flex items-center justify-center text-slate-400 hover:text-slate-700"
            >
              <X className="w-4 h-4" />
            </button>
          )}
          <button
            type="button"
            disabled={disabled}
            aria-label="Toggle model list"
            onClick={() => {
              setModelOpen((v) => !v);
              setMakeOpen(false);
              setYearOpen(false);
            }}
            className="absolute right-1 min-h-[38px] min-w-[32px] flex items-center justify-center text-slate-500 hover:text-slate-800"
          >
            <ChevronDown className="w-4 h-4" />
          </button>
        </div>

        {modelOpen && !disabled && (
          <ul
            role="listbox"
            aria-label="Available models"
            className="absolute z-30 mt-1.5 w-full max-h-56 overflow-y-auto rounded-xl bg-white border border-slate-200 shadow-lg py-1"
          >
            {filteredModels.length === 0 ? (
              <li className="px-3.5 py-2.5 text-sm text-slate-500">No matching model found</li>
            ) : (
              filteredModels.map((entry) => {
                const isSelected = make === entry.make && model === entry.model;
                return (
                  <li key={`${entry.make}-${entry.model}`}>
                    <button
                      type="button"
                      onClick={() => handleSelectModel(entry.make, entry.model)}
                      className={`w-full text-left px-3.5 min-h-[44px] flex items-center justify-between gap-2 text-sm transition-colors ${
                        isSelected
                          ? 'bg-orange-50 text-[#E04F22] font-semibold'
                          : 'text-slate-800 hover:bg-slate-50'
                      }`}
                    >
                      <span className="truncate">
                        {entry.model}
                        {!make && (
                          <span className="text-slate-400 font-normal"> · {entry.make}</span>
                        )}
                      </span>
                      <span className="font-mono tabular-nums text-xs text-slate-400 shrink-0">
                        {entry.yearStart}–{entry.yearEnd === 2026 ? 'Now' : entry.yearEnd}
                      </span>
                    </button>
                  </li>
                );
              })
            )}
          </ul>
        )}
      </div>

      {/* Year Selector with Steppers + Dropdown */}
      <div ref={yearContainerRef} className="relative">
        <div className="flex items-center justify-between gap-2 mb-1.5">
          <label htmlFor="year-search-input" className="text-xs font-semibold text-slate-700">
            Year
          </label>
          <span className="text-xs text-slate-500">
            ±{YEAR_TOLERANCE} years accepted
          </span>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            disabled={disabled || year <= 1954}
            onClick={() => adjustYear(-1)}
            aria-label="Decrease year by 1"
            className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-xl border border-slate-300 bg-white text-slate-700 hover:bg-slate-50 active:scale-[0.97] disabled:opacity-40 transition"
          >
            <Minus className="w-4 h-4" />
          </button>

          <div className="relative flex-1 flex items-center">
            <input
              id="year-search-input"
              type="text"
              inputMode="numeric"
              disabled={disabled}
              value={yearOpen ? yearQuery : String(year)}
              placeholder="1954–2026"
              onFocus={() => {
                setYearOpen(true);
                setMakeOpen(false);
                setModelOpen(false);
              }}
              onChange={(e) => {
                const digits = e.target.value.replace(/\D/g, '').slice(0, 4);
                setYearQuery(digits);
                setYearOpen(true);
                setValidationError(null);
                if (digits.length === 4) {
                  const num = Number(digits);
                  if (num >= 1954 && num <= 2026) {
                    setYear(num);
                  }
                }
              }}
              onKeyDown={(e) => {
                if (e.key === 'Escape') setYearOpen(false);
              }}
              className="w-full min-h-[44px] px-3.5 pr-9 rounded-xl border border-slate-300 bg-white text-center font-mono tabular-nums text-sm font-semibold text-[#11161C] focus:outline-none focus:border-[#E04F22] focus:ring-2 focus:ring-[#E04F22]/15 disabled:bg-slate-100 disabled:text-slate-400 transition"
            />
            <button
              type="button"
              disabled={disabled}
              aria-label="Toggle year list"
              onClick={() => {
                setYearOpen((v) => !v);
                setMakeOpen(false);
                setModelOpen(false);
              }}
              className="absolute right-1 min-h-[38px] min-w-[32px] flex items-center justify-center text-slate-500 hover:text-slate-800"
            >
              <ChevronDown className="w-4 h-4" />
            </button>
          </div>

          <button
            type="button"
            disabled={disabled || year >= 2026}
            onClick={() => adjustYear(1)}
            aria-label="Increase year by 1"
            className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-xl border border-slate-300 bg-white text-slate-700 hover:bg-slate-50 active:scale-[0.97] disabled:opacity-40 transition"
          >
            <Plus className="w-4 h-4" />
          </button>
        </div>

        {yearOpen && !disabled && (
          <ul
            role="listbox"
            aria-label="Available years"
            className="absolute z-30 mt-1.5 w-full max-h-52 overflow-y-auto rounded-xl bg-white border border-slate-200 shadow-lg py-1"
          >
            {filteredYears.length === 0 ? (
              <li className="px-3.5 py-2.5 text-sm text-slate-500">Enter a year from 1954–2026</li>
            ) : (
              filteredYears.map((y) => (
                <li key={y}>
                  <button
                    type="button"
                    onClick={() => handleSelectYear(y)}
                    className={`w-full text-center min-h-[40px] font-mono tabular-nums text-sm transition-colors ${
                      year === y
                        ? 'bg-orange-50 text-[#E04F22] font-semibold'
                        : 'text-slate-800 hover:bg-slate-50'
                    }`}
                  >
                    {y}
                  </button>
                </li>
              ))
            )}
          </ul>
        )}
      </div>

      {(isDuplicate || validationError) && (
        <p role="alert" className="text-xs font-medium text-amber-800 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
          {isDuplicate
            ? `Already guessed ${year} ${make} ${model}. Change the make, model, or year.`
            : validationError}
        </p>
      )}

      {/* Primary Guess & Skip Actions */}
      <div className="flex items-center gap-2.5 pt-1">
        <button
          type="submit"
          disabled={disabled || isDuplicate}
          className="flex-1 min-h-[48px] px-4 py-2.5 rounded-xl bg-[#E04F22] text-white text-sm font-bold hover:bg-[#c8431a] active:scale-[0.98] disabled:opacity-45 disabled:cursor-not-allowed transition-all whitespace-nowrap focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#11161C]"
        >
          {isDuplicate ? 'Already Guessed' : 'Submit Guess'}
        </button>

        <button
          type="button"
          disabled={disabled}
          onClick={onSkip}
          className="inline-flex items-center justify-center gap-1.5 min-h-[48px] px-4 py-2.5 rounded-xl border border-slate-300 bg-white text-slate-700 text-sm font-semibold hover:bg-slate-50 active:scale-[0.98] disabled:opacity-45 transition-all whitespace-nowrap shrink-0"
        >
          <SkipForward className="w-4 h-4" aria-hidden="true" />
          <span>Skip</span>
        </button>
      </div>
    </form>
  );
};
