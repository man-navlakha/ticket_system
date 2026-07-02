import { SIGNATURES } from '@/lib/email-signatures';
import EmailSignatureClient from './EmailSignatureClient';

export const metadata = {
    title: 'Email Signature',
    description: 'Find your Excellent Publicity email signature by name and copy it into Gmail or Outlook.',
    robots: { index: false, follow: false },
};

export default function EmailSignaturePage() {
    return <EmailSignatureClient people={SIGNATURES} />;
}
