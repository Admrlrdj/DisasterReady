import { createInertiaApp } from '@inertiajs/react';
import { Toaster } from '@/components/ui/sonner';
import { TooltipProvider } from '@/components/ui/tooltip';
import { initializeTheme } from '@/hooks/use-appearance';
import AppLayout from '@/layouts/app-layout';
import AuthLayout from '@/layouts/auth-layout';
import DisasterLayout from '@/layouts/disaster-layout';
import SettingsLayout from '@/layouts/settings/layout';

const appName = import.meta.env.VITE_APP_NAME || 'DisasterReady';

void createInertiaApp({
    title: (title) => (title ? `${title} - ${appName}` : appName),
    layout: (name) => {
        switch (true) {
            case name === 'welcome':
                return null;
            case name === 'dashboard':
                return AppLayout;
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
            </TooltipProvider>
        );
    },
    progress: {
        color: '#0F6594',
    },
});

// This will set light / dark mode on load...
initializeTheme();
