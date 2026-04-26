-- Change deadline column from date to timestamptz so time-of-day can be stored.
-- Existing date-only values are cast to midnight UTC on the same date.
ALTER TABLE jobs ALTER COLUMN deadline TYPE timestamptz USING deadline::timestamptz;
