-- Run if you created `reports` before `mode` existed:
ALTER TABLE reports ADD COLUMN mode VARCHAR(20) NOT NULL DEFAULT 'standard' AFTER website;
