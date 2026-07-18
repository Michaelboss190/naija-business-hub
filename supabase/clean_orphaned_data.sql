-- Check for orphaned data first
SELECT 'notifications' as tbl, COUNT(*) FROM notifications WHERE user_id NOT IN (SELECT id FROM profiles)
UNION ALL SELECT 'messages', COUNT(*) FROM messages WHERE sender_id NOT IN (SELECT id FROM profiles) OR receiver_id NOT IN (SELECT id FROM profiles)
UNION ALL SELECT 'forum_posts', COUNT(*) FROM forum_posts WHERE author_id NOT IN (SELECT id FROM profiles)
UNION ALL SELECT 'forum_comments', COUNT(*) FROM forum_comments WHERE author_id NOT IN (SELECT id FROM profiles)
UNION ALL SELECT 'likes', COUNT(*) FROM likes WHERE user_id NOT IN (SELECT id FROM profiles)
UNION ALL SELECT 'bookmarks', COUNT(*) FROM bookmarks WHERE user_id NOT IN (SELECT id FROM profiles)
UNION ALL SELECT 'subscriptions', COUNT(*) FROM subscriptions WHERE user_id NOT IN (SELECT id FROM profiles);

-- Clean up orphaned data
DELETE FROM notifications WHERE user_id NOT IN (SELECT id FROM profiles);
DELETE FROM messages WHERE sender_id NOT IN (SELECT id FROM profiles) OR receiver_id NOT IN (SELECT id FROM profiles);
DELETE FROM conversations WHERE participant1_id NOT IN (SELECT id FROM profiles) OR participant2_id NOT IN (SELECT id FROM profiles);
DELETE FROM forum_comments WHERE author_id NOT IN (SELECT id FROM profiles);
DELETE FROM forum_posts WHERE author_id NOT IN (SELECT id FROM profiles);
DELETE FROM likes WHERE user_id NOT IN (SELECT id FROM profiles);
DELETE FROM bookmarks WHERE user_id NOT IN (SELECT id FROM profiles);
DELETE FROM event_registrations WHERE user_id NOT IN (SELECT id FROM profiles);
DELETE FROM reviews WHERE user_id NOT IN (SELECT id FROM profiles);
DELETE FROM vendors WHERE owner_id NOT IN (SELECT id FROM profiles);
DELETE FROM suppliers WHERE owner_id NOT IN (SELECT id FROM profiles);
DELETE FROM subscriptions WHERE user_id NOT IN (SELECT id FROM profiles);
DELETE FROM payments WHERE user_id NOT IN (SELECT id FROM profiles);
DELETE FROM course_enrollments WHERE user_id NOT IN (SELECT id FROM profiles);
DELETE FROM lesson_progress WHERE user_id NOT IN (SELECT id FROM profiles);
DELETE FROM expert_questions WHERE author_id NOT IN (SELECT id FROM profiles);
DELETE FROM expert_answers WHERE expert_id NOT IN (SELECT id FROM profiles);
DELETE FROM blog_posts WHERE author_id NOT IN (SELECT id FROM profiles);
DELETE FROM resources WHERE author_id NOT IN (SELECT id FROM profiles);
DELETE FROM events WHERE organizer_id NOT IN (SELECT id FROM profiles);
DELETE FROM masterclasses WHERE instructor_id NOT IN (SELECT id FROM profiles);