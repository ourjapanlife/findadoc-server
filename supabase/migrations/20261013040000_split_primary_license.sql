-- One clinical license, stored apart from extra credentials (#1014).
-- Degrees are not rewritten here. The backfill queues dual licenses for a moderator.

ALTER TABLE public.hps
  ADD COLUMN primary_license text,
  ADD COLUMN additional_credentials jsonb NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN license_review text,
  ADD COLUMN license_recommendation text;

ALTER TABLE public.hps
  ADD CONSTRAINT hps_license_review_check
  CHECK (license_review IS NULL OR license_review IN ('NEEDS_REVIEW', 'CONFIRMED'));

CREATE INDEX hps_license_review_needs_review_idx
  ON public.hps (license_review)
  WHERE license_review = 'NEEDS_REVIEW';

COMMENT ON COLUMN public.hps.primary_license IS
  'One clinical license. Null while a dual license is unresolved or confirmed as dual.';

COMMENT ON COLUMN public.hps.license_recommendation IS
  'Suggestion only. A moderator decides whether to apply it.';
