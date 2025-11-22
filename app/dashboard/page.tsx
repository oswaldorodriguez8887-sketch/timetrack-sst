'use client';

import { useEffect, useMemo, useState } from 'react';

type Summary = {
  monthHours: number;
  yearHours: number;
  topCr: { cr: string; hours: number }[];
  topSst: { sst: string; hours: number }[];
};

type ByCr = {
  monthly: { cr: string; month: string; hours: number }[];
  totals: { cr: string; hours: number }[];
};

type BySst = {
  monthly: { sst: string; month: string; hours: number }[];
  totals: { sst: string; hours: number }[];
};

type ByDay = { items: { date: string; hours: number }[] };

type Filters = {
  desde: string;
  hasta: string;
  cr: string;
  sst: string;
  dni: string;
  month: string;
  year: string;
};

const now = new Date();

function buildQuery(filters: Filters) {
  const params = new URLSearchParams();
  if (filters.desde) params.set('desde', filters.desde);
  if (filters.hasta) params.set('hasta', filters.hasta);
  if (filters.cr) params.set('cr_id', filters.cr);
  if (filters.sst) params.set('sst_id', filters.sst);
  if (filters.dni) params.set('dni', filters.dni);
  if (filters.month) params.set('mes', filters.month);
  if (filters.year) params.set('ano', filters.year);
  return params.toString();
}

function ChartBar({ label, value, max }: { label: string; value: number; max: number }) {
  const width = max === 0 ? 0 : Math.max(5, (value / max) * 100);
  return (
    <div className="chart-row">
      <div className="chart-label">{label}</div>
      <div className="chart-bar">
        <div className="chart-bar-fill" style={{ width: `${width}%` }}>
          {value.toFixed(1)} h
        </div>
      </div>
    </div>
  );
}

function Heatmap({ items, month }: { items: { date: string; hours: number }[]; month: string }) {
  const map = useMemo(() => {
    const record: Record<string, number> = {};
    items.forEach((i) => (record[i.date] = i.hours));
    return record;
  }, [items]);

  const year = parseInt(month.split('-')[0], 10);
  const m = parseInt(month.split('-')[1], 10) - 1;
  const daysInMonth = new Date(year, m + 1, 0).getUTCDate();

  const cells = [] as JSX.Element[];
  for (let day = 1; day <= daysInMonth; day++) {
    const dateStr = `${year}-${String(m + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    const hours = map[dateStr] || 0;
    const intensity = Math.min(1, hours / 12);
    const bg = `rgba(16, 185, 129, ${0.2 + intensity * 0.6})`;
    cells.push(
      <div key={dateStr} className="heatmap-cell" title={`${dateStr}: ${hours.toFixed(1)} h`} style={{ background: bg }}>
        <span>{day}</span>
      </div>
    );
  }

  return <div className="heatmap-grid">{cells}</div>;
}

export default function DashboardPage() {
  const [summary, setSummary] = useState<Summary | null>(null);
  const [byCr, setByCr] = useState<ByCr | null>(null);
  const [bySst, setBySst] = useState<BySst | null>(null);
  const [byDay, setByDay] = useState<ByDay | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<Filters>({
    desde: '',
    hasta: '',
    cr: '',
    sst: '',
    dni: '',
    month: String(now.getMonth() + 1).padStart(2, '0'),
    year: String(now.getFullYear())
  });

  const defaultMonthLabel = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  const monthLabel = filters.year && filters.month ? `${filters.year}-${filters.month}` : defaultMonthLabel;

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const query = buildQuery(filters);
      const [summaryRes, crRes, sstRes, dayRes] = await Promise.all([
        fetch(`/api/dashboard/summary?${query}`),
        fetch(`/api/dashboard/by-cr?${query}`),
        fetch(`/api/dashboard/by-sst?${query}`),
        fetch(`/api/dashboard/by-day?${query}`)
      ]);

      if (!summaryRes.ok || !crRes.ok || !sstRes.ok || !dayRes.ok) {
        throw new Error('Error obteniendo datos del dashboard');
      }

      const summaryData = await summaryRes.json();
      const crData = await crRes.json();
      const sstData = await sstRes.json();
      const dayData = await dayRes.json();

      setSummary(summaryData);
      setByCr(crData);
      setBySst(sstData);
      setByDay(dayData);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    loadData();
  };

  const maxCr = byCr?.totals[0]?.hours || 0;
  const maxSst = bySst?.totals[0]?.hours || 0;
  const maxByDay = byDay?.items.reduce((max, item) => Math.max(max, item.hours), 0) || 0;

  return (
    <div className="card">
      <h2>Dashboard de horas</h2>
      <p>Filtros combinables por fecha, CR, SST y DNI. Los gráficos se recalculan con los filtros.</p>

      <form className="filters" onSubmit={handleSubmit}>
        <div>
          <label>Desde</label>
          <input type="date" value={filters.desde} onChange={(e) => setFilters({ ...filters, desde: e.target.value })} />
        </div>
        <div>
          <label>Hasta</label>
          <input type="date" value={filters.hasta} onChange={(e) => setFilters({ ...filters, hasta: e.target.value })} />
        </div>
        <div>
          <label>CR</label>
          <input value={filters.cr} onChange={(e) => setFilters({ ...filters, cr: e.target.value })} placeholder="cr_id" />
        </div>
        <div>
          <label>SST</label>
          <input value={filters.sst} onChange={(e) => setFilters({ ...filters, sst: e.target.value })} placeholder="sst_id" />
        </div>
        <div>
          <label>DNI</label>
          <input value={filters.dni} onChange={(e) => setFilters({ ...filters, dni: e.target.value })} placeholder="dni" />
        </div>
        <div>
          <label>Mes</label>
          <input
            value={filters.month}
            onChange={(e) => setFilters({ ...filters, month: e.target.value })}
            placeholder="01"
            maxLength={2}
          />
        </div>
        <div>
          <label>Año</label>
          <input
            value={filters.year}
            onChange={(e) => setFilters({ ...filters, year: e.target.value })}
            placeholder="2024"
            maxLength={4}
          />
        </div>
        <button type="submit" disabled={loading}>
          {loading ? 'Cargando...' : 'Aplicar filtros'}
        </button>
        <a className="secondary-button" href={`/api/report/export?${buildQuery(filters)}`} target="_blank" rel="noopener noreferrer">
          Exportar CSV
        </a>
      </form>

      {error && <p style={{ color: 'red' }}>{error}</p>}

      {summary && (
        <div className="widgets">
          <div className="widget">
            <p>Total horas del mes</p>
            <h3>{summary.monthHours.toFixed(1)} h</h3>
          </div>
          <div className="widget">
            <p>Total horas del año</p>
            <h3>{summary.yearHours.toFixed(1)} h</h3>
          </div>
          <div className="widget">
            <p>Top 5 CR</p>
            <ul>
              {summary.topCr.map((item) => (
                <li key={item.cr}>{item.cr}: {item.hours.toFixed(1)} h</li>
              ))}
            </ul>
          </div>
          <div className="widget">
            <p>Top 5 SST</p>
            <ul>
              {summary.topSst.map((item) => (
                <li key={item.sst}>{item.sst}: {item.hours.toFixed(1)} h</li>
              ))}
            </ul>
          </div>
        </div>
      )}

      <div className="chart-card">
        <h3>Barras: horas por CR (agrupado por mes)</h3>
        {byCr ? (
          <div>
            <div className="chart-list">
              {byCr.monthly.map((item) => (
                <ChartBar key={`${item.cr}-${item.month}`} label={`${item.month} · ${item.cr}`} value={item.hours} max={maxCr} />
              ))}
            </div>
          </div>
        ) : (
          <p>Sin datos</p>
        )}
      </div>

      <div className="chart-card">
        <h3>Barras: horas por SST</h3>
        {bySst ? (
          <div className="chart-list">
            {bySst.totals.map((item) => (
              <ChartBar key={item.sst} label={item.sst} value={item.hours} max={maxSst} />
            ))}
          </div>
        ) : (
          <p>Sin datos</p>
        )}
      </div>

      <div className="chart-card">
        <h3>Línea: horas por día (mes actual)</h3>
        {byDay ? (
          <div className="line-chart">
            {byDay.items.map((item) => (
              <div key={item.date} className="line-point" style={{ height: `${maxByDay === 0 ? 0 : (item.hours / maxByDay) * 120}px` }}>
                <span>{item.hours.toFixed(1)}</span>
                <small>{item.date}</small>
              </div>
            ))}
          </div>
        ) : (
          <p>Sin datos</p>
        )}
      </div>

      <div className="chart-card">
        <h3>Heatmap mensual por trabajador</h3>
        {filters.dni && byDay ? (
          <Heatmap items={byDay.items} month={monthLabel} />
        ) : (
          <p>Aplica filtro de DNI para ver el heatmap.</p>
        )}
      </div>
    </div>
  );
}
