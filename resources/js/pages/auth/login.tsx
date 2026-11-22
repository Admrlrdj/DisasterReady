import { Form, Head } from '@inertiajs/react';
import InputError from '@/components/input-error';
import PasskeyVerify from '@/components/passkey-verify';
import PasswordInput from '@/components/password-input';
import TextLink from '@/components/text-link';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Spinner } from '@/components/ui/spinner';
import { register } from '@/routes';
import { store } from '@/routes/login';
import { request } from '@/routes/password';

type Props = {
    status?: string;
    canResetPassword: boolean;
};

export default function Login({ status, canResetPassword }: Props) {
    return (
        <>
            <Head title="Masuk ke DisasterReady" />

            <PasskeyVerify
                label="Masuk dengan Passkey"
                loadingLabel="Memverifikasi Passkey..."
                separator="Atau lanjutkan dengan email"
            />

            <Form
                {...store.form()}
                resetOnSuccess={['password']}
                className="flex flex-col gap-5"
            >
                {({ processing, errors }) => (
                    <>
                        <div className="grid gap-4">
                            <div className="grid gap-2">
                                <Label htmlFor="email">Alamat email</Label>
                                <Input
                                    id="email"
                                    type="email"
                                    name="email"
                                    required
                                    autoFocus
                                    autoComplete="email"
                                    placeholder="nama@email.id"
                                    className="h-10 rounded-xl text-base sm:text-sm"
                                />
                                <InputError message={errors.email} />
                            </div>

                            <div className="grid gap-2">
                                <div className="flex items-center">
                                    <Label htmlFor="password">Kata sandi</Label>
                                    {canResetPassword && (
                                        <TextLink
                                            href={request()}
                                            className="ml-auto text-xs font-medium"
                                        >
                                            Atur ulang kata sandi
                                        </TextLink>
                                    )}
                                </div>
                                <PasswordInput
                                    id="password"
                                    name="password"
                                    required
                                    autoComplete="current-password"
                                    placeholder="Masukkan kata sandi"
                                    className="h-10 rounded-xl text-base sm:text-sm"
                                />
                                <p className="text-xs text-muted-foreground">
                                    Tempel (paste) dari pengelola sandi
                                    didukung.
                                </p>
                                <InputError message={errors.password} />
                            </div>

                            <div className="flex items-center space-x-3">
                                <Checkbox id="remember" name="remember" />
                                <Label htmlFor="remember" className="text-sm">
                                    Pertahankan sesi di perangkat ini
                                </Label>
                            </div>

                            <Button
                                type="submit"
                                className="mt-1 h-10 w-full rounded-xl font-semibold"
                                disabled={processing}
                                data-test="login-button"
                            >
                                {processing && <Spinner />}
                                Masuk ke Dashboard
                            </Button>
                        </div>

                        <div className="text-center text-sm text-muted-foreground">
                            Belum punya akun?{' '}
                            <TextLink href={register()}>
                                Daftar akun warga
                            </TextLink>
                        </div>
                    </>
                )}
            </Form>

            {status && (
                <div
                    role="status"
                    className="rounded-xl bg-verified-soft px-3.5 py-2.5 text-center text-sm font-medium text-brand-sage-strong"
                >
                    {status}
                </div>
            )}
        </>
    );
}

Login.layout = {
    title: 'Masuk ke DisasterReady',
    description:
        'Gunakan email terdaftar untuk mengakses dashboard pantauan kebencanaan.',
};
