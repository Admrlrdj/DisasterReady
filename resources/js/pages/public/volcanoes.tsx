import { Head, Link, router } from '@inertiajs/react';
import { ChevronRight, Mountain } from 'lucide-react';
import { useRef, useState } from 'react';
import {
    Action,
    EmptyState,
    Notice,
    PageHeading,
    Panel,
} from '@/components/disaster/ui';
import {
    Dialog,
    DialogClose,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { dateTime } from '@/lib/disaster';

const levels = [
    { id: 4, numeral: 'IV', label: 'Awas' },
    { id: 3, numeral: 'III', label: 'Siaga' },
    { id: 2, numeral: 'II', label: 'Waspada' },
    { id: 1, numeral: 'I', label: 'Normal' },
] as const;

type Level = (typeof levels)[number]['id'];
const zones = {
    WIB: 'Asia/Jakarta',
    WITA: 'Asia/Makassar',
    WIT: 'Asia/Jayapura',
};

type Volcano = {
    slug: string;
    name: string;
    region: string;
    level: Level;
    source_url: string;
    report: {
        observed_from: string;
        observed_until: string;
        timezone: keyof typeof zones;
        summary: string;
    } | null;
};

type Snapshot = {
    checked_at: string;
    status_url: string;
    reports_url: string;
    volcanoes: Volcano[];
};

function localTime(value: string, timezone: keyof typeof zones): string {
    const time = new Intl.DateTimeFormat('id-ID', {
        dateStyle: 'medium',
        timeStyle: 'short',
        timeZone: zones[timezone],
    }).format(new Date(value));

    return `${time} ${timezone}`;
}

export default function Volcanoes({
    snapshot,
    selected,
    archived,
}: {
    snapshot: Snapshot;
    selected: string | null;
    archived: boolean;
}) {
    const [filter, setFilter] = useState<Level | null>(null);
    const opener = useRef<HTMLAnchorElement | null>(null);
    const listHeading = useRef<HTMLHeadingElement>(null);
    const { volcanoes } = snapshot;
    const detail = volcanoes.find((volcano) => volcano.slug === selected);
    const filtered =
        filter === null
            ? volcanoes
            : volcanoes.filter((item) => item.level === filter);
    const currentLevel = levels.find(({ id }) => id === filter);
    const detailLevel = levels.find(({ id }) => id === detail?.level);

    return (
        <>
            <Head
                title={
                    detail
                        ? `${detail.name} · Gunung Api`
                        : 'Informasi Gunung Api'
                }
            />
            <PageHeading
                title="Informasi Gunung Api"
                description="Tingkat aktivitas gunung api yang tercantum di MAGMA Indonesia."
            >
                <Action variant="outline" asChild>
                    <a
                        href={snapshot.status_url}
                        target="_blank"
                        rel="noreferrer"
                    >
                        Cek status di MAGMA ↗
                    </a>
                </Action>
            </PageHeading>
            <Notice>
                {archived ? 'Data arsip · ' : 'Snapshot · '}
                Diperiksa {dateTime(snapshot.checked_at)}. Untuk status dan
                arahan terkini, buka MAGMA.
            </Notice>
            <section
                className="dr-volcano-summary"
                aria-label="Filter tingkat aktivitas"
            >
                {levels.map(({ id, numeral, label }) => (
                    <button
                        key={id}
                        type="button"
                        className="dr-volcano-card"
                        data-level={id}
                        aria-pressed={filter === id}
                        onClick={() => setFilter(filter === id ? null : id)}
                    >
                        <Mountain size={28} aria-hidden="true" />
                        <span>
                            <strong>
                                {
                                    volcanoes.filter(
                                        (volcano) => volcano.level === id,
                                    ).length
                                }
                            </strong>
                            <span>
                                Level {numeral} · {label}
                            </span>
                        </span>
                    </button>
                ))}
            </section>
            <Panel>
                <div className="dr-row">
                    <h2 ref={listHeading} tabIndex={-1}>
                        {currentLevel
                            ? `Level ${currentLevel.numeral} · ${currentLevel.label}`
                            : 'Daftar Gunung Api'}
                    </h2>
                    <p role="status" className="dr-caption dr-muted">
                        {filtered.length} gunung
                    </p>
                    {filter !== null && (
                        <Action
                            variant="outline"
                            type="button"
                            onClick={() => setFilter(null)}
                        >
                            Tampilkan semua
                        </Action>
                    )}
                </div>
                {filtered.length === 0 ? (
                    <EmptyState title="Tidak ada gunung pada level ini dalam snapshot." />
                ) : (
                    <ul className="dr-volcano-list">
                        {filtered.map((volcano) => {
                            const level = levels.find(
                                ({ id }) => id === volcano.level,
                            );
                            return (
                                <li key={volcano.slug}>
                                    <Link
                                        className="dr-volcano-link"
                                        href={`/volcanoes/${volcano.slug}`}
                                        preserveScroll
                                        preserveState
                                        aria-haspopup="dialog"
                                        onClick={(event) => {
                                            if (
                                                event.currentTarget instanceof
                                                HTMLAnchorElement
                                            ) {
                                                opener.current =
                                                    event.currentTarget;
                                            }
                                        }}
                                    >
                                        <span>
                                            <strong>{volcano.name}</strong>
                                            <small>{volcano.region}</small>
                                        </span>
                                        <span
                                            className="dr-volcano-level"
                                            data-level={volcano.level}
                                        >
                                            {level?.numeral} · {level?.label}
                                        </span>
                                        <ChevronRight
                                            size={17}
                                            aria-hidden="true"
                                        />
                                    </Link>
                                </li>
                            );
                        })}
                    </ul>
                )}
                <div className="dr-actions">
                    <a
                        className="underline"
                        href={snapshot.reports_url}
                        target="_blank"
                        rel="noreferrer"
                    >
                        Daftar laporan MAGMA ↗
                    </a>
                    <Link className="underline" href="/preparedness/volcano">
                        Panduan kesiapsiagaan
                    </Link>
                </div>
            </Panel>
            <Dialog
                open={!!detail}
                onOpenChange={(open) => {
                    if (!open) {
                        router.get(
                            '/volcanoes',
                            {},
                            {
                                preserveScroll: true,
                                preserveState: true,
                                replace: true,
                            },
                        );
                    }
                }}
            >
                {detail && (
                    <DialogContent
                        className="dr-volcano-dialog"
                        onCloseAutoFocus={(event) => {
                            event.preventDefault();
                            (opener.current?.isConnected
                                ? opener.current
                                : listHeading.current
                            )?.focus();
                        }}
                    >
                        <DialogHeader>
                            <DialogTitle>{detail.name}</DialogTitle>
                            <DialogDescription>
                                {detail.region}
                            </DialogDescription>
                        </DialogHeader>
                        <p
                            className="dr-volcano-level"
                            data-level={detail.level}
                        >
                            Level {detailLevel?.numeral} · {detailLevel?.label}{' '}
                            pada snapshot
                        </p>
                        <div className="dr-stack">
                            <h3>Laporan Pengamatan</h3>
                            {detail.report ? (
                                <>
                                    <p className="dr-caption dr-muted">
                                        {localTime(
                                            detail.report.observed_from,
                                            detail.report.timezone,
                                        )}
                                        {' – '}
                                        {localTime(
                                            detail.report.observed_until,
                                            detail.report.timezone,
                                        )}
                                    </p>
                                    <p>{detail.report.summary}</p>
                                </>
                            ) : (
                                <p>
                                    Ringkasan belum tersedia. Periode pengamatan
                                    dan rincian dapat dibaca di laporan resmi.
                                </p>
                            )}
                        </div>
                        <div className="dr-actions">
                            <Action asChild>
                                <a
                                    href={detail.source_url}
                                    target="_blank"
                                    rel="noreferrer"
                                >
                                    Buka laporan PVMBG ↗
                                </a>
                            </Action>
                            <DialogClose asChild>
                                <Action variant="outline" type="button">
                                    Tutup
                                </Action>
                            </DialogClose>
                        </div>
                    </DialogContent>
                )}
            </Dialog>
        </>
    );
}
