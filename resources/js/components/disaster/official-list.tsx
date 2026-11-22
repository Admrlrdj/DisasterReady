import { useEffect, useState } from 'react';
import {
    Action,
    EmptyState,
    Notice,
    RecordCard,
} from '@/components/disaster/ui';
import type { Pagination } from '@/lib/disaster';
import type { OfficialRecord } from '@/types/disaster';

export default function OfficialList({ endpoint }: { endpoint: string }) {
    const [rows, setRows] = useState<OfficialRecord[]>([]);
    const [url, setUrl] = useState<string | null>(endpoint);
    const [page, setPage] = useState<string | null>(endpoint);
    const [failed, setFailed] = useState(false);
    const [attempt, setAttempt] = useState(0);

    useEffect(() => {
        if (!url) return;
        const request = new AbortController();
        async function load() {
            try {
                const response = await fetch(url!, {
                    signal: request.signal,
                    headers: { Accept: 'application/json' },
                });
                if (!response.ok) throw new Error('Feed request failed');
                const result =
                    (await response.json()) as Pagination<OfficialRecord>;
                if (request.signal.aborted) return;
                setRows((previous) =>
                    Array.from(
                        new Map(
                            [...previous, ...result.data].map((item) => [
                                item.id,
                                item,
                            ]),
                        ).values(),
                    ),
                );
                const next = result.next_page_url
                    ? new URL(result.next_page_url)
                    : null;
                setPage(next ? next.pathname + next.search : null);
            } catch {
                if (!request.signal.aborted) setFailed(true);
            } finally {
                if (!request.signal.aborted) setUrl(null);
            }
        }
        void load();
        return () => request.abort();
    }, [url, attempt]);

    function next() {
        setFailed(false);
        setUrl(page);
        setAttempt((value) => value + 1);
    }

    return (
        <>
            {rows.map((record) => (
                <RecordCard key={record.id} record={record} />
            ))}
            {failed && <Notice danger>Daftar BMKG belum dapat dimuat.</Notice>}
            {url && (
                <p role="status" className="dr-caption dr-muted">
                    Memuat daftar BMKG…
                </p>
            )}
            {!url && !rows.length && !failed && (
                <EmptyState title="Belum ada data pada pilihan ini" />
            )}
            {page && !url && (
                <Action variant="outline" onClick={next}>
                    {failed ? 'Coba lagi' : 'Muat lebih banyak'}
                </Action>
            )}
        </>
    );
}
