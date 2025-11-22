import { NextResponse } from 'next/server';
import { fetchEntriesWithRelations, parseFilters, sumHours } from '../../../../lib/dashboardData';

export async function GET(request: Request) {
  try {
    const searchParams = new URL(request.url).searchParams;
    const filters = parseFilters(searchParams);
    const { entries, range } = await fetchEntriesWithRelations(filters);

    const now = new Date();
    const refYear = filters.year ? parseInt(filters.year, 10) : now.getUTCFullYear();
    const refMonth = filters.month ? parseInt(filters.month, 10) : now.getUTCMonth() + 1;

    let monthHours = 0;
    let yearHours = 0;
    const crTotals = new Map<string, { cr: string; hours: number }>();
    const sstTotals = new Map<string, { sst: string; hours: number }>();

    entries.forEach((entry) => {
      const hours = sumHours(entry);
      const date = new Date(entry.work_date);
      if (date.getUTCFullYear() === refYear) {
        yearHours += hours;
        if (date.getUTCMonth() + 1 === refMonth) {
          monthHours += hours;
        }
      }

      const crLabel = entry.cr?.name || entry.cr?.code || 'Sin CR';
      crTotals.set(crLabel, { cr: crLabel, hours: (crTotals.get(crLabel)?.hours || 0) + hours });

      const sstLabel = entry.sst?.name || entry.sst?.code || 'Sin SST';
      sstTotals.set(sstLabel, { sst: sstLabel, hours: (sstTotals.get(sstLabel)?.hours || 0) + hours });
    });

    const topCr = Array.from(crTotals.values()).sort((a, b) => b.hours - a.hours).slice(0, 5);
    const topSst = Array.from(sstTotals.values()).sort((a, b) => b.hours - a.hours).slice(0, 5);

    return NextResponse.json({
      monthHours,
      yearHours,
      topCr,
      topSst,
      range
    });
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 });
  }
}
