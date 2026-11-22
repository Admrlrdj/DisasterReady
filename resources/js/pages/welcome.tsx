import { Head, Link, usePage } from '@inertiajs/react';
import { useState } from 'react';
import { Action, Brand, Notice, Panel, Status } from '@/components/disaster/ui';
import MapPanel from '@/components/maps/map-panel';
import { dateTime, type Overview } from '@/lib/disaster';
export default function Welcome({ overview }: { overview: Overview }) {
    const { auth } = usePage().props;
    const [kind, setKind] = useState<'event' | 'alert'>('event');
    return (
        <div className="dr-landing">
            <Head title="Informasi bencana, lebih siap bersama" />
            <header className="dr-landing-header">
                <Brand subtitle={false} landing />
                <nav className="dr-landing-nav">
                    <Link href="/dashboard">Pantauan Nasional</Link>
                    <Link href="/map">Peta Pilot Jatinegara</Link>
                    <Link href="/preparedness">Kesiapsiagaan</Link>
                    <Link href="/reports/create">Kirim Laporan</Link>
                </nav>
                <div className="dr-actions">
                    {!auth.user && (
                        <Action variant="outline" asChild>
                            <Link href="/login">Masuk</Link>
                        </Action>
                    )}
                    <Action asChild>
                        <Link href="/dashboard">Buka Dashboard</Link>
                    </Action>
                </div>
            </header>
            <main className="dr-landing-main">
                <section className="dr-hero">
                    <div className="dr-hero-copy">
                        <h1>Pantau bencana di Indonesia</h1>
                        <p>
                            Lihat gempa, peringatan cuaca BMKG, dan panduan
                            kesiapsiagaan di satu tempat.
                        </p>
                        <div className="dr-actions">
                            <Action asChild>
                                <Link href="/map">Buka Peta Multi-Bencana</Link>
                            </Action>
                            <Action variant="outline" asChild>
                                <Link href="/reports/create">
                                    Kirim Laporan Warga
                                </Link>
                            </Action>
                        </div>
                        <Notice>
                            Ikuti arahan petugas setempat. Darurat resmi:{' '}
                            <a href="tel:117">BNPB 117</a>,{' '}
                            <a href="tel:115">Basarnas 115</a>,{' '}
                            <a href="tel:112">DKI 112</a>.
                        </Notice>
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
                        <MapPanel kind={kind} activeOnly />
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
                            Ringkasan dan saran duplikat dari simulasi AI
                            membantu proses peninjauan.
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
