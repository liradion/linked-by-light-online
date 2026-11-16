-- v27 / 2026-11-16: additive migration. Existing v26 room row id='server',
-- cloud profile table, protocol and content are unchanged.
-- Apply manually to the dedicated game Supabase project, then set
-- LL_V27_ARCHIVE=1 on the server. Do not expose secrets in client code.
BEGIN;
CREATE TABLE IF NOT EXISTS public.linked_light_room_snapshots (
 checkpoint_id uuid PRIMARY KEY,
 schema_version integer NOT NULL CHECK (schema_version = 27),
 checksum text NOT NULL CHECK (checksum ~ '^[a-f0-9]{64}$'),
 encrypted text NOT NULL CHECK (length(encrypted) BETWEEN 30 AND 4000000),
 created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS linked_light_room_snapshots_created_at_idx
 ON public.linked_light_room_snapshots(created_at DESC);
ALTER TABLE public.linked_light_room_snapshots ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.linked_light_room_snapshots FROM PUBLIC, anon, authenticated;
GRANT SELECT, INSERT, DELETE ON public.linked_light_room_snapshots TO service_role;

-- Keep the newest 24 encrypted full-state checkpoints, pruning older rows.
-- This trigger runs on the database side and is idempotent to deploy.
CREATE OR REPLACE FUNCTION public.linked_light_prune_room_snapshots()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
 DELETE FROM public.linked_light_room_snapshots
 WHERE checkpoint_id IN (
  SELECT checkpoint_id FROM public.linked_light_room_snapshots
  ORDER BY created_at DESC, checkpoint_id DESC
  OFFSET 24
 );
 RETURN NEW;
END;
$$;
REVOKE ALL ON FUNCTION public.linked_light_prune_room_snapshots() FROM PUBLIC, anon, authenticated;
DROP TRIGGER IF EXISTS linked_light_prune_room_snapshots_after_insert ON public.linked_light_room_snapshots;
CREATE TRIGGER linked_light_prune_room_snapshots_after_insert
AFTER INSERT ON public.linked_light_room_snapshots
FOR EACH STATEMENT EXECUTE FUNCTION public.linked_light_prune_room_snapshots();
COMMIT;
