-- March0603 schema
create table if not exists calculations (
  id text primary key,
  organisation_name text not null,
  reporting_period_start date not null,
  reporting_period_end date not null,
  calculated_at timestamptz not null default now(),
  factor_version text not null,
  total_t_co2e numeric(12,4) not null,
  scope_1_t_co2e numeric(12,4) not null,
  scope_2_t_co2e numeric(12,4) not null,
  scope_3_t_co2e numeric(12,4) not null,
  data_quality_score integer not null,
  uncertainty_pct integer,
  estimated_lines integer default 0,
  consolidation_approach text default 'operational_control',
  scope_2_method text default 'location_based',
  result_json jsonb
);

create table if not exists emission_lines (
  id uuid primary key default gen_random_uuid(),
  calculation_id text references calculations(id) on delete cascade,
  input_id text,
  source_type text,
  factor_id text,
  factor_version text,
  scope integer,
  category text,
  quantity numeric,
  unit text,
  kg_co2e numeric(12,6),
  t_co2e numeric(12,6),
  data_quality_tier integer,
  estimated boolean default false,
  site text,
  period_start date,
  period_end date,
  audit_json jsonb,
  created_at timestamptz default now()
);

create index if not exists calculations_calculated_at_idx on calculations(calculated_at desc);
create index if not exists emission_lines_calculation_id_idx on emission_lines(calculation_id);
