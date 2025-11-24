-- Enable real-time updates for cleo_messages table
ALTER PUBLICATION supabase_realtime ADD TABLE cleo_messages;

-- Set replica identity to FULL for complete row data
ALTER TABLE cleo_messages REPLICA IDENTITY FULL;