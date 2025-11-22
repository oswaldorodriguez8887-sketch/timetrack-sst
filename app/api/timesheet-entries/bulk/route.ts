import { NextResponse } from 'next/server';
import { supabaseAdmin } from '../../../../lib/supabaseClient';

export async function POST(request: Request) {
  if (!supabaseAdmin) {
    return NextResponse.json({ error: 'Supabase no está configurado' }, { status: 500 });
  }

  const csv = await request.text();
  if (!csv) {
    return NextResponse.json({ error: 'CSV vacío' }, { status: 400 });
  }

  const lines = csv.trim().split(/\r?\n/);
  const header = lines.shift();
  const expectedHeader = ['dni', 'fecha', 'sst', 'horas_normal', 'horas_extra', 'comentario'];
  if (!header || expectedHeader.some((h) => !header.toLowerCase().includes(h))) {
    return NextResponse.json({ error: 'Cabecera inválida. Usa: dni,fecha,sst,horas_normal,horas_extra,comentario' }, { status: 400 });
  }

  const errors: string[] = [];
  let inserted = 0;

  for (const [index, line] of lines.entries()) {
    if (!line.trim()) continue;
    const [dni, fecha, sst, horasNormal, horasExtra, comentario] = line.split(',');

    if (!dni || !fecha) {
      errors.push(`Fila ${index + 2}: dni y fecha son requeridos`);
      continue;
    }

    const { data: worker, error: workerError } = await supabaseAdmin
      .from('workers')
      .select('id, cr_id')
      .eq('dni', dni.trim())
      .maybeSingle();

    if (workerError || !worker) {
      errors.push(`Fila ${index + 2}: trabajador con DNI ${dni} no encontrado`);
      continue;
    }

    const payload = {
      worker_id: worker.id,
      work_date: fecha.trim(),
      sst_id: sst?.trim() || null,
      sst_code: sst?.trim() || null,
      hours_normal: Number(horasNormal) || 0,
      hours_extra: Number(horasExtra) || 0,
      comment: comentario?.trim() || null,
      cr_id: worker.cr_id
    };

    const { error } = await supabaseAdmin
      .from('timesheet_entries')
      .upsert(payload, { onConflict: 'worker_id,work_date' });

    if (error) {
      errors.push(`Fila ${index + 2}: ${error.message}`);
    } else {
      inserted += 1;
    }
  }

  return NextResponse.json({ inserted, errors });
}
