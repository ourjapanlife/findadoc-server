-- When a city place id was last confirmed. A null timestamp means the id still needs a refresh.
ALTER TABLE cities
  ADD COLUMN google_place_id_checked_at timestamptz;
