import { useCallback, useEffect, useState } from 'react';
import AppLogoIcon from '@/components/app-logo-icon';
import { HydroAuroraCanvas } from './hydro-aurora-canvas';

function detectDarkMode(): boolean {
    if (typeof document === 'undefined') return false;
    return document.documentElement.classList.contains('dark');
}

function detectReducedMotion(): boolean {
    if (typeof window === 'undefined') return false;
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

export function IntroScreen({ onComplete }: { onComplete: () => void }) {
    const [entered, setEntered] = useState(false);
    const [progressPct, setProgressPct] = useState(10);
    const [exiting, setExiting] = useState(false);
    const [isDark, setIsDark] = useState(detectDarkMode);
    const [reducedMotion, setReducedMotion] = useState(detectReducedMotion);

    const finishIntro = useCallback(() => {
        setExiting((prev) => {
            if (prev) return prev;
            window.setTimeout(() => {
                onComplete();
            }, 300);
            return true;
        });
    }, [onComplete]);

    useEffect(() => {
        setIsDark(detectDarkMode());
        const mql = window.matchMedia('(prefers-reduced-motion: reduce)');
        setReducedMotion(mql.matches);
        const onMotionChange = (e: MediaQueryListEvent) =>
            setReducedMotion(e.matches);
        mql.addEventListener('change', onMotionChange);

        const observer = new MutationObserver(() => {
            setIsDark(detectDarkMode());
        });
        observer.observe(document.documentElement, {
            attributes: true,
            attributeFilter: ['class'],
        });

        return () => {
            mql.removeEventListener('change', onMotionChange);
            observer.disconnect();
        };
    }, []);

    // Keyboard accessibility: Escape dismisses intro immediately (R-32)
    useEffect(() => {
        const onKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                finishIntro();
            }
        };
        window.addEventListener('keydown', onKeyDown);
        return () => window.removeEventListener('keydown', onKeyDown);
    }, [finishIntro]);

    // Choreographed 2.8s Model A Atmospheric loading sequence
    useEffect(() => {
        const frameId = window.requestAnimationFrame(() => setEntered(true));

        if (reducedMotion) {
            setProgressPct(100);
            const doneTimer = window.setTimeout(() => finishIntro(), 950);
            return () => {
                window.cancelAnimationFrame(frameId);
                window.clearTimeout(doneTimer);
            };
        }

        const t1 = window.setTimeout(() => setProgressPct(44), 380);
        const t2 = window.setTimeout(() => setProgressPct(78), 1150);
        const t3 = window.setTimeout(() => setProgressPct(100), 2050);
        const t4 = window.setTimeout(() => finishIntro(), 2650);

        return () => {
            window.cancelAnimationFrame(frameId);
            window.clearTimeout(t1);
            window.clearTimeout(t2);
            window.clearTimeout(t3);
            window.clearTimeout(t4);
        };
    }, [finishIntro, reducedMotion]);

    return (
        <div
            role="dialog"
            aria-modal="true"
            aria-label="Layar pembuka DisasterReady"
            className={`fixed inset-0 z-50 flex min-h-dvh flex-col items-center justify-center overflow-hidden bg-intro-ground px-6 transition-opacity duration-300 ease-out ${
                exiting ? 'pointer-events-none opacity-0' : 'opacity-100'
            }`}
        >
            {/* Model A: Daylight / Nocturnal Hydro-Aurora WebGL Shader Ground */}
            <HydroAuroraCanvas dark={isDark} reducedMotion={reducedMotion} />

            {/* Dead-Center Focal Brand Lockup + Ultra-Thin 2px Hairline Loader */}
            <div
                className={`relative z-10 flex flex-col items-center text-center transition-[opacity,transform] duration-700 ease-out ${
                    entered
                        ? 'translate-y-0 scale-100 opacity-100'
                        : 'translate-y-3 scale-[0.97] opacity-0'
                }`}
            >
                {/* Single deliberate glass emblem housing (R-10 compliant) */}
                <div className="flex size-[84px] items-center justify-center rounded-[22px] border border-border/90 bg-card/80 shadow-[0_10px_28px_rgba(4,11,17,0.06)] backdrop-blur-md dark:bg-card/75 dark:shadow-[0_12px_32px_rgba(4,11,17,0.45)]">
                    <AppLogoIcon
                        className="size-11 text-intro-logo-shield"
                        beaconColor="var(--color-brand-accent)"
                    />
                </div>

                <h1 className="mt-5 text-[28px] leading-[1.15] font-semibold tracking-[-0.025em] text-intro-logo-fg">
                    DisasterReady
                </h1>

                {/* Precision 2px Hairline Progress Bar */}
                <div className="mt-6 flex flex-col items-center gap-3">
                    <div
                        className="h-[2px] w-[164px] overflow-hidden rounded-full bg-intro-loader-track"
                        role="progressbar"
                        aria-valuenow={progressPct}
                        aria-valuemin={0}
                        aria-valuemax={100}
                        aria-label="Progres persiapan pantauan DisasterReady"
                    >
                        <div
                            className="h-full rounded-full bg-gradient-to-r from-intro-loader-fill-start to-intro-loader-fill-end transition-[width] duration-700 ease-out"
                            style={{ width: `${progressPct}%` }}
                        />
                    </div>

                    <p
                        aria-live="polite"
                        className="text-xs font-normal tracking-[0.005em] text-muted-foreground"
                    >
                        Menyiapkan pantauan resmi
                    </p>
                </div>
            </div>

            {/* Unobtrusive accessible skip button at bottom edge (44px min tap target) */}
            <button
                type="button"
                onClick={finishIntro}
                className="relative z-10 mt-14 inline-flex min-h-11 cursor-pointer items-center justify-center rounded-full px-5 text-xs font-medium text-muted-foreground transition-colors duration-150 hover:text-intro-logo-fg focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none sm:absolute sm:bottom-6 sm:mt-0"
            >
                Lewati
            </button>
        </div>
    );
}
