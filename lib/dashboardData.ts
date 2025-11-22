import { supabaseAdmin } from './supabaseClient';

export type DashboardFilters = {
  desde?: string | null;
  hasta?: string | null;
  dni?: string | null;
  crId?: string | null;
  sstId?: string | null;
  sstCode?: string | null;
  year?: string | null;
  month?: string | null;
};

export type EnrichedEntry = {
  work_date: string;
  hours_normal: number;
  hours_extra: number;
  comment: string | null;
  worker: { id: string; dni: string; full_name: string } | null;
  cr: { id: string | null; code: string | null; name: string | null } | null;
  sst: { id: string | null; code: string | null; name: string | null } | null;
};

function getCurrentMonthRange() {
  const now = new Date();
  const start = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
  const end = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 0));
  return { start: start.toISOString().slice(0, 10), end: end.toISOString().slice(0, 10) };
}

export function resolveDateRange(filters: DashboardFilters) {
  const { desde, hasta, year, month } = filters;

  if (desde || hasta) {
    const start = desde || '1900-01-01';
    const end = hasta || new Date().toISOString().slice(0, 10);
    return { start, end };
  }

  if (year && month) {
    const m = parseInt(month, 10) - 1;
    const y = parseInt(year, 10);
    const start = new Date(Date.UTC(y, m, 1));
    const end = new Date(Date.UTC(y, m + 1, 0));
    return { start: start.toISOString().slice(0, 10), end: end.toISOString().slice(0, 10) };
  }

  if (year) {
    const y = parseInt(year, 10);
    const start = new Date(Date.UTC(y, 0, 1));
    const end = new Date(Date.UTC(y, 11, 31));
    return { start: start.toISOString().slice(0, 10), end: end.toISOString().slice(0, 10) };
  }

  return getCurrentMonthRange();
}

export async function fetchEntriesWithRelations(filters: DashboardFilters) {
  if (!supabaseAdmin) {
    throw new Error('Supabase no está configurado');
  }

  const { start, end } = resolveDateRange(filters);

  let query = supabaseAdmin
    .from('timesheet_entries')
    .select(
      `work_date, hours_normal, hours_extra, comment,
       worker:workers(id, dni, full_name),
       cr:crs(id, code, name),
       sst:ssts(id, code, name)`
    )
    .gte('work_date', start)
    .lte('work_date', end);

  if (filters.crId) {
    query = query.eq('cr_id', filters.crId);
  }

  if (filters.sstId) {
    query = query.eq('sst_id', filters.sstId);
  }

  if (filters.sstCode) {
    query = query.eq('sst_code', filters.sstCode);
  }

  if (filters.dni) {
    query = query.eq('workers.dni', filters.dni);
  }

  const { data, error } = await query;

  if (error) {
    throw new Error(error.message);
  }

  return { entries: (data as EnrichedEntry[]) || [], range: { start, end } };
}

export function sumHours(entry: Pick<EnrichedEntry, 'hours_normal' | 'hours_extra'>) {
  return Number(entry.hours_normal || 0) + Number(entry.hours_extra || 0);
}

export function monthKey(dateStr: string) {
  const d = new Date(dateStr);
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}`;
}

export function parseFilters(searchParams: URLSearchParams): DashboardFilters {
  return {
    desde: searchParams.get('desde'),
    hasta: searchParams.get('hasta'),
    dni: searchParams.get('dni'),
    crId: searchParams.get('cr_id'),
    sstId: searchParams.get('sst_id'),
    sstCode: searchParams.get('sst_code'),
    year: searchParams.get('ano') || searchParams.get('año') || searchParams.get('year'),
    month: searchParams.get('mes') || searchParams.get('month')
  };
}
