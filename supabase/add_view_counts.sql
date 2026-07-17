-- Run this in Supabase SQL Editor
ALTER TABLE vendors ADD COLUMN IF NOT EXISTS view_count INTEGER DEFAULT 0;
ALTER TABLE resources ADD COLUMN IF NOT EXISTS view_count INTEGER DEFAULT 0;
ALTER TABLE blog_posts ADD COLUMN IF NOT EXISTS view_count INTEGER DEFAULT 0;
ALTER TABLE events ADD COLUMN IF NOT EXISTS view_count INTEGER DEFAULT 0;
ALTER TABLE masterclasses ADD COLUMN IF NOT EXISTS view_count INTEGER DEFAULT 0;

-- Enable realtime for messages and notifications
ALTER PUBLICATION supabase_realtime ADD TABLE messages;
ALTER PUBLICATION supabase_realtime ADD TABLE notifications;
ALTER PUBLICATION supabase_realtime ADD TABLE forum_comments;
ALTER PUBLICATION supabase_realtime ADD TABLE forum_posts;