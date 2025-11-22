import { NextResponse } from 'next/server';
import { EnrichedEntry, fetchEntriesWithRelations, monthKey, parseFilters, sumHours } from '../../../../lib/dashboardData';

function aggregateBySst(entries: EnrichedEntry[]) {
  const monthly: Record<string, { sst: string; month: string; hours: number }> = {};
  const totals: Record<string, { sst: string; hours: number }> = {};

  entries.forEach((entry) => {
    const key = monthKey(entry.work_date);
    const sstLabel = entry.sst?.name || entry.sst?.code || 'Sin SST';
    const mapKey = `${sstLabel}-${key}`;
    const hours = sumHours(entry);

    monthly[mapKey] = monthly[mapKey]
      ? { ...monthly[mapKey], hours: monthly[mapKey].hours + hours }
      : { sst: sstLabel, month: key, hours };

    totals[sstLabel] = totals[sstLabel]
      ? { ...totals[sstLabel], hours: totals[sstLabel].hours + hours }
      : { sst: sstLabel, hours };
  });

  return {
    monthly: Object.values(monthly).sort((a, b) => a.month.localeCompare(b.month)),
    totals: Object.values(totals).sort((a, b) => b.hours - a.hours).slice(0, 10)
  };
}

export async function GET(request: Request) {
  try {
    const searchParams = new URL(request.url).searchParams;
    const filters = parseFilters(searchParams);
    const { entries, range } = await fetchEntriesWithRelations(filters);
    const aggregated = aggregateBySst(entries);

    return NextResponse.json({ ...aggregated, range });
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 });
  }
}
