-- Enums
create type user_role as enum ('ADMIN', 'SUPERVISOR', 'CAPATAZ', 'CONTABILIDAD');
create type timesheet_status as enum ('PENDING', 'APPROVED', 'OBSERVED');

-- Tablas base
create table companies (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  created_at timestamptz default now()
);

create table users (
  id uuid primary key default gen_random_uuid(),
  company_id uuid references companies(id) on delete cascade,
  email text unique not null,
  full_name text not null,
  role user_role not null,
  created_at timestamptz default now()
);

create table crs (
  id uuid primary key default gen_random_uuid(),
  company_id uuid references companies(id) on delete cascade,
  code text not null,
  name text not null,
  is_active boolean default true,
  created_at timestamptz default now(),
  unique (company_id, code)
);

create table ssts (
  id uuid primary key default gen_random_uuid(),
  company_id uuid references companies(id) on delete cascade,
  cr_id uuid references crs(id) on delete restrict,
  code text not null,
  name text not null,
  is_active boolean default true,
  created_at timestamptz default now(),
  unique (company_id, code)
);

create table workers (
  id uuid primary key default gen_random_uuid(),
  company_id uuid references companies(id) on delete cascade,
  full_name text not null,
  trade text,
  dni text not null unique,
  cr_id uuid references crs(id) on delete set null,
  is_active boolean default true,
  created_at timestamptz default now()
);

create table daily_timesheets (
  id uuid primary key default gen_random_uuid(),
  company_id uuid references companies(id) on delete cascade,
  foreman_id uuid references users(id) on delete set null,
  sst_id uuid references ssts(id) on delete set null,
  work_date date not null,
  status timesheet_status default 'PENDING',
  supervisor_id uuid references users(id) on delete set null,
  observation text,
  created_at timestamptz default now()
);

create table timesheet_entries (
  id uuid primary key default gen_random_uuid(),
  worker_id uuid references workers(id) on delete cascade,
  work_date date not null,
  sst_id uuid references ssts(id) on delete set null,
  sst_code text,
  cr_id uuid references crs(id) on delete set null,
  hours_normal numeric(5,2) default 0,
  hours_extra numeric(5,2) default 0,
  comment text,
  created_at timestamptz default now(),
  unique (worker_id, work_date)
);

-- Trigger para asegurar que cr_id se derive del worker
create or replace function sync_timesheet_cr()
returns trigger as $$
begin
  if new.cr_id is null then
    select cr_id into new.cr_id from workers where id = new.worker_id;
  end if;
  return new;
end;
$$ language plpgsql;

create trigger trg_sync_timesheet_cr
before insert or update on timesheet_entries
for each row execute function sync_timesheet_cr();

-- Índices para acelerar filtros por fecha, CR, SST y trabajador
create index if not exists idx_timesheet_entries_work_date on timesheet_entries(work_date);
create index if not exists idx_timesheet_entries_cr on timesheet_entries(cr_id);
create index if not exists idx_timesheet_entries_sst on timesheet_entries(sst_id);
create index if not exists idx_timesheet_entries_worker on timesheet_entries(worker_id);
