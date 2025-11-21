-- Migration: Add gdrive_allowed to users
-- Description: Tracks whether user has granted Google Drive permissions

ALTER TABLE users ADD COLUMN gdrive_allowed BOOLEAN NOT NULL DEFAULT FALSE;
