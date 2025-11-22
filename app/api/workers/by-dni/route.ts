import { NextResponse } from 'next/server';
import { supabaseAdmin } from '../../../../lib/supabaseClient';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const dni = searchParams.get('dni');

  if (!dni) {
    return NextResponse.json({ error: 'dni requerido' }, { status: 400 });
  }

  if (!supabaseAdmin) {
    return NextResponse.json({ error: 'Supabase no está configurado' }, { status: 500 });
  }

  const { data, error } = await supabaseAdmin
    .from('workers')
    .select('id, full_name, dni, cr:crs(id, name)')
    .eq('dni', dni)
    .maybeSingle();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  if (!data) {
    return NextResponse.json({ worker: null, error: 'Trabajador no encontrado' }, { status: 404 });
  }

  return NextResponse.json({ worker: data });
}
