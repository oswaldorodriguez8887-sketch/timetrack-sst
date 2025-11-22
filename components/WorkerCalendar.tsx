'use client';

import { addDays, endOfMonth, format, startOfMonth } from 'date-fns';
import { useEffect, useMemo, useState } from 'react';
import { TimesheetEntry, TimesheetModal } from './TimesheetModal';

type Worker = {
  id: string;
  full_name: string;
  cr: { id: string; name: string } | null;
};

type WorkerCalendarProps = {
  worker: Worker;
};

function getMonthDays(date: Date) {
  const start = startOfMonth(date);
  const end = endOfMonth(date);
  const days: Date[] = [];
  let cursor = start;
  while (cursor <= end) {
    days.push(cursor);
    cursor = addDays(cursor, 1);
  }
  return days;
}

export function WorkerCalendar({ worker }: WorkerCalendarProps) {
  const [month, setMonth] = useState(new Date());
  const [entries, setEntries] = useState<TimesheetEntry[]>([]);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedEntry, setSelectedEntry] = useState<TimesheetEntry | undefined>(undefined);

  const days = useMemo(() => getMonthDays(month), [month]);

  const loadEntries = async () => {
    const params = new URLSearchParams({
      workerId: worker.id,
      month: (month.getMonth() + 1).toString(),
      year: month.getFullYear().toString()
    });
    const res = await fetch(`/api/timesheet-entries?${params.toString()}`);
    if (res.ok) {
      const data = await res.json();
      setEntries(data.items);
    }
  };

  useEffect(() => {
    loadEntries();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [worker.id, month]);

  const openDay = (date: Date) => {
    const iso = date.toISOString().slice(0, 10);
    const entry = entries.find((e) => e.work_date === iso);
    setSelectedEntry(entry);
    setSelectedDate(date);
  };

  const handleSaved = () => {
    loadEntries();
  };

  const monthLabel = format(month, 'MMMM yyyy');

  return (
    <div className="card">
      <div className="flex-between">
        <div>
          <h2>Calendario por trabajador</h2>
          <p>{worker.full_name} — CR: {worker.cr?.name || 'No asignado'}</p>
        </div>
        <div className="flex">
          <button className="secondary" onClick={() => setMonth(addDays(startOfMonth(month), -1))}>
            ← Mes anterior
          </button>
          <button className="secondary" onClick={() => setMonth(new Date())}>Hoy</button>
          <button className="secondary" onClick={() => setMonth(addDays(endOfMonth(month), 1))}>
            Mes siguiente →
          </button>
        </div>
      </div>

      <h3 style={{ marginTop: '1rem' }}>{monthLabel}</h3>
      <div className="calendar-grid">
        {days.map((day) => {
          const iso = day.toISOString().slice(0, 10);
          const entry = entries.find((e) => e.work_date === iso);
          return (
            <div key={iso} className="calendar-day" onClick={() => openDay(day)}>
              <div className="date-label">{format(day, 'd')}</div>
              {entry ? (
                <div>
                  <div className="badge">{entry.hours_normal}h normal</div>
                  {entry.hours_extra > 0 && <div className="badge" style={{ background: '#fef3c7', color: '#92400e' }}>{entry.hours_extra}h extra</div>}
                  {entry.sst_id && <div style={{ marginTop: '0.25rem', fontSize: '0.9rem' }}>SST: {entry.sst_id}</div>}
                  {entry.sst_code && <div style={{ marginTop: '0.25rem', fontSize: '0.9rem' }}>SST: {entry.sst_code}</div>}
                </div>
              ) : (
                <div style={{ color: '#9ca3af', marginTop: '0.25rem' }}>Sin parte</div>
              )}
            </div>
          );
        })}
      </div>

      <TimesheetModal
        open={!!selectedDate}
        onClose={() => setSelectedDate(null)}
        date={selectedDate}
        workerId={worker.id}
        existingEntry={selectedEntry}
        onSaved={handleSaved}
      />
    </div>
  );
}
