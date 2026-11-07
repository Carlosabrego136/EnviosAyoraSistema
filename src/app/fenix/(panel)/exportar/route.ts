import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { adminTimezone } from '@/lib/admin-utils';
import { EXPORT_LIMIT, foliosToCsv, listFolios, type FolioFilters } from '@/lib/folios';
import { can } from '@/lib/permissions';
import { logger } from '@/lib/logger';

export const dynamic = 'force-dynamic';
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

export async function GET(request: Request) {
  const user = await getCurrentUser();
  if (!user) return new NextResponse('No autorizado', { status: 401 });
  if (!can(user.role, 'folios.manage')) return new NextResponse('Sin permiso', { status: 403 });

  try {
    const p = new URL(request.url).searchParams;
    const tz = await adminTimezone();
    const status = p.get('status');
    const paid = p.get('paid');
    const from = p.get('from') ?? '';
    const to = p.get('to') ?? '';
    const filters: FolioFilters = {
      q: p.get('q')?.slice(0, 80) ?? '',
      from: DATE_RE.test(from) ? from : undefined,
      to: DATE_RE.test(to) ? to : undefined,
      collector: p.get('collector')?.slice(0, 60) ?? '',
      status: status === 'activo' || status === 'cancelado' ? status : '',
      paid: paid === 'si' || paid === 'no' ? paid : '',
    };
    const rows = await listFolios(filters, tz, EXPORT_LIMIT);
    const csv = foliosToCsv(rows, tz);
    const stamp = new Date().toISOString().slice(0, 10);
    return new NextResponse(csv, {
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="folios-${stamp}.csv"`,
        'Cache-Control': 'no-store',
      },
    });
  } catch (err) {
    logger.error('folios.export.failed', err);
    return new NextResponse('No se pudo generar el archivo. Inténtalo de nuevo.', { status: 503 });
  }
}
