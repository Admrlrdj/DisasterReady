import { Link, router, usePage } from '@inertiajs/react';
import {
    Activity,
    BellRing,
    BookOpen,
    ClipboardList,
    FilePlus2,
    FileText,
    Home,
    LogOut,
    Map,
    Menu,
    PhoneCall,
    Route,
    ShieldAlert,
    ShieldCheck,
    SlidersHorizontal,
} from 'lucide-react';
import { useState, type PropsWithChildren, type ReactNode } from 'react';
import {
    GlobalAuroraBackdrop,
    PageVariantSwitcherBar,
} from '@/components/disaster/global-aurora-backdrop';
import { HazardSvgIcon } from '@/components/disaster/hazard-icons';
import { Action, Brand } from '@/components/disaster/ui';
import {
    Dialog,
    DialogContent,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';
import { usePageVariant } from '@/hooks/use-page-variant';
import type { Contact } from '@/lib/disaster';
import { cn } from '@/lib/utils';

type NavEntry = {
    href: string;
    label: string;
    group: 'utama' | 'lapor' | 'admin';
    role?: 'moderator' | 'admin';
    icon: ReactNode;
};

const NAVIGATION_ITEMS: NavEntry[] = [
    {
        href: '/dashboard',
        label: 'Pusat Komando & Peta',
        group: 'utama',
        icon: <Map className="size-4" aria-hidden="true" />,
    },
    {
        href: '/earthquakes',
        label: 'Gempa & Cuaca BMKG',
        group: 'utama',
        icon: <HazardSvgIcon hazard="earthquake" className="size-4" />,
    },
    {
        href: '/volcanoes',
        label: 'Gunung Api PVMBG',
        group: 'utama',
        icon: <HazardSvgIcon hazard="volcano" className="size-4" />,
    },
    {
        href: '/preparedness',
        label: 'Pusat Kesiapsiagaan',
        group: 'utama',
        icon: <ShieldCheck className="size-4" aria-hidden="true" />,
    },
    {
        href: '/reports/create',
        label: 'Buat Laporan Warga',
        group: 'lapor',
        icon: <FilePlus2 className="size-4" aria-hidden="true" />,
    },
    {
        href: '/my/reports',
        label: 'Riwayat Laporan Saya',
        group: 'lapor',
        icon: <FileText className="size-4" aria-hidden="true" />,
    },
    {
        href: '/shelters',
        label: 'Kandidat Shelter',
        group: 'lapor',
        icon: <Home className="size-4" aria-hidden="true" />,
    },
    {
        href: '/admin/reports',
        label: 'Moderasi & Triase AI',
        group: 'admin',
        role: 'moderator',
        icon: <ShieldAlert className="size-4" aria-hidden="true" />,
    },
    {
        href: '/admin/sources',
        label: 'Adapter & AI Health',
        group: 'admin',
        role: 'admin',
        icon: <Activity className="size-4" aria-hidden="true" />,
    },
    {
        href: '/admin/alerts',
        label: 'Peringatan Resmi DB',
        group: 'admin',
        role: 'admin',
        icon: <BellRing className="size-4" aria-hidden="true" />,
    },
    {
        href: '/admin/guides',
        label: 'Panduan & Korpus',
        group: 'admin',
        role: 'admin',
        icon: <BookOpen className="size-4" aria-hidden="true" />,
    },
    {
        href: '/admin/audit-logs',
        label: 'Audit Log Sistem',
        group: 'admin',
        role: 'admin',
        icon: <ClipboardList className="size-4" aria-hidden="true" />,
    },
    {
        href: '/admin/shelters',
        label: 'Verifikasi Shelter',
        group: 'admin',
        role: 'admin',
        icon: <Home className="size-4" aria-hidden="true" />,
    },
    {
        href: '/admin/road-restrictions',
        label: 'Pembatasan Ruas',
        group: 'admin',
        role: 'admin',
        icon: <Route className="size-4" aria-hidden="true" />,
    },
    {
        href: '/settings',
        label: 'Pengaturan Akun',
        group: 'lapor',
        icon: <SlidersHorizontal className="size-4" aria-hidden="true" />,
    },
];

const FALLBACK_CONTACTS: Contact[] = [
    {
        name: 'BNPB',
        phone: '117',
        source_url: 'https://www.bnpb.go.id/kontak',
        verified_at: '2026-11-22T00:00:00Z',
    },
    {
        name: 'Basarnas',
        phone: '115',
        source_url:
            'https://balikpapan.basarnas.go.id/berita/informasi-layanan-kontak-darurat-dan-hotline-basarnas-balikpapan',
        verified_at: '2026-11-22T00:00:00Z',
    },
    {
        name: 'Jakarta Siaga',
        phone: '112',
        source_url: 'https://www.jakarta.go.id/jakarta-siaga-112',
        verified_at: '2026-11-22T00:00:00Z',
    },
];

export default function DisasterLayout({ children }: PropsWithChildren) {
    const { auth, notice, pending_reports, emergency_contacts } = usePage<{
        auth: { user: { name: string; role: string; status?: string } | null };
        notice?: string;
        pending_reports: number | null;
        emergency_contacts: Contact[];
    }>().props;
    const { url } = usePage();
    const { variant } = usePageVariant();
    const [menuOpen, setMenuOpen] = useState(false);

    const contacts =
        emergency_contacts && emergency_contacts.length > 0
            ? emergency_contacts
            : FALLBACK_CONTACTS;

    const activeUser =
        auth.user &&
        (auth.user.status === undefined || auth.user.status === 'active');
    const role = activeUser ? auth.user?.role : undefined;

    const visible = NAVIGATION_ITEMS.filter(
        (item) =>
            !item.role ||
            role === 'admin' ||
            (item.role === 'moderator' && role === 'moderator'),
    );

    const cleanPath = url.split('?')[0];
    const active = (href: string) => {
        if (href === '/dashboard') {
            return cleanPath === '/dashboard' || cleanPath === '/map';
        }
        if (href === '/earthquakes') {
            return (
                cleanPath === '/earthquakes' ||
                cleanPath.startsWith('/weather') ||
                cleanPath.startsWith('/events/') ||
                cleanPath.startsWith('/alerts/')
            );
        }
        return cleanPath === href || cleanPath.startsWith(href + '/');
    };

    const groups: { id: NavEntry['group']; title: string }[] = [
        { id: 'utama', title: 'PANTAUAN & KOMANDO' },
        { id: 'lapor', title: 'WARGA & AKUN' },
        ...(role === 'admin' || role === 'moderator'
            ? [{ id: 'admin' as const, title: 'MODERASI & TATA KELOLA' }]
            : []),
    ];

    const nav = (
        <>
            <div className="dr-sidebar-top">
                <Brand />
                <Link
                    href={auth.user ? '/settings' : '/login'}
                    className="dr-account transition-colors hover:border-primary/40 focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
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
                    <span className="min-w-0">
                        <strong className="block truncate">
                            {auth.user?.name ?? 'Akses Publik'}
                        </strong>
                        <small className="block truncate">
                            {role === 'admin'
                                ? 'ADMIN · TATA KELOLA'
                                : role === 'moderator'
                                  ? 'MODERATOR · TRIASE'
                                  : auth.user
                                    ? 'WARGA · TERDAFTAR'
                                    : 'MASUK / DAFTAR WARGA'}
                        </small>
                    </span>
                </Link>

                <nav aria-label="Navigasi utama" className="space-y-3">
                    {groups.map((grp) => {
                        const items = visible.filter((i) => i.group === grp.id);
                        if (items.length === 0) return null;
                        return (
                            <div key={grp.id} className="space-y-1">
                                <div className="dr-nav-label">{grp.title}</div>
                                {items.map((item) => {
                                    const isCurrent = active(item.href);
                                    return (
                                        <Link
                                            key={item.href}
                                            title={item.label}
                                            href={item.href}
                                            className={cn(
                                                'dr-nav-item transition-colors',
                                                isCurrent && 'active',
                                            )}
                                            aria-current={
                                                isCurrent ? 'page' : undefined
                                            }
                                            onClick={() => setMenuOpen(false)}
                                        >
                                            <span
                                                className={cn(
                                                    'dr-nav-icon flex items-center justify-center',
                                                    isCurrent
                                                        ? 'text-primary'
                                                        : 'text-muted-foreground',
                                                )}
                                            >
                                                {item.icon}
                                            </span>
                                            <span className="truncate">
                                                {item.label}
                                            </span>
                                            {item.href === '/admin/reports' &&
                                                pending_reports !== null && (
                                                    <b>{pending_reports}</b>
                                                )}
                                        </Link>
                                    );
                                })}
                            </div>
                        );
                    })}
                </nav>
            </div>

            <footer className="dr-sidebar-footer">
                <div className="dr-emergency">
                    <strong>KONTAK DARURAT RESMI</strong>
                    <div>
                        {contacts.map((contact) => (
                            <a
                                key={contact.phone}
                                href={`tel:${contact.phone}`}
                                title={`${contact.name} · sumber: ${contact.source_url}`}
                            >
                                {contact.name === 'Jakarta Siaga'
                                    ? 'DKI'
                                    : contact.name === 'Basarnas'
                                      ? 'SAR'
                                      : contact.name}{' '}
                                {contact.phone}
                            </a>
                        ))}
                    </div>
                    <small>Bukan pengganti peringatan resmi pemerintah</small>
                </div>
                {auth.user ? (
                    <button
                        type="button"
                        className="dr-logout inline-flex cursor-pointer items-center justify-center gap-1.5"
                        onClick={() => router.post('/logout')}
                    >
                        <LogOut className="size-3.5" aria-hidden="true" />
                        <span>Keluar Akun</span>
                    </button>
                ) : (
                    <Link
                        className="dr-logout text-center font-semibold"
                        href="/login"
                    >
                        Masuk ke Akun
                    </Link>
                )}
            </footer>
        </>
    );

    return (
        <div
            data-ui-variant={variant}
            className="dr-shell relative bg-transparent"
        >
            <GlobalAuroraBackdrop intensity="workspace" />

            <a className="dr-skip" href="#main-content">
                Lewati ke konten utama
            </a>

            <aside className="dr-sidebar bg-card/84 backdrop-blur-md">
                {nav}
            </aside>

            <header className="dr-mobile-header bg-card/90 backdrop-blur-md">
                <Dialog open={menuOpen} onOpenChange={setMenuOpen}>
                    <DialogTrigger asChild>
                        <Action
                            variant="outline"
                            size="sm"
                            aria-label="Buka menu navigasi"
                            className="inline-flex min-h-11 items-center gap-1.5"
                        >
                            <Menu className="size-4" aria-hidden="true" />
                            <span>Menu</span>
                        </Action>
                    </DialogTrigger>
                    <DialogContent className="dr-mobile-menu overscroll-contain">
                        <DialogTitle className="sr-only">
                            Navigasi DisasterReady
                        </DialogTitle>
                        {nav}
                    </DialogContent>
                </Dialog>
                <Brand subtitle={false} />
                <a
                    className="dr-emergency-chip inline-flex min-h-11 items-center gap-1"
                    href="tel:112"
                >
                    <PhoneCall className="size-3" aria-hidden="true" />
                    <span>DKI 112</span>
                </a>
            </header>

            <main className="dr-workspace" id="main-content">
                <PageVariantSwitcherBar />

                {notice && (
                    <div className="dr-success" role="status">
                        ✓ {notice}
                    </div>
                )}

                {children}

                <footer className="mt-6 flex flex-col items-start justify-between gap-2 rounded-2xl border border-border/75 bg-card/75 px-4 py-3 text-xs text-muted-foreground backdrop-blur-xs sm:flex-row sm:items-center">
                    <p>
                        DisasterReady · Sumber rujukan terbuka: BMKG, CAP 1.2
                        XML, BNPB InaRISK, PVMBG MAGMA, OpenStreetMap (ODbL).
                    </p>
                    <div className="flex flex-wrap items-center gap-3 font-semibold text-foreground">
                        <a href="tel:117" className="hover:text-primary">
                            BNPB 117
                        </a>
                        <a href="tel:115" className="hover:text-primary">
                            SAR 115
                        </a>
                        <a href="tel:112" className="hover:text-primary">
                            DKI 112
                        </a>
                    </div>
                </footer>
            </main>

            <nav
                className="dr-bottom-nav bg-card/94 backdrop-blur-md"
                aria-label="Navigasi mobile"
            >
                {[
                    { href: '/dashboard', label: 'Komando' },
                    { href: '/earthquakes', label: 'BMKG' },
                    { href: '/reports/create', label: 'Lapor' },
                    { href: '/preparedness', label: 'Siaga' },
                    {
                        href:
                            role === 'admin'
                                ? '/admin/sources'
                                : role === 'moderator'
                                  ? '/admin/reports'
                                  : '/my/reports',
                        label:
                            role === 'admin' || role === 'moderator'
                                ? 'Admin'
                                : 'Laporan',
                    },
                ].map((item) => (
                    <Link
                        key={item.href}
                        href={item.href}
                        className={cn(
                            'min-h-11',
                            active(item.href) && 'active',
                        )}
                    >
                        {item.label}
                    </Link>
                ))}
            </nav>
        </div>
    );
}
