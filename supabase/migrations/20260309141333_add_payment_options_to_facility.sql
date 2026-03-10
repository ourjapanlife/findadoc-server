ALTER TABLE facilities 
ADD COLUMN payment_options JSONB DEFAULT '[]'::jsonb;
