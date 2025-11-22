'use client';

import { FormEvent, useState } from 'react';

export default function BulkUploadPage() {
  const [fileContent, setFileContent] = useState<string>('');
  const [result, setResult] = useState<string>('');
  const [loading, setLoading] = useState(false);

  const handleFile = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const text = await file.text();
    setFileContent(text);
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading(true);
    setResult('');

    const res = await fetch('/api/timesheet-entries/bulk', {
      method: 'POST',
      headers: { 'Content-Type': 'text/csv' },
      body: fileContent
    });

    const data = await res.json();
    if (!res.ok) {
      setResult(data.error || 'Error procesando CSV');
    } else {
      setResult(`Insertados: ${data.inserted}. Errores: ${data.errors.length}`);
      if (data.errors.length) {
        setResult((prev) => `${prev}\n${data.errors.map((e: string) => `- ${e}`).join('\n')}`);
      }
    }

    setLoading(false);
  };

  return (
    <div className="card">
      <h2>Carga masiva</h2>
      <p>Sube un CSV con columnas: dni, fecha (YYYY-MM-DD), sst, horas_normal, horas_extra, comentario.</p>

      <form onSubmit={handleSubmit} className="form-row" style={{ alignItems: 'flex-end' }}>
        <div>
          <label htmlFor="csv">Archivo CSV</label>
          <input id="csv" type="file" accept="text/csv" onChange={handleFile} required />
        </div>
        <div>
          <button type="submit" disabled={!fileContent || loading}>
            {loading ? 'Cargando...' : 'Procesar CSV'}
          </button>
        </div>
      </form>

      {result && (
        <pre style={{ background: '#f8fafc', padding: '1rem', borderRadius: '8px' }}>{result}</pre>
      )}
    </div>
  );
}
