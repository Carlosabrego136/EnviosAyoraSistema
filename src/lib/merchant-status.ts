// Estatus de los comerciantes del directorio (sin dependencias de servidor).

export type MerchantStatus = 'activo' | 'inactivo' | 'renovacion' | 'riesgo';

export const STATUS_META: Record<MerchantStatus, { label: string; tone: 'ok' | 'off' | 'warn' | 'bad'; note: string }> = {
  activo: { label: 'Activo', tone: 'ok', note: 'Comerciante con credencial vigente. Puedes comprar con confianza.' },
  inactivo: { label: 'Inactivo', tone: 'off', note: 'Este comerciante no está activo actualmente. Consulta con nosotros antes de realizar cualquier pago.' },
  renovacion: { label: 'Renovación pendiente', tone: 'warn', note: 'Su credencial está en proceso de renovación. Consulta con nosotros antes de realizar un pago.' },
  riesgo: { label: 'Riesgo', tone: 'bad', note: 'Te recomendamos no realizar pagos sin consultar antes con Envíos Ayora.' },
};

export const STATUS_ORDER: MerchantStatus[] = ['activo', 'renovacion', 'riesgo', 'inactivo'];

export function statusMeta(status: string) {
  return STATUS_META[(status as MerchantStatus) in STATUS_META ? (status as MerchantStatus) : 'inactivo'];
}

export interface PublicMerchant {
  id: number;
  name: string;
  category: string;
  status: MerchantStatus;
  zone: string;
  description: string;
  whatsapp: string;
  facebook_url: string;
  photo_id: number | null;
  top_rank: number | null;
  top_note: string;
}
