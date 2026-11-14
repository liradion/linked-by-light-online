-- Run in a dedicated Supabase project belonging to this game, not in unrelated projects.
create table if not exists public.linked_light_cloud_saves (
  id text primary key check (id ~ '^[a-f0-9]{64}$'),
  revision bigint not null default 1 check (revision > 0),
  encrypted text not null check (length(encrypted) < 180000),
  updated_at timestamptz not null default now()
);
alter table public.linked_light_cloud_saves enable row level security;
revoke all on table public.linked_light_cloud_saves from anon, authenticated;
-- No public RLS policies: requests require server-only service role credentials.
-- Backend performs encryption before storing a recovery-key-protected profile.

-- Room state is encrypted on the Node server, recoverable only with its environment secret.
create table if not exists public.linked_light_room_state (
 id text primary key, encrypted text not null, updated_at timestamptz not null default now()
);
alter table public.linked_light_room_state enable row level security;
revoke all on table public.linked_light_room_state from anon, authenticated;

-- Explicit service grants if the project has disabled automatic public table exposure.
grant select, insert, update on public.linked_light_cloud_saves to service_role;
grant select, insert, update on public.linked_light_room_state to service_role;