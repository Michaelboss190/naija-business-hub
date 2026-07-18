-- Find auth users without profiles (these can still login!)
SELECT au.id, au.email, au.created_at
FROM auth.users au 
LEFT JOIN public.profiles p ON au.id = p.id 
WHERE p.id IS NULL;