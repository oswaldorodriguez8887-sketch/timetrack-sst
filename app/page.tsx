'use client';

import { FormEvent, useState } from 'react';
import { WorkerCalendar } from '../components/WorkerCalendar';

type Worker = {
  id: string;
  full_name: string;
  dni: string;
  cr: { id: string; name: string } | null;
};

type DniSearchResponse = {
  worker: Worker | null;
  error?: string;
};

export default function HomePage() {
  const [dni, setDni] = useState('');
  const [worker, setWorker] = useState<Worker | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading(true);
    setError(null);

    const res = await fetch(`/api/workers/by-dni?dni=${encodeURIComponent(dni)}`);
    const data: DniSearchResponse = await res.json();
    if (!res.ok || data.error) {
      setWorker(null);
      setError(data.error || 'No se encontró el trabajador');
    } else {
      setWorker(data.worker);
    }
    setLoading(false);
  };

  return (
    <div className="card">
      <h2>Búsqueda por DNI</h2>
      <p>Encuentra al trabajador, muestra su CR y registra horas por día.</p>

      <form onSubmit={handleSubmit} className="form-row" style={{ alignItems: 'flex-end' }}>
        <div>
          <label htmlFor="dni">DNI</label>
          <input
            id="dni"
            placeholder="Ingresa DNI"
            value={dni}
            onChange={(e) => setDni(e.target.value)}
            required
          />
        </div>
        <div>
          <button type="submit" disabled={loading}>
            {loading ? 'Buscando...' : 'Buscar'}
          </button>
        </div>
      </form>

      {error && <p style={{ color: 'red' }}>{error}</p>}

      {worker && (
        <div style={{ marginTop: '1.5rem' }}>
          <div className="card" style={{ marginBottom: '1rem' }}>
            <h3>{worker.full_name}</h3>
            <p>DNI: {worker.dni}</p>
            <p>CR asignado: {worker.cr?.name || 'No asignado'}</p>
          </div>
          <WorkerCalendar worker={worker} />
        </div>
      )}
    </div>
  );
}
