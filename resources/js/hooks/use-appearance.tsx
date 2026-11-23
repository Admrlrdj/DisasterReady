export function initializeTheme(): void {
    if (typeof document !== 'undefined') {
        document.documentElement.classList.remove('dark');
        document.documentElement.style.colorScheme = 'light';
    }
}

type ResolvedAppearance = 'light' | 'dark';
type Appearance = ResolvedAppearance | 'system';

export function useAppearance(): {
    appearance: Appearance;
    resolvedAppearance: ResolvedAppearance;
} {
    return { appearance: 'light', resolvedAppearance: 'light' };
}
