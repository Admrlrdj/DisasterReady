import { Link, router, usePage } from '@inertiajs/react';
import {
    Activity,
    BellRing,
    BookOpen,
    ClipboardList,
    CloudLightning,
    Droplets,
    FilePlus2,
    FileText,
    Home,
    Map,
    Mountain,
    PhoneCall,
    Route,
    ShieldAlert,
    ShieldCheck,
    SlidersHorizontal,
} from 'lucide-react';
import AppLogo from '@/components/app-logo';
import { NavUser } from '@/components/nav-user';
import {
    Sidebar,
    SidebarContent,
    SidebarFooter,
    SidebarGroup,
    SidebarGroupLabel,
    SidebarHeader,
    SidebarMenu,
    SidebarMenuBadge,
    SidebarMenuButton,
    SidebarMenuItem,
} from '@/components/ui/sidebar';
import { useDisaster } from '@/features/disaster/disaster-context';
import type { DashboardView } from '@/features/disaster/types';
import { dashboard } from '@/routes';

const PRIMARY_ITEMS: {
    id: DashboardView;
    title: string;
    icon: typeof Map;
    showAlertBadge?: boolean;
}[] = [
    {
        id: 'overview',
        title: 'Pusat Komando & Peta',
        icon: Map,
    },
    {
        id: 'alerts',
        title: 'Peringatan & Riwayat CAP',
        icon: BellRing,
        showAlertBadge: true,
    },
    {
        id: 'hazards',
        title: 'Cuaca, Gempa & Gunung Api',
        icon: CloudLightning,
    },
    {
        id: 'preparedness',
        title: 'Pusat Kesiapsiagaan',
        icon: ShieldCheck,
    },
];

export function AppSidebar() {
    const { url, props } = usePage();
    const {
        overview,
        emergencyContacts,
        pendingReports,
        activeView,
        setActiveView,
        setWaterLevelOpen,
    } = useDisaster();

    const user = props.auth.user;
    const isActiveAccount =
        user?.status === 'active' || user?.status === undefined;
    const role = isActiveAccount ? user?.role : undefined;
    const canModerate = role === 'moderator' || role === 'admin';
    const canAdminister = role === 'admin';
    const activeAlertCount = overview?.active_alert_count ?? 0;

    const isOnDashboard = url.split('?')[0] === '/dashboard';

    const navigateView = (view: DashboardView) => {
        if (isOnDashboard) {
            setActiveView(view);
        } else {
            const target =
                view === 'overview'
                    ? dashboard().url
                    : `/dashboard?view=${view}`;
            router.visit(target);
        }
    };

    return (
        <Sidebar collapsible="icon" variant="inset">
            <SidebarHeader className="pb-2">
                <SidebarMenu>
                    <SidebarMenuItem>
                        <SidebarMenuButton size="lg" asChild>
                            <Link href={dashboard()} prefetch>
                                <AppLogo />
                            </Link>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                </SidebarMenu>
            </SidebarHeader>

            <SidebarContent className="gap-3">
                <SidebarGroup className="px-2 py-0">
                    <SidebarGroupLabel className="overline-label px-2.5 text-muted-foreground/90">
                        Navigasi Utama
                    </SidebarGroupLabel>
                    <SidebarMenu className="mt-1 gap-0.5">
                        {PRIMARY_ITEMS.map((item) => {
                            const Icon = item.icon;
                            const isActive =
                                isOnDashboard &&
                                (activeView === item.id ||
                                    (item.id === 'overview' &&
                                        activeView === 'map'));
                            return (
                                <SidebarMenuItem key={item.id}>
                                    <SidebarMenuButton
                                        type="button"
                                        isActive={isActive}
                                        tooltip={{ children: item.title }}
                                        onClick={() => navigateView(item.id)}
                                        className="h-9 rounded-lg px-2.5 transition-[background-color,color] duration-150 data-[active=true]:bg-secondary data-[active=true]:font-semibold data-[active=true]:text-foreground data-[active=true]:ring-1 data-[active=true]:ring-brand-sage-strong/25"
                                    >
                                        <Icon
                                            className={
                                                isActive
                                                    ? 'text-brand-sage-strong'
                                                    : 'text-muted-foreground'
                                            }
                                            aria-hidden="true"
                                        />
                                        <span>{item.title}</span>
                                    </SidebarMenuButton>
                                    {item.showAlertBadge &&
                                        activeAlertCount > 0 && (
                                            <SidebarMenuBadge className="rounded-full bg-alert-amber px-2 font-bold text-forest-fixed tabular-nums">
                                                {activeAlertCount}
                                            </SidebarMenuBadge>
                                        )}
                                </SidebarMenuItem>
                            );
                        })}
                    </SidebarMenu>
                </SidebarGroup>

                <SidebarGroup className="px-2 py-0">
                    <SidebarGroupLabel className="overline-label px-2.5 text-muted-foreground/90">
                        Halaman Publik & Pelaporan
                    </SidebarGroupLabel>
                    <SidebarMenu className="mt-1 gap-0.5">
                        <SidebarMenuItem>
                            <SidebarMenuButton
                                asChild
                                tooltip={{ children: 'Buat Laporan Warga' }}
                                className="h-9 rounded-lg px-2.5 transition-[background-color,color] duration-150"
                            >
                                <Link href="/reports/create">
                                    <FilePlus2
                                        className="text-muted-foreground"
                                        aria-hidden="true"
                                    />
                                    <span>Buat Laporan Warga</span>
                                </Link>
                            </SidebarMenuButton>
                        </SidebarMenuItem>
                        {user && (
                            <SidebarMenuItem>
                                <SidebarMenuButton
                                    asChild
                                    tooltip={{
                                        children: 'Riwayat Laporan Saya',
                                    }}
                                    className="h-9 rounded-lg px-2.5 transition-[background-color,color] duration-150"
                                >
                                    <Link href="/my/reports">
                                        <FileText
                                            className="text-muted-foreground"
                                            aria-hidden="true"
                                        />
                                        <span>Riwayat Laporan Saya</span>
                                    </Link>
                                </SidebarMenuButton>
                            </SidebarMenuItem>
                        )}
                        <SidebarMenuItem>
                            <SidebarMenuButton
                                asChild
                                tooltip={{ children: 'Gempa & Cuaca BMKG' }}
                                className="h-9 rounded-lg px-2.5 transition-[background-color,color] duration-150"
                            >
                                <Link href="/earthquakes">
                                    <Activity
                                        className="text-muted-foreground"
                                        aria-hidden="true"
                                    />
                                    <span>Gempa & Cuaca BMKG</span>
                                </Link>
                            </SidebarMenuButton>
                        </SidebarMenuItem>
                        <SidebarMenuItem>
                            <SidebarMenuButton
                                asChild
                                tooltip={{ children: 'Gunung Api PVMBG' }}
                                className="h-9 rounded-lg px-2.5 transition-[background-color,color] duration-150"
                            >
                                <Link href="/volcanoes">
                                    <Mountain
                                        className="text-muted-foreground"
                                        aria-hidden="true"
                                    />
                                    <span>Gunung Api PVMBG</span>
                                </Link>
                            </SidebarMenuButton>
                        </SidebarMenuItem>
                        <SidebarMenuItem>
                            <SidebarMenuButton
                                asChild
                                tooltip={{ children: 'Kandidat Shelter' }}
                                className="h-9 rounded-lg px-2.5 transition-[background-color,color] duration-150"
                            >
                                <Link href="/shelters">
                                    <Home
                                        className="text-muted-foreground"
                                        aria-hidden="true"
                                    />
                                    <span>Kandidat Shelter</span>
                                </Link>
                            </SidebarMenuButton>
                        </SidebarMenuItem>
                        <SidebarMenuItem>
                            <SidebarMenuButton
                                type="button"
                                tooltip={{
                                    children: 'Rujukan Pintu Air & TMA',
                                }}
                                onClick={() => setWaterLevelOpen(true)}
                                className="h-9 rounded-lg px-2.5 transition-[background-color,color] duration-150"
                            >
                                <Droplets
                                    className="text-muted-foreground"
                                    aria-hidden="true"
                                />
                                <span>Rujukan Pintu Air</span>
                            </SidebarMenuButton>
                        </SidebarMenuItem>
                        {user && (
                            <SidebarMenuItem>
                                <SidebarMenuButton
                                    asChild
                                    tooltip={{ children: 'Pengaturan Akun' }}
                                    className="h-9 rounded-lg px-2.5 transition-[background-color,color] duration-150"
                                >
                                    <Link href="/settings">
                                        <SlidersHorizontal
                                            className="text-muted-foreground"
                                            aria-hidden="true"
                                        />
                                        <span>Pengaturan</span>
                                    </Link>
                                </SidebarMenuButton>
                            </SidebarMenuItem>
                        )}
                    </SidebarMenu>
                </SidebarGroup>

                {canModerate && (
                    <SidebarGroup className="px-2 py-0">
                        <SidebarGroupLabel className="overline-label px-2.5 text-muted-foreground/90">
                            Moderasi & Administrasi
                        </SidebarGroupLabel>
                        <SidebarMenu className="mt-1 gap-0.5">
                            <SidebarMenuItem>
                                <SidebarMenuButton
                                    asChild
                                    tooltip={{
                                        children: 'Moderasi Laporan & AI',
                                    }}
                                    className="h-9 rounded-lg px-2.5 transition-[background-color,color] duration-150"
                                >
                                    <Link href="/admin/reports">
                                        <ShieldAlert
                                            className="text-muted-foreground"
                                            aria-hidden="true"
                                        />
                                        <span>Moderasi Laporan & AI</span>
                                    </Link>
                                </SidebarMenuButton>
                                {pendingReports !== null &&
                                    pendingReports > 0 && (
                                        <SidebarMenuBadge className="rounded-full bg-alert-amber px-2 font-bold text-forest-fixed tabular-nums">
                                            {pendingReports}
                                        </SidebarMenuBadge>
                                    )}
                            </SidebarMenuItem>

                            {canAdminister && (
                                <>
                                    <SidebarMenuItem>
                                        <SidebarMenuButton
                                            asChild
                                            tooltip={{
                                                children: 'Adapter & AI Health',
                                            }}
                                            className="h-9 rounded-lg px-2.5 transition-[background-color,color] duration-150"
                                        >
                                            <Link href="/admin/sources">
                                                <Activity
                                                    className="text-muted-foreground"
                                                    aria-hidden="true"
                                                />
                                                <span>Adapter & AI Health</span>
                                            </Link>
                                        </SidebarMenuButton>
                                    </SidebarMenuItem>
                                    <SidebarMenuItem>
                                        <SidebarMenuButton
                                            asChild
                                            tooltip={{
                                                children: 'Peringatan Resmi',
                                            }}
                                            className="h-9 rounded-lg px-2.5 transition-[background-color,color] duration-150"
                                        >
                                            <Link href="/admin/alerts">
                                                <BellRing
                                                    className="text-muted-foreground"
                                                    aria-hidden="true"
                                                />
                                                <span>Peringatan Resmi</span>
                                            </Link>
                                        </SidebarMenuButton>
                                    </SidebarMenuItem>
                                    <SidebarMenuItem>
                                        <SidebarMenuButton
                                            asChild
                                            tooltip={{
                                                children: 'Panduan & Korpus',
                                            }}
                                            className="h-9 rounded-lg px-2.5 transition-[background-color,color] duration-150"
                                        >
                                            <Link href="/admin/guides">
                                                <BookOpen
                                                    className="text-muted-foreground"
                                                    aria-hidden="true"
                                                />
                                                <span>Panduan & Korpus</span>
                                            </Link>
                                        </SidebarMenuButton>
                                    </SidebarMenuItem>
                                    <SidebarMenuItem>
                                        <SidebarMenuButton
                                            asChild
                                            tooltip={{ children: 'Audit Log' }}
                                            className="h-9 rounded-lg px-2.5 transition-[background-color,color] duration-150"
                                        >
                                            <Link href="/admin/audit-logs">
                                                <ClipboardList
                                                    className="text-muted-foreground"
                                                    aria-hidden="true"
                                                />
                                                <span>Audit Log</span>
                                            </Link>
                                        </SidebarMenuButton>
                                    </SidebarMenuItem>
                                    <SidebarMenuItem>
                                        <SidebarMenuButton
                                            asChild
                                            tooltip={{
                                                children: 'Verifikasi Shelter',
                                            }}
                                            className="h-9 rounded-lg px-2.5 transition-[background-color,color] duration-150"
                                        >
                                            <Link href="/admin/shelters">
                                                <Home
                                                    className="text-muted-foreground"
                                                    aria-hidden="true"
                                                />
                                                <span>Verifikasi Shelter</span>
                                            </Link>
                                        </SidebarMenuButton>
                                    </SidebarMenuItem>
                                    <SidebarMenuItem>
                                        <SidebarMenuButton
                                            asChild
                                            tooltip={{
                                                children: 'Pembatasan Ruas',
                                            }}
                                            className="h-9 rounded-lg px-2.5 transition-[background-color,color] duration-150"
                                        >
                                            <Link href="/admin/road-restrictions">
                                                <Route
                                                    className="text-muted-foreground"
                                                    aria-hidden="true"
                                                />
                                                <span>Pembatasan Ruas</span>
                                            </Link>
                                        </SidebarMenuButton>
                                    </SidebarMenuItem>
                                </>
                            )}
                        </SidebarMenu>
                    </SidebarGroup>
                )}
            </SidebarContent>

            <SidebarFooter className="gap-2.5 pt-2">
                <div className="rounded-2xl bg-forest-fixed p-3 text-white group-data-[collapsible=icon]:hidden dark:border dark:border-border dark:bg-forest-card">
                    <div className="flex items-center gap-1.5 text-xs font-bold tracking-[0.04em] text-alert-amber uppercase">
                        <PhoneCall className="size-3.5" aria-hidden="true" />
                        <span>Kontak Darurat</span>
                    </div>
                    <div className="mt-2 grid grid-cols-3 gap-1.5 text-center">
                        {emergencyContacts.map((contact) => (
                            <a
                                key={contact.phone}
                                href={`tel:${contact.phone}`}
                                title={`${contact.name} · sumber resmi`}
                                className="rounded-lg bg-white/10 px-1.5 py-1.5 transition-colors duration-150 hover:bg-white/20 focus-visible:ring-2 focus-visible:ring-alert-amber focus-visible:outline-none"
                            >
                                <span className="block truncate text-[11px] text-forest-muted">
                                    {contact.name === 'Jakarta Siaga'
                                        ? 'DKI'
                                        : contact.name === 'Basarnas'
                                          ? 'SAR'
                                          : contact.name}
                                </span>
                                <span className="block text-xs font-bold text-white tabular-nums">
                                    {contact.phone}
                                </span>
                            </a>
                        ))}
                    </div>
                    <p className="mt-2 text-xs text-forest-muted">
                        Bukan pengganti peringatan resmi
                    </p>
                </div>
                <NavUser />
            </SidebarFooter>
        </Sidebar>
    );
}
