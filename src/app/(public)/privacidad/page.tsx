import type { Metadata } from 'next';
import { LegalDocument } from '@/components/LegalDocument';
import { loadSettings } from '@/lib/site-settings';

export const revalidate = 300;
export const metadata: Metadata = { title: 'Aviso de privacidad' };

export default async function PrivacyPage() {
  const s = await loadSettings();
  return <LegalDocument title="Aviso de privacidad" text={s.privacy_text} />;
}
