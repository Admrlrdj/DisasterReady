import { usePage } from '@inertiajs/react';

import AppLogoIcon from '@/components/app-logo-icon';

export default function AppLogo() {
    const { name } = usePage().props;

    return (
        <>
            <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
                <AppLogoIcon className="size-5" />
            </div>
            <div className="ml-1 grid flex-1 text-left leading-tight">
                <span className="truncate text-sm font-bold tracking-tight">
                    {name || 'DisasterReady'}
                </span>
                <span className="truncate text-xs font-medium tracking-wider text-muted-foreground uppercase">
                    Multi-Hazard · ID
                </span>
            </div>
        </>
    );
}
