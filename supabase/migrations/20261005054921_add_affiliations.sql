CREATE TABLE affiliations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name_en text NOT NULL UNIQUE,
  name_ja text,
  website text,
  logo_url text
);

CREATE TABLE affiliation_memberships (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  affiliation_id uuid NOT NULL REFERENCES affiliations (id) ON UPDATE CASCADE ON DELETE CASCADE,
  facilities_id uuid REFERENCES facilities (id) ON UPDATE CASCADE ON DELETE CASCADE,
  hps_id uuid REFERENCES hps (id) ON UPDATE CASCADE ON DELETE CASCADE,
  CONSTRAINT affiliation_memberships_one_member CHECK (
    (facilities_id IS NOT NULL AND hps_id IS NULL)
    OR (facilities_id IS NULL AND hps_id IS NOT NULL)
  )
);

CREATE UNIQUE INDEX affiliation_memberships_facility_idx
  ON affiliation_memberships (affiliation_id, facilities_id)
  WHERE facilities_id IS NOT NULL;

CREATE UNIQUE INDEX affiliation_memberships_hp_idx
  ON affiliation_memberships (affiliation_id, hps_id)
  WHERE hps_id IS NOT NULL;

INSERT INTO affiliations (name_en)
VALUES ('Intercultural Psychiatric Society of Japan');
