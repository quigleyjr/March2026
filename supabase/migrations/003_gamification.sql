-- Migration 003: Gamification tables

-- Track per-user unlocked achievements and XP
create table if not exists user_achievements (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid,                              -- null = anonymous/single-tenant mode
  achievement_id text not null,
  unlocked_at timestamptz not null default now(),
  xp_awarded  integer not null default 0,
  unique(user_id, achievement_id)
);

-- Cache computed level/XP per user (updated after each calculation)
create table if not exists user_game_state (
  user_id     uuid primary key,
  xp          integer not null default 0,
  level       integer not null default 1,
  streak_days integer not null default 0,
  last_calc_at timestamptz,
  updated_at  timestamptz not null default now()
);

-- Track bulk import counts for bulk_import achievement
alter table calculations add column if not exists imported_via_bulk boolean default false;

create index if not exists user_achievements_user_idx on user_achievements(user_id);
