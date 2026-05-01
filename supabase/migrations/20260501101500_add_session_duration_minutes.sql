-- Adds duration_minutes to sessions so admins can set how long each Meet session runs.
-- Safe on projects where table/column may already exist.
DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.tables
    WHERE table_schema = 'public'
      AND table_name = 'sessions'
  ) THEN
    ALTER TABLE public.sessions
      ADD COLUMN IF NOT EXISTS duration_minutes integer NOT NULL DEFAULT 60;

    IF NOT EXISTS (
      SELECT 1
      FROM information_schema.table_constraints
      WHERE table_schema = 'public'
        AND table_name = 'sessions'
        AND constraint_name = 'sessions_duration_minutes_positive'
    ) THEN
      ALTER TABLE public.sessions
        ADD CONSTRAINT sessions_duration_minutes_positive
        CHECK (duration_minutes BETWEEN 5 AND 1440);
    END IF;
  END IF;
END
$$;
