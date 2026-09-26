export const schemaSql = `
create table if not exists schema_migrations (
  id text primary key,
  applied_at timestamptz not null default now()
);

create table if not exists desks (
  id text primary key,
  name text not null,
  eth_usd numeric not null,
  eur_usd numeric not null,
  updated_at timestamptz not null default now()
);

create table if not exists tokens (
  id text primary key,
  name text not null,
  ticker text not null default '',
  chain text not null default '',
  contract text not null default '',
  supply text not null default '',
  status text not null,
  launch text not null default '',
  launchpad_id text not null default '',
  target_date text not null default '',
  client text not null default '',
  budget_usd numeric not null default 0,
  sample boolean not null default false,
  body jsonb not null,
  updated_at timestamptz not null default now()
);

create table if not exists records (
  kind text not null,
  id text not null,
  body jsonb not null,
  updated_at timestamptz not null default now(),
  primary key (kind, id)
);

create table if not exists index_cursors (
  token_id text primary key references tokens (id) on delete cascade,
  source text not null,
  block_number bigint,
  state_hash text not null,
  cursor_at timestamptz not null default now()
);

create table if not exists index_events (
  id bigserial primary key,
  token_id text not null references tokens (id) on delete cascade,
  source text not null,
  kind text not null,
  block_number bigint,
  payload jsonb not null,
  created_at timestamptz not null default now()
);

create index if not exists index_events_token_created on index_events (token_id, created_at desc);
`;
