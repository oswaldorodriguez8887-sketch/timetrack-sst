import { NextResponse } from 'next/server';
import { EnrichedEntry, fetchEntriesWithRelations, monthKey, parseFilters, sumHours } from '../../../../lib/dashboardData';

function aggregateByCr(entries: EnrichedEntry[]) {
  const monthly: Record<string, { cr: string; month: string; hours: number }> = {};
  const totals: Record<string, { cr: string; hours: number }> = {};

  entries.forEach((entry) => {
    const key = monthKey(entry.work_date);
    const crLabel = entry.cr?.name || entry.cr?.code || 'Sin CR';
    const mapKey = `${crLabel}-${key}`;
    const hours = sumHours(entry);

    monthly[mapKey] = monthly[mapKey]
      ? { ...monthly[mapKey], hours: monthly[mapKey].hours + hours }
      : { cr: crLabel, month: key, hours };

    totals[crLabel] = totals[crLabel]
      ? { ...totals[crLabel], hours: totals[crLabel].hours + hours }
      : { cr: crLabel, hours };
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
    const aggregated = aggregateByCr(entries);

    return NextResponse.json({ ...aggregated, range });
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 });
  }
}
