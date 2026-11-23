import { Link, router, usePage } from '@inertiajs/react';
import { useState } from 'react';
import type { PropsWithChildren } from 'react';
import { Action, Brand } from '@/components/disaster/ui';
import { CloudSun } from 'lucide-react';
import {
    Dialog,
    DialogContent,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';
import { figmaAssets } from '@/lib/figma-assets';
import type { Contact } from '@/lib/disaster';
import { cn } from '@/lib/utils';

const icons = figmaAssets['5-14'];
const navigation = [
    { href: '/dashboard', label: 'Kondisi Sekitar', icon: icons.imgFrame1 },
    { href: '/map', label: 'Peta Situasi', icon: icons.imgFrame2 },
    { href: '/bantuan', label: 'Informasi Bantuan', icon: icons.imgFrame8 },
    { href: '/preparedness', label: 'Panduan Siaga', icon: icons.imgFrame5 },
    {
        href: '/reports/create',
        label: 'Laporkan Kejadian',
        icon: icons.imgFrame6,
    },
    { href: '/my/reports', label: 'Laporan Saya', icon: icons.imgFrame6 },
    { href: '/earthquakes', label: 'Gempa Bumi', icon: icons.imgFrame3 },
    { href: '/weather', label: 'Prakiraan Cuaca', icon: null },
    { href: '/volcanoes', label: 'Gunung Api PVMBG', icon: icons.imgFrame4 },
    {
        href: '/admin/reports',
        label: 'Tinjau Laporan',
        icon: icons.imgFrame7,
        role: 'moderator',
    },
    {
        href: '/admin/sources',
        label: 'Adapter & AI Health',
        icon: icons.imgFrame9,
        role: 'admin',
    },
    {
        href: '/admin/guides',
        label: 'Panduan & Korpus',
        icon: icons.imgFrame5,
        role: 'admin',
    },
    {
        href: '/admin/audit-logs',
        label: 'Audit Log',
        icon: icons.imgFrame9,
        role: 'admin',
    },
    {
        href: '/admin/shelters',
        label: 'Verifikasi Shelter',
        icon: icons.imgFrame8,
        role: 'admin',
    },
    {
        href: '/admin/road-restrictions',
        label: 'Pembatasan Ruas',
        icon: icons.imgFrame2,
        role: 'admin',
    },
    { href: '/settings', label: 'Pengaturan', icon: icons.imgFrame9 },
];

export default function DisasterLayout({ children }: PropsWithChildren) {
    const { auth, notice, pending_reports, emergency_contacts } = usePage<{
        auth: { user: { name: string; role: string } | null };
        notice?: string;
        pending_reports: number | null;
        emergency_contacts: Contact[];
    }>().props;
    const { url } = usePage();
    const [menuOpen, setMenuOpen] = useState(false);
    const role = auth.user?.role;
    const visible = navigation.filter(
        (item) =>
            !item.role ||
            role === 'admin' ||
            (item.role === 'moderator' && role === 'moderator'),
    );
    const active = (href: string) =>
        url.split('?')[0] === href ||
        (href !== '/dashboard' && url.startsWith(href + '/'));
    const nav = (
        <>
            <div className="dr-sidebar-top">
                <Brand />
                <Link
                    href={auth.user ? '/settings' : '/login'}
                    className="dr-account"
                >
                    <span className="dr-avatar">
                        {auth.user
                            ? auth.user.name
                                  .split(' ')
                                  .map((word) => word[0])
                                  .slice(0, 2)
                                  .join('')
                            : 'DR'}
                    </span>
                    <span>
                        <strong>{auth.user?.name ?? 'Pengunjung'}</strong>
                        <small>
                            {role === 'admin'
                                ? 'ADMIN · SISTEM'
                                : role === 'moderator'
                                  ? 'MODERATOR · REVIEW MANUSIA'
                                  : auth.user
                                    ? 'WARGA · TERDAFTAR'
                                    : 'AKSES PUBLIK'}
                        </small>
                    </span>
                </Link>
                <nav aria-label="Navigasi utama">
                    {visible.map((item, index) => (
                        <div key={item.href}>
                            {(index === 0 ||
                                [
                                    '/reports/create',
                                    '/earthquakes',
                                    '/admin/reports',
                                ].includes(item.href)) && (
                                <div className="dr-nav-label">
                                    {index === 0
                                        ? 'UTAMA'
                                        : item.href === '/reports/create'
                                          ? 'LAPORAN'
                                          : item.href === '/earthquakes'
                                            ? 'DATA PEMANTAUAN'
                                            : 'ADMINISTRASI'}
                                </div>
                            )}
                            <Link
                                title={item.label}
                                aria-label={item.label}
                                href={item.href}
                                className={cn(
                                    'dr-nav-item',
                                    active(item.href) && 'active',
                                )}
                                aria-current={
                                    active(item.href) ? 'page' : undefined
                                }
                                onClick={() => setMenuOpen(false)}
                            >
                                {item.icon ? (
                                    <span className="dr-nav-icon">
                                        <img src={item.icon} alt="" />
                                    </span>
                                ) : (
                                    <CloudSun
                                        className="dr-nav-icon p-0.5 dark:text-[#315748]"
                                        aria-hidden="true"
                                    />
                                )}
                                <span>{item.label}</span>
                                {item.href === '/admin/reports' &&
                                    pending_reports !== null && (
                                        <b>{pending_reports}</b>
                                    )}
                            </Link>
                        </div>
                    ))}
                </nav>
            </div>
            <footer className="dr-sidebar-footer">
                <div className="dr-emergency">
                    <strong>KONTAK DARURAT RESMI</strong>
                    <div>
                        {emergency_contacts.map((contact) => (
                            <a
                                key={contact.phone}
                                href={`tel:${contact.phone}`}
                                title={`${contact.name} · sumber: ${contact.source_url}`}
                            >
                                {contact.name === 'Jakarta Siaga'
                                    ? 'DKI'
                                    : contact.name}{' '}
                                {contact.phone}
                            </a>
                        ))}
                    </div>
                    <small>Bukan pengganti peringatan resmi</small>
                </div>
                {auth.user ? (
                    <button
                        type="button"
                        className="dr-logout"
                        onClick={() => router.post('/logout')}
                    >
                        Keluar akun
                    </button>
                ) : (
                    <Link className="dr-logout" href="/login">
                        Masuk ke akun
                    </Link>
                )}
            </footer>
        </>
    );
    return (
        <div className="dr-shell">
            <a className="dr-skip" href="#main-content">
                Lewati ke konten
            </a>
            <aside className="dr-sidebar">{nav}</aside>
            <header className="dr-mobile-header">
                <Dialog open={menuOpen} onOpenChange={setMenuOpen}>
                    <DialogTrigger asChild>
                        <Action
                            variant="outline"
                            aria-label="Buka menu navigasi"
                        >
                            Menu
                        </Action>
                    </DialogTrigger>
                    <DialogContent className="dr-mobile-menu">
                        <DialogTitle className="sr-only">
                            Navigasi DisasterReady
                        </DialogTitle>
                        {nav}
                    </DialogContent>
                </Dialog>
                <Brand subtitle={false} />
                <Link className="dr-emergency-chip" href="/bantuan">
                    Bantuan
                </Link>
            </header>
            <main className="dr-workspace" id="main-content">
                {notice && (
                    <div className="dr-success" role="status">
                        ✓ {notice}
                    </div>
                )}
                {children}
            </main>
            <nav className="dr-bottom-nav" aria-label="Navigasi mobile">
                {[
                    { href: '/dashboard', label: 'Beranda' },
                    { href: '/map', label: 'Peta' },
                    { href: '/reports/create', label: 'Lapor' },
                    { href: '/preparedness', label: 'Siaga' },
                    { href: '/bantuan', label: 'Bantuan' },
                ].map((item) => (
                    <Link
                        key={item.href}
                        href={item.href}
                        className={cn(active(item.href) && 'active')}
                    >
                        {item.label}
                    </Link>
                ))}
            </nav>
        </div>
    );
}
