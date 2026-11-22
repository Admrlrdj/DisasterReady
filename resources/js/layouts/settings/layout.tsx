import { Link } from '@inertiajs/react';
import { Lock, Palette, SlidersHorizontal, User } from 'lucide-react';
import type { PropsWithChildren } from 'react';
import { PageHeading, Panel } from '@/components/disaster/ui';
import { Button } from '@/components/ui/button';
import { useCurrentUrl } from '@/hooks/use-current-url';
import { cn, toUrl } from '@/lib/utils';
import { edit as editAppearance } from '@/routes/appearance';
import { edit } from '@/routes/profile';
import { edit as editSecurity } from '@/routes/security';
import type { NavItem } from '@/types';

const sidebarNavItems: NavItem[] = [
    {
        title: 'Ringkasan Pengaturan',
        href: '/settings',
        icon: SlidersHorizontal,
    },
    {
        title: 'Profil Akun',
        href: edit(),
        icon: User,
    },
    {
        title: 'Keamanan, 2FA & Passkey',
        href: editSecurity(),
        icon: Lock,
    },
    {
        title: 'Tampilan & Model UI',
        href: editAppearance(),
        icon: Palette,
    },
];

export default function SettingsLayout({ children }: PropsWithChildren) {
    const { isCurrentOrParentUrl } = useCurrentUrl();

    return (
        <div className="space-y-4">
            <PageHeading
                eyebrow="FR-16 · Pengaturan Akun, Keamanan & Tampilan"
                title="Pengaturan Akun & Preferensi Visual"
                description="Kelola profil warga, kata sandi, autentikasi dua faktor (2FA), Passkey, serta pilihan model tampilan UI (Versi A, B, atau C)."
            />

            <div className="dr-two-col">
                <Panel
                    title="Menu Pengaturan"
                    subtitle="Navigasi konfigurasi akun"
                >
                    <nav
                        className="flex flex-col gap-1.5"
                        aria-label="Navigasi pengaturan akun"
                    >
                        {sidebarNavItems.map((item, index) => {
                            const active = isCurrentOrParentUrl(item.href);
                            return (
                                <Button
                                    key={`${toUrl(item.href)}-${index}`}
                                    size="sm"
                                    variant={active ? 'default' : 'ghost'}
                                    asChild
                                    className={cn(
                                        'h-10 w-full justify-start rounded-xl px-3 font-semibold',
                                        !active &&
                                            'text-muted-foreground hover:text-foreground',
                                    )}
                                >
                                    <Link href={item.href}>
                                        {item.icon && (
                                            <item.icon
                                                className="size-4"
                                                aria-hidden="true"
                                            />
                                        )}
                                        <span>{item.title}</span>
                                    </Link>
                                </Button>
                            );
                        })}
                    </nav>
                </Panel>

                <Panel className="min-w-0">
                    <section className="max-w-2xl space-y-8">
                        {children}
                    </section>
                </Panel>
            </div>
        </div>
    );
}
