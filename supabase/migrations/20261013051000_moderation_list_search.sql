-- Text used by the moderation list search (#1046).
-- A generated column keeps the match next to the row, so pagination happens after the query.
-- The function is plpgsql so Postgres accepts it as immutable for a generated column.

CREATE FUNCTION public.hp_search_text(hp_id uuid, names jsonb)
RETURNS text
LANGUAGE plpgsql
IMMUTABLE
PARALLEL SAFE
AS $$
DECLARE
  result text := hp_id::text;
  elem jsonb;
BEGIN
  IF jsonb_typeof(names) = 'array' THEN
    FOR elem IN SELECT value FROM jsonb_array_elements(names)
    LOOP
      result := result || ' ' || coalesce(concat_ws(' ',
        nullif(elem->>'firstName', ''),
        nullif(elem->>'middleName', ''),
        nullif(elem->>'lastName', '')
      ), '');
    END LOOP;
  END IF;
  RETURN result;
END;
$$;

ALTER TABLE public.facilities
  ADD COLUMN search_text text
  GENERATED ALWAYS AS (id::text || ' ' || name_en || ' ' || name_ja) STORED;

ALTER TABLE public.hps
  ADD COLUMN search_text text
  GENERATED ALWAYS AS (public.hp_search_text(id, names)) STORED;
