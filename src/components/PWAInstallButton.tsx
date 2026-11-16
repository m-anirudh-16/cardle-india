import React, { useEffect, useState } from 'react';
import { Download, Share, Smartphone, X } from 'lucide-react';
import { usePWAInstall } from '../hooks/usePWAInstall';

export const PWAInstallButton: React.FC = () => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [showGuide, setShowGuide] = useState(false);

  useEffect(() => {
    if (!showGuide) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setShowGuide(false);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [showGuide]);

  // Already running as an installed standalone app on home screen
  if (isInstalled) {
    return null;
  }

  const handleClick = async () => {
    if (isInstallable) {
      await install();
      return;
    }
    setShowGuide(true);
  };

  return (
    <>
      <button
        type="button"
        onClick={handleClick}
        className="inline-flex items-center justify-center gap-1.5 sm:gap-2 min-h-[36px] sm:min-h-[42px] px-2.5 sm:px-4 py-1.5 sm:py-2 rounded-lg bg-[#11161C] text-white text-xs sm:text-sm font-semibold hover:bg-slate-800 active:scale-[0.98] transition-all whitespace-nowrap shrink-0 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#E04F22]"
      >
        <Download className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0" aria-hidden="true" />
        <span className="sm:hidden">Install</span>
        <span className="hidden sm:inline">Install App</span>
      </button>

      {showGuide && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/55 backdrop-blur-xs p-4"
          onClick={() => setShowGuide(false)}
          role="dialog"
          aria-modal="true"
          aria-labelledby="install-guide-title"
        >
          <div
            className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl border border-slate-200"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[#11161C] text-white flex items-center justify-center shrink-0">
                  <Smartphone className="w-5 h-5" aria-hidden="true" />
                </div>
                <div>
                  <h2 id="install-guide-title" className="font-display text-lg font-bold text-[#11161C]">
                    Add Cardle India to Home Screen
                  </h2>
                  <p className="text-xs text-slate-500">Play offline and launch full-screen like a native app</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowGuide(false)}
                aria-label="Close install instructions"
                className="min-h-[44px] min-w-[44px] -mr-2 -mt-2 flex items-center justify-center rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {isIOS ? (
              <ol className="mt-5 space-y-3 text-sm text-slate-700">
                <li className="flex items-start gap-3">
                  <span className="font-mono text-xs font-semibold w-6 h-6 rounded-md bg-slate-100 text-slate-800 flex items-center justify-center shrink-0 mt-0.5">
                    1
                  </span>
                  <span>
                    Tap the <strong className="inline-flex items-center gap-1 font-semibold text-slate-900"><Share className="w-3.5 h-3.5 inline" /> Share</strong> button in Safari&apos;s toolbar.
                  </span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="font-mono text-xs font-semibold w-6 h-6 rounded-md bg-slate-100 text-slate-800 flex items-center justify-center shrink-0 mt-0.5">
                    2
                  </span>
                  <span>
                    Scroll down the share sheet and tap <strong className="font-semibold text-slate-900">Add to Home Screen</strong>.
                  </span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="font-mono text-xs font-semibold w-6 h-6 rounded-md bg-slate-100 text-slate-800 flex items-center justify-center shrink-0 mt-0.5">
                    3
                  </span>
                  <span>
                    Tap <strong className="font-semibold text-slate-900">Add</strong> to launch Cardle India directly from your home screen.
                  </span>
                </li>
              </ol>
            ) : (
              <ol className="mt-5 space-y-3 text-sm text-slate-700">
                <li className="flex items-start gap-3">
                  <span className="font-mono text-xs font-semibold w-6 h-6 rounded-md bg-slate-100 text-slate-800 flex items-center justify-center shrink-0 mt-0.5">
                    1
                  </span>
                  <span>
                    Open your browser menu (<strong className="font-semibold text-slate-900">⋮</strong> in Chrome/Android or the install icon in the address bar on desktop).
                  </span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="font-mono text-xs font-semibold w-6 h-6 rounded-md bg-slate-100 text-slate-800 flex items-center justify-center shrink-0 mt-0.5">
                    2
                  </span>
                  <span>
                    Select <strong className="font-semibold text-slate-900">Install Cardle India</strong> or <strong className="font-semibold text-slate-900">Add to Home Screen</strong>.
                  </span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="font-mono text-xs font-semibold w-6 h-6 rounded-md bg-slate-100 text-slate-800 flex items-center justify-center shrink-0 mt-0.5">
                    3
                  </span>
                  <span>
                    If viewing inside an embedded preview, open the app directly in its own browser tab first to trigger the native install prompt.
                  </span>
                </li>
              </ol>
            )}

            <button
              type="button"
              onClick={() => setShowGuide(false)}
              className="mt-6 w-full min-h-[44px] rounded-xl bg-slate-100 text-sm font-semibold text-slate-900 hover:bg-slate-200 transition-colors"
            >
              Got it
            </button>
          </div>
        </div>
      )}
    </>
  );
};
