import { createInertiaApp } from '@inertiajs/react';
import ActivityToasts from '@/components/disaster/activity-toasts';
import { Toaster } from '@/components/ui/sonner';
import { TooltipProvider } from '@/components/ui/tooltip';
import { initializeTheme } from '@/hooks/use-appearance';
import DisasterLayout from '@/layouts/disaster-layout';
import AuthLayout from '@/layouts/auth-layout';
import SettingsLayout from '@/layouts/settings/layout';

const appName = import.meta.env.VITE_APP_NAME || 'DisasterReady';

void createInertiaApp({
    title: (title) => (title ? `${title} - ${appName}` : appName),
    layout: (name) => {
        switch (true) {
            case name === 'welcome':
                return null;
            case name.startsWith('auth/'):
                return AuthLayout;
            case name === 'settings/overview':
                return DisasterLayout;
            case name.startsWith('settings/'):
                return [DisasterLayout, SettingsLayout];
            default:
                return DisasterLayout;
        }
    },
    strictMode: true,
    withApp(app) {
        return (
            <TooltipProvider delayDuration={0}>
                {app}
                <Toaster />
                <ActivityToasts />
            </TooltipProvider>
        );
    },
    progress: {
        color: '#0C3B2E',
    },
});

// This will set light / dark mode on load...
initializeTheme();
