import { notFound } from 'next/navigation';
import { SIGNATURES } from '@/lib/email-signatures';
import SignaturePanel from '../SignaturePanel';

export function generateStaticParams() {
    return SIGNATURES.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({ params }) {
    const { slug } = await params;
    const person = SIGNATURES.find((p) => p.slug === slug);
    if (!person) return { title: 'Signature not found' };
    return {
        title: `${person.name} — Email Signature`,
        description: `Copy ${person.name}'s Excellent Publicity email signature into Gmail or Outlook.`,
        robots: { index: false, follow: false },
    };
}

export default async function PersonSignaturePage({ params }) {
    const { slug } = await params;
    const person = SIGNATURES.find((p) => p.slug === slug);
    if (!person) notFound();

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-neutral-950 py-10 px-4">
            <div className="max-w-3xl mx-auto">
                <SignaturePanel person={person} />
            </div>
        </div>
    );
}
