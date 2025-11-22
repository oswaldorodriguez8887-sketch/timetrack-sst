'use client';

import { useEffect, useState } from 'react';

export type TimesheetEntry = {
  id?: string;
  worker_id: string;
  work_date: string;
  sst_id?: string | null;
  sst_code?: string | null;
  hours_normal: number;
  hours_extra: number;
  comment?: string | null;
};

interface TimesheetModalProps {
  open: boolean;
  onClose: () => void;
  date: Date | null;
  workerId: string;
  existingEntry?: TimesheetEntry;
  onSaved: () => void;
}

export function TimesheetModal({ open, onClose, date, workerId, existingEntry, onSaved }: TimesheetModalProps) {
  const [workDate, setWorkDate] = useState('');
  const [sst, setSst] = useState(existingEntry?.sst_id || existingEntry?.sst_code || '');
  const [hoursNormal, setHoursNormal] = useState(existingEntry?.hours_normal ?? 0);
  const [hoursExtra, setHoursExtra] = useState(existingEntry?.hours_extra ?? 0);
  const [comment, setComment] = useState(existingEntry?.comment || '');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (date) {
      setWorkDate(date.toISOString().slice(0, 10));
    }
  }, [date]);

  useEffect(() => {
    setSst(existingEntry?.sst_id || existingEntry?.sst_code || '');
    setHoursNormal(existingEntry?.hours_normal ?? 0);
    setHoursExtra(existingEntry?.hours_extra ?? 0);
    setComment(existingEntry?.comment || '');
  }, [existingEntry]);

  const handleSubmit = async () => {
    if (!workDate) return;
    setLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/timesheet-entries', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          workerId,
          workDate,
          sst,
          hoursNormal,
          hoursExtra,
          comment
        })
      });

      if (!res.ok) {
        const body = await res.json();
        throw new Error(body.error || 'Error guardando el parte');
      }

      onSaved();
      onClose();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  if (!open || !date) return null;

  return (
    <div className="modal-backdrop" role="dialog" aria-modal="true">
      <div className="modal">
        <div className="flex-between">
          <h3>Parte diario: {workDate}</h3>
          <button className="secondary" onClick={onClose}>Cerrar</button>
        </div>

        <div className="form-row">
          <div>
            <label>SST (ID o código)</label>
            <input
              value={sst}
              onChange={(e) => setSst(e.target.value)}
              placeholder="SST o código"
            />
          </div>
        </div>

        <div className="form-row">
          <div>
            <label>Horas normales</label>
            <input
              type="number"
              min={0}
              step="0.5"
              value={hoursNormal}
              onChange={(e) => setHoursNormal(Number(e.target.value))}
            />
          </div>
          <div>
            <label>Horas extra</label>
            <input
              type="number"
              min={0}
              step="0.5"
              value={hoursExtra}
              onChange={(e) => setHoursExtra(Number(e.target.value))}
            />
          </div>
        </div>

        <div className="form-row">
          <div>
            <label>Comentario</label>
            <textarea
              value={comment}
              rows={3}
              onChange={(e) => setComment(e.target.value)}
            />
          </div>
        </div>

        {error && <p style={{ color: 'red' }}>{error}</p>}

        <div className="flex" style={{ justifyContent: 'flex-end' }}>
          <button className="secondary" onClick={onClose} disabled={loading}>Cancelar</button>
          <button onClick={handleSubmit} disabled={loading}>
            {loading ? 'Guardando...' : 'Guardar'}
          </button>
        </div>
      </div>
    </div>
  );
}
