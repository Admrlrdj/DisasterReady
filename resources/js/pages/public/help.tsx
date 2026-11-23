import { Head, Link, usePage } from '@inertiajs/react';
import { Phone } from 'lucide-react';
import { Action, PageHeading, Panel } from '@/components/disaster/ui';
import type { Contact } from '@/lib/disaster';

export default function HelpPage() {
    const { props } = usePage<{
        emergency_contacts: Contact[];
        region: string | null;
    }>();
    const { region } = props;
    const contacts = props.emergency_contacts;
    const jakarta = contacts.find(
        (contact) => contact.name === 'Jakarta Siaga',
    );

    return (
        <>
            <Head title="Informasi Bantuan" />
            <PageHeading
                title="Informasi Bantuan"
                description="Hubungi layanan resmi sesuai jenis bantuan dan wilayah kejadian."
            />
            <div className="dr-two-col">
                <Panel title="Pencarian dan Pertolongan">
                    {contacts
                        .filter((contact) => contact.name === 'Basarnas')
                        .map((contact) => (
                            <div key={contact.phone} className="dr-stack">
                                <Action asChild>
                                    <a href={'tel:' + contact.phone}>
                                        <Phone aria-hidden="true" />
                                        Telepon Basarnas {contact.phone}
                                    </a>
                                </Action>
                                <a
                                    className="dr-caption underline"
                                    href={contact.source_url}
                                >
                                    Sumber resmi Basarnas
                                </a>
                            </div>
                        ))}
                    <p className="dr-caption dr-muted">
                        Saat menelepon, sampaikan lokasi kejadian dan jenis
                        bantuan yang diperlukan.
                    </p>
                </Panel>
                <Panel title="Kontak Daerah">
                    {jakarta && !region && (
                        <p className="text-sm">
                            Kontak daerah yang tercantum saat ini mencakup DKI
                            Jakarta.
                        </p>
                    )}
                    {jakarta && (!region || region.startsWith('31.')) ? (
                        <div className="dr-stack">
                            <Action variant="outline" asChild>
                                <a href={'tel:' + jakarta.phone}>
                                    <Phone aria-hidden="true" />
                                    Telepon DKI Jakarta {jakarta.phone}
                                </a>
                            </Action>
                            <a
                                className="dr-caption underline"
                                href={jakarta.source_url}
                            >
                                Sumber resmi Jakarta Siaga
                            </a>
                        </div>
                    ) : (
                        <p className="text-sm">
                            Kontak daerah untuk wilayah pilihan belum tercantum.
                        </p>
                    )}
                    <Link
                        className="dr-caption underline"
                        href={
                            '/dashboard' +
                            (region
                                ? '?region=' + encodeURIComponent(region)
                                : '')
                        }
                    >
                        Pilih wilayah di Kondisi Sekitar
                    </Link>
                </Panel>
                <Panel title="Posko dan Pengungsian">
                    <p className="text-sm">
                        Daftar posko aktif belum tersedia. Periksa pengumuman
                        resmi BPBD atau pemerintah daerah setempat.
                    </p>
                    <Action variant="outline" asChild>
                        <Link href="/shelters">
                            Coba Simulasi Shelter dan Rute
                        </Link>
                    </Action>
                </Panel>
            </div>
        </>
    );
}
