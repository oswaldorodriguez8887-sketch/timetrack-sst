import { NextResponse } from 'next/server';
import { supabaseAdmin } from '../../../lib/supabaseClient';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const workerId = searchParams.get('workerId');
  const month = searchParams.get('month');
  const year = searchParams.get('year');

  if (!workerId || !month || !year) {
    return NextResponse.json({ error: 'workerId, month y year son requeridos' }, { status: 400 });
  }

  if (!supabaseAdmin) {
    return NextResponse.json({ error: 'Supabase no está configurado' }, { status: 500 });
  }

  const start = `${year}-${month.toString().padStart(2, '0')}-01`;
  const end = new Date(parseInt(year, 10), parseInt(month, 10), 0).toISOString().slice(0, 10);

  const { data, error } = await supabaseAdmin
    .from('timesheet_entries')
    .select('id, worker_id, work_date, sst_id, sst_code, cr_id, hours_normal, hours_extra, comment')
    .eq('worker_id', workerId)
    .gte('work_date', start)
    .lte('work_date', end);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ items: data });
}

export async function POST(request: Request) {
  const body = await request.json();
  const { workerId, workDate, sst, hoursNormal, hoursExtra, comment } = body;

  if (!workerId || !workDate) {
    return NextResponse.json({ error: 'workerId y workDate son requeridos' }, { status: 400 });
  }

  if (!supabaseAdmin) {
    return NextResponse.json({ error: 'Supabase no está configurado' }, { status: 500 });
  }

  const { data: worker, error: workerError } = await supabaseAdmin
    .from('workers')
    .select('id, cr_id')
    .eq('id', workerId)
    .single();

  if (workerError || !worker) {
    return NextResponse.json({ error: workerError?.message || 'Trabajador no encontrado' }, { status: 404 });
  }

  const payload = {
    worker_id: workerId,
    work_date: workDate,
    sst_id: typeof sst === 'string' ? sst : null,
    sst_code: typeof sst === 'string' ? sst : null,
    hours_normal: Number(hoursNormal) || 0,
    hours_extra: Number(hoursExtra) || 0,
    comment: comment || null,
    cr_id: worker.cr_id
  };

  const { data, error } = await supabaseAdmin
    .from('timesheet_entries')
    .upsert(payload, { onConflict: 'worker_id,work_date' })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ item: data });
}
