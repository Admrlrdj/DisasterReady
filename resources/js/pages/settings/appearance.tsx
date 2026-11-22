import { Head } from '@inertiajs/react';
import AppearanceTabs from '@/components/appearance-tabs';
import Heading from '@/components/heading';
import {
    PAGE_VARIANTS,
    usePageVariant,
    type PageVariant,
} from '@/hooks/use-page-variant';
import { cn } from '@/lib/utils';
import { edit as editAppearance } from '@/routes/appearance';

export default function Appearance() {
    const { variant, setVariant } = usePageVariant();

    return (
        <>
            <Head title="Pengaturan Tampilan & Model UI" />

            <h1 className="sr-only">Pengaturan Tampilan & Model UI</h1>

            <div className="space-y-6">
                <Heading
                    variant="small"
                    title="Tema Warna Aplikasi"
                    description="Pilih mode terang, gelap, atau ikuti pengaturan sistem perangkat Anda."
                />
                <AppearanceTabs />

                <div className="space-y-3 border-t border-border pt-6">
                    <Heading
                        variant="small"
                        title="Model Tata Letak Halaman (3 Versi)"
                        description="Pilih karakter arsitektur antarmuka yang paling sesuai untuk seluruh halaman aplikasi."
                    />
                    <div className="grid grid-cols-1 gap-2.5">
                        {PAGE_VARIANTS.map((item) => {
                            const active = variant === item.id;
                            return (
                                <button
                                    key={item.id}
                                    type="button"
                                    aria-pressed={active}
                                    onClick={() =>
                                        setVariant(item.id as PageVariant)
                                    }
                                    className={cn(
                                        'pressable flex cursor-pointer flex-col gap-1 rounded-xl border p-3.5 text-left transition-colors focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none',
                                        active
                                            ? 'border-primary bg-secondary text-foreground shadow-xs'
                                            : 'border-border/80 bg-background/70 text-foreground hover:bg-secondary/50',
                                    )}
                                >
                                    <div className="flex items-center justify-between gap-2">
                                        <strong className="text-xs font-bold">
                                            {item.shortLabel} · {item.name}
                                        </strong>
                                        {active && (
                                            <span className="rounded-full bg-primary px-2 py-0.5 text-[10px] font-bold text-primary-foreground">
                                                Aktif
                                            </span>
                                        )}
                                    </div>
                                    <span className="text-xs text-muted-foreground">
                                        {item.summary}
                                    </span>
                                </button>
                            );
                        })}
                    </div>
                </div>
            </div>
        </>
    );
}

Appearance.layout = {
    breadcrumbs: [
        {
            title: 'Tampilan & Model UI',
            href: editAppearance(),
        },
    ],
};
