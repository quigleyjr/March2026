-- Migration 002: share tokens + white-label fields
alter table calculations add column if not exists share_token text unique;
alter table calculations add column if not exists share_enabled boolean default false;

-- White-label branding stored per calculation (set at time of generation)
alter table calculations add column if not exists brand_name text;
alter table calculations add column if not exists brand_colour text;
alter table calculations add column if not exists brand_footer text;

create index if not exists calculations_share_token_idx on calculations(share_token) where share_token is not null;
