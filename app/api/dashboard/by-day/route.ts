import { NextResponse } from 'next/server';
import { fetchEntriesWithRelations, parseFilters, sumHours } from '../../../../lib/dashboardData';

export async function GET(request: Request) {
  try {
    const searchParams = new URL(request.url).searchParams;
    const filters = parseFilters(searchParams);
    const { entries, range } = await fetchEntriesWithRelations(filters);

    const daily: Record<string, number> = {};

    entries.forEach((entry) => {
      const hours = sumHours(entry);
      daily[entry.work_date] = (daily[entry.work_date] || 0) + hours;
    });

    const items = Object.entries(daily)
      .map(([date, hours]) => ({ date, hours }))
      .sort((a, b) => a.date.localeCompare(b.date));

    return NextResponse.json({ items, range });
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 });
  }
}
