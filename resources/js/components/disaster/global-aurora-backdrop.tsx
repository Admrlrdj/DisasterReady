import {
    Layers,
    Moon,
    Pause,
    Play,
    RotateCcw,
    Search,
    Sun,
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { HydroAuroraCanvas } from '@/features/disaster/components/hydro-aurora-canvas';
import { useAppearance } from '@/hooks/use-appearance';
import {
    PAGE_VARIANTS,
    usePageVariant,
    type PageVariant,
} from '@/hooks/use-page-variant';
import { cn } from '@/lib/utils';
import { CommandPaletteModal } from './command-palette';

function detectDarkClass(): boolean {
    if (typeof document === 'undefined') return false;
    return document.documentElement.classList.contains('dark');
}

function detectReducedMotion(): boolean {
    if (typeof window === 'undefined') return false;
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

/**
 * Global Calibrated Hydro-Aurora Background from Intro Page.
 * Renders the approved Model A Hydro-Aurora WebGL shader behind every page,
 * calibrated with a subtle readability veil so text, numbers, and maps
 * remain razor-sharp and pass WCAG 2.2 AA contrast.
 */
export function GlobalAuroraBackdrop({
    intensity = 'workspace',
}: {
    intensity?: 'landing' | 'workspace' | 'map';
}) {
    const { auroraPaused } = usePageVariant();
    const [isDark, setIsDark] = useState(false);
    const [reducedMotion, setReducedMotion] = useState(false);
    const [tabHidden, setTabHidden] = useState(false);

    useEffect(() => {
        setIsDark(detectDarkClass());
        setReducedMotion(detectReducedMotion());

        const mql = window.matchMedia('(prefers-reduced-motion: reduce)');
        const onMotion = (e: MediaQueryListEvent) =>
            setReducedMotion(e.matches);
        mql.addEventListener('change', onMotion);

        const observer = new MutationObserver(() => {
            setIsDark(detectDarkClass());
        });
        observer.observe(document.documentElement, {
            attributes: true,
            attributeFilter: ['class'],
        });

        const onVis = () => setTabHidden(document.hidden);
        document.addEventListener('visibilitychange', onVis);

        return () => {
            mql.removeEventListener('change', onMotion);
            observer.disconnect();
            document.removeEventListener('visibilitychange', onVis);
        };
    }, []);

    const shouldFreeze = reducedMotion || auroraPaused || tabHidden;

    // Calibrated opacity veil per surface density so foreground text passes >= 4.5:1
    const veilClass =
        intensity === 'landing'
            ? 'bg-background/64 dark:bg-background/60'
            : intensity === 'map'
              ? 'bg-background/74 dark:bg-background/72'
              : 'bg-background/72 dark:bg-background/70';

    return (
        <div
            aria-hidden="true"
            className="pointer-events-none fixed inset-0 z-0 overflow-hidden"
        >
            <HydroAuroraCanvas dark={isDark} reducedMotion={shouldFreeze} />
            <div
                className={cn(
                    'absolute inset-0 transition-colors duration-300',
                    veilClass,
                )}
            />
        </div>
    );
}

/**
 * Universal 3-Version Variant Switcher + Command Palette Trigger + Aurora Motion Pause Control.
 * Lets the user compare and pick among 3 versions (Versi A, Versi B, Versi C) on every page.
 */
export function PageVariantSwitcherBar({
    pageLabel,
    onReplayIntro,
    compact = false,
    className,
}: {
    pageLabel?: string;
    onReplayIntro?: () => void;
    compact?: boolean;
    className?: string;
}) {
    const {
        variant,
        meta,
        setVariant,
        auroraPaused,
        toggleAuroraPaused,
    } = usePageVariant();
    const { resolvedAppearance, updateAppearance } = useAppearance();
    const [commandOpen, setCommandOpen] = useState(false);

    return (
        <>
            <div
                role="region"
                aria-label="Pemilih versi tampilan halaman dan komando cepat"
                className={cn(
                    'relative z-10 flex flex-wrap items-center justify-between gap-2 rounded-2xl border border-border/85 bg-card/85 px-3 py-2 text-xs shadow-xs backdrop-blur-md',
                    className,
                )}
            >
                <div className="flex flex-wrap items-center gap-2">
                    <span className="inline-flex items-center gap-1.5 font-semibold text-foreground">
                        <Layers
                            className="size-3.5 text-primary"
                            aria-hidden="true"
                        />
                        <span>
                            {pageLabel
                                ? `Model UI (${pageLabel}):`
                                : 'Pilih Model UI:'}
                        </span>
                    </span>

                    <div
                        role="group"
                        aria-label="Pilih 1 dari 3 versi tampilan halaman"
                        className="inline-flex items-center gap-1 rounded-full border border-border/80 bg-background/80 p-0.5"
                    >
                        {PAGE_VARIANTS.map((item) => {
                            const active = variant === item.id;
                            return (
                                <button
                                    key={item.id}
                                    type="button"
                                    aria-pressed={active}
                                    title={`${item.shortLabel}: ${item.name} (${item.summary})`}
                                    onClick={() =>
                                        setVariant(item.id as PageVariant)
                                    }
                                    className={cn(
                                        'pressable inline-flex min-h-8 cursor-pointer items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold transition-colors focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none',
                                        active
                                            ? 'bg-primary text-primary-foreground shadow-2xs'
                                            : 'text-muted-foreground hover:text-foreground',
                                    )}
                                >
                                    <span>{item.shortLabel}</span>
                                    {!compact && (
                                        <span
                                            className={cn(
                                                'hidden md:inline',
                                                active
                                                    ? 'text-primary-foreground/95'
                                                    : 'text-muted-foreground',
                                            )}
                                        >
                                            · {item.name}
                                        </span>
                                    )}
                                </button>
                            );
                        })}
                    </div>

                    {!compact && (
                        <span className="hidden text-[11px] text-muted-foreground xl:inline">
                            {meta.summary}
                        </span>
                    )}
                </div>

                <div className="flex flex-wrap items-center gap-1.5">
                    <button
                        type="button"
                        onClick={() => setCommandOpen(true)}
                        aria-label="Buka palet komando cepat (Ctrl+K)"
                        className="pressable inline-flex min-h-8 cursor-pointer items-center gap-1.5 rounded-full border border-border/80 bg-background/80 px-2.5 py-1 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
                    >
                        <Search className="size-3.5" aria-hidden="true" />
                        <span className="hidden sm:inline">Cari Cepat</span>
                        <kbd className="rounded border border-border bg-muted px-1 py-0.2 text-[10px] font-semibold">
                            Ctrl+K
                        </kbd>
                    </button>

                    <button
                        type="button"
                        onClick={toggleAuroraPaused}
                        aria-pressed={auroraPaused}
                        aria-label={
                            auroraPaused
                                ? 'Putar animasi latar Hydro-Aurora'
                                : 'Jedakan animasi latar Hydro-Aurora'
                        }
                        title={
                            auroraPaused
                                ? 'Putar animasi latar Hydro-Aurora'
                                : 'Jedakan animasi latar Hydro-Aurora (WCAG 2.2.2)'
                        }
                        className="pressable inline-flex min-h-8 cursor-pointer items-center gap-1 rounded-full border border-border/80 bg-background/80 px-2.5 py-1 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
                    >
                        {auroraPaused ? (
                            <Play className="size-3.5" aria-hidden="true" />
                        ) : (
                            <Pause className="size-3.5" aria-hidden="true" />
                        )}
                        <span className="hidden sm:inline">
                            {auroraPaused ? 'Aurora Dijeda' : 'Aurora Aktif'}
                        </span>
                    </button>

                    <button
                        type="button"
                        onClick={() =>
                            updateAppearance(
                                resolvedAppearance === 'dark'
                                    ? 'light'
                                    : 'dark',
                            )
                        }
                        aria-label="Ubah tema terang atau gelap"
                        title="Ubah tema terang atau gelap"
                        className="pressable inline-flex size-8 cursor-pointer items-center justify-center rounded-full border border-border/80 bg-background/80 text-muted-foreground transition-colors hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
                    >
                        <Sun
                            className="hidden size-3.5 dark:block"
                            aria-hidden="true"
                        />
                        <Moon
                            className="block size-3.5 dark:hidden"
                            aria-hidden="true"
                        />
                    </button>

                    {onReplayIntro && (
                        <button
                            type="button"
                            onClick={onReplayIntro}
                            className="pressable inline-flex min-h-8 cursor-pointer items-center gap-1 rounded-full border border-border/80 bg-background/80 px-2.5 py-1 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
                        >
                            <RotateCcw
                                className="size-3.5"
                                aria-hidden="true"
                            />
                            <span>Intro</span>
                        </button>
                    )}
                </div>
            </div>

            <CommandPaletteModal
                open={commandOpen}
                onOpenChange={setCommandOpen}
            />
        </>
    );
}
