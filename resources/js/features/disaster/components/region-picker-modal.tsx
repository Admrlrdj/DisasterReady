import { Check, MapPin, Search } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { useDisaster } from '../disaster-context';

type RegionResult = { code: string; name: string; area: string };

export function RegionPickerModal() {
    const {
        regionPickerOpen,
        setRegionPickerOpen,
        selectedRegionCode,
        regionOptions,
        setSelectedRegionCode,
    } = useDisaster();
    const [search, setSearch] = useState('');
    const [remoteSearch, setRemoteSearch] = useState<{
        query: string;
        data: RegionResult[] | null;
    }>();

    const needle = search.trim();

    useEffect(() => {
        if (needle.length < 2) return;
        const request = new AbortController();
        const timer = window.setTimeout(async () => {
            try {
                const response = await fetch(
                    '/data/regions?' + new URLSearchParams({ q: needle }),
                    {
                        headers: { Accept: 'application/json' },
                        signal: request.signal,
                    },
                );
                if (!response.ok) throw new Error('Region search failed');
                const { data } = (await response.json()) as {
                    data: RegionResult[];
                };
                setRemoteSearch({ query: needle, data });
            } catch {
                if (!request.signal.aborted) {
                    setRemoteSearch({ query: needle, data: null });
                }
            }
        }, 280);
        return () => {
            window.clearTimeout(timer);
            request.abort();
        };
    }, [needle]);

    const filtered = useMemo(() => {
        if (
            needle.length >= 2 &&
            remoteSearch?.query === needle &&
            remoteSearch.data
        ) {
            return remoteSearch.data.map((item) => ({
                code: item.code,
                name: item.name,
                province: item.area,
            }));
        }
        const q = needle.toLowerCase();
        if (!q) {
            return regionOptions;
        }
        return regionOptions.filter(
            (r) =>
                r.name.toLowerCase().includes(q) ||
                r.province.toLowerCase().includes(q) ||
                r.code.includes(q),
        );
    }, [needle, regionOptions, remoteSearch]);

    return (
        <Dialog open={regionPickerOpen} onOpenChange={setRegionPickerOpen}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>
                        Pilih Wilayah Prakiraan (BMKG adm4 Nasional)
                    </DialogTitle>
                    <DialogDescription>
                        Cari desa atau kelurahan di seluruh Indonesia (kode
                        adm4) untuk menyinkronkan prakiraan cuaca BMKG 3 jam.
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-3">
                    <div className="relative">
                        <Search
                            className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground"
                            aria-hidden="true"
                        />
                        <Input
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            placeholder="Cari kelurahan atau kode adm4..."
                            aria-label="Cari wilayah prakiraan BMKG"
                            className="pl-9 text-base sm:text-sm"
                        />
                    </div>

                    <div className="max-h-72 space-y-1.5 overflow-y-auto overscroll-contain pr-1">
                        {filtered.length === 0 ? (
                            <div className="rounded-lg border border-dashed border-input p-6 text-center text-xs text-muted-foreground">
                                Wilayah tidak ditemukan.{' '}
                                <button
                                    type="button"
                                    onClick={() => setSearch('')}
                                    className="font-semibold text-foreground underline"
                                >
                                    Reset pencarian
                                </button>
                            </div>
                        ) : (
                            filtered.map((region) => {
                                const selected =
                                    region.code === selectedRegionCode;
                                return (
                                    <button
                                        key={region.code}
                                        type="button"
                                        onClick={() => {
                                            setSelectedRegionCode(region.code);
                                            setRegionPickerOpen(false);
                                        }}
                                        className={`flex w-full items-center justify-between rounded-xl border px-3.5 py-2.5 text-left transition-colors focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none ${
                                            selected
                                                ? 'border-primary bg-verified-soft/75'
                                                : 'border-border bg-card hover:bg-muted/50'
                                        }`}
                                    >
                                        <div className="flex items-start gap-2.5">
                                            <MapPin
                                                className="mt-0.5 size-4 shrink-0 text-brand-sage-strong"
                                                aria-hidden="true"
                                            />
                                            <div>
                                                <div className="flex items-center gap-2">
                                                    <span className="text-sm font-semibold text-foreground">
                                                        {region.name}
                                                    </span>
                                                    <Badge className="bg-primary text-xs text-primary-foreground">
                                                        Pilot
                                                    </Badge>
                                                </div>
                                                <p className="text-xs text-muted-foreground tabular-nums">
                                                    {region.province} · adm4{' '}
                                                    {region.code}
                                                </p>
                                            </div>
                                        </div>
                                        {selected && (
                                            <Check
                                                className="size-4 text-primary"
                                                aria-hidden="true"
                                            />
                                        )}
                                    </button>
                                );
                            })
                        )}
                    </div>

                    <div className="flex justify-end">
                        <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            className="border-input"
                            onClick={() => {
                                setSelectedRegionCode('31.75.03.1001');
                                setRegionPickerOpen(false);
                            }}
                        >
                            Kembali ke Kampung Melayu
                        </Button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
