import { router } from '@inertiajs/react';
import { useEffect, useState } from 'react';
import { toast, Toaster } from 'sonner';
import { dateTime } from '@/lib/disaster';

type Activity = {
    id: string;
    kind: 'event' | 'alert' | 'volcano';
    title: string;
    source_time: string;
    source: string;
    href: string;
};

const toaster = 'official-activity';
const seenKey = 'disasterready:seen-activity';
const seen = new Set<string>();
const shown = new Set<string>();

function restoreSeen() {
    try {
        const ids: string[] = JSON.parse(
            sessionStorage.getItem(seenKey) ?? '[]',
        );
        ids.forEach((id) => seen.add(id));
    } catch {
        // Keep deduplication in memory when session storage is unavailable.
    }
}

function saveSeen() {
    try {
        sessionStorage.setItem(seenKey, JSON.stringify([...seen]));
    } catch {
        // The current tab still keeps its in-memory history.
    }
}

export default function ActivityToasts() {
    const [landing, setLanding] = useState(true);

    useEffect(() => {
        setLanding(window.location.pathname === '/');
        return router.on('navigate', ({ detail }) => {
            const isLanding =
                new URL(detail.page.url, window.location.origin).pathname ===
                '/';
            if (isLanding) {
                shown.forEach((id) => toast.dismiss(id));
                shown.clear();
            }
            setLanding(isLanding);
        });
    }, []);

    useEffect(() => {
        if (landing) return;
        restoreSeen();
        const lifetime = new AbortController();

        async function refresh() {
            if (
                document.visibilityState !== 'visible' ||
                window.location.pathname === '/'
            )
                return;

            try {
                const response = await fetch('/data/activity', {
                    headers: { Accept: 'application/json' },
                    signal: AbortSignal.any([
                        lifetime.signal,
                        AbortSignal.timeout(12_000),
                    ]),
                });
                if (!response.ok) return;
                const { data } = (await response.json()) as {
                    data: Activity[];
                };
                if (
                    lifetime.signal.aborted ||
                    document.visibilityState !== 'visible' ||
                    window.location.pathname === '/'
                )
                    return;

                // Sonner places the last added toast at the top of the stack.
                for (const item of data.slice(0, 3).reverse()) {
                    if (seen.has(item.id)) continue;
                    seen.add(item.id);
                    const id = `official:${item.id}`;
                    shown.add(id);
                    toast(item.title, {
                        id,
                        toasterId: toaster,
                        description: `${item.source} · ${dateTime(item.source_time)}`,
                        action: {
                            label: 'Lihat',
                            onClick: () => router.visit(item.href),
                        },
                        onDismiss: () => shown.delete(id),
                        onAutoClose: () => shown.delete(id),
                    });
                }
                saveSeen();
            } catch {
                // The next poll can recover without interrupting page use.
            }
        }

        void refresh();
        const poll = window.setInterval(refresh, 60_000);
        return () => {
            lifetime.abort();
            window.clearInterval(poll);
        };
    }, [landing]);

    return landing ? null : (
        <Toaster
            id={toaster}
            position="top-right"
            visibleToasts={3}
            expand
            theme="light"
            duration={9000}
            closeButton
            containerAriaLabel="Pembaruan aktivitas resmi"
            mobileOffset={{ top: 64, right: 12, left: 12 }}
        />
    );
}
