import type { Metadata } from 'next';
import { LegalDocument } from '@/components/LegalDocument';
import { loadSettings } from '@/lib/site-settings';

export const revalidate = 300;
export const metadata: Metadata = { title: 'Términos y condiciones' };

export default async function TermsPage() {
  const s = await loadSettings();
  return <LegalDocument title="Términos y condiciones" text={s.terms_text} />;
}
