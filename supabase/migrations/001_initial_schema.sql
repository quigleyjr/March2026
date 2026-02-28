-- February2026 Database Schema
-- Paste this into Supabase SQL Editor and click Run

create table if not exists organisations (
  id         uuid primary key default gen_random_uuid(),
  name       text not null,
  sector     text,
  created_at timestamptz default now()
);

create table if not exists calculations (
  id                     text primary key,
  organisation_id        uuid references organisations(id),
  organisation_name      text not null,
  reporting_period_start date not null,
  reporting_period_end   date not null,
  calculated_at          timestamptz not null,
  factor_version         text not null,
  total_t_co2e           numeric(12,4),
  scope_1_t_co2e         numeric(12,4),
  scope_2_t_co2e         numeric(12,4),
  scope_3_t_co2e         numeric(12,4),
  data_quality_score     integer,
  uncertainty_pct        integer,
  estimated_lines        integer default 0,
  consolidation_approach text default 'operational_control',
  scope_2_method         text default 'location_based',
  result_json            jsonb not null,
  created_at             timestamptz default now()
);

create table if not exists emission_lines (
  id             uuid primary key default gen_random_uuid(),
  calculation_id text references calculations(id) on delete cascade,
  input_id       text not null,
  source_type    text not null,
  factor_id      text not null,
  factor_version text not null,
  scope          integer not null check (scope in (1,2,3)),
  category       text not null,
  quantity       numeric(18,4) not null,
  unit           text not null,
  kg_co2e        numeric(12,6) not null,
  t_co2e         numeric(12,6) not null,
  data_quality_tier integer not null,
  estimated      boolean default false,
  site           text,
  period_start   date,
  period_end     date,
  audit_json     jsonb not null,
  created_at     timestamptz default now()
);

create table if not exists factor_versions (
  version        text primary key,
  publisher      text not null default 'DESNZ',
  effective_from date not null,
  deployed_at    timestamptz default now(),
  notes          text
);

insert into factor_versions (version, effective_from, notes)
values ('2024.1.0', '2024-01-01', 'Initial DESNZ 2024 factors')
on conflict (version) do nothing;

create index if not exists idx_calculations_period on calculations(reporting_period_start, reporting_period_end);
create index if not exists idx_emission_lines_calc on emission_lines(calculation_id);

alter table organisations enable row level security;
alter table calculations enable row level security;
alter table emission_lines enable row level security;

create policy "allow_all_organisations" on organisations for all using (true);
create policy "allow_all_calculations" on calculations for all using (true);
create policy "allow_all_emission_lines" on emission_lines for all using (true);
