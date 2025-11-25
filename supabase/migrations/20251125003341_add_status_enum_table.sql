ALTER TABLE facilities 
  ALTER COLUMN "nameEn" SET NOT NULL,
  ALTER COLUMN "nameJa" SET NOT NULL,
  ALTER COLUMN "createdDate" SET NOT NULL,
  ALTER COLUMN "updatedDate" SET NOT NULL;

ALTER TABLE hps 
  ALTER COLUMN "createdDate" SET NOT NULL,
  ALTER COLUMN "updatedDate" SET NOT NULL;

ALTER TABLE submissions 
  ALTER COLUMN "createdDate" SET NOT NULL,
  ALTER COLUMN "updatedDate" SET NOT NULL;

UPDATE submissions 
SET status = 'pending' 
WHERE status IS NULL OR status = '';

UPDATE submissions 
SET status = LOWER(TRIM(status));

CREATE TYPE submission_status_enum AS ENUM (
    'pending',
    'under_review',
    'approved',
    'rejected'
);

ALTER TABLE submissions 
  ALTER COLUMN status TYPE submission_status_enum 
  USING status::submission_status_enum;

ALTER TABLE submissions 
  ALTER COLUMN status SET DEFAULT 'pending'::submission_status_enum;

ALTER TABLE submissions 
  ALTER COLUMN status SET NOT NULL;