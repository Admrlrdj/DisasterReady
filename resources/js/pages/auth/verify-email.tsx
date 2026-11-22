import { Form, Head } from '@inertiajs/react';
import TextLink from '@/components/text-link';
import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/ui/spinner';
import { logout } from '@/routes';
import { send } from '@/routes/verification';

export default function VerifyEmail({ status }: { status?: string }) {
    return (
        <>
            <Head title="Verifikasi Email" />

            {status === 'verification-link-sent' && (
                <div
                    role="status"
                    className="mb-4 rounded-xl bg-verified-soft px-3.5 py-2.5 text-center text-sm font-medium text-foreground"
                >
                    Tautan verifikasi baru telah dikirim ke alamat email yang
                    Anda daftarkan.
                </div>
            )}

            <Form {...send.form()} className="space-y-6 text-center">
                {({ processing }) => (
                    <>
                        <Button
                            disabled={processing}
                            variant="secondary"
                            className="h-10 w-full rounded-xl font-semibold"
                        >
                            {processing && <Spinner />}
                            Kirim Ulang Email Verifikasi
                        </Button>

                        <TextLink
                            href={logout()}
                            className="mx-auto block text-sm"
                        >
                            Keluar Akun
                        </TextLink>
                    </>
                )}
            </Form>
        </>
    );
}

VerifyEmail.layout = {
    title: 'Verifikasi alamat email',
    description:
        'Klik tautan verifikasi yang baru saja dikirim ke email Anda sebelum mengirim laporan warga.',
};
