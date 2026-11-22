import { Link, usePage } from '@inertiajs/react';
import { Brand, Status } from '@/components/disaster/ui';

export default function AuthLayout({
    title = '',
    description = '',
    children,
}: {
    title?: string;
    description?: string;
    children: React.ReactNode;
}) {
    return (
        <div className="dr-auth">
            <aside className="dr-auth-sidebar">
                <Brand />
                <div>
                    <Status tone="simulation">BERSIAP BERSAMA</Status>
                    <h2 className="mt-6">
                        Satu langkah lebih siap.
                        <br />
                        Saling menjaga Indonesia.
                    </h2>
                    <p>
                        Informasi resmi, panduan kesiapsiagaan, dan laporan
                        warga dalam satu tempat.
                    </p>
                </div>
                <div className="dr-auth-aside-detail">
                    <p>
                        AI membantu membaca laporan.
                        <br />
                        Manusia tetap memverifikasi.
                    </p>
                    <small>DisasterReady · Multi-Hazard Indonesia</small>
                </div>
            </aside>
            <main className="dr-auth-main">
                <section className="dr-auth-card">
                    <AuthTabs />
                    <h1>{title || 'Selamat datang'}</h1>
                    {description && <p>{description}</p>}
                    {children}
                </section>
                <Link href="/" className="dr-caption dr-muted mt-6">
                    ← Kembali ke beranda
                </Link>
            </main>
        </div>
    );
}

function AuthTabs() {
    const { url } = usePage();
    return (
        <nav className="dr-auth-tabs" aria-label="Akun">
            <Link
                href="/login"
                className={url.startsWith('/login') ? 'active' : ''}
            >
                Masuk
            </Link>
            <Link
                href="/register"
                className={url.startsWith('/register') ? 'active' : ''}
            >
                Daftar Akun
            </Link>
        </nav>
    );
}
