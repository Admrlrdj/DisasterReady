import { MessageCircle } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import type { FormEvent } from 'react';
import { Action } from '@/components/disaster/ui';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';
import { hazardLabels } from '@/lib/disaster';
import type { Hazard } from '@/types/disaster';

type Reply = { text: string; href?: string; label?: string };
type Exchange = { question: string; answer: Reply };
type Guide = { title: string; content: string };

const topics: { hazard: Hazard; words: RegExp; source?: Reply }[] = [
    {
        hazard: 'flood',
        words: /\b(banjir|genangan)\b/i,
        source: {
            text: 'Untuk persiapan banjir, kenali tempat evakuasi yang ditetapkan di wilayahmu dan siapkan tas siaga di tempat yang mudah dijangkau.',
            href: 'https://perpustakaan.bnpb.go.id/inlislite/uploaded_files/temporary/DigitalCollection/M2YxMTQxYWY4NDE5NzEyNDA1N2JmNzdjMDIxZjFlZGFlY2Y3M2Y0Mg%3D%3D.pdf',
            label: 'Panduan keluarga BNPB',
        },
    },
    {
        hazard: 'earthquake',
        words: /\bgempa(?:\s*bumi)?\b/i,
        source: {
            text: 'Untuk persiapan gempa, amankan perabot agar tidak mudah jatuh dan kenali jalan keluar serta tempat berlindung di bangunan.',
            href: 'https://www.bmkg.go.id/gempabumi/mitigasi/antisipasi-gempabumi',
            label: 'Panduan gempa BMKG',
        },
    },
    {
        hazard: 'tsunami',
        words: /\btsunami\b/i,
        source: {
            text: 'Untuk persiapan tsunami di pesisir, pelajari jalur resmi dan kenali titik evakuasi atau tempat tinggi yang dapat dijangkau.',
            href: 'https://gaia.bmkg.go.id/edukasi-mkg/ayo-kita-siaga-tsunami',
            label: 'Panduan tsunami BMKG',
        },
    },
    {
        hazard: 'volcano',
        words: /\b(gunung api|gunung berapi|erupsi|letusan)\b/i,
    },
    { hazard: 'landslide', words: /\b(longsor|longsoran)\b/i },
    {
        hazard: 'extreme_weather',
        words: /\b(cuaca ekstrem|cuaca ekstrim|angin kencang|hujan lebat|petir)\b/i,
    },
];

async function findReply(
    question: string,
    previous: string[],
    signal: AbortSignal,
): Promise<Reply> {
    if (
        /\b(terjebak|butuh bantuan|minta bantuan|darurat|sos|korban luka|rute aman)\b/i.test(
            question,
        )
    ) {
        return {
            text: 'Kalau kamu membutuhkan pertolongan segera, hubungi layanan darurat yang sesuai dengan wilayahmu.',
            href: '/bantuan',
            label: 'Buka Informasi Bantuan',
        };
    }
    if (
        /\b(terkini|terbaru|lagi terjadi|ada peringatan|status saat ini|status sekarang)\b/i.test(
            question,
        )
    ) {
        return {
            text: 'Untuk kejadian dan peringatan terkini, cek Peta Situasi dan sumber resmi yang tercantum di sana.',
            href: '/map',
            label: 'Buka Peta Situasi',
        };
    }
    try {
        const response = await fetch('/data/guide-chat', {
            method: 'POST',
            signal: AbortSignal.any([signal, AbortSignal.timeout(23_000)]),
            headers: {
                Accept: 'application/json',
                'Content-Type': 'application/json',
                'X-CSRF-TOKEN':
                    document.querySelector<HTMLMetaElement>(
                        'meta[name="csrf-token"]',
                    )?.content ?? '',
            },
            body: JSON.stringify({ question, previous }),
        });
        if (response.ok) return (await response.json()) as Reply;
    } catch {
        // The source-based fallback keeps the chat useful when Gemini is unavailable.
    }
    if (signal.aborted) return { text: '' };

    const matches = topics.filter((topic) => topic.words.test(question));
    const askingCause = /\b(kenapa|mengapa|penyebab|karena|gara)\b/i.test(
        question,
    );
    const tsunami = matches.length
        ? matches.length === 1 && matches[0].hazard === 'tsunami'
        : /\btsunami\b/i.test(previous.at(-1) ?? '');
    if (askingCause && tsunami) {
        return {
            text: 'Gemini sedang tidak tersedia. Menurut BMKG, tsunami terjadi saat air laut berpindah tiba-tiba dalam jumlah besar. Pemicunya bisa pergeseran dasar laut akibat gempa, longsor bawah laut, atau aktivitas gunung api. Tidak semua gempa bawah laut memicu tsunami.',
            href: 'https://gaia.bmkg.go.id/edukasi-mkg/mengenal-fenomena-tsunami-dan-langkah-mitigasi-di-indonesia',
            label: 'BMKG · Fenomena tsunami',
        };
    }
    if (
        matches.length !== 1 ||
        !/\b(siap|bersiap|persiapan|siaga|mitigasi)\b/i.test(question)
    ) {
        return {
            text: 'Gemini sedang tidak tersedia. Coba lagi sebentar atau buka panduan siaga.',
            href: '/preparedness',
            label: 'Buka Panduan Siaga',
        };
    }
    const { hazard, source } = matches[0];
    try {
        const response = await fetch('/data/preparedness/' + hazard, {
            signal: AbortSignal.any([signal, AbortSignal.timeout(5_000)]),
            headers: { Accept: 'application/json' },
        });
        if (response.ok) {
            const { data }: { data: Guide[] } = await response.json();
            const guide = data[0];
            if (guide) {
                return {
                    text:
                        'Gemini sedang tidak tersedia. Berikut panduan yang bisa kamu baca:\n\n' +
                        guide.title +
                        '\n\n' +
                        guide.content,
                    href: '/preparedness/' + hazard,
                    label: 'Buka panduan dan sumber',
                };
            }
        }
    } catch {
        // A source link remains available when local guides cannot be loaded.
    }
    return (
        (source && {
            ...source,
            text: 'Gemini sedang tidak tersedia. ' + source.text,
        }) ?? {
            text: 'Gemini sedang tidak tersedia. Buka panduan untuk topik ini.',
            href: '/preparedness/' + hazard,
            label: 'Buka Pusat Kesiapsiagaan',
        }
    );
}

export default function GuideChat({ landing = false }: { landing?: boolean }) {
    const [question, setQuestion] = useState('');
    const [history, setHistory] = useState<Exchange[]>([]);
    const [pending, setPending] = useState(false);
    const request = useRef<AbortController | null>(null);
    const log = useRef<HTMLDivElement>(null);

    useEffect(() => () => request.current?.abort(), []);
    useEffect(() => {
        if (log.current) log.current.scrollTop = log.current.scrollHeight;
    }, [history]);

    async function ask(value: string) {
        const text = value.trim();
        if (!text || request.current) return;
        const controller = new AbortController();
        request.current = controller;
        setQuestion('');
        setPending(true);
        try {
            const answer = await findReply(
                text,
                history.slice(-3).map((exchange) => exchange.question),
                controller.signal,
            );
            if (!controller.signal.aborted) {
                setHistory((old) => [
                    ...old.slice(-9),
                    { question: text, answer },
                ]);
            }
        } finally {
            request.current = null;
            if (!controller.signal.aborted) setPending(false);
        }
    }

    function submit(event: FormEvent) {
        event.preventDefault();
        void ask(question);
    }

    return (
        <Dialog>
            <DialogTrigger asChild>
                <Action
                    type="button"
                    className={`fixed right-4 z-40 shadow-md sm:right-6 ${landing ? 'bottom-4' : 'bottom-[calc(4.5rem+env(safe-area-inset-bottom))] lg:bottom-5'}`}
                >
                    <MessageCircle aria-hidden="true" /> Tanya Panduan
                </Action>
            </DialogTrigger>
            <DialogContent className="max-h-[calc(100dvh-2rem)] grid-rows-[auto_minmax(0,1fr)_auto] overflow-hidden p-4 sm:p-6">
                <div className="pr-8">
                    <DialogTitle>Tanya Panduan Siaga</DialogTitle>
                    <DialogDescription className="mt-1">
                        Tanya soal bencana dan kesiapsiagaan.{' '}
                        <a className="underline" href="/bantuan">
                            Butuh bantuan?
                        </a>
                    </DialogDescription>
                </div>
                <div
                    ref={log}
                    role="log"
                    aria-label="Percakapan panduan"
                    className="max-h-72 min-h-24 space-y-3 overflow-y-auto text-sm"
                >
                    {!history.length && (
                        <p className="dr-muted">
                            Mau bersiap menghadapi bencana apa?
                        </p>
                    )}
                    {history.map(({ question, answer }, index) => (
                        <div key={index} className="space-y-2">
                            <p className="ml-6 rounded-lg bg-muted p-3 wrap-anywhere">
                                {question}
                            </p>
                            <div className="mr-6 rounded-lg border p-3">
                                <p className="wrap-anywhere whitespace-pre-line">
                                    {answer.text}
                                </p>
                                {answer.href && (
                                    <a
                                        className="mt-2 inline-block underline"
                                        href={answer.href}
                                    >
                                        {answer.label}
                                    </a>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
                <form onSubmit={submit} className="grid gap-2">
                    <div
                        className="flex flex-wrap gap-1.5"
                        aria-label="Contoh pertanyaan"
                        role="group"
                    >
                        {topics.slice(0, 3).map(({ hazard }) => (
                            <Action
                                key={hazard}
                                type="button"
                                variant="outline"
                                disabled={pending}
                                onClick={() =>
                                    void ask(
                                        'Cara bersiap menghadapi ' +
                                            hazardLabels[hazard],
                                    )
                                }
                            >
                                {hazardLabels[hazard]}
                            </Action>
                        ))}
                    </div>
                    <label htmlFor="guide-question" className="dr-caption">
                        Pertanyaan
                    </label>
                    <div className="flex gap-2">
                        <input
                            id="guide-question"
                            className="dr-input min-w-0 flex-1"
                            value={question}
                            onChange={(event) =>
                                setQuestion(event.target.value)
                            }
                            maxLength={300}
                            autoComplete="off"
                        />
                        <Action
                            type="submit"
                            disabled={pending || !question.trim()}
                        >
                            {pending ? 'Mencari…' : 'Kirim'}
                        </Action>
                    </div>
                    <p className="dr-caption dr-muted">
                        Pertanyaan bisa dikirim ke Google Gemini. Hindari
                        memasukkan data pribadi.
                    </p>
                </form>
            </DialogContent>
        </Dialog>
    );
}
