import { NextResponse } from 'next/server';
import { fetchEntriesWithRelations, parseFilters } from '../../../../lib/dashboardData';

function escapeCsv(value: string | null | undefined) {
  if (value === null || value === undefined) return '';
  const str = String(value);
  if (str.includes(',') || str.includes('"') || str.includes('\n')) {
    return '"' + str.replace(/"/g, '""') + '"';
  }
  return str;
}

export async function GET(request: Request) {
  try {
    const searchParams = new URL(request.url).searchParams;
    const filters = parseFilters(searchParams);
    const { entries } = await fetchEntriesWithRelations(filters);

    const header = 'dni,trabajador,fecha,sst,cr,horas_normal,horas_extra,comentario';
    const rows = entries.map((item) => {
      const dni = item.worker?.dni || '';
      const trabajador = item.worker?.full_name || '';
      const fecha = item.work_date;
      const sst = item.sst?.code || item.sst?.name || '';
      const cr = item.cr?.code || item.cr?.name || '';
      const horasNormal = Number(item.hours_normal || 0);
      const horasExtra = Number(item.hours_extra || 0);
      const comentario = item.comment || '';
      return [dni, trabajador, fecha, sst, cr, horasNormal, horasExtra, comentario].map(escapeCsv).join(',');
    });

    const csv = [header, ...rows].join('\n');
    return new NextResponse(csv, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': 'attachment; filename="reporte_horas.csv"'
      }
    });
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 });
  }
}
