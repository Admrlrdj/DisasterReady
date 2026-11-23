// Components
import { Form, Head } from '@inertiajs/react';
import { LogOut } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/ui/spinner';
import { logout } from '@/routes';
import { send } from '@/routes/verification';

export default function VerifyEmail({ status }: { status?: string }) {
    return (
        <>
            <Head title="Email verification" />

            {status === 'verification-link-sent' && (
                <div className="mb-4 text-center text-sm font-medium text-green-600">
                    A new verification link has been sent to the email address
                    you provided during registration.
                </div>
            )}

            <Form {...send.form()} className="text-center">
                {({ processing }) => (
                    <Button disabled={processing} variant="secondary">
                        {processing && <Spinner />}
                        Resend verification email
                    </Button>
                )}
            </Form>
            <Form {...logout.form()}>
                {({ processing }) => (
                    <Button
                        type="submit"
                        variant="outline"
                        className="min-h-11 w-full"
                        disabled={processing}
                    >
                        <LogOut aria-hidden="true" />
                        {processing ? 'Keluar…' : 'Keluar akun'}
                    </Button>
                )}
            </Form>
        </>
    );
}

VerifyEmail.layout = {
    title: 'Email verification',
    description:
        'Please verify your email address by clicking on the link we just emailed to you.',
};
