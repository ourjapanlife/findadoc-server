-- Languages a facility advertises without a named professional (#1015).
-- Existing professional spoken_languages rows are left as they are.
ALTER TABLE facilities
  ADD COLUMN supported_languages jsonb NOT NULL DEFAULT '[]'::jsonb;

ALTER TABLE facilities
  ADD CONSTRAINT facilities_supported_languages_array
  CHECK (jsonb_typeof(supported_languages) = 'array');

CREATE INDEX facilities_supported_languages_idx
  ON facilities USING gin (supported_languages);
