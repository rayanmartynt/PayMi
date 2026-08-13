-- Add deleted_by column to messages table for per-user message deletion
ALTER TABLE messages ADD COLUMN deleted_by text;

-- Add comment to explain the column
COMMENT ON COLUMN messages.deleted_by IS 'JSON array of customer IDs who deleted this message for themselves';
