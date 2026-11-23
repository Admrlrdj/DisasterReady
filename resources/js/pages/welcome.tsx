import { Head, Link, usePage } from '@inertiajs/react';
import { CloudLightning, CloudRain } from 'lucide-react';
import { useState } from 'react';
import { Action, Brand, Panel, Status } from '@/components/disaster/ui';
import MapPanel from '@/components/maps/map-panel';
import { dateTime, type Overview } from '@/lib/disaster';
export default function Welcome({ overview }: { overview: Overview }) {
    const { auth } = usePage().props;
    const [kind, setKind] = useState<'event' | 'alert'>('event');
    const alertSource = overview.sources.find((source) =>
        source.name.includes('BMKG CAP'),
    );
    return (
        <div className="dr-landing">
            <Head title="Informasi bencana, lebih siap bersama" />
            <header className="dr-landing-header">
                <Brand subtitle={false} landing />
                <nav className="dr-landing-nav">
                    <Link href="/dashboard">Pantauan Nasional</Link>
                    <Link href="/weather">Prakiraan Cuaca</Link>
                    <Link href="/preparedness">Kesiapsiagaan</Link>
                    <Link href="/reports/create">Kirim Laporan</Link>
                </nav>
                <div className="dr-actions">
                    {!auth.user && (
                        <Action variant="outline" asChild>
                            <Link href="/login">Masuk</Link>
                        </Action>
                    )}
                </div>
            </header>
            <main className="dr-landing-main">
                <section className="dr-hero dr-front">
                    <div className="dr-hero-copy dr-front-intro">
                        <div>
                            <h1>Pantau bencana di Indonesia</h1>
                            <p>
                                Lihat gempa terbaru, peringatan BMKG, dan
                                prakiraan untuk wilayahmu.
                            </p>
                        </div>
                        <div className="dr-actions">
                            <Action asChild>
                                <Link href="/dashboard">
                                    Buka Pantauan Nasional
                                </Link>
                            </Action>
                            <Action variant="outline" asChild>
                                <Link href="/weather">Cek Prakiraan Cuaca</Link>
                            </Action>
                        </div>
                    </div>
                    <div className="dr-front-priority">
                        <Link
                            href="/weather#peringatan"
                            className="dr-front-alert"
                        >
                            <div>
                                <strong>Peringatan cuaca BMKG</strong>
                                <p>
                                    Data terakhir diterima{' '}
                                    {dateTime(
                                        alertSource?.last_success_at ?? null,
                                    )}
                                </p>
                            </div>
                            <Status
                                value={alertSource?.freshness ?? 'UNAVAILABLE'}
                            />
                        </Link>
                        <p className="dr-front-emergency">
                            Bantuan darurat <a href="tel:117">BNPB 117</a>{' '}
                            <a href="tel:115">Basarnas 115</a>{' '}
                            <a href="tel:112">DKI 112</a>
                        </p>
                    </div>
                    <section
                        className="dr-hero-preview"
                        aria-labelledby="landing-map-title"
                    >
                        <div className="dr-map-toolbar">
                            <h2 id="landing-map-title">Peta Indonesia</h2>
                            <div
                                className="dr-choices"
                                role="group"
                                aria-label="Lapisan peta beranda"
                            >
                                <button
                                    className={`dr-choice ${kind === 'event' ? 'active' : ''}`}
                                    type="button"
                                    aria-pressed={kind === 'event'}
                                    onClick={() => setKind('event')}
                                >
                                    Gempa
                                </button>
                                <button
                                    className={`dr-choice ${kind === 'alert' ? 'active' : ''}`}
                                    type="button"
                                    aria-pressed={kind === 'alert'}
                                    onClick={() => setKind('alert')}
                                >
                                    Peringatan Cuaca
                                </button>
                            </div>
                        </div>
                        <MapPanel kind={kind} activeOnly hazardMarkers />
                        <div
                            className="dr-map-legend"
                            aria-label="Legenda peta"
                        >
                            {kind === 'event' ? (
                                <span className="inline-flex items-center gap-2">
                                    <span
                                        className="mx-1 size-2 rounded-full bg-red-700 ring-2 ring-red-400 ring-offset-2"
                                        aria-hidden="true"
                                    />
                                    Titik gempa BMKG · cincin pada kejadian
                                    terbaru
                                </span>
                            ) : (
                                <>
                                    <span className="inline-flex items-center gap-1">
                                        <CloudRain
                                            size={16}
                                            aria-hidden="true"
                                        />
                                        Hujan
                                    </span>
                                    <span className="inline-flex items-center gap-1">
                                        <CloudLightning
                                            size={16}
                                            aria-hidden="true"
                                        />
                                        Petir
                                    </span>
                                    <span className="inline-flex items-center gap-1">
                                        <span
                                            className="flex gap-0.5"
                                            aria-hidden="true"
                                        >
                                            {[
                                                '#93c5fd',
                                                '#3b82f6',
                                                '#1e3a8a',
                                            ].map((color) => (
                                                <span
                                                    key={color}
                                                    className="size-3 rounded-sm"
                                                    style={{
                                                        backgroundColor: color,
                                                    }}
                                                />
                                            ))}
                                        </span>
                                        Biru lebih gelap untuk hujan lebih deras
                                    </span>
                                </>
                            )}
                        </div>
                        <p className="dr-caption dr-muted">
                            Sumber data:{' '}
                            <a
                                className="underline"
                                href={
                                    kind === 'event'
                                        ? 'https://data.bmkg.go.id/gempabumi/'
                                        : 'https://data.bmkg.go.id/peringatan-dini-cuaca/'
                                }
                            >
                                BMKG
                            </a>{' '}
                            ·{' '}
                            <Link
                                className="underline"
                                href={
                                    kind === 'event'
                                        ? '/earthquakes'
                                        : '/weather'
                                }
                            >
                                Buka daftar
                            </Link>
                        </p>
                    </section>
                </section>
                <section className="dr-landing-lower">
                    <Panel title="Sumber Data Resmi">
                        <div className="dr-source-cards">
                            {overview.sources.map((source) => (
                                <div className="dr-source-card" key={source.id}>
                                    <span className="dr-eyebrow">
                                        {source.agency}
                                    </span>
                                    <h3>
                                        <a
                                            className="hover:underline"
                                            href={source.source_url}
                                            target="_blank"
                                            rel="noreferrer"
                                        >
                                            {source.name}
                                        </a>
                                    </h3>
                                    <Status value={source.freshness} />
                                    <span className="dr-caption dr-muted">
                                        {dateTime(source.last_success_at)}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </Panel>
                    <Panel title="Cara laporan ditinjau">
                        <p>
                            Moderator memeriksa laporan dan bukti warga.
                            Ringkasan dan saran duplikat dari AI membantu proses
                            peninjauan.
                        </p>
                        <Action variant="outline" asChild>
                            <Link href="/preparedness">
                                Pelajari Panduan Siaga ↗
                            </Link>
                        </Action>
                    </Panel>
                </section>
            </main>
            <footer className="dr-row dr-caption dr-muted px-6 py-6">
                DisasterReady
                <Link href="/map">Informasi beserta sumbernya ↗</Link>
            </footer>
        </div>
    );
}
